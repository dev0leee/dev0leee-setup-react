import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'

import {
  getBoardCategoryList,
  getBoardPostList,
  getMyActivityList,
} from '@/features/board/api/post'
import {
  BOARD_POST_LIST_QUERY_KEY,
  boardCategoryListQueryKey,
  MY_ACTIVITY_QUERY_KEY,
} from '@/features/board/constants/query'
import type { BoardPostListItemData, BoardType } from '@/features/board/types/post'
import { useInfiniteList } from '@/shared/hooks/useInfiniteList'
import { useAuthStore } from '@/shared/stores/authStore'

/** 검색어·카테고리. **속성 순서가 캐시 키를 바꾼다** (`useInfiniteList` 주석) */
type BoardPostListParams = {
  keyword?: string
  categoryUuid?: string
} & Record<string, unknown>

/** 게시판 카테고리 목록. 레거시 `useGetCommunityCategoryList` / `...Complaints...` */
export const useBoardCategoryList = ({ boardType }: { boardType: BoardType }) => {
  const aptResidentUuid = useAuthStore((state) => {
    return state.aptInfo.aptResidentUuid
  })

  const { data: categoryList, isLoading: isCategoryListLoading } = useQuery({
    queryKey: boardCategoryListQueryKey({ boardType, aptResidentUuid }),
    queryFn: () => {
      return getBoardCategoryList({ boardType, aptResidentUuid: aptResidentUuid ?? '' })
    },
  })

  return { categoryList, isCategoryListLoading }
}

/**
 * 게시글 목록 (B5·B12). 레거시 `useGetCommunityPostList` / `useGetComplaintsPostList` 이식.
 *
 * ⚠️ **B1(공지)과 달리 언마운트 시 캐시를 정리하지 않는다.** 화면을 떠나도 캐시가 남아
 * 재진입하면 이전 결과가 한 프레임 보였다가 갱신된다. 필터(`additionalParams`)는 훅
 * 로컬 상태라 초기화된다 — **캐시만 남고 조건은 초기화되는 비대칭**이다. 레거시 그대로다.
 */
export const useBoardPostList = ({ boardType }: { boardType: BoardType }) => {
  const queryClient = useQueryClient()
  const [additionalParams, setAdditionalParams] = useState<BoardPostListParams>({})
  const [hasParamsChanged, setHasParamsChanged] = useState(false)

  const queryKey = BOARD_POST_LIST_QUERY_KEY[boardType]

  const { list, isListLoading, hasListNextPage, fetchListNextPage } =
    useInfiniteList<BoardPostListItemData>({
      queryKey,
      defaultStoreKey: ['aptResidentUuid'],
      fetchFunction: getBoardPostList({ boardType }),
      additionalParams,
    })

  useEffect(() => {
    if (!hasParamsChanged) return

    void queryClient.invalidateQueries({ queryKey: [queryKey] })
  }, [additionalParams, hasParamsChanged, queryClient, queryKey])

  const updateAdditionalParams = (newParams: BoardPostListParams) => {
    setHasParamsChanged(true)
    setAdditionalParams((prev) => {
      return { ...prev, ...newParams }
    })
  }

  return {
    postList: list,
    isPostListLoading: isListLoading,
    hasPostListNextPage: hasListNextPage,
    fetchPostListNextPage: fetchListNextPage,
    setAdditionalParams: updateAdditionalParams,
  }
}

/**
 * 내 활동 목록 (B11·B18). 레거시 `useGetCommunityMyActivityPostList` 등 4개 이식.
 *
 * ⚠️ 레거시 뷰는 훅 반환값을 `watch`로 ref에 담아 넘겼지만, 반환 객체의 참조가 고정이라
 * `immediate` 1회 외에는 발화하지 않았다. **아무 일도 하지 않는 코드**라 옮기지 않았다
 * (`board.md` §5-10 — 렌더 결과가 같으므로 등가 이관 위반이 아니다).
 */
export const useMyActivityList = ({
  boardType,
  activityType,
}: {
  boardType: BoardType
  activityType: 'posts' | 'comments'
}) => {
  const { list, isListLoading, hasListNextPage, fetchListNextPage } =
    useInfiniteList<BoardPostListItemData>({
      queryKey: MY_ACTIVITY_QUERY_KEY[boardType][activityType],
      defaultStoreKey: ['aptResidentUuid'],
      fetchFunction: getMyActivityList({ boardType, activityType }),
    })

  return {
    postList: list,
    isPostListLoading: isListLoading,
    hasPostListNextPage: hasListNextPage,
    fetchPostListNextPage: fetchListNextPage,
  }
}
