import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'

import { AccountDeletionPage } from '@/features/mypage/pages/AccountDeletionPage'
import { API_PREFIX } from '@/shared/constants/api'
import { useAuthStore } from '@/shared/stores/authStore'
import { url } from '@/testing/mocks/handlers'
import { server } from '@/testing/mocks/server'
import { renderWithProviders, screen, userEvent, waitFor } from '@/testing/utils'

const RESIDENT_UUID = 'resident-uuid-1'

describe('AccountDeletionPage', () => {
  beforeEach(() => {
    localStorage.clear()
    useAuthStore.setState({
      aptInfo: { aptResidentUuid: RESIDENT_UUID, contentList: [{ name: '로비폰' }] },
    })
  })

  it('동의 전에는 탈퇴 버튼이 비활성이다', () => {
    renderWithProviders({ ui: <AccountDeletionPage /> })

    expect(screen.getByRole('button', { name: '탈퇴하기' })).toBeDisabled()
  })

  it('동의하면 탈퇴 버튼이 활성된다', async () => {
    renderWithProviders({ ui: <AccountDeletionPage /> })

    await userEvent.click(screen.getByRole('checkbox'))

    expect(screen.getByRole('button', { name: '탈퇴하기' })).toBeEnabled()
  })

  it('탈퇴하면 로비폰 서버에도 통보하고 세션을 정리한다', async () => {
    let hasNotifiedLobbyPhone = false
    server.use(
      http.delete(url({ path: API_PREFIX.APARTMANT }), () => {
        return HttpResponse.json({ success: null })
      }),
      http.delete(
        url({ path: `${API_PREFIX.APARTMANT}/${RESIDENT_UUID}/lobby-phone/resident` }),
        () => {
          hasNotifiedLobbyPhone = true
          return HttpResponse.json({ success: null })
        },
      ),
    )
    renderWithProviders({ ui: <AccountDeletionPage /> })

    await userEvent.click(screen.getByRole('checkbox'))
    await userEvent.click(screen.getByRole('button', { name: '탈퇴하기' }))

    await waitFor(() => {
      expect(hasNotifiedLobbyPhone).toBe(true)
    })
    // 서버에서 계정이 사라졌으므로 로컬 세션도 반드시 비워야 한다
    await waitFor(() => {
      expect(useAuthStore.getState().aptInfo).toEqual({})
    })
  })

  it('로비폰 통보가 실패해도 세션은 정리한다', async () => {
    server.use(
      http.delete(url({ path: API_PREFIX.APARTMANT }), () => {
        return HttpResponse.json({ success: null })
      }),
      http.delete(
        url({ path: `${API_PREFIX.APARTMANT}/${RESIDENT_UUID}/lobby-phone/resident` }),
        () => {
          return HttpResponse.json(
            { error: { errorCode: 'LOBBY_PHONE_ERROR', message: '로비폰 서버 오류' } },
            { status: 500 },
          )
        },
      ),
    )
    renderWithProviders({ ui: <AccountDeletionPage /> })

    await userEvent.click(screen.getByRole('checkbox'))
    await userEvent.click(screen.getByRole('button', { name: '탈퇴하기' }))

    await waitFor(() => {
      expect(useAuthStore.getState().aptInfo).toEqual({})
    })
  })
})
