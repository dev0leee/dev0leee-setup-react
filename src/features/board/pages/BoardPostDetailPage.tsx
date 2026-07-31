import { useParams } from 'react-router-dom'

import { CommentInput } from '@/features/board/components/CommentInput'
import { CommentList } from '@/features/board/components/CommentList'
import { DetailPostContent } from '@/features/board/components/DetailPostContent'
import { DetailPostInfo } from '@/features/board/components/DetailPostInfo'
import { DetailPostLikeButton } from '@/features/board/components/DetailPostLikeButton'
import { DetailPostMoreButton } from '@/features/board/components/DetailPostMoreButton'
import { BOARD_DETAIL_APP_BAR_TITLE, BOARD_LIKE_LABEL } from '@/features/board/constants/board'
import {
  useBoardPostLike,
  useDeleteBoardComment,
  useDeleteBoardPost,
  usePostBoardComment,
} from '@/features/board/queries/useBoardMutations'
import {
  useBoardCommentList,
  useBoardPostDetail,
} from '@/features/board/queries/useBoardPostDetail'
import { BOARD_TYPE, type BoardType } from '@/features/board/types/post'
import { SpinnerDots } from '@/shared/components/common/SpinnerDots'
import { AppBar } from '@/shared/components/layouts/AppBar'
import { cn } from '@/shared/utils/cn'

/**
 * 게시글 상세 (B6·B13). 레거시 `Community/ComplaintsDetailView.vue` 이식.
 *
 * **두 게시판의 차이 4가지가 이 화면에 모여 있다** (`board.md` §4):
 *  - AppBar 제목 — `소통공간 상세` vs **`민원 공간`**(`상세`가 없고 공백이 있다)
 *  - 좋아요 라벨 — `좋아요` vs `동의해요`
 *  - 스크롤 래퍼 — 소통에만 `space-y-2`가 있다
 *  - 처리상태 칩·수정 제한 — 민원에만 있다(`DetailPostInfo`·`DetailPostMoreButton`이 판단)
 *
 * ⚠️ **댓글 등록 중에는 진행률이 딤 배경과 함께 뜬다.** 상세 로딩 중에는 같은 스피너가
 * 배경 없이 뜬다 — 두 경우가 한 컴포넌트를 공유한다.
 */
export const BoardPostDetailPage = ({ boardType }: { boardType: BoardType }) => {
  const { postUuid } = useParams()

  const { postDetail, isPostDetailLoading } = useBoardPostDetail({ boardType, postUuid })
  const { commentList, isCommentListLoading } = useBoardCommentList({ boardType, postUuid })

  const { patchPostLike, isPostLikeSuccess } = useBoardPostLike({ boardType, postUuid })
  const { deletePost } = useDeleteBoardPost({ boardType, postUuid })
  const { postComment, isPostCommentPending, progressPercent } = usePostBoardComment({
    boardType,
    postUuid,
  })
  const { deleteComment } = useDeleteBoardComment({
    boardType,
    postUuid,
    isReplyPage: false,
  })

  const isCommunity = boardType === BOARD_TYPE.COMMUNITY

  return (
    <div className="h-full">
      {!isPostDetailLoading && postDetail !== undefined && (
        <div className="h-full">
          <AppBar title={BOARD_DETAIL_APP_BAR_TITLE[boardType]}>
            <DetailPostMoreButton
              postData={postDetail}
              boardType={boardType}
              editPath={`/board/${boardType}/edit/${postUuid ?? ''}`}
              reportPath={`/post/report/${postUuid ?? ''}`}
              onDelete={deletePost}
            />
          </AppBar>

          {/* ⚠️ `space-y-2`는 소통공간에만 있다 (§4 #9) */}
          <div className={cn('h-full w-full overflow-auto', isCommunity && 'space-y-2')}>
            {/* `border-b-8`이 게시글과 댓글을 가르는 굵은 선이다. `pt-14`는 AppBar 보정 */}
            <article className="w-full space-y-[18px] border-b-8 border-b-defaults-tertiary-border-tertiary bg-base-b-white p-5 pt-14">
              <DetailPostInfo postData={postDetail} />
              <DetailPostContent postData={postDetail} />
              <DetailPostLikeButton
                label={BOARD_LIKE_LABEL[boardType]}
                postData={postDetail}
                isSuccessPostLiked={isPostLikeSuccess}
                onLike={patchPostLike}
              />
            </article>

            <div className="space-y-5 bg-base-b-white p-5 pb-16">
              <div className="flex items-center gap-[3px] pretendard-14Regular text-defaults-primary-text-primary">
                <img
                  className="h-4 w-4"
                  src="/assets/icons/MessageSquareLine.svg"
                  alt="말풍선 아이콘"
                />
                <span>댓글</span>
                <span className="font-semibold">{postDetail.commentCount ?? 0}</span>
              </div>
              <CommentList
                commentList={commentList}
                isCommentListLoading={isCommentListLoading}
                boardType={boardType}
                postUuid={postUuid ?? ''}
                isReplyPage={false}
                isCommentPage={false}
                onDelete={deleteComment}
              />
            </div>
          </div>

          <CommentInput isReplyPage={false} onSubmit={postComment} />
        </div>
      )}

      {(isPostDetailLoading || isPostCommentPending) && (
        <SpinnerDots
          progressPercent={isPostCommentPending ? progressPercent : 0}
          backgroundColor={isPostCommentPending ? 'bg-black/50' : ''}
          textColor={isPostCommentPending ? 'text-base-b-white' : 'text-base-b-black'}
        />
      )}
    </div>
  )
}

export const CommunityDetailPage = () => {
  return <BoardPostDetailPage boardType={BOARD_TYPE.COMMUNITY} />
}

export const ComplaintsDetailPage = () => {
  return <BoardPostDetailPage boardType={BOARD_TYPE.COMPLAINTS} />
}
