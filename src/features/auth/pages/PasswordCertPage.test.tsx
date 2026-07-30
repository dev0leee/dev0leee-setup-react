import { http, HttpResponse } from 'msw'
import { Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { PasswordCertPage } from '@/features/auth/pages/PasswordCertPage'
import { url } from '@/testing/mocks/handlers'
import { server } from '@/testing/mocks/server'
import { act, renderWithProviders, screen, userEvent, waitFor } from '@/testing/utils'

const PHONE = '01012345678'

const renderCertPage = () => {
  return renderWithProviders({
    initialEntries: ['/password/cert'],
    ui: (
      <Routes>
        <Route path="/" element={<h1>인트로</h1>} />
        <Route path="/password/cert" element={<PasswordCertPage />} />
        <Route path="/password/reset" element={<h1>새 비밀번호 설정</h1>} />
      </Routes>
    ),
  })
}

const sendCode = async () => {
  await userEvent.type(screen.getByPlaceholderText('숫자만 입력'), PHONE)
  await userEvent.click(screen.getByRole('button', { name: '인증번호 전송' }))

  return screen.findByPlaceholderText('인증번호 입력')
}

describe('PasswordCertPage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('인증번호를 보내면 코드 입력과 타이머가 나타나고 휴대폰 입력이 잠긴다', async () => {
    renderCertPage()

    await sendCode()

    expect(screen.getByPlaceholderText('숫자만 입력')).toBeDisabled()
    expect(screen.getByText('03:00')).toBeInTheDocument()
    // 전송 버튼은 사라지고 재요청 버튼으로 바뀐다
    expect(screen.queryByRole('button', { name: '인증번호 전송' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: '재요청' })).toBeEnabled()
  })

  it('폼 필드는 noHyphenPhone인데 서버에는 phone으로 보낸다', async () => {
    let requestBody: Record<string, string> | null = null
    server.use(
      http.post(url({ path: '/apartmant/sms/password-reset/send-code' }), async ({ request }) => {
        requestBody = (await request.json()) as Record<string, string>
        return new HttpResponse(null, { status: 204 })
      }),
    )
    renderCertPage()

    await sendCode()

    await waitFor(() => {
      expect(requestBody).toEqual({ phone: PHONE })
    })
  })

  it('하이픈을 넣으면 형식 오류로 막고 요청하지 않는다', async () => {
    // 이 화면의 입력은 `type="text"`라 자동 하이픈이 없다. `PHONE_CUSTOM_REGEX`가
    // 하이픈 없는 형태만 받으므로 붙여넣기로 들어온 하이픈은 검증에서 걸린다.
    renderCertPage()

    await userEvent.type(screen.getByPlaceholderText('숫자만 입력'), '010-1234-5678')

    expect(
      await screen.findByText('휴대폰 번호 형식으로 - 없이 올바르게 입력해주세요'),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '인증번호 전송' })).toBeDisabled()
  })

  it('재요청은 한 번만 누를 수 있다', async () => {
    // 레거시 `resendCodeValue`가 false로 내려간 뒤 다시 true가 되지 않는다 (`auth.md` A-Q1).
    renderCertPage()
    await sendCode()

    const resendButton = screen.getByRole('button', { name: '재요청' })
    await userEvent.click(resendButton)

    await waitFor(() => {
      expect(resendButton).toBeDisabled()
    })
  })

  it('인증번호가 6자리가 아니면 에러 문구를 보여준다', async () => {
    renderCertPage()
    const codeInput = await sendCode()

    await userEvent.type(codeInput, '123')

    expect(await screen.findByText('인증번호는 6자리 숫자여야 합니다.')).toBeInTheDocument()
  })

  it('인증에 성공하면 재설정 화면으로 넘어간다', async () => {
    renderCertPage()
    const codeInput = await sendCode()

    await userEvent.type(codeInput, '123456')
    await userEvent.click(screen.getByRole('button', { name: '완료' }))

    expect(await screen.findByRole('heading', { name: '새 비밀번호 설정' })).toBeInTheDocument()
  })

  describe('타이머', () => {
    beforeEach(() => {
      vi.useFakeTimers({ shouldAdvanceTime: true })
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('1초마다 줄어든다', async () => {
      renderCertPage()
      await sendCode()

      act(() => {
        vi.advanceTimersByTime(1_000)
      })
      expect(screen.getByText('02:59')).toBeInTheDocument()

      act(() => {
        vi.advanceTimersByTime(59_000)
      })
      expect(screen.getByText('02:00')).toBeInTheDocument()
    })

    it('3분이 지나면 인트로로 돌려보낸다', async () => {
      renderCertPage()
      await sendCode()

      // 180초를 다 쓰면 00:00이 되고, **그다음 tick**에서 이동한다 (레거시 동작).
      act(() => {
        vi.advanceTimersByTime(180_000)
      })
      expect(screen.getByText('00:00')).toBeInTheDocument()

      act(() => {
        vi.advanceTimersByTime(1_000)
      })
      expect(await screen.findByRole('heading', { name: '인트로' })).toBeInTheDocument()
    })
  })
})
