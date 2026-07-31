import { MovingHouseDepositInfo } from '@/features/movingHouse/components/MovingHouseDepositInfo'
import { MovingHouseNotice } from '@/features/movingHouse/components/MovingHouseNotice'
import { MovingHouseSummary } from '@/features/movingHouse/components/MovingHouseSummary'
import type {
  MovingHouseDetailData,
  MovingHouseFormData,
} from '@/features/movingHouse/types/movingHouse'
import { SpinnerDots } from '@/shared/components/common/SpinnerDots'

/**
 * MH2·MH4가 공유하는 본문. 레거시 `MovingHouseDetailContainer.vue`.
 *
 * 섹션 사이의 `gap-2` 회색 띠와 안내문 영역의 `px-5 py-5`가 레거시 배치 그대로다.
 *
 * ⚠️ **MH4는 `isLoading`을 넘기지 않는다** — 확인 화면은 이미 폼 데이터를 들고 있다.
 */
export const MovingHouseDetailContainer = ({
  mode,
  detail,
  form,
  isLoading = false,
}: {
  mode: 'detail' | 'confirm'
  detail?: MovingHouseDetailData
  form?: MovingHouseFormData
  isLoading?: boolean
}) => {
  if (isLoading) return <SpinnerDots />

  return (
    <>
      <div className="flex flex-col gap-2 bg-defaults-secondary-background-secondary">
        <MovingHouseSummary mode={mode} detail={detail} form={form} />
        <MovingHouseDepositInfo detail={detail} />
      </div>
      <div className="flex flex-col gap-5 px-5 py-5">
        <MovingHouseNotice detail={detail} />
      </div>
    </>
  )
}
