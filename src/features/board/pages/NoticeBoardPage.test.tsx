import { http, HttpResponse } from 'msw'
import { Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'

import { NoticeBoardPage } from '@/features/board/pages/NoticeBoardPage'
import { API_PREFIX } from '@/shared/constants/api'
import { useAuthStore } from '@/shared/stores/authStore'
import { url } from '@/testing/mocks/handlers'
import { server } from '@/testing/mocks/server'
import { renderWithProviders, screen, userEvent, waitFor } from '@/testing/utils'

const APT_UUID = 'apt-uuid-1'

const LIST_PATH = `${API_PREFIX.BOARD}/notice/${APT_UUID}`
const CATEGORY_PATH = `${API_PREFIX.BOARD}/notice/${APT_UUID}/category`

const NOTICES = [
  {
    uuid: 'notice-1',
    title: '여름철 단수 안내',
    categoryName: '일반',
    noticeType: 'IMPORTANT',
    createdDate: '2026-07-29T10:00:00',
    viewCount: 128,
  },
  {
    uuid: 'notice-2',
    title: '엘리베이터 점검',
    categoryName: '설비',
    noticeType: 'NORMAL',
    createdDate: '2026-07-28T10:00:00',
    viewCount: 12,
  },
]

/** 목록 응답. 요청 쿼리를 받아둬 파라미터 전달을 검증한다 */
const setUpHandlers = () => {
  const requestedParams: { keyword: string | null; categoryUuid: string | null }[] = []

  server.use(
    http.get(url({ path: CATEGORY_PATH }), () => {
      return HttpResponse.json({
        success: [
          { uuid: 'cat-1', category: '공지' },
          { uuid: 'cat-2', category: '점검' },
        ],
      })
    }),
    http.get(url({ path: LIST_PATH }), ({ request }) => {
      const params = new URL(request.url).searchParams
      requestedParams.push({
        keyword: params.get('keyword'),
        categoryUuid: params.get('categoryUuid'),
      })

      return HttpResponse.json({
        success: {
          content: NOTICES,
          number: 0,
          totalPages: 1,
          totalElements: NOTICES.length,
          last: true,
          empty: false,
          numberOfElements: NOTICES.length,
        },
      })
    }),
  )

  return requestedParams
}

describe('NoticeBoardPage', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    useAuthStore.setState({ aptInfo: { aptUuid: APT_UUID } })
  })

  it('공지 목록을 필독 칩·카테고리·조회수와 함께 보여준다', async () => {
    setUpHandlers()
    renderWithProviders({ ui: <NoticeBoardPage /> })

    expect(await screen.findByText('여름철 단수 안내')).toBeInTheDocument()
    // `IMPORTANT`인 첫 건에만 필독 칩이 붙는다
    expect(screen.getAllByText('필독')).toHaveLength(1)
    expect(screen.getByText('128')).toBeInTheDocument()
    expect(screen.getByText('2026-07-29')).toBeInTheDocument()
  })

  it('마지막 항목에만 구분선이 없다', async () => {
    setUpHandlers()
    renderWithProviders({ ui: <NoticeBoardPage /> })

    // 카테고리 탭도 `<li>`라 role로 찾으면 섞인다. 제목에서 올라가 자기 항목을 잡는다.
    const firstItem = (await screen.findByText('여름철 단수 안내')).closest('li')
    const lastItem = screen.getByText('엘리베이터 점검').closest('li')

    expect(firstItem).toHaveClass('border-b')
    // 구분선 판정 기준이 **총 개수**라 마지막 항목에만 없다
    expect(lastItem).not.toHaveClass('border-b')
  })

  it('검색어를 입력하면 500ms 뒤 keyword를 실어 다시 조회한다', async () => {
    const requestedParams = setUpHandlers()
    renderWithProviders({ ui: <NoticeBoardPage /> })

    await screen.findByText('여름철 단수 안내')
    await userEvent.type(screen.getByPlaceholderText('검색'), '단수')

    await waitFor(
      () => {
        expect(requestedParams.at(-1)?.keyword).toBe('단수')
      },
      { timeout: 3000 },
    )
  })

  it('카테고리를 고르면 categoryUuid를 실어 다시 조회한다', async () => {
    const requestedParams = setUpHandlers()
    renderWithProviders({ ui: <NoticeBoardPage /> })

    await screen.findByText('여름철 단수 안내')
    await userEvent.click(screen.getByText('점검'))

    await waitFor(() => {
      expect(requestedParams.at(-1)?.categoryUuid).toBe('cat-2')
    })
  })

  it('`전체` 탭은 categoryUuid를 비운다', async () => {
    const requestedParams = setUpHandlers()
    renderWithProviders({ ui: <NoticeBoardPage /> })

    await screen.findByText('여름철 단수 안내')
    await userEvent.click(screen.getByText('점검'))
    await waitFor(() => {
      expect(requestedParams.at(-1)?.categoryUuid).toBe('cat-2')
    })

    await userEvent.click(screen.getByText('전체'))

    await waitFor(() => {
      expect(requestedParams.at(-1)?.categoryUuid).toBeNull()
    })
  })

  it('목록이 비면 안내 문구를 보여준다', async () => {
    server.use(
      http.get(url({ path: CATEGORY_PATH }), () => {
        return HttpResponse.json({ success: [] })
      }),
      http.get(url({ path: LIST_PATH }), () => {
        return HttpResponse.json({
          success: {
            content: [],
            number: 0,
            totalPages: 0,
            totalElements: 0,
            last: true,
            empty: true,
            numberOfElements: 0,
          },
        })
      }),
    )
    renderWithProviders({ ui: <NoticeBoardPage /> })

    expect(await screen.findByText('공지사항이 존재하지 않습니다.')).toBeInTheDocument()
  })

  it('항목을 누르면 스크롤 위치를 저장하고 상세로 간다', async () => {
    setUpHandlers()
    renderWithProviders({
      ui: (
        <Routes>
          <Route path="/" element={<NoticeBoardPage />} />
          <Route path="/board/notice/detail/:noticeUuid" element={<h1>공지 상세</h1>} />
        </Routes>
      ),
    })

    await userEvent.click(await screen.findByText('여름철 단수 안내'))

    expect(await screen.findByRole('heading', { name: '공지 상세' })).toBeInTheDocument()
    // 전용 키에 저장한다 (공용 `scrollRestoration`이 아니다)
    expect(sessionStorage.getItem('notice_board_scroll')).not.toBeNull()
  })
})
