import { useMutation, useQuery } from '@tanstack/react-query'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { env } from '@/config/env'
import {
  getVoteDetailInfo,
  getVoteDetailStatus,
  getVoteForm,
  getVoteHasVoterPending,
  getVoteList,
  patchVoteCertNamePhone,
  patchVoteCertPass,
  postVoteForm,
} from '@/features/vote/api/vote'
import { getVoteDetailPath, useIsVoteUser } from '@/features/vote/lib/voteRoute'
import type { VoteListItemData } from '@/features/vote/types/vote'
import { ROUTE_PATH, voteFormPath } from '@/shared/constants/routes'
import { useInfiniteList } from '@/shared/hooks/useInfiniteList'
import type { ApiError } from '@/shared/lib/apiErrors'
import { showErrorModal } from '@/shared/lib/errorModal'
import { useAuthStore } from '@/shared/stores/authStore'
import { useVoteCertStore } from '@/shared/stores/voteCertStore'

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

/**
 * 본인인증 성공 후 갈 곳과 실패 후 돌아갈 곳을 함께 만든다 (VT5·VT6 공용).
 *
 * **레거시는 두 훅에 같은 코드를 복사해 뒀다.** 성공하면 참여 폼으로 `state: { auth: true }`를
 * 실어 보내고(폼이 그 값 없이는 "잘못된 접근입니다"를 띄운다), 실패하면 상세로 되돌린다.
 *
 * ⚠️ **voterUuid를 라우트가 아니라 저장된 인증 정보에서 읽는다.** KMC 외부 사이트를
 * 다녀오면 URL이 우리 것이 아니게 되므로 localStorage가 유일한 복원 수단이다.
 */
export const useVoteCertNavigation = () => {
  const navigate = useNavigate()
  const isUser = useIsVoteUser()
  const voteCertInfo = useVoteCertStore((state) => {
    return state.voteCertInfo
  })

  return {
    voterUuid: voteCertInfo.voterUuid ?? '',
    goToForm: () => {
      void navigate(voteFormPath({ voterUuid: voteCertInfo.voterUuid ?? '' }), {
        state: { auth: true },
      })
    },
    goToDetail: () => {
      void navigate(
        getVoteDetailPath({
          voteUuid: voteCertInfo.voteUuid,
          voterUuid: voteCertInfo.voterUuid,
          isUser,
        }),
      )
    },
  }
}

/** PASS 본인인증 (VT5). 실패하면 **서버 원문**을 띄우고 상세로 되돌린다 */
export const usePatchVoteCertPass = () => {
  const { voterUuid, goToForm, goToDetail } = useVoteCertNavigation()

  const { mutate: patchVoteCertPassMutation, isPending: isPatchVoteCertPassPending } = useMutation({
    mutationFn: ({ apiToken, certNum }: { apiToken: string; certNum: string }) => {
      return patchVoteCertPass({ voterUuid, apiToken, certNum })
    },
    onSuccess: goToForm,
    onError: (error: ApiError) => {
      showErrorModal({ text: error.message, callback: goToDetail })
    },
  })

  return { patchVoteCertPassMutation, isPatchVoteCertPassPending }
}

/**
 * 이름·휴대폰 본인인증 (VT6).
 *
 * ⚠️ **`VOTER_MISS_MATCH`만 화면에 남는다** — 이름이나 번호를 잘못 넣은 경우라 다시
 * 입력할 수 있어야 한다. 나머지 에러는 상세로 되돌린다.
 * 코드의 `MISS_MATCH`는 오타지만 **서버 계약이라 그대로 쓴다** (`domain-codes.md`).
 */
export const usePatchVoteCertNamePhone = () => {
  const { voterUuid, goToForm, goToDetail } = useVoteCertNavigation()

  const { mutate: patchVoteCertNamePhoneMutation, isPending: isPatchVoteCertNamePhonePending } =
    useMutation({
      mutationFn: ({ name, phone }: { name: string; phone: string }) => {
        return patchVoteCertNamePhone({ voterUuid, name, phone })
      },
      onSuccess: goToForm,
      onError: (error: ApiError) => {
        if (error.code === 'VOTER_MISS_MATCH') {
          showErrorModal({ text: error.message })
          return
        }

        showErrorModal({ text: error.message, callback: goToDetail })
      },
    })

  return { patchVoteCertNamePhoneMutation, isPatchVoteCertNamePhonePending }
}

/**
 * 참여 폼 조회 (VT3).
 *
 * ⚠️ **에러가 나면 모달을 띄우고 상세로 되돌린다.** 여기서도 목적지를 저장된 인증
 * 정보에서 만든다 — 폼 화면의 라우트에는 `voteUuid`가 없기 때문이다.
 */
export const useVoteForm = ({ voterUuid }: { voterUuid: string }) => {
  const { goToDetail } = useVoteCertNavigation()

  const {
    data: voteFormData,
    isLoading: isVoteFormLoading,
    isError: isVoteFormError,
    error: voteFormError,
  } = useQuery({
    queryKey: ['voteDetailForm', voterUuid],
    queryFn: () => {
      return getVoteForm({ voterUuid })
    },
    enabled: Boolean(voterUuid),
  })

  const hasHandledErrorRef = useRef(false)

  useEffect(() => {
    if (!isVoteFormError || hasHandledErrorRef.current) return
    hasHandledErrorRef.current = true

    showErrorModal({ text: voteFormError?.message, callback: goToDetail })
  }, [isVoteFormError, voteFormError, goToDetail])

  return { voteFormData, isVoteFormLoading }
}

/**
 * 투표 제출 (VT3).
 *
 * ✅ **제출 중 잠금을 살렸다.** 레거시는 `isPostVoteFormPending`을 반환하면서
 * `isCreateVoteFormPending`이라는 **없는 이름으로 받아** `undefined`가 컨텍스트를 타고
 * 퍼졌다 — 버튼이 안 잠기고 스피너도 안 뜨며 **연타로 중복 제출이 가능**했다
 * (`vote.md` §3). 사용자 결정(VT-Q2)에 따라 고쳤다.
 *
 * ⚠️ **완료 화면으로 `replace` 이동한다.** 뒤로가기로 제출한 폼에 돌아가지 못하게 한다.
 */
export const usePostVoteForm = ({ voterUuid }: { voterUuid: string }) => {
  const navigate = useNavigate()

  const { mutate: postVoteFormMutation, isPending: isPostVoteFormPending } = useMutation({
    mutationFn: ({
      questionList,
      signFile,
    }: {
      questionList: { questionUuid: string; questionType: string; optionList: string[] }[]
      signFile: File
    }) => {
      return postVoteForm({ voterUuid, questionList, signFile })
    },
    onSuccess: () => {
      void navigate(ROUTE_PATH.VOTE_COMPLETED, { replace: true, state: { auth: true } })
    },
    onError: (error: ApiError) => {
      showErrorModal({ text: error.message })
    },
  })

  return { postVoteFormMutation, isPostVoteFormPending }
}

/**
 * 미완료 투표가 있는지 (VT10). 메인 화면의 팝업이 쓴다.
 *
 * 🔴 **쿼리 키에 입주민 식별자가 없다** — 단지를 바꿔도 같은 캐시를 본다.
 * `staleTime: 0`이 가려주고 있다. 레거시 그대로 옮겼다 (`vote.md` §VT10).
 *
 * ⚠️ 레거시는 `enabled: hasVote.value`로 **`.value`를 벗겨** setup 시점 값을 고정했다.
 * 입주민 정보가 아직 없으면 쿼리가 영영 돌지 않는다(VT-Q9). 여기서는 값이 도착하면
 * 켜진다 — **팝업이 뜰 조건이 넓어지는 쪽**이라, 레거시가 캐시 히트일 때와 결과가 같다.
 */
export const useVoteHasVoterPending = ({ enabled }: { enabled: boolean }) => {
  const aptResidentUuid = useAuthStore((state) => {
    return state.aptInfo.aptResidentUuid
  })

  const { data: voteHasVoterPending } = useQuery({
    queryKey: ['voteHasVoterPending'],
    queryFn: () => {
      return getVoteHasVoterPending({ aptResidentUuid: aptResidentUuid ?? '' })
    },
    enabled: enabled && Boolean(aptResidentUuid),
  })

  return { voteHasVoterPending }
}
