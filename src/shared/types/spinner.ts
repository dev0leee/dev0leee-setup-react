export type SpinnerColor = 'white' | 'black' | 'blue'

export interface SpinnerDotsProps {
  /** 0이면 표시하지 않는다. 업로드 진행률이 있을 때만 숫자가 뜬다 */
  progressPercent?: number
  /** Tailwind 배경 클래스. 예: `bg-black/50` */
  backgroundColor?: string
  /** Tailwind 텍스트 색 클래스 */
  textColor?: string
}
