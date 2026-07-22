import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, type ReactNode } from 'react'

import { initAuthChannel } from '@/api/authChannel'
import { setAccessToken } from '@/api/tokenStore'
import { FullPageSpinner } from '@/components/common/FullPageSpinner'
import { restoreSession } from '@/features/auth/api'
import { useAuthStore } from '@/features/auth/store'

export function AuthProvider({ children }: { children: ReactNode }) {
  const status = useAuthStore((s) => s.status)
  const setAuthenticated = useAuthStore((s) => s.setAuthenticated)
  const setAnonymous = useAuthStore((s) => s.setAnonymous)
  const queryClient = useQueryClient()

  const clearSession = useCallback(() => {
    setAccessToken(null)
    // 이전 사용자 데이터가 다음 로그인 화면에 새어나가지 않도록 캐시를 비운다.
    queryClient.clear()
    setAnonymous()
  }, [queryClient, setAnonymous])

  useEffect(() => {
    const unsubscribe = initAuthChannel(clearSession)

    // 새로고침으로 사라진 메모리 Access Token을 RT 쿠키로 복원한다.
    async function restore() {
      try {
        const { accessToken, user } = await restoreSession()
        setAccessToken(accessToken)
        setAuthenticated(user)
      } catch {
        setAccessToken(null)
        setAnonymous()
      }
    }

    void restore()

    return unsubscribe
  }, [clearSession, setAnonymous, setAuthenticated])

  // 이 게이트가 없으면 로그인된 사용자에게 로그인 화면이 한 프레임 번쩍인다.
  if (status === 'booting') return <FullPageSpinner />

  return children
}
