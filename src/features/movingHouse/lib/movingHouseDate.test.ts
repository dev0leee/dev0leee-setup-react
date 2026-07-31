import { describe, expect, it } from 'vitest'

import {
  createIsHolidayDate,
  getDatePickerRange,
  isNewOccupancyActive,
  isSlotTimePassedToday,
  toTimeSlotRadioList,
} from '@/features/movingHouse/lib/movingHouseDate'

const TODAY = new Date('2026-07-31T10:30:00')

describe('isNewOccupancyActive', () => {
  it('⚠️ **종료일만 본다** — 시작일이 없어도 활성이다', () => {
    expect(
      isNewOccupancyActive({ setting: { newOccupancyEndDate: '2026-08-31' }, today: TODAY }),
    ).toBe(true)
  })

  it('시작일이 미래여도 활성이다', () => {
    expect(
      isNewOccupancyActive({
        setting: { newOccupancyStartDate: '2026-09-01', newOccupancyEndDate: '2026-09-30' },
        today: TODAY,
      }),
    ).toBe(true)
  })

  it('종료일이 없으면 비활성이다', () => {
    expect(
      isNewOccupancyActive({ setting: { newOccupancyStartDate: '2026-07-01' }, today: TODAY }),
    ).toBe(false)
  })

  it('종료일이 지났으면 비활성이다', () => {
    expect(
      isNewOccupancyActive({ setting: { newOccupancyEndDate: '2026-07-30' }, today: TODAY }),
    ).toBe(false)
  })

  it('종료일이 **오늘이면 아직 활성**이다 (`<=`)', () => {
    expect(
      isNewOccupancyActive({ setting: { newOccupancyEndDate: '2026-07-31' }, today: TODAY }),
    ).toBe(true)
  })
})

describe('getDatePickerRange', () => {
  it('일반 모드는 오늘부터 **상한 없이**', () => {
    const { minDate, maxDate } = getDatePickerRange({ setting: {}, today: TODAY })

    expect(minDate.getDate()).toBe(31)
    expect(minDate.getHours()).toBe(0)
    expect(maxDate).toBeUndefined()
  })

  it('신축 입주 시작일이 미래면 **그 날짜가 하한**이다', () => {
    const { minDate, maxDate } = getDatePickerRange({
      setting: { newOccupancyStartDate: '2026-08-10', newOccupancyEndDate: '2026-08-31' },
      today: TODAY,
    })

    expect(minDate.getDate()).toBe(10)
    expect(maxDate?.getDate()).toBe(31)
  })

  it('신축 입주 시작일이 과거면 **오늘이 하한**이다', () => {
    const { minDate } = getDatePickerRange({
      setting: { newOccupancyStartDate: '2026-07-01', newOccupancyEndDate: '2026-08-31' },
      today: TODAY,
    })

    expect(minDate.getDate()).toBe(31)
  })
})

describe('createIsHolidayDate', () => {
  const isHoliday = createIsHolidayDate([{ startDate: '2026-08-05', endDate: '2026-08-07' }])

  it('⚠️ 범위의 **양끝을 포함**한다', () => {
    expect(isHoliday(new Date('2026-08-05T23:00:00'))).toBe(true)
    expect(isHoliday(new Date('2026-08-07T00:00:00'))).toBe(true)
  })

  it('범위 안쪽도 휴무다', () => {
    expect(isHoliday(new Date('2026-08-06T12:00:00'))).toBe(true)
  })

  it('범위 밖은 휴무가 아니다', () => {
    expect(isHoliday(new Date('2026-08-04T12:00:00'))).toBe(false)
    expect(isHoliday(new Date('2026-08-08T12:00:00'))).toBe(false)
  })

  it('목록이 없으면 언제나 false다', () => {
    expect(createIsHolidayDate(undefined)(new Date('2026-08-06'))).toBe(false)
  })
})

describe('isSlotTimePassedToday', () => {
  it('⚠️ **선택일이 오늘일 때만** 지난 시각을 막는다', () => {
    expect(
      isSlotTimePassedToday({ startTime: '09:00:00', moveDate: '2026-07-31', now: TODAY }),
    ).toBe(true)
    expect(
      isSlotTimePassedToday({ startTime: '13:00:00', moveDate: '2026-07-31', now: TODAY }),
    ).toBe(false)
  })

  it('미래 날짜의 슬롯은 **막지 않는다**', () => {
    expect(
      isSlotTimePassedToday({ startTime: '09:00:00', moveDate: '2026-08-01', now: TODAY }),
    ).toBe(false)
  })

  it('분 단위로 비교한다', () => {
    expect(
      isSlotTimePassedToday({ startTime: '10:29:00', moveDate: '2026-07-31', now: TODAY }),
    ).toBe(true)
    expect(
      isSlotTimePassedToday({ startTime: '10:31:00', moveDate: '2026-07-31', now: TODAY }),
    ).toBe(false)
  })
})

describe('toTimeSlotRadioList', () => {
  const slotList = [
    { uuid: 'slot-1', name: '오전', startTime: '09:00:00', endTime: '12:00:00' },
    { uuid: 'slot-2', name: '오후', startTime: '13:00:00', endTime: '18:00:00' },
    {
      uuid: 'slot-3',
      name: '야간',
      startTime: '19:00:00',
      endTime: '21:00:00',
      reservableFlag: false,
    },
  ]

  it('⚠️ 라벨의 **`~` 앞뒤에 공백이 없다** (MH4 표기)', () => {
    const [first] = toTimeSlotRadioList({ slotList, moveDate: '2026-08-01', now: TODAY })

    expect(first?.label).toBe('오전 09:00~12:00')
  })

  it('오늘이면 지난 슬롯이 비활성이다', () => {
    const list = toTimeSlotRadioList({ slotList, moveDate: '2026-07-31', now: TODAY })

    expect(list[0]?.disabled).toBe(true)
    expect(list[1]?.disabled).toBe(false)
  })

  it('⚠️ **`reservableFlag === false`만** 막는다 — 필드가 없으면 예약 가능이다', () => {
    const list = toTimeSlotRadioList({ slotList, moveDate: '2026-08-01', now: TODAY })

    expect(list[0]?.disabled).toBe(false)
    expect(list[2]?.disabled).toBe(true)
  })
})
