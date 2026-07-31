import { VoteFormOptionItem } from '@/features/vote/components/form/VoteFormOptionItem'
import { VOTE_MESSAGE } from '@/features/vote/constants/vote'
import { QUESTION_TYPE, type VoteFormQuestionData } from '@/features/vote/types/vote'
import { TextError } from '@/shared/components/common/TextError'
import { sanitizeHtml } from '@/shared/lib/sanitizeHtml'
import { formatHtmlText } from '@/shared/utils/formatHtmlText'

/**
 * 질문 1개 + 선택지들 (VT3). 레거시 `Form/VoteFormQuestion.vue`(85 LOC) 이식.
 *
 * ⚠️ **찬반투표(`AGAINST`)는 질문 타입과 무관하게 같은 안내를 쓴다.** 분기가 타입보다
 * 먼저 걸린다.
 */
const getQuestionTypeText = ({
  voteType,
  questionType,
  minChoice,
  maxChoice,
}: {
  voteType?: string
  questionType?: string
  minChoice?: number
  maxChoice?: number
}) => {
  if (voteType === 'AGAINST') return '찬성/반대 의견 투표를 해주세요.'
  if (questionType === QUESTION_TYPE.SINGLE_CHOICE) return '1개 선택 가능'

  return `최소 ${minChoice}개/최대 ${maxChoice}개`
}

export const VoteFormQuestion = ({
  question,
  questionIndex,
  voteType,
  selected,
  error,
  onSelect,
  scrollRef,
}: {
  question: VoteFormQuestionData
  questionIndex: number
  voteType?: string
  selected: string | string[] | undefined
  error?: string
  onSelect: (next: string | string[]) => void
  /** 검증 실패 시 이 질문으로 스크롤하기 위한 앵커 */
  scrollRef: (element: HTMLLIElement | null) => void
}) => {
  return (
    <li ref={scrollRef} className="space-y-4">
      <div className="space-y-1">
        <h4 className="pretendard-16SemiBold">
          <span>{questionIndex + 1}.</span>
          <span
            dangerouslySetInnerHTML={{
              __html: sanitizeHtml({ html: formatHtmlText({ text: question.content || '-' }) }),
            }}
          />
          <span>
            {question.questionType === QUESTION_TYPE.MULTIPLE_CHOICE
              ? VOTE_MESSAGE.multipleChoice
              : undefined}
          </span>
        </h4>
        <p className="pretendard-14Regular text-defaults-secondary-text-secondary">
          {getQuestionTypeText({
            voteType,
            questionType: question.questionType,
            minChoice: question.minChoice,
            maxChoice: question.maxChoice,
          })}
        </p>
      </div>

      <ol className="space-y-4">
        {question.questionOptionList?.map((option, optionIndex) => {
          return (
            <li key={option.uuid}>
              <VoteFormOptionItem
                option={option}
                optionIndex={optionIndex}
                questionIndex={questionIndex}
                questionType={question.questionType}
                selected={selected}
                onSelect={onSelect}
              />
            </li>
          )
        })}
      </ol>

      <TextError>{error}</TextError>
    </li>
  )
}
