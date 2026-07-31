import { NoticePopupModal } from '@/features/board'
import { MainPage } from '@/features/main'
import { VoteVoterHasPendingModal } from '@/features/vote'

/**
 * 메인 화면 + 그 위에 뜨는 팝업들. 레거시 `MainView.vue`의 최상위 조립에 대응한다.
 *
 * **왜 `features/main`이 아니라 여기 있나** — 팝업들이 다른 도메인 소유이기 때문이다.
 * 공지 팝업은 Board, 투표 대기 팝업은 Vote가 만든다. feature는 다른 feature를
 * import할 수 없으므로(`01-folder-structure.md`) **조립은 app 레이어가 한다.**
 *
 * ⚠️ **렌더 순서가 곧 우선순위다.** 두 팝업의 z-index가 같아서 나중에 렌더된 쪽이
 * 위에 온다. 레거시는 투표 팝업을 먼저, 공지 팝업을 나중에 둬 **공지가 위에** 오게 했다 —
 * 그 순서를 그대로 유지한다.
 */
export const MainScreen = () => {
  return (
    <>
      <MainPage />
      <VoteVoterHasPendingModal />
      <NoticePopupModal />
    </>
  )
}
