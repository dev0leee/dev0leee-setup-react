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
