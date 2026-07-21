import { useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'

import { broadcastLogout } from '@/api/authChannel'
import { setAccessToken } from '@/api/tokenStore'

import { logout as logoutRequest } from './api'
import { useAuthStore } from './store'

/**
 * 로그아웃. 서버 폐기 -> 다른 탭 전파 -> 로컬 정리 순서.
 * 서버 호출이 실패해도 로컬 세션은 반드시 정리한다(finally).
 */
export function useLogout() {
  const queryClient = useQueryClient()
  const setAnonymous = useAuthStore((s) => s.setAnonymous)

  return useCallback(async () => {
    try {
      await logoutRequest()
    } finally {
      broadcastLogout()
      setAccessToken(null)
      queryClient.clear()
      setAnonymous()
    }
  }, [queryClient, setAnonymous])
}
