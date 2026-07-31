import { http, HttpResponse } from 'msw'
import { Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'

import { CommunityBoardPage, ComplaintsBoardPage } from '@/features/board/pages/BoardPostListPage'
import { API_PREFIX } from '@/shared/constants/api'
import { useAuthStore } from '@/shared/stores/authStore'
import { url } from '@/testing/mocks/handlers'
import { server } from '@/testing/mocks/server'
import { renderWithProviders, screen, userEvent, waitFor } from '@/testing/utils'

const RESIDENT_UUID = 'resident-uuid-1'

/** ⚠️ 민원 목록만 `/list` 접미사가 붙는다 (`board.md` §4 #1) */
const PATH = {
  communityList: `${API_PREFIX.BOARD}/${RESIDENT_UUID}/community`,
  communityCategory: `${API_PREFIX.BOARD}/${RESIDENT_UUID}/community/category`,
  complaintsList: `${API_PREFIX.BOARD}/${RESIDENT_UUID}/complaint/list`,
  complaintsCategory: `${API_PREFIX.BOARD}/${RESIDENT_UUID}/complaint/category`,
}

const page = <TItem,>(content: TItem[]) => {
  return {
    success: {
      content,
      number: 0,
      totalPages: 1,
      totalElements: content.length,
      last: true,
      empty: content.length === 0,
      numberOfElements: content.length,
    },
  }
}

describe('BoardPostListPage', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    useAuthStore.setState({ aptInfo: { aptResidentUuid: RESIDENT_UUID } })
  })

  describe('소통공간 (B5)', () => {
    beforeEach(() => {
      server.use(
        http.get(url({ path: PATH.communityCategory }), () => {
          return HttpResponse.json({ success: [{ uuid: 'cat-1', category: '자유' }] })
        }),
        http.get(url({ path: PATH.communityList }), () => {
          return HttpResponse.json(
            page([
              {
                communityUuid: 'post-1',
                title: '오늘 날씨 좋네요',
                categoryName: '일반',
                createdDate: new Date().toISOString(),
                viewCount: 12,
                likeCount: 3,
                commentCount: 5,
              },
            ]),
          )
        }),
      )
    })

    it('AppBar 제목이 `소통공간`이고 카드가 지표와 함께 나온다', async () => {
      renderWithProviders({ ui: <CommunityBoardPage /> })

      expect(await screen.findByText('오늘 날씨 좋네요')).toBeInTheDocument()
      expect(screen.getByText('소통공간')).toBeInTheDocument()
      expect(screen.getByText('12')).toBeInTheDocument()
      expect(screen.getByText('방금 전')).toBeInTheDocument()
      // 상태 칩은 민원 전용이다
      expect(screen.queryByText('접수')).not.toBeInTheDocument()
    })

    it('카드를 누르면 `communityUuid`로 상세에 간다', async () => {
      renderWithProviders({
        ui: (
          <Routes>
            <Route path="/" element={<CommunityBoardPage />} />
            <Route path="/board/community/detail/:postUuid" element={<h1>소통 상세</h1>} />
          </Routes>
        ),
      })

      await userEvent.click(await screen.findByText('오늘 날씨 좋네요'))

      expect(await screen.findByRole('heading', { name: '소통 상세' })).toBeInTheDocument()
    })

    it('사람 아이콘을 누르면 내 활동으로 간다', async () => {
      renderWithProviders({
        ui: (
          <Routes>
            <Route path="/" element={<CommunityBoardPage />} />
            <Route path="/board/community/activities" element={<h1>내 활동</h1>} />
          </Routes>
        ),
      })

      await userEvent.click(await screen.findByAltText('사람 아이콘'))

      expect(await screen.findByRole('heading', { name: '내 활동' })).toBeInTheDocument()
    })

    it('작성 버튼을 누르면 글 등록으로 간다', async () => {
      renderWithProviders({
        ui: (
          <Routes>
            <Route path="/" element={<CommunityBoardPage />} />
            <Route path="/board/community/write" element={<h1>글 등록</h1>} />
          </Routes>
        ),
      })

      await userEvent.click(await screen.findByAltText('작성 아이콘'))

      expect(await screen.findByRole('heading', { name: '글 등록' })).toBeInTheDocument()
    })
  })

  describe('민원공간 (B12)', () => {
    beforeEach(() => {
      server.use(
        http.get(url({ path: PATH.complaintsCategory }), () => {
          return HttpResponse.json({ success: [{ uuid: 'cat-9', category: '주차' }] })
        }),
        http.get(url({ path: PATH.complaintsList }), () => {
          return HttpResponse.json(
            page([
              {
                complaintUuid: 'complaint-1',
                title: '주차 민원입니다',
                categoryName: '일반',
                createdDate: new Date().toISOString(),
                status: 'IN_PROGRESS',
                privateFlag: true,
                viewCount: 1,
                likeCount: 0,
                commentCount: 0,
              },
            ]),
          )
        }),
      )
    })

    it('AppBar 제목이 `민원 공간`(공백 있음)이고 상태 칩·자물쇠가 나온다', async () => {
      // ⚠️ 표기가 게시판 AppBar만 공백이다 (§4 #3)
      renderWithProviders({ ui: <ComplaintsBoardPage /> })

      expect(await screen.findByText('주차 민원입니다')).toBeInTheDocument()
      expect(screen.getByText('민원 공간')).toBeInTheDocument()
      expect(screen.getByText('처리중')).toBeInTheDocument()
      expect(screen.getByAltText('자물쇠 아이콘')).toBeInTheDocument()
    })

    it('카드를 누르면 `complaintUuid`로 상세에 간다', async () => {
      renderWithProviders({
        ui: (
          <Routes>
            <Route path="/" element={<ComplaintsBoardPage />} />
            <Route path="/board/complaints/detail/:postUuid" element={<h1>민원 상세</h1>} />
          </Routes>
        ),
      })

      await userEvent.click(await screen.findByText('주차 민원입니다'))

      expect(await screen.findByRole('heading', { name: '민원 상세' })).toBeInTheDocument()
    })
  })

  it('목록이 비면 마침표 없는 문구가 나온다', async () => {
    server.use(
      http.get(url({ path: PATH.communityCategory }), () => {
        return HttpResponse.json({ success: [] })
      }),
      http.get(url({ path: PATH.communityList }), () => {
        return HttpResponse.json(page([]))
      }),
    )
    renderWithProviders({ ui: <CommunityBoardPage /> })

    // 공지(`...습니다.`)와 달리 마침표가 없다 (§5-14)
    expect(await screen.findByText('게시글이 존재하지 않습니다')).toBeInTheDocument()
  })

  it('검색어를 입력하면 keyword를 실어 다시 조회한다', async () => {
    const keywords: (string | null)[] = []

    server.use(
      http.get(url({ path: PATH.communityCategory }), () => {
        return HttpResponse.json({ success: [] })
      }),
      http.get(url({ path: PATH.communityList }), ({ request }) => {
        keywords.push(new URL(request.url).searchParams.get('keyword'))
        return HttpResponse.json(page([]))
      }),
    )
    renderWithProviders({ ui: <CommunityBoardPage /> })

    await screen.findByText('게시글이 존재하지 않습니다')
    await userEvent.type(screen.getByPlaceholderText('검색'), '날씨')

    await waitFor(
      () => {
        expect(keywords.at(-1)).toBe('날씨')
      },
      { timeout: 3000 },
    )
  })
})
