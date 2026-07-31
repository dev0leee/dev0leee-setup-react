import { http, HttpResponse } from 'msw'
import { Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'

import { ReportPage } from '@/features/board/pages/ReportPage'
import { UserBlockSettingPage } from '@/features/board/pages/UserBlockSettingPage'
import { API_PREFIX } from '@/shared/constants/api'
import { useAuthStore } from '@/shared/stores/authStore'
import { url } from '@/testing/mocks/handlers'
import { server } from '@/testing/mocks/server'
import { renderWithProviders, screen, userEvent, waitFor } from '@/testing/utils'

const RESIDENT_UUID = 'resident-uuid-1'
const POST_UUID = 'post-1'

/** 신고 요청이 어느 게시판 엔드포인트로 갔는지 기록한다 */
const captureReport = () => {
  const hit: string[] = []

  server.use(
    http.post(
      url({ path: `${API_PREFIX.BOARD}/${RESIDENT_UUID}/community/${POST_UUID}/report` }),
      () => {
        hit.push('community')
        return HttpResponse.json({ success: null })
      },
    ),
    http.post(
      url({ path: `${API_PREFIX.BOARD}/${RESIDENT_UUID}/complaint/${POST_UUID}/report` }),
      () => {
        hit.push('complaints')
        return HttpResponse.json({ success: null })
      },
    ),
  )

  return hit
}

const renderReport = (state: { boardType?: string } | null) => {
  renderWithProviders({
    initialEntries: [{ pathname: `/post/report/${POST_UUID}`, state }],
    ui: (
      <Routes>
        <Route path="/post/report/:postUuid" element={<ReportPage />} />
        <Route path="/board/community" element={<h1>소통공간 목록</h1>} />
        <Route path="/board/complaints" element={<h1>민원공간 목록</h1>} />
      </Routes>
    ),
  })
}

describe('ReportPage (B20)', () => {
  beforeEach(() => {
    localStorage.clear()
    useAuthStore.setState({ aptInfo: { aptResidentUuid: RESIDENT_UUID } })
  })

  it('state의 게시판으로 신고하고 그 목록으로 이동한다', async () => {
    const hit = captureReport()
    renderReport({ boardType: 'community' })

    await userEvent.type(screen.getByPlaceholderText('신고 내용을 입력해주세요.'), '부적절합니다')
    await userEvent.click(screen.getByText('신고하기'))

    expect(await screen.findByRole('heading', { name: '소통공간 목록' })).toBeInTheDocument()
    expect(hit).toEqual(['community'])
  })

  it('🔴 state가 없으면 민원공간으로 신고된다 — 레거시 동작', async () => {
    // 새로고침·딥링크로 직접 들어오면 발생한다. 소통공간 글도 민원 엔드포인트로 간다 (§5-13)
    const hit = captureReport()
    renderReport(null)

    await userEvent.type(screen.getByPlaceholderText('신고 내용을 입력해주세요.'), '내용')
    await userEvent.click(screen.getByText('신고하기'))

    await waitFor(() => {
      expect(hit).toEqual(['complaints'])
    })
  })

  it('300자를 넘기면 잘린다', async () => {
    captureReport()
    renderReport({ boardType: 'community' })

    const textarea = screen.getByPlaceholderText('신고 내용을 입력해주세요.')
    await userEvent.click(textarea)
    await userEvent.paste('가'.repeat(320))

    expect((textarea as HTMLTextAreaElement).value).toHaveLength(300)
    expect(screen.getByText('300/300')).toBeInTheDocument()
  })

  it('내용이 비어도 제출된다 — `disabled`가 없다', async () => {
    const hit = captureReport()
    renderReport({ boardType: 'community' })

    await userEvent.click(screen.getByText('신고하기'))

    await waitFor(() => {
      expect(hit).toEqual(['community'])
    })
  })
})

describe('UserBlockSettingPage (B19)', () => {
  const BLOCK_LIST_PATH = `${API_PREFIX.BOARD}/${RESIDENT_UUID}/block`

  beforeEach(() => {
    localStorage.clear()
    useAuthStore.setState({ aptInfo: { aptResidentUuid: RESIDENT_UUID } })
  })

  it('차단 목록을 이름과 함께 보여준다 — 쉼표는 지운다', async () => {
    server.use(
      http.get(url({ path: BLOCK_LIST_PATH }), () => {
        return HttpResponse.json({
          success: [{ residentBlockUuid: 'u-1', residentBlockName: '홍길동,101동' }],
        })
      }),
    )
    renderWithProviders({ ui: <UserBlockSettingPage /> })

    expect(await screen.findByText('홍길동101동')).toBeInTheDocument()
    expect(screen.getByText('게시글 안보는 중')).toBeInTheDocument()
  })

  it('비어 있으면 안내 문구를 보여준다', async () => {
    server.use(
      http.get(url({ path: BLOCK_LIST_PATH }), () => {
        return HttpResponse.json({ success: [] })
      }),
    )
    renderWithProviders({ ui: <UserBlockSettingPage /> })

    expect(await screen.findByText('차단된 사용자가 없습니다.')).toBeInTheDocument()
  })

  it('해제하면 버튼이 바뀌고 항목은 남는다', async () => {
    // ⚠️ 목록을 무효화하지 않는다 — 바로 되돌릴 수 있게 한 의도로 보인다
    server.use(
      http.get(url({ path: BLOCK_LIST_PATH }), () => {
        return HttpResponse.json({
          success: [{ residentBlockUuid: 'u-1', residentBlockName: '홍길동' }],
        })
      }),
      http.delete(url({ path: `${BLOCK_LIST_PATH}/u-1` }), () => {
        return HttpResponse.json({ success: null })
      }),
    )
    renderWithProviders({ ui: <UserBlockSettingPage /> })

    await userEvent.click(await screen.findByText('게시글 안보는 중'))

    expect(await screen.findByText('게시글 안보기')).toBeInTheDocument()
    expect(screen.getByText('홍길동')).toBeInTheDocument()
  })
})
