/**
 * 서버 에러코드. 레거시 문자열 그대로다.
 *
 * ⚠️ **철자를 고치지 않는다.** 서버가 보내는 값이라 고치면 분기가 안 걸리고
 * 기본 메시지로 폴백한다 (`docs/migration/domain-codes.md` §1).
 * 도메인별 코드는 각 feature의 `constants/`가 갖고, 여기에는
 * **여러 도메인이 공유하는 것만** 둔다.
 */

/** 로그인/인증 (`domain-codes.md` §1-2) */
export const LOGIN_ERROR_CODE = {
  RESIDENT_NOT_FOUND: 'RESIDENT_NOT_FOUND',
  INVALID_PASSWORD: 'INVALID_PASSWORD',
  APT_NOT_FOUND: 'APT_NOT_FOUND',
  HOUSEHOLD_NOT_FOUND: 'HOUSEHOLD_NOT_FOUND',
  /** 미승인 세대 → 승인 대기 화면으로 */
  RESIDENT_NOT_APPROVED: 'RESIDENT_NOT_APPROVED',
} as const

/**
 * 가입(회원가입 · 버전1 전환) 에러코드.
 *
 * **두 도메인이 같은 표를 쓴다** — `signup.md` S4와 `auth.md` A6의 매핑이 동일하다.
 * 차이는 처리뿐이다: 버전1은 에러 시 세션을 지우고 `/`로 보내지만 회원가입은 그렇지 않다.
 */
export const SIGNUP_ERROR_CODE = {
  RESIDENT_ALREADY_EXISTS: 'RESIDENT_ALREADY_EXISTS',
  HOUSEHOLD_NOT_FOUND: 'HOUSEHOLD_NOT_FOUND',
  HOUSEHOLD_HEAD_ALREADY_EXISTS: 'HOUSEHOLD_HEAD_ALREADY_EXISTS',
  /** KMC 인증 유효시간 만료. 모달을 닫으면 처음으로 돌려보낸다 */
  KMC_ERROR: 'KMC_ERROR',
} as const
