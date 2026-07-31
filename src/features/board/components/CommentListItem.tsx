import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { env } from '@/config/env'
import { DETAIL_DELETE_MODAL_DATA, DETAIL_MORE_AUTHOR } from '@/features/board/constants/board'
import {
  type BoardComment,
  COMMENT_AUTHOR_STATE_TEXT,
  COMMENT_STATE,
} from '@/features/board/types/detail'
import type { BoardType } from '@/features/board/types/post'
import { DrawerList } from '@/shared/components/common/DrawerList'
import { ModalButton } from '@/shared/components/common/ModalButton'
import { ModalImageViewer } from '@/shared/components/common/ModalImageViewer'
import { useKoreanTimeAgo } from '@/shared/hooks/useKoreanTimeAgo'
import { sanitizeHtml } from '@/shared/lib/sanitizeHtml'
import { useAuthStore } from '@/shared/stores/authStore'
import { cn } from '@/shared/utils/cn'
import { formatHtmlText } from '@/shared/utils/formatHtmlText'

/**
 * 댓글 한 건. 레거시 `CommentListItem.vue`(258 LOC) 이식.
 *
 * **상태(`state`)에 따라 이름과 본문이 달라진다:**
 *
 * | state             | 이름                | 본문 |
 * | ----------------- | ------------------- | ---- |
 * | `SHOW`            | 작성자(쉼표 제거)   | ✅   |
 * | `RESIDENT_DELETE` | `탈퇴된 회원의 댓글` | ✅   |
 * | `ADMIN`           | `관리사무소`        | ✅   |
 * | `DELETE`          | `삭제된 댓글`       | ❌   |
 * | `BLOCK`           | `차단된 회원의 댓글` | ❌   |
 *
 * 🔴 **이미지는 상태와 무관하게 계속 보인다.** `fileList`만 보고 그리므로
 * **삭제·차단된 댓글의 이미지가 그대로 남는다.** 레거시 그대로다 (`board.md` §CommentListItem).
 *
 * 🔴 **차단된 댓글에는 답글 버튼이 보인다.** 노출 조건에 `DELETE`만 있고 `BLOCK`이 빠져 있다.
 */
export const CommentListItem = ({
  comment,
  commentIndex,
  boardType,
  postUuid,
  isReplyComment = false,
  /** 답글 작성·댓글 수정 화면(`/post/...`)에서는 답글 버튼이 없다 */
  isCommentPage,
  onDelete,
}: {
  comment: BoardComment
  commentIndex?: number
  boardType: BoardType
  postUuid: string
  isReplyComment?: boolean
  isCommentPage: boolean
  onDelete: (payload: { commentUuid: string; isReplyComment: boolean }) => void
}) => {
  const navigate = useNavigate()
  const aptResidentUuid = useAuthStore((state) => {
    return state.aptInfo.aptResidentUuid
  })
  const koreanTimeAgo = useKoreanTimeAgo({ dateString: comment.createdDate })

  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [viewerImageUrl, setViewerImageUrl] = useState<string | null>(null)

  const isCommentAuthor = aptResidentUuid === comment.authorAptResidentUuid
  const isShowed = comment.state === COMMENT_STATE.SHOW
  const isDeleted = comment.state === COMMENT_STATE.DELETE
  const isContentVisible =
    (isShowed ||
      comment.state === COMMENT_STATE.RESIDENT_DELETE ||
      comment.state === COMMENT_STATE.ADMIN) &&
    Boolean(comment.content?.trim())

  const authorName = isShowed
    ? comment.authorText?.replaceAll(',', '')
    : COMMENT_AUTHOR_STATE_TEXT[comment.state ?? '']

  // 대댓글에는 답글을 달 수 없다(1단계 제한). `BLOCK`이 조건에 없는 것도 레거시 그대로다.
  const canReply = !isReplyComment && !isCommentPage && !isDeleted

  return (
    <>
      <li className="flex items-start gap-1.5 self-stretch">
        {isReplyComment && (
          <span className="flex h-6 w-6 items-center justify-center pt-1.5">
            <img
              className="h-[18px] w-[18px]"
              src="/assets/icons/DownRightArrow.svg"
              alt="화살표 아이콘"
            />
          </span>
        )}

        <div className="flex w-full flex-col items-start gap-[3px] self-stretch px-0 pt-1.5 pb-4">
          <div className="flex items-center gap-1.5 self-stretch">
            <img
              className="flex h-6 w-6 items-center justify-center overflow-hidden rounded-full border border-defaults-tertiary-border-tertiary"
              src="/assets/images/Profile.svg"
              alt="프로필 이미지"
            />
            <span className="pretendard-14SemiBold text-defaults-primary-text-primary">
              {authorName}
            </span>
          </div>

          <div className="flex flex-col items-start gap-2 self-stretch pl-[30px]">
            {isContentVisible && (
              <p
                className="w-full pretendard-13Regular break-words text-defaults-primary-text-primary"
                dangerouslySetInnerHTML={{
                  __html: sanitizeHtml({ html: formatHtmlText({ text: comment.content }) }),
                }}
              />
            )}

            {comment.fileList !== undefined && comment.fileList.length > 0 && (
              <ul className="flex flex-wrap items-start gap-1.5">
                {comment.fileList.map((file) => {
                  const imageUrl = `${env.VITE_S3_BUCKET_URL_FILE}${file.fileUrl ?? ''}`

                  return (
                    <li key={file.fileUuid} className="flex">
                      <img
                        src={imageUrl}
                        alt="댓글 이미지"
                        className="h-20 w-20 cursor-pointer rounded-lg border border-defaults-tertiary-border-tertiary object-contain"
                        onClick={() => {
                          if (!file.fileUrl) return
                          setViewerImageUrl(imageUrl)
                        }}
                      />
                    </li>
                  )
                })}
              </ul>
            )}

            <div className="flex items-center gap-1.5">
              <span
                className={cn(
                  'pr-1.5 pretendard-13Regular text-defaults-tertiary-text-tertiary',
                  // 구분선은 답글 버튼이 보일 때만 붙는다
                  canReply && 'border-r border-r-defaults-tertiary-border-tertiary',
                )}
              >
                {koreanTimeAgo}
              </span>
              {canReply && (
                <button
                  type="button"
                  className="pretendard-13SemiBold text-defaults-tertiary-text-tertiary"
                  onClick={() => {
                    void navigate(
                      `/post/${boardType}/comment/reply/${postUuid}/${comment.commentUuid}/${String(commentIndex)}`,
                    )
                  }}
                >
                  답글
                </button>
              )}
            </div>
          </div>
        </div>

        {isCommentAuthor && isShowed && (
          <button
            type="button"
            onClick={() => {
              setIsDrawerOpen(true)
            }}
          >
            <img className="h-4 w-4" src="/assets/icons/MoreGray.svg" alt="더보기 아이콘" />
          </button>
        )}
      </li>

      <DrawerList
        open={isDrawerOpen}
        textAlign="center"
        list={[
          {
            ...DETAIL_MORE_AUTHOR.EDIT,
            onClick: () => {
              setIsDrawerOpen(false)
              void navigate(`/post/${boardType}/comment/edit/${postUuid}/${comment.commentUuid}`)
            },
          },
          {
            ...DETAIL_MORE_AUTHOR.DELETE,
            onClick: () => {
              setIsDrawerOpen(false)
              setIsDeleteModalOpen(true)
            },
          },
        ]}
        onClose={() => {
          setIsDrawerOpen(false)
        }}
      />

      <ModalButton
        open={isDeleteModalOpen}
        buttonType="outline"
        modalData={DETAIL_DELETE_MODAL_DATA}
        onFirstClick={() => {
          setIsDeleteModalOpen(false)
        }}
        onSecondClick={() => {
          setIsDeleteModalOpen(false)
          onDelete({ commentUuid: comment.commentUuid, isReplyComment })
        }}
        onClose={() => {
          setIsDeleteModalOpen(false)
        }}
      />

      <ModalImageViewer
        open={viewerImageUrl !== null}
        imageUrl={viewerImageUrl ?? ''}
        onClose={() => {
          setViewerImageUrl(null)
        }}
      />
    </>
  )
}
