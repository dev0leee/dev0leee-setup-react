import { useState } from 'react'

import { SurveyList } from '@/features/survey/components/list/SurveyList'
import { LIST_PAGE_FILTER_LIST } from '@/features/survey/constants/survey'
import { useSurveyList } from '@/features/survey/queries/useSurvey'
import { TabCategory } from '@/shared/components/common/TabCategory'

/**
 * 설문조사 목록 (SV1). 레거시 `SurveyView.vue`(28 LOC) 이식.
 *
 * **회원 전용 화면이다.** opinion 앱에도 같은 경로가 있지만 거기서는 NotFound 화면을
 * 그린다 — 비회원에게 단지 전체 설문 목록을 줄 수 없기 때문이다(R-3).
 */
export const SurveyListPage = () => {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const {
    surveyList,
    isSurveyListLoading,
    hasSurveyListNextPage,
    fetchSurveyListNextPage,
    setSurveyState,
  } = useSurveyList()

  return (
    <div className="h-full">
      <TabCategory
        categories={LIST_PAGE_FILTER_LIST}
        selectedIndex={selectedIndex}
        hasTotalType
        className="pb-4"
        onSelect={({ index, category }) => {
          setSelectedIndex(index)
          setSurveyState(category.uuid)
        }}
      />
      <SurveyList
        list={surveyList}
        isLoading={isSurveyListLoading}
        hasNextPage={hasSurveyListNextPage}
        fetchNextPage={fetchSurveyListNextPage}
      />
    </div>
  )
}
