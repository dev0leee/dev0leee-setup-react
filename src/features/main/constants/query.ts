/** 단지 목록 쿼리 키. 문자열은 레거시 그대로다 (`query-keys.md`) */
export const RESIDENT_APT_LIST_QUERY_KEY = ['residentAptList'] as const

/** 관리비 년월 목록 */
export const imposeYearMonthsQueryKey = ({
  aptResidentUuid,
}: {
  aptResidentUuid: string | undefined
}) => {
  return ['imposeYearMonths', aptResidentUuid] as const
}

/** 관리비 고지서. 년·월이 키에 들어가므로 선택이 바뀌면 자동으로 새로 조회된다 */
export const managementFeeBillQueryKey = ({
  aptResidentUuid,
  year,
  month,
}: {
  aptResidentUuid: string | undefined
  year: number | null
  month: number | null
}) => {
  return ['managementFeeBill', aptResidentUuid, year, month] as const
}

/**
 * 주차 마일리지.
 *
 * ⚠️ 레거시 키는 `['parkingRemainingMileage', dateRange]`로 **uuid가 없다.**
 * 단지를 바꿔도 키가 같아 이전 단지 값이 캐시에서 나온다 — `aptResidentUuid`를 넣어
 * 고쳤다 (`deferred.md` D-217).
 */
export const parkingMileageQueryKey = ({
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
