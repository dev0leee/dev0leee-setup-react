import { ROUTE_PATH } from '@/shared/constants/routes'

/**
 * 카드 1건이 보여줄 필드. 레거시 `constants/domain/parking.js`의 `CARD_ITEM_FIELD`.
 * **목록마다 필드 구성이 다르다** — 순서까지 그대로다.
 */
export const CARD_ITEM_FIELD = {
  /** PK15 정기권 차량 */
  regular: [
    { key: 'name', label: '차주 이름' },
    { key: 'phone', label: '연락처' },
  ],
  /** PK2 마일리지 내역 */
  mileageHistory: [
    { key: 'inParkingTime', label: '입차시간' },
    { key: 'outParkingTime', label: '출차시간' },
    { key: 'parkingMinutes', label: '총 주차시간' },
    { key: 'useMileage', label: '사용한 마일리지' },
  ],
} as const

/** PK1 주차 정책 드로어의 필드. 순서가 화면 순서다 */
export const PARKING_POLICY_FIELD_LIST = [
  { key: 'monthBaseMileage', label: '기본 마일리지' },
  { key: 'freeParkingMinute', label: '회차 시간(분)' },
  { key: 'freeParkingTime', label: '무료 주차 시간' },
  { key: 'minuteAmount', label: '분당 금액' },
] as const

export type ParkingPolicyFieldKey = (typeof PARKING_POLICY_FIELD_LIST)[number]['key']

/**
 * 요일별 무료 시간의 노출 순서와 라벨. **월요일 시작 고정**이다 —
 * 서버 응답 순서를 쓰지 않고 이 순서로 다시 세운다.
 */
export const DAY_OF_WEEK_LIST = [
  { value: 'MONDAY', label: '월' },
  { value: 'TUESDAY', label: '화' },
  { value: 'WEDNESDAY', label: '수' },
  { value: 'THURSDAY', label: '목' },
  { value: 'FRIDAY', label: '금' },
  { value: 'SATURDAY', label: '토' },
  { value: 'SUNDAY', label: '일' },
] as const

/** `TIME_RANGE`는 시각을 직접 조합하므로 라벨이 없다 */
export const DAY_FREE_TYPE_LABEL: Record<string, string> = {
  NONE: '무료 시간 없음',
  ALL_DAY: '종일 무료',
}

/**
 * PK1 메뉴 그리드. **순서가 화면 순서이자 마일리지 한도 제한 단지의 절단 기준**이다 —
 * 앞 3개만 남기고 `항상허용 차량`을 버린다 (`parking.md` PK1).
 */
export const PARKING_MENU_LIST = [
  {
    name: '주차 방문예약',
    url: ROUTE_PATH.PARKING_RESERVATION,
    icon: '/assets/icons/icon-parking-reservation.svg',
  },
  {
    name: '입출차 내역',
    url: ROUTE_PATH.PARKING_INOUT_HISTORY,
    icon: '/assets/icons/icon-parking-inout.svg',
  },
  {
    name: '즐겨찾기 차량',
    url: ROUTE_PATH.PARKING_CAR_BOOKMARK_LIST,
    icon: '/assets/icons/icon-parking-bookmark.svg',
  },
  {
    name: '항상허용 차량',
    url: ROUTE_PATH.PARKING_CAR_ALWAYS_ALLOW_LIST,
    icon: '/assets/icons/icon-parking-always.svg',
  },
] as const

/** 흔들림 애니메이션이 붙는 메뉴. 레거시가 이름으로 판별한다 */
export const SHAKE_MENU_NAME = '주차 방문예약'

/** 타일 아이콘이 흔들리기 시작하는 지연(ms). 이후 `shake-animation`이 0.6초 × 2회 */
export const MENU_SHAKE_DELAY_MS = 300

/** 진행바가 차오르기 시작하는 지연(ms). 이후 CSS transition이 1초에 걸쳐 채운다 */
export const PROGRESS_ANIMATION_DELAY_MS = 100

/**
 * 목록 문구. **에러 1행만 화면마다 다르고 2행은 `CardList`가 고정**으로 붙인다.
 */
export const PARKING_LIST_MESSAGE = {
  mileageHistory: {
    error: '마일리지 내역을 불러올 수 없습니다',
    empty: '마일리지 사용 내역이 없습니다',
  },
  regularCar: {
    error: '정기차량 목록을 불러올 수 없습니다',
    empty: '등록된 정기차량이 없습니다',
  },
} as const

/** PK1 잔여 마일리지 조회 실패 안내. 2줄로 끊어 보여준다 */
export const MILEAGE_SUMMARY_ERROR_TEXT = [
  '주차 마일리지를 불러올 수 없습니다.',
  '잠시 후 다시 시도해주세요.',
] as const

/** 주차 정책 조회 실패 안내. **마일리지 쪽과 달리 마침표가 없다** — 레거시 그대로다 */
export const PARKING_POLICY_ERROR_TEXT = [
  '정보를 불러올 수 없습니다',
  '잠시 후 다시 시도해주세요',
] as const
