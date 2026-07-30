/**
 * 라우트 경로. 컴포넌트에 하드코딩하지 않는다 (12-constants).
 * 라우트 정의(`app/router.tsx`)와 이동하는 쪽이 같은 상수를 참조한다.
 *
 * ⚠️ **경로 문자열을 바꾸지 않는다.** 외부 딥링크·푸시 알림·앱 내 하드코딩이
 * 이 값에 의존한다 (`docs/migration/routes.md`).
 */
export const ROUTE_PATH = {
  /** 리다이렉트용 루트. 레거시는 여기서 인트로/메인으로 갈린다 */
  HOME: '/',
  /** 앱의 실질적 진입점이자 로그인 화면. 별도 `/login` 경로는 없다 */
  INTRO: '/intro',
  MAIN: '/main',
  /** 로그인은 됐지만 세대 승인이 안 된 상태 */
  LOGIN_PENDING: '/login/pending',
  /** 버전1 사용자의 약관 재동의 */
  VERSION_ONE_TERMS: '/versionOne/terms',

  /** 비밀번호 재설정을 위한 휴대폰 인증 (`auth.md` A2) */
  PASSWORD_CERT: '/password/cert',
  /** 새 비밀번호 입력. 인증 토큰을 state로 받아야 열린다 (`auth.md` A3) */
  PASSWORD_RESET: '/password/reset',
  /** 가입 위저드 1단계. 인트로가 링크하지만 화면은 SignUp 이관에서 만든다 */
  SIGNUP_TERMS: '/signup/terms',

  /** 일시적 오류 안내. 미인증 상태로도 열린다 */
  ERROR: '/error',
  /** 같은 화면이지만 인증 레이아웃 하위라 하단 탭이 보인다 (`exception.md` E2) */
  ERROR_AUTH: '/error-auth',

  // ── 마이페이지 ──────────────────────────────────────────────────────────────
  MYPAGE: '/mypage',
  MYPAGE_PROFILE: '/mypage/profile',
  MYPAGE_PROFILE_EDIT: '/mypage/profile/edit',
  MYPAGE_ALARM_SETTING: '/mypage/alarmSetting',
  /** 관리사무소. 경로가 `aptInfo`인 것은 레거시 그대로다 */
  MYPAGE_APT_INFO: '/mypage/aptInfo',
  MYPAGE_TERMS_OF_USE: '/mypage/termsOfUse',
  MYPAGE_FONT_SIZE_SETTING: '/mypage/fontSizeSetting',
  MYPAGE_ACCOUNT_DELETION: '/mypage/accountDeletion',
  /** 화면이 아니라 확인 모달만 띄우는 라우트다 (`auth.md` A7) */
  LOGOUT: '/logout',

  /** 약관 본문. `:termsId`에 `TERMS_ITEMS`의 id가 들어간다 */
  TERMS_OF_USE_DETAIL: '/termsOfUse',

  /**
   * 소방 자가점검 완료. **화면은 FireInspection 이관 때 온다** —
   * 지금은 뒤로가기 차단 목록(`app/navigationBlocking.ts`)이 이 경로를 참조한다.
   */
  FIRE_INSPECTION_COMPLETE: '/fire-inspection/complete',
} as const
