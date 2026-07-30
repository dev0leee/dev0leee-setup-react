import { useQuery } from '@tanstack/react-query'

import { getParkingRemainingMileage } from '@/features/main/api/main'
import { parkingMileageQueryKey } from '@/features/main/constants/query'
import { useResidentDetailInfo } from '@/shared/hooks/useResidentDetailInfo'
import { useAuthStore } from '@/shared/stores/authStore'
import { getCurrentMonthRange } from '@/shared/utils/getCurrentMonthRange'

/**
 * 이번 달 주차 마일리지. 레거시 `useGetParkingRemainingMileage.js` 이식.
 *
 * ⚠️ **단지 생성일이 이번 달보다 뒤면 조회하지 않는다.** 아직 데이터가 없는 신규 단지를
 * 걸러내는 조건이다. 레거시 계산식을 그대로 옮겼다 — 같은 해면 월끼리, 다른 해면 연끼리
 * 비교한다(월을 무시하는 비교라 정밀하지 않지만 그대로 둔다).
 *
 * ⚠️ **레거시의 주차 구독 검사는 동작하지 않는다.** `comparedDate <= 0 && hasManagementFeeContent`
 * 에서 `hasManagementFeeContent`가 `.value` 없는 **ref 객체**라 항상 truthy다. 즉 주차를
 * 구독하지 않아도 조회한다. 이관본은 **플래그를 제대로 본다** — 카드 자체가 주차 구독일
 * 때만 렌더되므로 화면 결과는 같고, 불필요한 요청만 사라진다 (`deferred.md` D-218).
 *
 * ⚠️ 레거시는 이 훅에서 `setDateRange`도 내보냈지만 **메인 카드는 쓰지 않는다**(항상 이번 달).
 * 기간 선택은 주차 마일리지 내역 화면의 몫이라 옮기지 않았다.
 */
export const useParkingMileage = () => {
  const aptResidentUuid = useAuthStore((state) => {
    return state.aptInfo.aptResidentUuid
  })
  const { residentDetailInfo, hasAptParkingContent } = useResidentDetailInfo()

  const { startDate, endDate } = getCurrentMonthRange()

  const aptCreatedDate = residentDetailInfo?.aptCreatedDate
  const isAptOlderThanThisMonth = (() => {
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
    queryKey: parkingMileageQueryKey({ aptResidentUuid, startDate, endDate }),
    queryFn: () => {
      return getParkingRemainingMileage({
        aptResidentUuid: aptResidentUuid ?? '',
        startDate: `${startDate} 00:00:00`,
        endDate: `${endDate} 23:59:59`,
      })
    },
    enabled: isAptOlderThanThisMonth && hasAptParkingContent && Boolean(aptResidentUuid),
  })

  return { parkingMileage, isParkingMileageLoading, isParkingMileageError }
}
