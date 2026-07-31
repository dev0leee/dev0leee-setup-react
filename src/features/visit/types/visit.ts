/** 방문증 키오스크 비밀번호. **4자리 문자열**이다 */
export interface VisitorPassPassword {
  password?: string
}

/** 로비폰 메뉴 1개 (V3) */
export interface LobbyPhoneNavItem {
  key: string
  title: string
  description: string
  icon: string
  iconAlt: string
  /** 아이콘 크기가 항목마다 다르다 */
  iconClassName: string
  path: string
}

/**
 * 임시 비밀번호 1건 (V4).
 *
 * ⚠️ **`residentName`이 없으면 관리사무소가 만든 것**이다 — 화면은 `관리자`로 표시한다.
 */
export interface TempPassword {
  uuid: string
  /** `TEMPOTP`(일회용) · `TEMPTERM`(기간형) */
  tempPasswordType?: string
  password?: string
  residentName?: string | null
  /** 서버 문자열을 그대로 `~{endDate}`로 보여준다 */
  endDate?: string | null
  description?: string | null
}

/** 임시 비밀번호 생성 폼의 탭 */
export const TEMP_PASSWORD_TYPE = {
  OTP: 'TEMPOTP',
  TERM: 'TEMPTERM',
} as const

export type TempPasswordType = (typeof TEMP_PASSWORD_TYPE)[keyof typeof TEMP_PASSWORD_TYPE]

/**
 * 등록된 얼굴 1건 (V7·V8).
 *
 * ⚠️ **이름 필드가 `residentFaceName`인데 등록·수정 요청은 `faceRecogName`으로 보낸다.**
 * 읽기와 쓰기의 필드명이 다르다 — 서버 계약이라 그대로 쓴다.
 *
 * ⚠️ **`faceRecogStatus`는 `COMPLETE`·`PENDING`·`REJECT` 셋이지만 타입을 좁히지 않는다.**
 * 화면이 알 수 없는 값을 **빈 칩**으로 그리는 것까지 레거시 동작이라, 새 상태가 와도
 * 타입 때문에 터지지 않아야 한다.
 */
export interface FaceRecog {
  faceRecogGuid: string
  residentFaceName?: string
  faceRecogDescription?: string | null
  faceRecogStatus?: string
  /** `REJECT`일 때만 의미가 있다. 실패 사유 코드 */
  registCause?: string
  insertDate?: string
}

/** V12 실패 화면이 `location.state`로 받는 값 */
export interface FaceRegisterFailState {
  name?: string
  memo?: string
  reason?: string
}
