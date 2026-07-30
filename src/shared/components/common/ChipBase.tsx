import type { ChipBaseProps, ChipColor } from '@/shared/types/chip'
import { cn } from '@/shared/utils/cn'

/**
 * 상태 칩. 레거시 `ChipBase.vue`(102 LOC).
 *
 * **색 이름과 클래스 문자열을 그대로 옮겼다.** 18색이 도메인별 상태 표시에
 * 흩어져 있어(주차 입출차, 민원 처리단계, 예약 상태 등) 하나만 달라도 눈에 띈다.
 *
 * ⚠️ 디자인 토큰이 아닌 hex가 6곳 섞여 있다(`#00BB40`, `#782dd7`, `#4d5179`,
 * `#f2f3f5`, `#80829f`, `#999bb2`). 이전 디자인 시스템(`globalColor.scss`)의
 * 잔재로 보이지만 화면에 실제로 보이는 색이라 그대로 유지한다.
 *
 * ⚠️ `outline` variant는 `lightPurple` **하나만** 정의돼 있다. 다른 색과 조합하면
 * 색 클래스가 없는 칩이 된다 — 레거시가 그렇다.
 */
const FILL_COLOR: Record<ChipColor, string> = {
  orange: 'text-orange-s-warning-500 bg-orange-s-warning-50',
  deepOrange: 'text-primary-pc-indigo-700 bg-primary-pc-indigo-50',
  green: 'text-alerts-success-text-success bg-alerts-success-background-success-secondary',
  deepGreen: 'text-base-b-white bg-[#00BB40]',
  gray: 'text-defaults-secondary-text-secondary bg-defaults-secondary-background-secondary',
  lightGray: 'text-defaults-secondary-text-secondary bg-defaults-secondary-background-mono',
  darkGray: 'text-base-b-white bg-neutral-b-gray-700',
  purple: 'text-[#782dd7] bg-[rgba(120,45,215,0.14)]',
  deepPurple: 'text-[#4d5179] bg-[#f2f3f5]',
  darkPurple: 'text-base-b-white bg-[#80829f]',
  blue: 'text-alerts-informal-text-informal bg-alerts-informal-background-informal-primary',
  deepRed: 'text-base-b-white bg-alerts-error-background-error',
  red: 'text-alerts-error-text-error bg-alerts-error-background-error-secondary',
  success: 'text-alerts-success-text-success bg-alerts-success-background-success-primary',
  warning: 'text-alerts-warning-text-warning bg-alerts-warning-background-warning-primary',
  error: 'text-alerts-error-text-error bg-alerts-error-background-error-primary',
  // fill 정의가 없는 색. 레거시도 빈 문자열이 된다.
  lightPurple: '',
  outline: '',
}

const OUTLINE_COLOR: Partial<Record<ChipColor, string>> = {
  lightPurple: 'text-[#999bb2] border border-[#999bb2] bg-base-b-white',
}

export const ChipBase = ({ color, variant = 'fill', className, children }: ChipBaseProps) => {
  const colorClass = variant === 'fill' ? FILL_COLOR[color] : (OUTLINE_COLOR[color] ?? '')

  return (
    <div
      className={cn(
        'flex w-fit items-center justify-center gap-0.5 rounded-xl px-1.5 py-1 text-center pretendard-12SemiBold break-keep',
        colorClass,
        className,
      )}
    >
      {children}
    </div>
  )
}
