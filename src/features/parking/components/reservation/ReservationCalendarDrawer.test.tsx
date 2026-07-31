import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  ReservationCalendarDrawer,
  type ReservationPeriod,
} from '@/features/parking/components/reservation/ReservationCalendarDrawer'
import { fireEvent, renderWithProviders, screen } from '@/testing/utils'

/** 달의 한가운데로 고정한다 — 선택 가능 범위(오늘~오늘+6)가 월을 넘지 않게 한다 */
const TODAY = new Date(2026, 6, 10, 9, 0, 0)

/**
 * `aria-label`로 날짜 버튼을 찾는다. react-day-picker가 ko 로케일로 붙인다.
 * **오늘 날짜에는 접두사가 더 붙으므로** 앵커 없이 부분 일치로 찾는다.
 */
const dayButton = (label: string) => {
  return screen.getByRole('button', { name: new RegExp(label) })
}

const renderDrawer = ({
  initialPeriod = null,
  onApply = vi.fn(),
}: {
  initialPeriod?: ReservationPeriod | null
  onApply?: (period: ReservationPeriod) => void
} = {}) => {
  renderWithProviders({
    ui: (
      <ReservationCalendarDrawer
        open
        initialPeriod={initialPeriod}
        onClose={() => {
          // 닫기는 이 테스트의 관심사가 아니다
        }}
        onApply={onApply}
      />
    ),
  })

  return { onApply }
}

const apply = () => {
  fireEvent.click(screen.getByRole('button', { name: '적용하기' }))
}

describe('ReservationCalendarDrawer (PK12·PK13 달력)', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(TODAY)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('오늘부터 오늘+6일까지만 고를 수 있다', () => {
    renderDrawer()

    expect(dayButton('2026년 7월 9일')).toBeDisabled()
    expect(dayButton('2026년 7월 10일')).toBeEnabled()
    expect(dayButton('2026년 7월 16일')).toBeEnabled()
    expect(dayButton('2026년 7월 17일')).toBeDisabled()
  })

  it('하나만 고르면 하루짜리 예약이 된다', () => {
    const { onApply } = renderDrawer()

    fireEvent.click(dayButton('2026년 7월 10일'))

    expect(screen.getByText('(1일)')).toBeInTheDocument()

    apply()
    expect(onApply).toHaveBeenCalledWith([new Date(2026, 6, 10), null])
  })

  it('두 번째 날을 고르면 기간이 된다', () => {
    const { onApply } = renderDrawer()

    fireEvent.click(dayButton('2026년 7월 10일'))
    fireEvent.click(dayButton('2026년 7월 12일'))

    expect(screen.getByText('(3일)')).toBeInTheDocument()

    apply()
    expect(onApply).toHaveBeenCalledWith([new Date(2026, 6, 10), new Date(2026, 6, 12)])
  })

  it('🔴 시작일과 **같은 날**을 다시 누르면 무시한다', () => {
    const { onApply } = renderDrawer()

    fireEvent.click(dayButton('2026년 7월 10일'))
    fireEvent.click(dayButton('2026년 7월 10일'))

    // 종료일이 잡히지 않아 여전히 하루다
    expect(screen.getByText('(1일)')).toBeInTheDocument()

    apply()
    expect(onApply).toHaveBeenCalledWith([new Date(2026, 6, 10), null])
  })

  it('🔴 시작일보다 **이전**을 고르면 두 값이 교환된다', () => {
    const { onApply } = renderDrawer()

    fireEvent.click(dayButton('2026년 7월 14일'))
    fireEvent.click(dayButton('2026년 7월 11일'))

    expect(screen.getByText('(4일)')).toBeInTheDocument()

    apply()
    expect(onApply).toHaveBeenCalledWith([new Date(2026, 6, 11), new Date(2026, 6, 14)])
  })

  it('🔴 둘 다 고른 뒤 다시 누르면 처음부터 다시 고른다', () => {
    const { onApply } = renderDrawer()

    fireEvent.click(dayButton('2026년 7월 10일'))
    fireEvent.click(dayButton('2026년 7월 12일'))
    fireEvent.click(dayButton('2026년 7월 15일'))

    expect(screen.getByText('(1일)')).toBeInTheDocument()

    apply()
    expect(onApply).toHaveBeenCalledWith([new Date(2026, 6, 15), null])
  })

  it('아무것도 안 고르고 적용하면 안내가 뜨고 닫히지 않는다', () => {
    const { onApply } = renderDrawer()

    apply()

    expect(screen.getByText('날짜를 선택해주세요.')).toBeInTheDocument()
    expect(onApply).not.toHaveBeenCalled()
  })

  it('이미 고른 기간이 있으면 그 상태로 열린다', () => {
    renderDrawer({ initialPeriod: [new Date(2026, 6, 10), new Date(2026, 6, 13)] })

    expect(screen.getByText('(4일)')).toBeInTheDocument()
  })
})
