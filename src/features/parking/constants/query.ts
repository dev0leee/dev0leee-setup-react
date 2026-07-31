/**
 * 주차 쿼리 키. **문자열은 레거시 그대로다** (`query-keys.md`) —
 * 무한 목록 키는 `useInfiniteList`가 접두사로 `removeQueries`를 걸기 때문에
 * 이름이 달라지면 캐시 초기화 대상이 어긋난다.
 */

/** PK2 마일리지 내역 (무한 목록) */
export const PARKING_MILEAGE_LIST_QUERY_KEY = 'parkingMileageList'

/** PK15 정기권 차량 (무한 목록). PK1 임베드도 같은 키를 쓴다 */
export const REGULAR_CAR_LIST_QUERY_KEY = 'regularCarList'

/** PK3 즐겨찾기 차량 (무한 목록). PK6·PK12·PK13의 불러오기 드로어도 같은 키를 쓴다 */
export const BOOKMARK_CAR_LIST_QUERY_KEY = 'bookmarkCarList'

/** PK4 항상허용 차량 (무한 목록) */
export const ALWAYS_ALLOW_CAR_LIST_QUERY_KEY = 'alwaysAllowCarList'

/**
 * 방문목적 목록.
 *
 * 🔴 **키에 `aptUuid`가 없다.** 단지를 바꿔도 키가 같아 이전 단지의 방문목적이
 * 캐시에서 나온다. 전역 `staleTime: 0`이라 곧 갱신되지만 **첫 프레임에는 이전 단지
 * 목록이 보인다.** 게시판(`board.md` §5-1)과 같은 유형이고, 쿼리 키 내용은
 * 레거시 그대로 유지한다 (`parking.md` §3-6 · 「반드시 지켜야 할 것」 #2).
 */
export const VISIT_PURPOSE_QUERY_KEY = ['visitPurpose'] as const

/** PK8 입출차 내역 (무한 목록) */
export const IN_OUT_CAR_LIST_QUERY_KEY = 'inOutCarList'

/** PK9 입출차 상세. **키가 온전하다** — 방문목적(§3-6)과 달리 uuid가 둘 다 들어간다 */
export const inOutCarDetailQueryKey = ({
  aptResidentUuid,
  parkingUuid,
}: {
  aptResidentUuid: string | undefined
  parkingUuid: string | undefined
}) => {
  return ['inOutCarDetail', aptResidentUuid, parkingUuid] as const
}

/** PK1 주차 정책 드로어. 이번 달 1일로 고정 조회한다 */
export const parkingPolicyQueryKey = ({
  aptResidentUuid,
}: {
  aptResidentUuid: string | undefined
}) => {
  return ['parkingPolicy', aptResidentUuid] as const
}
