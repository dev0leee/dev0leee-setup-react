import { useMutation } from '@tanstack/react-query'

import { postPasswordResetCodeVerify } from '@/features/auth/api/password'
import { VERIFICATION_CODE_FALLBACK_MESSAGE } from '@/features/auth/constants/passwordReset'
import { showErrorModal } from '@/shared/lib/errorModal'
import { cleanPhoneHyphen } from '@/shared/utils/cleanPhoneHyphen'

/**
 * 인증번호 검증. 레거시 `usePostPasswordResetCodeVerify.js` 이식.
 *
 * ⚠️ **서버 `message`가 비어 있으면 대체 문구를 쓴다.** 레거시가
 * `message || '인증번호가 일치하지 않습니다...'`로 처리한다 — 인증 실패 응답이
 * 문구를 안 주는 경우가 있다는 뜻이다.
 *
 * `isCodeVerifySuccess`를 밖으로 내보내는 이유는 **레거시가 성공 시 화면 전체를 감춘다**
 * (`v-if="!isPostPasswordResetCodeVerifyIsSuccess"`). 이동 직전에 빈 화면이 한 프레임
 * 보이는 동작이라 등가 이관을 위해 그대로 재현한다 (`auth.md` A-Q2).
 */
export const usePostPasswordResetCodeVerify = () => {
  const {
    mutate: postPasswordResetCodeVerifyMutation,
    isSuccess: isCodeVerifySuccess,
    isPending: isCodeVerifyPending,
  } = useMutation({
    mutationFn: ({
      verificationCode,
      noHyphenPhone,
    }: {
      verificationCode: string
      noHyphenPhone: string
    }) => {
      return postPasswordResetCodeVerify({
        code: verificationCode,
        phone: cleanPhoneHyphen({ phone: noHyphenPhone }),
      })
    },
    onError: (error) => {
      showErrorModal({ text: error.message || VERIFICATION_CODE_FALLBACK_MESSAGE })
    },
  })

  return { postPasswordResetCodeVerifyMutation, isCodeVerifySuccess, isCodeVerifyPending }
}
