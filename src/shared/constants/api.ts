/**
 * API 경로 접두사. 레거시 `constants/api.js`와 동일하다.
 * 서버 계약이므로 바꾸지 않는다.
 */
export const API_PREFIX = {
  /** 오타가 아니다 — 서버 경로가 실제로 `apartmant`다 */
  APARTMANT: '/apartmant/resident',
  PARKING: '/parking/resident',
  BOARD: '/board/resident',
} as const

/** 토큰 재발급 엔드포인트. `refresh-token` 헤더로 보내고 `authorization` 헤더로 받는다. */
export const REFRESH_ENDPOINT = `${API_PREFIX.APARTMANT}/token-refresh`

/**
 * 재발급을 트리거하는 서버 에러코드.
 *
 * ⚠️ **HTTP 401이 아니다.** 서버는 만료 토큰에도 401을 주지 않을 수 있어
 * 레거시는 응답 body의 `error.errorCode`로 판단한다
 * (`docs/migration/domain-codes.md` §1-1).
 */
export const TOKEN_ERROR_CODE = {
  EXPIRED: 'EXPIRED_TOKEN',
  INVALID: 'INVALID_TOKEN',
} as const

/** 5xx만 Sentry로 보낸다 (레거시 `axios.js`). */
export const SERVER_ERROR_STATUS_MIN = 500
export const SERVER_ERROR_STATUS_MAX = 600
