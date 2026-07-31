/**
 * 예약 상태 2종.
 *
 * ⚠️ **표에 없는 상태가 오면 칩이 빈칸이 된다** — 레거시가 `.find()` 결과를 그대로 쓴다.
 */
export const APT_MALL_ORDER_STATE = {
  RESERVATION: 'RESERVATION',
  CANCELED: 'CANCELED',
} as const

export type AptMallOrderState = (typeof APT_MALL_ORDER_STATE)[keyof typeof APT_MALL_ORDER_STATE]

/**
 * 예약 유형 3종.
 *
 * ⚠️ **`DELIVERY`(배달)는 표시만 가능하다** — 선택 UI(`TYPE_DATA`)에 없다.
 * 서버가 배달 주문을 줄 수 있다는 뜻으로 보인다 (`apt-mall.md` AM-Q4).
 */
export const APT_MALL_ORDER_TYPE = {
  VISIT: 'VISIT',
  TAKEOUT: 'TAKEOUT',
  DELIVERY: 'DELIVERY',
} as const

export type AptMallOrderType = (typeof APT_MALL_ORDER_TYPE)[keyof typeof APT_MALL_ORDER_TYPE]

/** 몰 목록 항목 (#102) */
export interface AptMallListItemData {
  aptMallUuid: string
  aptMallName?: string
}

/**
 * 몰 상세 (#103). **위저드 전체가 이 응답에 의존한다.**
 */
export interface AptMallDetailData {
  aptMallUuid: string
  aptMallName?: string
  /** 오늘부터 몇 일 뒤까지 예약할 수 있는가 (AM9 달력 상한) */
  reservationLimitDays?: number
  /** 운영 요일 (`['SATURDAY', ...]`) — 비운영 요일을 달력에서 막는다 */
  operatingDayList?: string[]
  /** 켜져 있고 `VISIT`일 때만 `잔여 N석`이 보인다 */
  orderTimeLimitPersonFlag?: boolean
}

/** 예약 목록 항목 (#104) */
export interface AptMallMyOrderListItemData {
  aptMallOrderUuid: string
  aptMallName?: string
  aptMallOrderState?: AptMallOrderState
  aptMallOrderType?: AptMallOrderType
  orderDateTime?: string
  personCount?: number
  orderPrice?: number
}

/** 예약한 메뉴 한 줄 */
export interface AptMallOrderMenuData {
  menuName?: string
  count?: number
  /** ⚠️ **단가인지 줄 합계인지 확정되지 않았다** (`apt-mall.md` AM-Q10) */
  price?: number
}

/** 예약 상세 (#105) */
export interface AptMallMyOrderDetailData {
  aptMallOrderUuid?: string
  aptMallName?: string
  aptMallOrderState?: AptMallOrderState
  aptMallOrderType?: AptMallOrderType
  createdDate?: string
  orderDateTime?: string
  personCount?: number
  orderNote?: string
  aptMallOrderMenuList?: AptMallOrderMenuData[]
  canceledDateTime?: string
  canceledReason?: string
}

/** 예약 가능 시간대 (#107) */
export interface AptMallOrderTimeData {
  aptMallOrderTimeUuid: string
  /** `HH:mm:ss` */
  orderTime: string
  limitPersonCount?: number
  orderPersonCount?: number
}

/** 메뉴 (#108). **유형에 따라 단가 필드가 갈린다** */
export interface AptMallMenuData {
  aptMallMenuUuid: string
  aptMallMenuName?: string
  /** 방문식사 단가 */
  price?: number
  /** 포장 단가 */
  takeOutPrice?: number
  /** 켜져 있으면 수량 합이 인원 수와 정확히 같아야 한다 */
  orderMenuCountEqualsOrderPersonCountFlag?: boolean
}
