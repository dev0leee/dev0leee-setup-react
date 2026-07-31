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
  /** 버전1 전환의 KMC 콜백 랜딩 */
  VERSION_ONE_TERMS_RESPONSE: '/versionOne/terms/response',

  /** 비밀번호 재설정을 위한 휴대폰 인증 (`auth.md` A2) */
  PASSWORD_CERT: '/password/cert',
  /** 새 비밀번호 입력. 인증 토큰을 state로 받아야 열린다 (`auth.md` A3) */
  PASSWORD_RESET: '/password/reset',
  // ── 회원가입 위저드 (4단계) ─────────────────────────────────────────────────
  /** 1단계 — 약관 동의. 인트로의 `회원가입`이 여기로 온다 */
  SIGNUP_TERMS: '/signup/terms',
  /** 2단계 — KMC 본인인증 콜백 랜딩. 화면 요소가 없다 */
  SIGNUP_CERT_RESPONSE: '/signup/certification/response',
  /** 3단계 — 이름·닉네임·비밀번호 */
  SIGNUP_INFO_USER: '/signup/info/user',
  /** 4단계 — 아파트·동·호수·세대주 여부 */
  SIGNUP_INFO_APT: '/signup/info/apt',
  /** 완료 — 승인 대기 안내 */
  SIGNUP_COMPLETED: '/signup/completed',

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

  // ── 아직 화면이 이관되지 않은 경로 ─────────────────────────────────────────
  //
  // ⚠️ **여기 있는 경로는 라우트 정의가 없다.** 이미 이관된 화면(메인 카드·메뉴 등)이
  // 이동 대상으로 참조하기 때문에 먼저 상수로 둔다. 지금 누르면 404다.
  // 해당 도메인을 이관할 때 라우트를 붙이고 이 구획에서 뺀다.

  /** 소방 자가점검 완료. 뒤로가기 차단 목록(`app/navigationBlocking.ts`)이 참조한다 */
  FIRE_INSPECTION_COMPLETE: '/fire-inspection/complete',
  /** A-PASS (메인 A-PASS 카드) */
  APASS: '/apass',
  /** 방문자 출입관리 (메인 방문 출입관리 카드) */
  VISIT: '/visit',
  /** 주차 방문예약 (메인 주차 방문예약 카드) */
  PARKING_RESERVATION: '/parking/reservation',
  /** 주차 마일리지 내역 (메인 마일리지 카드) */
  PARKING_MILEAGE_HISTORY: '/parking/mileage/history',
  /** 관리비 상세 (메인 관리비 카드) */
  MANAGEMENT_FEE_DETAIL: '/managementFee/detail',

  // 메인 메뉴 스와이퍼가 참조하는 경로 (`features/main/constants/swiperMenu.ts`)
  /** 주차관리 */
  PARKING: '/parking',
  /** 소통공간 게시판 */
  BOARD_COMMUNITY: '/board/community',
  /** 민원공간 게시판 */
  BOARD_COMPLAINTS: '/board/complaints',
  /** 소통공간 내 활동 */
  BOARD_COMMUNITY_ACTIVITIES: '/board/community/activities',
  /** 민원공간 내 활동 */
  BOARD_COMPLAINTS_ACTIVITIES: '/board/complaints/activities',
  BOARD_COMMUNITY_DETAIL: '/board/community/detail/:postUuid',
  BOARD_COMPLAINTS_DETAIL: '/board/complaints/detail/:postUuid',

  // ⚠️ 댓글 화면만 접두사가 **`/post`**다 (`/board`가 아니다). 레거시 그대로 유지한다
  /** 소통공간 답글 작성. `commentIndex`는 쓰지 않지만 경로에 남아 있다 */
  POST_COMMUNITY_COMMENT_REPLY:
    '/post/community/comment/reply/:postUuid/:commentUuid/:commentIndex',
  POST_COMPLAINTS_COMMENT_REPLY:
    '/post/complaints/comment/reply/:postUuid/:commentUuid/:commentIndex',
  POST_COMMUNITY_COMMENT_EDIT: '/post/community/comment/edit/:postUuid/:commentUuid',
  POST_COMPLAINTS_COMMENT_EDIT: '/post/complaints/comment/edit/:postUuid/:commentUuid',
  /** 게시글 신고. 어느 게시판인지는 **라우터 state**로 받는다 (`board.md` §5-13) */
  POST_REPORT: '/post/report/:postUuid',

  BOARD_COMMUNITY_WRITE: '/board/community/write',
  BOARD_COMMUNITY_EDIT: '/board/community/edit/:postUuid',
  BOARD_COMPLAINTS_WRITE: '/board/complaints/write',
  BOARD_COMPLAINTS_EDIT: '/board/complaints/edit/:postUuid',
  /** 게시글 미노출 사용자 관리. 마이페이지에서 들어온다 */
  BOARD_SETTING_USER_BLOCK: '/board/setting/userBlock',
  /** 하자보수 */
  REPAIR_LIST: '/repair/list',
  /** 이사예약 */
  MOVING_HOUSE_LIST: '/movingHouse/list',
  /** 전자투표 */
  VOTE_LIST: '/vote/list',
  /** 조식예약 */
  APT_MALL_MY_ORDER: '/aptMall/myOrder',
  /** 설문조사 */
  SURVEY_LIST: '/survey/list',
  /** 공동 현관(로비폰) */
  VISIT_LOBBY_PHONE: '/visit/lobbyPhone',
  /** 소방 자가점검 */
  FIRE_INSPECTION: '/fire-inspection',

  // ── 게시판 — 공지 계보 (B1~B4) ─────────────────────────────────────────────
  /** 공지사항 목록. 메인 공지 Top3·마이페이지에서 들어온다 */
  BOARD_NOTICE: '/board/notice',
  /** 공지사항 상세. **네이티브 푸시 딥링크의 도착지다** */
  BOARD_NOTICE_DETAIL: '/board/notice/detail/:noticeUuid',
  /** 아파트먼트 공지사항 목록 */
  BOARD_GLOBAL_NOTICE: '/board/global-notice',
  BOARD_GLOBAL_NOTICE_DETAIL: '/board/global-notice/detail/:globalNoticeUuid',
} as const

/** 공지 상세. `uuid`가 경로에 박히므로 함수로 만든다 */
export const boardNoticeDetailPath = ({ uuid }: { uuid: string }): string => {
  return `${ROUTE_PATH.BOARD_NOTICE}/detail/${uuid}`
}

/** 아파트먼트 공지 상세 */
export const globalNoticeDetailPath = ({ uuid }: { uuid: string }): string => {
  return `${ROUTE_PATH.BOARD_GLOBAL_NOTICE}/detail/${uuid}`
}
