import { Outlet } from 'react-router-dom'

import { AuthProvider } from '@/features/auth'

/**
 * 라우터의 루트 요소. 레거시 `MainApp.vue`에 해당한다.
 *
 * `AuthProvider`가 **라우터 안에** 있어야 한다 — 자동 로그인 실패 시 화면을 옮기고
 * 로그인 성공 시 `/main`으로 보내는데, 그 이동이 `useNavigate`로 이뤄진다.
 * 템플릿은 `App.tsx`에서 `RouterProvider`를 감쌌지만 그러면 이동이 동작하지 않는다.
 */
export const AppRoot = () => {
  return (
    <AuthProvider>
      <Outlet />
    </AuthProvider>
  )
}
