import { REPAIR_IMAGE_LIMIT } from '@/features/repair/constants/repair'

/**
 * 첨부 이미지 영역 (RP2·RP3). 레거시 `RepairFormImage.vue`(101 LOC) 이식.
 *
 * ⚠️ **5장을 채우면 추가 버튼이 사라진다.**
 * ⚠️ **`accept="image/*"`라 파일 선택 창은 모든 이미지를 보여주지만** 검증은 4종만
 * 통과시킨다 — webp·heic를 고르면 토스트가 뜬다.
 */
export const RepairFormImage = ({
  previewImageList,
  onAdd,
  onRemove,
}: {
  previewImageList: { key: string; url: string }[]
  /** 검증 실패 토스트는 화면이 붙인다 */
  onAdd: (event: React.ChangeEvent<HTMLInputElement>) => void
  onRemove: (index: number) => void
}) => {
  return (
    <div className="space-y-3">
      {/* ⚠️ 레거시가 `<div for=...>`를 썼다. `<label>`이 아니라 유효하지 않은 속성이었다 */}
      <div className="flex gap-1 pretendard-15SemiBold">이미지 첨부(선택)</div>

      <div className="flex gap-3 overflow-x-auto">
        {previewImageList.map((preview, index) => {
          return (
            <div key={preview.key} className="relative flex h-20 w-20 shrink-0">
              <img className="h-full w-full rounded-md" src={preview.url} alt="첨부 이미지" />
              <button
                type="button"
                onClick={() => {
                  onRemove(index)
                }}
              >
                <img
                  className="absolute top-1 right-1 h-5 w-5"
                  src="/assets/icons/Xcircle.svg"
                  alt="이미지 삭제"
                />
              </button>
            </div>
          )
        })}

        {previewImageList.length <= REPAIR_IMAGE_LIMIT.MAX_COUNT - 1 && (
          <label
            htmlFor="imageUpload"
            className="flex h-20 w-20 shrink-0 cursor-pointer items-center justify-center rounded-md border border-dashed border-defaults-tertiary-border-tertiary"
          >
            <img
              className="h-[18px] w-[18px]"
              src="/assets/icons/PhotoAdd.svg"
              alt="이미지 추가 아이콘"
            />
            <input
              id="imageUpload"
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={onAdd}
            />
          </label>
        )}
      </div>

      <p className="pretendard-13Regular text-defaults-tertiary-text-tertiary">
        최대 5장 첨부 가능
      </p>
    </div>
  )
}
