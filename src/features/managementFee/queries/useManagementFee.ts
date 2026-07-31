import { useQuery } from '@tanstack/react-query'

import {
  getImposeYearMonths,
  getManagementFeeBill,
} from '@/features/managementFee/api/managementFee'
import { APT_CONTENT_NAME } from '@/shared/constants/aptContent'
import { hasAptContent } from '@/shared/lib/aptContext'
import { useAuthStore } from '@/shared/stores/authStore'
import type { YearMonth } from '@/shared/types/drawerMonth'

/**
 * 조회 기간을 만든다.
 *
 * ⚠️ **공백 구분 포맷이다** (`2026-07-01 00:00:00`). ISO `T`가 아니다.
 * `new Date(year, month, 0).getDate()`는 "다음 달 0일" = 이번 달 말일이라 윤년도 정확하다.
 * 말일에 zero-pad가 없지만 항상 2자리(28~31)라 결과는 같다 — 레거시 그대로다.
 */
export const getBillDateRange = ({ year, month }: YearMonth) => {
  const monthText = String(month).padStart(2, '0')
  const lastDay = new Date(year, month, 0).getDate()

  return {
    startDateTime: `${year}-${monthText}-01 00:00:00`,
    endDateTime: `${year}-${monthText}-${lastDay} 23:59:59`,
  }
}

/**
 * 관리비 쿼리 2개. 레거시 `lib/queries/managementFee/*` 이식.
 *
 * ✅ **이 도메인의 훅 위생이 가장 좋다** — 쿼리 키에 `aptResidentUuid`가 둘 다 있고
 * `enabled`도 둘 다 있으며 mutation이 없다.
 *
 * ✅ **`?.`를 붙였다** (MF-Q2). 레거시는 `enabled`에만 옵셔널이 있고 `queryKey`·`queryFn`은
 * `getAptInfo().aptResidentUuid`였다 — **`queryKey`는 `enabled`와 무관하게 평가되므로**
 * `aptInfo`가 비면 훅 호출 시점에 그대로 throw했다.
 */
const useManagementFeeGate = () => {
  const aptInfo = useAuthStore((state) => {
    return state.aptInfo
  })

  return {
    aptResidentUuid: aptInfo.aptResidentUuid ?? '',
    hasManagementFee: hasAptContent({
      contentList: aptInfo.contentList,
      contentName: APT_CONTENT_NAME.MANAGEMENT_FEE,
    }),
  }
}

/** 조회 가능 부과년월 (MF1) */
export const useImposeYearMonths = () => {
  const { aptResidentUuid, hasManagementFee } = useManagementFeeGate()

  const {
    data: imposeYearMonths,
    isLoading: isImposeYearMonthsLoading,
    isError: isImposeYearMonthsError,
  } = useQuery({
    queryKey: ['imposeYearMonths', aptResidentUuid],
    queryFn: async () => {
      const response = await getImposeYearMonths({ aptResidentUuid })

      return response?.imposeYearmonths ?? []
    },
    enabled: hasManagementFee,
  })

  return { imposeYearMonths, isImposeYearMonthsLoading, isImposeYearMonthsError }
}

/**
 * 고지서 (MF1).
 *
 * ⚠️ **레거시가 반환하던 `refetch`는 호출부가 0곳이라 옮기지 않았다** — 에러 화면에
 * 재시도 버튼이 없다.
 */
export const useManagementFeeBill = ({ selected }: { selected: YearMonth | null }) => {
  const { aptResidentUuid } = useManagementFeeGate()

  const dateRange = selected ? getBillDateRange(selected) : null

  const {
    data: managementFeeBill,
    isLoading: isManagementFeeBillLoading,
    isError: isManagementFeeBillError,
  } = useQuery({
    queryKey: ['managementFeeBill', aptResidentUuid, selected?.year, selected?.month],
    queryFn: () => {
      return getManagementFeeBill({
        aptResidentUuid,
        startDateTime: dateRange?.startDateTime ?? '',
        endDateTime: dateRange?.endDateTime ?? '',
      })
    },
    enabled: Boolean(dateRange),
  })

  return { managementFeeBill, isManagementFeeBillLoading, isManagementFeeBillError }
}
