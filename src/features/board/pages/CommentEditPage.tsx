import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { CommentImageStrip } from '@/features/board/components/CommentImageStrip'
import { BOARD_IMAGE_TOAST_MESSAGE, EDIT_BACK_MODAL_DATA } from '@/features/board/constants/board'
import { useCommentImageList } from '@/features/board/hooks/useCommentImageList'
import { usePatchBoardComment } from '@/features/board/queries/useBoardMutations'
import { useBoardCommentDetail } from '@/features/board/queries/useBoardPostDetail'
import { BOARD_TYPE, type BoardType } from '@/features/board/types/post'
import { ModalButton } from '@/shared/components/common/ModalButton'
import { SpinnerDots } from '@/shared/components/common/SpinnerDots'
import { AppBar } from '@/shared/components/layouts/AppBar'
import { showToast } from '@/shared/lib/toast'
import { formatHtmlText } from '@/shared/utils/formatHtmlText'

/**
 * 댓글 수정 (B8·B15). 레거시 `CommentEdit.vue`(206 LOC) + 두 뷰 이식.
 *
 * ⚠️ **완료 버튼이 실제로 잠긴다.** 게시글 폼(B9·B16)의 완료 버튼은 색만 회색이고
 * 눌리는데, 여기는 `disabled`가 걸린다 — 두 화면의 규칙이 다르다 (`board.md` §5-12).
 *
 * ⚠️ **뒤로가기는 확인 모달을 거친다.** AppBar 뒤로가기를 가로채 `수정 그만두기`를 띄운다.
 *
 * ⚠️ 본문을 넣을 때 `<br/>`을 다시 줄바꿈으로 되돌린다 — 저장 시 반대 변환이 일어나므로
 * 그대로 두면 수정할 때마다 `<br/>`이 글자로 쌓인다.
 */
export const CommentEditPage = ({ boardType }: { boardType: BoardType }) => {
  const { postUuid, commentUuid } = useParams()
  const navigate = useNavigate()

  const { commentDetail, isCommentDetailLoading } = useBoardCommentDetail({
    boardType,
    postUuid,
    commentUuid,
  })
  const { patchComment, isPatchCommentPending, progressPercent } = usePatchBoardComment({
    boardType,
    postUuid,
    commentUuid,
  })
  const { imageList, previewImageList, handleFileChange, removeImage, setImageList } =
    useCommentImageList()

  const [content, setContent] = useState('')
  const [isBackModalOpen, setIsBackModalOpen] = useState(false)

  // 응답이 도착하면 폼을 채운다. 마운트 1회가 아니라 **데이터 도착 시**다 (BD-Q11 확정)
  useEffect(() => {
    if (!commentDetail) return

    setContent(formatHtmlText({ text: commentDetail.content }).replaceAll('<br/>', '\n'))
    setImageList(commentDetail.fileList ?? [])
  }, [commentDetail, setImageList])

  const isFilled = content.trim() !== '' || imageList.length > 0

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <AppBar
        title="댓글 수정"
        onBack={() => {
          setIsBackModalOpen(true)
        }}
      >
        <button
          type="submit"
          form="commentEditForm"
          disabled={!isFilled || isPatchCommentPending}
          className={
            isFilled && !isPatchCommentPending
              ? 'text-brand-default-text-brand'
              : 'text-defaults-tertiary-text-tertiary'
          }
        >
          {isPatchCommentPending ? '처리중' : '완료'}
        </button>
      </AppBar>

      {(isCommentDetailLoading || isPatchCommentPending) && (
        <SpinnerDots
          progressPercent={progressPercent}
          backgroundColor={isPatchCommentPending ? 'bg-black/50' : ''}
          textColor={isPatchCommentPending ? 'text-base-b-white' : 'text-base-b-black'}
        />
      )}

      <form
        id="commentEditForm"
        className="flex flex-1 flex-col overflow-hidden px-5 py-4 pt-12"
        onSubmit={(event) => {
          event.preventDefault()
          if (!isFilled) return

          patchComment({ content, fileList: [...imageList] })
        }}
      >
        <textarea
          value={content}
          rows={10}
          className="flex h-full w-full flex-1 items-start gap-2.5 self-stretch overflow-auto pretendard-15Regular text-defaults-primary-text-primary placeholder:text-defaults-tertiary-text-tertiary"
          onChange={(event) => {
            setContent(event.target.value)
          }}
        />
      </form>

      <div className="w-full bg-base-b-white">
        <CommentImageStrip previewImageList={previewImageList} onRemove={removeImage} />

        <div className="flex h-16 w-full items-center justify-between gap-[14px] overflow-hidden border-t border-t-[#f6f6f6] bg-defaults-primary-background-primary px-5 py-[14px]">
          <label
            htmlFor="commentImageUpload"
            className="flex items-center gap-1 text-center pretendard-14SemiBold text-defaults-secondary-text-secondary"
          >
            <img className="h-[18px] w-[18px]" src="/assets/icons/PhotoAdd.svg" alt="포토 아이콘" />
            <span>사진</span>
            <span>
              <span className={imageList.length > 0 ? 'text-orange-s-warning-500' : ''}>
                {imageList.length}
              </span>
              /5
            </span>
            <input
              id="commentImageUpload"
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={(event) => {
                handleFileChange(event, (errorType) => {
                  showToast({ message: BOARD_IMAGE_TOAST_MESSAGE[errorType] })
                })
              }}
            />
          </label>
        </div>
      </div>

      <ModalButton
        open={isBackModalOpen}
        buttonType="outline"
        modalData={EDIT_BACK_MODAL_DATA}
        onFirstClick={() => {
          setIsBackModalOpen(false)
        }}
        onSecondClick={() => {
          void navigate(-1)
        }}
        onClose={() => {
          setIsBackModalOpen(false)
        }}
      />
    </div>
  )
}

export const CommunityCommentEditPage = () => {
  return <CommentEditPage boardType={BOARD_TYPE.COMMUNITY} />
}

export const ComplaintsCommentEditPage = () => {
  return <CommentEditPage boardType={BOARD_TYPE.COMPLAINTS} />
}
