import { cva } from 'class-variance-authority'

import type { ButtonBaseProps } from '@/shared/types/button'
import { cn } from '@/shared/utils/cn'

/**
 * 레거시 `components/common/ButtonBase.vue`(141 LOC)를 CVA로 이식.
 *
 * **클래스 문자열을 한 글자도 바꾸지 않았다.** 색 5종 × solid/outline,
 * 크기 5종, 라운드 3종의 조합이 화면 곳곳에 쓰여 있어 하나만 달라도 눈에 띈다.
 *
 * shadcn `button`을 쓰지 않은 이유: 레거시 variant 체계와 겹치는 부분이 거의 없고,
 * 겹쳐 쓰면 shadcn 기본 클래스를 매번 덮어야 해서 오히려 어긋날 위험이 커진다.
 */
const buttonBase = cva('w-full whitespace-nowrap text-center', {
  variants: {
    color: {
      brand: '',
      'defaults-primary': '',
      'defaults-secondary': '',
      'alerts-error': '',
      'alerts-informal': '',
    },
    hasOutline: { true: '', false: '' },
    size: {
      sm: 'px-2.5 py-1.5 pretendard-14Medium',
      md: 'px-3 py-2 pretendard-14Medium',
      lg: 'px-4 py-2.5 pretendard-16Medium',
      xl: 'px-[18px] py-3 pretendard-18Medium',
      '2xl': 'px-5 py-4 pretendard-18Medium',
    },
    roundType: {
      rounded: 'rounded-lg',
      capsule: 'rounded-full',
      square: 'rounded-none',
    },
  },
  compoundVariants: [
    // ── solid ─────────────────────────────────────────────────────────────────
    {
      color: 'brand',
      hasOutline: false,
      class:
        'bg-brand-default-background-brand text-defaults-primary-background-primary active:bg-brand-default-background-brand/40 active:text-defaults-primary-background-primary disabled:bg-primary-pc-indigo-300 disabled:text-text-defaults-primary-text-primary',
    },
    {
      color: 'defaults-primary',
      hasOutline: false,
      class:
        'bg-defaults-primary-background-primary-inverse text-defaults-primary-text-primary-inverse active:bg-defaults-primary-background-primary-inverse/40 active:text-defaults-primary-text-primary-inverse disabled:bg-defaults-disabled-background-disabled disabled:text-defaults-disabled-text-disabled',
    },
    {
      color: 'defaults-secondary',
      hasOutline: false,
      class:
        'bg-defaults-secondary-background-secondary text-defaults-secondary-text-secondary active:bg-defaults-secondary-background-secondary/40 active:text-defaults-secondary-text-secondary disabled:bg-defaults-disabled-background-disabled disabled:text-defaults-disabled-text-disabled',
    },
    {
      color: 'alerts-error',
      hasOutline: false,
      class:
        'bg-alerts-error-background-error text-defaults-primary-text-primary-inverse active:bg-alerts-error-background-error/40 active:text-defaults-primary-text-primary-inverse disabled:bg-alerts-error-background-error-disabled disabled:text-alerts-error-text-error-disabled',
    },
    {
      color: 'alerts-informal',
      hasOutline: false,
      class:
        'bg-alerts-informal-background-informal text-defaults-primary-background-primary active:bg-alerts-informal-background-informal/40 active:text-defaults-primary-background-primary disabled:bg-defaults-disabled-background-disabled disabled:text-defaults-disabled-text-disabled',
    },
    // ── outline ───────────────────────────────────────────────────────────────
    {
      color: 'brand',
      hasOutline: true,
      class:
        'border-2 border-brand-default-border-brand bg-defaults-primary-background-primary text-brand-default-text-brand disabled:border-brand-disabled-border-brand-disabled disabled:text-brand-disabled-text-brand-disabled',
    },
    {
      color: 'defaults-primary',
      hasOutline: true,
      // ⚠️ `border-defaults-secondary-border-primary`는 config에 없는 조합이라
      // 테두리 색이 적용되지 않는다. 이 variant의 사용처가 0곳이라 무해하다
      // (`broken-styles.md` §5).
      class:
        'border-2 border-defaults-primary-border-primary bg-defaults-primary-background-primary text-defaults-primary-text-primary disabled:border-defaults-disabled-border-disabled disabled:text-defaults-disabled-text-disabled',
    },
    {
      color: 'defaults-secondary',
      hasOutline: true,
      class:
        'border-2 border-defaults-secondary-border-secondary bg-defaults-secondary-background-mono text-defaults-secondary-text-secondary disabled:border-defaults-disabled-border-disabled disabled:text-defaults-disabled-text-disabled',
    },
    {
      color: 'alerts-error',
      hasOutline: true,
      class:
        'border-2 border-alerts-error-border-error bg-defaults-primary-background-primary text-alerts-error-text-error disabled:border-alerts-error-border-error-disabled disabled:text-alerts-error-text-error-disabled',
    },
    {
      color: 'alerts-informal',
      hasOutline: true,
      class:
        'border-2 border-alerts-informal-border-informal bg-defaults-primary-background-primary text-alerts-informal-text-informal disabled:border-alerts-informal-text-informal-disabled disabled:text-alerts-informal-text-informal-disabled',
    },
  ],
  defaultVariants: {
    color: 'brand',
    hasOutline: false,
    size: 'lg',
    roundType: 'rounded',
  },
})

export const ButtonBase = ({
  type = 'button',
  color,
  hasOutline = false,
  size,
  roundType,
  className,
  children,
  ...props
}: ButtonBaseProps) => {
  return (
    <button
      type={type}
      className={cn(buttonBase({ color, hasOutline, size, roundType }), className)}
      {...props}
    >
      {children}
    </button>
  )
}
