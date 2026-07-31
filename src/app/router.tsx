import { createBrowserRouter, Navigate } from 'react-router-dom'

import { AppRoot } from '@/app/AppRoot'
import { AppLayout } from '@/app/layouts/AppLayout'
import { RootLayout } from '@/app/layouts/RootLayout'
import { ProtectedRoute } from '@/app/ProtectedRoute'
import { publicRouteLoader } from '@/app/publicRouteLoader'
import {
  IntroPage,
  LoginPendingPage,
  LogoutPage,
  PasswordCertPage,
  PasswordResetPage,
  VersionOneCertResponsePage,
  VersionOneTermsPage,
} from '@/features/auth'
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
                element: <IntroPage />,
                handle: layout({ showAppBar: false }),
                loader: publicRouteLoader,
              },
              // 아래 세 화면은 `element`(eager)다. `features/auth` 배럴이 `AuthProvider`·
              // `IntroPage` 때문에 이미 초기 번들에 들어가 있어 **`lazy`로 감싸도 청크가
              // 분리되지 않는다** (Vite `INEFFECTIVE_DYNAMIC_IMPORT`). 분리하려면 배럴을
              // 쪼개야 하는데 그건 컨벤션(공개 API는 index.ts) 쪽 결정이다 —
              // `deferred.md` D-207.
              {
                // AppBar 제목이 **빈 문자열**이다. 뒤로가기 버튼만 보인다
                path: ROUTE_PATH.PASSWORD_CERT,
                element: <PasswordCertPage />,
                loader: publicRouteLoader,
              },
              {
                path: ROUTE_PATH.PASSWORD_RESET,
                element: <PasswordResetPage />,
                handle: layout({ appBarTitle: '새 비밀번호 설정' }),
                loader: publicRouteLoader,
              },
              {
                path: ROUTE_PATH.LOGIN_PENDING,
                element: <LoginPendingPage />,
                handle: layout({ showAppBar: false }),
                loader: publicRouteLoader,
              },

              // ── 버전1 입주민 전환 ───────────────────────────────────────────
              // 로그인 직후(토큰은 있고 단지 정보는 없는 상태)에 오는 화면이라
              // `publicRouteLoader`를 걸어도 `hasStoredSession()`이 false다.
              // 레거시가 `requiresAuth: false`를 명시한 것과 같은 결과다.
              {
                path: ROUTE_PATH.VERSION_ONE_TERMS,
                element: <VersionOneTermsPage />,
                // 제목은 빈 문자열, 뒤로가기는 히스토리가 아니라 `/`로 보낸다
                handle: layout({ backPath: ROUTE_PATH.HOME }),
                loader: publicRouteLoader,
              },
              {
                path: ROUTE_PATH.VERSION_ONE_TERMS_RESPONSE,
                element: <VersionOneCertResponsePage />,
                handle: layout({ showAppBar: false }),
                loader: publicRouteLoader,
              },

              // ── 회원가입 위저드 ─────────────────────────────────────────────
              {
                // ⚠️ `authOptional`이라 **로그인 여부를 묻지 않는다** → loader를 걸지 않는다
                path: ROUTE_PATH.SIGNUP_TERMS,
                handle: layout({ backPath: ROUTE_PATH.HOME }),
                lazy: async () => {
                  const { TermsAndConditionsPage } = await import('@/features/signup')
                  return { Component: TermsAndConditionsPage }
                },
              },
              {
                path: ROUTE_PATH.SIGNUP_CERT_RESPONSE,
                handle: layout({ showAppBar: false }),
                loader: publicRouteLoader,
                lazy: async () => {
                  const { SignUpCertResponsePage } = await import('@/features/signup')
                  return { Component: SignUpCertResponsePage }
                },
              },
              {
                // ⚠️ **레거시 meta가 `showAppBar: true`인데 화면도 AppBar를 렌더한다** —
                // 같은 자리에 두 개가 겹친다. 위에 오는 화면 쪽이 클릭을 받아 동작은
                // 화면 것이 이긴다. 등가 이관으로 그대로 재현했다 (`deferred.md` D-212)
                path: ROUTE_PATH.SIGNUP_INFO_USER,
                loader: publicRouteLoader,
                lazy: async () => {
                  const { UserInfoPage } = await import('@/features/signup')
                  return { Component: UserInfoPage }
                },
              },
              {
                path: ROUTE_PATH.SIGNUP_INFO_APT,
                handle: layout({ showAppBar: false }),
                loader: publicRouteLoader,
                lazy: async () => {
                  const { AptInfoPage } = await import('@/features/signup')
                  return { Component: AptInfoPage }
                },
              },
              {
                path: ROUTE_PATH.SIGNUP_COMPLETED,
                handle: layout({ showAppBar: false }),
                loader: publicRouteLoader,
                lazy: async () => {
                  const { SignUpCompletedPage } = await import('@/features/signup')
                  return { Component: SignUpCompletedPage }
                },
              },

              {
                // 약관 본문(iframe). `authOptional`이라 **로그인 상태에서도 열려야 한다** —
                // 마이페이지 약관 및 정책(P6)이 여기로 온다. loader를 걸면 `/main`으로 튕긴다
                path: `${ROUTE_PATH.TERMS_OF_USE_DETAIL}/:termsId`,
                handle: layout({ appBarTitle: '약관 상세' }),
                lazy: async () => {
                  const { TermsDetailPage } = await import('@/features/terms')
                  return { Component: TermsDetailPage }
                },
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
                      // 메인 화면 + 공지/투표 팝업 조립. 팝업이 다른 도메인 소유라
                      // app 레이어에서 합친다 (`MainScreen.tsx` 주석).
                      const { MainScreen } = await import('@/app/MainScreen')
                      return { Component: MainScreen }
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

                  // ── 게시판 — 공지 계보 ─────────────────────────────────────
                  {
                    path: ROUTE_PATH.BOARD_NOTICE,
                    handle: layout({ appBarTitle: '공지사항' }),
                    lazy: async () => {
                      const { NoticeBoardPage } = await import('@/features/board')
                      return { Component: NoticeBoardPage }
                    },
                  },
                  {
                    // 네이티브 푸시 딥링크가 여기로 들어온다. 경로를 바꾸지 않는다.
                    path: ROUTE_PATH.BOARD_NOTICE_DETAIL,
                    handle: layout({ appBarTitle: '공지사항 상세' }),
                    lazy: async () => {
                      const { NoticeDetailPage } = await import('@/features/board')
                      return { Component: NoticeDetailPage }
                    },
                  },
                  {
                    path: ROUTE_PATH.BOARD_GLOBAL_NOTICE,
                    handle: layout({ appBarTitle: '아파트먼트 공지사항' }),
                    lazy: async () => {
                      const { GlobalNoticeBoardPage } = await import('@/features/board')
                      return { Component: GlobalNoticeBoardPage }
                    },
                  },
                  {
                    path: ROUTE_PATH.BOARD_GLOBAL_NOTICE_DETAIL,
                    handle: layout({ appBarTitle: '아파트먼트 공지사항 상세' }),
                    lazy: async () => {
                      const { GlobalNoticeDetailPage } = await import('@/features/board')
                      return { Component: GlobalNoticeDetailPage }
                    },
                  },

                  // ── 게시판 — 소통공간·민원공간 ─────────────────────────────
                  {
                    // AppBar를 화면 안에서 그린다 (우측 슬롯에 내 활동 버튼)
                    path: ROUTE_PATH.BOARD_COMMUNITY,
                    handle: layout({ showAppBar: false }),
                    lazy: async () => {
                      const { CommunityBoardPage } = await import('@/features/board')
                      return { Component: CommunityBoardPage }
                    },
                  },
                  {
                    path: ROUTE_PATH.BOARD_COMPLAINTS,
                    handle: layout({ showAppBar: false }),
                    lazy: async () => {
                      const { ComplaintsBoardPage } = await import('@/features/board')
                      return { Component: ComplaintsBoardPage }
                    },
                  },
                  {
                    path: ROUTE_PATH.BOARD_COMMUNITY_ACTIVITIES,
                    handle: layout({ appBarTitle: '소통공간 내 활동' }),
                    lazy: async () => {
                      const { CommunityMyActivitiesPage } = await import('@/features/board')
                      return { Component: CommunityMyActivitiesPage }
                    },
                  },
                  {
                    // ⚠️ 여기는 `민원공간`(붙임)이다. 게시판 AppBar는 `민원 공간`(공백)
                    path: ROUTE_PATH.BOARD_COMPLAINTS_ACTIVITIES,
                    handle: layout({ appBarTitle: '민원공간 내 활동' }),
                    lazy: async () => {
                      const { ComplaintsMyActivitiesPage } = await import('@/features/board')
                      return { Component: ComplaintsMyActivitiesPage }
                    },
                  },
                  {
                    // 상세 4개는 AppBar를 화면 안에서 그린다 (우측 슬롯에 더보기)
                    path: ROUTE_PATH.BOARD_COMMUNITY_DETAIL,
                    handle: layout({ showAppBar: false }),
                    lazy: async () => {
                      const { CommunityDetailPage } = await import('@/features/board')
                      return { Component: CommunityDetailPage }
                    },
                  },
                  {
                    path: ROUTE_PATH.BOARD_COMPLAINTS_DETAIL,
                    handle: layout({ showAppBar: false }),
                    lazy: async () => {
                      const { ComplaintsDetailPage } = await import('@/features/board')
                      return { Component: ComplaintsDetailPage }
                    },
                  },
                  {
                    path: ROUTE_PATH.POST_COMMUNITY_COMMENT_REPLY,
                    handle: layout({ appBarTitle: '소통공간 답글 작성' }),
                    lazy: async () => {
                      const { CommunityCommentReplyWritePage } = await import('@/features/board')
                      return { Component: CommunityCommentReplyWritePage }
                    },
                  },
                  {
                    path: ROUTE_PATH.POST_COMPLAINTS_COMMENT_REPLY,
                    handle: layout({ appBarTitle: '민원공간 답글 작성' }),
                    lazy: async () => {
                      const { ComplaintsCommentReplyWritePage } = await import('@/features/board')
                      return { Component: ComplaintsCommentReplyWritePage }
                    },
                  },
                  {
                    // 댓글 수정도 화면 안에서 AppBar를 그린다 (완료 버튼 · 뒤로가기 모달)
                    path: ROUTE_PATH.POST_COMMUNITY_COMMENT_EDIT,
                    handle: layout({ showAppBar: false }),
                    lazy: async () => {
                      const { CommunityCommentEditPage } = await import('@/features/board')
                      return { Component: CommunityCommentEditPage }
                    },
                  },
                  {
                    path: ROUTE_PATH.POST_COMPLAINTS_COMMENT_EDIT,
                    handle: layout({ showAppBar: false }),
                    lazy: async () => {
                      const { ComplaintsCommentEditPage } = await import('@/features/board')
                      return { Component: ComplaintsCommentEditPage }
                    },
                  },
                  {
                    // 글 폼 4개도 AppBar를 화면 안에서 그린다 (완료 버튼 · 뒤로가기 모달)
                    path: ROUTE_PATH.BOARD_COMMUNITY_WRITE,
                    handle: layout({ showAppBar: false }),
                    lazy: async () => {
                      const { CommunityWritePage } = await import('@/features/board')
                      return { Component: CommunityWritePage }
                    },
                  },
                  {
                    path: ROUTE_PATH.BOARD_COMMUNITY_EDIT,
                    handle: layout({ showAppBar: false }),
                    lazy: async () => {
                      const { CommunityEditPage } = await import('@/features/board')
                      return { Component: CommunityEditPage }
                    },
                  },
                  {
                    path: ROUTE_PATH.BOARD_COMPLAINTS_WRITE,
                    handle: layout({ showAppBar: false }),
                    lazy: async () => {
                      const { ComplaintsWritePage } = await import('@/features/board')
                      return { Component: ComplaintsWritePage }
                    },
                  },
                  {
                    path: ROUTE_PATH.BOARD_COMPLAINTS_EDIT,
                    handle: layout({ showAppBar: false }),
                    lazy: async () => {
                      const { ComplaintsEditPage } = await import('@/features/board')
                      return { Component: ComplaintsEditPage }
                    },
                  },
                  {
                    path: ROUTE_PATH.POST_REPORT,
                    handle: layout({ appBarTitle: '게시글 신고' }),
                    lazy: async () => {
                      const { ReportPage } = await import('@/features/board')
                      return { Component: ReportPage }
                    },
                  },
                  {
                    path: ROUTE_PATH.BOARD_SETTING_USER_BLOCK,
                    handle: layout({ appBarTitle: '게시글 미노출 사용자 관리' }),
                    lazy: async () => {
                      const { UserBlockSettingPage } = await import('@/features/board')
                      return { Component: UserBlockSettingPage }
                    },
                  },

                  // ── 주차 (PK1 · PK2 · PK15) ────────────────────────────────
                  // 레거시는 PK1·PK15만 정적 import(eager)였다. 여기서는 셋 다 `lazy`다 —
                  // 주차는 메인/마이페이지에서 들어가는 별도 화면이라 초기 번들에 있을
                  // 이유가 없고, 레거시의 eager/lazy 구분은 화면 동작에 드러나지 않는다.
                  {
                    path: ROUTE_PATH.PARKING,
                    handle: layout({ appBarTitle: '주차 관리' }),
                    lazy: async () => {
                      const { ParkingManagementPage } = await import('@/features/parking')
                      return { Component: ParkingManagementPage }
                    },
                  },
                  {
                    path: ROUTE_PATH.PARKING_MILEAGE_HISTORY,
                    handle: layout({ appBarTitle: '마일리지 내역' }),
                    lazy: async () => {
                      const { MileageHistoryPage } = await import('@/features/parking')
                      return { Component: MileageHistoryPage }
                    },
                  },
                  {
                    // PK1에 임베드되는 것과 **같은 컴포넌트**다. 경로로 자기 모습을 정한다
                    path: ROUTE_PATH.PARKING_REGULAR_CAR,
                    handle: layout({ appBarTitle: '정기권 차량' }),
                    lazy: async () => {
                      const { RegularCarListPage } = await import('@/features/parking')
                      return { Component: RegularCarListPage }
                    },
                  },

                  // ── 주차 — 차량관리 (PK3~PK7) ──────────────────────────────
                  // 목록 2개와 폼 3개가 각각 **한 컴포넌트**다. 어느 화면인지는
                  // 경로 문자열(`bookmark`/`alwaysAllow`, `add`/`edit`)로 갈린다.
                  {
                    path: ROUTE_PATH.PARKING_CAR_BOOKMARK_LIST,
                    handle: layout({ appBarTitle: '즐겨찾기 차량' }),
                    lazy: async () => {
                      const { CarManagementListPage } = await import('@/features/parking')
                      return { Component: CarManagementListPage }
                    },
                  },
                  {
                    path: ROUTE_PATH.PARKING_CAR_ALWAYS_ALLOW_LIST,
                    handle: layout({ appBarTitle: '항상허용 차량' }),
                    lazy: async () => {
                      const { CarManagementListPage } = await import('@/features/parking')
                      return { Component: CarManagementListPage }
                    },
                  },
                  {
                    path: ROUTE_PATH.PARKING_CAR_BOOKMARK_ADD,
                    handle: layout({ appBarTitle: '즐겨찾기 차량 등록' }),
                    lazy: async () => {
                      const { CarManagementFormPage } = await import('@/features/parking')
                      return { Component: CarManagementFormPage }
                    },
                  },
                  {
                    path: ROUTE_PATH.PARKING_CAR_ALWAYS_ALLOW_ADD,
                    handle: layout({ appBarTitle: '항상허용 차량 등록' }),
                    lazy: async () => {
                      const { CarManagementFormPage } = await import('@/features/parking')
                      return { Component: CarManagementFormPage }
                    },
                  },
                  {
                    // ⚠️ 항상허용 수정 라우트는 **만들지 않는다** (R-1)
                    path: ROUTE_PATH.PARKING_CAR_BOOKMARK_EDIT,
                    handle: layout({ appBarTitle: '즐겨찾기 차량 수정' }),
                    lazy: async () => {
                      const { CarManagementFormPage } = await import('@/features/parking')
                      return { Component: CarManagementFormPage }
                    },
                  },

                  // ── 주차 — 입출차·거부 (PK8~PK10) ─────────────────────────
                  {
                    path: ROUTE_PATH.PARKING_INOUT_HISTORY,
                    handle: layout({ appBarTitle: '입출차 내역' }),
                    lazy: async () => {
                      const { InOutHistoryPage } = await import('@/features/parking')
                      return { Component: InOutHistoryPage }
                    },
                  },
                  {
                    // 네이티브 푸시 딥링크가 여기로 들어온다. 경로를 바꾸지 않는다
                    path: ROUTE_PATH.PARKING_INOUT_HISTORY_DETAIL,
                    handle: layout({ appBarTitle: '입출차 차량 상세' }),
                    lazy: async () => {
                      const { InOutHistoryDetailPage } = await import('@/features/parking')
                      return { Component: InOutHistoryDetailPage }
                    },
                  },
                  {
                    path: ROUTE_PATH.PARKING_REJECT,
                    handle: layout({ appBarTitle: '차량 거부' }),
                    lazy: async () => {
                      const { RejectReasonPage } = await import('@/features/parking')
                      return { Component: RejectReasonPage }
                    },
                  },

                  // ── 주차 — 방문예약 (PK11~PK14) ───────────────────────────
                  {
                    path: ROUTE_PATH.PARKING_RESERVATION,
                    handle: layout({ appBarTitle: '방문예약 관리' }),
                    lazy: async () => {
                      const { ReservationListPage } = await import('@/features/parking')
                      return { Component: ReservationListPage }
                    },
                  },
                  {
                    path: ROUTE_PATH.PARKING_RESERVATION_ADD,
                    handle: layout({ appBarTitle: '방문예약 등록' }),
                    lazy: async () => {
                      const { ReservationFormPage } = await import('@/features/parking')
                      return { Component: ReservationFormPage }
                    },
                  },
                  {
                    // 같은 컴포넌트다. `uuid`가 있으면 기존 예약에서 초기값을 가져온다
                    path: ROUTE_PATH.PARKING_RESERVATION_AGAIN,
                    handle: layout({ appBarTitle: '방문예약 재등록' }),
                    lazy: async () => {
                      const { ReservationFormPage } = await import('@/features/parking')
                      return { Component: ReservationFormPage }
                    },
                  },
                  {
                    // AppBar를 화면 안에서 그린다 — 우측 `삭제` 버튼 때문이다
                    path: ROUTE_PATH.PARKING_RESERVATION_DETAIL,
                    handle: layout({ showAppBar: false }),
                    lazy: async () => {
                      const { ReservationDetailPage } = await import('@/features/parking')
                      return { Component: ReservationDetailPage }
                    },
                  },

                  // ── 방문자 출입관리 (V1~V3) ───────────────────────────────
                  {
                    // ⚠️ 이 도메인에만 있는 meta다 — AppBar 배경을 hex로 지정한다
                    path: ROUTE_PATH.VISIT,
                    handle: layout({
                      appBarTitle: '방문자 출입관리',
                      backPath: ROUTE_PATH.MAIN,
                      appBarBackgroundColor: '#f9fafb',
                    }),
                    lazy: async () => {
                      const { VisitListPage } = await import('@/features/visit')
                      return { Component: VisitListPage }
                    },
                  },
                  {
                    path: ROUTE_PATH.VISIT_KIOSK_PASSWORD,
                    handle: layout({ appBarTitle: '방문증 키오스크 설정' }),
                    lazy: async () => {
                      const { KioskPasswordPage } = await import('@/features/visit')
                      return { Component: KioskPasswordPage }
                    },
                  },
                  {
                    // AppBar를 화면 안에서 그린다 — 우측 설정 아이콘 + 뒤로가기를 `/visit` 고정
                    path: ROUTE_PATH.VISIT_LOBBY_PHONE,
                    handle: layout({ showAppBar: false }),
                    lazy: async () => {
                      const { LobbyPhonePage } = await import('@/features/visit')
                      return { Component: LobbyPhonePage }
                    },
                  },
                  {
                    // ⚠️ 라우트 name은 `임시비밀번호 리스트`인데 **AppBar는 `임시 비밀번호`**다
                    path: ROUTE_PATH.VISIT_TEMP_PASSWORD_LIST,
                    handle: layout({
                      appBarTitle: '임시 비밀번호',
                      appBarBackgroundColor: '#f9fafb',
                    }),
                    lazy: async () => {
                      const { TempPasswordListPage } = await import('@/features/visit')
                      return { Component: TempPasswordListPage }
                    },
                  },
                  {
                    path: ROUTE_PATH.VISIT_TEMP_PASSWORD_CREATE,
                    handle: layout({ appBarTitle: '임시 비밀번호 생성' }),
                    lazy: async () => {
                      const { TempPasswordCreatePage } = await import('@/features/visit')
                      return { Component: TempPasswordCreatePage }
                    },
                  },
                  {
                    path: ROUTE_PATH.VISIT_QR,
                    handle: layout({
                      appBarTitle: '로비 QR 코드',
                      appBarBackgroundColor: '#f9fafb',
                    }),
                    lazy: async () => {
                      const { LobbyPhoneQrPage } = await import('@/features/visit')
                      return { Component: LobbyPhoneQrPage }
                    },
                  },

                  // ── A-PASS (AP1) ──────────────────────────────────────────
                  {
                    // ⚠️ 화면이 자기 AppBar를 든다 — 헤더 그라데이션 위에 투명하게 얹는다.
                    // 레거시 meta의 `appBarTitle`·`hasBackButton`은 `showAppBar:false`라
                    // 무시되는 값이었다 (`deferred.md` D-8) — 옮기지 않았다
                    path: ROUTE_PATH.APASS,
                    handle: layout({ showAppBar: false }),
                    lazy: async () => {
                      const { ApassPage } = await import('@/features/apass')
                      return { Component: ApassPage }
                    },
                  },

                  // ── 설문조사 (SV1·SV2) ────────────────────────────────────
                  {
                    // 레거시에서 eager로 등록된 두 화면 중 하나다(투표 목록과 함께).
                    // 타깃은 전 라우트 lazy 원칙을 따른다 — 화면은 같다
                    path: ROUTE_PATH.SURVEY_LIST,
                    handle: layout({ appBarTitle: '설문조사', backPath: ROUTE_PATH.MAIN }),
                    lazy: async () => {
                      const { SurveyListPage } = await import('@/features/survey')
                      return { Component: SurveyListPage }
                    },
                  },
                  {
                    path: ROUTE_PATH.SURVEY_DETAIL,
                    handle: layout({
                      appBarTitle: '설문조사 개요',
                      backPath: ROUTE_PATH.SURVEY_LIST,
                    }),
                    lazy: async () => {
                      const { SurveyDetailPage } = await import('@/features/survey')
                      return { Component: SurveyDetailPage }
                    },
                  },

                  {
                    // ⚠️ 화면도 AppBar를 그린다 — 투표(VT3)와 같은 중첩이다 (SV-Q1)
                    path: ROUTE_PATH.SURVEY_FORM,
                    handle: layout({
                      appBarTitle: '설문조사 참여',
                      backPath: ROUTE_PATH.SURVEY_LIST,
                    }),
                    lazy: async () => {
                      const { SurveyFormPage } = await import('@/features/survey')
                      return { Component: SurveyFormPage }
                    },
                  },
                  {
                    path: ROUTE_PATH.SURVEY_CERT_PASS_RESPONSE,
                    handle: layout({ showAppBar: false }),
                    lazy: async () => {
                      const { SurveyCertPassResponsePage } = await import('@/features/survey')
                      return { Component: SurveyCertPassResponsePage }
                    },
                  },
                  {
                    path: ROUTE_PATH.SURVEY_CERT_NAME_PHONE,
                    handle: layout({ appBarTitle: '본인인증' }),
                    lazy: async () => {
                      const { SurveyCertNamePhonePage } = await import('@/features/survey')
                      return { Component: SurveyCertNamePhonePage }
                    },
                  },
                  {
                    path: ROUTE_PATH.SURVEY_COMPLETED,
                    handle: layout({ showAppBar: false }),
                    lazy: async () => {
                      const { SurveyCompletedPage } = await import('@/features/survey')
                      return { Component: SurveyCompletedPage }
                    },
                  },

                  // ── 전자투표 (VT1·VT2) ────────────────────────────────────
                  {
                    // ⚠️ **레거시에서 유일하게 eager로 등록된 화면**이다. 메인 메뉴와
                    // 미완료 투표 팝업이 곧바로 보내는 자리라 그렇게 뒀다.
                    // 타깃은 전 라우트 lazy 원칙(`08-routing`)을 따른다 — 첫 진입에
                    // 청크 하나를 더 받을 뿐 화면은 같다.
                    path: ROUTE_PATH.VOTE_LIST,
                    handle: layout({ appBarTitle: '전자투표', backPath: ROUTE_PATH.MAIN }),
                    lazy: async () => {
                      const { VoteListPage } = await import('@/features/vote')
                      return { Component: VoteListPage }
                    },
                  },
                  {
                    // 비회원은 `/vote/{voterUuid}`로 같은 화면을 본다 — opinion 엔트리와 함께 붙인다
                    path: ROUTE_PATH.VOTE_DETAIL,
                    handle: layout({
                      appBarTitle: '전자투표 개요',
                      backPath: ROUTE_PATH.VOTE_LIST,
                    }),
                    lazy: async () => {
                      const { VoteDetailPage } = await import('@/features/vote')
                      return { Component: VoteDetailPage }
                    },
                  },

                  {
                    // ⚠️ **화면도 AppBar를 그린다.** 여기 `showAppBar`를 끄면 뒤로가기
                    // 동작이 바뀌므로 레거시대로 둘 다 켠 상태를 유지한다 (VT-Q1)
                    path: ROUTE_PATH.VOTE_FORM,
                    handle: layout({
                      appBarTitle: '전자투표 참여',
                      backPath: ROUTE_PATH.VOTE_LIST,
                    }),
                    lazy: async () => {
                      const { VoteFormPage } = await import('@/features/vote')
                      return { Component: VoteFormPage }
                    },
                  },
                  {
                    // KMC가 POST 리다이렉트로 도착시키는 자리다. 화면은 모달뿐이다
                    path: ROUTE_PATH.VOTE_CERT_PASS_RESPONSE,
                    handle: layout({ showAppBar: false }),
                    lazy: async () => {
                      const { VoteCertPassResponsePage } = await import('@/features/vote')
                      return { Component: VoteCertPassResponsePage }
                    },
                  },
                  {
                    path: ROUTE_PATH.VOTE_CERT_NAME_PHONE,
                    handle: layout({ appBarTitle: '본인인증' }),
                    lazy: async () => {
                      const { VoteCertNamePhonePage } = await import('@/features/vote')
                      return { Component: VoteCertNamePhonePage }
                    },
                  },
                  {
                    path: ROUTE_PATH.VOTE_COMPLETED,
                    handle: layout({ showAppBar: false }),
                    lazy: async () => {
                      const { VoteCompletedPage } = await import('@/features/vote')
                      return { Component: VoteCompletedPage }
                    },
                  },

                  // ── 안면인식 위저드 (V7~V13) ──────────────────────────────
                  // ⚠️ **V10~V13은 AppBar 제목이 `얼굴 신규 등록`으로 전부 같다.**
                  // 위저드 단계가 제목으로 드러나지 않는다 — 레거시 그대로다.
                  {
                    path: ROUTE_PATH.VISIT_FACE_REGISTER_MANAGEMENT,
                    handle: layout({
                      appBarTitle: '안면인식 얼굴 등록',
                      backPath: ROUTE_PATH.VISIT_LOBBY_PHONE,
                    }),
                    lazy: async () => {
                      const { FaceRegisterManagementPage } = await import('@/features/visit')
                      return { Component: FaceRegisterManagementPage }
                    },
                  },
                  {
                    path: ROUTE_PATH.VISIT_FACE_REGISTER_DETAIL,
                    handle: layout({
                      appBarTitle: '등록정보 상세',
                      backPath: ROUTE_PATH.VISIT_FACE_REGISTER_MANAGEMENT,
                    }),
                    lazy: async () => {
                      const { FaceRegisterDetailPage } = await import('@/features/visit')
                      return { Component: FaceRegisterDetailPage }
                    },
                  },
                  {
                    path: ROUTE_PATH.VISIT_FACE_REGISTER_EDIT,
                    handle: layout({ appBarTitle: '등록정보 수정' }),
                    lazy: async () => {
                      const { FaceRegisterEditPage } = await import('@/features/visit')
                      return { Component: FaceRegisterEditPage }
                    },
                  },
                  {
                    path: ROUTE_PATH.VISIT_FACE_REGISTER_FORM,
                    handle: layout({ appBarTitle: '얼굴 신규 등록' }),
                    lazy: async () => {
                      const { FaceRegisterFormPage } = await import('@/features/visit')
                      return { Component: FaceRegisterFormPage }
                    },
                  },
                  {
                    path: ROUTE_PATH.VISIT_FACE_REGISTER_GUIDE,
                    handle: layout({ appBarTitle: '얼굴 신규 등록' }),
                    lazy: async () => {
                      const { FaceRegisterGuidePage } = await import('@/features/visit')
                      return { Component: FaceRegisterGuidePage }
                    },
                  },
                  {
                    // 뒤로가기 버튼이 없다. 네이티브 뒤로가기는 막지 않는다(레거시 그대로)
                    path: ROUTE_PATH.VISIT_FACE_REGISTER_FAIL,
                    handle: layout({ appBarTitle: '얼굴 신규 등록', hasBackButton: false }),
                    lazy: async () => {
                      const { FaceRegisterFailPage } = await import('@/features/visit')
                      return { Component: FaceRegisterFailPage }
                    },
                  },
                  {
                    path: ROUTE_PATH.VISIT_FACE_REGISTER_COMPLETE,
                    handle: layout({ appBarTitle: '얼굴 신규 등록', hasBackButton: false }),
                    lazy: async () => {
                      const { FaceRegisterCompletePage } = await import('@/features/visit')
                      return { Component: FaceRegisterCompletePage }
                    },
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
