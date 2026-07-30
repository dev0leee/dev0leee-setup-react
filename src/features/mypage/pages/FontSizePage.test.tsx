import { beforeEach, describe, expect, it } from 'vitest'

import { FontSizePage } from '@/features/mypage/pages/FontSizePage'
import { FONT_SIZE_SCALE } from '@/shared/constants/fontSize'
import { STORAGE_KEY } from '@/shared/constants/storage'
import { useFontSizeStore } from '@/shared/stores/fontSizeStore'
import { fireEvent, renderWithProviders, screen } from '@/testing/utils'

describe('FontSizePage', () => {
  beforeEach(() => {
    localStorage.clear()
    useFontSizeStore.setState({ fontSize: FONT_SIZE_SCALE.MEDIUM })
  })

  it('현재 단계의 라벨을 보여준다', () => {
    renderWithProviders({ ui: <FontSizePage /> })

    expect(screen.getByText('보통')).toBeInTheDocument()
    expect(screen.getByRole('slider')).toHaveValue('2')
  })

  it('슬라이더는 5단계다', () => {
    renderWithProviders({ ui: <FontSizePage /> })

    const slider = screen.getByRole('slider')
    expect(slider).toHaveAttribute('min', '0')
    expect(slider).toHaveAttribute('max', '4')
  })

  it('슬라이더를 옮기면 라벨이 바뀌고 localStorage에 저장된다', () => {
    renderWithProviders({ ui: <FontSizePage /> })

    // range 입력은 userEvent의 타이핑 대상이 아니라 값 변경 이벤트를 직접 쏜다
    fireEvent.change(screen.getByRole('slider'), { target: { value: '4' } })

    expect(screen.getByText('매우 크게')).toBeInTheDocument()
    // 앱 재시작 후에도 유지돼야 한다. JSON이 아니라 문자열 원본으로 저장한다
    expect(localStorage.getItem(STORAGE_KEY.FONT_SIZE)).toBe(FONT_SIZE_SCALE.VERY_LARGE)
  })

  it('미리보기 문구를 두 줄로 보여준다', () => {
    renderWithProviders({ ui: <FontSizePage /> })

    const preview = screen.getByText(/글자가 이 크기로 표시됩니다\./)
    expect(preview.textContent).toContain('Text will be displayed at this size.')
    expect(preview.querySelector('br')).not.toBeNull()
  })
})
