import { ButtonBase } from '@/shared/components/common/ButtonBase'
import { ModalBase } from '@/shared/components/common/ModalBase'
import type { ModalButtonProps } from '@/shared/types/overlay'

/**
 * 버튼이 붙은 확인 모달. 레거시 `components/common/ModalButton.vue`(140 LOC) 이식.
 *
 * `description`이 배열이면 줄마다 `<p>`로 그린다 — 레거시가 문자열/배열 둘 다 받는다.
 * 마크업·클래스·크기(`w-[296px] max-w-[80vw]`, `min-h-[120px]`, 버튼 `h-10`)를 그대로 옮겼다.
 */
export const ModalButton = ({
  open,
  onClose,
  buttonType,
  modalData,
  onFirstClick,
  onSecondClick,
}: ModalButtonProps) => {
  const descriptions = Array.isArray(modalData.description)
    ? modalData.description
    : [modalData.description]

  return (
    <ModalBase open={open} onClose={onClose}>
      <div className="flex w-[296px] max-w-[80vw] flex-col items-center rounded-md bg-base-b-white text-center">
        <div className="flex min-h-[120px] w-full flex-col items-center justify-center gap-1 p-6">
          {modalData.title && (
            <span className="flex items-center justify-center gap-2.5 self-stretch p-2 pretendard-16Bold text-defaults-primary-border-mono">
              {modalData.title}
            </span>
          )}
          <div>
            {descriptions.map((description) => {
              return (
                <p
                  key={description}
                  className="flex flex-col items-center justify-center pretendard-15Regular text-defaults-primary-border-mono"
                >
                  {description}
                </p>
              )
            })}
          </div>
        </div>

        {buttonType === 'single' && (
          <ButtonBase
            className="h-10 rounded-b-md"
            color="brand"
            roundType="square"
            size="md"
            onClick={onFirstClick}
          >
            {modalData.firstButton}
          </ButtonBase>
        )}

        {buttonType === 'dual' && (
          <div className="flex h-10 self-stretch pretendard-16Regular">
            <button
              type="button"
              className="w-full rounded-bl-md bg-defaults-secondary-background-secondary px-3 py-2 text-center pretendard-14Medium whitespace-nowrap text-defaults-secondary-text-secondary"
              onClick={onFirstClick}
            >
              {modalData.firstButton}
            </button>
            <button
              type="button"
              className="w-full rounded-br-md bg-brand-default-text-brand px-3 py-2 text-center pretendard-14Medium whitespace-nowrap text-defaults-primary-text-primary-inverse"
              onClick={onSecondClick}
            >
              {modalData.secondButton}
            </button>
          </div>
        )}

        {buttonType === 'outline' && (
          <div className="flex h-10 self-stretch border-t">
            <button
              type="button"
              className="w-full rounded-bl-md border-r bg-white px-3 py-2 text-center pretendard-14Medium whitespace-nowrap text-defaults-tertiary-text-tertiary"
              onClick={onFirstClick}
            >
              {modalData.firstButton}
            </button>
            <button
              type="button"
              className="w-full rounded-br-md bg-white px-3 py-2 text-center pretendard-14Medium whitespace-nowrap text-alerts-error-text-error"
              onClick={onSecondClick}
            >
              {modalData.secondButton}
            </button>
          </div>
        )}
      </div>
    </ModalBase>
  )
}
