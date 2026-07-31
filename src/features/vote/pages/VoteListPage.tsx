import { useState } from 'react'

import { VoteList } from '@/features/vote/components/list/VoteList'
import { LIST_PAGE_FILTER_LIST } from '@/features/vote/constants/vote'
import { useVoteList } from '@/features/vote/queries/useVote'
import { TabCategory } from '@/shared/components/common/TabCategory'

/**
 * 전자투표 목록 (VT1). 레거시 `VoteView.vue`(28 LOC) 이식.
 *
 * **회원 전용 화면이다** — 목록 API가 `aptResidentUuid`를 요구한다.
 * 비회원(opinion)은 문자로 받은 링크로 상세에 바로 들어간다.
 *
 * ⚠️ **`전체` 탭은 `voteStatus`를 안 보내는 것**이다. 필터 상수에는 3개만 있고
 * `TabCategory`의 `hasTotalType`이 0번 자리에 `전체`를 끼워 넣는다.
 */
export const VoteListPage = () => {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const { voteList, isVoteListLoading, hasVoteListNextPage, fetchVoteListNextPage, setVoteStatus } =
    useVoteList()

  return (
    <div className="h-full">
      <TabCategory
        categories={LIST_PAGE_FILTER_LIST}
        selectedIndex={selectedIndex}
        hasTotalType
        className="pb-4"
        onSelect={({ index, category }) => {
          setSelectedIndex(index)
          setVoteStatus(category.uuid)
        }}
      />
      <VoteList
        list={voteList}
        isLoading={isVoteListLoading}
        hasNextPage={hasVoteListNextPage}
        fetchNextPage={fetchVoteListNextPage}
      />
    </div>
  )
}
