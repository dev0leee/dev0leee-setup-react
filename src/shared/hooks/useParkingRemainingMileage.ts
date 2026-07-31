import { useQuery } from '@tanstack/react-query'

import { parkingRemainingMileageQueryKey } from '@/shared/constants/query'
import { useResidentDetailInfo } from '@/shared/hooks/useResidentDetailInfo'
import { fetchParkingRemainingMileage } from '@/shared/lib/parkingMileage'
import { useAuthStore } from '@/shared/stores/authStore'
import type { MileageDateRange } from '@/shared/types/parking'
import { getCurrentMonthRange } from '@/shared/utils/getCurrentMonthRange'

/**
 * 주차 마일리지 조회. 레거시 `useGetParkingRemainingMileage.js` 이식.
 *
 * **레거시에서도 한 훅을 메인 카드·주차 관리(PK1)·마일리지 내역(PK2)이 함께 썼다.**
 * 타깃에서는 feature끼리 import할 수 없어 `shared/`에 둔다.
 *
 * ⚠️ **단지 생성일이 조회 시작월보다 뒤면 조회하지 않는다.** 아직 데이터가 없는 신규
 * 단지를 걸러낸다. 레거시 계산식을 그대로 옮겼다 — 같은 해면 월끼리, 다른 해면 연끼리
 * 비교한다(연이 다르면 월을 무시하는 비교라 정밀하지 않지만 그대로 둔다. `parking.md` PK-Q3).
 *
 * ⚠️ **레거시의 주차 구독 검사(`hasManagementFeeContent`)는 동작하지 않는다.**
 * `.value`가 빠진 computed 객체라 항상 truthy다. 그래서 이 훅은 **구독 여부를 보지 않는다** —
 * 판단이 필요한 호출부가 `enabled`로 넘긴다. 주차 화면(PK1·PK2)은 넘기지 않아
 * 레거시와 같이 구독과 무관하게 조회한다 (`deferred.md` D-218).
 *
 * ⚠️ **`setDateRange`를 내보내지 않는다.** 레거시는 훅 안에 기간 상태를 두고
 * `watch`로 부모 값을 밀어 넣었다. 여기서는 **기간을 호출부가 소유**한다 — 결과는 같고
 * 동기화 effect가 사라진다.
 */
export const useParkingRemainingMileage = ({
  dateRange,
  enabled = true,
}: {
  /** 생략하면 이번 달. 메인 카드와 PK1이 그렇다 */
  dateRange?: MileageDateRange
  /** 추가 게이트. 주차 구독 여부처럼 호출부만 아는 조건을 넘긴다 */
  enabled?: boolean
} = {}) => {
  const aptResidentUuid = useAuthStore((state) => {
    return state.aptInfo.aptResidentUuid
  })
  const { residentDetailInfo } = useResidentDetailInfo()

  const { startDate, endDate } = dateRange ?? getCurrentMonthRange()

  const aptCreatedDate = residentDetailInfo?.aptCreatedDate
  const isAptOlderThanStartMonth = (() => {
    if (!aptCreatedDate) return false

    const created = new Date(aptCreatedDate)
    const start = new Date(startDate)

    const compared =
      created.getFullYear() === start.getFullYear()
        ? created.getMonth() - start.getMonth()
        : created.getFullYear() - start.getFullYear()

    return compared <= 0
  })()

  const {
    data: parkingMileage,
    isLoading: isParkingMileageLoading,
    isError: isParkingMileageError,
  } = useQuery({
    queryKey: parkingRemainingMileageQueryKey({ aptResidentUuid, startDate, endDate }),
    queryFn: () => {
      return fetchParkingRemainingMileage({
        aptResidentUuid: aptResidentUuid ?? '',
        startDate: `${startDate} 00:00:00`,
        endDate: `${endDate} 23:59:59`,
      })
    },
    enabled: enabled && isAptOlderThanStartMonth && Boolean(aptResidentUuid),
  })

  return { parkingMileage, isParkingMileageLoading, isParkingMileageError }
}
