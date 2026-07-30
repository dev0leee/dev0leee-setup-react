import { Dialog } from '@base-ui/react/dialog'

import type { ModalPageProps } from '@/shared/types/overlay'

/**
 * 전체 화면을 덮는 모달. 레거시 `ModalPage.vue`.
 *
 * 딤 배경이 없다 — 흰 배경으로 화면을 통째로 가린다. 그래서 `Backdrop`을 두지 않고
 * `Popup`이 `inset-0`을 차지한다.
 *
 * 헤더 높이 56px, 테두리 `#EEEEEE`, 제목 18px/24px bold `#111111`은
 * 디자인 토큰이 아닌 하드코딩 값이다. 레거시 그대로 둔다.
 */
export const ModalPage = ({ open, onClose, title = '', children }: ModalPageProps) => {
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose()
      }}
    >
      <Dialog.Portal>
        <Dialog.Popup className="fixed inset-0 z-[9999] bg-white outline-none">
          <div className="flex h-full flex-col">
            <header className="flex h-[56px] shrink-0 items-center border-b border-[#EEEEEE] px-5">
              <button
                type="button"
                className="flex h-8 w-8 shrink-0 items-center justify-center"
                aria-label="닫기"
                onClick={onClose}
              >
                <img src="/assets/icons/Close.svg" alt="닫기 아이콘" />
              </button>

              <h1 className="ml-2 min-w-0 flex-1 truncate text-[18px] leading-[24px] font-bold text-[#111111]">
                {title}
              </h1>
            </header>

            <main className="min-h-0 flex-1 overflow-y-auto">{children}</main>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
