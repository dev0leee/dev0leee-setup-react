import {
  MOVING_HOUSE_STATUS,
  MOVING_HOUSE_TYPE,
  type MovingHouseStatus,
} from '@/features/movingHouse/types/movingHouse'
import type { ChipColor } from '@/shared/types/chip'
import type { ModalData } from '@/shared/types/overlay'
import type { RadioItem } from '@/shared/types/radio'

/**
 * 이사예약 상수. 레거시 `constants/domain/movingHouse.js`(111줄) 이식.
 *
 * ⚠️ **`MOVING_HOUSE_TOAST_MESSAGE.copy`(`복사 되었습니다`)는 옮기지 않았다.**
 * 계좌 복사는 토스트가 아니라 `COPIED` 모달을 띄운다 — 레거시에서 아무도 쓰지 않는
 * 죽은 상수다 (`moving-house.md` §3).
 */
export const MOVING_HOUSE_TOAST_MESSAGE = {
  delete: '취소되었습니다',
} as const

export const MOVING_HOUSE_STATUS_LIST: {
  status: MovingHouseStatus
  label: string
  color: ChipColor
}[] = [
  { status: MOVING_HOUSE_STATUS.WAITING, label: '예약대기', color: 'gray' },
  { status: MOVING_HOUSE_STATUS.CONFIRMED, label: '확정', color: 'blue' },
  { status: MOVING_HOUSE_STATUS.CANCELED, label: '취소', color: 'red' },
]

export const MOVING_HOUSE_TYPE_LIST: RadioItem[] = [
  { key: MOVING_HOUSE_TYPE.MOVE_IN, label: '전입' },
  { key: MOVING_HOUSE_TYPE.MOVE_OUT, label: '전출' },
]

/**
 * 목록 카드의 4행.
 *
 * ⚠️ **`유형`의 라벨 끝에 공백이 하나 있다** (레거시 원문). HTML이 축약하므로
 * 화면 결과는 같다 — 원문 대조를 위해 그대로 뒀다.
 */
export const MOVING_HOUSE_LIST_ITEM_FIELD = [
  { key: 'receiptNum', label: '예약번호' },
  { key: 'moveType', label: '유형 ' },
  { key: 'moveDate', label: '이사 예정일' },
  { key: 'moveTime', label: '이사 시간' },
] as const

/** MH2·MH4가 공유하는 `예약 내용` 9행. MH4는 앞 3개가 빠진다 */
export const MOVING_HOUSE_DETAIL_BASIC_CONTENT_FIELD = [
  { key: 'receiptNum', label: '예약번호' },
  { key: 'createdDate', label: '예약일시' },
  { key: 'moveReservationStatus', label: '예약상태' },
  { key: 'moveType', label: '유형' },
  { key: 'emergencyPhone', label: '비상연락처' },
  { key: 'moveDate', label: '이사 예정일' },
  { key: 'moveTime', label: '이사 시간' },
  { key: 'moveReservationPrice', label: '사용료' },
  { key: 'memo', label: '메모' },
] as const

export type MovingHouseBasicFieldKey =
  (typeof MOVING_HOUSE_DETAIL_BASIC_CONTENT_FIELD)[number]['key']

/** `chargeFlag`일 때만 보이는 무통장 입금 정보 3행 */
export const MOVING_HOUSE_DETAIL_ADDITIONAL_CONTENT_FIELD = [
  { key: 'depositBank', label: '은행' },
  { key: 'depositAccountHolder', label: '예금주' },
  { key: 'depositAccount', label: '계좌번호' },
] as const

export type MovingHouseDepositFieldKey =
  (typeof MOVING_HOUSE_DETAIL_ADDITIONAL_CONTENT_FIELD)[number]['key']

/**
 * 모달 5종. **문구는 레거시 원문 그대로다.**
 *
 * ⚠️ **`CONFIRMED`의 `관리자 사무소`는 `관리사무소` 오타다** (`moving-house.md` MH-Q2 ·
 * `deferred.md` D-101). 화면에 보이는 오탈자지만 등가 이관이라 고치지 않았다.
 *
 * ⚠️ `WAITING`의 첫 줄에 공백이 2칸이다 — HTML이 하나로 축약하므로 화면은 같다.
 */
export const MOVING_HOUSE_DETAIL_MODAL_DATA = {
  WAITING: {
    title: '이사예약 취소',
    description: ['접수를 취소하시면  접수 내역이 사라집니다.', '취소하시겠어요?'],
    firstButton: '닫기',
    secondButton: '예약취소',
  },
  CONFIRMED: {
    title: '이사예약 취소',
    description: [
      '접수가 확정되어 예약내역에서',
      '취소가 불가능합니다.',
      '관리자 사무소로 연락해 주세요.',
    ],
    firstButton: '확인',
  },
  COPIED: {
    description: '복사가 완료되었습니다',
    firstButton: '확인',
  },
  CREATED_USED_FEE: {
    title: '예약접수 완료',
    description: [
      '이사예약이 완료 되었습니다.',
      '사용료 입금완료시 순차적으로 확인 후',
      '예약을 확정합니다.',
    ],
    firstButton: '확인',
  },
  CREATED_NONE_FEE: {
    title: '예약접수 완료',
    description: ['이사예약이 완료 되었습니다.', '예약을 확정합니다.'],
    firstButton: '확인',
  },
} satisfies Record<string, ModalData>

/**
 * 취소 모달의 내용은 **예약 상태가 결정한다** — 어떤 버튼 배치를 쓸지만 화면이 정한다.
 * `CANCELED`는 취소 버튼 자체가 없어 여기 오지 않는다.
 */
export const getMovingHouseCancelModalData = ({
  status,
}: {
  status: MovingHouseStatus | undefined
}): ModalData => {
  if (status === MOVING_HOUSE_STATUS.CONFIRMED) return MOVING_HOUSE_DETAIL_MODAL_DATA.CONFIRMED

  return MOVING_HOUSE_DETAIL_MODAL_DATA.WAITING
}

/**
 * 하단 안내문 3종.
 *
 * ⚠️ **`14일`이 문구에 하드코딩돼 있다** — 서버 설정값이 아니다
 * (`moving-house.md` MH-Q3 · `deferred.md` D-99).
 */
export const MOVING_HOUSE_DETAIL_INFO_DATA = {
  NONE_FEE:
    '이사 예정일로부터 14일 전까지 예약내역에서 취소가 가능합니다. 이후 예약 취소를 원할 경우 관리사무소에 문의 부탁드립니다.',
  USED_FEE: [
    '입금 전, 이사 예정일 14일 전까지 예약내역에서 취소가 가능합니다. 이후 취소를 원하실 경우 관리사무소로 연락하시기 바랍니다.',
    '입금이 완료되어 예약 확정이 되면 예약내역에서 취소가 불가합니다. 예약 취소를 원할 경우 관리사무소에 문의 부탁드립니다.',
    '예약 취소 후 무통장 입금으로 납부한 사용료의 환불은 영업일 기준 2~3일 정도 시간이 소요될 수 있습니다.',
  ],
  CANCELED:
    '관리자에 의해 예약이 취소 되었습니다. 자세한 문의사항은 관리사무소에 연락주시기 바랍니다.',
} as const

/**
 * 신축 입주 기간 전용 에러코드 4종 (2026-05-19 백엔드 정책).
 * **맵 조회**다 — 표에 없는 코드는 서버 원문 메시지를 그대로 띄운다.
 */
export const MOVING_HOUSE_ERROR_MESSAGE: Record<string, string> = {
  MOVE_RESERVATION_HOUSEHOLD_LIMIT_EXCEEDED:
    '신축 입주 기간에는 세대당 1건만 이사 예약이 가능합니다.',
  MOVE_RESERVATION_DATE_OUT_OF_NEW_OCCUPANCY_PERIOD:
    '신축 입주 기간에는 신축 입주 종료일까지만 예약할 수 있습니다.',
  MOVE_RESERVATION_DONG_SLOT_TAKEN:
    '신축 입주 기간에는 같은 동에서 같은 날짜·시간을 1세대만 예약할 수 있습니다.',
  MOVE_RESERVATION_TIME_CLOSED: '이미 지난 시간대는 예약할 수 없습니다.',
}

/**
 * 신축 입주 안내 배너 문구.
 *
 * ⚠️ **종료일을 서버 문자열 그대로 끼운다** — 포맷 변환이 없어 `2026-08-31`로 보인다.
 */
export const buildNewOccupancyNotice = (endDate: string): string => {
  return `신축 입주 기간(~ ${endDate})까지만 이사 예약을 신청할 수 있습니다. 세대당 1건만 가능하며, 같은 동·날짜·시간대는 1세대만 예약할 수 있습니다. 이미 지난 시간대는 선택할 수 없습니다.`
}

export const MOVING_HOUSE_MESSAGE = {
  listEmpty: '이사 예약 이력이 없습니다',
  writeButton: '이사 예약하기',
  contentTitle: '예약 내용',
  depositTitle: '무통장 입금 정보',
  cancelReasonTitle: '취소 사유',
  cancelButton: '예약취소',
  confirmButton: '예약확정',
  nextButton: '다음',
  totalFee: '총 사용료',
} as const

/** MH3 입력 길이 제한 */
export const MOVING_HOUSE_MAX_LENGTH = {
  depositorName: 10,
  emergencyPhone: 13,
  memo: 200,
} as const

/**
 * 휴무일 셀 표시. 레거시 `<style scoped>`의 `:deep(.moving-house-holiday)` 이식.
 *
 * ⚠️ **빨간 글자 + 반투명 빨간 사각형 오버레이**가 "휴무일임을 알려주는" 유일한 표시다
 * (선택은 `disabled`가 따로 막는다). `#ef4444`·`rgba(239,68,68,0.15)`는 레거시 하드코딩
 * 그대로다 — 대응하는 디자인 토큰이 없다 (`deferred.md`).
 */
export const MOVING_HOUSE_HOLIDAY_CLASS =
  "relative text-[#ef4444] after:pointer-events-none after:absolute after:inset-0 after:rounded-[4px] after:bg-[rgba(239,68,68,0.15)] after:content-['']"
