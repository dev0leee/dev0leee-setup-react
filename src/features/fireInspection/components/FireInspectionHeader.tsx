import { FIRE_INSPECTION_MESSAGE } from '@/features/fireInspection/constants/fireInspection'
import {
  FIRE_INSPECTION_SUBMISSION_STATUS,
  type FireInspectionSubmissionStatus,
} from '@/features/fireInspection/types/fireInspection'
import { ButtonBase } from '@/shared/components/common/ButtonBase'
import type { ButtonColor } from '@/shared/types/button'

/**
 * F1 헤더. 레거시 `FireInspectionHeader.vue`.
 *
 * ⚠️ **`NOT_PARTICIPATED`와 기본값이 fall-through로 묶여 있다.** 점검 내역이 아예 없어
 * `submissionStatus`가 `undefined`면 **`점검 기간이 종료되었습니다.`** 가 보인다 —
 * 점검이 한 번도 없던 단지에는 부정확한 문구다 (`fire-inspection.md` F-Q8). 그대로 옮겼다.
 */
const getButtonConfig = (
  status: FireInspectionSubmissionStatus | undefined,
): { text: string; disabled: boolean; color: ButtonColor } => {
  if (status === FIRE_INSPECTION_SUBMISSION_STATUS.NOT_SUBMITTED) {
    return { text: '자가점검 시작하기', disabled: false, color: 'brand' }
  }
  if (status === FIRE_INSPECTION_SUBMISSION_STATUS.SUBMITTED) {
    return { text: '이미 제출이 완료되었습니다.', disabled: true, color: 'defaults-secondary' }
  }
  if (status === FIRE_INSPECTION_SUBMISSION_STATUS.BEFORE_START) {
    return { text: '점검 기간이 아닙니다.', disabled: true, color: 'defaults-secondary' }
  }

  return { text: '점검 기간이 종료되었습니다.', disabled: true, color: 'defaults-secondary' }
}

export const FireInspectionHeader = ({
  submissionStatus,
  onStartInspection,
}: {
  submissionStatus: FireInspectionSubmissionStatus | undefined
  onStartInspection: () => void
}) => {
  const buttonConfig = getButtonConfig(submissionStatus)

  return (
    <div className="flex flex-col gap-4 bg-base-b-white px-5 py-6">
      <div className="flex flex-col gap-2.5">
        <h2 className="pretendard-20SemiBold text-defaults-primary-text-primary">
          {FIRE_INSPECTION_MESSAGE.headerTitle}
          <br />
          {FIRE_INSPECTION_MESSAGE.headerTitleSecond}
        </h2>
        <p className="pretendard-16Medium text-defaults-secondary-text-secondary">
          {FIRE_INSPECTION_MESSAGE.headerDescription}
        </p>
      </div>

      <img
        src="/assets/images/자가점검표/fire-inspection.svg"
        alt="자가점검 아이콘"
        className="w-full rounded-2xl"
      />

      <ButtonBase
        type="button"
        color={buttonConfig.color}
        size="xl"
        disabled={buttonConfig.disabled}
        onClick={onStartInspection}
      >
        {buttonConfig.text}
      </ButtonBase>
    </div>
  )
}
