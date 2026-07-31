/**
 * D-day 문자열을 만든다. 레거시 `lib/utils/formatDate.js`의 `calculateDday` 이식.
 *
 * ```ts
 * calculateDday({ targetDate: '2026-08-03' })  // 오늘이 7/31이면 'D-3'
 * calculateDday({ targetDate: '2026-07-31' })  // 'D-Day'
 * calculateDday({ targetDate: '2026-07-30' })  // 'D+1'
 * ```
 *
 * ⚠️ **기본은 날짜만 비교한다.** 양쪽을 자정으로 내려 `Math.floor`로 나누므로
 * 같은 날이면 시각과 무관하게 `D-Day`다. `includeTime`을 켜면 시각까지 센다.
 *
 * ⚠️ **잘못된 날짜 문자열을 걸러내지 않는다** — `NaN`이 나오면 `D-NaN`이 된다.
 * 레거시가 그렇고, 호출부가 서버 날짜만 넘긴다.
 */
export const calculateDday = ({
  targetDate,
  baseDate = new Date(),
  includeTime = false,
}: {
  targetDate: string | Date
  baseDate?: Date
  includeTime?: boolean
}): string => {
  const base = new Date(baseDate)
  const target = new Date(targetDate)

  if (!includeTime) {
    base.setHours(0, 0, 0, 0)
    target.setHours(0, 0, 0, 0)
  }

  const diffDays = Math.floor((target.getTime() - base.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'D-Day'

  return diffDays > 0 ? `D-${diffDays}` : `D+${-diffDays}`
}
