import { create } from 'zustand'

import type { AuthStatus, User } from '@/shared/types/auth'

interface AuthState {
  status: AuthStatus
  user: User | null
  setAuthenticated: (user: User) => void
  setAnonymous: () => void
}

/**
 * 사용자 정보와 인증 상태만 담는다.
 * Access Token은 여기 넣지 않는다 - tokenStore.ts 주석 참고.
 */
export const useAuthStore = create<AuthState>((set) => ({
  status: 'booting',
  user: null,
  setAuthenticated: (user) => set({ status: 'authenticated', user }),
  setAnonymous: () => set({ status: 'anonymous', user: null }),
}))
