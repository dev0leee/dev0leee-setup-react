import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'

import { getGlobalNoticeList } from '@/features/board/api/notice'
import { GLOBAL_NOTICE_LIST_QUERY_KEY } from '@/features/board/constants/query'
import type { GlobalNoticeListItem } from '@/features/board/types/notice'
import { useInfiniteList } from '@/shared/hooks/useInfiniteList'

/**
 * 아파트먼트 공지 목록 (B3). 레거시 `useGetGlobalNoticeList.js` 이식.
 *
 * B1과 달리 **카테고리 필터가 없고**(검색어뿐) **언마운트 시 캐시를 지우지 않는다.**
 * 그래서 재진입하면 이전 목록이 그대로 보이다가 갱신된다.
 */
export const useGlobalNoticeList = () => {
  const queryClient = useQueryClient()
  const [additionalParams, setAdditionalParams] = useState<{ keyword?: string }>({})
  const [hasParamsChanged, setHasParamsChanged] = useState(false)

  const { list, isListLoading, hasListNextPage, fetchListNextPage } =
    useInfiniteList<GlobalNoticeListItem>({
      queryKey: GLOBAL_NOTICE_LIST_QUERY_KEY,
      defaultStoreKey: ['aptResidentUuid'],
      fetchFunction: getGlobalNoticeList,
      additionalParams,
    })

  useEffect(() => {
    if (!hasParamsChanged) return

    void queryClient.invalidateQueries({ queryKey: [GLOBAL_NOTICE_LIST_QUERY_KEY] })
  }, [additionalParams, hasParamsChanged, queryClient])

  const updateAdditionalParams = (newParams: { keyword?: string }) => {
    setHasParamsChanged(true)
    setAdditionalParams((prev) => {
      return { ...prev, ...newParams }
    })
  }

  return {
    globalNoticeList: list,
    isGlobalNoticeListLoading: isListLoading,
    hasGlobalNoticeListNextPage: hasListNextPage,
    fetchGlobalNoticeListNextPage: fetchListNextPage,
    setAdditionalParams: updateAdditionalParams,
  }
}
