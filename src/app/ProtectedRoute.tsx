import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { useAuthStore } from '@/shared/stores/authStore'

export const ProtectedRoute = () => {
  const status = useAuthStore((s) => s.status)
  const location = useLocation()

  if (status !== 'authenticated') {
    // 로그인 후 원래 가려던 곳으로 돌려보내기 위해 위치를 남긴다.
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <Outlet />
}
