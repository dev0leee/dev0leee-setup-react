import { useQuery } from '@tanstack/react-query'

import { getManagementFeeBill } from '@/features/main/api/main'
import { managementFeeBillQueryKey } from '@/features/main/constants/query'
import { useAuthStore } from '@/shared/stores/authStore'

/**
 * 선택한 년월의 관리비 고지서. 레거시 `useGetManagementFeeBill.js` 이식.
 *
 * 서버가 기간으로 받으므로 년·월을 **그 달의 첫 순간 ~ 마지막 순간**으로 펼친다.
 * `new Date(year, month, 0)`이 그 달의 말일이다(month가 1-based로 들어오므로 다음 달 0일).
 */
export const useManagementFeeBill = ({
  year,
  month,
}: {
  year: number | null
  month: number | null
}) => {
  const aptResidentUuid = useAuthStore((state) => {
    return state.aptInfo.aptResidentUuid
  })

  const hasSelectedMonth = Boolean(year && month)

  const {
    data: managementFeeBill,
    isLoading: isManagementFeeBillLoading,
    isError: isManagementFeeBillError,
  } = useQuery({
    queryKey: managementFeeBillQueryKey({ aptResidentUuid, year, month }),
    queryFn: () => {
      const monthText = String(month).padStart(2, '0')
      const lastDay = new Date(Number(year), Number(month), 0).getDate()

      return getManagementFeeBill({
        aptResidentUuid: aptResidentUuid ?? '',
        startDateTime: `${String(year)}-${monthText}-01 00:00:00`,
        endDateTime: `${String(year)}-${monthText}-${String(lastDay)} 23:59:59`,
      })
    },
    enabled: hasSelectedMonth && Boolean(aptResidentUuid),
  })

  return { managementFeeBill, isManagementFeeBillLoading, isManagementFeeBillError }
}
