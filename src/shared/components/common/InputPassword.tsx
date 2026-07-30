import { useState } from 'react'

import type { InputPasswordProps } from '@/shared/types/input'
import { cn } from '@/shared/utils/cn'

/**
 * 비밀번호 입력. 레거시 `InputPassword.vue`.
 *
 * 눈 아이콘은 **값이 비어 있지 않을 때만** 보인다(레거시 `v-if`).
 * 가리기/보이기 상태는 이 컴포넌트만 아는 UI 상태이므로 내부 `useState`가 맞다.
 */
export const InputPassword = ({
  id,
  value,
  placeholder = '',
  maxLength = 100,
  isRequired = false,
  isDisabled = false,
  className,
  onChange,
  onBlur,
}: InputPasswordProps) => {
  const [isPasswordHidden, setIsPasswordHidden] = useState(true)

  return (
    <div className="flex w-full flex-col gap-[6px]">
      <div className="relative">
        <input
          id={id}
          name={id}
          type={isPasswordHidden ? 'password' : 'text'}
          value={value}
          placeholder={placeholder}
          maxLength={maxLength}
          required={isRequired}
          disabled={isDisabled}
          autoComplete="off"
          className={cn(
            'flex h-full w-full flex-col items-start justify-center gap-[10px] self-stretch rounded-[4px] border border-defaults-tertiary-border-tertiary py-[10px] pr-8 pl-4 pretendard-16Regular text-defaults-primary-text-primary placeholder:text-defaults-tertiary-text-tertiary',
            className,
          )}
          onChange={(event) => {
            onChange(event.target.value)
          }}
          onBlur={onBlur}
        />
        {value !== '' && (
          <button
            type="button"
            className="absolute top-1/2 right-[10px] h-4 w-4 translate-y-[-50%] transform"
            onClick={() => {
              setIsPasswordHidden((hidden) => {
                return !hidden
              })
            }}
          >
            <img
              src={isPasswordHidden ? '/assets/icons/Eye.svg' : '/assets/icons/EyeOff.svg'}
              alt="눈모양 아이콘"
            />
          </button>
        )}
      </div>
    </div>
  )
}
