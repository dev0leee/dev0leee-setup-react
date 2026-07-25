import { create } from 'zustand'

import type { AuthState } from '@/shared/types/auth'

/**
 * 사용자 정보와 인증 상태만 담는다.
 * Access Token은 여기 넣지 않는다 - tokenStore.ts 주석 참고.
 */
export const useAuthStore = create<AuthState>((set) => {
  return {
    status: 'booting',
    user: null,
    setAuthenticated: (user) => {
      set({ status: 'authenticated', user })
    },
    setAnonymous: () => {
      set({ status: 'anonymous', user: null })
    },
  }
})
