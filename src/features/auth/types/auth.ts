import type { ReactNode } from 'react'

/** 레거시 `postLogin` 요청 body. `id`는 휴대폰 번호다. */
export interface LoginPayload {
  id: string
  password: string
}

/**
 * 로그인 응답 body. 토큰은 헤더로 오므로 body에는 분기용 플래그만 담긴다.
 * `oldResidentFlag`가 true면 버전1 약관 동의 화면으로 보낸다.
 */
export interface LoginResponseBody {
  success?: {
    oldResidentFlag?: boolean
  }
}

/** `postLogin`이 헤더·body를 정리해 돌려주는 값 */
export interface LoginResult {
  accessToken: string | null
  refreshToken: string | null
  /** true면 버전1 사용자다 → 약관 재동의가 필요하다 */
  oldResidentFlag: boolean
}

/** 단지가 제공하는 서비스 한 건. `name`을 `trim()`해서 비교한다 — 서버 값에 공백이 섞여 있다 */
export interface LoginInfoContent {
  name: string
}

/**
 * `GET /login/info` 응답. 단지 컨텍스트와 네이티브 발신 페이로드가 여기서 나온다.
 * 필드가 빠질 수 있어 optional로 둔다 — 레거시도 전부 옵셔널 체이닝으로 읽는다.
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
  contentList?: LoginInfoContent[]
  /** 입주민의 A-PASS 서비스 가입 여부 */
  apassUseFlag?: boolean
  /** 기기 A-PASS 활성화 여부 */
  apassOnOffFlag?: boolean
}

/** `GET /apt-resident/apt` 항목 */
export interface ResidentApt {
  aptResidentUuid?: string
  aptUuid?: string
}

/** ProtectedRoute가 리다이렉트 시 남기는 원래 위치 */
export interface LocationState {
  from?: { pathname: string }
}

export interface AuthProviderProps {
  children: ReactNode
}
