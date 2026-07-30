import { Dialog } from '@base-ui/react/dialog'

import type { ModalBaseProps } from '@/shared/types/overlay'

/**
 * 레거시 `components/common/ModalBase.vue` 이식 (7곳 사용).
 *
 * 레거시는 딤 배경 `div`에 클릭 핸들러를 직접 달고 `body.overflow`를 손으로 잠갔다.
 * Base UI `Dialog`가 포털·포커스 트랩·스크롤 잠금·`Esc`를 대신 처리한다
 * (`docs/conventions/11-overlay.md`).
 *
 * **마크업과 클래스는 레거시 그대로다** — 딤 배경 색까지 디자인 토큰
 * `bg-defaults-primary-background-dimmed`(#00000080)를 쓴다.
 * 내용 상자에는 스타일이 없다. 크기·배경은 각 모달이 자기 자식에서 정한다.
 */
export const ModalBase = ({ open, onClose, children }: ModalBaseProps) => {
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose()
      }}
    >
      <Dialog.Portal>
        {/* 레거시는 배경과 내용이 한 요소였고 배경 클릭으로 닫혔다. 그 동작을 유지한다. */}
        <Dialog.Backdrop className="fixed top-[0px] left-[0px] z-[9999] flex h-screen w-screen items-center justify-center overflow-hidden bg-defaults-primary-background-dimmed p-5" />
        <Dialog.Popup className="fixed top-1/2 left-1/2 z-[9999] max-h-[calc(100vh-2.5rem)] max-w-[calc(100vw-2.5rem)] -translate-x-1/2 -translate-y-1/2 outline-none">
          {children}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
