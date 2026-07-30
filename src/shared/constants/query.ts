/**
 * 기본 fresh 유지 시간.
 * 레거시 QueryClient는 `staleTime`을 지정하지 않았다 → TanStack 기본값 0이다.
 * 화면에 진입할 때마다 재요청한다.
 */
export const DEFAULT_STALE_TIME_MS = 0

/** 재시도 횟수. 레거시 `main.js`가 조회·뮤테이션 모두 0으로 뒀다. */
export const QUERY_RETRY_COUNT = 0

/** 무한 목록 페이지 크기. 레거시 `useInfiniteList`가 10으로 고정한다 (보존 항목 11) */
export const INFINITE_LIST_PAGE_SIZE = 10
