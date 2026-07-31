import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import { VoteListItem } from '@/features/vote/components/list/VoteListItem'
import { VOTE_MESSAGE } from '@/features/vote/constants/vote'
import type { VoteListItemData } from '@/features/vote/types/vote'
import { SpinnerDots } from '@/shared/components/common/SpinnerDots'
import { TextEmpty } from '@/shared/components/common/TextEmpty'
import { ROUTE_PATH, voteDetailPath } from '@/shared/constants/routes'
import { useInfiniteScrollPosition } from '@/shared/hooks/useInfiniteScrollPosition'
import { useIntersectionObserver } from '@/shared/hooks/useIntersectionObserver'

/**
 * 투표 목록 (VT1). 레거시 `List/VoteList.vue`(80 LOC) 이식.
 *
 * ⚠️ **로딩 중에는 목록 대신 스피너만 보인다.** 필터를 바꿀 때도 목록이 통째로 사라진다 —
 * 레거시가 `v-if/v-else`로 갈라놨다.
 *
 * ⚠️ **스크롤 복원 키를 게시판·주차와 공유한다**(`scrollRestoration`). 상세를 다녀오면
 * 위치가 살아난다.
 *
 * ⚠️ 레거시 `watchEffect`는 `hasVoteListNextPage`(Ref)를 `.value` 없이 검사해 **항상 참**이었다
 * (`vote.md` §7-6). 여기서는 값으로 검사한다 — 마지막 페이지에서 헛요청이 한 번 줄어들 뿐
 * 화면은 같다.
 */
export const VoteList = ({
  list,
  isLoading,
  hasNextPage,
  fetchNextPage,
}: {
  list: VoteListItemData[]
  isLoading: boolean
  hasNextPage: boolean
  fetchNextPage: () => void
}) => {
  const navigate = useNavigate()
  const { targetRef, isIntersecting } = useIntersectionObserver<HTMLDivElement>()
  const { scrollContainerRef } = useInfiniteScrollPosition<HTMLUListElement>({
    rules: { moveFrom: '/detail', moveTo: [ROUTE_PATH.VOTE_LIST] },
  })

  useEffect(() => {
    if (!hasNextPage || !isIntersecting) return

    fetchNextPage()
  }, [hasNextPage, isIntersecting, fetchNextPage])

  return (
    <div className="h-full w-full bg-defaults-primary-background-primary">
      {isLoading ? (
        <SpinnerDots />
      ) : list.length > 0 ? (
        <ul
          ref={scrollContainerRef}
          className="h-full w-full space-y-3 overflow-auto px-5 py-6 pb-14"
        >
          {list.map((item) => {
            return (
              <VoteListItem
                key={item.voteUuid}
                item={item}
                onClick={() => {
                  void navigate(
                    voteDetailPath({ voteUuid: item.voteUuid, voterUuid: item.voterUuid }),
                  )
                }}
              />
            )
          })}
          <div ref={targetRef} className="w-full" />
        </ul>
      ) : (
        <div className="flex h-full items-center justify-center">
          <TextEmpty>{VOTE_MESSAGE.listEmpty}</TextEmpty>
        </div>
      )}
    </div>
  )
}
