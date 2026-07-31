import { useQuery } from '@tanstack/react-query'

import { getParkingPolicy } from '@/features/parking/api/common'
import { parkingPolicyQueryKey } from '@/features/parking/constants/query'
import { useAuthStore } from '@/shared/stores/authStore'
import { getCurrentMonthRange } from '@/shared/utils/getCurrentMonthRange'

/**
 * 우리 아파트 주차 정책 (PK1 드로어). 레거시 `useGetParkingPolicy.js` 이식.
 *
 * ⚠️ **레거시는 드로어를 `v-if`로 붙였다 떼며 조회 시점을 맞춘다.** 타깃은 드로어를
 * 계속 마운트해 두고(슬라이드업 전환이 살아 있어야 한다) `enabled`로 같은 시점을 만든다 —
 * **열 때 요청하고, 닫았다 다시 열면 다시 요청한다**(전역 `staleTime: 0`).
 *
 * ⚠️ 기준월은 **이번 달 1일 고정**이다. `getCurrentMonthRange().startDate`가 곧 그 값이다.
 */
export const useParkingPolicy = ({ enabled }: { enabled: boolean }) => {
  const aptResidentUuid = useAuthStore((state) => {
    return state.aptInfo.aptResidentUuid
  })

  const { startDate: currentMonthFirstDay } = getCurrentMonthRange()

  const {
    data: parkingPolicy,
    isLoading: isParkingPolicyLoading,
    isError: isParkingPolicyError,
  } = useQuery({
    queryKey: parkingPolicyQueryKey({ aptResidentUuid }),
    queryFn: () => {
      return getParkingPolicy({
        aptResidentUuid: aptResidentUuid ?? '',
        yearMonthDate: currentMonthFirstDay,
      })
    },
    enabled: enabled && Boolean(aptResidentUuid),
  })

  return { parkingPolicy, isParkingPolicyLoading, isParkingPolicyError }
}
