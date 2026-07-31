import { ko } from 'date-fns/locale'
import { useEffect, useState } from 'react'

import { MOVING_HOUSE_HOLIDAY_CLASS } from '@/features/movingHouse/constants/movingHouse'
import { Calendar } from '@/shared/components/ui/calendar'

/**
 * MH3 날짜 선택기. 레거시 `VueDatePicker`(`inline` · `auto-apply`) 대체.
 *
 * ⚠️ **시작 요일이 월요일이다.** 레거시가 `week-start`를 지정하지 않아
 * `@vuepic/vue-datepicker@9.0.3`의 기본값 `1`(월)이 적용됐다 — react-day-picker는
 * `ko` 로케일을 따라 일요일로 시작하므로 **명시적으로 `1`을 준다.**
 * (앱 전체 달력 5개의 시작 요일이 일:월 = 2:3으로 갈려 있다 — 공용 래퍼 기본값은
 * `moving-house.md` MH-Q12에서 AptMall·주차·로비폰과 함께 정한다.)
 *
 * ⚠️ **오늘 날짜 강조를 끄지 않는다** — 레거시 MH3에 `no-today`가 없다.
 *
 * ⚠️ **휴무일은 두 가지로 표현된다** — 선택 차단(`disabled`)과 시각 표시(빨간 글자 +
 * 반투명 빨간 사각형). 표시가 없으면 "왜 안 눌리는지" 알 수 없어 레거시의
 * `<style scoped>`를 Tailwind 클래스로 옮겼다.
 *
 * ⚠️ **보이는 달을 선택 값에 맞춰 따라가게 한다.** 설정이 늦게 도착해 선택일이 신축
 * 입주 시작일로 갱신되면 그 달이 열려야 한다 — 레거시 `v-model`이 주던 동작이다.
 * 사용자가 화살표로 달을 옮기는 것은 그대로 둔다.
 */
export const MovingHouseDatePicker = ({
  value,
  minDate,
  maxDate,
  isHolidayDate,
  onSelect,
}: {
  value: Date | undefined
  minDate: Date
  maxDate: Date | undefined
  isHolidayDate: (date: Date) => boolean
  onSelect: (date: Date | undefined) => void
}) => {
  const [month, setMonth] = useState(value ?? minDate)

  useEffect(() => {
    if (value) setMonth(value)
  }, [value])

  return (
    <Calendar
      className="w-full"
      mode="single"
      locale={ko}
      weekStartsOn={1}
      selected={value}
      month={month}
      startMonth={minDate}
      endMonth={maxDate}
      disabled={[{ before: minDate }, ...(maxDate ? [{ after: maxDate }] : []), isHolidayDate]}
      modifiers={{ holiday: isHolidayDate }}
      modifiersClassNames={{ holiday: MOVING_HOUSE_HOLIDAY_CLASS }}
      onMonthChange={setMonth}
      onSelect={onSelect}
    />
  )
}
