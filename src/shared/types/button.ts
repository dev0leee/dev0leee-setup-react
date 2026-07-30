import type { ButtonHTMLAttributes, ReactNode } from 'react'

/** 레거시 ButtonBase의 color prop 5종 */
export type ButtonColor =
  'brand' | 'defaults-primary' | 'defaults-secondary' | 'alerts-error' | 'alerts-informal'

export type ButtonSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl'

export type ButtonRoundType = 'rounded' | 'capsule' | 'square'

export interface ButtonBaseProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  color?: ButtonColor
  hasOutline?: boolean
  size?: ButtonSize
  roundType?: ButtonRoundType
  children: ReactNode
}
