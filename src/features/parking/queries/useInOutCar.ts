import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'

import { getInOutCarDetail, getInOutCarList } from '@/features/parking/api/inOut'
import {
  IN_OUT_CAR_LIST_QUERY_KEY,
  inOutCarDetailQueryKey,
} from '@/features/parking/constants/query'
import { useResetListCacheOnMount } from '@/features/parking/hooks/useResetListCacheOnMount'
import { useReturnFromDetail } from '@/features/parking/hooks/useReturnFromDetail'
import type { InOutCar } from '@/features/parking/types/parking'
import { useInfiniteList } from '@/shared/hooks/useInfiniteList'
import { useAuthStore } from '@/shared/stores/authStore'
import type { YearMonth } from '@/shared/types/drawerMonth'
import { getCurrentMonthRange } from '@/shared/utils/getCurrentMonthRange'

/** 정렬은 항상 최신순이고 토글 UI가 없다. 이 이름은 API가 실제로 받는다 */
const IS_DESC = true

/**
 * 입출차 내역 목록 (PK8). 레거시 `useGetInOutCarList.js` 이식.
 *
 * **상세에서 돌아왔는지에 따라 두 가지가 달라진다**(레거시 동일):
 *
 * | 진입 경로     | 캐시           | `staleTime` |
 * | ------------- | -------------- | ----------- |
 * | 상세에서 복귀 | **비우지 않음** | `Infinity`  |
 * | 그 외         | 비운다         | 기본값(0)   |
 *
 * 둘이 함께 있어야 "상세 다녀와도 목록이 그대로"가 성립한다. 하나만 있으면 페이지가
 * 되감기거나 재조회로 깜빡인다. 판정은 `useReturnFromDetail`이 한다 (PK-Q2 A안).
 *
 * ⚠️ **선택한 달은 훅이 아니라 화면이 소유한다** — 라우터 state에 저장해 상세를 다녀와도
 * 유지해야 하기 때문이다. 훅은 받은 달로 조회만 한다 (`InOutHistoryPage` 주석).
 */
export const useInOutCarList = ({ selectedMonth }: { selectedMonth: YearMonth }) => {
  const { isFromDetail, markLeavingToDetail } = useReturnFromDetail({
    listKey: IN_OUT_CAR_LIST_QUERY_KEY,
  })

  useResetListCacheOnMount({ queryKey: IN_OUT_CAR_LIST_QUERY_KEY, enabled: !isFromDetail })

  const monthRange = getCurrentMonthRange({
    baseDate: new Date(selectedMonth.year, selectedMonth.month - 1),
  })

  const {
    list: inOutCarList,
    isListLoading: isInOutCarListLoading,
    isListError: isInOutCarListError,
    hasListNextPage: hasInOutCarListNextPage,
    fetchListNextPage: fetchInOutCarListNextPage,
    resetCache,
  } = useInfiniteList<InOutCar>({
    queryKey: IN_OUT_CAR_LIST_QUERY_KEY,
    defaultStoreKey: ['aptResidentUuid'],
    fetchFunction: getInOutCarList,
    additionalParams: {
      startDate: `${monthRange.startDate} 00:00:00`,
      endDate: `${monthRange.endDate} 23:59:59`,
      desc: IS_DESC,
    },
    additionalOptions: isFromDetail ? { staleTime: Infinity } : {},
  })

  return {
    inOutCarList,
    isInOutCarListLoading,
    isInOutCarListError,
    hasInOutCarListNextPage,
    fetchInOutCarListNextPage,
    /** 달을 바꿀 때 화면이 부른다 — 이전 달 캐시를 남기지 않는다 */
    resetCache,
    /** 상세로 이동하기 직전에 화면이 부른다. 돌아왔을 때 목록을 되살리는 표시다 */
    markLeavingToDetail,
  }
}

/**
 * 입출차 차량 상세 (PK9). 레거시 `useGetInOutCarDetail.js` 이식.
 *
 * ⚠️ 레거시는 `carUuid` ref를 `onMounted`에서 채우는데 정작 조회에는 `getParams().uuid`를
 * 직접 쓴다. 불필요한 간접이라 옮기지 않았다.
 */
export const useInOutCarDetail = ({ parkingUuid }: { parkingUuid: string | undefined }) => {
  const aptResidentUuid = useAuthStore((state) => {
    return state.aptInfo.aptResidentUuid
  })

  const {
    data: inOutCarDetail,
    isLoading: isInOutCarDetailLoading,
    isError: isInOutCarDetailError,
  } = useQuery({
    queryKey: inOutCarDetailQueryKey({ aptResidentUuid, parkingUuid }),
    queryFn: () => {
      return getInOutCarDetail({
        aptResidentUuid: aptResidentUuid ?? '',
        parkingUuid: parkingUuid ?? '',
      })
    },
    enabled: Boolean(aptResidentUuid) && Boolean(parkingUuid),
  })

  return { inOutCarDetail, isInOutCarDetailLoading, isInOutCarDetailError }
}

/** 지금 달을 `{ year, month }`로. 라우터 state가 없을 때의 기본값이다 */
export const useCurrentYearMonth = () => {
  const [currentYearMonth] = useState<YearMonth>(() => {
    const now = new Date()
    return { year: now.getFullYear(), month: now.getMonth() + 1 }
  })

  return currentYearMonth
}
