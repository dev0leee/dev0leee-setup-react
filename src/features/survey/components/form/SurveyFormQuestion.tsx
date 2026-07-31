import { SurveyFormOptionItem } from '@/features/survey/components/form/SurveyFormOptionItem'
import { SURVEY_QUESTION_TYPE, type SurveyFormQuestionData } from '@/features/survey/types/survey'
import { TextError } from '@/shared/components/common/TextError'
import { sanitizeHtml } from '@/shared/lib/sanitizeHtml'
import { formatHtmlText } from '@/shared/utils/formatHtmlText'

/**
 * 질문 1개 (SV3). 레거시 `Form/SurveyFormQuestion.vue` + `QuestionText` + `QuestionChoice`
 * 3개를 합쳤다 — 유형 분기 하나와 두 렌더가 전부라 파일을 나눌 이유가 없다.
 *
 * ⚠️ **필수 질문에만 빨간 `*`가 붙는다** — 투표는 전 질문 필수라 이 표시가 없다.
 *
 * 🔴 **서술형 글자 수가 처음에 `/200`으로 보인다.** 레거시가 `field.value?.length`를
 * 그대로 렌더해 `undefined`가 빈 문자열로 나갔다 — `0/200`이 아니다. 그대로 옮겼다.
 *
 * ⚠️ **자동 높이 조절은 옮기지 않았다.** `min-h-[120px]`과 `resize-none`은 그대로이고,
 * 레거시의 `useTextareaAutoResize`는 `debounceMs: 30`으로 높이를 늘렸다 — 긴 답변에서
 * 스크롤 대신 늘어나던 동작이 사라진다. 200자 제한이라 차이가 작다 (`deferred.md`).
 */
const REQUIRED_MARK = '*'

export const SurveyFormQuestion = ({
  question,
  questionIndex,
  value,
  etcContent,
  error,
  isDisabled,
  onSelect,
  onSubjectiveChange,
  onEtcContentChange,
  scrollRef,
}: {
  question: SurveyFormQuestionData
  questionIndex: number
  /** 선택형이면 uuid(들), 서술형이면 답변 문자열 */
  value: string | string[] | undefined
  etcContent: string | undefined
  error?: string
  isDisabled: boolean
  onSelect: (next: string | string[]) => void
  onSubjectiveChange: (next: string) => void
  onEtcContentChange: (next: string) => void
  scrollRef: (element: HTMLLIElement | null) => void
}) => {
  const isSubjective = question.type === SURVEY_QUESTION_TYPE.SUBJECTIVE
  const isMultiple = question.type === SURVEY_QUESTION_TYPE.MULTIPLE_CHOICE

  const guide = isSubjective
    ? '아래 영역에 답변을 작성해주세요(200자 제한)'
    : question.type === SURVEY_QUESTION_TYPE.SINGLE_CHOICE
      ? '1개 선택 가능'
      : `최소 ${question.minChoice}개/최대 ${question.maxChoice}개`

  return (
    <li ref={scrollRef} className="space-y-4">
      <div className="space-y-1">
        <h4 className="flex gap-1 pretendard-16SemiBold">
          <span>{questionIndex + 1}.</span>
          <span
            dangerouslySetInnerHTML={{
              __html: sanitizeHtml({ html: formatHtmlText({ text: question.content || '-' }) }),
            }}
          />
          {isMultiple && <span>(복수응답)</span>}
          {question.requiredFlag && (
            <span className="pretendard-14Regular text-alerts-error-text-error">
              {REQUIRED_MARK}
            </span>
          )}
        </h4>
        <p className="pretendard-14Regular text-defaults-secondary-text-secondary">{guide}</p>
      </div>

      {isSubjective ? (
        <>
          <textarea
            placeholder="답변을 입력해주세요"
            maxLength={200}
            value={typeof value === 'string' ? value : ''}
            disabled={isDisabled}
            className="min-h-[120px] w-full resize-none rounded-lg border border-defaults-tertiary-border-tertiary px-4 py-3 pretendard-14Regular text-defaults-primary-text-primary placeholder:text-defaults-tertiary-text-tertiary focus:border-defaults-focus-border-focus focus:outline-none"
            onChange={(event) => {
              onSubjectiveChange(event.target.value)
            }}
          />
          <div className="flex justify-between">
            <TextError>{error}</TextError>
            <span className="text-right pretendard-12Regular text-defaults-tertiary-text-tertiary">
              {/* 🔴 값이 없으면 `/200`이 된다 — 레거시 그대로다 */}
              {typeof value === 'string' ? value.length : ''}/200
            </span>
          </div>
        </>
      ) : (
        <>
          <ol className="space-y-4">
            {question.optionList?.map((option, optionIndex) => {
              return (
                <li key={option.uuid}>
                  <SurveyFormOptionItem
                    option={option}
                    optionIndex={optionIndex}
                    questionIndex={questionIndex}
                    questionType={question.type}
                    selected={value}
                    etcContent={etcContent}
                    isDisabled={isDisabled}
                    onSelect={onSelect}
                    onEtcContentChange={onEtcContentChange}
                  />
                </li>
              )
            })}
          </ol>
          <TextError>{error}</TextError>
        </>
      )}
    </li>
  )
}
