/**
 * 자동 로그인용으로 저장하는 로그인 자격. 레거시 localStorage `userAuthInfo`.
 * `id`는 휴대폰 번호이고 사용자가 입력한 원본(하이픈 포함)이 그대로 저장된다 —
 * 서버로 보낼 때만 하이픈을 뗀다.
 */
export interface UserAuthInfo {
  id: string
  password: string
}

/** 단지가 제공하는 서비스 한 건. `name`으로 'A-PASS'·'로비폰' 등을 판별한다. */
export interface AptContent {
  name: string
}

/**
 * 선택된 단지 컨텍스트. 레거시 localStorage `aptInfo`.
 *
 * **전 필드가 optional이다.** 레거시 `getAptInfo()`가 값이 없으면 `{}`를 돌려주고,
 * 소비자들이 전부 옵셔널 체이닝으로 읽는다. `aptResidentUuid`는 153곳,
 * `aptUuid`는 25곳이 참조한다 — 대부분의 쿼리 키가 여기서 값을 가져온다.
 *
 * ⚠️ 서버 데이터를 localStorage로 복사하는 구조라 `04-state.md`의
 * "서버 데이터를 클라이언트 상태로 옮기지 않는다"에 어긋난다. 레거시가 그렇게 만들어져
 * 있고 동기 접근에 의존하는 곳이 많아 **등가 이관을 위해 유지한다** (`deferred.md` D-35).
 */
export interface AptInfo {
  aptResidentUuid?: string
  aptUuid?: string
  aptName?: string
  aptLogoFileUrl?: string
  /** 커뮤니티 URL 쿼리스트링에 실린다. 서버 응답 타입은 Phase 6에서 확정 */
  aptId?: string | number
  residentId?: string | number
  residentName?: string
  residentNickName?: string
  dong?: string
  ho?: string
  /** 구 아파트먼트 커뮤니티 토큰 */
  communityToken?: string
  contentList?: AptContent[]
  apassUseFlag?: boolean
  apassOnOffFlag?: boolean
}

export interface AuthState {
  userAuthInfo: UserAuthInfo | null
  aptInfo: AptInfo
  /** 재발급 실패로 재로그인이 진행 중인지. `apiClient`의 대기 큐가 이 전이를 본다. */
  isAutoLoginInProgress: boolean
  /** 로그인 성공 후 `/main`으로 보낼지. 자동 로그인 중에는 false다. */
  shouldRedirectAfterLogin: boolean

  setUserAuthInfo: (userAuthInfo: UserAuthInfo | null) => void
  updateUserPassword: (password: string) => void
  setAutoLoginInProgress: (isAutoLoginInProgress: boolean) => void
  setShouldRedirectAfterLogin: (shouldRedirectAfterLogin: boolean) => void
  /** 기존 값에 **병합**한다. 레거시 `setAptInfo`가 스프레드로 덮어쓴다. */
  setAptInfo: (aptInfo: AptInfo) => void
  clearAptInfo: () => void
  clearAuth: () => void
}
