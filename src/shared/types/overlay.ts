import type { ReactNode } from 'react'

export interface ModalBaseProps {
  open: boolean
  /** 배경 클릭·Esc·닫기 버튼 어느 경로로든 닫힐 때 호출된다 */
  onClose: () => void
  children: ReactNode
}

/** 레거시 ModalButton의 버튼 배치 3종 */
export type ModalButtonType = 'single' | 'dual' | 'outline'

export interface ModalData {
  title?: string
  /** 배열이면 줄마다 `<p>`로 그린다. 레거시가 문자열/배열 둘 다 받는다 */
  description: string | string[]
  firstButton?: string
  secondButton?: string
}

export interface ModalButtonProps {
  open: boolean
  onClose: () => void
  buttonType: ModalButtonType
  modalData: ModalData
  onFirstClick?: () => void
  onSecondClick?: () => void
}

export interface DrawerBaseProps {
  open: boolean
  onClose: () => void
  /** 있으면 제목 줄을 그린다. 없으면 제목 줄 자체가 없다 */
  title?: string
  /** 제목 줄 오른쪽 닫기 버튼 노출 여부. `title`이 있을 때만 의미가 있다 */
  hasCloseButton?: boolean
  /** 하단 버튼 영역(높이 56px) 노출 여부 */
  hasButtons?: boolean
  children: ReactNode
  /** 하단 버튼 영역에 들어갈 것. 레거시의 firstButton·secondButton 슬롯을 합쳤다 */
  buttons?: ReactNode
}
