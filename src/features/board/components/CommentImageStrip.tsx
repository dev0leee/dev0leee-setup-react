import type { CommentImagePreview } from '@/features/board/hooks/useCommentImageList'

/**
 * 첨부 이미지 미리보기 줄. 레거시 `CommentInput.vue`와 `CommentEdit.vue`에
 * **같은 마크업이 복사돼 있던 것**을 하나로 모았다.
 *
 * 이미지가 없으면 아무것도 그리지 않는다 — 줄 자체가 사라져야 입력창이 붙는다.
 */
export const CommentImageStrip = ({
  previewImageList,
  onRemove,
}: {
  previewImageList: CommentImagePreview[]
  onRemove: (index: number) => void
}) => {
  if (previewImageList.length === 0) return null

  return (
    <ul className="flex w-full gap-2 overflow-x-auto overflow-y-hidden px-5 pt-3 pb-2">
      {previewImageList.map((preview, index) => {
        return (
          <li key={preview.key} className="relative h-[70px] w-[72.5px] shrink-0">
            <div className="flex h-[70px] w-[70px] shrink-0 justify-center overflow-hidden rounded-md border border-defaults-tertiary-border-tertiary">
              <img
                className="h-[70px] w-[70px] shrink-0 object-cover"
                src={preview.url}
                alt="댓글 이미지"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                onRemove(index)
              }}
            >
              <img
                className="absolute top-[-2px] right-[-2px] h-5 w-5"
                src="/assets/icons/Xcircle.svg"
                alt="이미지 삭제"
              />
            </button>
          </li>
        )
      })}
    </ul>
  )
}
