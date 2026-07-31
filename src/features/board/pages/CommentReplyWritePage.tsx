import { useParams } from 'react-router-dom'

import { CommentInput } from '@/features/board/components/CommentInput'
import { CommentList } from '@/features/board/components/CommentList'
import {
  useDeleteBoardComment,
  usePostBoardReply,
} from '@/features/board/queries/useBoardMutations'
import { useBoardCommentDetail } from '@/features/board/queries/useBoardPostDetail'
import { BOARD_TYPE, type BoardType } from '@/features/board/types/post'
import { SpinnerDots } from '@/shared/components/common/SpinnerDots'

/**
 * 답글 작성 (B7·B14). 레거시 `CommentReplyWrite.vue` + 두 뷰 이식.
 *
 * **부모 댓글 하나만 목록으로 그린다** — 응답의 `childCommentList`에 기존 답글이 함께
 * 담겨 오므로 상세 화면과 같은 컴포넌트로 부모+답글이 한 번에 렌더된다.
 *
 * ⚠️ **여기서는 답글 버튼이 없다.** 경로가 `/post/...`라 `isCommentPage`가 참이고,
 * 대댓글에 다시 답글을 달 수 없다(1단계 제한).
 *
 * ⚠️ **부모 댓글을 삭제하면 게시글 상세로 되돌아간다** — 이 화면이 의미를 잃기 때문이다.
 */
export const CommentReplyWritePage = ({ boardType }: { boardType: BoardType }) => {
  const { postUuid, commentUuid } = useParams()

  const { commentDetail, isCommentDetailLoading } = useBoardCommentDetail({
    boardType,
    postUuid,
    commentUuid,
  })
  const { postReply, isPostReplyPending, progressPercent } = usePostBoardReply({
    boardType,
    postUuid,
    commentUuid,
  })
  const { deleteComment } = useDeleteBoardComment({
    boardType,
    postUuid,
    isReplyPage: true,
  })

  return (
    <div className="h-full">
      <CommentList
        // 목록 컴포넌트가 배열을 받으므로 부모 댓글 하나를 감싸 넘긴다
        commentList={commentDetail ? [commentDetail] : []}
        isCommentListLoading={isCommentDetailLoading}
        boardType={boardType}
        postUuid={postUuid ?? ''}
        isReplyPage
        isCommentPage
        onDelete={deleteComment}
      />
      <CommentInput isReplyPage onSubmit={postReply} />

      {isPostReplyPending && (
        <SpinnerDots
          progressPercent={progressPercent}
          backgroundColor="bg-black/50"
          textColor="text-base-b-white"
        />
      )}
    </div>
  )
}

export const CommunityCommentReplyWritePage = () => {
  return <CommentReplyWritePage boardType={BOARD_TYPE.COMMUNITY} />
}

export const ComplaintsCommentReplyWritePage = () => {
  return <CommentReplyWritePage boardType={BOARD_TYPE.COMPLAINTS} />
}
