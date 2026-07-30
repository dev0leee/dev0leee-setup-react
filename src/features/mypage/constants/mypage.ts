/**
 * 마이페이지 고정 문구·설정값. 레거시 화면들에 인라인돼 있던 것을 모았다.
 * **문구를 한 글자도 바꾸지 않는다** — 등가 이관의 대조 대상이다.
 */

/** 알림 토글의 요청 body 필드명. 응답에서 값을 읽는 키로도 쓰인다 */
export const ALARM_FLAG_KEY = {
  REGULAR_PUSH: 'regularPushFlag',
  EXTERNAL_PUSH: 'externalPushFlag',
  LOBBY_PHONE_PUSH: 'lobbyPhonePushFlag',
  WALL_PAD: 'wallPadParkingNotificationFlag',
  MARKETING_CONSENT: 'marketingDataConsentFlag',
  RECEIVE_ADVERTS_CONSENT: 'receiveAdvertsConsentFlag',
} as const

/** 동의 일시를 담은 필드명. 토스트에 표시한다 */
export const CONSENT_DATE_KEY = {
  MARKETING: 'marketingDataConsentLastModifiedDateTime',
  RECEIVE_ADVERTS: 'receiveAdvertsConsentLastModifiedDateTime',
} as const

/** 알림 설정 그룹 제목 */
export const ALARM_GROUP_TITLE = {
  PARKING: '주차',
  LOBBY_PHONE: '로비폰',
  WALL_PAD: '세대 월패드',
  MARKETING: '혜택·이벤트 및 기타 푸시 알림',
} as const

/** 알림 항목 라벨 */
export const ALARM_LABEL = {
  REGULAR_PUSH: '정기 차량 입출차 알림',
  EXTERNAL_PUSH: '외부 차량 입출차 알림',
  LOBBY_PHONE_PUSH: '로비폰 세대호출 알림',
  WALL_PAD: '우리집 월패드 입출차 알림',
  MARKETING_CONSENT: '마케팅 목적의 개인정보 수집 및 이용 동의',
  RECEIVE_ADVERTS_CONSENT: '광고성 정보 수신 동의',
} as const

/**
 * 알림 항목 부가 설명. 주차 2건만 있고 나머지는 빈 문자열이다.
 * ⚠️ 빈 문자열이어도 `span`은 그려진다(레거시 `v-if`가 없다) — 여백에 영향이 있다.
 */
export const ALARM_INFO = {
  REGULAR_PUSH: '입주민 차량, 정기 차량 알림',
  EXTERNAL_PUSH: '방문예약, 항상허용, 일반방문 차량 알림',
  EMPTY: '',
} as const

/** 동의 일시 문자열에서 잘라 쓸 길이. `2026-07-30T13:00`까지 */
export const CONSENT_DATE_LENGTH = 16

/** 운영시간 `HH:mm:ss`에서 잘라 쓸 길이 */
export const BUSINESS_HOUR_LENGTH = 5

/** 마이페이지 메뉴 그룹 제목 */
export const MENU_GROUP_TITLE = {
  PARKING: '주차',
  ACCESS: '출입',
  BOARD: '게시판',
  ALARM: '알림',
  APT_LIFE: '아파트 생활',
  APTMANT_NOTICE: '아파트먼트 공지사항',
  ETC: '기타',
} as const

/** 앱 버전 표시 문구. `버전 없음`이 현재 정상 동작이다 (`mypage.md` P-Q2) */
export const APP_VERSION_TEXT = {
  UNKNOWN: '버전 없음',
  LATEST: (version: string) => {
    return `최신 버전 ${version}`
  },
  CURRENT: (version: string) => {
    return `현재 버전 : ${version}`
  },
} as const

/**
 * 네이티브가 앱 버전을 받기 전의 초기값. 레거시가 `'0.0.0'`으로 시작한다.
 * 서버 버전도 같은 값이라 **첫 렌더에는 `최신 버전 0.0.0`이 잠깐 보인다** —
 * 마운트 직후 서버 버전을 읽어 `undefined`가 되면서 `버전 없음`으로 바뀐다.
 */
export const INITIAL_APP_VERSION = '0.0.0'

/**
 * 네이티브가 써넣는다고 가정된 localStorage 키.
 * ⚠️ **웹에는 이 키를 쓰는 코드가 없다** (`deferred.md` D-44).
 */
export const APP_VERSION_STORAGE_KEY = 'version'

/** 프로필 화면 고정 문구 */
export const PROFILE_TEXT = {
  NICKNAME_LABEL: '닉네임',
  NICKNAME_PLACEHOLDER: '닉네임을 설정해주세요',
  NAME_LABEL: '이름',
  NAME_PLACEHOLDER: '이름을 입력해주세요',
  APT_NAME_LABEL: '아파트명',
  /** 값이 없을 때 표시. 닉네임만 예외적으로 placeholder 문구를 쓴다 */
  EMPTY: '-',
  NICKNAME_MAX_LENGTH: 10,
} as const

/** 비밀번호 변경 모달 문구 */
export const PASSWORD_MODAL_TEXT = {
  TITLE: '비밀번호 변경하기',
  CURRENT_LABEL: '현재 비밀번호',
  CURRENT_PLACEHOLDER: '현재 비밀번호를 입력해주세요',
  NEW_LABEL: '변경할 비밀번호',
  NEW_PLACEHOLDER: '변경할 비밀번호를 입력해주세요',
  CONFIRM_LABEL: '비밀번호 확인',
  CONFIRM_PLACEHOLDER: '비밀번호를 한번 더 입력해주세요',
  SUBMIT: '변경',
} as const

/**
 * 현재 비밀번호가 틀렸을 때(`INVALID_PASSWORD`)의 모달 문구.
 * 폼 스키마의 "새 비밀번호 불일치" 메시지와 **문자열이 같지만 다른 상황이다** —
 * 하나는 서버 응답, 하나는 클라이언트 검증이다. 레거시도 같은 문구를 쓴다.
 */
export const PASSWORD_MISMATCH_MESSAGE = '비밀번호가 일치하지 않습니다.'

/** 성공 토스트 문구 */
export const MYPAGE_TOAST_MESSAGE = {
  PROFILE_UPDATED: '수정되었습니다',
  PASSWORD_UPDATED: '변경되었습니다',
} as const

/** 회원 탈퇴 화면 문구 */
export const ACCOUNT_DELETION_TEXT = {
  TITLE: '정말 아파트먼트를 탈퇴하시겠어요?',
  AGREEMENT: '탈퇴 시 모든 포인트 및 개인정보가 즉시 삭제되고, 절대 복구되지 않습니다.',
  SUBMIT: '탈퇴하기',
} as const

/** 글자 크기 설정 화면 미리보기 문구. 두 줄이다 */
export const FONT_SIZE_PREVIEW_TEXT = {
  KO: '글자가 이 크기로 표시됩니다.',
  EN: 'Text will be displayed at this size.',
} as const

/** 빈 상태 문구 */
export const MYPAGE_EMPTY_TEXT = {
  ALARM_SETTING: '알림 설정을 불러올 수 없습니다.',
  OFFICE_CONTACT: '등록된 연락처가 없습니다.',
  OFFICE_BUSINESS_HOUR: '등록된 내용이 없습니다.',
} as const
