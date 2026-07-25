/** 기본 fresh 유지 시간. 이 시간 안에는 화면 전환해도 재요청하지 않는다. */
export const DEFAULT_STALE_TIME_MS = 60_000

/** 5xx·네트워크 에러 재시도 상한 */
export const MAX_QUERY_RETRIES = 2
