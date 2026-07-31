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

/**
 * 주차 마일리지. 메인 카드와 주차 화면(PK1·PK2)이 **같은 캐시를 쓴다** — 레거시도 그랬다.
 *
 * ⚠️ 레거시 키는 `['parkingRemainingMileage', dateRange]`로 **uuid가 없다.**
 * 단지를 바꿔도 키가 같아 이전 단지 값이 캐시에서 나온다 — `aptResidentUuid`를 넣어
 * 고쳤다 (`deferred.md` D-217).
 */
export const parkingRemainingMileageQueryKey = ({
  aptResidentUuid,
  startDate,
  endDate,
}: {
  aptResidentUuid: string | undefined
  startDate: string
  endDate: string
}) => {
  return ['parkingRemainingMileage', aptResidentUuid, startDate, endDate] as const
}
