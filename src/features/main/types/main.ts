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

/** `GET /bill/impose-yearmonths` 응답. `YYYY-MM` 문자열 배열이다 */
export interface ImposeYearMonthsResponse {
  imposeYearmonths?: string[]
}

/** 관리비 고지서. 카드는 `imposeAmount` 안의 두 값만 쓴다 */
export interface ManagementFeeBill {
  imposeAmount?: {
    imposeAmount?: number
    /** 음수면 전월보다 줄었다는 뜻이다 */
    previousMonthComparedAmount?: number
  }
}

/** 주차 마일리지(분 단위). `totalMileage`는 클라이언트가 더해 만든 값이다 */
export interface ParkingMileage {
  useMileage: number
  remainingMileage: number
  totalMileage: number
}
