import { useMutation } from '@tanstack/react-query'

import { deleteLobbyPhoneResident } from '@/features/mypage/api/alarm'
import { deleteAccount } from '@/features/mypage/api/mypage'
import { APT_CONTENT_NAME } from '@/shared/constants/aptContent'
import { ROUTE_PATH } from '@/shared/constants/routes'
import { useLogoutFlow } from '@/shared/hooks/useLogoutFlow'
import { hasAptContent } from '@/shared/lib/aptContext'
import { showErrorModal } from '@/shared/lib/errorModal'
import { getAptInfo } from '@/shared/stores/authStore'

/**
 * 회원 탈퇴. 레거시 `useDeleteAccount.js` 이식.
 *
 * ⚠️ **로비폰 통보가 실패해도 로그아웃은 반드시 한다.** 레거시가 `try/finally`로
 * 그렇게 만들어 뒀다 — 서버에서 계정은 이미 지워졌으므로 로컬에 세션을 남기면
 * 다음 요청이 전부 실패한다.
 *
 * ⚠️ 레거시는 `catch`에서 `return error`를 한다. 아무도 받지 않는 반환값이라
 * `console.error`로 바꿨다 — 동작은 같고 실패가 콘솔에 남는다.
 */
export const useDeleteAccount = () => {
  const onLogout = useLogoutFlow()

  const { mutate: deleteAccountMutation, isPending: isDeleteAccountPending } = useMutation({
    mutationFn: () => {
      return deleteAccount()
    },
    onSuccess: async () => {
      const aptInfo = getAptInfo()
      const hasLobbyPhone = hasAptContent({
        contentList: aptInfo.contentList,
        contentName: APT_CONTENT_NAME.LOBBY_PHONE,
      })

      try {
        if (hasLobbyPhone && aptInfo.aptResidentUuid) {
          await deleteLobbyPhoneResident({ aptResidentUuid: aptInfo.aptResidentUuid })
        }
      } catch (error) {
        console.error('[useDeleteAccount] 로비폰 탈퇴 통보에 실패했습니다.', error)
      } finally {
        onLogout({ path: ROUTE_PATH.HOME })
      }
    },
    onError: (error) => {
      showErrorModal({ text: error.message })
    },
  })

  return { deleteAccountMutation, isDeleteAccountPending }
}
