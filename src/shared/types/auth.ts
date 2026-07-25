export interface User {
  id: string
  email: string
  name: string
}

export type AuthStatus = 'booting' | 'authenticated' | 'anonymous'

export interface AuthState {
  status: AuthStatus
  user: User | null
  setAuthenticated: (user: User) => void
  setAnonymous: () => void
}

/** 탭 간 인증 동기화 채널로 오가는 메시지 */
export type AuthMessage = { type: 'token'; token: string } | { type: 'logout' }
