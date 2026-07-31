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

// 주차 마일리지 키는 주차 도메인과 캐시를 공유하므로 `shared/constants/query.ts`에 있다.

/** 공지 Top3. 단지 단위라 `aptUuid`가 키에 들어간다 */
export const noticeTopThreeQueryKey = ({ aptUuid }: { aptUuid: string | undefined }) => {
  return ['noticeTopThree', aptUuid] as const
}

/** 쇼핑몰 SSO 토큰. 자동 조회하지 않고 필요할 때만 부른다 */
export const shoppingTokenQueryKey = ({
  aptResidentUuid,
}: {
  aptResidentUuid: string | undefined
}) => {
  return ['shoppingToken', aptResidentUuid] as const
}
