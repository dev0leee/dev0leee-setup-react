import { env } from '@/config/env'
import { useAuthStore } from '@/shared/stores/authStore'

/**
 * 회원/비회원에 따라 설문 상세 경로를 만든다. **투표의 `getVoteDetailPath`와 같은 구조**이고
 * 레거시도 마찬가지로 같은 코드를 여러 훅에 복사해 뒀다.
 *
 * | 조건                         | 경로                                          |
 * | ---------------------------- | --------------------------------------------- |
 * | 메인 앱 + 로그인             | `/survey/detail/{surveyUuid}/{participantUuid}` |
 * | opinion 앱 **또는** 비로그인 | `/survey/{participantUuid}`                   |
 */
export const getSurveyDetailPath = ({
  surveyUuid,
  participantUuid,
  isUser,
}: {
  surveyUuid: string | undefined
  participantUuid: string | undefined
  isUser: boolean
}): string => {
  if (!env.IS_OPINION && isUser) {
    return `/survey/detail/${surveyUuid ?? ''}/${participantUuid ?? ''}`
  }

  return `/survey/${participantUuid ?? ''}`
}

/** 로그인 여부. 스토어를 구독하므로 컴포넌트·훅 안에서만 쓴다 */
export const useIsSurveyUser = (): boolean => {
  return useAuthStore((state) => {
    return Boolean(state.aptInfo.aptResidentUuid)
  })
}
