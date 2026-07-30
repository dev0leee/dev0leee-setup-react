/**
 * 단지 컨텍스트의 **서버 쪽** 타입. localStorage 쪽은 `shared/types/auth.ts`의 `AptInfo`다.
 *
 * `shared/`에 있는 이유는 도메인이 아니라 하부구조이기 때문이다 —
 * "지금 이 단지에서 어떤 서비스를 쓸 수 있나"는 12개 도메인이 딛고 서는 사실이다
 * (`docs/conventions/01-folder-structure.md` "어떤 상태는 도메인이 아니라 하부구조다").
 */

/** 단지가 구독한 서비스 한 건. `name`은 `trim()` 후 비교한다 */
export interface AptContentItem {
  name: string
}

/**
 * `GET /apt-resident/{uuid}` 응답. 레거시가 전부 옵셔널 체이닝으로 읽으므로
 * 전 필드를 optional로 둔다 — 필드 하나가 빠진 응답을 통째로 버리면 동작이 달라진다.
 */
export interface ResidentDetailInfo {
  aptId?: string | number
  aptName?: string
  aptLogoFileUrl?: string
  residentId?: string | number
  dong?: string
  ho?: string
  /** 구 아파트먼트 커뮤니티 토큰. `aptInfo.communityToken`이 된다 */
  oldApartmantToken?: string
  contentList?: AptContentItem[]
  /** 입주민의 A-PASS 서비스 가입 여부 */
  apassUseFlag?: boolean
  /** 기기 A-PASS 활성화 여부 */
  apassOnOffFlag?: boolean
}

/** 입주민 승인 상태. `APPROVED`만 진입할 수 있다 */
export const RESIDENT_STATE = {
  APPROVED: 'APPROVED',
} as const

/** `GET /apt-resident/apt` 항목. 로그인 직후와 전출 처리에서 쓴다 */
export interface ResidentApt {
  aptResidentUuid?: string
  aptUuid?: string
  aptName?: string
  residentState?: string
}
