import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { ROUTE_PATH } from '@/shared/constants/routes'
import { useAuthStore } from '@/shared/stores/authStore'

export const ProtectedRoute = () => {
  const status = useAuthStore((state) => {
    return state.status
  })
  const location = useLocation()

  if (status !== 'authenticated') {
    // 로그인 후 원래 가려던 곳으로 돌려보내기 위해 위치를 남긴다.
    return <Navigate to={ROUTE_PATH.LOGIN} replace state={{ from: location }} />
  }

  return <Outlet />
}
