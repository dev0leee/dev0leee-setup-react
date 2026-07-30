import { Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'

import { IntroPage } from '@/features/auth/pages/IntroPage'
import { STORAGE_KEY } from '@/shared/constants/storage'
import { useAuthStore } from '@/shared/stores/authStore'
import { renderWithProviders, screen, userEvent } from '@/testing/utils'

/** 브랜드 색 solid 버튼의 배경 클래스. 활성/비활성 색을 이것으로 구분한다 */
const BRAND_BACKGROUND_CLASS = 'bg-brand-default-background-brand'
const DISABLED_BACKGROUND_CLASS = 'bg-defaults-secondary-background-secondary'

const renderIntro = () => {
  return renderWithProviders({
    initialEntries: ['/intro'],
    ui: (
      <Routes>
        <Route path="/intro" element={<IntroPage />} />
        <Route path="/password/cert" element={<h1>비밀번호 인증</h1>} />
        <Route path="/signup/terms" element={<h1>약관 동의</h1>} />
      </Routes>
    ),
  })
}

describe('IntroPage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('진입하면 남아 있던 인증 정보를 지운다', () => {
    localStorage.setItem(STORAGE_KEY.ACCESS_TOKEN, 'stale-token')
    useAuthStore.setState({
      aptInfo: { aptResidentUuid: 'resident-uuid-1' },
      userAuthInfo: { id: '010-1234-5678', password: 'pw' },
    })

    renderIntro()

    expect(localStorage.getItem(STORAGE_KEY.ACCESS_TOKEN)).toBeNull()
    expect(useAuthStore.getState().aptInfo).toEqual({})
    expect(useAuthStore.getState().userAuthInfo).toBeNull()
  })

  it('진입 직후 로그인 버튼이 활성색이다', () => {
    // 레거시 `meta.valid`는 검증 전에 true다 — 빈 폼인데도 파란 버튼으로 시작한다.
    // `formState.isValid`로 바꾸면 이 테스트가 깨진다 (`recipe.md` §7).
    renderIntro()

    expect(screen.getByRole('button', { name: '로그인' })).toHaveClass(BRAND_BACKGROUND_CLASS)
  })

  it('휴대폰 번호 형식이 틀리면 에러 문구가 뜨고 버튼이 비활성색이 된다', async () => {
    renderIntro()

    await userEvent.type(screen.getByPlaceholderText('휴대폰 번호(- 없이 숫자만 입력)'), '123')

    expect(await screen.findByText('휴대폰 번호 형식으로 - 없이 입력해주세요')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '로그인' })).toHaveClass(DISABLED_BACKGROUND_CLASS)
  })

  it('휴대폰 번호를 입력하면 하이픈이 자동으로 붙는다', async () => {
    renderIntro()

    const idInput = screen.getByPlaceholderText('휴대폰 번호(- 없이 숫자만 입력)')
    await userEvent.type(idInput, '01012345678')

    expect(idInput).toHaveValue('010-1234-5678')
  })

  it('비밀번호를 지우면 필수 문구를 보여준다', async () => {
    renderIntro()

    const passwordInput = screen.getByPlaceholderText('비밀번호')
    await userEvent.type(passwordInput, 'a')
    await userEvent.clear(passwordInput)

    expect(await screen.findByText('비밀번호를 입력해주세요')).toBeInTheDocument()
  })

  it('비밀번호 찾기와 회원가입으로 이동한다', async () => {
    renderIntro()

    await userEvent.click(screen.getByRole('button', { name: '비밀번호를 잊어버리셨나요?' }))
    expect(await screen.findByRole('heading', { name: '비밀번호 인증' })).toBeInTheDocument()
  })

  it('회원가입 안내를 누르면 가입 약관 화면으로 간다', async () => {
    renderIntro()

    await userEvent.click(screen.getByRole('button', { name: /아직 회원이 아니신가요\?/ }))
    expect(await screen.findByRole('heading', { name: '약관 동의' })).toBeInTheDocument()
  })
})
