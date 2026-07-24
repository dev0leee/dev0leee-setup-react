/**
 * 인증 도메인 정책값. 경로가 아니라 도메인 규칙이다.
 * (로그인/로그아웃 경로는 api/auth.ts가 인라인으로 소유한다.)
 */

/** 비밀번호 최소 길이. schemas/login.ts와 안내 문구가 함께 쓴다. */
export const MIN_PASSWORD_LENGTH = 8

/** 로그인 연속 실패 허용 횟수. 넘으면 잠금 안내로 전환한다. */
export const MAX_LOGIN_ATTEMPTS = 5
