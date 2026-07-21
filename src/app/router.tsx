import { createBrowserRouter } from 'react-router-dom'

import { FullPageSpinner } from '@/components/common/FullPageSpinner'
import { LoginPage } from '@/features/auth/LoginPage'

import { AppLayout } from './AppLayout'
import { NotFoundPage } from './NotFoundPage'
import { ProtectedRoute } from './ProtectedRoute'

export const router = createBrowserRouter([
  {
    // lazy 라우트를 쓰면 React Router가 루트에 HydrateFallback을 요구한다.
    HydrateFallback: FullPageSpinner,
    children: [
      // 로그인은 비인증 사용자의 진입점이라 즉시 로드한다.
      { path: '/login', element: <LoginPage /> },
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
                  const { DashboardPage } = await import('@/features/dashboard/DashboardPage')
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
