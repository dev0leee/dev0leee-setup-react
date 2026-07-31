import { useState } from 'react'

import {
  ReservationCalendarDrawer,
  type ReservationPeriod,
} from '@/features/parking/components/reservation/ReservationCalendarDrawer'
import {
  RESERVATION_PERIOD_GUIDE,
  RESERVATION_PERIOD_PLACEHOLDER,
} from '@/features/parking/constants/parking'
import { TextError } from '@/shared/components/common/TextError'
import { calculatePeriodDays, formatObjectDate } from '@/shared/utils/formatObjectDate'

/**
 * 예약 기간 입력 필드 (PK12·PK13). 레거시 `ReservationCarAddCalendar.vue`(104 LOC) 이식.
 *
 * 값 자체는 드로어가 고르고, 여기서는 **버튼 모양의 표시**와 안내문·에러만 담당한다.
 *
 * ⚠️ **선택 후 표기는 `07월 29일~07월 31일(3일)` 꼴이다** — 연도를 뗀 한국어 날짜에
 * 기간 일수를 괄호로 붙인다. 종료일이 없으면 시작일만 나오고 `(1일)`이 된다.
 */
export const ReservationDateField = ({
  value,
  errorMessage,
  onChange,
}: {
  value: ReservationPeriod | null
  errorMessage?: string
  onChange: (period: ReservationPeriod) => void
}) => {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)

  const startDate = value?.[0] ?? null
  const endDate = value?.[1] ?? null
  const hasPeriod = startDate !== null

  return (
    <li className="flex flex-col items-start gap-[11px] self-stretch">
      <label
        htmlFor="inOutParkingScheduledDate"
        className="flex items-center gap-1 px-1 py-0 pretendard-15SemiBold text-defaults-primary-text-primary"
      >
        <span>입출차 예약 기간</span>
        <img src="/assets/icons/Essential.svg" alt="별표 아이콘" />
      </label>

      <button
        type="button"
        id="inOutParkingScheduledDate"
        className="flex w-full items-center justify-between self-stretch rounded-md border border-defaults-tertiary-border-tertiary p-2.5 pretendard-16Regular text-defaults-primary-text-primary"
        onClick={() => {
          setIsCalendarOpen(true)
        }}
      >
        {hasPeriod ? (
          <p>
            <span>{formatObjectDate({ date: startDate, type: 'korean' })?.slice(5)}</span>
            {endDate && (
              <span>~{formatObjectDate({ date: endDate, type: 'korean' })?.slice(5)}</span>
            )}
            <span>({calculatePeriodDays({ startDate, endDate })}일)</span>
          </p>
        ) : (
          <p className="text-defaults-secondary-text-secondary">{RESERVATION_PERIOD_PLACEHOLDER}</p>
        )}
        <img className="h-5 w-5" src="/assets/icons/ArrowRight.svg" alt="화살표 아이콘" />
      </button>

      {isCalendarOpen && (
        <ReservationCalendarDrawer
          open={isCalendarOpen}
          initialPeriod={value}
          onClose={() => {
            setIsCalendarOpen(false)
          }}
          onApply={onChange}
        />
      )}

      <div className="flex items-center gap-1">
        <img className="h-3.5 w-3.5" src="/assets/icons/InfoCircleGray.svg" alt="정보 아이콘" />
        <p className="pretendard-14Regular text-defaults-secondary-text-secondary">
          {RESERVATION_PERIOD_GUIDE}
        </p>
      </div>

      <TextError>{errorMessage}</TextError>
    </li>
  )
}
