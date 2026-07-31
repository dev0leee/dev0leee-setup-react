/**
 * A-PASS 상수. 레거시 `constants/domain/apass.js` + 화면 인라인 값.
 *
 * 🔴 **`locAlawaysOn`·`btTransmitt`는 오타다.** 앱이 이 철자로 보내기로 합의돼 있고
 * **자산 파일명까지 같은 오타**다 (`deferred.md` D-49·D-50). 고치려면 앱과 함께 바꿔야 한다.
 */
export const APASS_PERMISSION_TYPE = {
  BLUETOOTH: 'bluetooth',
  GPS: 'gps',
  LOCATION_ALWAYS_ON: 'locAlawaysOn',
  BT_TRANSMIT: 'btTransmitt',
} as const

export type ApassPermissionType = (typeof APASS_PERMISSION_TYPE)[keyof typeof APASS_PERMISSION_TYPE]

/**
 * 권한 항목별 아이콘. `on`/`off` 두 벌이고 alt 접두가 다르다.
 * **파일명이 오타 상수를 그대로 쓴다** (`locAlawaysOn.svg`·`btTransmittOn.svg`).
 */
export const APASS_PERMISSION_ICON: Record<string, { on: string; off: string; alt: string }> = {
  [APASS_PERMISSION_TYPE.BLUETOOTH]: {
    on: '/assets/icons/aPass/bluetoothOn.svg',
    off: '/assets/icons/aPass/bluetoothOff.svg',
    alt: '블루투스',
  },
  [APASS_PERMISSION_TYPE.GPS]: {
    on: '/assets/icons/aPass/markOn.svg',
    off: '/assets/icons/aPass/markOff.svg',
    alt: 'GPS',
  },
  [APASS_PERMISSION_TYPE.LOCATION_ALWAYS_ON]: {
    on: '/assets/icons/aPass/locAlawaysOn.svg',
    off: '/assets/icons/aPass/locAlawaysOff.svg',
    alt: '위치 항상허용',
  },
  [APASS_PERMISSION_TYPE.BT_TRANSMIT]: {
    on: '/assets/icons/aPass/btTransmittOn.svg',
    off: '/assets/icons/aPass/btTransmittOff.svg',
    alt: '단말기 지원',
  },
}

/** ⚠️ **alt가 상태를 구분하지 않는다** — 둘 다 `선택 아이콘`이다. 레거시 그대로 */
export const APASS_CHECK_ICON = {
  on: '/assets/icons/FillCheckCircle.svg',
  off: '/assets/icons/CheckCircle.svg',
  alt: '선택 아이콘',
} as const

/** 토글 탭 디바운스(ms). 연타로 여러 번 나가지 않게 한다 */
export const APASS_TOGGLE_DEBOUNCE_MS = 300

/** 앱 응답을 서버에 반영하기 전 디바운스(ms) */
export const APASS_UPDATE_DEBOUNCE_MS = 1000

/**
 * 앱이 응답하지 않을 때 로딩을 푸는 시각(ms).
 * ✅ **이 시점에 전역 플래그도 함께 내린다** — 레거시는 로컬 로딩만 풀어
 * 뒤로가기가 영구히 막혔다 (AP-Q3 결정).
 */
export const APASS_LOADING_TIMEOUT_MS = 7000
