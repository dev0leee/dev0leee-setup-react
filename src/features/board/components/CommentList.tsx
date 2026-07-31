import { Fragment } from 'react'

import { CommentListItem } from '@/features/board/components/CommentListItem'
import type { BoardComment } from '@/features/board/types/detail'
import type { BoardType } from '@/features/board/types/post'
import { SpinnerDots } from '@/shared/components/common/SpinnerDots'
import { TextEmpty } from '@/shared/components/common/TextEmpty'
import { cn } from '@/shared/utils/cn'

/**
 * 댓글 목록. 레거시 `CommentList.vue` 이식.
 *
 * **댓글과 대댓글을 평면으로 이어 붙인다** — 대댓글은 화살표 아이콘과 들여쓰기로만
 * 구분되고 DOM 상으로는 형제다. 중첩은 **1단계뿐**이라 재귀가 필요 없다.
 */
export const CommentList = ({
  commentList,
  isCommentListLoading,
  boardType,
  postUuid,
  isReplyPage,
  isCommentPage,
  onDelete,
}: {
  commentList: BoardComment[]
  isCommentListLoading: boolean
  boardType: BoardType
  postUuid: string
  /** 답글 작성 화면이면 자체 스크롤·여백을 갖는다 */
  isReplyPage: boolean
  isCommentPage: boolean
  onDelete: (payload: { commentUuid: string; isReplyComment: boolean }) => void
}) => {
  if (isCommentListLoading) return <SpinnerDots />

  return (
    <div className={cn('h-full w-full', isReplyPage && 'overflow-auto px-5 pb-16')}>
      {commentList.length > 0 ? (
        commentList.map((comment, commentIndex) => {
          return (
            <Fragment key={comment.commentUuid}>
              <CommentListItem
                comment={comment}
                commentIndex={commentIndex}
                boardType={boardType}
                postUuid={postUuid}
                isCommentPage={isCommentPage}
                onDelete={onDelete}
              />
              {comment.childCommentList?.map((reply) => {
                return (
                  <CommentListItem
                    key={reply.commentUuid}
                    comment={reply}
                    boardType={boardType}
                    postUuid={postUuid}
                    isReplyComment
                    isCommentPage={isCommentPage}
                    onDelete={onDelete}
                  />
                )
              })}
            </Fragment>
          )
        })
      ) : (
        <TextEmpty className="py-20">댓글이 없습니다.</TextEmpty>
      )}
    </div>
  )
}
