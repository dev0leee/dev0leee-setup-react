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

/**
 * 입주민 상세정보 캐시 키. **레거시 문자열 그대로다** — 키가 달라지면 무효화 대상이
 * 어긋난다 (`docs/migration/query-keys.md`).
 *
 * 접두사만으로 쓰는 자리(`removeQueries`)와 단지별 전체 키가 모두 필요해 둘 다 둔다.
 * 이 키는 도메인이 아니라 하부구조라 `shared/`에 있다 (`shared/lib/aptContext.ts` 참고).
 */
export const RESIDENT_DETAIL_INFO_QUERY_KEY = ['residentDetailInfo'] as const

export const residentDetailInfoQueryKey = ({
  aptResidentUuid,
}: {
  aptResidentUuid: string | undefined
}) => {
  return [...RESIDENT_DETAIL_INFO_QUERY_KEY, aptResidentUuid] as const
}
