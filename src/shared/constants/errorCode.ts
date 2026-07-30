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
