import { useQuery } from '@tanstack/react-query'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { env } from '@/config/env'
import { getVoteDetailInfo, getVoteDetailStatus, getVoteList } from '@/features/vote/api/vote'
import type { VoteListItemData } from '@/features/vote/types/vote'
import { ROUTE_PATH } from '@/shared/constants/routes'
import { useInfiniteList } from '@/shared/hooks/useInfiniteList'
import type { ApiError } from '@/shared/lib/apiErrors'
import { showErrorModal } from '@/shared/lib/errorModal'
import { useAuthStore } from '@/shared/stores/authStore'

/**
 * 전자투표 쿼리. 레거시 `lib/queries/vote/*` 이식.
 *
 * ⚠️ **세 훅의 에러 처리가 전부 다르다.** 목록은 모달 후 `/main`, 상세 정보는 코드별 분기,
 * 현황은 모달만 띄우고 화면에 남는다. 레거시 그대로다.
 *
 * ⚠️ **에러 문구가 전부 서버 원문**이다 — 이 도메인에는 에러코드 → 문구 표가 없다.
 */

/** 목록 (VT1). `voteStatus`가 바뀌면 캐시 키가 갈려 다시 조회된다 */
export const useVoteList = () => {
  const navigate = useNavigate()
  const [voteStatus, setVoteStatus] = useState<string | undefined>(undefined)

  const {
    list,
    isListLoading,
    hasListNextPage,
    fetchListNextPage,
    isListError,
    error: voteListError,
  } = useInfiniteList<VoteListItemData>({
    queryKey: 'voteList',
    defaultStoreKey: ['aptResidentUuid'],
    fetchFunction: getVoteList,
    additionalParams: { voteStatus },
  })

  // 레거시 `watch(error)`. 모달이 겹치지 않게 한 번만 띄운다
  const hasHandledErrorRef = useRef(false)

  useEffect(() => {
    if (!isListError || hasHandledErrorRef.current) return
    hasHandledErrorRef.current = true

    showErrorModal({
      text: voteListError?.message,
      callback: () => {
        void navigate(ROUTE_PATH.MAIN)
      },
    })
  }, [isListError, voteListError, navigate])

  return {
    voteList: list?.pages ?? [],
    isVoteListLoading: isListLoading,
    hasVoteListNextPage: hasListNextPage,
    fetchVoteListNextPage: fetchListNextPage,
    /** 필터 탭이 부른다. `undefined`면 전체다 */
    setVoteStatus: useCallback((next: string | undefined) => {
      setVoteStatus(next)
    }, []),
  }
}

/**
 * 상세 정보 (VT2·VT7). **비인증 API**라 비회원도 같은 값을 받는다.
 *
 * ⚠️ **`VOTER_NOT_FOUND`만 다르게 처리한다** — 메인 앱이면 먼저 목록으로 보내고,
 * 그 위에 모달을 띄운 뒤 확인하면 `/error`로 다시 보낸다. **두 번 이동한다.**
 * 레거시 그대로다.
 */
export const useVoteDetailInfo = ({ voterUuid }: { voterUuid: string }) => {
  const navigate = useNavigate()

  const {
    data: voteDetailInfo,
    isLoading: isVoteDetailInfoLoading,
    isError: isVoteDetailInfoError,
    error: voteDetailInfoError,
  } = useQuery({
    queryKey: ['voteDetailInfo', voterUuid],
    queryFn: () => {
      return getVoteDetailInfo({ voterUuid })
    },
    enabled: Boolean(voterUuid),
  })

  const hasHandledErrorRef = useRef(false)

  useEffect(() => {
    if (!isVoteDetailInfoError || hasHandledErrorRef.current) return
    hasHandledErrorRef.current = true

    const error = voteDetailInfoError as ApiError

    if (error.code !== 'VOTER_NOT_FOUND') {
      showErrorModal({ text: error.message })
      return
    }

    if (!env.IS_OPINION) void navigate(ROUTE_PATH.VOTE_LIST)

    showErrorModal({
      text: error.message,
      callback: () => {
        void navigate(ROUTE_PATH.ERROR, { state: { message: error.message } })
      },
    })
  }, [isVoteDetailInfoError, voteDetailInfoError, navigate])

  return { voteDetailInfo, isVoteDetailInfoLoading }
}

/**
 * 상세 현황 (VT2 `투표 현황` 탭). **회원 전용**이라 `aptResidentUuid`가 필요하다.
 *
 * ⚠️ **에러가 나도 화면에 머문다.** 모달만 뜨고 이동하지 않는다.
 */
export const useVoteDetailStatus = () => {
  const { voteUuid = '' } = useParams()
  const aptResidentUuid = useAuthStore((state) => {
    return state.aptInfo.aptResidentUuid
  })

  const {
    data: voteDetailStatus,
    isLoading: isVoteDetailStatusLoading,
    isError: isVoteDetailStatusError,
    error: voteDetailStatusError,
  } = useQuery({
    queryKey: ['voteDetailStatus', voteUuid],
    queryFn: () => {
      return getVoteDetailStatus({ aptResidentUuid: aptResidentUuid ?? '', voteUuid })
    },
    enabled: Boolean(voteUuid),
  })

  const hasHandledErrorRef = useRef(false)

  useEffect(() => {
    if (!isVoteDetailStatusError || hasHandledErrorRef.current) return
    hasHandledErrorRef.current = true

    showErrorModal({ text: voteDetailStatusError?.message })
  }, [isVoteDetailStatusError, voteDetailStatusError])

  return { voteDetailStatus, isVoteDetailStatusLoading }
}
