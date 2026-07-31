import { ROUTE_PATH } from '@/shared/constants/routes'
import type { ChipColor } from '@/shared/types/chip'

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
  /** PK3 즐겨찾기 차량 */
  bookmark: [
    { key: 'nickName', label: '별칭' },
    { key: 'phone', label: '연락처' },
  ],
  /** PK4 항상허용 차량. **즐겨찾기와 필드가 겹치지 않는다** */
  alwaysAllow: [
    { key: 'phone', label: '연락처' },
    { key: 'memo', label: '메모' },
  ],
  /** PK8 입출차 내역. 마일리지 내역에서 `사용한 마일리지`만 빠진 구성이다 */
  inOutHistory: [
    { key: 'inParkingTime', label: '입차시간' },
    { key: 'outParkingTime', label: '출차시간' },
    { key: 'parkingMinutes', label: '총 주차시간' },
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

// ── 차량관리 (PK3~PK7) ──────────────────────────────────────────────────────

/**
 * 즐겨찾기/항상허용 구분. **경로 문자열로 판정한다**(라우트 파라미터가 아니다).
 * `label`이 화면 문구이자 레거시의 분기 조건이라 함께 둔다.
 */
export const CAR_MANAGEMENT_TYPE = {
  BOOKMARK: { key: 'bookmark', label: '즐겨찾기' },
  ALWAYS_ALLOW: { key: 'alwaysAllow', label: '항상허용' },
} as const

export type CarManagementTypeKey = 'bookmark' | 'alwaysAllow'

/** 차량 삭제 확인 모달. **`title`이 없다** — 본문만 있는 모달이다 */
export const CAR_INFO_DELETE_MODAL_DATA = {
  description: '차량정보를 삭제하시겠어요?',
  firstButton: '취소',
  secondButton: '삭제',
}

/** 카드 클릭 드로어의 버튼. `수정`은 즐겨찾기에만 있다 (R-1) */
export const CAR_MANAGEMENT_DRAWER_LABEL = {
  EDIT: '수정',
  DELETE: '삭제',
} as const

/** 월패드 알림 라디오 (PK6 전용) */
export const PARKING_WALL_PAD_ALARM_INPUT = [
  { label: '예', key: true },
  { label: '아니오', key: false },
] as const

export const PARKING_WALL_PAD_ALARM_DESCRIPTION = [
  '예 선택 시, 해당 차량 입출차 시 세대 내 월패드로 알림이 옵니다.',
  '마이페이지 > 알림 설정 > 입출차알림이 켜져있어야 알림이 수신됩니다.',
] as const

/**
 * 폼 placeholder.
 *
 * ⚠️ **차량번호 문구가 방문예약(PK12)과 다르다** — 여기는 `예)10서1234`,
 * 방문예약은 `차량번호 예)123가1234, 서울12가1234`다. 같은 필드인데 갈린다
 * (`deferred.md` 「오타·표기」).
 */
export const CAR_FORM_PLACEHOLDER = {
  carNum: '차량번호를 입력하세요. 예)10서1234',
  nickName: '별칭을 입력하세요',
  phone: '연락처를 입력하세요',
  /** 드로어 제목으로도 쓰인다. 방문예약은 `방문 목적을 선택하세요`(해요체가 아니다) */
  visitPurpose: '방문 목적을 선택해주세요',
  memo: '메모를 입력하세요\n(최대 공백 포함 50자 이내)',
} as const

/** 입력 길이 제한. 스키마가 아니라 `maxlength`로 막는 값들이다 */
export const CAR_FORM_MAX_LENGTH = {
  /** 스키마에는 `.max(10)`이 없다 — UI로만 막는다 (`deferred.md`) */
  nickName: 10,
  phone: 13,
  memo: 50,
} as const

/** 방문목적 드로어 문구 */
export const VISIT_PURPOSE_MESSAGE = {
  error: ['방문 목적을 불러올 수 없습니다', '잠시 후 다시 시도해주세요'],
  empty: ['방문목적 목록이 비어있습니다', '관리사무소에 문의해주세요'],
} as const

/** 차량관리 토스트. **문구가 제각각이다** — 항상허용 등록만 대상까지 밝힌다 */
export const CAR_TOAST_MESSAGE = {
  bookmarkCreated: '등록되었습니다',
  alwaysAllowCreated: '항상허용 차량이 등록되었습니다',
  updated: '수정되었습니다',
  deleted: '삭제되었습니다',
} as const

/**
 * 🔴 **mutation마다 전용 문구로 바꿔주는 코드 집합이 다르다.**
 * 목록에 없는 코드는 **서버 원문 `message`가 그대로 보인다** — 레거시가 훅마다
 * `switch`를 따로 써서 생긴 차이다. 한 표로 합치면 수정·삭제 화면의 문구가 바뀐다.
 */
export const CAR_HANDLED_ERROR_CODES = {
  postBookmark: ['BOOKMARK_DUPLICATED'],
  postAlwaysAllow: [
    'REGULAR_EXISTS',
    'ALWAYS_ALLOW_EXISTS',
    'RESERVATION_EXISTS',
    'BLACK_LIST_EXISTS',
    'REJECT_EXISTS',
    'GUARD_NETWORK_ERROR',
  ],
  /** 수정·즐겨찾기 삭제는 전용 분기가 **없다** */
  none: [],
  deleteAlwaysAllow: ['ALWAYS_ALLOW_NOT_FOUND', 'GUARD_NETWORK_ERROR'],
} as const

// ── 입출차·거부 (PK8~PK10) ──────────────────────────────────────────────────

/**
 * 차량 유형별 라벨과 칩 색. 레거시 `CAR_TYPE` 8종.
 *
 * ⚠️ **여기 없는 코드가 오면 라벨도 색도 `undefined`가 된다** — 칩이 글자 없이 색 없이
 * 렌더된다. 레거시 `findCarType`이 그렇다. 서버가 새 유형을 추가하면 눈에 띈다.
 */
export const CAR_TYPE_INFO: Record<string, { label: string; chipColor: ChipColor }> = {
  REGULAR: { label: '정기차량', chipColor: 'green' },
  REGULAR_RESIDENT: { label: '입주민', chipColor: 'green' },
  RESERVATION: { label: '방문예약', chipColor: 'gray' },
  GENERAL: { label: '일반방문', chipColor: 'gray' },
  ALWAYS_ALLOW: { label: '항상허용', chipColor: 'blue' },
  UNKNOWN: { label: '미등록', chipColor: 'purple' },
  REJECT: { label: '거부', chipColor: 'red' },
  BLACKLIST: { label: '블랙리스트', chipColor: 'red' },
}

/** PK9 상세의 필드와 순서 */
export const IN_OUT_HISTORY_DETAIL_FIELD = [
  { key: 'carNum', label: '차량번호' },
  { key: 'inParkingTime', label: '입차시간' },
  { key: 'outParkingTime', label: '출차시간' },
  { key: 'parkingMinutes', label: '총 주차시간' },
  { key: 'phone', label: '연락처' },
  { key: 'visitPurpose', label: '방문목적' },
  { key: 'carType', label: '차량유형' },
] as const

export type InOutDetailFieldKey = (typeof IN_OUT_HISTORY_DETAIL_FIELD)[number]['key']

/** PK9 거부 확인 모달 */
export const PARKING_REJECT_MODAL_DATA = {
  title: '주차를 거부하시겠습니까?',
  description: '거부시, 마일리지 차감이 되지 않습니다.',
  firstButton: '취소',
  secondButton: '거부하기',
}

export const IN_OUT_LIST_MESSAGE = {
  error: '입출차 내역을 불러올 수 없습니다',
  empty: '입출차 내역이 없습니다',
} as const

export const IN_OUT_DETAIL_ERROR_TEXT = [
  '입출차 상세 정보를 불러올 수 없습니다',
  '잠시 후 다시 시도해주세요',
] as const

export const NO_CAR_IMAGE_TEXT = '차량 이미지 없음'

/** PK10 거부 사유 상한. **`maxlength`가 아니라 zod가 막는다** — 넘겨 입력할 수 있다 */
export const REJECT_REASON_MAX_LENGTH = 100

export const REJECT_TOAST_MESSAGE = '거부되었습니다'

/** PK10 거부 실패 시 전용 문구. **띄어쓰기 오류는 레거시 그대로다** */
export const REJECT_ERROR_CODES = [
  'REJECT_ALREADY_EXISTS',
  'CAR_TYPE_NOT_ALLOWED',
  'REJECT_HOUSE_HOLD_NOT_MATCH',
  'GUARD_NETWORK_ERROR',
] as const

/** 위 코드에 대응하는 문구 */
export const CAR_ERROR_MESSAGE: Record<string, string> = {
  REJECT_ALREADY_EXISTS: '이미 거부된 차량이 존재합니다.',
  CAR_TYPE_NOT_ALLOWED: '거부 할 수 없는 차량 종류 입니다.',
  REJECT_HOUSE_HOLD_NOT_MATCH: '거부 요청한 세대 정보가 일치 하지 않습니다.',
  BOOKMARK_DUPLICATED: '이미 등록된 즐겨찾기 차량입니다.',
  REGULAR_EXISTS: '해당 단지에 이미 등록된 정기권 차량입니다.',
  ALWAYS_ALLOW_EXISTS: '해당 단지에 이미 등록된 항상허용 차량입니다.',
  RESERVATION_EXISTS: '해당 단지에 이미 방문예약된 차량입니다.',
  BLACK_LIST_EXISTS: '블랙리스트로 등록된 차량입니다.',
  REJECT_EXISTS: '거절된 차량입니다.',
  ALWAYS_ALLOW_NOT_FOUND: '항상허용 차량을 찾을 수 없습니다.',
  GUARD_NETWORK_ERROR: '단지 네트워크 장애입니다. 관리사무소에 문의해주세요.',
}
