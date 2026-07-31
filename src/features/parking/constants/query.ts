/**
 * 주차 쿼리 키. **문자열은 레거시 그대로다** (`query-keys.md`) —
 * 무한 목록 키는 `useInfiniteList`가 접두사로 `removeQueries`를 걸기 때문에
 * 이름이 달라지면 캐시 초기화 대상이 어긋난다.
 */

/** PK2 마일리지 내역 (무한 목록) */
export const PARKING_MILEAGE_LIST_QUERY_KEY = 'parkingMileageList'

/** PK15 정기권 차량 (무한 목록). PK1 임베드도 같은 키를 쓴다 */
export const REGULAR_CAR_LIST_QUERY_KEY = 'regularCarList'

/** PK1 주차 정책 드로어. 이번 달 1일로 고정 조회한다 */
export const parkingPolicyQueryKey = ({
  aptResidentUuid,
}: {
  aptResidentUuid: string | undefined
}) => {
  return ['parkingPolicy', aptResidentUuid] as const
}
