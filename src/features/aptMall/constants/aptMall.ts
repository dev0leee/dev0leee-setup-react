import {
  APT_MALL_ORDER_STATE,
  APT_MALL_ORDER_TYPE,
  type AptMallOrderState,
  type AptMallOrderType,
} from '@/features/aptMall/types/aptMall'
import type { ChipColor } from '@/shared/types/chip'
import type { ModalData } from '@/shared/types/overlay'

/**
 * 아파트몰 상수. 레거시 `constants/domain/aptMall.js`(39줄) 이식.
 *
 * ⚠️ **이 도메인은 실질적으로 "주말조식" 전용이다.** `APT_MALL_LIST`에 몰이 하나뿐이고
 * 예약 위저드는 이름으로 그 몰을 되찾아 쓴다.
 */
export const STATUS_LIST: { status: AptMallOrderState; label: string; color: ChipColor }[] = [
  { status: APT_MALL_ORDER_STATE.RESERVATION, label: '예약완료', color: 'blue' },
  { status: APT_MALL_ORDER_STATE.CANCELED, label: '취소', color: 'red' },
]

/** ⚠️ **`DELIVERY`가 있지만 선택 UI(`TYPE_DATA`)에는 없다** — 표시 전용이다 */
export const MEAL_TYPE: Record<AptMallOrderType, string> = {
  [APT_MALL_ORDER_TYPE.VISIT]: '방문식사',
  [APT_MALL_ORDER_TYPE.TAKEOUT]: '포장',
  [APT_MALL_ORDER_TYPE.DELIVERY]: '배달',
}

/**
 * 목록 카드의 3행.
 *
 * ⚠️ **`포장` 예약에도 `인원 수` 행이 그대로 보인다**(값은 `-`). 확인 단계(AM7)는
 * 걸러내는데 목록은 걸러내지 않는다 — 비대칭을 그대로 옮겼다.
 */
export const LIST_ITEM_FIELD = [
  { key: 'aptMallOrderType', label: '예약유형' },
  { key: 'orderDateTime', label: '이용예정 일자' },
  { key: 'personCount', label: '인원 수' },
] as const

export type AptMallOrderFieldKey = (typeof DETAIL_PAGE_INFO_FIELD)[number]['key']

/** 상세 `예약 정보` 4행. 목록 3행 + `고객 요청사항` */
export const DETAIL_PAGE_INFO_FIELD = [
  { key: 'aptMallOrderType', label: '예약유형' },
  { key: 'orderDateTime', label: '이용예정 일자' },
  { key: 'personCount', label: '인원 수' },
  { key: 'orderNote', label: '고객 요청사항' },
] as const

/** ⚠️ **`취소`가 두 번째 버튼**이다(빨강). 순서를 바꾸지 않는다 */
export const DETAIL_CANCEL_MODAL_DATA: ModalData = {
  title: '예약취소',
  description: '취소하시겠습니까?',
  firstButton: '닫기',
  secondButton: '취소',
}

/** 예약 유형 선택 카드 2종 (AM4). **`DELIVERY`는 없다** */
export const TYPE_DATA = [
  { label: '방문식사', icon: '/assets/icons/Meal.svg', key: APT_MALL_ORDER_TYPE.VISIT },
  { label: '포장', icon: '/assets/icons/TakeOut.svg', key: APT_MALL_ORDER_TYPE.TAKEOUT },
] as const

/** 몰 아이콘 매핑. **`주말조식` 하나뿐이다** — 다른 몰이 오면 아이콘이 깨진다 */
export const APT_MALL_LIST = [
  { aptMallName: '주말조식', icon: '/assets/icons/AptMallMeal.svg' },
] as const

/** 위저드가 이름으로 되찾는 몰. 이 문자열 하나에 도메인 전체가 묶여 있다 */
export const WEEKEND_MEAL_NAME = '주말조식'

export const APT_MALL_MESSAGE = {
  listEmpty: '예약 내역이 없습니다',
  reserveButton: '예약하기',
  infoTitle: '예약 정보',
  paymentTitle: '결제금액',
  totalPrice: '총 결제 금액',
  cancelButton: '취소하기',
  cancelDone: '취소 완료',
  canceledAt: '취소일시',
  canceledReason: '취소사유',
} as const
