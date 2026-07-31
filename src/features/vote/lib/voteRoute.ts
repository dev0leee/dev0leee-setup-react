import { env } from '@/config/env'
import { useAuthStore } from '@/shared/stores/authStore'

/**
 * 회원/비회원에 따라 투표 상세 경로를 만든다.
 *
 * **레거시는 이 3줄을 5곳에 복사해 두었다** (`useVoteForm` · `VoteAuthPassResponseView` ·
 * `usePatchVoteCertPass` · `usePatchVoteCertNamePhone` · `useGetVoteForm`).
 * 결과가 같으므로 하나로 합쳤다 (`vote.md` §1).
 *
 * | 조건                            | 경로                                  |
 * | ------------------------------- | ------------------------------------- |
 * | 메인 앱 + 로그인                | `/vote/detail/{voteUuid}/{voterUuid}` |
 * | opinion 앱 **또는** 비로그인    | `/vote/{voterUuid}`                   |
 *
 * ⚠️ **`aptResidentUuid`의 존재만으로 회원을 판정한다** — 레거시 그대로다.
 */
export const getVoteDetailPath = ({
  voteUuid,
  voterUuid,
  isUser,
}: {
  voteUuid: string | undefined
  voterUuid: string | undefined
  isUser: boolean
}): string => {
  if (!env.IS_OPINION && isUser) {
    return `/vote/detail/${voteUuid ?? ''}/${voterUuid ?? ''}`
  }

  return `/vote/${voterUuid ?? ''}`
}

/** 로그인 여부. 스토어를 구독하므로 컴포넌트·훅 안에서만 쓴다 */
export const useIsVoteUser = (): boolean => {
  return useAuthStore((state) => {
    return Boolean(state.aptInfo.aptResidentUuid)
  })
}
