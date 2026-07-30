/**
 * 네이티브 브릿지 타입 문자열. 레거시 `src/constants/nativeKeys.js`와 **키·값이 동일하다.**
 *
 * ⚠️ **앱 계약이다.** 앱은 이미 사용자 기기에 배포돼 있고 이번 이관 범위가 아니므로
 * 웹이 앱에 맞춘다 (`docs/migration/native-protocol.md` §0).
 * 한 글자라도 바꾸면 해당 기능이 조용히 죽는다.
 */

/** iOS WKWebView 메시지 핸들러 이름 · Android 주입 객체 이름. 둘이 같은 문자열이다. */
export const NATIVE_HANDLER = 'JsInterface'

/** Web → App (17종). 네이밍 규칙: `action_target`, 단순 전송은 `SEND_` 접두 */
export const TO_NATIVE = {
  /** [공통] 앱 버전 요청 → `CALLBACK_APP_VERSION`으로 수신 */
  GET_APP_VERSION: 'GET_APP_VERSION',
  /** [공통] 디바이스 권한 설정 화면으로 이동 요청 */
  GO_APP_PERMISSION: 'GO_APP_PERMISSION',
  /** [공통] 디바이스 권한 정보 요청 → `CALLBACK_PERMISSION_INFO`로 수신 */
  GET_PERMISSION_INFO: 'GET_PERMISSION_INFO',
  /** [공통] 앱 종료 요청 */
  EXIT_APP: 'EXIT_APP',
  /** [공통] 로그아웃 요청 */
  LOGOUT_APP: 'LOGOUT_APP',
  /** [공통] 프론트 버전이 서버와 다를 때 캐시 삭제 요청 */
  CLEAR_APP_CACHE: 'CLEAR_APP_CACHE',
  /** [공통] 외부 브라우저로 열기 */
  OPEN_SYSTEM_BROWSER: 'OPEN_SYSTEM_BROWSER',
  /** [공통] 앱 내부에 새 웹뷰 열기 */
  OPEN_NEW_WEBVIEW: 'OPEN_NEW_WEBVIEW',
  /** [첫 진입] 스플래시 종료 요청 */
  END_SPLASH: 'END_SPLASH',
  /** [첫 로그인] 입주민 정보 발신 */
  SEND_INITIAL_RESIDENT_INFO: 'SEND_INITIAL_RESIDENT_INFO',
  /** [단지 변경] 변경된 입주민 정보 발신 */
  SEND_CHANGED_RESIDENT_INFO: 'SEND_CHANGED_RESIDENT_INFO',
  /** [게시판] 파일 저장 요청 */
  SAVE_FILE: 'SAVE_FILE',
  /** [A-PASS] 활성/비활성 요청 → `CALLBACK_APASS_STATE`로 수신 */
  SET_APASS_STATE: 'SET_APASS_STATE',
  /** [로비폰] sip 상태 요청 → `CALLBACK_LOBBYPHONE_SIP_STATE`로 수신 */
  GET_LOBBYPHONE_SIP_STATE: 'GET_LOBBYPHONE_SIP_STATE',
  /** [로비폰] 경비원 호출 */
  CALL_LOBBYPHONE_GUARD: 'CALL_LOBBYPHONE_GUARD',
  /** [로비폰] QR 정보 발신 */
  SEND_LOBBYPHONE_QR_INFO: 'SEND_LOBBYPHONE_QR_INFO',
  /** [안면인식] 네이티브 카메라 열기 → `CALLBACK_FACE_IMAGE`로 수신 */
  OPEN_FACE_CAMERA: 'OPEN_FACE_CAMERA',
} as const

/**
 * App → Web (7종). 네이밍 규칙: `CALLBACK_action_target`.
 * 앱이 `window.CALLBACK_*(jsonString)` **전역 함수를 직접 호출**한다.
 */
export const FROM_NATIVE = {
  CALLBACK_APP_VERSION: 'CALLBACK_APP_VERSION',
  CALLBACK_GO_BACK: 'CALLBACK_GO_BACK',
  CALLBACK_PERMISSION_INFO: 'CALLBACK_PERMISSION_INFO',
  CALLBACK_PUSH_ALARM: 'CALLBACK_PUSH_ALARM',
  CALLBACK_APASS_STATE: 'CALLBACK_APASS_STATE',
  CALLBACK_LOBBYPHONE_SIP_STATE: 'CALLBACK_LOBBYPHONE_SIP_STATE',
  CALLBACK_FACE_IMAGE: 'CALLBACK_FACE_IMAGE',
} as const

/**
 * 웹 내부 전용 이벤트. 앱이 보내는 것이 아니다.
 *
 * 레거시는 `CALLBACK_PUSH_ALARM` 콜백 안에서 라우터 싱글턴을 직접 import해
 * `router.push()`를 불렀다(순환 의존). 이관본은 이벤트만 발행하고
 * 라우터를 가진 쪽이 소비한다 (`native-protocol.md` C4).
 */
export const NATIVE_INTERNAL = {
  /** 푸시 딥링크 경로가 확정됐을 때 */
  PUSH_ALARM_DEEP_LINK: 'PUSH_ALARM_DEEP_LINK',
} as const

/** 푸시 알림 종류별 딥링크 경로. **경로 문자열은 앱·서버와의 계약이다** */
export const PUSH_ALARM_DEEP_LINK_PATH = {
  NOTICE: '/board/notice/detail',
  IN_OUT_PARKING: '/parking/inoutHistory/detail',
} as const

/** `SAVE_FILE`의 다운로드 타입 */
export const SAVE_FILE_TYPE = {
  FILE: 'file',
  IMAGE: 'image',
} as const
