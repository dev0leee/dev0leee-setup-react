import type { InputBaseProps } from '@/shared/types/input'
import { cn } from '@/shared/utils/cn'
import { formatPhone } from '@/shared/utils/formatPhone'

/**
 * 기본 입력. 레거시 `InputBase.vue`(98 LOC).
 *
 * 레거시는 `useField(id)`로 vee-validate에 직접 묶여 있었다. RHF에서는 폼이
 * 값을 소유하므로 **제어 컴포넌트**로 만들고, 값 가공만 여기서 한다.
 *
 * ⚠️ **입력값 가공 규칙 3개를 그대로 옮겼다:**
 *  - `type="tel"`이면 자동으로 하이픈을 넣는다
 *  - `type="number"`이면 빈 문자열을 `undefined`로 바꾼다 (0이 아니다)
 *  - **`id === 'carNum'`이면 공백을 제거한다** — id로 도메인을 판별하는 냄새나는
 *    분기지만, 차량번호 입력 화면들이 이 동작에 의존한다. 고치려면 호출부를
 *    함께 봐야 한다 (`deferred.md`)
 */
export const InputBase = ({
  id,
  name,
  type = 'text',
  value,
  placeholder = '',
  maxLength = 100,
  isRequired = false,
  isDisabled = false,
  className,
  onChange,
  onBlur,
}: InputBaseProps) => {
  const handleChange = (rawValue: string) => {
    if (type === 'tel') {
      onChange(formatPhone({ phone: rawValue }))
      return
    }
    if (type === 'number') {
      onChange(rawValue === '' ? undefined : Number(rawValue))
      return
    }
    if (id === 'carNum') {
      onChange(rawValue.replace(/\s/g, ''))
      return
    }
    onChange(rawValue)
  }

  return (
    <input
      id={id}
      name={name ?? id}
      type={type}
      value={value ?? ''}
      placeholder={placeholder}
      maxLength={maxLength}
      required={isRequired}
      disabled={isDisabled}
      className={cn(
        'flex h-10 w-full flex-col justify-center gap-[10px] self-stretch rounded-[4px] border border-defaults-tertiary-border-tertiary px-4 py-[10px] pretendard-16Regular text-defaults-primary-text-primary caret-brand-default-background-brand placeholder:text-defaults-tertiary-text-tertiary',
        className,
        isDisabled &&
          'bg-defaults-secondary-background-secondary text-defaults-tertiary-text-tertiary',
      )}
      onChange={(event) => {
        handleChange(event.target.value)
      }}
      onBlur={onBlur}
    />
  )
}
