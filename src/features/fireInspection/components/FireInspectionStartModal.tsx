import type { FireInspectionStatusData } from '@/features/fireInspection/types/fireInspection'
import { ModalBase } from '@/shared/components/common/ModalBase'
import { calculateDday } from '@/shared/utils/calculateDday'
import { formatIsoStringDate } from '@/shared/utils/formatIsoStringDate'

/**
 * 점검 시작 확인 모달 (F1). 레거시 `FireInspectionStartModal.vue`.
 *
 * ⚠️ **`ModalButton`을 쓰지 않고 자체 마크업이다** — `rounded-2xl`(공용은 `rounded-md`),
 * 아이콘 원, 기간 카드, 세로 구분선이 붙은 버튼 2개까지 이 화면 전용이다.
 *
 * ⚠️ **아이콘이 `Link.svg`(링크 아이콘)다.** 소방·점검과 무관한 아이콘을 흰색으로 반전해
 * 쓰고 있다 — 의도인지 임시인지 불명이라 그대로 옮겼다 (`fire-inspection.md` F-Q9).
 *
 * ⚠️ **D-day는 점검이 진행 중일 때만 뜬다** (종료일 당일 포함).
 */
export const FireInspectionStartModal = ({
  open,
  inspection,
  onClose,
  onConfirm,
}: {
  open: boolean
  inspection: FireInspectionStatusData
  onClose: () => void
  onConfirm: () => void
}) => {
  const inspectionPeriod = `${formatIsoStringDate({ dateTimeString: inspection.startDate }).dotDate()} ~ ${formatIsoStringDate({ dateTimeString: inspection.endDate }).dotDate()}`

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const endDate = new Date(inspection.endDate ?? today)
  endDate.setHours(0, 0, 0, 0)
  const isInspectionOngoing = endDate >= today

  return (
    <ModalBase open={open} onClose={onClose}>
      <div className="flex w-[296px] max-w-[80vw] flex-col items-center overflow-hidden rounded-2xl bg-base-b-white">
        <div className="flex w-full flex-col items-center gap-4 px-6 pt-7 pb-5">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-default-background-brand">
            <img
              src="/assets/icons/Link.svg"
              alt="점검 연결"
              className="h-7 w-7 brightness-0 invert"
            />
          </div>

          <span className="pretendard-16Bold text-defaults-primary-text-primary">
            자가점검을 시작할까요?
          </span>

          <div className="flex w-full flex-col gap-2 rounded-xl bg-defaults-secondary-background-secondary px-4 py-3">
            <div className="flex items-center justify-between">
              <span className="pretendard-13Medium text-defaults-tertiary-text-tertiary">
                점검 기간
              </span>
              {isInspectionOngoing && (
                <span className="pretendard-13SemiBold text-alerts-error-text-error">
                  {calculateDday({ targetDate: inspection.endDate ?? today })}
                </span>
              )}
            </div>
            <span className="pretendard-14SemiBold text-defaults-primary-text-primary">
              {inspectionPeriod}
            </span>
          </div>

          <p className="text-center pretendard-13Regular text-defaults-tertiary-text-tertiary">
            점검 항목을 체크하고 서명하면
            <br />
            관리사무소에 자동으로 제출됩니다.
          </p>
        </div>

        <div className="flex w-full border-t border-defaults-tertiary-border-tertiary">
          <button
            type="button"
            className="flex-1 py-3.5 pretendard-15Regular text-defaults-secondary-text-secondary"
            onClick={onClose}
          >
            취소
          </button>
          <div className="w-px bg-defaults-tertiary-border-tertiary" />
          <button
            type="button"
            className="flex-1 py-3.5 pretendard-15SemiBold text-brand-default-text-brand"
            onClick={onConfirm}
          >
            시작하기
          </button>
        </div>
      </div>
    </ModalBase>
  )
}
