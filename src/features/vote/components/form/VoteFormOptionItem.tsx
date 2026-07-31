import { useState } from 'react'

import { VOTE_MESSAGE } from '@/features/vote/constants/vote'
import { QUESTION_TYPE, type VoteFormOption } from '@/features/vote/types/vote'
import { DrawerImages } from '@/shared/components/common/DrawerImages'
import { sanitizeHtml } from '@/shared/lib/sanitizeHtml'
import { formatHtmlText } from '@/shared/utils/formatHtmlText'

/**
 * 선택지 1개 (VT3). 레거시 `Form/VoteFormOptionItem.vue`(86 LOC) 이식.
 *
 * ⚠️ **입력에 스타일 클래스가 없다.** OS 기본 라디오/체크박스가 그대로 보이고 iOS·
 * Android에서 모양이 다르다 — 선택 상태는 라벨의 파란 테두리·배경으로 표현한다.
 *
 * ⚠️ **`자세히 보기`는 클릭 전파를 막는다.** `<label>` 안에 있어 그대로 두면 버튼을
 * 누를 때 선택까지 바뀐다.
 *
 * ⚠️ 레거시는 `provide`/`inject` 2단 컨텍스트로 값을 내려받았다. **props로 바꿨다** —
 * 트리가 3단뿐이고 컨텍스트가 반응형도 아니었다(`vote.md` §3).
 */
export const VoteFormOptionItem = ({
  option,
  optionIndex,
  questionIndex,
  questionType,
  selected,
  onSelect,
}: {
  option: VoteFormOption
  optionIndex: number
  questionIndex: number
  questionType?: string
  /** 선택된 uuid. 복수응답이면 배열이다 */
  selected: string | string[] | undefined
  onSelect: (next: string | string[]) => void
}) => {
  const [isImagesOpen, setIsImagesOpen] = useState(false)

  const isMultiple = questionType === QUESTION_TYPE.MULTIPLE_CHOICE
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
    <>
      <label
        htmlFor={inputId}
        className={`flex cursor-pointer items-center justify-between gap-4 rounded-lg border px-4 py-5 ${
          isSelected
            ? 'border-blue-s-info-100 bg-blue-s-info-50'
            : 'border-defaults-tertiary-border-tertiary'
        }`}
      >
        <div className="flex items-center gap-2">
          <input
            id={inputId}
            name={fieldName}
            type={isMultiple ? 'checkbox' : 'radio'}
            value={option.uuid}
            checked={isSelected}
            onChange={toggle}
          />
          <span className="pretendard-14SemiBold whitespace-nowrap text-defaults-secondary-text-secondary">
            {optionIndex + 1}번
          </span>
          <span
            className="pretendard-14Regular text-defaults-secondary-text-secondary"
            dangerouslySetInnerHTML={{
              __html: sanitizeHtml({ html: formatHtmlText({ text: option.content || '-' }) }),
            }}
          />
        </div>

        {option.fileList.length > 0 && (
          <button
            type="button"
            className="flex min-w-[90px] items-center gap-1 rounded-[4px] bg-defaults-secondary-background-mono px-2 py-1 pretendard-12Regular whitespace-nowrap text-[#6C727E]"
            onClick={(event) => {
              event.preventDefault()
              event.stopPropagation()
              setIsImagesOpen(true)
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
      </label>

      {isImagesOpen && (
        <DrawerImages
          open
          title={option.content ?? ''}
          images={option.fileList}
          onClose={() => {
            setIsImagesOpen(false)
          }}
        />
      )}
    </>
  )
}
