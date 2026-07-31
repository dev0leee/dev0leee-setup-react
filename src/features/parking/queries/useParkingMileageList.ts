import { useState } from 'react'

import { getParkingMileageList } from '@/features/parking/api/mileage'
import { PARKING_MILEAGE_LIST_QUERY_KEY } from '@/features/parking/constants/query'
import { useResetListCacheOnMount } from '@/features/parking/hooks/useResetListCacheOnMount'
import type { MileageHistoryItem } from '@/features/parking/types/parking'
import { useInfiniteList } from '@/shared/hooks/useInfiniteList'
import type { YearMonth } from '@/shared/types/drawerMonth'
import { getCurrentMonthRange } from '@/shared/utils/getCurrentMonthRange'

/**
 * 🔴 화면에 정렬 토글이 없어 항상 `true`로 고정이다. 그리고 **서버에 닿지도 않는다** —
 * API 함수가 받는 이름은 `isDesc`다 (`api/mileage.ts` 주석). 레거시 그대로 남겨둔다.
 */
const IS_LATEST = true

/** 지금 달을 `{ year, month }`로 */
const getCurrentYearMonth = (): YearMonth => {
  const now = new Date()
  return { year: now.getFullYear(), month: now.getMonth() + 1 }
}

/**
 * 마일리지 사용 내역 목록 (PK2). 레거시 `useGetParkingMileageList.js` 이식.
 *
 * **선택한 달을 훅이 소유한다.** 레거시는 화면이 `selectedMonthRange`를, 훅이
 * `additionalParams`를 따로 들고 `setAdditionalParams`로 맞췄다. 한쪽으로 모으면
 * 두 상태가 어긋날 여지가 사라지고 화면 결과는 같다.
 *
 * ⚠️ **`additionalParams`의 속성 순서가 캐시 키를 바꾼다** (`useInfiniteList` 주석).
 * `startDate` → `endDate` → `isLatest` 순서를 레거시 그대로 유지한다.
 *
 * ⚠️ **월을 바꾸면 캐시를 비우고 page 0부터 다시 받는다.** 키가 어차피 달라지지만
 * 레거시가 `resetCache()`도 함께 부르므로 같이 부른다 — 이전 달 캐시가 남지 않는다.
 *
 * ⚠️ **PK8·PK11과 달리 선택한 달을 히스토리에 저장하지 않는다.** 화면을 나갔다 오면
 * 항상 이번 달이다. 도메인 안에서 비대칭이지만 레거시 그대로다 (`deferred.md`).
 */
export const useParkingMileageList = () => {
  useResetListCacheOnMount({ queryKey: PARKING_MILEAGE_LIST_QUERY_KEY })

  const [selectedMonth, setSelectedMonth] = useState<YearMonth>(getCurrentYearMonth)

  const selectedMonthRange = getCurrentMonthRange({
    baseDate: new Date(selectedMonth.year, selectedMonth.month - 1),
  })

  const {
    list: parkingMileageList,
    isListLoading: isParkingMileageListLoading,
    isListError: isParkingMileageListError,
    hasListNextPage: hasParkingMileageListNextPage,
    fetchListNextPage: fetchParkingMileageListNextPage,
    resetCache,
  } = useInfiniteList<MileageHistoryItem>({
    queryKey: PARKING_MILEAGE_LIST_QUERY_KEY,
    defaultStoreKey: ['aptResidentUuid'],
    fetchFunction: getParkingMileageList,
    additionalParams: {
      startDate: `${selectedMonthRange.startDate} 00:00:00`,
      endDate: `${selectedMonthRange.endDate} 23:59:59`,
      isLatest: IS_LATEST,
    },
  })

  const changeMonth = (yearMonth: YearMonth) => {
    resetCache()
    setSelectedMonth(yearMonth)
  }

  return {
    parkingMileageList,
    isParkingMileageListLoading,
    isParkingMileageListError,
    hasParkingMileageListNextPage,
    fetchParkingMileageListNextPage,
    selectedMonth,
    selectedMonthRange,
    changeMonth,
  }
}
