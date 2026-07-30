import { useMutation } from '@tanstack/react-query'

import { deleteLogout } from '@/features/auth/api/auth'
import { putLobbyPhoneResidentLogout } from '@/features/auth/api/lobbyPhone'
import { APT_SERVICE_NAME } from '@/features/auth/constants/loginInfo'
import { useLogoutFlow } from '@/features/auth/hooks/useLogoutFlow'
import { ROUTE_PATH } from '@/shared/constants/routes'
import { showErrorModal } from '@/shared/lib/errorModal'
import { getRefreshToken } from '@/shared/lib/tokenStore'
import { getAptInfo, useAuthStore } from '@/shared/stores/authStore'

/**
 * 로그아웃. 레거시 `lib/queries/auth/useDeleteLogout.js` 이식.
 *
 * 어떤 경로로 끝나든 **로컬 정리는 반드시 수행한다** — 성공·실패·자동 로그인 중
 * 세 갈래 모두 마지막에 `onLogout('/')`을 부른다.
 */
export const useDeleteLogout = () => {
  const onLogout = useLogoutFlow()

  const { mutate: deleteLogoutMutation, isPending: isDeleteLogoutPending } = useMutation({
    mutationFn: async () => {
      const refreshToken = getRefreshToken()
      // 레거시는 토큰이 없으면 서버 호출을 건너뛰고 성공 경로를 탄다.
      // "모든 케이스에서 동일한 성공/실패 처리"를 보장하기 위한 것이다.
      if (!refreshToken) return
      await deleteLogout({ refreshToken })
    },
    onSuccess: async () => {
      const { isAutoLoginInProgress, setAutoLoginInProgress } = useAuthStore.getState()
      if (isAutoLoginInProgress) setAutoLoginInProgress(false)

      const aptInfo = getAptInfo()
      const hasLobbyPhone =
        aptInfo.contentList?.some((content) => {
          return content.name.trim() === APT_SERVICE_NAME.LOBBY_PHONE
        }) ?? false

      try {
        // 로비폰 세대는 로비폰 서버에도 로그아웃을 알린다.
        if (hasLobbyPhone && aptInfo.aptResidentUuid) {
          await putLobbyPhoneResidentLogout({ aptResidentUuid: aptInfo.aptResidentUuid })
        }
      } catch (error) {
        console.error('[useDeleteLogout] 로비폰 로그아웃 통보에 실패했습니다.', error)
      } finally {
        onLogout({ path: ROUTE_PATH.HOME })
      }
    },
    onError: (error) => {
      const { isAutoLoginInProgress, setAutoLoginInProgress } = useAuthStore.getState()

      // 자동 로그인 중이면 모달을 띄우지 않는다. 사용자가 시작한 동작이 아니다.
      if (isAutoLoginInProgress) {
        console.error('[useDeleteLogout] 자동 로그인 중 로그아웃 실패', error)
        setAutoLoginInProgress(false)
        onLogout({ path: ROUTE_PATH.HOME })
        return
      }

      showErrorModal({ text: error.message })
      // 에러가 나도 로컬 정리는 수행한다.
      onLogout({ path: ROUTE_PATH.HOME })
    },
  })

  return { deleteLogoutMutation, isDeleteLogoutPending }
}
