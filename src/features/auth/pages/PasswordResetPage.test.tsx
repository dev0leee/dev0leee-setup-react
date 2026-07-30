import { http, HttpResponse } from 'msw'
import { Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'

import { PasswordResetPage } from '@/features/auth/pages/PasswordResetPage'
import { API_PREFIX } from '@/shared/constants/api'
import { url } from '@/testing/mocks/handlers'
import { server } from '@/testing/mocks/server'
import { renderWithProviders, screen, userEvent, waitFor } from '@/testing/utils'

const VERIFIED_TOKEN = 'verified-token'
const VALID_PASSWORD = 'abcd1234!'

const renderResetPage = ({ verifiedToken }: { verifiedToken?: string } = {}) => {
  return renderWithProviders({
    initialEntries: [
      {
        pathname: '/password/reset',
        state: verifiedToken === undefined ? null : { verifiedToken },
      },
    ],
    ui: (
      <Routes>
        <Route path="/" element={<h1>인트로</h1>} />
        <Route path="/password/reset" element={<PasswordResetPage />} />
      </Routes>
    ),
  })
}

describe('PasswordResetPage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('인증 토큰 없이 들어오면 인트로로 돌려보낸다', async () => {
    renderResetPage()

    expect(await screen.findByRole('heading', { name: '인트로' })).toBeInTheDocument()
  })

  it('비밀번호 형식이 틀리면 에러 문구를 보여준다', async () => {
    renderResetPage({ verifiedToken: VERIFIED_TOKEN })

    await userEvent.type(screen.getByLabelText(/비밀번호$/), 'short')

    expect(
      await screen.findByText('영문, 숫자, 특수문자(~!@#$%^&*()?) 3가지 포함 8자 이상'),
    ).toBeInTheDocument()
  })

  it('두 값이 다르면 확인 필드에 불일치 문구를 붙인다', async () => {
    renderResetPage({ verifiedToken: VERIFIED_TOKEN })

    await userEvent.type(screen.getByLabelText(/비밀번호$/), VALID_PASSWORD)
    await userEvent.type(screen.getByLabelText('비밀번호 확인'), 'other1234!')

    expect(await screen.findByText('비밀번호가 일치하지 않습니다')).toBeInTheDocument()
  })

  it('완료를 누르면 인증 토큰을 헤더에 담아 새 비밀번호를 보낸다', async () => {
    let authorizationHeader: string | null = null
    let requestBody: Record<string, string> | null = null
    server.use(
      http.patch(url({ path: `${API_PREFIX.APARTMANT}/re-set-password` }), async ({ request }) => {
        authorizationHeader = request.headers.get('authorization')
        requestBody = (await request.json()) as Record<string, string>
        return new HttpResponse(null, { status: 204 })
      }),
    )
    renderResetPage({ verifiedToken: VERIFIED_TOKEN })

    await userEvent.type(screen.getByLabelText(/비밀번호$/), VALID_PASSWORD)
    await userEvent.type(screen.getByLabelText('비밀번호 확인'), VALID_PASSWORD)
    await userEvent.click(screen.getByRole('button', { name: '완료' }))

    await waitFor(() => {
      expect(authorizationHeader).toBe(`Bearer ${VERIFIED_TOKEN}`)
    })
    // ⚠️ 레거시가 `password`가 아니라 `passwordConfirm` 값을 보낸다 (`auth.md` 주의 7)
    expect(requestBody).toEqual({ password: VALID_PASSWORD })

    expect(await screen.findByRole('heading', { name: '인트로' })).toBeInTheDocument()
  })
})
