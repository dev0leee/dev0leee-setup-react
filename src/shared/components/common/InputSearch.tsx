import type { InputSearchProps } from '@/shared/types/input'

/**
 * 검색 입력. 레거시 `InputSearch.vue`.
 *
 * `type="search"`라서 브라우저가 지우기 버튼을 그리는데, `index.css`의
 * `input::-webkit-search-cancel-button` 규칙이 그것을 커스텀 아이콘으로 바꾼다.
 *
 * 레거시는 `useField(id)`로 vee-validate에 직접 묶여 있었다. RHF에서는 폼이
 * `register`/`Controller`로 값을 넘기므로 **제어 컴포넌트**로 만들었다.
 */
export const InputSearch = ({
  id,
  value,
  onChange,
  onBlur,
  isReadonly = false,
  placeholder = '검색',
}: InputSearchProps) => {
  return (
    <div className="relative flex h-10 w-full">
      <input
        id={id}
        type="search"
        className="flex h-full w-full flex-col items-start justify-center gap-[10px] self-stretch rounded-[4px] border border-defaults-tertiary-border-tertiary bg-defaults-secondary-background-secondary py-[10px] pr-10 pl-3 pretendard-16Regular text-defaults-primary-text-primary focus:outline-none"
        value={value}
        readOnly={isReadonly}
        placeholder={placeholder}
        onChange={(event) => {
          onChange(event.target.value)
        }}
        onBlur={onBlur}
      />
      <button
        // 읽기 전용 검색창은 제출이 아니라 화면 이동용이다.
        type={isReadonly ? 'button' : 'submit'}
        className="absolute top-1/2 right-3 ml-4 flex h-6 w-6 translate-y-[-50%] items-center justify-center"
      >
        <img className="h-5 w-5" src="/assets/icons/SearchMiddle.svg" alt="검색 아이콘" />
      </button>
    </div>
  )
}
