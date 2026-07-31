import { useRef, useState } from 'react'

import { CommentImageStrip } from '@/features/board/components/CommentImageStrip'
import {
  BOARD_IMAGE_TOAST_MESSAGE,
  COMMENT_IMAGE_LIMIT,
  PASTE_BLOCKED_MESSAGE,
} from '@/features/board/constants/board'
import { useCommentImageList } from '@/features/board/hooks/useCommentImageList'
import type { CommentSubmitPayload } from '@/features/board/types/detail'
import { ButtonBase } from '@/shared/components/common/ButtonBase'
import { showToast } from '@/shared/lib/toast'
import { cn } from '@/shared/utils/cn'

/**
 * 하단 고정 댓글 입력창. 레거시 `CommentInput.vue`(160 LOC) 이식.
 *
 * ⚠️ **이미지를 붙여넣을 수 없다.** 클립보드에 `text/plain`이 없으면 막고 토스트를 띄운다 —
 * 파일 선택으로만 첨부할 수 있다.
 *
 * ⚠️ **텍스트가 비어도 이미지만 있으면 등록된다** (`.trim()` 1자 이상 **또는** 이미지 1장 이상).
 *
 * 자동 높이는 `scrollHeight`로 잡는다. 레거시는 30ms debounce를 걸었는데, 이는
 * vueuse `useDebounceFn`으로 입력 폭주를 줄이려던 것이다. 여기서는 **입력 이벤트에서
 * 바로 잰다** — React는 렌더 후 값이 이미 DOM에 반영돼 있고, 30ms 지연은 타이핑 중
 * 높이가 늦게 따라오는 것으로 보인다. 최종 높이는 같다.
 */
export const CommentInput = ({
  isReplyPage,
  onSubmit,
}: {
  isReplyPage: boolean
  onSubmit: (payload: CommentSubmitPayload) => void
}) => {
  const [content, setContent] = useState('')
  const [textAreaHeight, setTextAreaHeight] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const { imageList, previewImageList, handleFileChange, removeImage, clearImages } =
    useCommentImageList()

  const isInputValid = content.trim().length >= 1 || imageList.length > 0
  const isImageSlotFull = imageList.length >= COMMENT_IMAGE_LIMIT.MAX_COUNT

  const updateHeight = () => {
    const textarea = textareaRef.current
    if (!textarea) return

    // 내용이 비면 최소 높이(0)로 되돌린다 — 레거시 동일
    setTextAreaHeight(textarea.value.trim().length === 0 ? 0 : textarea.scrollHeight)
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!isInputValid) return

    onSubmit({ content, fileList: [...imageList] })

    setContent('')
    clearImages()
    setTextAreaHeight(0)
  }

  return (
    <form
      className="fixed bottom-0 flex w-full flex-col border-t border-t-[#f6f6f6] bg-base-b-white"
      onSubmit={handleSubmit}
    >
      <CommentImageStrip previewImageList={previewImageList} onRemove={removeImage} />

      <div
        className="flex min-h-16 w-full items-center gap-1.5 px-5 py-3"
        style={{ height: `${String(textAreaHeight + 24)}px` }}
      >
        <button
          type="button"
          className="flex h-10 w-10 shrink-0 items-center justify-center"
          disabled={isImageSlotFull}
          onClick={() => {
            fileInputRef.current?.click()
          }}
        >
          <img
            className={cn('h-[22px] w-[22px]', isImageSlotFull && 'opacity-40')}
            src="/assets/icons/PhotoAdd.svg"
            alt="사진 첨부"
          />
        </button>
        <input
          ref={fileInputRef}
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

        <textarea
          ref={textareaRef}
          value={content}
          placeholder={`${isReplyPage ? '답글' : '댓글'}을 입력해 주세요`}
          className="min-h-10 w-full rounded-[4px] border border-defaults-secondary-border-secondary bg-[#f8f8f8] px-3 py-2.5 pretendard-16Regular text-defaults-primary-text-primary placeholder:text-defaults-tertiary-text-tertiary focus:border focus:border-defaults-focus-border-focus"
          style={{ height: `${String(textAreaHeight)}px` }}
          onChange={(event) => {
            setContent(event.target.value)
            updateHeight()
          }}
          onPaste={(event) => {
            const items = Array.from(event.clipboardData.items)
            const hasPlainText = items.some((item) => {
              return item.type === 'text/plain'
            })
            if (hasPlainText) return

            event.preventDefault()
            showToast({ message: PASTE_BLOCKED_MESSAGE })
          }}
        />

        <div className="w-14">
          <ButtonBase
            type="submit"
            className="pretendard-14SemiBold text-base-b-white"
            roundType="rounded"
            color="brand"
            disabled={!isInputValid}
          >
            입력
          </ButtonBase>
        </div>
      </div>
    </form>
  )
}
