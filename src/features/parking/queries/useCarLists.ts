import { useQuery } from '@tanstack/react-query'

import { getAlwaysAllowCarList, getBookmarkCarList } from '@/features/parking/api/carManagement'
import { getVisitPurposeList } from '@/features/parking/api/common'
import {
  ALWAYS_ALLOW_CAR_LIST_QUERY_KEY,
  BOOKMARK_CAR_LIST_QUERY_KEY,
  VISIT_PURPOSE_QUERY_KEY,
} from '@/features/parking/constants/query'
import { useResetListCacheOnMount } from '@/features/parking/hooks/useResetListCacheOnMount'
import type { AlwaysAllowCar, BookmarkCar } from '@/features/parking/types/parking'
import { useInfiniteList } from '@/shared/hooks/useInfiniteList'
import { useAuthStore } from '@/shared/stores/authStore'

/**
 * 즐겨찾기 차량 목록 (PK3 · 불러오기 드로어).
 *
 * ⚠️ **`enabled`가 false여도 캐시는 비운다.** `useResetListCacheOnMount`가 훅 본문에서
 * 돌기 때문이다 — 레거시도 같다. 그래서 PK3에 들어가면 항상허용 캐시까지 날아간다
 * (`CarManagementList`가 두 훅을 모두 호출한다).
 */
export const useBookmarkCarList = ({ enabled }: { enabled: boolean }) => {
  useResetListCacheOnMount({ queryKey: BOOKMARK_CAR_LIST_QUERY_KEY })

  const {
    list: bookmarkCarList,
    isListLoading: isBookmarkCarListLoading,
    isListError: isBookmarkCarListError,
    hasListNextPage: hasBookmarkCarListNextPage,
    fetchListNextPage: fetchBookmarkCarListNextPage,
  } = useInfiniteList<BookmarkCar>({
    queryKey: BOOKMARK_CAR_LIST_QUERY_KEY,
    defaultStoreKey: ['aptResidentUuid'],
    fetchFunction: getBookmarkCarList,
    additionalOptions: { enabled },
  })

  return {
    bookmarkCarList,
    isBookmarkCarListLoading,
    isBookmarkCarListError,
    hasBookmarkCarListNextPage,
    fetchBookmarkCarListNextPage,
  }
}

/** 항상허용 차량 목록 (PK4) */
export const useAlwaysAllowCarList = ({ enabled }: { enabled: boolean }) => {
  useResetListCacheOnMount({ queryKey: ALWAYS_ALLOW_CAR_LIST_QUERY_KEY })

  const {
    list: alwaysAllowCarList,
    isListLoading: isAlwaysAllowCarListLoading,
    isListError: isAlwaysAllowCarListError,
    hasListNextPage: hasAlwaysAllowCarListNextPage,
    fetchListNextPage: fetchAlwaysAllowCarListNextPage,
  } = useInfiniteList<AlwaysAllowCar>({
    queryKey: ALWAYS_ALLOW_CAR_LIST_QUERY_KEY,
    defaultStoreKey: ['aptResidentUuid'],
    fetchFunction: getAlwaysAllowCarList,
    additionalOptions: { enabled },
  })

  return {
    alwaysAllowCarList,
    isAlwaysAllowCarListLoading,
    isAlwaysAllowCarListError,
    hasAlwaysAllowCarListNextPage,
    fetchAlwaysAllowCarListNextPage,
  }
}

/**
 * 방문목적 목록 (PK6 폼).
 *
 * 🔴 **쿼리 키에 `aptUuid`가 없다** — 단지를 바꾸면 첫 프레임에 이전 단지 목록이 보인다.
 * 키 내용은 레거시 그대로 유지한다 (`constants/query.ts` 주석).
 */
export const useVisitPurposeList = () => {
  const aptUuid = useAuthStore((state) => {
    return state.aptInfo.aptUuid
  })

  const {
    data: visitPurposeList,
    isLoading: isVisitPurposeLoading,
    isError: isVisitPurposeError,
  } = useQuery({
    queryKey: VISIT_PURPOSE_QUERY_KEY,
    queryFn: () => {
      return getVisitPurposeList({ aptUuid: aptUuid ?? '' })
    },
  })

  return { visitPurposeList, isVisitPurposeLoading, isVisitPurposeError }
}
