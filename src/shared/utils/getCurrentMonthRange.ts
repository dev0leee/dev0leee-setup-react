/**
 * 이번 달의 첫날·마지막날을 `YYYY-MM-DD`로 준다.
 * 레거시 `lib/utils/getCurrentMonthRange.js` 이식.
 *
 * `new Date(year, month + 1, 0)`이 그 달의 마지막 날이다 — 다음 달 0일이 이번 달 말일이다.
 */
const toHyphenDate = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

export const getCurrentMonthRange = ({ baseDate = new Date() }: { baseDate?: Date } = {}): {
  startDate: string
  endDate: string
} => {
  const year = baseDate.getFullYear()
  const month = baseDate.getMonth()

  return {
    startDate: toHyphenDate(new Date(year, month, 1)),
    endDate: toHyphenDate(new Date(year, month + 1, 0)),
  }
}
