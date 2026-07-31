import type {
  MovingHouseHolidayData,
  MovingHouseSettingData,
  MovingHouseTimeSlotData,
} from '@/features/movingHouse/types/movingHouse'
import type { RadioListItem } from '@/shared/types/radio'
import { formatObjectDate } from '@/shared/utils/formatObjectDate'

/** 자정으로 내린 사본. 레거시 각 파일이 자기만의 `startOfDay`를 들고 있던 것을 하나로 모았다 */
export const startOfDay = (date: Date | string): Date => {
  const copied = new Date(date)
  copied.setHours(0, 0, 0, 0)

  return copied
}

/**
 * 신축 입주 기간 활성 여부.
 *
 * ⚠️ **`newOccupancyEndDate`만 본다.** `startDate`가 없거나 미래여도 `endDate`만 있으면
 * 활성이다 — `startDate`는 선택 하한 계산에만 쓰인다 (`moving-house.md` §2).
 */
export const isNewOccupancyActive = ({
  setting,
  today = new Date(),
}: {
  setting: MovingHouseSettingData | undefined
  today?: Date
}): boolean => {
  const endDate = setting?.newOccupancyEndDate
  if (!endDate) return false

  return startOfDay(today) <= startOfDay(endDate)
}

/**
 * 달력의 선택 가능 범위.
 *
 * | 모드      | `minDate`                          | `maxDate`             |
 * | --------- | ---------------------------------- | --------------------- |
 * | 일반      | 오늘                               | 없음 (무제한)         |
 * | 신축 입주 | `max(오늘, newOccupancyStartDate)` | `newOccupancyEndDate` |
 */
export const getDatePickerRange = ({
  setting,
  today = new Date(),
}: {
  setting: MovingHouseSettingData | undefined
  today?: Date
}): { minDate: Date; maxDate: Date | undefined } => {
  const startOfToday = startOfDay(today)

  if (!isNewOccupancyActive({ setting, today })) {
    return { minDate: startOfToday, maxDate: undefined }
  }

  const endDate = startOfDay(setting?.newOccupancyEndDate ?? today)
  const startDate = setting?.newOccupancyStartDate
    ? startOfDay(setting.newOccupancyStartDate)
    : startOfToday

  return { minDate: startDate > startOfToday ? startDate : startOfToday, maxDate: endDate }
}

/**
 * 휴무일 판정. **응답이 범위 배열이고 양끝을 포함한다**(`<=`).
 */
export const createIsHolidayDate = (holidayList: MovingHouseHolidayData[] | undefined) => {
  const ranges = (holidayList ?? []).map((range) => {
    return {
      start: startOfDay(range.startDate).getTime(),
      end: startOfDay(range.endDate).getTime(),
    }
  })

  return (date: Date): boolean => {
    const target = startOfDay(date).getTime()

    return ranges.some(({ start, end }) => {
      return start <= target && target <= end
    })
  }
}

/**
 * 당일 + 슬롯 시작시각이 현재보다 과거인가. 서버 검증(`MOVE_RESERVATION_TIME_CLOSED`)의
 * 프론트 1차 방어다.
 *
 * ⚠️ **선택일이 오늘이 아니면 언제나 `false`**다 — 미래 날짜의 슬롯은 막지 않는다.
 */
export const isSlotTimePassedToday = ({
  startTime,
  moveDate,
  now = new Date(),
}: {
  startTime: string | undefined
  moveDate: string | undefined
  now?: Date
}): boolean => {
  if (!startTime || moveDate !== formatObjectDate({ date: now, type: 'hyphen' })) return false

  const [hour = 0, minute = 0] = startTime.split(':').map(Number)

  return hour * 60 + minute < now.getHours() * 60 + now.getMinutes()
}

/**
 * 슬롯 응답 → 라디오 목록.
 *
 * ✅ **레거시는 이 변환을 `select` 안에서 외부 ref에 대입해 만들었다** — `select`는
 * 순수 변환 함수여야 하고 실행 횟수가 보장되지 않는다. 파생 값으로 옮겼고 결과는 같다
 * (`moving-house.md` §4-3).
 *
 * ⚠️ **라벨의 `~` 앞뒤에 공백이 없다** (`오전 09:00~12:00`). MH2 상세는 ` - `를 쓴다.
 * ⚠️ **`reservableFlag`는 `=== false`일 때만 막는다** — 없으면 예약 가능이다.
 */
export const toTimeSlotRadioList = ({
  slotList,
  moveDate,
  now = new Date(),
}: {
  slotList: MovingHouseTimeSlotData[] | undefined
  moveDate: string | undefined
  now?: Date
}): RadioListItem[] => {
  return (slotList ?? []).map((slot) => {
    const isPast = isSlotTimePassedToday({ startTime: slot.startTime, moveDate, now })

    return {
      key: slot.uuid,
      label: `${slot.name} ${slot.startTime?.slice(0, 5)}~${slot.endTime?.slice(0, 5)}`,
      disabled: isPast || slot.reservableFlag === false,
    }
  })
}
