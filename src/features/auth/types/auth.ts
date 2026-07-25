import type { ReactNode } from 'react'

import type { User } from '@/shared/types/auth'

export interface SessionResponse {
  accessToken: string
  user: User
}

export interface LoginPayload {
  email: string
  password: string
}

/** ProtectedRoute가 리다이렉트 시 남기는 원래 위치 */
export interface LocationState {
  from?: { pathname: string }
}

export interface AuthProviderProps {
  children: ReactNode
}
