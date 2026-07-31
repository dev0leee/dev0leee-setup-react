import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import { SurveyListItem } from '@/features/survey/components/list/SurveyListItem'
import { SURVEY_MESSAGE } from '@/features/survey/constants/survey'
import type { SurveyListItemData } from '@/features/survey/types/survey'
import { SpinnerDots } from '@/shared/components/common/SpinnerDots'
import { TextEmpty } from '@/shared/components/common/TextEmpty'
import { ROUTE_PATH, surveyDetailPath } from '@/shared/constants/routes'
import { useInfiniteScrollPosition } from '@/shared/hooks/useInfiniteScrollPosition'
import { useIntersectionObserver } from '@/shared/hooks/useIntersectionObserver'

/**
 * 설문 목록 (SV1). 레거시 `List/SurveyList.vue`(80 LOC) 이식.
 * 구조는 투표 목록과 같다 — 로딩 중 스피너, 상세 왕복 시 스크롤 복원.
 */
export const SurveyList = ({
  list,
  isLoading,
  hasNextPage,
  fetchNextPage,
}: {
  list: SurveyListItemData[]
  isLoading: boolean
  hasNextPage: boolean
  fetchNextPage: () => void
}) => {
  const navigate = useNavigate()
  const { targetRef, isIntersecting } = useIntersectionObserver<HTMLDivElement>()
  const { scrollContainerRef } = useInfiniteScrollPosition<HTMLUListElement>({
    rules: { moveFrom: '/detail', moveTo: [ROUTE_PATH.SURVEY_LIST] },
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
              <SurveyListItem
                key={item.surveyUuid}
                item={item}
                onClick={() => {
                  void navigate(
                    surveyDetailPath({
                      surveyUuid: item.surveyUuid,
                      participantUuid: item.participantUuid,
                    }),
                  )
                }}
              />
            )
          })}
          <div ref={targetRef} className="w-full" />
        </ul>
      ) : (
        <div className="flex h-full items-center justify-center">
          <TextEmpty>{SURVEY_MESSAGE.listEmpty}</TextEmpty>
        </div>
      )}
    </div>
  )
}
