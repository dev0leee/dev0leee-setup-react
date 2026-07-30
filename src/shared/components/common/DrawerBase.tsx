import { Dialog } from '@base-ui/react/dialog'

import type { DrawerBaseProps } from '@/shared/types/overlay'

/**
 * 바텀시트. 레거시 `components/common/DrawerBase.vue` 이식 (11곳 사용).
 *
 * 레이아웃·클래스·간격을 레거시 그대로 옮겼다:
 *  - 시트: `rounded-t-[20px]`, 흰 배경, 하단 고정
 *  - 내용: `max-h-[90vh]`, `pt-4 pb-6`, `gap-[10px]`
 *  - 제목: `pretendard-18Bold`, `h-7`, `px-[30px] py-2 pr-5`, 넘치면 말줄임
 *  - 버튼 영역: `h-14`, `px-5`, `gap-[10px]`
 *  - 딤 배경: `bg-black/50` (모달의 디자인 토큰과 다르다 — 레거시가 그렇다)
 *
 * 슬라이드업 전환은 `transition-drawer-slide-up`(0.3s ease)이 레거시 값이다.
 */
export const DrawerBase = ({
  open,
  onClose,
  title,
  hasCloseButton,
  hasButtons,
  children,
  buttons,
}: DrawerBaseProps) => {
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose()
      }}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-[9999] bg-black/50" />
        <Dialog.Popup className="fixed bottom-0 left-0 z-[9999] flex w-full flex-col items-center rounded-t-[20px] bg-white outline-none transition-drawer-slide-up">
          <div className="flex max-h-[90vh] flex-col items-start gap-[10px] self-stretch pt-4 pb-6">
            <div className="flex flex-col items-start self-stretch">
              {title && (
                <div className="flex h-7 w-full items-center justify-between gap-4 py-2 pr-5 pl-[30px] pretendard-18Bold text-defaults-primary-text-primary">
                  <span className="truncate">{title}</span>
                  {hasCloseButton && (
                    <button
                      type="button"
                      className="flex h-7 w-7 items-center justify-center"
                      onClick={onClose}
                    >
                      <img src="/assets/icons/CloseBold.svg" alt="닫기 아이콘" />
                    </button>
                  )}
                </div>
              )}
              {children}
            </div>
            {hasButtons && <div className="flex h-14 w-full gap-[10px] px-5">{buttons}</div>}
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
