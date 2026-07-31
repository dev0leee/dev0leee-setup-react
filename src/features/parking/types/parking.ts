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

/** 즐겨찾기 차량 1건 (PK3) */
export interface BookmarkCar {
  uuid: string
  carNum?: string
  /** 별칭 */
  nickName?: string | null
  phone?: string | null
}

/**
 * 항상허용 차량 1건 (PK4).
 *
 * ⚠️ **삭제할 때 `uuid`만 보낸다** — 즐겨찾기는 `{residentUuid, bookmarkUuid}` 두 개다.
 * 서버 경로 설계가 비대칭이다.
 */
export interface AlwaysAllowCar {
  uuid: string
  carNum?: string
  phone?: string | null
  memo?: string | null
  /** 월패드 알림 대상인지 */
  notificationFlag?: boolean
}

/**
 * 목록 카드 1건. 즐겨찾기와 항상허용을 **한 컴포넌트가 그리므로** 두 모양을 합쳐 둔다.
 * 어느 필드를 보여줄지는 `CARD_ITEM_FIELD`가 정한다.
 */
export type CarListItem = BookmarkCar & Omit<AlwaysAllowCar, 'uuid' | 'carNum' | 'phone'>

/** 방문목적 1건. 폼은 **객체 통째로** 값에 담고 전송 직전에 `uuid`만 꺼낸다 */
export interface VisitPurpose {
  uuid: string
  name: string
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
