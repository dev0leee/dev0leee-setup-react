import type { ReactNode } from 'react'

/** 레거시 ChipBase의 색 18종. 이름을 바꾸지 않는다 — 도메인 코드가 이 이름으로 매핑된다 */
export type ChipColor =
  | 'orange'
  | 'deepOrange'
  | 'green'
  | 'deepGreen'
  | 'gray'
  | 'lightGray'
  | 'darkGray'
  | 'purple'
  | 'lightPurple'
  | 'deepPurple'
  | 'darkPurple'
  | 'blue'
  | 'deepRed'
  | 'red'
  | 'outline'
  | 'success'
  | 'warning'
  | 'error'

export type ChipVariant = 'fill' | 'outline'

export interface ChipBaseProps {
  color: ChipColor
  variant?: ChipVariant
  className?: string
  children: ReactNode
}
