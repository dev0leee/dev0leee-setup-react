import { useMutation, useQuery } from '@tanstack/react-query'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { env } from '@/config/env'
import {
  getSurveyDetail,
  getSurveyForm,
  getSurveyList,
  patchSurveyCertNamePhone,
  patchSurveyCertPass,
  postSurveyForm,
} from '@/features/survey/api/survey'
import { getSurveyDetailPath, useIsSurveyUser } from '@/features/survey/lib/surveyRoute'
import type { SurveyListItemData } from '@/features/survey/types/survey'
import { ROUTE_PATH, surveyFormPath } from '@/shared/constants/routes'
import { useInfiniteList } from '@/shared/hooks/useInfiniteList'
import type { ApiError } from '@/shared/lib/apiErrors'
import { showErrorModal } from '@/shared/lib/errorModal'
import { useSurveyCertStore } from '@/shared/stores/surveyCertStore'

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

/**
 * 인증 성공 후 갈 곳과 실패 후 돌아갈 곳 (SV3·SV5·SV6 공용).
 * 투표의 `useVoteCertNavigation`과 같은 역할이다 — 레거시도 같은 코드를 훅마다 복사해 뒀다.
 */
export const useSurveyCertNavigation = () => {
  const navigate = useNavigate()
  const isUser = useIsSurveyUser()
  const surveyCertInfo = useSurveyCertStore((state) => {
    return state.surveyCertInfo
  })

  return {
    participantUuid: surveyCertInfo.participantUuid ?? '',
    goToForm: () => {
      void navigate(surveyFormPath({ participantUuid: surveyCertInfo.participantUuid ?? '' }), {
        state: { auth: true },
      })
    },
    goToDetail: () => {
      void navigate(
        getSurveyDetailPath({
          surveyUuid: surveyCertInfo.surveyUuid,
          participantUuid: surveyCertInfo.participantUuid,
          isUser,
        }),
      )
    },
  }
}

/** PASS 본인인증 (SV5) */
export const usePatchSurveyCertPass = () => {
  const { participantUuid, goToForm, goToDetail } = useSurveyCertNavigation()

  const { mutate: patchSurveyCertPassMutation, isPending: isPatchSurveyCertPassPending } =
    useMutation({
      mutationFn: ({ apiToken, certNum }: { apiToken: string; certNum: string }) => {
        return patchSurveyCertPass({ participantUuid, apiToken, certNum })
      },
      onSuccess: goToForm,
      onError: (error: ApiError) => {
        showErrorModal({ text: error.message, callback: goToDetail })
      },
    })

  return { patchSurveyCertPassMutation, isPatchSurveyCertPassPending }
}

/**
 * 이름·휴대폰 본인인증 (SV6).
 *
 * ⚠️ **`SURVEY_RESPONDENT_MISS_MATCH`만 화면에 남는다** — 투표의 `VOTER_MISS_MATCH`와
 * 같은 자리다. 코드의 `MISS_MATCH`는 오타지만 **서버 계약이라 그대로 쓴다**.
 */
export const usePatchSurveyCertNamePhone = () => {
  const { participantUuid, goToForm, goToDetail } = useSurveyCertNavigation()

  const { mutate: patchSurveyCertNamePhoneMutation, isPending: isPatchSurveyCertNamePhonePending } =
    useMutation({
      mutationFn: ({ name, phone }: { name: string; phone: string }) => {
        return patchSurveyCertNamePhone({ participantUuid, name, phone })
      },
      onSuccess: goToForm,
      onError: (error: ApiError) => {
        if (error.code === 'SURVEY_RESPONDENT_MISS_MATCH') {
          showErrorModal({ text: error.message })
          return
        }

        showErrorModal({ text: error.message, callback: goToDetail })
      },
    })

  return { patchSurveyCertNamePhoneMutation, isPatchSurveyCertNamePhonePending }
}

/** 참여 폼 조회 (SV3). 실패하면 모달을 띄우고 상세로 되돌린다 */
export const useSurveyForm = ({ participantUuid }: { participantUuid: string }) => {
  const { goToDetail } = useSurveyCertNavigation()

  const {
    data: surveyFormData,
    isLoading: isSurveyFormLoading,
    isError: isSurveyFormError,
    error: surveyFormError,
  } = useQuery({
    queryKey: ['surveyDetailForm', participantUuid],
    queryFn: () => {
      return getSurveyForm({ participantUuid })
    },
    enabled: Boolean(participantUuid),
  })

  const hasHandledErrorRef = useRef(false)

  useEffect(() => {
    if (!isSurveyFormError || hasHandledErrorRef.current) return
    hasHandledErrorRef.current = true

    showErrorModal({ text: surveyFormError?.message, callback: goToDetail })
  }, [isSurveyFormError, surveyFormError, goToDetail])

  return { surveyFormData, isSurveyFormLoading }
}

/**
 * 설문 제출 (SV3).
 *
 * ✅ **제출 중 잠금을 살렸다** — 투표와 **같은 오타**가 이 도메인에도 있었다
 * (`isPostSurveyFormPending` → `isCreateSurveyFormPending`). 사용자 결정(SV-Q3)에 따라
 * 고쳤고, 제출 중에는 버튼과 선택지가 잠긴다.
 *
 * ⚠️ **서명이 없다** — 버튼을 누르면 검증 후 바로 나간다.
 */
export const usePostSurveyForm = ({ participantUuid }: { participantUuid: string }) => {
  const navigate = useNavigate()

  const { mutate: postSurveyFormMutation, isPending: isPostSurveyFormPending } = useMutation({
    mutationFn: ({ answerList }: { answerList: unknown[] }) => {
      return postSurveyForm({ participantUuid, answerList })
    },
    onSuccess: () => {
      void navigate(ROUTE_PATH.SURVEY_COMPLETED, { replace: true, state: { auth: true } })
    },
    onError: (error: ApiError) => {
      showErrorModal({ text: error.message })
    },
  })

  return { postSurveyFormMutation, isPostSurveyFormPending }
}
