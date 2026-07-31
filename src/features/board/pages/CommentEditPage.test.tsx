import { http, HttpResponse } from 'msw'
import { Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'

import { CommunityCommentEditPage } from '@/features/board/pages/CommentEditPage'
import { CommunityCommentReplyWritePage } from '@/features/board/pages/CommentReplyWritePage'
import { API_PREFIX } from '@/shared/constants/api'
import { useAuthStore } from '@/shared/stores/authStore'
import { url } from '@/testing/mocks/handlers'
import { server } from '@/testing/mocks/server'
import { renderWithProviders, screen, userEvent, waitFor } from '@/testing/utils'

const RESIDENT_UUID = 'resident-uuid-1'
const POST_UUID = 'post-1'
const COMMENT_UUID = 'comment-1'

const COMMENT_PATH = `${API_PREFIX.BOARD}/${RESIDENT_UUID}/community/${POST_UUID}/comment/${COMMENT_UUID}`

const mockCommentDetail = (content: string, childCommentList: unknown[] = []) => {
  server.use(
    http.get(url({ path: COMMENT_PATH }), () => {
      return HttpResponse.json({
        success: {
          commentUuid: COMMENT_UUID,
          content,
          createdDate: new Date().toISOString(),
          state: 'SHOW',
          authorText: '홍길동,101동',
          authorAptResidentUuid: RESIDENT_UUID,
          fileList: [],
          childCommentList,
        },
      })
    }),
  )
}

describe('CommentEditPage (B8)', () => {
  beforeEach(() => {
    localStorage.clear()
    useAuthStore.setState({ aptInfo: { aptResidentUuid: RESIDENT_UUID } })
  })

  const renderEdit = () => {
    renderWithProviders({
      initialEntries: [`/post/community/comment/edit/${POST_UUID}/${COMMENT_UUID}`],
      ui: (
        <Routes>
          <Route
            path="/post/community/comment/edit/:postUuid/:commentUuid"
            element={<CommunityCommentEditPage />}
          />
        </Routes>
      ),
    })
  }

  it('기존 내용을 채워서 연다', async () => {
    mockCommentDetail('고칠 댓글')
    renderEdit()

    expect(await screen.findByDisplayValue('고칠 댓글')).toBeInTheDocument()
  })

  it('`<br/>`을 줄바꿈으로 되돌려 채운다', async () => {
    // 저장 시 반대 변환이 일어나므로 그대로 두면 수정할 때마다 태그가 글자로 쌓인다
    mockCommentDetail('첫 줄\n둘째 줄')
    renderEdit()

    // `findByDisplayValue`는 공백을 정규화해 개행을 비교할 수 없다 — 값을 직접 본다
    const textarea = await screen.findByRole('textbox')
    await waitFor(() => {
      expect((textarea as HTMLTextAreaElement).value).toBe('첫 줄\n둘째 줄')
    })
    expect((textarea as HTMLTextAreaElement).value).not.toContain('<br/>')
  })

  it('내용을 비우면 완료 버튼이 **실제로 잠긴다**', async () => {
    // ⚠️ 게시글 폼의 완료 버튼은 회색이어도 눌리는데 여기는 다르다 (`board.md` §5-12)
    mockCommentDetail('고칠 댓글')
    renderEdit()

    const textarea = await screen.findByDisplayValue('고칠 댓글')
    await userEvent.clear(textarea)

    expect(screen.getByText('완료')).toBeDisabled()
  })

  it('수정하면 서버로 보낸다', async () => {
    const submitted: string[] = []
    mockCommentDetail('고칠 댓글')
    server.use(
      http.patch(url({ path: COMMENT_PATH }), async ({ request }) => {
        const formData = await request.formData()
        submitted.push(String(formData.get('content')))
        return HttpResponse.json({ success: null })
      }),
    )
    renderEdit()

    const textarea = await screen.findByDisplayValue('고칠 댓글')
    await userEvent.clear(textarea)
    await userEvent.type(textarea, '고친 댓글')
    await userEvent.click(screen.getByText('완료'))

    await waitFor(() => {
      expect(submitted).toEqual(['고친 댓글'])
    })
  })

  it('뒤로가기를 누르면 확인 모달이 뜬다', async () => {
    mockCommentDetail('고칠 댓글')
    renderEdit()

    await screen.findByDisplayValue('고칠 댓글')
    await userEvent.click(screen.getByAltText('뒤로가기 아이콘'))

    expect(await screen.findByText('수정 그만두기')).toBeInTheDocument()
  })
})

describe('CommentReplyWritePage (B7)', () => {
  beforeEach(() => {
    localStorage.clear()
    useAuthStore.setState({ aptInfo: { aptResidentUuid: RESIDENT_UUID } })
  })

  it('부모 댓글과 기존 답글을 함께 보여주고 입력창은 `답글`이다', async () => {
    mockCommentDetail('부모 댓글', [
      {
        commentUuid: 'reply-1',
        content: '기존 답글',
        createdDate: new Date().toISOString(),
        state: 'SHOW',
        authorText: '김철수,102동',
        authorAptResidentUuid: 'other',
        fileList: [],
      },
    ])

    renderWithProviders({
      initialEntries: [`/post/community/comment/reply/${POST_UUID}/${COMMENT_UUID}/0`],
      ui: (
        <Routes>
          <Route
            path="/post/community/comment/reply/:postUuid/:commentUuid/:commentIndex"
            element={<CommunityCommentReplyWritePage />}
          />
        </Routes>
      ),
    })

    expect(await screen.findByText('부모 댓글')).toBeInTheDocument()
    expect(screen.getByText('기존 답글')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('답글을 입력해 주세요')).toBeInTheDocument()
    // 답글 화면에서는 답글 버튼이 없다
    expect(screen.queryByText('답글')).not.toBeInTheDocument()
  })
})
