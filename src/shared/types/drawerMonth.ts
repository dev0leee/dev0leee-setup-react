export interface YearMonth {
  year: number
  /** 1~12. 0-based가 아니다 */
  month: number
}

export interface DrawerMonthProps {
  /** 부모가 소유한다. 레거시처럼 내부에 두면 refetch 때 선택이 튕긴다 */
  selected: YearMonth
  /** `'2026-07'` 형태. 비어 있으면 최근 3개월을 만든다 */
  availableYearmonths?: string[]
  hasNoPadding?: boolean
  className?: string
  onChange: (yearMonth: YearMonth) => void
}
