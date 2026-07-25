import { useMutation } from '@tanstack/react-query'

import { login } from '@/features/auth/api/auth'
import { setAccessToken } from '@/shared/lib/tokenStore'
import { useAuthStore } from '@/shared/stores/authStore'

/**
 * 로그인. 토큰 저장과 스토어 갱신까지가 이 도메인의 책임이다.
 * 화면 전환·폼 에러 표시는 호출부가 `mutate`의 콜백으로 넘긴다.
 */
export const useLogin = () => {
  const setAuthenticated = useAuthStore((state) => {
    return state.setAuthenticated
  })

  return useMutation({
    mutationFn: login,
    onSuccess: ({ accessToken, user }) => {
      setAccessToken({ token: accessToken })
      setAuthenticated(user)
    },
  })
}
