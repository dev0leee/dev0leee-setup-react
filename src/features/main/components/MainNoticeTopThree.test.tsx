import { http, HttpResponse } from 'msw'
import { Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'

import { MainNoticeTopThree } from '@/features/main/components/MainNoticeTopThree'
import { API_PREFIX } from '@/shared/constants/api'
import { useAuthStore } from '@/shared/stores/authStore'
import { url } from '@/testing/mocks/handlers'
import { server } from '@/testing/mocks/server'
import { renderWithProviders, screen, userEvent } from '@/testing/utils'

const APT_UUID = 'apt-uuid-1'

const NOTICE_PATH = `${API_PREFIX.BOARD}/notice/${APT_UUID}/top-three`

const MOCK_NOTICES = [
  { uuid: 'notice-1', categoryName: '일반', title: '엘리베이터 점검 안내' },
  { uuid: 'notice-2', categoryName: '긴급', title: '단수 안내' },
  { uuid: 'notice-3', categoryName: '행사', title: '반상회 안내' },
]

describe('MainNoticeTopThree', () => {
  beforeEach(() => {
    localStorage.clear()
    useAuthStore.setState({ aptInfo: { aptUuid: APT_UUID } })
  })

  it('공지 3건을 카테고리와 제목으로 보여주고 더보기가 나온다', async () => {
    server.use(
      http.get(url({ path: NOTICE_PATH }), () => {
        return HttpResponse.json({ success: MOCK_NOTICES })
      }),
    )
    renderWithProviders({ ui: <MainNoticeTopThree /> })

    expect(await screen.findByText('엘리베이터 점검 안내')).toBeInTheDocument()
    expect(screen.getByText('긴급')).toBeInTheDocument()
    expect(screen.getByText('더보기')).toBeInTheDocument()
  })

  it('공지가 없으면 더보기 없이 빈 상태만 보인다', async () => {
    server.use(
      http.get(url({ path: NOTICE_PATH }), () => {
        return HttpResponse.json({ success: [] })
      }),
    )
    renderWithProviders({ ui: <MainNoticeTopThree /> })

    expect(await screen.findByText('공지사항이 없습니다.')).toBeInTheDocument()
    expect(screen.queryByText('더보기')).not.toBeInTheDocument()
  })

  it('조회가 실패하면 안내 문구를 보여준다', async () => {
    server.use(
      http.get(url({ path: NOTICE_PATH }), () => {
        return HttpResponse.json({ error: { errorCode: 'X', message: 'x' } }, { status: 500 })
      }),
    )
    renderWithProviders({ ui: <MainNoticeTopThree /> })

    expect(await screen.findByText(/공지사항을 불러오는데 실패했습니다/)).toBeInTheDocument()
  })

  it('제목을 누르면 상세로 이동한다', async () => {
    server.use(
      http.get(url({ path: NOTICE_PATH }), () => {
        return HttpResponse.json({ success: MOCK_NOTICES })
      }),
    )
    renderWithProviders({
      ui: (
        <Routes>
          <Route path="/" element={<MainNoticeTopThree />} />
          <Route path="/board/notice/detail/:uuid" element={<h1>공지 상세</h1>} />
        </Routes>
      ),
    })

    await userEvent.click(await screen.findByText('단수 안내'))

    expect(await screen.findByRole('heading', { name: '공지 상세' })).toBeInTheDocument()
  })

  it('제목의 줄바꿈이 `<br/>` 글자로 보인다', async () => {
    // ⚠️ 레거시가 `formatHtmlText` 결과를 텍스트로 출력한다. 태그가 그대로 보이는 것이
    // 현재 동작이라 그대로 못박는다 (`MainNoticeTopThree.tsx` 주석).
    server.use(
      http.get(url({ path: NOTICE_PATH }), () => {
        return HttpResponse.json({
          success: [{ uuid: 'notice-1', categoryName: '일반', title: '위\n아래' }],
        })
      }),
    )
    renderWithProviders({ ui: <MainNoticeTopThree /> })

    expect(await screen.findByText('위<br/>아래')).toBeInTheDocument()
  })
})
