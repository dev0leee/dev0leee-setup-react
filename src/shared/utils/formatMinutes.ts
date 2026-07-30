/**
 * 분을 시/분으로 쪼갠다. 레거시 `lib/utils/formatMinutes.js` 이식.
 *
 * ⚠️ **음수 처리가 비대칭이다.** `hours`는 부호를 유지하고 `minutes`는 절댓값이다
 * (`-90분` → `{ hours: -1, minutes: 30 }`). 레거시 그대로 옮겼다 — 주차 마일리지가
 * 음수가 되는 경우가 있어 만든 처리로 보인다.
 *
 * ⚠️ `0`·`undefined`·`NaN`은 모두 `{ hours: 0, minutes: 0 }`이다 (`!totalMinutes` 검사).
 */
export const formatMinutes = (totalMinutes?: number): { hours: number; minutes: number } => {
  if (!totalMinutes) return { hours: 0, minutes: 0 }

  const sign = totalMinutes < 0 ? -1 : 1
  const absMinutes = Math.abs(totalMinutes)

  return {
    hours: Math.floor(absMinutes / 60) * sign,
    minutes: Math.abs(Math.floor(absMinutes % 60) * sign),
  }
}
