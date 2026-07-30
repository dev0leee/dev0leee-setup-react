import { useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'

import { deleteLogout } from '@/features/auth/api/auth'
import { RESIDENT_DETAIL_INFO_QUERY_KEY } from '@/features/auth/constants/query'
import { getRefreshToken } from '@/shared/lib/tokenStore'
import { useAuthStore } from '@/shared/stores/authStore'

/**
 * 로그아웃. 레거시 `useDeleteLogout` + `useLogoutFlow`의 로컬 정리 부분 이식.
 *
 * 서버 폐기가 실패해도 **로컬 정리는 반드시 수행한다** — 레거시도 onError에서
 * `onLogout('/')`을 부른다. 로그아웃을 눌렀는데 세션이 남는 것이 최악이다.
 */
export const useLogout = () => {
  const queryClient = useQueryClient()
  const clearAuth = useAuthStore((state) => {
    return state.clearAuth
  })
  const setShouldRedirectAfterLogin = useAuthStore((state) => {
    return state.setShouldRedirectAfterLogin
  })

  return useCallback(async () => {
    const refreshToken = getRefreshToken()

    try {
      // 레거시는 refreshToken이 없으면 서버 호출을 건너뛰고 성공 경로를 탄다.
      if (refreshToken) await deleteLogout({ refreshToken })
    } catch (error) {
      console.error('[useLogout] 로그아웃 요청 실패. 로컬 세션은 정리합니다.', error)
    } finally {
      // 레거시가 지우는 캐시는 이 하나다. 나머지 캐시는 남긴다.
      queryClient.removeQueries({ queryKey: RESIDENT_DETAIL_INFO_QUERY_KEY })
      clearAuth()
      setShouldRedirectAfterLogin(true)
    }
  }, [clearAuth, queryClient, setShouldRedirectAfterLogin])
}
