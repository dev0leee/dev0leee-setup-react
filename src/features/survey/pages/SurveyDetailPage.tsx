import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { env } from '@/config/env'
import { SurveyDetailButton } from '@/features/survey/components/detail/SurveyDetailButton'
import { SurveyDetailInfo } from '@/features/survey/components/detail/SurveyDetailInfo'
import { SurveyDetailTitle } from '@/features/survey/components/detail/SurveyDetailTitle'
import { useIsSurveyUser } from '@/features/survey/lib/surveyRoute'
import { useSurveyDetailInfo } from '@/features/survey/queries/useSurvey'
import { SURVEY_STATE } from '@/features/survey/types/survey'
import { ROUTE_PATH } from '@/shared/constants/routes'
import { useSurveyCertStore } from '@/shared/stores/surveyCertStore'

/**
 * 설문 상세 (SV2 회원 · SV9 비회원). 레거시 `Detail/SurveyDetailView.vue`(87 LOC) 이식.
 *
 * **투표 상세와 달리 탭이 없다** — 정보 하나뿐이고 결과 화면도 없다.
 *
 * 🔴 **비회원 리다이렉트 조건이 투표와 반대다.** 투표는 `!isOpinion || isUser`(OR),
 * 설문은 `!isOpinion && isUser`(AND)로 빠져나간다. 그래서 **메인 앱에서 비로그인
 * 상태로 들어오면** 시작전/종료 화면으로 보내는데, **메인 라우터에는 그 경로가 없다**
 * (opinion 전용) — NotFound로 떨어진다. 다만 이 라우트가 인증 필요 구역이라 가드가
 * 먼저 로그인으로 보낸다 (`survey.md` SV-Q2). **어느 쪽이 의도인지 불명확해 그대로 옮겼다.**
 *
 * ⚠️ **인증 정보 저장에 가드가 있다** — opinion 경로에는 `surveyUuid`가 없어 `OR`로,
 * 메인 경로는 둘 다 필요해 `AND`로 판정한다. 투표는 이런 가드 없이 무조건 저장한다.
 */
export const SurveyDetailPage = () => {
  const navigate = useNavigate()
  const { surveyUuid = '', participantUuid = '' } = useParams()
  const isUser = useIsSurveyUser()

  const setSurveyCertInfo = useSurveyCertStore((state) => {
    return state.setSurveyCertInfo
  })

  const { surveyDetailInfo, isSurveyDetailInfoLoading } = useSurveyDetailInfo({ participantUuid })

  useEffect(() => {
    const isParamsValid = env.IS_OPINION
      ? Boolean(surveyUuid) || Boolean(participantUuid)
      : Boolean(surveyUuid) && Boolean(participantUuid)

    if (!isParamsValid) return

    setSurveyCertInfo({ surveyUuid, participantUuid, isTriedVerification: undefined })
  }, [surveyUuid, participantUuid, setSurveyCertInfo])

  useEffect(() => {
    if (!surveyDetailInfo) return
    // 🔴 AND다. 메인 앱 + 비로그인이면 여기를 통과해 아래로 내려간다 (투표는 OR)
    if (!env.IS_OPINION && isUser) return

    if (surveyDetailInfo.state === SURVEY_STATE.PENDING) void navigate(ROUTE_PATH.SURVEY_BEFORE)
    if (surveyDetailInfo.state === SURVEY_STATE.CLOSE) void navigate(ROUTE_PATH.SURVEY_FINISH)
  }, [surveyDetailInfo, isUser, navigate])

  return (
    <div className="h-full w-full overflow-auto">
      <SurveyDetailTitle surveyDetailInfo={surveyDetailInfo} />
      <section>
        <SurveyDetailInfo
          surveyDetailInfo={surveyDetailInfo}
          isLoading={isSurveyDetailInfoLoading}
        />
      </section>
      <SurveyDetailButton surveyDetailInfo={surveyDetailInfo} />
    </div>
  )
}
