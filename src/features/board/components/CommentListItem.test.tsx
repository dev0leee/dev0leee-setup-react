import { beforeEach, describe, expect, it, vi } from 'vitest'

import { CommentListItem } from '@/features/board/components/CommentListItem'
import { BOARD_TYPE } from '@/features/board/types/post'
import { useAuthStore } from '@/shared/stores/authStore'
import { renderWithProviders, screen } from '@/testing/utils'

const RESIDENT_UUID = 'resident-uuid-1'
const OTHER_UUID = 'other-uuid'

const baseComment = {
  commentUuid: 'comment-1',
  content: '댓글 내용',
  createdDate: new Date().toISOString(),
  authorText: '홍길동,101동',
  authorAptResidentUuid: OTHER_UUID,
  fileList: [],
}

const renderItem = ({
  state,
  authorAptResidentUuid = OTHER_UUID,
  isReplyComment = false,
  isCommentPage = false,
  fileList = [] as { fileUuid: string; fileUrl: string }[],
}: {
  state: string
  authorAptResidentUuid?: string
  isReplyComment?: boolean
  isCommentPage?: boolean
  fileList?: { fileUuid: string; fileUrl: string }[]
}) => {
  renderWithProviders({
    ui: (
      <ul>
        <CommentListItem
          comment={{ ...baseComment, state, authorAptResidentUuid, fileList }}
          commentIndex={0}
          boardType={BOARD_TYPE.COMMUNITY}
          postUuid="post-1"
          isReplyComment={isReplyComment}
          isCommentPage={isCommentPage}
          onDelete={vi.fn()}
        />
      </ul>
    ),
  })
}

/**
 * 댓글 상태별 표시 규칙. 이름·본문·이미지가 **각각 다른 조건**을 따르고
 * 레거시 기벽이 둘 섞여 있어(이미지 노출·차단 댓글 답글 버튼) 표로 못박아 둔다.
 */
describe('CommentListItem', () => {
  beforeEach(() => {
    localStorage.clear()
    useAuthStore.setState({ aptInfo: { aptResidentUuid: RESIDENT_UUID } })
  })

  it('`SHOW`는 작성자명(쉼표 제거)과 본문을 보여준다', () => {
    renderItem({ state: 'SHOW' })

    expect(screen.getByText('홍길동101동')).toBeInTheDocument()
    expect(screen.getByText('댓글 내용')).toBeInTheDocument()
  })

  it.each([
    ['RESIDENT_DELETE', '탈퇴된 회원의 댓글', true],
    ['ADMIN', '관리사무소', true],
    ['DELETE', '삭제된 댓글', false],
    ['BLOCK', '차단된 회원의 댓글', false],
  ])('`%s`는 이름이 `%s`이고 본문 노출은 %s다', (state, expectedName, showsContent) => {
    renderItem({ state })

    expect(screen.getByText(expectedName)).toBeInTheDocument()

    if (showsContent) expect(screen.getByText('댓글 내용')).toBeInTheDocument()
    else expect(screen.queryByText('댓글 내용')).not.toBeInTheDocument()
  })

  it('🔴 삭제된 댓글의 이미지는 계속 보인다 — 레거시 동작', () => {
    // 이미지는 `state`를 보지 않고 `fileList`만 보고 그린다
    renderItem({ state: 'DELETE', fileList: [{ fileUuid: 'f1', fileUrl: '/a.png' }] })

    expect(screen.queryByText('댓글 내용')).not.toBeInTheDocument()
    expect(screen.getByAltText('댓글 이미지')).toBeInTheDocument()
  })

  it('🔴 차단된 댓글에는 답글 버튼이 보인다 — 조건에 `BLOCK`이 빠져 있다', () => {
    renderItem({ state: 'BLOCK' })

    expect(screen.getByText('답글')).toBeInTheDocument()
  })

  it('삭제된 댓글에는 답글 버튼이 없다', () => {
    renderItem({ state: 'DELETE' })

    expect(screen.queryByText('답글')).not.toBeInTheDocument()
  })

  it('대댓글에는 답글 버튼이 없고 화살표가 붙는다', () => {
    renderItem({ state: 'SHOW', isReplyComment: true })

    expect(screen.queryByText('답글')).not.toBeInTheDocument()
    expect(screen.getByAltText('화살표 아이콘')).toBeInTheDocument()
  })

  it('답글 작성 화면에서는 답글 버튼이 없다', () => {
    renderItem({ state: 'SHOW', isCommentPage: true })

    expect(screen.queryByText('답글')).not.toBeInTheDocument()
  })

  it('내 댓글이고 `SHOW`일 때만 더보기 버튼이 나온다', () => {
    renderItem({ state: 'SHOW', authorAptResidentUuid: RESIDENT_UUID })

    expect(screen.getByAltText('더보기 아이콘')).toBeInTheDocument()
  })

  it('내 댓글이어도 삭제 상태면 더보기가 없다', () => {
    renderItem({ state: 'DELETE', authorAptResidentUuid: RESIDENT_UUID })

    expect(screen.queryByAltText('더보기 아이콘')).not.toBeInTheDocument()
  })
})
