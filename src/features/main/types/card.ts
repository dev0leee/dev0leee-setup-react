import type { ComponentType } from 'react'

/** 메인 카드 5종의 id. 순서 프리셋·레이아웃 규칙이 이 값으로 분기한다 */
export const MAIN_CARD_ID = {
  APASS: 'apass',
  PARKING_MILEAGE: 'parkingMileage',
  MANAGEMENT_FEE: 'managementFee',
  VISITOR_PASS: 'visitorPass',
  RESERVATION: 'reservation',
} as const

export type MainCardId = (typeof MAIN_CARD_ID)[keyof typeof MAIN_CARD_ID]

/** 카드 내부 배치. 가로면 제목과 내용이 한 줄, 세로면 위아래로 쌓인다 */
export type CardLayoutType = 'vertical' | 'horizontal'

/** 카드 5종이 모두 받는 prop */
export interface MainCardProps {
  layoutType: CardLayoutType
  /** 그리드가 정하는 너비·테두리·패딩 */
  className: string
}

/** 배치가 확정된 카드 한 장 */
export interface PlacedMainCard {
  id: MainCardId
  Component: ComponentType<MainCardProps>
  layoutType: CardLayoutType
  rowIndex: number
  /**
   * 레이아웃 구조에서의 인덱스. **행 안의 순번이 아니라 카드 전체 인덱스**다 —
   * 5개 배치에서 중첩된 카드가 `3`·`4`인 것이 너비 규칙의 근거다.
   */
  colIndex: number
}

/** 행의 한 칸. 5개 배치의 2행 우측만 배열(세로 2장)이다 */
export type LayoutCell = PlacedMainCard | PlacedMainCard[]
