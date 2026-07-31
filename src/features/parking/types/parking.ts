/**
 * 주차 정책. `GET /parking/resident/{uuid}/parking-policy?yearMonthDate=YYYY-MM-01`.
 *
 * 전 필드 optional인 것은 레거시가 전부 옵셔널 체이닝으로 읽기 때문이다 —
 * 필드 하나가 빠진 응답을 통째로 버리면 화면이 달라진다.
 */
export interface ParkingPolicy {
  mileagePolicy?: {
    /** 월 기본 마일리지(분) */
    monthBaseMileage?: number
    /** 분당 금액(원) */
    minuteAmount?: number
  }
  /** 회차 시간(분) */
  freeParkingMinute?: number
  /** `HH:mm:ss`. 시작=종료면 무료 시간대를 쓰지 않는 단지다 */
  freeParkingStartTime?: string
  freeParkingEndTime?: string
  /** 요일별 무료 시간. 없으면 위 단일 시간대로 폴백한다 */
  dayFreeTimeList?: DayFreeTime[]
}

/** 요일 무료 유형. `TIME_RANGE`는 라벨이 없고 시각을 직접 조합한다 */
export const DAY_FREE_TYPE = {
  NONE: 'NONE',
  ALL_DAY: 'ALL_DAY',
  TIME_RANGE: 'TIME_RANGE',
} as const

export interface DayFreeTime {
  /** `MONDAY` ~ `SUNDAY` */
  dayOfWeek?: string
  freeType?: string
  freeParkingStartTime?: string
  freeParkingEndTime?: string
}

/**
 * 마일리지 사용 내역 1건 (PK2).
 *
 * ⚠️ **`inParkingTime`·`outParkingTime`은 서버 문자열을 가공 없이 출력한다**
 * (`parking.md` PK-Q7). `outParkingTime`이 falsy면 `미출차` 칩이 뜬다.
 */
export interface MileageHistoryItem {
  uuid: string
  carNum?: string
  inParkingTime?: string | null
  outParkingTime?: string | null
  /** 총 주차시간(분) */
  parkingMinutes?: number | null
  /** 사용한 마일리지(분) */
  useMileage?: number | null
}

/** 정기권 차량 1건 (PK15) */
export interface RegularCar {
  uuid: string
  carNum?: string
  /** 차주 이름 */
  name?: string | null
  phone?: string | null
  /** 월패드 알림 대상인지. `hasWallPadUI`와 함께여야 칩이 보인다 */
  notificationFlag?: boolean
}
