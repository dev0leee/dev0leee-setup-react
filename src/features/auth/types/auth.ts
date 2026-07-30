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

/**
 * A2(휴대폰 인증) → A3(비밀번호 재설정)로 넘기는 라우터 state.
 *
 * 레거시는 `pageTitle`도 함께 넘겼지만 A3가 그 값을 렌더하지 않아 옮기지 않았다.
 */
export interface PasswordResetLocationState {
  /** 인증 성공 응답 헤더의 `authorization`. 없으면 A3가 `/`로 돌려보낸다 */
  verifiedToken?: string | null
}

/** ProtectedRoute가 리다이렉트 시 남기는 원래 위치 */
export interface LocationState {
  from?: { pathname: string }
}

export interface AuthProviderProps {
  children: ReactNode
}
