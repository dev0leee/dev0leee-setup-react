import { getRegularCarList } from '@/features/parking/api/regular'
import { REGULAR_CAR_LIST_QUERY_KEY } from '@/features/parking/constants/query'
import { useResetListCacheOnMount } from '@/features/parking/hooks/useResetListCacheOnMount'
import type { RegularCar } from '@/features/parking/types/parking'
import { useInfiniteList } from '@/shared/hooks/useInfiniteList'

/**
 * 정기권 차량 목록 (PK15 · PK1 임베드). 레거시 `useGetRegularCarList.js` 이식.
 *
 * 조회 조건이 없어 `additionalParams`가 비어 있다 — `page`·`size`만 보낸다.
 */
export const useRegularCarList = () => {
  useResetListCacheOnMount({ queryKey: REGULAR_CAR_LIST_QUERY_KEY })

  const {
    list: regularCarList,
    isListLoading: isRegularCarListLoading,
    isListError: isRegularCarListError,
    hasListNextPage: hasRegularCarListNextPage,
    fetchListNextPage: fetchRegularCarListNextPage,
  } = useInfiniteList<RegularCar>({
    queryKey: REGULAR_CAR_LIST_QUERY_KEY,
    defaultStoreKey: ['aptResidentUuid'],
    fetchFunction: getRegularCarList,
  })

  return {
    regularCarList,
    isRegularCarListLoading,
    isRegularCarListError,
    hasRegularCarListNextPage,
    fetchRegularCarListNextPage,
  }
}
