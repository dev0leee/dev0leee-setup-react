import { useState } from 'react'

import { BoardPostList } from '@/features/board/components/BoardPostList'
import { MY_ACTIVITY_TABS } from '@/features/board/constants/board'
import { useMyActivityList } from '@/features/board/queries/useBoardPostList'
import { BOARD_TYPE, type BoardType } from '@/features/board/types/post'
import { TabBase } from '@/shared/components/common/TabBase'

/**
 * 내 활동 (B11·B18). 레거시 `MyActivities.vue` + `Community/Complaints MyActivitiesView.vue`
 * 세 파일을 하나로 합쳤다 — 뷰 두 개는 훅을 부르고 그대로 넘기기만 한다.
 *
 * ⚠️ **레거시는 두 목록을 동시에 조회한다.** 탭이 `v-if`라 렌더는 하나뿐이지만
 * 훅은 둘 다 setup에서 호출되므로 요청이 2건 나간다. React도 훅을 조건부로 부를 수
 * 없어 자연히 같다 — 진입 시 `작성한 글`과 `댓글 쓴 글`을 함께 받는다.
 *
 * ⚠️ **AppBar 제목은 라우트가 그린다** — 게시판 목록(B5·B12)과 달리 우측 슬롯이 없다.
 * 여기서는 `민원공간`이 붙어 있다 (게시판 AppBar는 `민원 공간`, §4 #17).
 *
 * ⚠️ 목록 아이템을 누르면 상세로 간다. `BoardPostList`가 `boardType`으로 경로를 만드는데
 * **댓글 쓴 글도 같은 상세로** 간다 — 응답이 글 정보를 주기 때문이다.
 */
export const MyActivitiesPage = ({ boardType }: { boardType: BoardType }) => {
  const [selectedTabIndex, setSelectedTabIndex] = useState(0)

  const posts = useMyActivityList({ boardType, activityType: 'posts' })
  const comments = useMyActivityList({ boardType, activityType: 'comments' })

  const active = selectedTabIndex === 0 ? posts : comments

  return (
    <div className="h-full w-full">
      <TabBase
        tabList={MY_ACTIVITY_TABS.map((tab) => {
          return { label: tab.label, value: tab.value }
        })}
        selectedIndex={selectedTabIndex}
        onSelect={({ index }) => {
          setSelectedTabIndex(index)
        }}
      />

      {!active.isPostListLoading && (
        <BoardPostList
          // 탭을 바꾸면 목록 컴포넌트를 새로 마운트한다 — 레거시가 `key`로 같은 일을 한다.
          // 스크롤 위치·센티널 상태가 탭 사이에 새지 않게 하려는 것이다.
          key={selectedTabIndex}
          list={active.postList?.pages ?? []}
          boardType={boardType}
          hasNextPage={active.hasPostListNextPage}
          fetchNextPage={() => {
            void active.fetchPostListNextPage()
          }}
        />
      )}
    </div>
  )
}

export const CommunityMyActivitiesPage = () => {
  return <MyActivitiesPage boardType={BOARD_TYPE.COMMUNITY} />
}

export const ComplaintsMyActivitiesPage = () => {
  return <MyActivitiesPage boardType={BOARD_TYPE.COMPLAINTS} />
}
