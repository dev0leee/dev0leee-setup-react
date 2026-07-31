import { ko } from 'date-fns/locale'
import { useState } from 'react'

import {
  RESERVATION_MAX_DAYS,
  RESERVATION_PERIOD_REQUIRED,
} from '@/features/parking/constants/parking'
import { ButtonBase } from '@/shared/components/common/ButtonBase'
import { DrawerBase } from '@/shared/components/common/DrawerBase'
import { Calendar } from '@/shared/components/ui/calendar'
import { calculatePeriodDays, formatObjectDate } from '@/shared/utils/formatObjectDate'

/** 예약 기간 값. 종료일은 없을 수 있다(하루짜리 예약) */
export type ReservationPeriod = [Date, Date | null]

/** 오늘 자정 */
const getToday = () => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return today
}

/** 고를 수 있는 마지막 날 = 오늘 + 6일 */
const getMaxDate = () => {
  const maxDate = getToday()
  maxDate.setDate(maxDate.getDate() + RESERVATION_MAX_DAYS - 1)
  return maxDate
}

/** `2026년 07월 29일` → ` 07월 29일`. 앞 5자(`2026년`)를 뗀다 — 레거시 표기 그대로다 */
const toShortKorean = (date: Date | null) => {
  return formatObjectDate({ date, type: 'korean' })?.slice(5)
}

/**
 * 예약 기간 선택 드로어 (PK12·PK13).
 * 레거시 `ReservationCarAddCalendarModal.vue`(171 LOC)를
 * `@vuepic/vue-datepicker` → **react-day-picker**로 교체 이관.
 *
 * ### 선택 규칙 — 레거시 그대로 재현한다
 *
 * | 상황                     | 결과                                    |
 * | ------------------------ | --------------------------------------- |
 * | 아무것도 없을 때 클릭    | 시작일이 된다                           |
 * | 시작일과 **같은 날** 클릭 | **무시한다** — 종료일로 잡지 않는다     |
 * | 시작일보다 **이전** 클릭 | **교환한다** — 누른 날이 시작일이 된다  |
 * | 시작일 이후 클릭         | 종료일이 된다                           |
 * | 둘 다 있을 때 클릭       | 시작일만 남기고 종료일을 지운다         |
 *
 * ⚠️ **react-day-picker의 `range` 선택 로직을 쓰지 않는다.** 같은 날 무시·역순 교환이
 * 라이브러리 기본 동작과 다르기 때문이다. `mode="range"`는 **범위를 칠하는 용도**로만 쓰고,
 * 값은 `onDayClick`이 직접 계산한다.
 *
 * ⚠️ **오늘부터 오늘+6일까지만 고를 수 있다**(합쳐서 7일). 일요일 시작 주 배치도 레거시와 같다.
 *
 * ⚠️ 레거시는 표시용 `dates`와 실제 값 `startDate`/`endDate`를 **따로** 들고 단방향으로만
 * 동기화했다. 여기서는 하나의 상태만 둔다 — 어긋날 여지가 사라지고 화면 결과는 같다.
 */
export const ReservationCalendarDrawer = ({
  open,
  initialPeriod,
  onClose,
  onApply,
}: {
  open: boolean
  initialPeriod: ReservationPeriod | null
  onClose: () => void
  onApply: (period: ReservationPeriod) => void
}) => {
  const [startDate, setStartDate] = useState<Date | null>(initialPeriod?.[0] ?? null)
  const [endDate, setEndDate] = useState<Date | null>(initialPeriod?.[1] ?? null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleDayClick = (date: Date) => {
    setErrorMessage(null)

    // 둘 다 골라둔 상태에서 다시 누르면 처음부터 다시 고른다
    if (startDate && endDate) {
      setStartDate(date)
      setEndDate(null)
      return
    }

    if (!startDate) {
      setStartDate(date)
      return
    }

    // 시작일과 같은 날은 종료일로 잡지 않는다
    if (date.getTime() === startDate.getTime()) return

    // 역순으로 고르면 교환한다
    if (date < startDate) {
      setEndDate(startDate)
      setStartDate(date)
      return
    }

    setEndDate(date)
  }

  const handleApply = () => {
    if (!startDate && !endDate) {
      setErrorMessage(RESERVATION_PERIOD_REQUIRED)
      return
    }
    if (!startDate) return

    onApply([startDate, endDate])
    onClose()
  }

  const periodDays = calculatePeriodDays({ startDate, endDate })
  const isDateSelected = startDate !== null || endDate !== null

  return (
    <DrawerBase open={open} title="입출차 예약 기간" hasCloseButton onClose={onClose}>
      <div className="h-full w-full space-y-4 pt-2.5">
        <div className="px-5">
          <Calendar
            mode="range"
            locale={ko}
            weekStartsOn={0}
            selected={{ from: startDate ?? undefined, to: endDate ?? undefined }}
            disabled={[{ before: getToday() }, { after: getMaxDate() }]}
            startMonth={getToday()}
            endMonth={getMaxDate()}
            className="w-full"
            // 값 계산은 `onDayClick`이 한다 — 라이브러리 기본 range 로직을 쓰지 않는다
            onSelect={() => {
              // no-op
            }}
            onDayClick={handleDayClick}
          />
        </div>

        <div className="flex h-4 items-center gap-2 px-5">
          {errorMessage && <p className="text-red-500">{errorMessage}</p>}

          {!errorMessage && isDateSelected && (
            <>
              {/* ⚠️ alt가 `알림 아이콘`이다 — 달력 아이콘인데 오타다 (레거시 그대로) */}
              <img className="h-5 w-5" src="/assets/icons/Calendar.svg" alt="알림 아이콘" />
              <div className="font-semibold">
                <span>{toShortKorean(startDate)}</span>
                {endDate !== null && <>~</>}
                <span>{toShortKorean(endDate)}</span>
                <span>({periodDays}일)</span>
              </div>
            </>
          )}
        </div>

        <div className="p-5 pt-2">
          <ButtonBase roundType="rounded" color="brand" onClick={handleApply}>
            적용하기
          </ButtonBase>
        </div>
      </div>
    </DrawerBase>
  )
}
