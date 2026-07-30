import { useEffect } from 'react'
import { useBlocker } from 'react-router-dom'

import { shouldBlockNavigation } from '@/app/navigationBlocking'
import { NETWORK_ERROR_MESSAGE } from '@/shared/constants/message'
import { useOnlineStatus } from '@/shared/hooks/useOnlineStatus'
import { showToast } from '@/shared/lib/toast'

/**
 * 이동을 막는 가드. 레거시 `router.beforeEach`의 `return false` 두 경로 이관.
 *
 * vue-router는 가드에서 `false`를 돌려주면 이동이 조용히 취소된다. react-router에는
 * 그런 훅이 없어 `useBlocker`로 잡고 **곧바로 `reset()`** 한다 — `proceed()`를 부르지
 * 않으면 이동은 일어나지 않고, `reset()`으로 blocker를 풀어야 **다음 이동이 다시 판정된다**
 * (풀지 않으면 blocker가 `blocked`에 머물러 그 뒤 모든 이동이 막힌다).
 *
 * ⚠️ **판정을 `useEffect`가 아니라 blocker 함수가 한다.** 이동은 렌더 결과가 아니라
 * 사용자 동작이므로 effect로 뒤늦게 되돌리면 화면이 한 번 바뀐 뒤 튕긴다.
 */
export const useNavigationGuard = () => {
  const isOnline = useOnlineStatus()

  const blocker = useBlocker(({ historyAction, currentLocation }) => {
    return shouldBlockNavigation({
      historyAction,
      currentPathname: currentLocation.pathname,
      isOnline,
    })
  })

  useEffect(() => {
    if (blocker.state !== 'blocked') return

    // 뒤로가기 차단은 아무 안내도 하지 않는다(레거시 동일). 오프라인만 알려준다.
    if (!isOnline) showToast({ message: NETWORK_ERROR_MESSAGE })

    blocker.reset()
  }, [blocker, isOnline])
}
