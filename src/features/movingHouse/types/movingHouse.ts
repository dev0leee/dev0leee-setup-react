/** 예약 상태 3종. 레거시 `MOVING_HOUSE_STATUS_LIST`의 `status` 값 */
export const MOVING_HOUSE_STATUS = {
  WAITING: 'WAITING',
  CONFIRMED: 'CONFIRMED',
  CANCELED: 'CANCELED',
} as const

export type MovingHouseStatus = (typeof MOVING_HOUSE_STATUS)[keyof typeof MOVING_HOUSE_STATUS]

/** 이사 유형 2종 */
export const MOVING_HOUSE_TYPE = {
  MOVE_IN: 'MOVE_IN',
  MOVE_OUT: 'MOVE_OUT',
} as const

export type MovingHouseType = (typeof MOVING_HOUSE_TYPE)[keyof typeof MOVING_HOUSE_TYPE]

/**
 * 목록 항목 (#124).
 *
 * ⚠️ **`moveDate`·`moveTime` 필드가 응답에 없다.** 화면의 `이사 예정일`은
 * `moveStartDateTime`에서, `이사 시간`은 `moveReservationTimeName` + 시작·종료 시각에서
 * 만들어진다 (`moving-house.md` MH1 `renderFieldValue`).
 */
export interface MovingHouseListItemData {
  uuid: string
  receiptNum?: string
  moveType?: string
  moveReservationStatus?: MovingHouseStatus
  moveReservationTimeName?: string
  moveStartDateTime?: string
  moveEndDateTime?: string
  createdDate?: string
}

/** 예약 상세 (#125) */
export interface MovingHouseDetailData {
  uuid?: string
  receiptNum?: string
  createdDate?: string
  moveReservationStatus?: MovingHouseStatus
  moveType?: string
  emergencyPhone?: string
  moveReservationTimeName?: string
  moveStartDateTime?: string
  moveEndDateTime?: string
  moveReservationPrice?: number
  memo?: string
  /** `CANCELED`일 때만 의미가 있다 */
  cancelReason?: string
}

/**
 * 단지 설정 (#127). **이 도메인에서 가장 중요한 응답이다** —
 * `chargeFlag` 하나가 MH2·MH3·MH4의 6곳을 동시에 바꾼다.
 */
export interface MovingHouseSettingData {
  /** 사용료를 받는 단지인가 */
  chargeFlag?: boolean
  moveReservationPrice?: number
  depositBank?: string
  depositAccountHolder?: string
  depositAccount?: string
  /** 신축 입주 기간. `YYYY-MM-DD` 문자열이다 */
  newOccupancyStartDate?: string
  /** ⚠️ **활성 판정은 이 값만 본다** (`moving-house.md` §2) */
  newOccupancyEndDate?: string
}

/**
 * 예약 시간대 슬롯 (#128).
 *
 * ⚠️ **`reservableFlag`는 `=== false`로만 막는다.** 필드가 없으면 예약 가능이다.
 */
export interface MovingHouseTimeSlotData {
  uuid: string
  name?: string
  /** `HH:mm:ss` */
  startTime?: string
  endTime?: string
  reservableFlag?: boolean
}

/** 휴무일 (#129). **단일 날짜가 아니라 범위 배열**이고 양끝을 포함한다 */
export interface MovingHouseHolidayData {
  startDate: string
  endDate: string
}

/**
 * MH3 → MH4로 넘기는 작성 내용.
 *
 * ⚠️ **`moveTime`은 슬롯 uuid**다. 제출 시 `moveReservationTimeUuid`로 이름이 바뀐다.
 * ⚠️ **`moveReservationPrice`는 폼 필드가 아니다** — MH3이 설정값을 합쳐서 저장하고
 * MH4가 `사용료` 행에 그대로 쓴다.
 */
export interface MovingHouseFormData {
  moveType: string
  moveDate: Date
  moveTime: string
  depositorName?: string
  emergencyPhone?: string
  memo?: string
  moveReservationPrice?: number
}
