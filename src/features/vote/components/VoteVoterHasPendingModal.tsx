import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { VOTE_CONTENT_NAME, VOTE_HIDE_POPUP_COOKIE } from '@/features/vote/constants/vote'
import { useVoteHasVoterPending } from '@/features/vote/queries/useVote'
import { ModalBase } from '@/shared/components/common/ModalBase'
import { ROUTE_PATH } from '@/shared/constants/routes'
import { useResidentDetailInfo } from '@/shared/hooks/useResidentDetailInfo'
import { hasAptContent } from '@/shared/lib/aptContext'
import { getCookie, setCookieUntilMidnight } from '@/shared/utils/cookie'

/**
 * 미완료 투표 팝업 (VT10). **라우트가 없다** — 메인 화면이 렌더한다.
 * 레거시 `VoteVoterHasPendingModal.vue`(125 LOC) 이식.
 *
 * 세 조건이 모두 참일 때만 뜬다: **투표 구독** · **진행중 미완료 투표 존재** ·
 * **오늘 안 보기 쿠키 없음**.
 *
 * ⚠️ **쿠키 키가 공지 팝업(B21)과 다르다**(`hidePopup` vs `noticePopupHideToday`).
 * 레거시 공지 팝업 주석에 "투표 팝업과 충돌 방지"라고 적혀 있는 그 상대가 이것이다.
 *
 * ⚠️ **딤을 눌러도 닫히지 않는다.** 아래 두 버튼으로만 닫힌다 — B21과 같다.
 *
 * ⚠️ **`오늘하루`에 띄어쓰기가 없다.** 공지 팝업은 `오늘 하루 보지 않기`다. 표시 문구라
 * 그대로 옮겼다 (`deferred.md` 「오타·표기」).
 *
 * ⚠️ **버튼 폭이 `w-3/5`와 `w-full`이다.** flex 안에서 `w-full`이 남은 공간을 밀어내
 * 실제로는 3:5쯤 된다. B21은 둘 다 `flex-1`이다 — 비대칭을 유지한다.
 */
export const VoteVoterHasPendingModal = () => {
  const navigate = useNavigate()
  const { residentDetailInfo } = useResidentDetailInfo()

  // ⚠️ 구독 이름이 **`'투표'`**다. `APT_CONTENT_NAME.VOTE`(`'전자투표'`)로 바꾸면
  // 팝업이 영영 뜨지 않는다 — 메인 메뉴도 같은 이유로 리터럴을 쓴다 (`main.md` M-Q3)
  const hasVote = hasAptContent({
    contentList: residentDetailInfo?.contentList,
    contentName: VOTE_CONTENT_NAME,
  })

  const { voteHasVoterPending } = useVoteHasVoterPending({ enabled: hasVote })

  const [isClosed, setIsClosed] = useState(false)
  const [isHideForToday, setIsHideForToday] = useState(() => {
    // 레거시는 `JSON.parse(쿠키)`로 만들었다. 쿠키가 없으면 `JSON.parse(null)`이 `null`이라
    // 우연히 동작했다 — 여기서는 값을 그대로 비교한다. 결과는 같다.
    return getCookie({ name: VOTE_HIDE_POPUP_COOKIE }) === 'true'
  })

  const isOpen =
    hasVote && Boolean(voteHasVoterPending?.progressVoteFlag) && !isClosed && !isHideForToday

  if (!isOpen) return null

  return (
    <ModalBase
      open
      onClose={() => {
        // 레거시가 `@close`를 연결하지 않아 딤·Esc로 닫히지 않는다. 그대로 둔다
      }}
    >
      <div className="relative flex w-[296px] max-w-[80vw] flex-col justify-center gap-5 rounded-md bg-base-b-white p-6 pb-16">
        <div className="text-center pretendard-16Bold text-defaults-primary-text-primary">
          미완료 투표
        </div>
        <div className="space-y-2">
          <p className="text-center pretendard-15Regular">진행중인 투표가 존재합니다.</p>
          <p className="text-center pretendard-15Regular">전자투표에서 투표를 완료해주세요.</p>
        </div>
        <div className="absolute bottom-0 left-0 flex w-full">
          <button
            type="button"
            className="h-12 w-3/5 rounded-bl-md bg-defaults-secondary-background-secondary px-4 pretendard-16SemiBold"
            onClick={() => {
              setCookieUntilMidnight({ name: VOTE_HIDE_POPUP_COOKIE, value: 'true' })
              setIsHideForToday(true)
              setIsClosed(true)
            }}
          >
            오늘하루 <br />
            보지 않기
          </button>
          <button
            type="button"
            className="h-12 w-full rounded-br-md bg-brand-default-background-brand px-4 pretendard-16SemiBold text-base-b-white"
            onClick={() => {
              void navigate(ROUTE_PATH.VOTE_LIST)
            }}
          >
            투표하기
          </button>
        </div>
      </div>
    </ModalBase>
  )
}
