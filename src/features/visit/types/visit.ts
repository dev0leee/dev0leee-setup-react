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
