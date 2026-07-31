import { DETAIL_PAGE_INFO_STATUS_COUNT, VOTE_MESSAGE } from '@/features/vote/constants/vote'
import type { VoteDetailStatus } from '@/features/vote/types/vote'

/**
 * 투표 집계 4칸 (VT2 `투표 현황` 탭). 레거시 `Detail/VoteDetailStatusCount.vue`(42 LOC) 이식.
 *
 * ⚠️ **값이 없으면 `0`이다.** `참여율`만 `%`, 나머지는 `명`이 붙는다.
 * 레거시의 `|| '-'`는 템플릿 리터럴이 항상 truthy라 도달하지 않는 죽은 코드였다 — 뺐다.
 */
export const VoteDetailStatusCount = ({
  voteDetailStatus,
}: {
  voteDetailStatus?: VoteDetailStatus
}) => {
  const renderFieldValue = (key: (typeof DETAIL_PAGE_INFO_STATUS_COUNT)[number]['key']) => {
    const value = voteDetailStatus?.[key]
    const displayValue = value?.toLocaleString() || 0

    return key === 'voteRate' ? `${displayValue}%` : `${displayValue}명`
  }

  return (
    <div className="space-y-6 px-5 py-6">
      <h3 className="pretendard-14SemiBold text-defaults-tertiary-text-tertiary">
        {VOTE_MESSAGE.countTitle}
      </h3>
      <ol className="grid grid-cols-2 gap-4">
        {DETAIL_PAGE_INFO_STATUS_COUNT.map((field) => {
          return (
            <li key={field.key} className="flex flex-col gap-2">
              <span className="pretendard-14SemiBold text-defaults-secondary-text-secondary">
                {field.label}
              </span>
              <span className="pretendard-14Regular text-defaults-secondary-text-secondary">
                {renderFieldValue(field.key)}
              </span>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
