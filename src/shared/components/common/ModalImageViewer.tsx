import { Dialog } from '@base-ui/react/dialog'

import { SAVE_FILE_TYPE } from '@/shared/constants/native'
import { nativeSaveFile } from '@/shared/lib/native/common'
import type { ModalImageViewerProps } from '@/shared/types/overlay'

/**
 * 이미지 확대 보기. 레거시 `ModalImageViewer.vue`.
 *
 * ⚠️ z-index가 **1000**이다. 다른 오버레이(9999)보다 낮다 — 레거시 그대로다.
 * ⚠️ 배경이 `bg-opacity-75`였다. Tailwind 4에서 제거된 유틸리티라
 * `bg-base-b-black/75`로 옮겼다 (`tech-mapping.md` §10-1).
 *
 * 저장 파일명은 `image_{timestamp}.jpg`다 — 원본 확장자를 보지 않는다(레거시 동일).
 */
export const ModalImageViewer = ({ open, onClose, imageUrl }: ModalImageViewerProps) => {
  const downloadImage = () => {
    nativeSaveFile({
      fileName: `image_${Date.now()}.jpg`,
      fileUrl: imageUrl,
      type: SAVE_FILE_TYPE.IMAGE,
    })
  }

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose()
      }}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-[0px] z-[1000] bg-base-b-black/75" />
        <Dialog.Popup className="fixed inset-[0px] z-[1000] flex items-center justify-center outline-none">
          <div className="absolute top-4 right-4 z-10 flex">
            <button
              type="button"
              className="flex h-12 w-12 items-center justify-center"
              onClick={downloadImage}
            >
              <img
                src="/assets/icons/FileDownload.svg"
                alt="다운로드"
                className="h-6 w-6 brightness-0 invert"
              />
            </button>
            <button
              type="button"
              className="flex h-12 w-12 items-center justify-center hover:bg-base-b-white/30"
              onClick={onClose}
            >
              <img
                src="/assets/icons/CloseBold.svg"
                alt="닫기"
                className="h-6 w-6 brightness-0 invert"
              />
            </button>
          </div>

          <div className="flex h-full w-full items-center justify-center p-4">
            <img
              src={imageUrl}
              alt="공지사항 이미지"
              className="max-h-[80vh] max-w-[80vw] object-contain"
            />
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
