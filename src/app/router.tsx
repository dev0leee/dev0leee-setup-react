import { createBrowserRouter, Navigate } from 'react-router-dom'

import { AppRoot } from '@/app/AppRoot'
import { AppLayout } from '@/app/layouts/AppLayout'
import { RootLayout } from '@/app/layouts/RootLayout'
import { ProtectedRoute } from '@/app/ProtectedRoute'
import { LoginPage, LogoutPage } from '@/features/auth'
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
              {
                // 레거시 `authOptional` — 가드를 우회한다. 인증이 깨져서 오는 화면이라
                // 가드 안에 두면 인트로로 튕겨 에러 내용을 볼 수 없다.
                path: ROUTE_PATH.ERROR,
                handle: layout({ showAppBar: false }),
                lazy: async () => {
                  const { ErrorPage } = await import('@/features/exception')
                  return { Component: ErrorPage }
                },
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
                  {
                    // E1과 같은 화면이다. 여기만 하단 탭이 보인다 (`exception.md` E2)
                    path: ROUTE_PATH.ERROR_AUTH,
                    handle: layout({ showAppBar: false, showBottomNav: true }),
                    lazy: async () => {
                      const { ErrorPage } = await import('@/features/exception')
                      return { Component: ErrorPage }
                    },
                  },

                  // ── 마이페이지 ─────────────────────────────────────────────
                  {
                    path: ROUTE_PATH.MYPAGE,
                    // 하단 탭이 보이는 두 화면 중 하나다 (다른 하나는 /main)
                    handle: layout({ showAppBar: false, showBottomNav: true }),
                    lazy: async () => {
                      const { MyPage } = await import('@/features/mypage')
                      return { Component: MyPage }
                    },
                  },
                  {
                    // AppBar를 화면 안에서 렌더한다 — 우측 `수정` 버튼 때문이다
                    path: ROUTE_PATH.MYPAGE_PROFILE,
                    handle: layout({ showAppBar: false }),
                    lazy: async () => {
                      const { ProfilePage } = await import('@/features/mypage')
                      return { Component: ProfilePage }
                    },
                  },
                  {
                    // 〃 우측이 `완료`(제출) 버튼이다
                    path: ROUTE_PATH.MYPAGE_PROFILE_EDIT,
                    handle: layout({ showAppBar: false }),
                    lazy: async () => {
                      const { ProfileEditPage } = await import('@/features/mypage')
                      return { Component: ProfileEditPage }
                    },
                  },
                  {
                    path: ROUTE_PATH.MYPAGE_ALARM_SETTING,
                    handle: layout({ appBarTitle: '알림 설정' }),
                    lazy: async () => {
                      const { AlarmSettingPage } = await import('@/features/mypage')
                      return { Component: AlarmSettingPage }
                    },
                  },
                  {
                    path: ROUTE_PATH.MYPAGE_APT_INFO,
                    handle: layout({ appBarTitle: '관리사무소' }),
                    lazy: async () => {
                      const { OfficeInfoPage } = await import('@/features/mypage')
                      return { Component: OfficeInfoPage }
                    },
                  },
                  {
                    path: ROUTE_PATH.MYPAGE_TERMS_OF_USE,
                    handle: layout({ appBarTitle: '약관 및 정책' }),
                    lazy: async () => {
                      const { TermsOfUsePage } = await import('@/features/mypage')
                      return { Component: TermsOfUsePage }
                    },
                  },
                  {
                    path: ROUTE_PATH.MYPAGE_FONT_SIZE_SETTING,
                    handle: layout({ appBarTitle: '글자 크기 설정' }),
                    lazy: async () => {
                      const { FontSizePage } = await import('@/features/mypage')
                      return { Component: FontSizePage }
                    },
                  },
                  {
                    path: ROUTE_PATH.MYPAGE_ACCOUNT_DELETION,
                    handle: layout({ appBarTitle: '회원 탈퇴' }),
                    lazy: async () => {
                      const { AccountDeletionPage } = await import('@/features/mypage')
                      return { Component: AccountDeletionPage }
                    },
                  },
                  {
                    // 화면이 아니라 확인 모달이다. 뒤에는 이전 화면이 남아 있다.
                    // `features/auth` 배럴은 `AuthProvider`·`LoginPage` 때문에 이미 초기
                    // 번들에 있으므로 lazy 로 감싸도 분리되지 않는다 — eager 로 둔다.
                    path: ROUTE_PATH.LOGOUT,
                    element: <LogoutPage />,
                    handle: layout({ showAppBar: false }),
                  },
                ],
              },

              {
                // 레거시는 이 라우트가 `LayoutAuth` 하위지만 자기 meta로 `requiresAuth:false`를
                // 덮어썼다. 타깃에서는 가드 밖에 둔다 (`routes.md` §3-1).
                path: '*',
                handle: layout({ showAppBar: false }),
                lazy: async () => {
                  const { NotFoundPage } = await import('@/features/exception')
                  return { Component: NotFoundPage }
                },
              },
            ],
          },
        ],
      },
    ],
  },
]

export const router = createBrowserRouter(routes)
