import { VoteDetailStatusCount } from '@/features/vote/components/detail/VoteDetailStatusCount'
import { VoteDetailStatusResult } from '@/features/vote/components/detail/VoteDetailStatusResult'
import { useVoteDetailStatus } from '@/features/vote/queries/useVote'
import { VOTE_STATE } from '@/features/vote/types/vote'

/**
 * `투표 현황` 탭 (VT2). 레거시 `Detail/VoteDetailStatus.vue`(15 LOC) 이식.
 *
 * ⚠️ **현황 조회는 이 탭을 열어야 나간다.** 상세 화면에 들어가는 것만으로는 요청하지
 * 않는다 — 레거시도 이 컴포넌트 안에서 훅을 부른다. 화면(페이지)으로 끌어올리면
 * 비회원 경로에서도 회원 전용 API를 때려 **에러 모달이 뜬다.**
 *
 * ⚠️ **결과 그래프는 종료된 투표에만 나온다.** 진행 중에는 집계 4칸까지다.
 */
export const VoteDetailStatus = () => {
  const { voteDetailStatus } = useVoteDetailStatus()

  return (
    <div>
      <VoteDetailStatusCount voteDetailStatus={voteDetailStatus} />
      {voteDetailStatus?.voteStatus === VOTE_STATE.CLOSE && (
        <VoteDetailStatusResult voteDetailStatus={voteDetailStatus} />
      )}
    </div>
  )
}
