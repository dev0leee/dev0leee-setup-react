import { SURVEY_QUESTION_TYPE, type SurveyFormOption } from '@/features/survey/types/survey'
import { sanitizeHtml } from '@/shared/lib/sanitizeHtml'
import { formatHtmlText } from '@/shared/utils/formatHtmlText'

/**
 * 선택지 1개 + 기타 입력 (SV3). 레거시 `Form/SurveyFormOptionItem.vue`(82 LOC) 이식.
 *
 * ⚠️ **`type === 'SUBJECTIVE'`인 선택지가 기타 옵션**이다. 고르면 라벨 안에 인라인
 * 텍스트 입력이 열린다 — 투표에는 없는 구조다.
 *
 * ⚠️ **기타 입력은 선택했을 때만 렌더된다.** 레거시가 `selected` 클래스를 조건부로 붙였지만
 * 렌더 자체가 선택 시에만이라 **항상 붙는다** — 미선택 스타일은 도달 불가다. 그래서
 * 선택 상태 스타일(파란 밑줄 + 연파랑 배경)만 옮겼다.
 *
 * ⚠️ **입력에 스타일 클래스가 없다** — OS 기본 라디오/체크박스다. 투표와 같다.
 */
export const SurveyFormOptionItem = ({
  option,
  optionIndex,
  questionIndex,
  questionType,
  selected,
  etcContent,
  isDisabled,
  onSelect,
  onEtcContentChange,
}: {
  option: SurveyFormOption
  optionIndex: number
  questionIndex: number
  questionType?: string
  selected: string | string[] | undefined
  etcContent: string | undefined
  isDisabled: boolean
  onSelect: (next: string | string[]) => void
  onEtcContentChange: (next: string) => void
}) => {
  const isMultiple = questionType === SURVEY_QUESTION_TYPE.MULTIPLE_CHOICE
  const isEtc = option.type === SURVEY_QUESTION_TYPE.SUBJECTIVE
  const inputId = `question-${questionIndex}-option-${optionIndex}`
  const fieldName = `questionList[${questionIndex}].optionList`

  const isSelected = Array.isArray(selected)
    ? selected.includes(option.uuid)
    : selected === option.uuid

  const toggle = () => {
    if (!isMultiple) {
      onSelect(option.uuid)
      return
    }

    const current = Array.isArray(selected) ? selected : []
    onSelect(
      isSelected
        ? current.filter((uuid) => {
            return uuid !== option.uuid
          })
        : [...current, option.uuid],
    )
  }

  return (
    <label
      htmlFor={inputId}
      className={`flex min-h-[60px] cursor-pointer items-center gap-4 rounded-lg border px-4 py-5 ${
        isSelected
          ? 'border-blue-s-info-100 bg-blue-s-info-50'
          : 'border-defaults-tertiary-border-tertiary'
      }`}
    >
      <div className="flex w-full items-center gap-3">
        <input
          id={inputId}
          name={fieldName}
          type={isMultiple ? 'checkbox' : 'radio'}
          value={option.uuid}
          checked={isSelected}
          disabled={isDisabled}
          onChange={toggle}
        />
        <span
          className={`pretendard-14Regular text-defaults-secondary-text-secondary ${
            isEtc ? 'whitespace-nowrap' : 'break-all'
          }`}
          dangerouslySetInnerHTML={{
            __html: sanitizeHtml({ html: formatHtmlText({ text: option.content || '-' }) }),
          }}
        />
        {isSelected && isEtc && (
          <input
            type="text"
            placeholder="답변을 입력해주세요"
            maxLength={50}
            value={etcContent ?? ''}
            disabled={isDisabled}
            className="ml-2 w-full border-b-2 border-none border-b-[#a0ceff] bg-[#ecf5ff] py-1 outline-none focus:border-b-2 focus:border-b-[#a0ceff]"
            onChange={(event) => {
              onEtcContentChange(event.target.value)
            }}
          />
        )}
      </div>
    </label>
  )
}
