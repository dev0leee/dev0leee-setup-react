import { useMutation } from '@tanstack/react-query'

import { patchPasswordEdit } from '@/features/mypage/api/mypage'
import { MYPAGE_TOAST_MESSAGE, PASSWORD_MISMATCH_MESSAGE } from '@/features/mypage/constants/mypage'
import { LOGIN_ERROR_CODE } from '@/shared/constants/errorCode'
import { showErrorModal } from '@/shared/lib/errorModal'
import { showToast } from '@/shared/lib/toast'
import { useAuthStore } from '@/shared/stores/authStore'

/**
 * 비밀번호 변경. 레거시 `usePatchPasswordEdit.js` 이식.
 *
 * ⚠️ **성공하면 localStorage의 자동 로그인 비밀번호도 갱신한다.**
 * 안 하면 다음 토큰 만료 때 자동 로그인이 옛 비밀번호로 시도해 실패한다
 * (평문 저장 자체는 `deferred.md` D-15 — 등가 이관을 위해 유지).
 *
 * 성공 시 화면은 **모달만 닫는다.** 다른 이동이 없다.
 */
export const usePatchPasswordEdit = () => {
  const updateUserPassword = useAuthStore((state) => {
    return state.updateUserPassword
  })

  const {
    mutate: patchPasswordEditMutation,
    isPending: isPatchPasswordEditPending,
    isSuccess: isPatchPasswordEditSuccess,
  } = useMutation({
    mutationFn: ({ oldPassword, password }: { oldPassword: string; password: string }) => {
      return patchPasswordEdit({ oldPassword, password })
    },
    onSuccess: (_data, variables) => {
      updateUserPassword(variables.password)
      showToast({ message: MYPAGE_TOAST_MESSAGE.PASSWORD_UPDATED })
    },
    onError: (error) => {
      // 현재 비밀번호가 틀렸을 때만 문구를 갈아끼운다. 서버 메시지가 불친절하다.
      if (error.code === LOGIN_ERROR_CODE.INVALID_PASSWORD) {
        showErrorModal({ text: PASSWORD_MISMATCH_MESSAGE })
        return
      }
      showErrorModal({ text: error.message })
    },
  })

  return { patchPasswordEditMutation, isPatchPasswordEditPending, isPatchPasswordEditSuccess }
}
