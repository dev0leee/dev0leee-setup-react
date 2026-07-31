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
  /** 관리비 상세 (메인 관리비 카드) */
  MANAGEMENT_FEE_DETAIL: '/managementFee/detail',

  // ── 전자투표 (VT1~VT10) ───────────────────────────────────────────────────
  // 목록(`VOTE_LIST`)은 메인 메뉴가 먼저 참조해 아래 메뉴 구획에 있다.
  /**
   * 회원 상세. **비회원은 `/vote/{voterUuid}`로 들어온다** — 두 경로가 같은 화면을
   * 그린다. 합치면 `/vote/detail`이 `/vote/:voterUuid`에 먼저 잡혀 충돌한다.
   */
  VOTE_DETAIL: '/vote/detail/:voteUuid/:voterUuid',

  // 아래 화면들은 아직 없다 — VT2 하단 버튼이 참조해 먼저 상수로 둔다 (PR2·PR3)
  VOTE_FORM: '/vote/form/:voterUuid',
  VOTE_COMPLETED: '/vote/completed',
  VOTE_CERT_PASS_RESPONSE: '/vote/certification/pass/response',
  VOTE_CERT_NAME_PHONE: '/vote/certification/namePhone',
  /**
   * 시작전·종료 안내. **opinion 앱에만 있는 화면**이다 — 메인 앱은 상세에 머물며
   * 비활성 버튼을 보여준다. 상세가 비회원일 때만 이 경로로 보낸다.
   */
  VOTE_BEFORE: '/vote/before',
  VOTE_FINISH: '/vote/finish',

  // ── 설문조사 (SV1~SV9) ────────────────────────────────────────────────────
  // 목록(`SURVEY_LIST`)은 메인 메뉴가 먼저 참조해 아래 메뉴 구획에 있다.
  /** 회원 상세. 비회원은 `/survey/{participantUuid}`로 들어온다 */
  SURVEY_DETAIL: '/survey/detail/:surveyUuid/:participantUuid',
  SURVEY_FORM: '/survey/form/:participantUuid',
  SURVEY_COMPLETED: '/survey/completed',
  SURVEY_CERT_PASS_RESPONSE: '/survey/certification/pass/response',
  SURVEY_CERT_NAME_PHONE: '/survey/certification/namePhone',
  /** 시작전·종료 안내. **opinion 앱에만 있는 화면**이다 (투표와 같다) */
  SURVEY_BEFORE: '/survey/before',
  SURVEY_FINISH: '/survey/finish',

  // ── 방문자 출입관리 (V1~V13) ───────────────────────────────────────────────
  /** 허브. 메인 방문 출입관리 카드가 유일한 진입점이다 */
  VISIT: '/visit',
  /** 방문증 키오스크 비밀번호 확인·변경 */
  VISIT_KIOSK_PASSWORD: '/visit/kiosk/password',
  /** 로비폰 세대호출. ⚠️ **뒤로가기가 히스토리가 아니라 항상 `/visit`다** */
  VISIT_LOBBY_PHONE: '/visit/lobbyPhone',
  VISIT_TEMP_PASSWORD_LIST: '/visit/lobbyPhone/tempPassword/list',
  VISIT_TEMP_PASSWORD_CREATE: '/visit/lobbyPhone/tempPassword/create',
  VISIT_QR: '/visit/lobbyPhone/qr',

  // 안면인식 7화면(V7~V13). ⚠️ **관리 화면만 `faceRegisterManagement`이고
  // 나머지는 `faceRegister/...`다** — 경로 규칙이 하나 어긋나 있다. 레거시 그대로다.
  VISIT_FACE_REGISTER_MANAGEMENT: '/visit/lobbyPhone/faceRegisterManagement',
  VISIT_FACE_REGISTER_DETAIL: '/visit/lobbyPhone/faceRegister/detail/:id',
  VISIT_FACE_REGISTER_EDIT: '/visit/lobbyPhone/faceRegister/edit/:id',
  VISIT_FACE_REGISTER_FORM: '/visit/lobbyPhone/faceRegister/form',
  VISIT_FACE_REGISTER_GUIDE: '/visit/lobbyPhone/faceRegister/guide',
  VISIT_FACE_REGISTER_FAIL: '/visit/lobbyPhone/faceRegister/fail',
  VISIT_FACE_REGISTER_COMPLETE: '/visit/lobbyPhone/faceRegister/complete',

  // ── 주차 (PK1·PK2·PK15) ───────────────────────────────────────────────────
  /** 주차 관리. 메인 메뉴 스와이퍼·마이페이지에서 들어온다 */
  PARKING: '/parking',
  /** 마일리지 내역. PK1 헤더·메인 마일리지 카드·마이페이지에서 들어온다 */
  PARKING_MILEAGE_HISTORY: '/parking/mileage/history',
  /** 정기권 차량. **PK1에 임베드되기도 한다** — 화면이 경로로 자기 모습을 정한다 */
  PARKING_REGULAR_CAR: '/parking/regular-car',

  // 차량관리 5화면(PK3~PK7). **경로 문자열에 `bookmark`/`alwaysAllow`가 들어 있는지로
  // 화면이 갈린다** — 라우트 파라미터가 아니라서 경로를 바꾸면 동작이 바뀐다.
  PARKING_CAR_BOOKMARK_LIST: '/parking/carManagement/bookmark/list',
  PARKING_CAR_ALWAYS_ALLOW_LIST: '/parking/carManagement/alwaysAllow/list',
  PARKING_CAR_BOOKMARK_ADD: '/parking/carManagement/bookmark/add',
  PARKING_CAR_ALWAYS_ALLOW_ADD: '/parking/carManagement/alwaysAllow/add',
  /** ⚠️ **즐겨찾기 수정만 있다.** 항상허용 수정은 라우트도 API도 없다 (R-1) */
  PARKING_CAR_BOOKMARK_EDIT: '/parking/carManagement/bookmark/edit/:uuid',

  /** 입출차 내역 (주차 메뉴) */
  PARKING_INOUT_HISTORY: '/parking/inoutHistory',
  /** 입출차 차량 상세. **네이티브 푸시 딥링크의 도착지다** — 경로를 바꾸지 않는다 */
  PARKING_INOUT_HISTORY_DETAIL: '/parking/inoutHistory/detail/:uuid',
  /** 차량 거부. 차량번호는 **라우터 state**로만 온다 (`parking.md` §PK10) */
  PARKING_REJECT: '/parking/reject/:uuid',

  // 방문예약 4화면(PK11~PK14). 메인 카드·주차 메뉴에서 목록으로 들어온다
  PARKING_RESERVATION: '/parking/reservation',
  /** 등록. `/add/:uuid`면 **재등록**이 된다 — 파라미터 하나로 갈린다 */
  PARKING_RESERVATION_ADD: '/parking/reservation/add',
  PARKING_RESERVATION_AGAIN: '/parking/reservation/add/:uuid',
  /** ⚠️ 여기만 `showAppBar:false`다 — 우측 `삭제` 버튼 때문에 화면이 직접 그린다 */
  PARKING_RESERVATION_DETAIL: '/parking/reservation/detail/:uuid',

  // 메인 메뉴 스와이퍼가 참조하는 경로 (`features/main/constants/swiperMenu.ts`)
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

/**
 * 차량관리 경로의 공통 앞부분. 화면이 `{base}/{종류}/add|edit/{uuid}`를 조립한다 —
 * 종류가 런타임에 정해져서 상수 하나로는 표현할 수 없다.
 */
export const PARKING_CAR_MANAGEMENT_BASE = '/parking/carManagement'

/** 차량 거부 경로의 앞부분. 뒤에 입출차 건의 uuid가 붙는다 */
export const PARKING_REJECT_BASE = '/parking/reject'

/** 방문예약 경로의 앞부분. 뒤에 `/add`·`/add/{uuid}`·`/detail/{uuid}`가 붙는다 */
export const PARKING_RESERVATION_BASE = '/parking/reservation'

/** 회원 투표 상세(VT2). 비회원 경로는 `getVoteDetailPath`가 만든다 */
export const voteDetailPath = ({
  voteUuid,
  voterUuid,
}: {
  voteUuid: string
  voterUuid: string
}): string => {
  return `/vote/detail/${voteUuid}/${voterUuid}`
}

/** 회원 설문 상세(SV2). 비회원 경로는 `getSurveyDetailPath`가 만든다 */
export const surveyDetailPath = ({
  surveyUuid,
  participantUuid,
}: {
  surveyUuid: string
  participantUuid: string
}): string => {
  return `/survey/detail/${surveyUuid}/${participantUuid}`
}

/** 설문 참여 폼(SV3) */
export const surveyFormPath = ({ participantUuid }: { participantUuid: string }): string => {
  return `/survey/form/${participantUuid}`
}

/** 투표 참여 폼(VT3). 회원·비회원이 같은 경로를 쓴다 */
export const voteFormPath = ({ voterUuid }: { voterUuid: string }): string => {
  return `/vote/form/${voterUuid}`
}

/** 안면인식 등록정보 상세(V8). 경로에 `faceRecogGuid`가 박힌다 */
export const faceRegisterDetailPath = ({ guid }: { guid: string }): string => {
  return `/visit/lobbyPhone/faceRegister/detail/${guid}`
}

/** 안면인식 등록정보 수정(V9) */
export const faceRegisterEditPath = ({ guid }: { guid: string }): string => {
  return `/visit/lobbyPhone/faceRegister/edit/${guid}`
}

/** 공지 상세. `uuid`가 경로에 박히므로 함수로 만든다 */
export const boardNoticeDetailPath = ({ uuid }: { uuid: string }): string => {
  return `${ROUTE_PATH.BOARD_NOTICE}/detail/${uuid}`
}

/** 아파트먼트 공지 상세 */
export const globalNoticeDetailPath = ({ uuid }: { uuid: string }): string => {
  return `${ROUTE_PATH.BOARD_GLOBAL_NOTICE}/detail/${uuid}`
}
