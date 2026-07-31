import { useState } from 'react'

import { BoardFormImageStrip } from '@/features/board/components/BoardFormImageStrip'
import {
  BOARD_IMAGE_TOAST_MESSAGE,
  type BoardImageErrorType,
  WRITE_PRIVATE_MODAL_DATA,
} from '@/features/board/constants/board'
import { ModalButton } from '@/shared/components/common/ModalButton'
import { showToast } from '@/shared/lib/toast'

/**
 * 폼 하단 바 — 사진 첨부 + 비밀글. 레거시 `FormBottom`·`FormImageUpload`·
 * `FormImagesPreview` 세 파일을 합쳤다.
 *
 * ⚠️ **비밀글은 민원공간에만 있다.** 소통공간에서는 체크박스 자체가 없다.
 *
 * 🔴 **비밀글 체크박스의 클릭 동작이 비대칭이다:**
 *
 * | 현재 상태 | 클릭 결과                                    |
 * | --------- | -------------------------------------------- |
 * | 꺼짐      | **체크되지 않고** 안내 모달만 열린다         |
 * | 켜짐      | **모달 없이 바로 해제된다**                  |
 *
 * 레거시는 `<button>` > `<label>` > `<input>` 중첩과 `preventDefault()`로 이 동작을
 * 만든다 — HTML 규격 위반이고 접근성 도구가 걸고 넘어지는 구조다. **동작만 재현하고
 * 중첩은 옮기지 않았다** — 눈에 보이는 결과가 같고, 중첩 인터랙티브 요소를 일부러
 * 만들 이유가 없다 (`board.md` BD-Q12 결정 · 2026-07-31).
 */
export const BoardFormBottom = ({
  imageCount,
  previewImageList,
  hasPrivateFlag,
  privateFlag,
  onFileChange,
  onRemoveImage,
  onChangePrivateFlag,
}: {
  imageCount: number
  previewImageList: { url: string; key: string }[]
  hasPrivateFlag: boolean
  privateFlag: boolean
  onFileChange: (
    event: React.ChangeEvent<HTMLInputElement>,
    onError: (errorType: BoardImageErrorType) => void,
  ) => void
  onRemoveImage: (index: number) => void
  onChangePrivateFlag: (next: boolean) => void
}) => {
  const [isPrivateModalOpen, setIsPrivateModalOpen] = useState(false)

  return (
    <div className="w-full">
      <BoardFormImageStrip previewImageList={previewImageList} onRemove={onRemoveImage} />

      <div className="flex h-16 w-full items-center justify-between gap-[14px] overflow-hidden border-t border-t-[#f6f6f6] bg-defaults-primary-background-primary px-5 py-[14px]">
        <label
          htmlFor="imageUpload"
          className="flex items-center gap-1 text-center pretendard-14SemiBold text-defaults-secondary-text-secondary"
        >
          <img className="h-[18px] w-[18px]" src="/assets/icons/PhotoAdd.svg" alt="포토 아이콘" />
          <span>사진</span>
          <span>
            <span className={imageCount > 0 ? 'text-orange-s-warning-500' : ''}>{imageCount}</span>
            /5
          </span>
          <input
            id="imageUpload"
            accept="image/*"
            type="file"
            multiple
            hidden
            onChange={(event) => {
              onFileChange(event, (errorType) => {
                showToast({ message: BOARD_IMAGE_TOAST_MESSAGE[errorType] })
              })
            }}
          />
        </label>

        {hasPrivateFlag && (
          <button
            type="button"
            className="py-4 pl-4"
            onClick={() => {
              // 켜져 있으면 바로 끄고, 꺼져 있으면 모달로 물어본다
              if (privateFlag) {
                onChangePrivateFlag(false)
                return
              }
              setIsPrivateModalOpen(true)
            }}
          >
            <span className="flex items-center gap-2">
              {/* 체크 상태는 위 버튼이 정한다 — 직접 조작하지 않는다(레거시 동작) */}
              <input type="checkbox" className="h-4 w-4" checked={privateFlag} readOnly />
              <span className="pretendard-14Regular">비밀글 설정</span>
            </span>
          </button>
        )}
      </div>

      <ModalButton
        open={isPrivateModalOpen && !privateFlag}
        buttonType="outline"
        modalData={WRITE_PRIVATE_MODAL_DATA}
        onFirstClick={() => {
          // `취소`도 값을 명시적으로 false로 되돌린다 (레거시 `handleModalClose`)
          onChangePrivateFlag(false)
          setIsPrivateModalOpen(false)
        }}
        onSecondClick={() => {
          onChangePrivateFlag(true)
          setIsPrivateModalOpen(false)
        }}
        onClose={() => {
          onChangePrivateFlag(false)
          setIsPrivateModalOpen(false)
        }}
      />
    </div>
  )
}
