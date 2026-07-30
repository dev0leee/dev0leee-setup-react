import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ErrorModal } from '@/shared/components/common/ErrorModal'
import { showErrorModal } from '@/shared/lib/errorModal'
import { useErrorModalStore } from '@/shared/stores/errorModalStore'
import { renderWithProviders, screen, userEvent, waitFor } from '@/testing/utils'

/**
 * 76개 파일 · 293곳이 이 모달에 의존한다. 문구 기본값과 callback 규칙이 곧 계약이다.
 */
describe('ErrorModal', () => {
  beforeEach(() => {
    useErrorModalStore.setState({ current: null })
  })

  it('닫혀 있을 때는 아무것도 렌더하지 않는다', () => {
    renderWithProviders({ ui: <ErrorModal /> })

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('showErrorModal을 부르면 텍스트와 확인 버튼이 보인다', async () => {
    renderWithProviders({ ui: <ErrorModal /> })

    showErrorModal({ text: '아이디 또는 비밀번호가 일치하지 않습니다.' })

    expect(await screen.findByText('아이디 또는 비밀번호가 일치하지 않습니다.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '확인' })).toBeInTheDocument()
  })

  it('text를 주지 않으면 레거시 기본 문구를 쓴다', async () => {
    renderWithProviders({ ui: <ErrorModal /> })

    showErrorModal()

    expect(
      await screen.findByText('에러가 발생했습니다. 잠시 후 다시 시도해주세요.'),
    ).toBeInTheDocument()
  })

  it('html은 살균해서 렌더하고 text보다 우선한다', async () => {
    renderWithProviders({ ui: <ErrorModal /> })

    showErrorModal({
      text: '무시돼야 한다',
      html: '게시판 사용이 제한된 사용자입니다.<br/>관리사무소로 문의해 주세요.<script>alert(1)</script>',
    })

    const dialog = await screen.findByRole('dialog')
    expect(dialog).toHaveTextContent('게시판 사용이 제한된 사용자입니다.')
    expect(dialog).toHaveTextContent('관리사무소로 문의해 주세요.')
    expect(dialog).not.toHaveTextContent('무시돼야 한다')
    // DOMPurify가 script를 걷어냈는지
    expect(dialog.querySelector('script')).toBeNull()
    expect(dialog.querySelector('br')).not.toBeNull()
  })

  it('확인 버튼을 누르면 callback이 실행되고 닫힌다', async () => {
    const callback = vi.fn()
    renderWithProviders({ ui: <ErrorModal /> })

    showErrorModal({ text: '만료되었습니다', callback })

    await userEvent.click(await screen.findByRole('button', { name: '확인' }))

    expect(callback).toHaveBeenCalledTimes(1)
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
  })

  it('확인이 아닌 경로로 닫히면 callback을 실행하지 않는다', () => {
    const callback = vi.fn()
    showErrorModal({ text: '만료되었습니다', callback })

    // 배경 클릭·Esc는 SweetAlert2의 dismiss에 해당한다.
    useErrorModalStore.getState().dismiss()

    expect(callback).not.toHaveBeenCalled()
    expect(useErrorModalStore.getState().current).toBeNull()
  })

  it('confirmButtonText를 바꿀 수 있다', async () => {
    renderWithProviders({ ui: <ErrorModal /> })

    showErrorModal({ text: '나가시겠습니까?', confirmButtonText: '나가기' })

    expect(await screen.findByRole('button', { name: '나가기' })).toBeInTheDocument()
  })
})
