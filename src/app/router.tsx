import { createBrowserRouter } from 'react-router-dom'

import { AppLayout } from '@/app/layouts/AppLayout'
import { NotFoundPage } from '@/app/NotFoundPage'
import { ProtectedRoute } from '@/app/ProtectedRoute'
import { LoginPage } from '@/features/auth'
import { FullPageSpinner } from '@/shared/components/common/FullPageSpinner'
import { ROUTE_PATH } from '@/shared/constants/routes'

export const router = createBrowserRouter([
  {
    // lazy 라우트를 쓰면 React Router가 루트에 HydrateFallback을 요구한다.
    HydrateFallback: FullPageSpinner,
    children: [
      // 인트로(로그인)는 비인증 사용자의 진입점이라 즉시 로드한다.
      { path: ROUTE_PATH.INTRO, element: <LoginPage /> },
      {
        element: <ProtectedRoute />,
        children: [
          {
            element: <AppLayout />,
            children: [
              {
                index: true,
                // 라우트 단위 코드 스플리팅. recharts / react-table 같은 무거운
                // 의존성이 초기 번들에서 빠진다. 새 페이지도 이 패턴을 따를 것.
                lazy: async () => {
                  const { DashboardPage } = await import('@/features/dashboard')
                  return { Component: DashboardPage }
                },
              },
            ],
          },
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
