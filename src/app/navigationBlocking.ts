import { ROUTE_PATH } from '@/shared/constants/routes'

/**
 * 뒤로가기로 벗어날 수 없는 화면. 레거시 `router/index.js`의 `isPopState` 검사 그대로.
 *
 * 셋 다 **흐름의 종착지**다 — 메인·마이페이지는 탭이고, 소방 점검 완료는 제출이 끝난
 * 화면이라 뒤로 가면 폼으로 되돌아간다.
 */
const BACK_BLOCKED_PATHS: string[] = [
  ROUTE_PATH.MAIN,
  ROUTE_PATH.MYPAGE,
  ROUTE_PATH.FIRE_INSPECTION_COMPLETE,
]

/**
 * 이 이동을 막아야 하는가. 레거시 `router.beforeEach`의 차단 조건 2개를 옮겼다.
 *
 * 순수 함수로 뽑아둔 이유는 **테스트가 가능해야** 하기 때문이다. react-router의
 * `useBlocker`에 인라인으로 넣으면 라우터를 띄우지 않고는 검증할 수 없다.
 *
 * ⚠️ **오프라인이면 이동 자체를 막는다.** 레거시가 토스트만 띄우고 `return false`한다 —
 * 화면은 그대로 남는다. 토스트는 호출부(`useNavigationGuard`)가 띄운다.
 *
 * ⚠️ 뒤로가기 차단은 **떠나는 화면**을 본다(`from.path`). 어디로 가는지는 보지 않는다.
 */
export const shouldBlockNavigation = ({
  historyAction,
  currentPathname,
  isOnline,
}: {
  /** react-router가 알려주는 히스토리 동작. 뒤로/앞으로가 `POP`이다 */
  historyAction: string
  /** 지금 보고 있는(떠나려는) 경로 */
  currentPathname: string
  isOnline: boolean
}): boolean => {
  if (!isOnline) return true

  return historyAction === 'POP' && BACK_BLOCKED_PATHS.includes(currentPathname)
}
