import { COMPLAINT_STATUS } from '@/features/board/types/post'
import { ChipBase } from '@/shared/components/common/ChipBase'

/**
 * 민원 처리 상태 칩. 레거시 `BoardPostStatusChip.vue` 이식.
 *
 * **소통공간에는 나오지 않는다** — 응답에 `status`가 없다.
 * 세 상태의 색·variant 조합이 서로 다르니 표를 그대로 유지한다.
 */
const STATUS_CHIP = {
  [COMPLAINT_STATUS.RECEIVED]: { color: 'lightPurple', variant: 'outline', label: '접수' },
  [COMPLAINT_STATUS.IN_PROGRESS]: { color: 'gray', variant: 'fill', label: '처리중' },
  [COMPLAINT_STATUS.COMPLETED]: { color: 'darkPurple', variant: 'fill', label: '처리완료' },
} as const

export const BoardPostStatusChip = ({ status }: { status: string }) => {
  const chip = STATUS_CHIP[status as keyof typeof STATUS_CHIP] as
    (typeof STATUS_CHIP)[keyof typeof STATUS_CHIP] | undefined

  return (
    <div className="whitespace-nowrap">
      {chip && (
        <ChipBase color={chip.color} variant={chip.variant}>
          {chip.label}
        </ChipBase>
      )}
    </div>
  )
}
