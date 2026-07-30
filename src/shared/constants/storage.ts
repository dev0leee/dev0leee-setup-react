/**
 * localStorage 키. **레거시와 한 글자도 달라선 안 된다.**
 *
 * 전환 시 이미 앱을 깔아둔 사용자의 저장값을 그대로 이어받아야 한다.
 * 키 이름이나 직렬화 방식이 바뀌면 전 사용자가 로그아웃된다
 * (`docs/migration/decisions/auth-strategy.md` R13).
 */
export const STORAGE_KEY = {
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
  /** 로그인 응답의 사용자 정보 */
  AUTH_USER: 'authUser',
  /** 자동 로그인용 아이디·비밀번호 (평문 — `deferred.md` D-15) */
  USER_AUTH_INFO: 'userAuthInfo',
  /** 선택된 단지 컨텍스트. 거의 모든 쿼리 키가 여기서 값을 가져온다 */
  APT_INFO: 'aptInfo',
  /** 접근성 폰트 배율 */
  FONT_SIZE: 'fontSize',
  /** 비회원 설문 본인인증 정보 */
  SURVEY_CERT_INFO: 'surveyCertInfo',
  /** 비회원 투표 본인인증 정보 */
  VOTE_CERT_INFO: 'voteCertInfo',
} as const

/**
 * 레거시 `clearAuth()`가 "혹시 남아있을 수 있는" 값으로 함께 지우던 키.
 * 지금은 아무도 쓰지 않지만, 지우는 동작까지 등가로 옮긴다.
 */
export const LEGACY_ORPHAN_STORAGE_KEY = 'auth'
