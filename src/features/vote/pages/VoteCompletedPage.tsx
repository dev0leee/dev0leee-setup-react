import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { env } from '@/config/env'
import { useIsVoteUser } from '@/features/vote/lib/voteRoute'
import { ButtonBase } from '@/shared/components/common/ButtonBase'
import { ModalButton } from '@/shared/components/common/ModalButton'
import { ACCESS_DENIED_MODAL_DATA } from '@/shared/constants/message'
import { ROUTE_PATH } from '@/shared/constants/routes'

/**
 * 투표 완료 (VT4). 레거시 `VoteCompletedView.vue`(94 LOC) 이식.
 *
 * **회원에게만 닫기·확인 버튼이 보인다.** 비회원(opinion)은 갈 곳이 없어서 화면만 남는다.
 *
 * ⚠️ **두 버튼 모두 `/`로 간다** — `/main`이 아니다. 라우터 가드가 다시 `/main`으로
 * 보내주므로 결과는 같지만 한 번 더 돌아간다 (`vote.md` VT-Q8). 레거시 그대로다.
 *
 * ⚠️ **직접 URL로 들어오면 "잘못된 접근입니다" 모달이 뜬다.** 모달을 닫으면 메인 앱은
 * `/main`, opinion 앱은 `/`로 간다 — VT6은 같은 상황에서 `/vote/list`로 간다. **3곳이
 * 전부 다르다**(`vote.md` §6-4).
 */
export const VoteCompletedPage = () => {
  const navigate = useNavigate()
  const isUser = useIsVoteUser()
  const { state } = useLocation() as { state: { auth?: boolean } | null }

  const [isForbiddenOpen, setIsForbiddenOpen] = useState(!state?.auth)

  const closeForbidden = () => {
    setIsForbiddenOpen(false)
    void navigate(env.IS_OPINION ? ROUTE_PATH.HOME : ROUTE_PATH.MAIN)
  }

  const goHome = () => {
    void navigate(ROUTE_PATH.HOME)
  }

  return (
    <div className="h-full w-full bg-[#F6FAFF]">
      <div className="h-[52px]">
        {isUser && (
          <button type="button" className="px-5 py-4" onClick={goHome}>
            <img src="/assets/icons/CloseBold.svg" alt="닫기 아이콘" className="h-5 w-5" />
          </button>
        )}
      </div>
      <div className="space-y-3 px-5 pt-11">
        <h2 className="pretendard-22Bold">투표가 완료되었습니다.</h2>
        <p className="pretendard-16Regular text-defaults-secondary-text-secondary">
          투표에 참여해주셔서 감사합니다.
        </p>
      </div>
      <div className="relative h-[calc(100%-260px)] w-full">
        <img
          src="/assets/images/OpinionCompleted.svg"
          alt="투표 이미지"
          className="absolute bottom-1/2 left-1/2 -translate-x-1/2 translate-y-1/2"
        />
      </div>

      {isUser && (
        <ButtonBase
          type="button"
          color="brand"
          roundType="square"
          size="2xl"
          className="fixed bottom-0 left-0"
          onClick={goHome}
        >
          확인
        </ButtonBase>
      )}

      <ModalButton
        open={isForbiddenOpen}
        onClose={closeForbidden}
        buttonType="single"
        modalData={ACCESS_DENIED_MODAL_DATA}
        onFirstClick={closeForbidden}
      />
    </div>
  )
}
