import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import { BoardPostListItem } from '@/features/board/components/BoardPostListItem'
import { BOARD_EMPTY_TEXT } from '@/features/board/constants/board'
import { BOARD_TYPE, type BoardPostListItemData, type BoardType } from '@/features/board/types/post'
import { TextEmpty } from '@/shared/components/common/TextEmpty'
import { ROUTE_PATH } from '@/shared/constants/routes'
import { useInfiniteScrollPosition } from '@/shared/hooks/useInfiniteScrollPosition'
import { useIntersectionObserver } from '@/shared/hooks/useIntersectionObserver'

/**
 * 게시글 목록 컨테이너. 레거시 `BoardPostList.vue` 이식 (B5·B12·B11·B18 공용).
 *
 * ⚠️ **로딩 스피너를 넣지 않았다.** 레거시에 `SpinnerDots`가 있지만 호출부가
 * `v-if="!isLoading"`으로 이 컴포넌트를 감싸서 **렌더될 조건이 없다** — B3와 같은 구조다.
 * 밖으로 꺼내면 없던 로딩 표시가 생긴다 (`board.md` §B5).
 *
 * ⚠️ **`h-[calc(100%-36px)]`의 36px 근거가 코드에 없다.** 내 활동(B11·B18)에서는 위에
 * 탭(48px)이 있어 값이 맞지도 않는다. 그대로 옮긴다.
 */
export const BoardPostList = ({
  list,
  boardType,
  hasNextPage,
  fetchNextPage,
  searchKeyword = '',
}: {
  list: BoardPostListItemData[]
  boardType: BoardType
  hasNextPage: boolean
  fetchNextPage: () => void
  searchKeyword?: string
}) => {
  const navigate = useNavigate()
  const { targetRef, isIntersecting } = useIntersectionObserver<HTMLDivElement>()
  const { scrollContainerRef } = useInfiniteScrollPosition<HTMLUListElement>({
    rules: {
      moveFrom: '/detail',
      moveTo: [ROUTE_PATH.BOARD_COMMUNITY, ROUTE_PATH.BOARD_COMPLAINTS],
    },
  })

  useEffect(() => {
    if (!hasNextPage || !isIntersecting) return

    fetchNextPage()
  }, [hasNextPage, isIntersecting, fetchNextPage])

  /** 글 식별자 필드 이름이 게시판마다 다르다 (`board.md` §4 #2) */
  const getPostUuid = (post: BoardPostListItemData) => {
    return boardType === BOARD_TYPE.COMMUNITY ? post.communityUuid : post.complaintUuid
  }

  if (list.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <TextEmpty>{BOARD_EMPTY_TEXT.POST}</TextEmpty>
      </div>
    )
  }

  return (
    <div className="h-full w-full">
      <ul
        ref={scrollContainerRef}
        className="h-[calc(100%-36px)] w-full space-y-2.5 overflow-auto p-5"
      >
        {list.map((post) => {
          const uuid = getPostUuid(post)

          return (
            <BoardPostListItem
              key={uuid}
              postItemData={post}
              boardType={boardType}
              searchKeyword={searchKeyword}
              onSelect={() => {
                void navigate(`/board/${boardType}/detail/${uuid ?? ''}`)
              }}
            />
          )
        })}
        {/* 센티널. B1·B3와 달리 `pt-4`가 없다 */}
        <div ref={targetRef} className="w-full" />
      </ul>
    </div>
  )
}
