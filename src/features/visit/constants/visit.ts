import type { LobbyPhoneNavItem } from '@/features/visit/types/visit'
import { ROUTE_PATH } from '@/shared/constants/routes'

/** V2 키오스크 메뉴 2개. `action`이 어느 모달을 열지 정한다 */
export const KIOSK_PASSWORD_MENU = [
  { label: '현재 비밀번호 확인', action: 'check' },
  { label: '비밀번호 변경하기', action: 'change' },
] as const

export type KioskPasswordAction = (typeof KIOSK_PASSWORD_MENU)[number]['action']

/** 비밀번호는 4자리다. 입력 칸도 4개 */
export const PASSWORD_LENGTH = 4

/** 비밀번호 변경 모달 제목. **화면마다 다르고 나머지는 같다** */
export const PASSWORD_MODAL_TITLE = {
  kiosk: '키오스크 비밀번호 변경',
  lobbyPhone: '세대 비밀번호 변경',
} as const

/**
 * ⚠️ **모달 안내문이 `세대 비밀번호`로 고정이다.** 키오스크 비밀번호를 바꿀 때도
 * 그렇게 나온다 — 제목만 바뀌고 본문은 그대로다. 레거시 그대로 옮긴다.
 */
export const PASSWORD_MODAL_GUIDE = ['세대 비밀번호', '숫자 4자리를 입력하세요'] as const

export const PASSWORD_CHANGED_TOAST = '변경되었습니다'

/**
 * 키오스크 비밀번호 변경 실패 문구.
 *
 * ⚠️ **로비폰 세대 비밀번호에는 이 분기가 없다** — 세대원이 시도하면 서버 원문이 그대로
 * 뜬다. 같은 모달을 쓰는데 에러 처리가 다르다 (`visit.md` V-Q5). 비대칭을 유지한다.
 */
export const KIOSK_PASSWORD_ERROR_CODES: readonly string[] = ['NOT_HEAD_AUTHORITY']

export const KIOSK_PASSWORD_ERROR_MESSAGE: Record<string, string> = {
  NOT_HEAD_AUTHORITY: '세대주만 비밀번호 변경이 가능합니다.',
}

/** SIP 연결 상태 칩 3종. `undefined`(웹 브라우저)면 `정보없음`이다 */
export const SIP_STATE_CHIP = {
  unknown: { label: '정보없음', chipColor: 'orange' },
  on: { label: '정상', chipColor: 'deepGreen' },
  off: { label: '오류', chipColor: 'deepRed' },
} as const

/** 경비 호출 디바운스(ms). 연타로 여러 번 걸리는 것을 막는다 */
export const GUARD_CALL_DEBOUNCE_MS = 300

/**
 * V3 로비폰 메뉴 3종.
 *
 * ⚠️ **`faceRegister`만 `안면인식` 구독 단지에서 보인다.** 나머지 둘은 이 화면에 들어온
 * 시점에 이미 `로비폰` 구독이 확인됐다고 보고 추가 검사를 하지 않는다(레거시 주석).
 */
export const LOBBY_PHONE_NAV_LIST: LobbyPhoneNavItem[] = [
  {
    key: 'tempPassword',
    title: '임시 비밀번호',
    description: '공동현관을 출입할 수 있는 임시 비밀번호입니다.',
    icon: '/assets/icons/TempPasswordIcon.svg',
    iconAlt: '임시비밀번호 아이콘',
    iconClassName: 'h-[44px] w-[44px]',
    path: ROUTE_PATH.VISIT_TEMP_PASSWORD_LIST,
  },
  {
    key: 'qr',
    title: '1회용 출입 QR코드',
    description: '공동현관을 출입할 수 있는 1회용 QR입니다.',
    icon: '/assets/icons/QR.svg',
    iconAlt: 'QR 아이콘',
    iconClassName: 'h-[52px] w-[52px]',
    path: ROUTE_PATH.VISIT_QR,
  },
  {
    key: 'faceRegister',
    title: '안면인식 얼굴 등록',
    description: '공동현관 출입용 얼굴을 등록합니다.',
    icon: '/assets/icons/Capa.svg',
    iconAlt: '안면인식 아이콘',
    iconClassName: 'h-[44px] w-[44px]',
    path: ROUTE_PATH.VISIT_FACE_REGISTER_MANAGEMENT,
  },
]

/** 안면인식 메뉴 노출 판정에 쓰는 구독 서비스명 */
export const FACE_RECOG_CONTENT_NAME = '안면인식'

// ── 임시 비밀번호 · QR (V4~V6) ──────────────────────────────────────────────

/** QR 조회 게이트에 쓰는 구독 서비스명 */
export const LOBBY_PHONE_CONTENT_NAME = '로비폰'

/** 세대당 만들 수 있는 임시 비밀번호 개수 */
export const MAX_TEMP_PASSWORD_COUNT = 10

export const TEMP_PASSWORD_MESSAGE = {
  guide: '임시 비밀번호는 세대당 10개까지 생성할 수 있습니다.',
  empty: '임시 비밀번호가 없습니다.',
  copied: '클립보드에 복사되었습니다.',
  deleted: '삭제되었습니다',
  created: '생성되었습니다.',
  limit: '최대 10개까지 생성할 수 있습니다.',
  listError: '임시 비밀번호 리스트 조회에 실패하였습니다.',
  /** 생성자가 비어 있으면 관리사무소가 만든 것이다 */
  adminCreator: '관리자',
} as const

/** 유형 배지. 일회용은 회색, 기간형은 파랑 */
export const TEMP_PASSWORD_BADGE = {
  TEMPOTP: { label: '일회용', className: 'bg-neutral-b-gray-700' },
  TEMPTERM: { label: '기간형', className: 'bg-blue-s-info-500' },
} as const

/** V5 탭별 안내문 2줄 */
export const TEMP_PASSWORD_TAB_GUIDE = {
  TEMPOTP: ['공동현관 출입을 위해', '한번만 사용할 수 있는 임시 비밀번호 입니다.'],
  TEMPTERM: ['기간 내에 여러번 사용할 수 있는', '임시 비밀번호입니다.'],
} as const

/**
 * 기간 선택 버튼.
 *
 * ⚠️ **`1일`을 고르면 종료일이 `오늘 + 1일`(내일)이 된다.** "1일짜리"라면 오늘이어야 할
 * 수도 있는데 서버 해석에 달렸다 (`visit.md` V-Q6). 레거시 계산 그대로 옮긴다.
 */
export const TEMP_PASSWORD_PERIOD_OPTIONS = [
  { value: '1', label: '1일' },
  { value: '2', label: '2일' },
  { value: '3', label: '3일' },
  { value: '7', label: '1주' },
  { value: 'directSelection', label: '직접 선택' },
] as const

/**
 * 일회용 비밀번호의 유효기간. **오늘 + 13일**로 고정된다(합쳐서 14일).
 * 기간형 달력의 상한도 같은 값이다.
 */
export const TEMP_PASSWORD_MAX_DAYS_OFFSET = 13

export const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'] as const

/** QR 캔버스 한 변(px). 레거시 값 그대로다 */
export const QR_CANVAS_SIZE = 246
