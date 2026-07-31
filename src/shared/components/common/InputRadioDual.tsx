import type { InputRadioDualProps } from '@/shared/types/radio'
import { cn } from '@/shared/utils/cn'

/**
 * 세그먼트형 라디오. 레거시 `InputRadioDual.vue`.
 *
 * `label`이 버튼처럼 보이고 실제 `input[type=radio]`은 숨어 있다.
 * 첫 항목만 왼쪽이 둥글고 마지막 항목만 오른쪽이 둥글다 — 두 개가 아니어도
 * 동작하도록 인덱스로 판단한다(이름은 Dual이지만 항목 수 제한이 없다).
 *
 * ⚠️ **`key`가 문자열이 아닐 수 있다.** 주차 월패드 알림은 `true`/`false`를 값으로 쓴다.
 * DOM 속성에는 문자열로 넣고 **콜백에는 원래 타입 그대로** 돌려준다.
 */
export const InputRadioDual = <TKey extends string | boolean = string>({
  name,
  list,
  value,
  onChange,
  onBlur,
}: InputRadioDualProps<TKey>) => {
  return (
    <div className="flex w-full items-center">
      {list.map((radio, index) => {
        return (
          <label
            key={String(radio.key)}
            htmlFor={`${name}-${String(radio.key)}`}
            className={cn(
              'flex h-11 flex-1 cursor-pointer items-center justify-center px-4 py-2.5 pretendard-16Medium transition-colors',
              value === radio.key
                ? 'bg-brand-default-background-brand text-defaults-primary-text-primary-inverse'
                : 'border-defaults-secondary-border-secondary bg-defaults-secondary-background-secondary text-defaults-primary-text-primary',
              index === 0 && 'rounded-l-lg',
              index === list.length - 1 && 'rounded-r-lg',
            )}
          >
            {radio.label}
            <input
              id={`${name}-${String(radio.key)}`}
              name={name}
              type="radio"
              value={String(radio.key)}
              checked={value === radio.key}
              className="hidden"
              onChange={() => {
                onChange(radio.key)
              }}
              onBlur={onBlur}
            />
          </label>
        )
      })}
    </div>
  )
}
