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

export interface ModalPageProps {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
}

export interface ModalImageViewerProps {
  open: boolean
  onClose: () => void
  /** 이미 S3 접두사가 붙은 완전한 URL이어야 한다 */
  imageUrl: string
}

/** 바텀시트 목록 항목 */
export interface DrawerListItem {
  key: string
  label: string
  /** Tailwind 텍스트 색 클래스. 없으면 기본 본문색 */
  color?: string
  /** 명시적으로 false일 때만 숨는다 (레거시 `item.enabled ? item.enabled : true`) */
  enabled?: boolean
  onClick: () => void
}

export interface DrawerListProps {
  open: boolean
  onClose: () => void
  title?: string
  /** 기본값은 `center`다 */
  textAlign?: 'left' | 'center' | 'right'
  list: DrawerListItem[]
}

/** 첨부 이미지 한 건 */
export interface AttachedImage {
  fileUuid: string
  /** S3 접두사를 붙이기 전의 상대 경로 */
  fileUrl: string
  fileName: string
}

export interface DrawerImagesProps {
  open: boolean
  onClose: () => void
  /** 줄바꿈이 섞여 올 수 있어 `formatHtmlText`를 거친다 */
  title: string
  images: AttachedImage[]
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
