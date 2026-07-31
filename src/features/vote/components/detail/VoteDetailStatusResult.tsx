import { useState } from 'react'

import { VOTE_MESSAGE } from '@/features/vote/constants/vote'
import {
  QUESTION_TYPE,
  type VoteDetailStatus,
  type VoteResultOption,
} from '@/features/vote/types/vote'
import { DrawerImages } from '@/shared/components/common/DrawerImages'
import { sanitizeHtml } from '@/shared/lib/sanitizeHtml'
import { formatHtmlText } from '@/shared/utils/formatHtmlText'

/**
 * 질문별 투표 결과 (VT2 `투표 현황` 탭, **종료된 투표에서만**).
 * 레거시 `Detail/VoteDetailStatusResult.vue`(152 LOC) 이식.
 *
 * **최다 득표 선택지만 파란색**으로 강조하고 프로그레스 바 색도 갈린다.
 * 득표가 0인 선택지는 후보에서 빠지므로 **전원 미투표인 질문에는 강조가 없다.**
 *
 * ⚠️ **비율의 분모가 `questionFullCount`다.** 복수응답이면 총 표 수가 응답자 수보다
 * 많을 수 있어 **비율 합이 100%를 넘을 수 있다** (VT-Q6). 서버 값에 달렸다.
 *
 * ⚠️ **`ChevronDown.svg`를 270도 돌려 오른쪽 화살표로 쓴다.** alt는 `오른쪽 화살표 아이콘`인데
 * `aria-hidden`이라 읽히지 않는다 — 레거시 그대로다.
 */

/** 득표가 0이 아닌 선택지 중 최대 득표수. 없으면 `undefined` */
const getMaxCount = (options: VoteResultOption[] | undefined) => {
  const counts = (options ?? [])
    .filter((option) => {
      return option.optionCount !== 0
    })
    .map((option) => {
      return option.optionCount ?? 0
    })

  return counts.length > 0 ? Math.max(...counts) : undefined
}

/** 소수점을 버린 비율. 둘 중 하나라도 0이면 계산하지 않는다 */
const calculateVotePercentage = ({
  optionVotes,
  totalVotes,
}: {
  optionVotes: number | undefined
  totalVotes: number | undefined
}) => {
  if (!optionVotes || !totalVotes) return undefined

  return Math.round((optionVotes / totalVotes) * 100)
}

export const VoteDetailStatusResult = ({
  voteDetailStatus,
}: {
  voteDetailStatus?: VoteDetailStatus
}) => {
  const [selectedOption, setSelectedOption] = useState<VoteResultOption | null>(null)

  return (
    <>
      <div className="space-y-6 px-5 py-6 pb-20">
        <h3 className="pretendard-14SemiBold text-defaults-tertiary-text-tertiary">
          {VOTE_MESSAGE.resultTitle}
        </h3>
        <ol className="space-y-12">
          {voteDetailStatus?.questionList?.map((question, questionIndex) => {
            const maxCount = getMaxCount(question.questionOptionList)

            return (
              <li key={question.uuid} className="space-y-4">
                <h4 className="pretendard-16SemiBold">
                  <span>{questionIndex + 1}.</span>
                  <span
                    dangerouslySetInnerHTML={{
                      __html: sanitizeHtml({
                        html: formatHtmlText({ text: question.content || '-' }),
                      }),
                    }}
                  />
                  <span>
                    {question.questionType === QUESTION_TYPE.MULTIPLE_CHOICE
                      ? VOTE_MESSAGE.multipleChoice
                      : undefined}
                  </span>
                </h4>
                <ol className="space-y-4">
                  {question.questionOptionList?.map((option, optionIndex) => {
                    const isMax = maxCount === option.optionCount

                    return (
                      <li
                        key={optionIndex}
                        className="rounded-lg border border-defaults-tertiary-border-tertiary px-4 py-5"
                      >
                        <div className="mb-2 flex items-center justify-between gap-4">
                          <span className="pretendard-15SemiBold text-defaults-secondary-text-secondary">
                            {optionIndex + 1}번
                          </span>
                          <div
                            className={`flex gap-1 ${
                              isMax
                                ? 'text-brand-default-text-brand'
                                : 'text-defaults-secondary-text-secondary'
                            }`}
                          >
                            <span className="border-r-2 border-r-neutral-b-gray-200 pr-1 pretendard-14SemiBold">
                              {option.optionCount?.toLocaleString()}표
                            </span>
                            <span className="pretendard-14SemiBold">
                              {calculateVotePercentage({
                                optionVotes: option.optionCount,
                                totalVotes: question.questionFullCount,
                              }) || 0}
                              %
                            </span>
                          </div>
                        </div>
                        <div className="mb-4 flex items-center justify-between gap-4">
                          <span
                            className="pretendard-14Regular text-defaults-secondary-text-secondary"
                            dangerouslySetInnerHTML={{
                              __html: sanitizeHtml({
                                html: formatHtmlText({ text: option.content || '-' }),
                              }),
                            }}
                          />
                          {option.fileList.length > 0 && (
                            <button
                              type="button"
                              className="flex items-center gap-1 rounded-[4px] bg-defaults-secondary-background-mono px-2 py-1 pretendard-12Regular text-[#6C727E]"
                              onClick={() => {
                                setSelectedOption(option)
                              }}
                            >
                              {VOTE_MESSAGE.detailMore}
                              <img
                                src="/assets/icons/ChevronDown.svg"
                                alt="오른쪽 화살표 아이콘"
                                aria-hidden="true"
                                className="rotate-[270deg]"
                              />
                            </button>
                          )}
                        </div>
                        <progress
                          max={question.questionFullCount}
                          value={option.optionCount}
                          className={`h-3 w-full [&::-moz-progress-bar]:rounded-full [&::-moz-progress-bar]:bg-[#EEF2F6] [&::-moz-progress-value]:rounded-full [&::-webkit-progress-bar]:rounded-full [&::-webkit-progress-bar]:bg-[#EEF2F6] [&::-webkit-progress-value]:rounded-full ${
                            isMax
                              ? '[&::-moz-progress-value]:bg-blue-s-info-500 [&::-webkit-progress-value]:bg-blue-s-info-500'
                              : '[&::-moz-progress-value]:bg-neutral-b-gray-400 [&::-webkit-progress-value]:bg-neutral-b-gray-400'
                          }`}
                        />
                      </li>
                    )
                  })}
                </ol>
              </li>
            )
          })}
        </ol>
      </div>

      {selectedOption && (
        <DrawerImages
          open
          title={selectedOption.content ?? ''}
          images={selectedOption.fileList}
          onClose={() => {
            setSelectedOption(null)
          }}
        />
      )}
    </>
  )
}
