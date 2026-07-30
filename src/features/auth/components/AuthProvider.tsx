import { useEffect } from 'react'

import { useLogout } from '@/features/auth/hooks/useLogout'
import { usePatchLogin } from '@/features/auth/queries/usePatchLogin'
import type { AuthProviderProps } from '@/features/auth/types/auth'
import { useAuthStore } from '@/shared/stores/authStore'

/**
 * 자동 로그인 구동부. 레거시 `MainApp.vue`의 `watch(isAutoLoginInProgress)` 이관.
 *
 * `apiClient`가 토큰 재발급에 실패하면 `isAutoLoginInProgress`를 올리고 요청을 큐에
 * 담아둔다. 여기서 저장된 아이디·비밀번호로 다시 로그인하면, 플래그가 내려가는 순간
 * `apiClient`가 큐를 새 토큰으로 흘려보낸다.
 *
 * ⚠️ 템플릿 원본은 쿠키로 세션을 복원하며 그동안 렌더를 막았다(`booting` 상태).
 * 지금은 토큰이 localStorage에 있어 **동기적으로 읽히므로 게이트가 필요 없다.**
 * 로그인 화면이 한 프레임 번쩍이는 문제도 생기지 않는다.
 *
 * 파생 상태가 아니라 **외부 시스템(HTTP 계층)이 만든 전이에 대한 응답**이므로
 * `useEffect`가 맞는 도구다 (`docs/conventions/06-react.md`).
 */
export const AuthProvider = ({ children }: AuthProviderProps) => {
  const isAutoLoginInProgress = useAuthStore((state) => {
    return state.isAutoLoginInProgress
  })
  const { patchLoginMutation, isPatchLoginPending } = usePatchLogin()
  const logout = useLogout()

  useEffect(() => {
    if (!isAutoLoginInProgress) return

    const { userAuthInfo, setAutoLoginInProgress, setShouldRedirectAfterLogin } =
      useAuthStore.getState()

    // 저장된 자격이 없으면 자동 로그인이 불가능하다 → 세션을 정리한다.
    if (!userAuthInfo?.id || !userAuthInfo.password) {
      setAutoLoginInProgress(false)
      void logout()
      return
    }

    // 이 effect는 pending 변화로도 다시 도는데, 그때 중복 요청을 막는다.
    if (isPatchLoginPending) return

    // 자동 로그인 중에는 화면을 옮기지 않는다. 사용자는 재로그인된 줄 모른다.
    setShouldRedirectAfterLogin(false)

    patchLoginMutation(
      { id: userAuthInfo.id, password: userAuthInfo.password },
      {
        onError: () => {
          useAuthStore.getState().setAutoLoginInProgress(false)
          void logout()
        },
      },
    )
  }, [isAutoLoginInProgress, isPatchLoginPending, logout, patchLoginMutation])

  return children
}
