import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'

import { patchPasswordReset } from '@/features/auth/api/password'
import { PASSWORD_RESET_MESSAGE } from '@/features/auth/constants/passwordReset'
import { ROUTE_PATH } from '@/shared/constants/routes'
import { showErrorModal } from '@/shared/lib/errorModal'
import { showToast } from '@/shared/lib/toast'

/**
 * 새 비밀번호 저장. 레거시 `usePatchPassword.js` 이식.
 *
 * ⚠️ **에러 문구가 고정이다.** 서버 `message`를 쓰지 않고 항상
 * `패스워드 변경에 실패했습니다`를 띄운다. 레거시 그대로 둔다.
 *
 * ⚠️ 성공 시 `/`로 보낸다 — `/intro`가 아니다. 루트가 인트로로 리다이렉트하므로 결과는
 * 같지만, 이 화면은 아직 비로그인 상태라 루트 리다이렉트를 한 번 거치는 것까지 동일하다.
 */
export const usePatchPasswordReset = () => {
  const navigate = useNavigate()

  const { mutate: patchPasswordResetMutation, isPending: isPatchPasswordResetPending } =
    useMutation({
      mutationFn: ({ token, password }: { token: string; password: string }) => {
        return patchPasswordReset({ token, password })
      },
      onSuccess: () => {
        void navigate(ROUTE_PATH.HOME)
        showToast({ message: PASSWORD_RESET_MESSAGE.SUCCESS_TOAST })
      },
      onError: () => {
        showErrorModal({ text: PASSWORD_RESET_MESSAGE.FAILURE_MODAL })
      },
    })

  return { patchPasswordResetMutation, isPatchPasswordResetPending }
}
