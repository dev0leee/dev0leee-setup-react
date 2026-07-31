import { useQuery } from '@tanstack/react-query'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { env } from '@/config/env'
import { getSurveyDetail, getSurveyList } from '@/features/survey/api/survey'
import type { SurveyListItemData } from '@/features/survey/types/survey'
import { ROUTE_PATH } from '@/shared/constants/routes'
import { useInfiniteList } from '@/shared/hooks/useInfiniteList'
import type { ApiError } from '@/shared/lib/apiErrors'
import { showErrorModal } from '@/shared/lib/errorModal'

/**
 * 설문조사 쿼리. 레거시 `lib/queries/survey/*` 이식.
 *
 * ⚠️ **에러 문구가 전부 서버 원문**이다 — 이 도메인에도 에러코드 → 문구 표가 없다.
 */

/** 목록 (SV1). 필터 파라미터 이름이 **`state`**다 (투표는 `voteStatus`) */
export const useSurveyList = () => {
  const navigate = useNavigate()
  const [state, setState] = useState<string | undefined>(undefined)

  const {
    list,
    isListLoading,
    hasListNextPage,
    fetchListNextPage,
    isListError,
    error: surveyListError,
  } = useInfiniteList<SurveyListItemData>({
    queryKey: 'surveyList',
    defaultStoreKey: ['aptResidentUuid'],
    fetchFunction: getSurveyList,
    additionalParams: { state },
  })

  const hasHandledErrorRef = useRef(false)

  useEffect(() => {
    if (!isListError || hasHandledErrorRef.current) return
    hasHandledErrorRef.current = true

    showErrorModal({
      text: surveyListError?.message,
      callback: () => {
        void navigate(ROUTE_PATH.MAIN)
      },
    })
  }, [isListError, surveyListError, navigate])

  return {
    surveyList: list?.pages ?? [],
    isSurveyListLoading: isListLoading,
    hasSurveyListNextPage: hasListNextPage,
    fetchSurveyListNextPage: fetchListNextPage,
    setSurveyState: useCallback((next: string | undefined) => {
      setState(next)
    }, []),
  }
}

/**
 * 상세 (SV2·SV9).
 *
 * ⚠️ **`SURVEY_RESPONDENT_NOT_FOUND`만 다르게 처리한다** — 메인 앱이면 먼저 목록으로
 * 보내고, 그 위에 모달을 띄운 뒤 확인하면 `/error`로 다시 보낸다. **두 번 이동한다.**
 * 투표의 `VOTER_NOT_FOUND`와 같은 모양이다.
 */
export const useSurveyDetailInfo = ({ participantUuid }: { participantUuid: string }) => {
  const navigate = useNavigate()

  const {
    data: surveyDetailInfo,
    isLoading: isSurveyDetailInfoLoading,
    isError: isSurveyDetailInfoError,
    error: surveyDetailInfoError,
  } = useQuery({
    queryKey: ['surveyDetailInfo', participantUuid],
    queryFn: () => {
      return getSurveyDetail({ participantUuid })
    },
    enabled: Boolean(participantUuid),
  })

  const hasHandledErrorRef = useRef(false)

  useEffect(() => {
    if (!isSurveyDetailInfoError || hasHandledErrorRef.current) return
    hasHandledErrorRef.current = true

    const error = surveyDetailInfoError as ApiError

    if (error.code !== 'SURVEY_RESPONDENT_NOT_FOUND') {
      showErrorModal({ text: error.message })
      return
    }

    if (!env.IS_OPINION) void navigate(ROUTE_PATH.SURVEY_LIST)

    showErrorModal({
      text: error.message,
      callback: () => {
        void navigate(ROUTE_PATH.ERROR, { state: { message: error.message } })
      },
    })
  }, [isSurveyDetailInfoError, surveyDetailInfoError, navigate])

  return { surveyDetailInfo, isSurveyDetailInfoLoading }
}
