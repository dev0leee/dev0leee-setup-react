/**
 * 조회 가능한 연월 목록이 없을 때 `DrawerMonth`가 만들어 보여주는 개월 수.
 * 레거시 `times(3, ...)`.
 */
export const RECENT_MONTH_FALLBACK_COUNT = 3

/**
 * 서버 요일 코드를 `Date.getDay()` 인덱스 순서로 늘어놓은 것.
 * 레거시 `constants/domain/common.js`의 `WEEK_DAYS` 이식.
 *
 * ⚠️ **`SUNDAY`가 0번이어야 한다.** `getDay()`와 인덱스가 맞아떨어지는 것이
 * 아파트몰 달력의 비운영 요일 계산 근거다 (`apt-mall.md` AM9).
 */
export const WEEK_DAYS = [
  'SUNDAY',
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
] as const
