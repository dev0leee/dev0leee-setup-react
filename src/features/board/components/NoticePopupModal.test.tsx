import { http, HttpResponse } from 'msw'
import { Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { NoticePopupModal } from '@/features/board/components/NoticePopupModal'
import { API_PREFIX } from '@/shared/constants/api'
import { useAuthStore } from '@/shared/stores/authStore'
import { url } from '@/testing/mocks/handlers'
import { server } from '@/testing/mocks/server'
import { renderWithProviders, screen, userEvent, waitFor } from '@/testing/utils'

const APT_UUID = 'apt-uuid-1'
const POPUP_PATH = `${API_PREFIX.BOARD}/notice/${APT_UUID}/top1-thumbnail`

const clearCookies = () => {
  document.cookie.split(';').forEach((cookie) => {
    const name = cookie.split('=')[0]?.trim()
    if (name) document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`
  })
}

/** 팝업 대상이 있는 응답 */
const mockPopup = ({ hasTarget }: { hasTarget: boolean }) => {
  server.use(
    http.get(url({ path: POPUP_PATH }), () => {
      // ⚠️ 대상이 없으면 서버가 **빈 객체**를 준다 (404가 아니다)
      return HttpResponse.json({
        success: hasTarget
          ? { uuid: 'notice-1', title: '단수 안내', thumbnailFilePath: '/popup/a.png' }
          : {},
      })
    }),
  )
}

describe('NoticePopupModal', () => {
  beforeEach(() => {
    localStorage.clear()
    clearCookies()
    useAuthStore.setState({ aptInfo: { aptUuid: APT_UUID } })
  })

  afterEach(() => {
    clearCookies()
  })

  it('썸네일 대상이 있으면 팝업이 뜬다', async () => {
    mockPopup({ hasTarget: true })
    renderWithProviders({ ui: <NoticePopupModal /> })

    expect(await screen.findByAltText('단수 안내')).toBeInTheDocument()
    expect(screen.getByText('오늘 하루 보지 않기')).toBeInTheDocument()
  })

  it('대상이 없으면(빈 객체) 뜨지 않는다', async () => {
    mockPopup({ hasTarget: false })
    renderWithProviders({ ui: <NoticePopupModal /> })

    // 잠깐 기다려도 나타나지 않아야 한다
    await waitFor(() => {
      expect(screen.queryByText('닫기')).not.toBeInTheDocument()
    })
  })

  it('닫기를 누르면 사라진다', async () => {
    mockPopup({ hasTarget: true })
    renderWithProviders({ ui: <NoticePopupModal /> })

    await userEvent.click(await screen.findByText('닫기'))

    expect(screen.queryByText('닫기')).not.toBeInTheDocument()
  })

  it('썸네일을 누르면 상세로 간다', async () => {
    mockPopup({ hasTarget: true })
    renderWithProviders({
      ui: (
        <Routes>
          <Route path="/" element={<NoticePopupModal />} />
          <Route path="/board/notice/detail/:noticeUuid" element={<h1>공지 상세</h1>} />
        </Routes>
      ),
    })

    await userEvent.click(await screen.findByAltText('단수 안내'))

    expect(await screen.findByRole('heading', { name: '공지 상세' })).toBeInTheDocument()
  })

  it('`오늘 하루 보지 않기`는 쿠키를 남기고, 다시 열어도 뜨지 않는다', async () => {
    mockPopup({ hasTarget: true })
    const { unmount } = renderWithProviders({ ui: <NoticePopupModal /> })

    await userEvent.click(await screen.findByText('오늘 하루 보지 않기'))

    expect(document.cookie).toContain('noticePopupHideToday=true')
    unmount()

    renderWithProviders({ ui: <NoticePopupModal /> })
    await waitFor(() => {
      expect(screen.queryByText('오늘 하루 보지 않기')).not.toBeInTheDocument()
    })
  })
})
