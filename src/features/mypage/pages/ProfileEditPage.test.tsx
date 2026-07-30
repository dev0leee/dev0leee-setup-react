import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'

import { ProfileEditPage } from '@/features/mypage/pages/ProfileEditPage'
import { API_PREFIX } from '@/shared/constants/api'
import { useAuthStore } from '@/shared/stores/authStore'
import { url } from '@/testing/mocks/handlers'
import { server } from '@/testing/mocks/server'
import { renderWithProviders, screen, userEvent, waitFor } from '@/testing/utils'

const RESIDENT_UUID = 'resident-uuid-1'

describe('ProfileEditPage', () => {
  beforeEach(() => {
    localStorage.clear()
    useAuthStore.setState({
      aptInfo: {
        aptResidentUuid: RESIDENT_UUID,
        aptName: '아파트먼트 1단지',
        residentName: '홍길동',
        residentNickName: '길동',
      },
      userAuthInfo: { id: '010-1234-5678', password: 'old-password!' },
    })
  })

  it('이름은 읽기 전용이고 닉네임만 편집할 수 있다', () => {
    renderWithProviders({ ui: <ProfileEditPage /> })

    expect(screen.getByLabelText('이름')).toBeDisabled()
    expect(screen.getByLabelText('이름')).toHaveValue('홍길동')
    expect(screen.getByLabelText('닉네임')).toBeEnabled()
    expect(screen.getByLabelText('닉네임')).toHaveValue('길동')
  })

  it('닉네임이 1자면 에러 문구를 보여준다', async () => {
    renderWithProviders({ ui: <ProfileEditPage /> })

    const nickNameInput = screen.getByLabelText('닉네임')
    await userEvent.clear(nickNameInput)
    await userEvent.type(nickNameInput, '가')

    expect(await screen.findByText('2~10자로 입력해주세요')).toBeInTheDocument()
  })

  it('특수문자가 들어가면 에러 문구를 보여준다', async () => {
    renderWithProviders({ ui: <ProfileEditPage /> })

    const nickNameInput = screen.getByLabelText('닉네임')
    await userEvent.clear(nickNameInput)
    await userEvent.type(nickNameInput, '길동!!')

    expect(await screen.findByText('한글, 영문, 숫자만')).toBeInTheDocument()
  })

  it('완료를 누르면 닉네임만 서버로 보내고 단지 컨텍스트를 갱신한다', async () => {
    let requestBody: Record<string, string> | null = null
    server.use(
      http.patch(
        url({ path: `${API_PREFIX.APARTMANT}/apt-resident/${RESIDENT_UUID}/info` }),
        async ({ request }) => {
          requestBody = (await request.json()) as Record<string, string>
          return HttpResponse.json({ success: null })
        },
      ),
    )
    renderWithProviders({ ui: <ProfileEditPage /> })

    const nickNameInput = screen.getByLabelText('닉네임')
    await userEvent.clear(nickNameInput)
    await userEvent.type(nickNameInput, '새닉네임')
    await userEvent.click(screen.getByRole('button', { name: '완료' }))

    // 이름은 폼 값에 있지만 요청 body에는 닉네임만 담긴다
    await waitFor(() => {
      expect(requestBody).toEqual({ nickName: '새닉네임' })
    })

    await waitFor(() => {
      expect(useAuthStore.getState().aptInfo.residentNickName).toBe('새닉네임')
    })
    // 이름은 그대로 유지된다 (읽기 전용 값을 다시 쓴다)
    expect(useAuthStore.getState().aptInfo.residentName).toBe('홍길동')
  })

  describe('비밀번호 변경 모달', () => {
    const openModal = async () => {
      renderWithProviders({ ui: <ProfileEditPage /> })
      await userEvent.click(screen.getByRole('button', { name: '비밀번호 변경하기' }))
    }

    it('세 필드를 모두 채워야 변경 버튼이 활성화된다', async () => {
      await openModal()

      const submitButton = screen.getByRole('button', { name: '변경' })
      expect(submitButton).toBeDisabled()

      await userEvent.type(screen.getByLabelText(/현재 비밀번호/), 'abcd1234!')
      await userEvent.type(screen.getByLabelText(/변경할 비밀번호/), 'newpass1234!')
      expect(submitButton).toBeDisabled()

      await userEvent.type(screen.getByLabelText(/비밀번호 확인/), 'newpass1234!')
      await waitFor(() => {
        expect(submitButton).toBeEnabled()
      })
    })

    it('새 비밀번호가 일치하지 않으면 에러 문구를 보여준다', async () => {
      await openModal()

      await userEvent.type(screen.getByLabelText(/현재 비밀번호/), 'abcd1234!')
      await userEvent.type(screen.getByLabelText(/변경할 비밀번호/), 'newpass1234!')
      await userEvent.type(screen.getByLabelText(/비밀번호 확인/), 'other1234!')

      expect(await screen.findByText('비밀번호가 일치하지 않습니다.')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '변경' })).toBeDisabled()
    })

    it('변경에 성공하면 모달이 닫히고 저장된 비밀번호가 갱신된다', async () => {
      server.use(
        http.patch(url({ path: `${API_PREFIX.APARTMANT}/password` }), () => {
          return HttpResponse.json({ success: null })
        }),
      )
      await openModal()

      await userEvent.type(screen.getByLabelText(/현재 비밀번호/), 'abcd1234!')
      await userEvent.type(screen.getByLabelText(/변경할 비밀번호/), 'newpass1234!')
      await userEvent.type(screen.getByLabelText(/비밀번호 확인/), 'newpass1234!')
      await userEvent.click(screen.getByRole('button', { name: '변경' }))

      // 자동 로그인이 옛 비밀번호로 시도하지 않도록 저장값을 함께 갱신한다
      await waitFor(() => {
        expect(useAuthStore.getState().userAuthInfo?.password).toBe('newpass1234!')
      })
      // 모달만 닫힌다. 화면 이동은 없다 — 제출 버튼이 사라지는 것으로 확인한다
      // (`비밀번호 변경하기`는 모달 제목이자 뒤에 남아 있는 트리거 버튼 문구다)
      await waitFor(() => {
        expect(screen.queryByRole('button', { name: '변경' })).not.toBeInTheDocument()
      })
      expect(screen.getByRole('button', { name: '비밀번호 변경하기' })).toBeInTheDocument()
    })
  })
})
