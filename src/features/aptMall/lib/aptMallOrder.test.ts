import { describe, expect, it } from 'vitest'

import {
  classifyTimeOfDay,
  findFirstAvailableDate,
  formatOrderDateTime,
  getDisabledWeekDays,
  getMaxOrderDate,
  getRemainingSeat,
  isOrderTimeDisabled,
  isPastOrderTime,
} from '@/features/aptMall/lib/aptMallOrder'

// 2026-08-01은 토요일이다
const SATURDAY = new Date('2026-08-01T10:30:00')

const TIME = { aptMallOrderTimeUuid: 'time-1', orderTime: '08:00:00' }

describe('formatOrderDateTime', () => {
  it('⚠️ **요일이 들어간다** — 목록·상세는 요일 없이 쓴다', () => {
    expect(formatOrderDateTime({ date: SATURDAY, time: TIME })).toBe('2026-08-01 (토) 08:00')
  })

  it('날짜가 없으면 빈 문자열이다', () => {
    expect(formatOrderDateTime({})).toBe('')
  })
})

describe('getDisabledWeekDays', () => {
  it('운영 요일을 뺀 나머지를 막는다', () => {
    expect(
      getDisabledWeekDays({ aptMallUuid: 'x', operatingDayList: ['SATURDAY', 'SUNDAY'] }),
    ).toEqual([1, 2, 3, 4, 5])
  })

  it('운영 요일이 없으면 7일 전부 막는다', () => {
    expect(getDisabledWeekDays(undefined)).toEqual([0, 1, 2, 3, 4, 5, 6])
  })
})

describe('findFirstAvailableDate', () => {
  const detail = { aptMallUuid: 'x', operatingDayList: ['SATURDAY'], reservationLimitDays: 14 }

  it('오늘이 운영일이면 오늘을 고른다', () => {
    expect(findFirstAvailableDate({ detail, today: SATURDAY }).getDate()).toBe(1)
  })

  it('오늘이 비운영일이면 **다음 운영일**을 고른다', () => {
    // 2026-08-02는 일요일 → 다음 토요일은 8일
    const sunday = new Date('2026-08-02T10:00:00')
    expect(findFirstAvailableDate({ detail, today: sunday }).getDate()).toBe(8)
  })

  it('🔴 `reservationLimitDays`가 없으면 **비운영일이어도 오늘**이 선택된다 (AM-Q15)', () => {
    const sunday = new Date('2026-08-02T10:00:00')
    const noLimit = { aptMallUuid: 'x', operatingDayList: ['SATURDAY'] }

    expect(findFirstAvailableDate({ detail: noLimit, today: sunday }).getDate()).toBe(2)
  })
})

describe('getMaxOrderDate', () => {
  it('오늘 + `reservationLimitDays`다', () => {
    expect(
      getMaxOrderDate({
        detail: { aptMallUuid: 'x', reservationLimitDays: 14 },
        today: SATURDAY,
      }).getDate(),
    ).toBe(15)
  })
})

describe('classifyTimeOfDay', () => {
  it('12시부터 오후다', () => {
    expect(classifyTimeOfDay('11:59:00')).toBe('오전')
    expect(classifyTimeOfDay('12:00:00')).toBe('오후')
  })
})

describe('isPastOrderTime', () => {
  it('⚠️ **오늘일 때만** 지난 시각을 막는다', () => {
    expect(isPastOrderTime({ time: TIME, selectedDate: SATURDAY, now: SATURDAY })).toBe(true)
  })

  it('다른 날짜면 언제나 통과한다', () => {
    const nextWeek = new Date('2026-08-08T00:00:00')
    expect(isPastOrderTime({ time: TIME, selectedDate: nextWeek, now: SATURDAY })).toBe(false)
  })

  it('⚠️ **정확히 현재 시각인 슬롯도 막힌다** (`<=`)', () => {
    const exact = { aptMallOrderTimeUuid: 't', orderTime: '10:30:00' }
    expect(isPastOrderTime({ time: exact, selectedDate: SATURDAY, now: SATURDAY })).toBe(true)
  })
})

describe('isOrderTimeDisabled', () => {
  const future = { aptMallOrderTimeUuid: 't', orderTime: '18:00:00' }

  it('잔여석이 인원보다 적으면 막는다', () => {
    const time = { ...future, limitPersonCount: 3, orderPersonCount: 1 }

    expect(
      isOrderTimeDisabled({ time, personCount: 5, selectedDate: SATURDAY, now: SATURDAY }),
    ).toBe(true)
    expect(
      isOrderTimeDisabled({ time, personCount: 2, selectedDate: SATURDAY, now: SATURDAY }),
    ).toBe(false)
  })

  it('✅ 잔여석이 **1,000 이상이어도** 판정이 살아 있다', () => {
    // 🔴 레거시는 `"1,000" - 2 = NaN`이라 판정이 무력화됐다
    const time = { ...future, limitPersonCount: 1000, orderPersonCount: 0 }

    expect(getRemainingSeat(time).toLocaleString()).toBe('1,000')
    expect(
      isOrderTimeDisabled({ time, personCount: 2, selectedDate: SATURDAY, now: SATURDAY }),
    ).toBe(false)
  })

  it('⚠️ **인원이 없으면**(포장) 좌석 판정을 건너뛴다', () => {
    const time = { ...future, limitPersonCount: 0, orderPersonCount: 0 }

    expect(
      isOrderTimeDisabled({ time, personCount: undefined, selectedDate: SATURDAY, now: SATURDAY }),
    ).toBe(false)
  })
})
