/**
 * 비밀번호 재설정 화면(A2·A3)의 문구·정책값. 레거시 화면 파일에 흩어져 있던 것을 모았다.
 */

/** 인증번호 유효 시간(초). 레거시 `remainingTime = ref(180)` */
export const CERT_TIMER_SECONDS = 180

/** 1분 = 60초. `MM:SS` 계산에 쓴다 */
export const SECONDS_PER_MINUTE = 60

/** 인증번호 자릿수. 입력 `maxlength`와 스키마가 함께 쓴다 */
export const VERIFICATION_CODE_LENGTH = 6

/** 새 비밀번호 입력 `maxlength`. 레거시 `:maxlength="20"` */
export const PASSWORD_MAX_LENGTH = 20

/** 재설정 결과 안내. 레거시 `usePatchPassword.js` 문구 그대로 */
export const PASSWORD_RESET_MESSAGE = {
  SUCCESS_TOAST: '재설정되었습니다',
  FAILURE_MODAL: '패스워드 변경에 실패했습니다',
} as const

/**
 * 인증번호 검증 실패 시 서버 `message`가 비어 있을 때의 대체 문구.
 * 레거시 `usePostPasswordResetCodeVerify.js`의 `||` 우변이다.
 */
export const VERIFICATION_CODE_FALLBACK_MESSAGE =
  '인증번호가 일치하지 않습니다. 다시 입력해 주세요.'
