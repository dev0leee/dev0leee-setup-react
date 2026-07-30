import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'

import { INFINITE_LIST_PAGE_SIZE } from '@/shared/constants/query'
import type { ApiError } from '@/shared/lib/apiErrors'
import { useAuthStore } from '@/shared/stores/authStore'
import type {
  InfiniteListData,
  PageResponse,
  UseInfiniteListOptions,
} from '@/shared/types/infiniteList'

/**
 * 무한 스크롤 목록 팩토리. 레거시 `lib/queries/common/useInfiniteList.js` 이식.
 *
 * 목록 **18종**이 공유한다(미출차 제외 후). 동작 명세는 `docs/migration/query-keys.md` §2.
 *
 * ⚠️ **`Object.values(additionalParams)`로 캐시 키를 만든다.** 키 이름이 들어가지
 * 않으므로 파라미터 객체의 **속성 순서가 바뀌면 캐시 키가 달라진다.**
 * `04-state.md`는 객체를 통째로 넣으라고 하지만, 바꾸면 캐시 히트/미스가 달라지므로
 * 등가 이관 원칙상 그대로 둔다 (`deferred.md`).
 *
 * ⚠️ **`pageable`은 `pages[0]`에서만 뽑는다.** 마지막 페이지가 아니라 첫 페이지다 —
 * 총 개수는 어느 페이지에서 읽어도 같지만, `empty`·`numberOfElements`는 다르다.
 * 레거시가 그렇게 만들어져 있고 화면들이 그 값에 맞춰져 있다.
 */
export const useInfiniteList = <TItem>({
  queryKey,
  defaultStoreKey,
  fetchFunction,
  additionalParams = {},
  additionalOptions = {},
}: UseInfiniteListOptions<TItem>) => {
  const queryClient = useQueryClient()

  // 단지 컨텍스트를 구독한다. 단지를 바꾸면 키가 달라져 목록이 다시 조회된다.
  const aptInfo = useAuthStore((state) => {
    return state.aptInfo
  })

  const storeValues = defaultStoreKey.map((key) => {
    return aptInfo[key]
  })

  // Vue의 computed 대신 렌더 중 계산한다. useMemo가 필요 없다 — 배열 리터럴이고
  // TanStack Query가 키를 구조적으로 비교한다.
  const computedQueryKey = [queryKey, ...storeValues, ...Object.values(additionalParams)]

  const resetCache = useCallback(() => {
    // 접두사 매칭이다. 파라미터가 다른 같은 목록의 캐시가 전부 지워진다.
    queryClient.removeQueries({ queryKey: [queryKey] })
  }, [queryClient, queryKey])

  const {
    data: list,
    isLoading: isListLoading,
    isError: isListError,
    hasNextPage: hasListNextPage,
    fetchNextPage: fetchListNextPage,
    error,
    // 제네릭을 명시해야 select의 반환 타입(InfiniteListData)이 그대로 살아난다.
    // 생략하면 TanStack이 InfiniteData<PageResponse>로 되돌려 추론한다.
  } = useInfiniteQuery<
    PageResponse<TItem>,
    ApiError,
    InfiniteListData<TItem>,
    readonly unknown[],
    number
  >({
    queryKey: computedQueryKey,
    queryFn: ({ pageParam }) => {
      return fetchFunction({
        ...Object.fromEntries(
          defaultStoreKey.map((key) => {
            return [key, aptInfo[key]]
          }),
        ),
        page: pageParam,
        size: INFINITE_LIST_PAGE_SIZE,
        ...additionalParams,
      })
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage: PageResponse<TItem>, pages) => {
      // `last`가 아니고 **받은 페이지 수가 총 페이지 수보다 적을 때만** 다음이 있다.
      // 두 조건 중 하나만 쓰면 마지막 페이지에서 한 번 더 요청한다.
      if (!lastPage.last && pages.length < lastPage.totalPages) return lastPage.number + 1
      return undefined
    },
    select: (data) => {
      const firstPage = data.pages[0]

      return {
        pages: data.pages.flatMap((page) => {
          return page.content
        }),
        pageParams: firstPage?.number,
        pageable: {
          totalPages: firstPage?.totalPages,
          totalElements: firstPage?.totalElements,
          empty: firstPage?.empty,
          sort: firstPage?.sort,
          numberOfElements: firstPage?.numberOfElements,
        },
      }
    },
    ...additionalOptions,
  })

  return { list, isListLoading, isListError, hasListNextPage, fetchListNextPage, error, resetCache }
}
