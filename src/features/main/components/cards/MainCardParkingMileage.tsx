import { useNavigate } from 'react-router-dom'

import { MainCardParkingMileageChart } from '@/features/main/components/cards/MainCardParkingMileageChart'
import { useParkingMileage } from '@/features/main/queries/useParkingMileage'
import type { MainCardProps } from '@/features/main/types/card'
import { SkeletonBase } from '@/shared/components/common/SkeletonBase'
import { ROUTE_PATH } from '@/shared/constants/routes'
import { cn } from '@/shared/utils/cn'
import { formatMinutes } from '@/shared/utils/formatMinutes'

/**
 * 주차 마일리지 카드. 레거시 `MainCardParkingMileage.vue` 이식.
 *
 * ⚠️ **전체 시간의 `분`은 0보다 클 때만 보인다** (`3시간` vs `3시간 20분`).
 * 잔여 시간은 0분이어도 항상 보인다 — 비대칭이지만 레거시 그대로다.
 *
 * ⚠️ **에러 상태도 `<button>`인데 클릭 핸들러가 없다.** 레거시가 그렇게 뒀다 —
 * 눌러도 아무 일이 없다.
 *
 * ⚠️ `layoutType`을 받지만 **쓰지 않는다.** 레거시도 prop만 선언하고 템플릿에서 참조하지
 * 않는다(마일리지 카드는 항상 같은 배치다). 그리드가 넘겨주므로 시그니처는 맞춘다.
 */
export const MainCardParkingMileage = ({ className }: MainCardProps) => {
  const navigate = useNavigate()
  const { parkingMileage, isParkingMileageLoading, isParkingMileageError } = useParkingMileage()

  const title = (
    <h2 className="text-left pretendard-13Medium break-keep text-defaults-secondary-text-secondary">
      잔여 주차 마일리지
    </h2>
  )

  if (isParkingMileageLoading) {
    return (
      <div className={cn('flex justify-between overflow-hidden', className)}>
        <div className="flex flex-col justify-between gap-4">
          {title}
          <div className="flex flex-col items-start gap-1">
            <SkeletonBase className="h-6 w-32 rounded" />
            <SkeletonBase className="h-4 w-20 rounded" />
          </div>
        </div>
        <SkeletonBase className="h-16 w-16 rounded-full" />
      </div>
    )
  }

  if (isParkingMileageError) {
    return (
      <button
        type="button"
        className={cn(
          'flex flex-col justify-between gap-4 overflow-hidden text-left text-defaults-secondary-text-secondary',
          className,
        )}
      >
        <h2 className="pretendard-13Medium break-keep">잔여 주차 마일리지</h2>
        <p className="pretendard-13Regular">주차 마일리지를 불러올 수 없습니다.</p>
      </button>
    )
  }

  const remaining = formatMinutes(parkingMileage?.remainingMileage)
  const total = formatMinutes(parkingMileage?.totalMileage)

  return (
    <button
      type="button"
      className={cn('flex cursor-pointer justify-between overflow-hidden', className)}
      onClick={() => {
        void navigate(ROUTE_PATH.PARKING_MILEAGE_HISTORY)
      }}
    >
      <div className="flex flex-col justify-between gap-4">
        {title}
        <div className="flex flex-col items-start">
          <div className="flex flex-wrap items-baseline gap-x-1 text-left pretendard-18SemiBold">
            <span>{remaining.hours}시간</span>
            <span>{remaining.minutes}분</span>
          </div>
          <div className="space-x-1 text-left pretendard-12Regular text-defaults-tertiary-text-tertiary">
            <span>/ {total.hours}시간</span>
            {total.minutes > 0 && <span>{total.minutes}분</span>}
          </div>
        </div>
      </div>
      <MainCardParkingMileageChart
        total={parkingMileage?.totalMileage}
        remaining={parkingMileage?.remainingMileage}
      />
    </button>
  )
}
