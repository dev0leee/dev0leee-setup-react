import { MAIN_CARD_ID, type MainCardId } from '@/features/main/types/card'

/**
 * 카드 배치 프리셋. 레거시 `useMainCardLayout.js`의 상수 2개를 그대로 옮겼다.
 * **숫자 하나만 달라도 화면이 달라지므로 값을 손대지 않는다.**
 */

/**
 * 카드 **개수별** 노출 순서. 개수가 바뀌면 순서 자체가 바뀐다 —
 * 예: A-PASS가 5개일 때는 맨 앞, 4개일 때는 네 번째다.
 */
export const CARD_ORDER_PRESETS: Record<number, MainCardId[]> = {
  5: ['apass', 'parkingMileage', 'managementFee', 'visitorPass', 'reservation'],
  4: ['managementFee', 'parkingMileage', 'reservation', 'apass', 'visitorPass'],
  3: ['apass', 'managementFee', 'visitorPass', 'parkingMileage', 'reservation'],
  2: ['apass', 'reservation', 'visitorPass', 'managementFee', 'parkingMileage'],
  1: ['apass', 'managementFee', 'parkingMileage', 'visitorPass', 'reservation'],
}

/**
 * 카드 4개 + **관리비 미사용**일 때만 쓰는 특수 프리셋.
 *
 * ⚠️ 목록에 `managementFee`가 있지만 그 카드는 애초에 노출되지 않는다 — 남은 4장의
 * **상대 순서만** 바꾸는 효과다. 기본 4개 프리셋과 비교하면 A-PASS가 4번째 → 1번째로 온다.
 */
export const CARD_ORDER_PRESET_WITHOUT_MANAGEMENT_FEE: MainCardId[] = [
  'managementFee',
  'apass',
  'parkingMileage',
  'reservation',
  'visitorPass',
]

/**
 * 카드 개수별 행 구조. 값은 `enabledCards`의 인덱스다.
 * **5개일 때만 중첩 배열**이고 그 자리가 세로 2장이 된다.
 */
export const LAYOUT_STRUCTURE: Record<number, (number | number[])[][]> = {
  1: [[0]],
  2: [[0, 1]],
  3: [[0, 1], [2]],
  4: [
    [0, 1],
    [2, 3],
  ],
  5: [
    [0, 1],
    [2, [3, 4]],
  ],
}

/** 카드가 하나도 없을 때의 폴백. 레거시 `LAYOUT_STRUCTURE[count] || [[0]]` */
export const FALLBACK_LAYOUT_STRUCTURE: (number | number[])[][] = [[0]]

/** 카드 공통 클래스. 너비 클래스가 뒤에 붙는다 */
export const CARD_BASE_CLASS =
  'rounded-lg border border-defaults-tertiary-border-tertiary bg-defaults-primary-background-primary p-3'

/** 1행 고정 높이. 카드가 2장 이상일 때만 적용된다 */
export const FIRST_ROW_HEIGHT_CLASS = 'h-[106px]'

export { MAIN_CARD_ID }
