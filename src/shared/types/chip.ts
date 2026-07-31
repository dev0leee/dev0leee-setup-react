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
  /**
   * ⚠️ **`undefined`가 올 수 있다.** 주차 차량 유형처럼 서버 코드를 표에서 찾아 넘기는
   * 자리는 표에 없는 값이 오면 색이 비고, 레거시도 그때 색 없는 칩을 그린다
   * (`parking.md` §3-7 `findCarType`). 색만 빠지고 칩 자체는 렌더된다.
   */
  color?: ChipColor
  variant?: ChipVariant
  className?: string
  children: ReactNode
}
