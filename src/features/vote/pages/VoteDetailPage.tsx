import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { env } from '@/config/env'
import { VoteDetailButton } from '@/features/vote/components/detail/VoteDetailButton'
import { VoteDetailInfo } from '@/features/vote/components/detail/VoteDetailInfo'
import { VoteDetailStatus } from '@/features/vote/components/detail/VoteDetailStatus'
import { VoteDetailTitle } from '@/features/vote/components/detail/VoteDetailTitle'
import { DETAIL_PAGE_TAB_LIST } from '@/features/vote/constants/vote'
import { useIsVoteUser } from '@/features/vote/lib/voteRoute'
import { useVoteDetailInfo } from '@/features/vote/queries/useVote'
import { VOTE_STATE } from '@/features/vote/types/vote'
import { TabBase } from '@/shared/components/common/TabBase'
import { ROUTE_PATH } from '@/shared/constants/routes'
import { useVoteCertStore } from '@/shared/stores/voteCertStore'

/**
 * 전자투표 개요 (VT2 회원 · VT7 비회원). 레거시 `Detail/VoteDetailView.vue`(93 LOC) 이식.
 *
 * **한 컴포넌트가 두 경로에 걸린다** — 회원은 `/vote/detail/{voteUuid}/{voterUuid}`,
 * 비회원은 `/vote/{voterUuid}`다. 비회원 경로에는 `voteUuid`가 없어서 `투표 현황` 탭의
 * 회원 전용 API를 부를 수 없는데, 애초에 비회원은 그 탭에 닿지 않는다(아래 참조).
 *
 * ⚠️ **비회원이면서 시작전/종료면 전용 화면으로 튕겨낸다.** 회원은 여기 머물며
 * 비활성 버튼을 본다 — 같은 데이터에 대한 화면이 앱에 따라 갈린다.
 *
 * ⚠️ **시작 전에는 `투표 현황` 탭이 아예 없다.** 레거시는 탭 목록이 바뀔 때 `key`를
 * 올려 `TabBase`를 재마운트해 인디케이터를 0번으로 되돌렸다. 타깃 `TabBase`는
 * 선택 인덱스를 prop으로 받으므로 **인덱스를 0으로 되돌리면 같은 결과**다.
 */
export const VoteDetailPage = () => {
  const navigate = useNavigate()
  const { voteUuid = '', voterUuid = '' } = useParams()
  const isUser = useIsVoteUser()

  const setVoteCertInfo = useVoteCertStore((state) => {
    return state.setVoteCertInfo
  })

  const { voteDetailInfo, isVoteDetailInfoLoading } = useVoteDetailInfo({ voterUuid })

  const [selectedIndex, setSelectedIndex] = useState(0)

  const isPending = voteDetailInfo?.voteStatus === VOTE_STATE.PENDING
  const displayTabList = isPending ? DETAIL_PAGE_TAB_LIST.slice(0, 1) : DETAIL_PAGE_TAB_LIST

  // 탭이 사라지면 선택이 범위를 벗어난다. 레거시의 강제 재마운트와 같은 결과다.
  const currentIndex = selectedIndex < displayTabList.length ? selectedIndex : 0

  // KMC 외부 사이트를 다녀오면 SPA 상태가 날아간다. 돌아올 때 복원할 값을 미리 심는다.
  // **`isTriedVerification`을 지우는 것**이 핵심이다 — 다른 투표에서는 다시 인증해야 한다.
  // 레거시 `onMounted`와 같은 시점이다.
  useEffect(() => {
    setVoteCertInfo({ voterUuid, voteUuid, isTriedVerification: undefined })
  }, [voterUuid, voteUuid, setVoteCertInfo])

  useEffect(() => {
    if (!voteDetailInfo) return
    // 회원은 어떤 상태든 이 화면에 머문다
    if (!env.IS_OPINION || isUser) return

    if (voteDetailInfo.voteStatus === VOTE_STATE.PENDING) void navigate(ROUTE_PATH.VOTE_BEFORE)
    if (voteDetailInfo.voteStatus === VOTE_STATE.CLOSE) void navigate(ROUTE_PATH.VOTE_FINISH)
  }, [voteDetailInfo, isUser, navigate])

  const currentTabKey = displayTabList[currentIndex]?.key

  return (
    <div className="h-full w-full overflow-auto">
      <VoteDetailTitle voteDetailInfo={voteDetailInfo} />
      <section>
        <TabBase
          tabList={displayTabList}
          selectedIndex={currentIndex}
          onSelect={({ index }) => {
            setSelectedIndex(index)
          }}
        />
        {currentTabKey === 'info' && (
          <VoteDetailInfo voteDetailInfo={voteDetailInfo} isLoading={isVoteDetailInfoLoading} />
        )}
        {currentTabKey === 'result' && <VoteDetailStatus />}
      </section>
      <VoteDetailButton voteDetailInfo={voteDetailInfo} />
    </div>
  )
}
