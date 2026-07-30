import { Dialog } from '@base-ui/react/dialog'

import { DEFAULT_ERROR_MODAL_TEXT } from '@/shared/constants/message'
import { sanitizeHtml } from '@/shared/lib/sanitizeHtml'
import { useErrorModalStore } from '@/shared/stores/errorModalStore'

/**
 * 레거시 SweetAlert2 에러 모달의 대체물. `App.tsx`에 **한 번만** 마운트한다.
 * 띄우는 쪽은 `showErrorModal()`만 부른다 (`shared/lib/errorModal.ts`).
 *
 * ⚠️ **SweetAlert2 기본 스타일을 손으로 재현한 것이다.** 아래 수치는
 * sweetalert2 v11의 기본값(`em` 단위)을 그대로 옮겼다:
 *  - popup: `width: 32em`, `border-radius: 5px`, `padding: 0 0 1.25em`, `color: #545454`
 *  - icon: `5em` 정사각, `border: .25em solid`, 위쪽 여백 `2.5em`
 *  - error 색 `#f27474` · info 색 `#3fc3ee`
 *  - 본문: `font-size: 1.125em`, `margin: 1em 1.6em .3em`
 *  - 확인 버튼: `padding: .625em 1.1em`, `border-radius: .25em`, `font-weight: 500`
 *  - 확인 버튼 배경 `#2563EB` — 레거시가 `confirmButtonColor`로 덮은 값
 *  - 컨테이너 배경 `rgba(0,0,0,.4)`
 *
 * 픽셀 대조는 도메인 이관 시 QA 항목이다 (계획서 R10).
 *
 * 배경 클릭으로 닫히는 것도 레거시(SweetAlert2 기본 `allowOutsideClick: true`)를 따랐다.
 * `docs/conventions/11-overlay.md`는 확인 다이얼로그에 배경 닫기를 넣지 말라고 하지만,
 * 등가 이관이 우선이다. 이때 `callback`은 실행되지 않는다.
 */
export const ErrorModal = () => {
  const current = useErrorModalStore((state) => {
    return state.current
  })
  const confirm = useErrorModalStore((state) => {
    return state.confirm
  })
  const dismiss = useErrorModalStore((state) => {
    return state.dismiss
  })

  const icon = current?.icon ?? 'error'
  const iconColor = icon === 'error' ? '#f27474' : '#3fc3ee'

  return (
    <Dialog.Root
      open={current !== null}
      onOpenChange={(open) => {
        if (!open) dismiss()
      }}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-[9999] bg-black/40" />
        <Dialog.Popup
          className="fixed top-1/2 left-1/2 z-[9999] grid w-[32em] max-w-[calc(100%-1.25em)] -translate-x-1/2 -translate-y-1/2 rounded-[5px] bg-white pb-[1.25em] text-[#545454] outline-none"
          // SweetAlert2는 제목 없이 본문만 있는 모달이라 aria-label로 역할을 준다.
          aria-label="알림"
        >
          {/* 아이콘 — 5em 원형. error는 ✕ 두 선, info는 i 글리프 */}
          <div
            className="relative mx-auto mt-[2.5em] mb-[0.6em] box-content flex h-[5em] w-[5em] items-center justify-center rounded-full border-[0.25em]"
            style={{ borderColor: iconColor, color: iconColor }}
            aria-hidden
          >
            {icon === 'error' ? (
              <>
                <span
                  className="absolute top-[2.3125em] left-[1.0625em] block h-[0.3125em] w-[2.9375em] rotate-45 rounded-[0.125em]"
                  style={{ backgroundColor: iconColor }}
                />
                <span
                  className="absolute top-[2.3125em] right-[1em] block h-[0.3125em] w-[2.9375em] -rotate-45 rounded-[0.125em]"
                  style={{ backgroundColor: iconColor }}
                />
              </>
            ) : (
              <span className="text-[3.75em] leading-none font-normal">i</span>
            )}
          </div>

          {/* 본문 — html이 있으면 text보다 우선한다 (SweetAlert2 동작) */}
          {current?.html ? (
            <div
              className="mx-[1.6em] mt-[1em] mb-[0.3em] overflow-auto text-center text-[1.125em] leading-normal break-words"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml({ html: current.html }) }}
            />
          ) : (
            <div className="mx-[1.6em] mt-[1em] mb-[0.3em] overflow-auto text-center text-[1.125em] leading-normal break-words">
              {current?.text ?? DEFAULT_ERROR_MODAL_TEXT}
            </div>
          )}

          <div className="mt-[1.25em] flex w-full flex-wrap items-center justify-center">
            <button
              type="button"
              className="m-[0.3125em] rounded-[0.25em] bg-[#2563EB] px-[1.1em] py-[0.625em] text-white"
              onClick={confirm}
            >
              {current?.confirmButtonText ?? '확인'}
            </button>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
