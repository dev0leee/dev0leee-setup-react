import { useQuery } from '@tanstack/react-query'

import { getImposeYearMonths } from '@/features/main/api/main'
import { imposeYearMonthsQueryKey } from '@/features/main/constants/query'
import { useResidentDetailInfo } from '@/shared/hooks/useResidentDetailInfo'
import { useAuthStore } from '@/shared/stores/authStore'

/**
 * 조회 가능한 관리비 년월. 레거시 `useGetManagementFeeImposeYearMonths.js` 이식.
 *
 * ⚠️ 레거시는 `aptInfo.contentList`를 직접 훑어 `'관리비'`를 찾았다. 타깃에서는 같은 판정을
 * 이미 하는 `useResidentDetailInfo`의 플래그를 쓴다 — `hasAptContent`가 `trim()`까지
 * 처리하므로 결과가 더 정확하고, 판정이 한 곳에 모인다.
 */
export const useImposeYearMonths = () => {
  const aptResidentUuid = useAuthStore((state) => {
    return state.aptInfo.aptResidentUuid
  })
  const { hasAptManagementFeeContent } = useResidentDetailInfo()

  const {
    data: imposeYearMonths,
    isLoading: isImposeYearMonthsLoading,
    isError: isImposeYearMonthsError,
  } = useQuery({
    queryKey: imposeYearMonthsQueryKey({ aptResidentUuid }),
    queryFn: () => {
      return getImposeYearMonths({ aptResidentUuid: aptResidentUuid ?? '' })
    },
    enabled: hasAptManagementFeeContent && Boolean(aptResidentUuid),
  })

  return { imposeYearMonths, isImposeYearMonthsLoading, isImposeYearMonthsError }
}
