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

/**
 * `GET /apt-resident/apt` 항목. 로그인 직후·전출 처리·단지 전환 드로어가 쓴다.
 *
 * `dong`·`ho`·`aptAddress`는 **드로어 목록 표시용**이다 (`main.md` §4).
 * 로그인 직후 경로는 `aptResidentUuid`·`aptUuid`만 본다.
 */
export interface ResidentApt {
  aptResidentUuid?: string
  aptUuid?: string
  aptName?: string
  /** `APPROVED`가 아니면 전환할 수 없다 */
  residentState?: string
  dong?: string
  ho?: string
  aptAddress?: string
}

/**
 * `GET /login/info` · `GET /login/waiting-info` 응답.
 *
 * **두 엔드포인트가 같은 모양을 준다.** 승인 전(waiting)에도 같은 필드를 받아
 * 네이티브에 발신해야 FCM 토큰이 등록된다 (`auth.md` A4).
 *
 * `shared/`에 있는 이유: 이 값으로 만드는 네이티브 페이로드를 **auth와 signup이 함께**
 * 보낸다. 전 필드 optional인 것은 레거시가 전부 옵셔널 체이닝으로 읽기 때문이다.
 */
export interface LoginInfo {
  /** 입주민 uuid. `aptInfo.aptResidentUuid`가 된다 */
  uuid?: string
  aptName?: string
  aptId?: string | number
  aptLogoFileUrl?: string
  name?: string
  nickName?: string
  /** 구 아파트먼트 커뮤니티 토큰 */
  oldApartmantToken?: string
  contentList?: AptContentItem[]
  /** 입주민의 A-PASS 서비스 가입 여부 */
  apassUseFlag?: boolean
  /** 기기 A-PASS 활성화 여부 */
  apassOnOffFlag?: boolean
}
