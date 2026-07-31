/**
 * `Date` 객체를 화면 표기로. 레거시 `lib/utils/formatDate.js`의 `formatObjectDate` 이식.
 *
 * ⚠️ **`korean` 결과를 `.slice(5)`로 잘라 쓰는 호출부가 있다** — `2026년 07월 29일`에서
 * 앞 5자(`2026년`)를 떼어 `` 07월 29일``(앞 공백 포함)을 만든다. 포맷을 바꾸면 그 호출부가
 * 전부 깨진다 (`parking.md` §3-7 · `deferred.md`).
 *
 * ⚠️ 값이 없으면 **`undefined`**를 돌려준다(빈 문자열이 아니다).
 */
export const formatObjectDate = ({
  date,
  type,
}: {
  date: Date | null | undefined
  type: 'hyphen' | 'dot' | 'korean'
}): string | undefined => {
  if (!date) return undefined

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  if (type === 'hyphen') return `${year}-${month}-${day}`
  if (type === 'dot') return `${year}.${month}.${day}`

  return `${year}년 ${month}월 ${day}일`
}

/**
 * 시작일~종료일의 일수. 레거시 `lib/utils/calculatePeriodDays.js` 이식.
 *
 * ⚠️ **종료일이 없으면 1일이다** — 하루짜리 예약을 뜻한다. 시작일도 없으면 0.
 * 양 끝을 모두 포함하므로 `+1`이 붙는다.
 */
export const calculatePeriodDays = ({
  startDate,
  endDate,
}: {
  startDate: Date | null | undefined
  endDate: Date | null | undefined
}): number => {
  if (!startDate) return 0
  if (!endDate) return 1

  const diffTime = endDate.getTime() - startDate.getTime()

  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
}
