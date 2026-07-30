import { createBrowserRouter, Navigate } from 'react-router-dom'

import { AppRoot } from '@/app/AppRoot'
import { AppLayout } from '@/app/layouts/AppLayout'
import { RootLayout } from '@/app/layouts/RootLayout'
import { NotFoundPage } from '@/app/NotFoundPage'
import { ProtectedRoute } from '@/app/ProtectedRoute'
import { LoginPage } from '@/features/auth'
import { FullPageSpinner } from '@/shared/components/common/FullPageSpinner'
import { ROUTE_PATH } from '@/shared/constants/routes'
import type { RouteLayoutConfig } from '@/shared/types/layout'

/**
 * 라우트 정의. 레거시 `router/*.js` 20개 / 121 화면을 여기로 모은다.
 *
 * 레이아웃 메타는 `handle`에 담는다 — 레거시 `route.meta`에 대응하고
 * `useLayoutConfig`가 읽는다. 지정하지 않은 값은 `DEFAULT_ROUTE_LAYOUT`을 따른다.
 *
 * ⚠️ **경로 문자열을 바꾸지 않는다.** 외부 딥링크·푸시 알림이 의존한다.
 */
const layout = (config: Partial<RouteLayoutConfig>) => {
  return config
}

/**
 * 라우트 트리. `createBrowserRouter`와 분리해 둔 이유는 **테스트가 같은 트리를
 * `createMemoryRouter`로 띄울 수 있어야** 하기 때문이다.
 * 테스트용 라우트를 따로 만들면 실제 배선과 어긋나도 알 수 없다.
 */
export const routes = [
  {
    element: <AppRoot />,
    // lazy 라우트를 쓰면 React Router가 루트에 HydrateFallback을 요구한다.
    HydrateFallback: FullPageSpinner,
    children: [
      {
        element: <RootLayout />,
        children: [
          {
            element: <AppLayout />,
            children: [
              // ── 공개 라우트 ─────────────────────────────────────────────────
              {
                // 레거시 `/`는 인트로로 리다이렉트한다. 로그인 상태면 인트로가
                // 다시 `/main`으로 보낸다 (레거시 가드 4단계와 같은 결과).
                index: true,
                element: <Navigate to={ROUTE_PATH.INTRO} replace />,
              },
              {
                path: ROUTE_PATH.INTRO,
                element: <LoginPage />,
                handle: layout({ showAppBar: false }),
              },

              // ── 인증 필요 ───────────────────────────────────────────────────
              {
                element: <ProtectedRoute />,
                children: [
                  {
                    path: ROUTE_PATH.MAIN,
                    handle: layout({ showAppBar: false, showBottomNav: true }),
                    lazy: async () => {
                      const { MainPage } = await import('@/features/main')
                      return { Component: MainPage }
                    },
                  },
                ],
              },

              { path: '*', element: <NotFoundPage />, handle: layout({ showAppBar: false }) },
            ],
          },
        ],
      },
    ],
  },
]

export const router = createBrowserRouter(routes)
