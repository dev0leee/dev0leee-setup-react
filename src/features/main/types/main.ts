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

/** 공지 Top3 한 건. 목록은 카테고리·제목만 쓰고 `uuid`로 상세로 간다 */
export interface NoticeTopThreeItem {
  uuid: string
  categoryName?: string
  title?: string
}

/** 쇼핑몰 SSO 토큰 4종. 그대로 외부 URL 쿼리스트링이 된다 */
export interface ShoppingToken {
  accessToken: string
  expiresIn: number | string
  refreshToken: string
  refreshTokenExpiresIn: number | string
}

/** 메인 메뉴 스와이퍼 항목 한 건 */
export interface SwiperMenuItem {
  /** 없으면 고정 메뉴다 */
  contentName?: string
  menuName: string
  iconName: string
  /** 비어 있으면 라우터 이동이 아니라 자체 분기로 처리한다 */
  menuUrl: string
  /** `N` 배지 표시 */
  isNew?: boolean
}
