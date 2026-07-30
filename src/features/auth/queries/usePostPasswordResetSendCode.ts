import { useMutation } from '@tanstack/react-query'

import { postPasswordResetSendCode } from '@/features/auth/api/password'
import { showErrorModal } from '@/shared/lib/errorModal'
import { cleanPhoneHyphen } from '@/shared/utils/cleanPhoneHyphen'

/**
 * 인증번호 문자 발송. 레거시 `usePostPasswordResetSendCode.js` 이식.
 *
 * ⚠️ **하이픈 제거를 여기서 한다.** 폼은 `noHyphenPhone`이라는 이름과 달리 사용자가 넣은
 * 값을 그대로 담고 있어(`type="text"`라 자동 하이픈이 없다) 붙여넣기로 하이픈이 들어올
 * 수 있다. 레거시도 뮤테이션 단계에서 뗀다.
 *
 * 성공 후 타이머를 켜는 일은 **화면이 한다** — 레거시는 `watch(isSuccess)`로 했지만
 * 그것은 "성공했다"는 이벤트에 대한 응답이므로 React에서는 `mutate`의 `onSuccess`가 맞다
 * (`recipe.md` §5).
 */
export const usePostPasswordResetSendCode = () => {
  const { mutate: postPasswordResetSendCodeMutation, isPending: isSendCodePending } = useMutation({
    mutationFn: ({ noHyphenPhone }: { noHyphenPhone: string }) => {
      return postPasswordResetSendCode({ phone: cleanPhoneHyphen({ phone: noHyphenPhone }) })
    },
    onError: (error) => {
      showErrorModal({ text: error.message })
    },
  })

  return { postPasswordResetSendCodeMutation, isSendCodePending }
}
