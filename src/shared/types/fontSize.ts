import type { FONT_SIZE_SCALE } from '@/shared/constants/fontSize'

export type FontSizeScale = (typeof FONT_SIZE_SCALE)[keyof typeof FONT_SIZE_SCALE]

export interface FontSizeState {
  fontSize: FontSizeScale
  setFontSize: (fontSize: FontSizeScale) => void
  /** 슬라이더용. 범위를 벗어난 인덱스는 무시한다 */
  setFontSizeByIndex: (index: number) => void
  resetFontSize: () => void
}
