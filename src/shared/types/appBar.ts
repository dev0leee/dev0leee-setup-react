import type { CSSProperties, ReactNode } from 'react'

export interface AppBarProps {
  /** 라우트 meta의 `appBarBackgroundColor` hex를 그대로 얹는다 */
  style?: CSSProperties
  title?: string
  /** 레거시 기본값이 **true**다. 끄려면 명시적으로 false를 넘긴다 */
  hasBackButton?: boolean
  /**
   * 뒤로가기 동작을 갈아끼운다. 없으면 히스토리를 한 칸 뒤로 간다.
   * 작성 중 이탈 확인 모달을 띄우는 화면들이 이걸 쓴다.
   */
  onBack?: () => void
  /** opinion 앱은 `max-w-[480px]`로 제한한다 */
  isFullWidth?: boolean
  className?: string
  /** 오른쪽 영역. 레거시의 기본 슬롯 */
  children?: ReactNode
}
