/**
 * 쿼리 키. 레거시 문자열을 그대로 쓴다 — 키가 달라지면 무효화 대상이 어긋난다
 * (`docs/migration/query-keys.md`).
 */

/** 로그아웃 시 유일하게 제거하는 캐시 (레거시 `useLogoutFlow`). */
export const RESIDENT_DETAIL_INFO_QUERY_KEY = ['residentDetailInfo'] as const
