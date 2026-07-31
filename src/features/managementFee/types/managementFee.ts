/** 세대 정보. 납부 상태·자동이체·조회 기간이 여기 있다 */
export interface ManagementFeeHouseHolder {
  periodStartDate?: string
  periodEndDate?: string
  /** `'Y'`면 납부완료. **이진 판정이라 부분납부 같은 상태가 없다** */
  paymentFlag?: string
  /** ⚠️ 화면은 `!== 'N'`으로 판정한다 — 필드가 없으면 자동이체 칩이 뜬다 (MF-Q5) */
  autoTransfer?: string
}

export interface ManagementFeeImposeAmount {
  imposeAmount?: number
  /** 메인 카드만 쓴다 (`main.md`) */
  previousMonthComparedAmount?: number
}

export interface ManagementFeeBillInfo {
  /** 납기내 금액 = 당월부과액 + 미납금 + 미납연체료 */
  beforeDeliveryAmountSum?: number
  unpaidAmount?: number
  unpaidLatefee?: number
  afterDeliveryAmountSum?: number
}

export interface ManagementFeeItemDetail {
  itemName?: string
  thisMonthAmount?: number
  /** ⚠️ 서버 필드명이 길고 `Incre`/`Decre`가 축약형이다. **그대로 쓴다** */
  prevMonthComparedIncreOrDecreAmount?: number | null
}

export interface ManagementFeeReduction {
  name?: string
  amount?: number
}

/** 고지서 (#147) */
export interface ManagementFeeBillData {
  houseHolder?: ManagementFeeHouseHolder
  imposeAmount?: ManagementFeeImposeAmount
  billInfo?: ManagementFeeBillInfo
  itemDetails?: ManagementFeeItemDetail[]
  reductions?: ManagementFeeReduction[]
}

/**
 * 조회 가능 부과년월 (#146).
 *
 * ⚠️ **응답 필드가 `imposeYearmonths`다** — `Y`가 소문자다. 서버 계약이므로 그대로 쓴다.
 */
export interface ImposeYearMonthsData {
  imposeYearmonths?: string[]
}
