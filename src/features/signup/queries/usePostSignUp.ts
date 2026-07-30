import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'

import { postSignUp } from '@/features/signup/api/signup'
import type { SignUpPayload } from '@/features/signup/types/signup'
import { SIGNUP_ERROR_CODE } from '@/shared/constants/errorCode'
import { SIGNUP_ERROR_MESSAGE } from '@/shared/constants/message'
import { ROUTE_PATH } from '@/shared/constants/routes'
import { useWaitingMemberFcmToken } from '@/shared/hooks/useWaitingMemberFcmToken'
import { showErrorModal } from '@/shared/lib/errorModal'

/**
 * 회원가입 제출. 레거시 `lib/queries/auth/usePostUserInfo.js` 이식.
 *
 * ⚠️ **성공 직후 미승인 회원 정보를 조회한다.** 승인 결과를 문자 대신 푸시로 보내기 위해
 * FCM 토큰을 미리 등록시키는 것이다. 여기서 쓰는 아이디는 사용자가 입력한 값이 아니라
 * **서버가 응답으로 준 `id`** 다.
 *
 * ⚠️ 그 조회가 실패해도 **가입은 성공으로 처리한다.** 레거시가 `await` 없이 부르고
 * 실패를 잡지 않는다 — 여기서 막으면 가입이 실패한 것처럼 보인다.
 *
 * ⚠️ 버전1 전환(`auth.md` A6)과 에러 문구 표가 같지만 **여기서는 세션을 지우지 않는다.**
 * 아직 로그인 상태가 아니기 때문이다.
 */
export const usePostSignUp = () => {
  const navigate = useNavigate()
  const sendWaitingMemberInfo = useWaitingMemberFcmToken()

  const { mutate: postSignUpMutation, isPending: isPostSignUpPending } = useMutation({
    mutationFn: (payload: SignUpPayload) => {
      return postSignUp(payload)
    },

    onSuccess: async (data, variables) => {
      const signedUpId = data?.id

      if (signedUpId && variables.password) {
        try {
          await sendWaitingMemberInfo({ id: signedUpId, password: variables.password })
        } catch (error) {
          console.error('[usePostSignUp] 미승인 입주민 정보 발신 실패', error)
        }
      }

      // 레거시가 `state: { pageFrom: 'aptInfo' }`를 넘기지만 완료 화면이 읽지 않는다.
      // 죽은 state라 옮기지 않았다 (`deferred.md` D-27).
      void navigate(ROUTE_PATH.SIGNUP_COMPLETED)
    },

    onError: (error) => {
      switch (error.code) {
        case SIGNUP_ERROR_CODE.RESIDENT_ALREADY_EXISTS:
          showErrorModal({ text: SIGNUP_ERROR_MESSAGE.RESIDENT_ALREADY_EXISTS })
          break

        case SIGNUP_ERROR_CODE.HOUSEHOLD_NOT_FOUND:
          showErrorModal({ text: SIGNUP_ERROR_MESSAGE.HOUSEHOLD_NOT_FOUND })
          break

        case SIGNUP_ERROR_CODE.HOUSEHOLD_HEAD_ALREADY_EXISTS:
          showErrorModal({ text: SIGNUP_ERROR_MESSAGE.HOUSEHOLD_HEAD_ALREADY_EXISTS })
          break

        case SIGNUP_ERROR_CODE.KMC_ERROR:
          // 이 코드만 모달을 닫을 때 화면을 옮긴다. 인증이 만료됐으니 처음부터 다시다.
          showErrorModal({
            text: SIGNUP_ERROR_MESSAGE.KMC_ERROR,
            callback: () => {
              void navigate(ROUTE_PATH.HOME)
            },
          })
          break

        default:
          showErrorModal({ text: error.message })
      }
    },
  })

  return { postSignUpMutation, isPostSignUpPending }
}
