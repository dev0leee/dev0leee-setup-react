import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'

import { getNoticeList } from '@/features/board/api/notice'
import { NOTICE_LIST_QUERY_KEY } from '@/features/board/constants/query'
import type { NoticeListItem } from '@/features/board/types/notice'
import { useInfiniteList } from '@/shared/hooks/useInfiniteList'

/**
 * 검색어·카테고리. **속성 순서가 캐시 키를 바꾼다**(`useInfiniteList` 주석) —
 * 카테고리를 먼저 고르면 `[categoryUuid, keyword]`, 검색을 먼저 하면 `[keyword, categoryUuid]`가
 * 되어 같은 조건도 캐시가 갈린다. 레거시 그대로다 (`board.md` BD-Q5).
 *
 * 팩토리가 `Record<string, unknown>`을 받으므로 인덱스 시그니처를 붙인다.
 */
type NoticeListParams = {
  keyword?: string
  categoryUuid?: string
} & Record<string, unknown>

/**
 * 공지 목록 (B1). 레거시 `useGetNoticeList.js` 이식.
 *
 * ⚠️ **파라미터가 바뀌면 무효화까지 한다.** 파라미터는 이미 캐시 키의 일부라
 * 키가 달라지는 것만으로 새로 조회되는데, 레거시가 `watch`로 무효화를 한 번 더 건다.
 * 결과적으로 **이전 조건의 캐시가 즉시 버려져** 되돌아갔을 때 다시 요청한다.
 * 빼면 캐시 재사용이 생겨 요청 횟수가 달라지므로 그대로 옮겼다.
 *
 * ⚠️ **언마운트 시 `noticeList` 캐시를 통째로 지운다.** 게시판 목록 중 **B1만** 그렇다.
 * 그래서 공지사항은 재진입할 때 항상 처음부터 다시 받는다.
 */
export const useNoticeList = () => {
  const queryClient = useQueryClient()
  const [additionalParams, setAdditionalParams] = useState<NoticeListParams>({})

  const { list, isListLoading, hasListNextPage, fetchListNextPage } =
    useInfiniteList<NoticeListItem>({
      queryKey: NOTICE_LIST_QUERY_KEY,
      defaultStoreKey: ['aptUuid'],
      fetchFunction: getNoticeList,
      additionalParams,
    })

  // 레거시 `watch(additionalParamsRef, ...)`. 초기값에는 반응하지 않아야 하므로
  // 첫 실행을 건너뛴다 — `watch`는 `immediate`가 없으면 변화에만 반응한다.
  const [hasParamsChanged, setHasParamsChanged] = useState(false)

  useEffect(() => {
    if (!hasParamsChanged) return

    void queryClient.invalidateQueries({ queryKey: [NOTICE_LIST_QUERY_KEY] })
  }, [additionalParams, hasParamsChanged, queryClient])

  // 레거시 `onBeforeUnmount`. B1만 캐시를 정리한다.
  useEffect(() => {
    return () => {
      queryClient.removeQueries({ queryKey: [NOTICE_LIST_QUERY_KEY] })
    }
  }, [queryClient])

  /** 레거시 `setAdditionalParams` — 기존 값에 **병합**한다 */
  const updateAdditionalParams = (newParams: NoticeListParams) => {
    setHasParamsChanged(true)
    setAdditionalParams((prev) => {
      return { ...prev, ...newParams }
    })
  }

  return {
    noticeList: list,
    isNoticeListLoading: isListLoading,
    hasNoticeListNextPage: hasListNextPage,
    fetchNoticeListNextPage: fetchListNextPage,
    setAdditionalParams: updateAdditionalParams,
  }
}
