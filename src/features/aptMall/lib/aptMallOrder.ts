import type { AptMallFormData } from '@/features/aptMall/stores/aptMallFormStore'
import type { AptMallDetailData, AptMallOrderTimeData } from '@/features/aptMall/types/aptMall'
import { WEEK_DAYS } from '@/shared/constants/date'
import { formatDay } from '@/shared/utils/formatDay'
import { formatObjectDate } from '@/shared/utils/formatObjectDate'

/**
 * `2026-08-01 (토) 08:00`.
 *
 * ⚠️ **AM7·AM8만 이 표기를 쓴다.** 목록·상세는 `formatIsoStringDate(...).dateTime()`으로
 * `2026-08-01 08:00`(요일 없음)을 쓴다 — **화면마다 다른 표기를 통일하지 않는다.**
 * 레거시가 두 화면에 같은 식을 복사해 뒀던 것을 하나로 모았다(결과 문자열은 동일하다).
 */
export const formatOrderDateTime = ({ date, time }: AptMallFormData): string => {
  if (!date) return ''

  const dayLabel = formatDay({ dayType: WEEK_DAYS[date.getDay()] }).slice(0, 1)

  return `${formatObjectDate({ date, type: 'hyphen' })} (${dayLabel}) ${time?.orderTime.slice(0, 5)}`
}

/** 비운영 요일 인덱스. `WEEK_DAYS[0] = 'SUNDAY'`라 `getDay()`와 그대로 맞물린다 */
export const getDisabledWeekDays = (detail: AptMallDetailData | undefined): number[] => {
  const operatingIndexes = (detail?.operatingDayList ?? []).map((day) => {
    return WEEK_DAYS.indexOf(day as (typeof WEEK_DAYS)[number])
  })

  return WEEK_DAYS.map((_, index) => {
    return index
  }).filter((index) => {
    return !operatingIndexes.includes(index)
  })
}

/**
 * 예약 가능한 가장 빠른 날짜.
 *
 * ⚠️ **폴백이 오늘인데 오늘은 비운영일일 수 있다** — `reservationLimitDays`가 0이거나
 * 없으면 루프가 한 번도 돌지 않아 바로 오늘이 선택된다. 그러면 달력이 막아둔 날짜가
 * 선택된 상태로 시작하고 시간대가 빈 화면이 된다 (`apt-mall.md` AM-Q15). 레거시 그대로다.
 *
 * ⚠️ **`i < maxDays`라 `maxDays`일째는 탐색하지 않는다**(상한은 그 날을 포함하는데).
 * 경계 1일 불일치도 그대로 옮겼다.
 */
export const findFirstAvailableDate = ({
  detail,
  today = new Date(),
}: {
  detail: AptMallDetailData | undefined
  today?: Date
}): Date => {
  const disabledWeekDays = getDisabledWeekDays(detail)
  const maxDays = detail?.reservationLimitDays ?? 0

  for (let offset = 0; offset < maxDays; offset += 1) {
    const candidate = new Date(today)
    candidate.setDate(today.getDate() + offset)

    if (!disabledWeekDays.includes(candidate.getDay())) return candidate
  }

  return today
}

/** 달력 상한. `reservationLimitDays`가 없으면 `Invalid Date`가 되어 상한이 사라진다 */
export const getMaxOrderDate = ({
  detail,
  today = new Date(),
}: {
  detail: AptMallDetailData | undefined
  today?: Date
}): Date => {
  const maxDate = new Date(today)
  maxDate.setDate(maxDate.getDate() + (detail?.reservationLimitDays ?? 0))

  return maxDate
}

/** `08:00:00` → `오전`. 12시부터 오후다 */
export const classifyTimeOfDay = (orderTime: string): string => {
  return Number.parseInt(orderTime.split(':')[0] ?? '0', 10) < 12 ? '오전' : '오후'
}

/**
 * 잔여석.
 *
 * ⚠️ **레거시는 `.toLocaleString()`을 붙여 문자열을 돌려줬고**, 그 값을 그대로 빼서
 * 판정했다 — 잔여석이 1,000 이상이면 쉼표 때문에 `NaN`이 되어 판정이 무력화됐다.
 * **표시는 그대로 쉼표를 넣되 판정은 숫자로 한다** — 화면 결과가 같고 경계에서만 옳아진다.
 */
export const getRemainingSeat = (time: AptMallOrderTimeData): number => {
  return (time.limitPersonCount ?? 0) - (time.orderPersonCount ?? 0)
}

/**
 * 오늘 날짜일 때만 현재 시각 이전을 막는다.
 *
 * ⚠️ **`<=`이므로 정확히 현재 시각인 슬롯도 비활성**이다.
 */
export const isPastOrderTime = ({
  time,
  selectedDate,
  now = new Date(),
}: {
  time: AptMallOrderTimeData
  selectedDate: Date | undefined
  now?: Date
}): boolean => {
  if (!selectedDate) return false
  if (new Date(selectedDate).toDateString() !== now.toDateString()) return false

  const currentSeconds = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds()
  const [hours = 0, minutes = 0, seconds = 0] = time.orderTime.split(':').map(Number)

  return hours * 3600 + minutes * 60 + seconds <= currentSeconds
}

/**
 * 시간대 비활성 판정 2가지 — 좌석 부족 · 지난 시각.
 *
 * ⚠️ **`포장`은 `personCount`가 없다**(인원 선택 화면이 렌더되지 않는다). 레거시는
 * `"5" - undefined = NaN`으로 좌석 판정이 통째로 무효가 됐는데, 포장은 좌석을 쓰지 않아
 * 결과가 맞았다 — **우연히 맞는 코드**였다. 여기서는 인원이 없으면 좌석 판정을 건너뛴다
 * (`apt-mall.md` AM-Q17). 화면 결과는 같다.
 */
export const isOrderTimeDisabled = ({
  time,
  personCount,
  selectedDate,
  now = new Date(),
}: {
  time: AptMallOrderTimeData
  personCount: number | undefined
  selectedDate: Date | undefined
  now?: Date
}): boolean => {
  const hasNoSeat = personCount !== undefined && getRemainingSeat(time) - personCount < 0

  return hasNoSeat || isPastOrderTime({ time, selectedDate, now })
}
