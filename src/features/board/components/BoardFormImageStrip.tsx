/**
 * 게시글 폼의 첨부 미리보기. 레거시 `FormImagesPreview.vue` 이식.
 *
 * ⚠️ **댓글 미리보기(`CommentImageStrip`)와 클래스·`alt`가 미묘하게 다르다.**
 * 묶고 싶어지지만 묶으면 화면이 달라진다 (`board.md` §B9):
 *
 * | 항목        | 게시글(이 파일)     | 댓글               |
 * | ----------- | ------------------- | ------------------ |
 * | `<ul>` 여백 | `px-4 pb-4`         | `px-5 pb-2 pt-3`   |
 * | `<li>`      | `shrink-0` **없음** | `shrink-0` 있음    |
 * | 썸네일      | `object-cover` 없음 | `object-cover` 있음 |
 * | 삭제 alt    | `닫기 아이콘`       | `이미지 삭제`      |
 */
export const BoardFormImageStrip = ({
  previewImageList,
  onRemove,
}: {
  previewImageList: { url: string; key: string }[]
  onRemove: (index: number) => void
}) => {
  if (previewImageList.length === 0) return null

  return (
    <ul className="flex w-full gap-2 overflow-x-scroll overflow-y-hidden px-4 pb-4">
      {previewImageList.map((preview, index) => {
        return (
          <li key={preview.key} className="relative h-[70px] w-[72.5px]">
            <div className="flex h-[70px] w-[70px] shrink-0 justify-center overflow-hidden rounded-md border border-defaults-tertiary-border-tertiary">
              <img className="h-[70px] w-[70px] shrink-0" src={preview.url} alt="이미지 파일" />
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
                alt="닫기 아이콘"
              />
            </button>
          </li>
        )
      })}
    </ul>
  )
}
