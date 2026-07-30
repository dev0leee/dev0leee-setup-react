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

/** ProtectedRoute가 리다이렉트 시 남기는 원래 위치 */
export interface LocationState {
  from?: { pathname: string }
}

export interface AuthProviderProps {
  children: ReactNode
}
