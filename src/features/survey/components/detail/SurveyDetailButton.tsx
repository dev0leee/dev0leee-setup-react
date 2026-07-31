import { useNavigate, useParams } from 'react-router-dom'

import { env } from '@/config/env'
import { SURVEY_MESSAGE } from '@/features/survey/constants/survey'
import {
  PARTICIPANT_STATE,
  SURVEY_AUTH_TYPE,
  SURVEY_STATE,
  type SurveyDetailInfoData,
} from '@/features/survey/types/survey'
import { ButtonBase } from '@/shared/components/common/ButtonBase'
import { CertButton } from '@/shared/components/common/CertButton'
import { ROUTE_PATH, surveyFormPath } from '@/shared/constants/routes'
import { KMC_TYPE } from '@/shared/types/cert'

/**
 * 상세 하단 버튼 (SV2·SV9). 레거시 `Detail/SurveyDetailButton.vue` + `AuthButton` +
 * `PassButton` + `MoveButton` 4개를 합쳤다 — 투표와 같은 정리다.
 *
 * ```
 * 시작전   → [비활성] "{오픈일시} 오픈"
 * 종료     → [비활성] "종료"
 * 진행중 ├ 참여완료           → [비활성] "참여완료"
 *        └ 미참여 ├ 인증완료 또는 인증불필요(NONE) → 참여 폼으로
 *                 └ 미인증 ├ PASS       → KMC 외부 사이트로 POST
 *                          └ NAME_PHONE → 이름·휴대폰 인증 화면으로
 * ```
 *
 * ⚠️ **투표에 없는 `NONE` 분기가 있다** — 인증 없이 바로 참여하는 설문이다.
 *
 * ⚠️ **오픈 일시는 `replace('T', ' ')`뿐이라 초까지 보인다.** 바로 위 기본정보의
 * 같은 값은 분까지만 나온다 — 한 화면 안에서 정밀도가 갈린다.
 *
 * 🔴 **설문인데 KMC 유형이 `USER_VOTE`/`NON_USER_VOTE`다.** 설문 전용 코드가 서버에
 * 없어서다 — **서버 계약이라 그대로 쓴다** (`survey.md` §6-3, SV-Q8).
 *
 * ⚠️ 레거시는 상태를 **쿼리와 스토어에서 절반씩** 읽었다(`state`는 쿼리, `authType`·
 * `authFlag`는 스토어 복사본). 스토어가 `watch`로 한 틱 늦게 채워져 첫 프레임이 어긋날
 * 수 있었다 — **쿼리 하나로 통일했다.** 렌더 결과는 같다 (`survey.md` §5).
 */
export const SurveyDetailButton = ({
  surveyDetailInfo,
}: {
  surveyDetailInfo?: SurveyDetailInfoData
}) => {
  const navigate = useNavigate()
  const { participantUuid = '' } = useParams()

  const renderButton = () => {
    if (surveyDetailInfo?.state === SURVEY_STATE.PENDING) {
      return (
        <ButtonBase type="button" color="defaults-secondary" roundType="square" size="2xl" disabled>
          <span>{surveyDetailInfo.startDateTime?.replace('T', ' ')} </span>
          <span>오픈</span>
        </ButtonBase>
      )
    }

    if (surveyDetailInfo?.state === SURVEY_STATE.CLOSE) {
      return (
        <ButtonBase type="button" color="defaults-secondary" roundType="square" size="2xl" disabled>
          {SURVEY_MESSAGE.closed}
        </ButtonBase>
      )
    }

    if (surveyDetailInfo?.respondentState === PARTICIPANT_STATE.PARTICIPATED) {
      return (
        <ButtonBase type="button" color="defaults-secondary" roundType="square" size="2xl" disabled>
          {SURVEY_MESSAGE.participated}
        </ButtonBase>
      )
    }

    // 인증을 마쳤거나 애초에 인증이 필요 없는 설문이면 바로 참여한다
    if (surveyDetailInfo?.authFlag || surveyDetailInfo?.authType === SURVEY_AUTH_TYPE.NONE) {
      return (
        <ButtonBase
          type="button"
          color="brand"
          roundType="square"
          size="2xl"
          onClick={() => {
            void navigate(surveyFormPath({ participantUuid }), { state: { auth: true } })
          }}
        >
          {SURVEY_MESSAGE.joinButton}
        </ButtonBase>
      )
    }

    if (surveyDetailInfo?.authType === SURVEY_AUTH_TYPE.PASS) {
      return (
        <CertButton
          responseUrl={`${env.VITE_BASE_URL}${ROUTE_PATH.SURVEY_CERT_PASS_RESPONSE}`}
          text={SURVEY_MESSAGE.joinButton}
          // 🔴 설문 전용 코드가 없어 투표 코드를 쓴다 (SV-Q8)
          type={env.IS_OPINION ? KMC_TYPE.NON_USER_VOTE : KMC_TYPE.USER_VOTE}
          roundType="square"
          size="2xl"
          // ⚠️ 이름과 반대다. **설문불참**으로 표시된 사람은 버튼이 잠긴다 (레거시 그대로)
          disabled={surveyDetailInfo.respondentState === PARTICIPANT_STATE.NOT_PARTICIPATED}
        />
      )
    }

    return (
      <ButtonBase
        type="button"
        color="brand"
        roundType="square"
        size="2xl"
        onClick={() => {
          void navigate(ROUTE_PATH.SURVEY_CERT_NAME_PHONE, {
            state: { auth: true, dong: surveyDetailInfo?.dong, ho: surveyDetailInfo?.ho },
          })
        }}
      >
        {SURVEY_MESSAGE.joinButton}
      </ButtonBase>
    )
  }

  return <div className="fixed bottom-0 left-0 w-full">{renderButton()}</div>
}
