import { http, HttpResponse } from 'msw'
import { Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  CommunityDetailPage,
  ComplaintsDetailPage,
} from '@/features/board/pages/BoardPostDetailPage'
import { API_PREFIX } from '@/shared/constants/api'
import { useAuthStore } from '@/shared/stores/authStore'
import { url } from '@/testing/mocks/handlers'
import { server } from '@/testing/mocks/server'
import { renderWithProviders, screen, userEvent, waitFor } from '@/testing/utils'

const RESIDENT_UUID = 'resident-uuid-1'
const OTHER_UUID = 'other-uuid'
const POST_UUID = 'post-1'

const detailPath = (segment: string) => {
  return `${API_PREFIX.BOARD}/${RESIDENT_UUID}/${segment}/${POST_UUID}`
}

const MOCK_POST = {
  communityUuid: POST_UUID,
  title: '오늘 날씨 좋네요',
  content: '산책하기 좋습니다',
  categoryName: '일반',
  createdDate: new Date().toISOString(),
  viewCount: 12,
  likeCount: 3,
  commentCount: 1,
  likeFlag: false,
  authorText: '홍길동,101동',
  authorAptResidentUuid: OTHER_UUID,
  fileList: [],
}

const MOCK_COMMENTS = [
  {
    commentUuid: 'comment-1',
    content: '좋네요',
    createdDate: new Date().toISOString(),
    state: 'SHOW',
    authorText: '김철수,102동',
    authorAptResidentUuid: OTHER_UUID,
    fileList: [],
    childCommentList: [],
  },
]

/** 소통공간 상세 + 댓글 목록 핸들러 */
const setUpCommunity = (post: Partial<typeof MOCK_POST> = {}) => {
  server.use(
    http.get(url({ path: detailPath('community') }), () => {
      return HttpResponse.json({ success: { ...MOCK_POST, ...post } })
    }),
    http.get(url({ path: `${detailPath('community')}/comment` }), () => {
      return HttpResponse.json({ success: MOCK_COMMENTS })
    }),
  )
}

const renderCommunityDetail = () => {
  renderWithProviders({
    initialEntries: [`/board/community/detail/${POST_UUID}`],
    ui: (
      <Routes>
        <Route path="/board/community/detail/:postUuid" element={<CommunityDetailPage />} />
        <Route path="/board/community" element={<h1>소통공간 목록</h1>} />
        <Route path="/board/community/edit/:postUuid" element={<h1>글 수정</h1>} />
        <Route path="/post/report/:postUuid" element={<h1>신고</h1>} />
      </Routes>
    ),
  })
}

describe('BoardPostDetailPage', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
    useAuthStore.setState({ aptInfo: { aptResidentUuid: RESIDENT_UUID } })
  })

  it('본문·작성자·조회수와 댓글을 보여준다', async () => {
    setUpCommunity()
    renderCommunityDetail()

    expect(await screen.findByText('오늘 날씨 좋네요')).toBeInTheDocument()
    expect(screen.getByText('산책하기 좋습니다')).toBeInTheDocument()
    // ⚠️ `authorText`의 쉼표를 전부 지워 붙여 보여준다 (BD-Q9)
    expect(screen.getByText('홍길동101동')).toBeInTheDocument()
    expect(screen.getByText('좋네요')).toBeInTheDocument()
  })

  it('소통공간 좋아요 라벨은 `좋아요`다', async () => {
    setUpCommunity()
    renderCommunityDetail()

    expect(await screen.findByText('좋아요')).toBeInTheDocument()
  })

  it('🔴 좋아요는 화면당 한 번만 시각 반응한다 — 레거시 동작', async () => {
    // 두 번째 클릭부터는 mutation의 `isSuccess`가 이미 참이라 화면이 안 바뀐다.
    // 서버에는 매번 전달되므로 재진입하면 반영돼 있다 (`board.md` §DetailPostLikeButton).
    let likeCallCount = 0
    setUpCommunity()
    server.use(
      http.patch(url({ path: `${detailPath('community')}/like` }), () => {
        likeCallCount += 1
        return HttpResponse.json({ success: null })
      }),
    )
    renderCommunityDetail()

    const likeButton = (await screen.findByText('좋아요')).closest('button')
    expect(likeButton).not.toBeNull()

    await userEvent.click(likeButton as HTMLElement)
    await waitFor(() => {
      expect(likeButton).toHaveTextContent('4')
    })

    await userEvent.click(likeButton as HTMLElement)
    await waitFor(() => {
      expect(likeCallCount).toBe(2)
    })
    // 요청은 두 번 갔지만 숫자는 그대로다
    expect(likeButton).toHaveTextContent('4')
  })

  it('남의 글이면 더보기에 차단·신고가 나온다', async () => {
    setUpCommunity()
    renderCommunityDetail()

    await userEvent.click(await screen.findByAltText('더보기 아이콘'))

    expect(await screen.findByText('이 사용자의 글 보지 않기')).toBeInTheDocument()
    expect(screen.getByText('게시글 신고하기')).toBeInTheDocument()
    expect(screen.queryByText('수정')).not.toBeInTheDocument()
  })

  it('내 글이면 더보기에 수정·삭제가 나온다', async () => {
    setUpCommunity({ authorAptResidentUuid: RESIDENT_UUID })
    renderCommunityDetail()

    await userEvent.click(await screen.findByAltText('더보기 아이콘'))

    expect(await screen.findByText('수정')).toBeInTheDocument()
    expect(screen.getByText('삭제')).toBeInTheDocument()
  })

  it('🔴 익명 작성자여도 차단 항목이 보인다 — 레거시 동작', async () => {
    // 레거시가 `enabled: !isAnonymousAuthor`를 넘기지만 조건식이 거짓일 때도 참이 된다
    setUpCommunity({ authorText: '익명' })
    renderCommunityDetail()

    await userEvent.click(await screen.findByAltText('더보기 아이콘'))

    expect(await screen.findByText('이 사용자의 글 보지 않기')).toBeInTheDocument()
  })

  it('차단에 성공하면 더보기 버튼이 사라진다', async () => {
    setUpCommunity()
    server.use(
      http.post(url({ path: `${API_PREFIX.BOARD}/${RESIDENT_UUID}/block/${OTHER_UUID}` }), () => {
        return HttpResponse.json({ success: null })
      }),
    )
    renderCommunityDetail()

    await userEvent.click(await screen.findByAltText('더보기 아이콘'))
    await userEvent.click(await screen.findByText('이 사용자의 글 보지 않기'))
    await userEvent.click(await screen.findByText('안보기'))

    await waitFor(() => {
      expect(screen.queryByAltText('더보기 아이콘')).not.toBeInTheDocument()
    })
  })

  it('민원 상세는 `동의해요`이고 처리중이면 수정이 막힌다', async () => {
    server.use(
      http.get(url({ path: detailPath('complaint') }), () => {
        return HttpResponse.json({
          success: {
            ...MOCK_POST,
            complaintUuid: POST_UUID,
            status: 'IN_PROGRESS',
            authorAptResidentUuid: RESIDENT_UUID,
          },
        })
      }),
      http.get(url({ path: `${detailPath('complaint')}/comment` }), () => {
        return HttpResponse.json({ success: [] })
      }),
    )
    renderWithProviders({
      initialEntries: [`/board/complaints/detail/${POST_UUID}`],
      ui: (
        <Routes>
          <Route path="/board/complaints/detail/:postUuid" element={<ComplaintsDetailPage />} />
        </Routes>
      ),
    })

    expect(await screen.findByText('동의해요')).toBeInTheDocument()
    expect(screen.getByText('처리중')).toBeInTheDocument()

    await userEvent.click(screen.getByAltText('더보기 아이콘'))
    await userEvent.click(await screen.findByText('수정'))

    // 수정 화면으로 가지 않고 안내 모달이 뜬다
    expect(
      await screen.findByText(/처리중인 민원은 수정 및 삭제할 수 없습니다/),
    ).toBeInTheDocument()
  })

  it('댓글을 입력하면 등록된다', async () => {
    const submitted: string[] = []
    setUpCommunity()
    server.use(
      http.post(url({ path: `${detailPath('community')}/comment` }), async ({ request }) => {
        const formData = await request.formData()
        submitted.push(String(formData.get('content')))
        return HttpResponse.json({ success: null })
      }),
    )
    renderCommunityDetail()

    await userEvent.type(await screen.findByPlaceholderText('댓글을 입력해 주세요'), '반갑습니다')
    await userEvent.click(screen.getByText('입력'))

    await waitFor(() => {
      expect(submitted).toEqual(['반갑습니다'])
    })
  })

  it('내용이 비면 입력 버튼이 잠긴다', async () => {
    setUpCommunity()
    renderCommunityDetail()

    const submitButton = await screen.findByText('입력')
    expect(submitButton).toBeDisabled()
  })
})
