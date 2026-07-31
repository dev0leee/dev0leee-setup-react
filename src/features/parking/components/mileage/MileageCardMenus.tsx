import { MileageCard } from '@/features/parking/components/mileage/MileageCard'
import { SkeletonBase } from '@/shared/components/common/SkeletonBase'
import { useParkingRemainingMileage } from '@/shared/hooks/useParkingRemainingMileage'
import type { MileageDateRange } from '@/shared/types/parking'
import { cn } from '@/shared/utils/cn'
import { formatMinutes } from '@/shared/utils/formatMinutes'

/**
 * 잔여·사용 마일리지 카드 2개 (PK2 상단). 레거시 `MileageCardMenus.vue`(83 LOC) 이식.
 *
 * ⚠️ **에러 시 카드가 2개에서 1개로 줄고 제목도 `주차 마일리지`로 바뀐다.**
 * 레이아웃이 눈에 띄게 달라진다. 레거시 그대로다.
 *
 * ⚠️ **로딩 스켈레톤의 `gap-2`와 실제 카드의 `gap-3`이 다르다.** 전환 시 미세하게 흔들린다.
 *
 * ⚠️ 레거시는 훅이 기간 상태를 들고 `watch`로 부모 값을 밀어 넣었다. 여기서는
 * **기간을 prop으로 받아 그대로 조회한다** — 초기값이 양쪽 다 이번 달이라 결과가 같고
 * 동기화 effect가 사라진다.
 *
 * `className`은 Vue의 클래스 fallthrough를 대신한다 — 호출부가 `pt-3`을 얹는다.
 */
export const MileageCardMenus = ({
  dateRange,
  className,
}: {
  dateRange: MileageDateRange
  className?: string
}) => {
  const { parkingMileage, isParkingMileageLoading, isParkingMileageError } =
    useParkingRemainingMileage({ dateRange })

  if (isParkingMileageLoading) {
    return (
      <div className={cn('flex gap-3', className)}>
        {[0, 1].map((index) => {
          return (
            <div
              key={index}
              className="flex flex-1 flex-col items-start justify-between gap-2 self-stretch rounded-xl bg-white px-4 py-3 shadow-md"
            >
              <SkeletonBase className="h-5 w-32 rounded" />
              <SkeletonBase className="h-6 w-24 rounded" />
            </div>
          )
        })}
      </div>
    )
  }

  if (isParkingMileageError) {
    return (
      <div className={cn('flex h-20 gap-3', className)}>
        <div className="flex flex-1 flex-col items-start justify-between gap-2 self-stretch rounded-xl bg-white px-4 py-3 shadow-md">
          <span className="pretendard-14Bold break-keep text-defaults-secondary-text-secondary">
            주차 마일리지
          </span>
          <span className="pretendard-14Regular text-defaults-secondary-text-secondary">
            정보를 불러올 수 없습니다.
          </span>
        </div>
      </div>
    )
  }

  const remaining = formatMinutes(parkingMileage?.remainingMileage)
  const used = formatMinutes(parkingMileage?.useMileage)

  return (
    <div className={cn('flex gap-3', className)}>
      <MileageCard title="잔여 주차 마일리지" hours={remaining.hours} minutes={remaining.minutes} />
      <MileageCard title="사용한 주차 마일리지" hours={used.hours} minutes={used.minutes} />
    </div>
  )
}
