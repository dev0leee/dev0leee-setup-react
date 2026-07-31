import { useNavigate } from 'react-router-dom'

import { env } from '@/config/env'
import { VOTE_MESSAGE } from '@/features/vote/constants/vote'
import { AUTH_TYPE, VOTE_STATE, type VoteDetailInfo, VOTER_STATE } from '@/features/vote/types/vote'
import { ButtonBase } from '@/shared/components/common/ButtonBase'
import { CertButton } from '@/shared/components/common/CertButton'
import { ROUTE_PATH, voteFormPath } from '@/shared/constants/routes'
import { KMC_TYPE } from '@/shared/types/cert'

/**
 * 상세 하단 버튼 (VT2·VT7). 레거시 `Detail/VoteDetailButton.vue` + `AuthButton` +
 * `PassButton` + `MoveButton` 4개를 합쳤다 — 전부 같은 자리에 버튼 하나를 그리는
 * 분기일 뿐이라 파일을 나눌 이유가 없다. **렌더 결과는 같다.**
 *
 * ```
 * 시작전   → [비활성] "{오픈일시} 오픈"
 * 종료     → [비활성] "종료"
 * 진행중 ├ 투표완료        → [비활성] "투표완료"
 *        └ 미투표 ├ 인증완료  → 참여 폼으로
 *                 └ 미인증 ├ PASS       → KMC 외부 사이트로 POST
 *                          └ NAME_PHONE → 이름·휴대폰 인증 화면으로
 * ```
 *
 * ⚠️ **오픈 일시도 `replace('T', ' ')`뿐이라 초까지 보인다.**
 *
 * ⚠️ **인증 화면으로 갈 때 `state: { auth: true, dong, ho }`를 넘긴다.** 인증 화면이
 * `history.state.auth`가 없으면 "잘못된 접근입니다"를 띄우는 가드를 갖고 있다.
 *
 * ⚠️ **KMC 인증 필드가 오기 전에 눌리면 빈 값으로 제출된다** — `CertButton`이 마운트 후
 * 받아오는데 `disabled`는 투표 완료 여부만 본다. 레거시도 같다 (`deferred.md` D-211).
 */
export const VoteDetailButton = ({ voteDetailInfo }: { voteDetailInfo?: VoteDetailInfo }) => {
  const navigate = useNavigate()

  const renderButton = () => {
    if (voteDetailInfo?.voteStatus === VOTE_STATE.PENDING) {
      return (
        <ButtonBase type="button" color="defaults-secondary" roundType="square" size="2xl" disabled>
          <span>{voteDetailInfo.voteOpenDateTime?.replace('T', ' ')} </span>
          <span>오픈</span>
        </ButtonBase>
      )
    }

    if (voteDetailInfo?.voteStatus === VOTE_STATE.CLOSE) {
      return (
        <ButtonBase type="button" color="defaults-secondary" roundType="square" size="2xl" disabled>
          {VOTE_MESSAGE.closed}
        </ButtonBase>
      )
    }

    if (voteDetailInfo?.voterStatus === VOTER_STATE.VOTED) {
      return (
        <ButtonBase type="button" color="defaults-secondary" roundType="square" size="2xl" disabled>
          {VOTE_MESSAGE.voted}
        </ButtonBase>
      )
    }

    if (voteDetailInfo?.authFlag) {
      return (
        <ButtonBase
          type="button"
          color="brand"
          roundType="square"
          size="2xl"
          onClick={() => {
            void navigate(voteFormPath({ voterUuid: voteDetailInfo.voterUuid ?? '' }), {
              state: { auth: true },
            })
          }}
        >
          {VOTE_MESSAGE.voteButton}
        </ButtonBase>
      )
    }

    if (voteDetailInfo?.voteAuthType === AUTH_TYPE.PASS) {
      return (
        <CertButton
          responseUrl={`${env.VITE_BASE_URL}${ROUTE_PATH.VOTE_CERT_PASS_RESPONSE}`}
          text={VOTE_MESSAGE.voteButton}
          // 같은 KMC 창구지만 회원/비회원 유형이 갈린다
          type={env.IS_OPINION ? KMC_TYPE.NON_USER_VOTE : KMC_TYPE.USER_VOTE}
          roundType="square"
          size="2xl"
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
          void navigate(ROUTE_PATH.VOTE_CERT_NAME_PHONE, {
            state: { auth: true, dong: voteDetailInfo?.dong, ho: voteDetailInfo?.ho },
          })
        }}
      >
        {VOTE_MESSAGE.voteButton}
      </ButtonBase>
    )
  }

  return <div className="fixed bottom-0 left-0 w-full">{renderButton()}</div>
}
