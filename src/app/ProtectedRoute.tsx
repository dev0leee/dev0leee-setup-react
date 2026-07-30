import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { ROUTE_PATH } from '@/shared/constants/routes'
import { hasStoredSession } from '@/shared/lib/authSession'
import { useAuthStore } from '@/shared/stores/authStore'

/**
 * 레거시 `router.beforeEach` 3단계(인증이 필요한데 미인증) 이관.
 *
 * `aptInfo`를 셀렉터로 구독한다. 로그인 직후 `setAptInfo`가 값을 채우면 이 컴포넌트가
 * 리렌더돼 통과한다 — 구독 없이 `hasStoredSession()`만 부르면 로그인해도 화면이
 * 인트로에 머문다.
 */
export const ProtectedRoute = () => {
  // 값 자체는 쓰지 않는다. 단지 컨텍스트가 바뀔 때 재평가되도록 구독만 한다.
  useAuthStore((state) => {
    return state.aptInfo
  })
  const location = useLocation()

  if (!hasStoredSession()) {
    // 로그인 후 원래 가려던 곳으로 돌려보내기 위해 위치를 남긴다.
    return <Navigate to={ROUTE_PATH.INTRO} replace state={{ from: location }} />
  }

  return <Outlet />
}
