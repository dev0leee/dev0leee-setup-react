import type { ResidentApt } from '@/shared/types/resident'

/** 아파트명을 어절 단위로 끊어 렌더한다 */
export interface AptInfoHeaderAptNameProps {
  aptName?: string
}

export interface AptInfoHeaderItemProps {
  aptInfo: ResidentApt
  /** ⚠️ 미승인 단지에도 붙는다 — 레거시가 승인 여부와 무관하게 클릭을 달았다 */
  onSelect: (aptInfo: ResidentApt) => void
}

export interface AptInfoHeaderDrawerProps {
  open: boolean
  onClose: () => void
}
