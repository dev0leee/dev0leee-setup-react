/**
 * 알림 통합 조회 응답. 레거시가 전부 옵셔널 체이닝으로 읽으므로 optional로 둔다.
 *
 * 플래그와 "마지막 변경 일시"가 짝을 이룬다 — 동의 토스트가 일시를 보여준다.
 */
export interface NotificationSetting {
  regularPushFlag?: boolean
  externalPushFlag?: boolean
  wallPadParkingNotificationFlag?: boolean
  marketingDataConsentFlag?: boolean
  receiveAdvertsConsentFlag?: boolean
  /** `YYYY-MM-DDTHH:mm:ss...` — 화면에는 앞 16자만 쓴다 */
  marketingDataConsentLastModifiedDateTime?: string
  receiveAdvertsConsentLastModifiedDateTime?: string
}

/** 알림 관련 mutation들이 돌려주는 body. 응답값이 통합 조회값보다 우선한다 */
export type NotificationMutationResult = NotificationSetting | undefined

export interface LobbyPhonePushAlarmState {
  lobbyPhonePushFlag?: boolean
}

/** 관리사무소 부서별 연락처 */
export interface OfficeContact {
  name?: string
  phone?: string
}

/** 관리사무소 운영시간. `startTime`·`endTime`은 `HH:mm:ss`로 온다 */
export interface OfficeBusinessHour {
  uuid?: string
  dayType?: string
  startTime?: string
  endTime?: string
}

/** 마이페이지 메뉴 한 건 */
export interface MyPageMenuItem {
  name: string
  url: string
  /** `undefined`면 항상 보인다. 레거시 필터 조건 그대로 */
  isActive?: boolean
}

export interface MyPageMenuGroup {
  title: string
  menuItems: MyPageMenuItem[]
  isActive?: boolean
}

/** 알림 설정 토글 한 건 */
export interface AlarmSettingItem {
  label: string
  /** 부가 설명. 없으면 빈 문자열이고 **빈 `span`이 그려진다**(레거시 동일) */
  info: string
  /** mutation 요청 body의 필드명이자 응답에서 값을 읽을 키 */
  key: string
  isActive: boolean | undefined
  isPending: boolean
  onChange: (value: boolean) => void
}

export interface AlarmSettingGroup {
  title: string
  items: AlarmSettingItem[]
  isActive: boolean
}

/** 마케팅 ↔ 광고성 양방향 연동에서 어느 토글을 눌렀는지 */
export type ConsentType = 'MARKETING' | 'ADVERTS'
