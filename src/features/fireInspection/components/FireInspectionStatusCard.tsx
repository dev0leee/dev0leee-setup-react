import { useNavigate } from 'react-router-dom'

import {
  FIRE_INSPECTION_SUBMISSION_STATUS,
  type FireInspectionStatusData,
  type FireInspectionSubmissionStatus,
} from '@/features/fireInspection/types/fireInspection'
import { ChipBase } from '@/shared/components/common/ChipBase'
import { fireInspectionDetailPath } from '@/shared/constants/routes'
import type { ChipColor } from '@/shared/types/chip'
import { cn } from '@/shared/utils/cn'
import { formatIsoStringDate } from '@/shared/utils/formatIsoStringDate'

/**
 * 점검 내역 카드 (F1). 레거시 `FireInspectionStatusCard.vue`.
 *
 * ⚠️ **`SUBMITTED`인 카드만 클릭된다.** 나머지는 커서도 바뀌지 않고 반응도 없다.
 *
 * ⚠️ **칩 배경을 `!bg-*-primary`로 덮어 기본보다 연하게 만든다** — `ChipBase`의
 * `green`/`red` fill 기본이 `-secondary`인데 호출부가 `-primary`로 바꾼다.
 * `ChipBase`를 고치지 않고 `!important`로 덮는 레거시 패턴을 그대로 옮겼다.
 *
 * ⚠️ **날짜 포맷이 섞여 있다** — 기간·시작일은 `dotDate()`(`2026.07.01`), 제출일만
 * `date()`(`2026-07-01`)다. 각각 그대로 옮겼다.
 */
const getStatusConfig = (
  status: FireInspectionSubmissionStatus | undefined,
): { color: ChipColor; text: string; className?: string } => {
  if (status === FIRE_INSPECTION_SUBMISSION_STATUS.SUBMITTED) {
    return {
      color: 'green',
      text: '점검완료',
      className: '!bg-alerts-success-background-success-primary',
    }
  }
  if (status === FIRE_INSPECTION_SUBMISSION_STATUS.NOT_SUBMITTED) {
    return {
      color: 'red',
      text: '점검필요',
      className: '!bg-alerts-error-background-error-primary',
    }
  }
  if (status === FIRE_INSPECTION_SUBMISSION_STATUS.BEFORE_START) {
    return { color: 'gray', text: '점검예정' }
  }
  if (status === FIRE_INSPECTION_SUBMISSION_STATUS.NOT_PARTICIPATED) {
    return { color: 'darkGray', text: '미참여' }
  }

  return { color: 'gray', text: '' }
}

const getStatusMessage = (inspection: FireInspectionStatusData): string => {
  const { submissionStatus, submissionDateTime, startDate } = inspection

  if (submissionStatus === FIRE_INSPECTION_SUBMISSION_STATUS.SUBMITTED) {
    return `제출 날짜 : ${formatIsoStringDate({ dateTimeString: submissionDateTime }).date()}`
  }
  if (submissionStatus === FIRE_INSPECTION_SUBMISSION_STATUS.NOT_SUBMITTED) {
    return '자가점검을 진행해주세요.'
  }
  if (submissionStatus === FIRE_INSPECTION_SUBMISSION_STATUS.BEFORE_START) {
    return `점검 시작일 : ${formatIsoStringDate({ dateTimeString: startDate }).dotDate()}`
  }
  if (submissionStatus === FIRE_INSPECTION_SUBMISSION_STATUS.NOT_PARTICIPATED) {
    return '점검 기간이 종료되었습니다.'
  }

  return ''
}

export const FireInspectionStatusCard = ({
  inspection,
}: {
  inspection: FireInspectionStatusData
}) => {
  const navigate = useNavigate()

  const statusConfig = getStatusConfig(inspection.submissionStatus)
  const isSubmitted = inspection.submissionStatus === FIRE_INSPECTION_SUBMISSION_STATUS.SUBMITTED

  const displayPeriod = `${formatIsoStringDate({ dateTimeString: inspection.startDate }).dotDate()} ~ ${formatIsoStringDate({ dateTimeString: inspection.endDate }).dotDate()}`

  return (
    <li
      className={cn(
        'overflow-hidden rounded-xl border border-defaults-tertiary-border-tertiary',
        isSubmitted && 'cursor-pointer',
      )}
      onClick={() => {
        if (!isSubmitted || !inspection.householdFireInspectionUuid) return

        void navigate(
          fireInspectionDetailPath({
            fireInspectionUuid: inspection.fireInspectionUuid,
            householdFireInspectionUuid: inspection.householdFireInspectionUuid,
          }),
        )
      }}
    >
      <div className="flex flex-col gap-1.5 px-4 py-3.5">
        <div className="flex items-center gap-2">
          <span className="pretendard-18SemiBold text-defaults-primary-text-primary">
            {displayPeriod}
          </span>
          <ChipBase color={statusConfig.color} variant="fill" className={statusConfig.className}>
            {statusConfig.text}
          </ChipBase>
        </div>
        <span className="pretendard-13Medium text-defaults-secondary-text-secondary">
          {getStatusMessage(inspection)}
        </span>
      </div>
    </li>
  )
}
