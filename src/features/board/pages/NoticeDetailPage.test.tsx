import { http, HttpResponse } from 'msw'
import { Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { NoticeDetailPage } from '@/features/board/pages/NoticeDetailPage'
import { API_PREFIX } from '@/shared/constants/api'
import { NATIVE_HANDLER, TO_NATIVE } from '@/shared/constants/native'
import { useAuthStore } from '@/shared/stores/authStore'
import { url } from '@/testing/mocks/handlers'
import { server } from '@/testing/mocks/server'
import { renderWithProviders, screen, userEvent, waitFor } from '@/testing/utils'

const APT_UUID = 'apt-uuid-1'
const NOTICE_UUID = 'notice-1'

const DETAIL_PATH = `${API_PREFIX.BOARD}/notice/${APT_UUID}/${NOTICE_UUID}`

/** Quill Delta 문자열을 만든다 */
const toDelta = (text: string) => {
  return JSON.stringify({ ops: [{ insert: `${text}\n` }] })
}

const renderDetail = () => {
  renderWithProviders({
    initialEntries: [`/board/notice/detail/${NOTICE_UUID}`],
    ui: (
      <Routes>
        <Route path="/board/notice/detail/:noticeUuid" element={<NoticeDetailPage />} />
      </Routes>
    ),
  })
}

describe('NoticeDetailPage', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
    Reflect.deleteProperty(window, NATIVE_HANDLER)
    useAuthStore.setState({ aptInfo: { aptUuid: APT_UUID } })
  })

  it('제목과 본문을 Delta에서 변환해 보여준다', async () => {
    // ⚠️ **제목도 Delta다** — 아파트먼트 공지(B4)와 다른 점이다
    server.use(
      http.get(url({ path: DETAIL_PATH }), () => {
        return HttpResponse.json({
          success: {
            title: toDelta('여름철 단수 안내'),
            content: toDelta('8월 1일 단수됩니다.'),
            categoryName: '일반',
            createdDate: '2026-07-29T10:00:00',
            viewCount: 128,
          },
        })
      }),
    )
    renderDetail()

    expect(await screen.findByRole('heading', { name: '여름철 단수 안내' })).toBeInTheDocument()
    expect(screen.getByText('8월 1일 단수됩니다.')).toBeInTheDocument()
    expect(screen.getByText('128')).toBeInTheDocument()
  })

  it('제목·본문이 비면 `정보없음`이다', async () => {
    server.use(
      http.get(url({ path: DETAIL_PATH }), () => {
        return HttpResponse.json({ success: { categoryName: '일반', viewCount: 0 } })
      }),
    )
    renderDetail()

    await waitFor(() => {
      expect(screen.getAllByText('정보없음')).toHaveLength(2)
    })
  })

  it('본문 링크를 누르면 앱에서는 시스템 브라우저로 연다', async () => {
    const postMessage = vi.fn()
    Object.assign(window, { [NATIVE_HANDLER]: { postMessage } })
    vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue('Android')

    server.use(
      http.get(url({ path: DETAIL_PATH }), () => {
        return HttpResponse.json({
          success: {
            title: toDelta('공지'),
            content: '<p><a href="https://example.test/notice">자세히 보기</a></p>',
          },
        })
      }),
    )
    renderDetail()

    await userEvent.click(await screen.findByText('자세히 보기'))

    const sent = postMessage.mock.calls
      .map((call) => {
        return String(call[0])
      })
      .find((body) => {
        return body.includes(TO_NATIVE.OPEN_SYSTEM_BROWSER)
      })

    expect(sent).toBeDefined()
    expect(String(sent)).toContain('https://example.test/notice')
  })

  it('첨부파일이 있으면 목록에 나온다', async () => {
    server.use(
      http.get(url({ path: DETAIL_PATH }), () => {
        return HttpResponse.json({
          success: {
            title: toDelta('공지'),
            content: toDelta('본문'),
            fileList: [{ fileUuid: 'f-1', fileName: '안내문.pdf', fileUrl: '/notice/a.pdf' }],
          },
        })
      }),
    )
    renderDetail()

    expect(await screen.findByText('안내문.pdf')).toBeInTheDocument()
  })
})
