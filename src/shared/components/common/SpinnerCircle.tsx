import type { SpinnerColor } from '@/shared/types/spinner'

/** 버튼 안에 들어가는 작은 스피너. 레거시 `SpinnerCircle.vue` */
const BORDER_TOP_COLOR = {
  white: 'border-t-white',
  black: 'border-t-base-b-black',
  blue: 'border-t-brand-default-border-brand',
} as const

export const SpinnerCircle = ({ color = 'white' }: { color?: SpinnerColor }) => {
  return (
    <span
      className={`h-5 w-5 animate-spin rounded-full border-4 border-neutral-b-gray-100/50 ${BORDER_TOP_COLOR[color]}`}
    />
  )
}
