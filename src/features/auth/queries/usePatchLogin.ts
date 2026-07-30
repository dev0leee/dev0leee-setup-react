import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'

import { postLogin } from '@/features/auth/api/auth'
import { LOGIN_ERROR_MESSAGE } from '@/features/auth/constants/loginInfo'
import { useLoginData } from '@/features/auth/hooks/useLoginData'
import type { LoginPayload } from '@/features/auth/types/auth'
import { LOGIN_ERROR_CODE } from '@/shared/constants/errorCode'
import { ROUTE_PATH } from '@/shared/constants/routes'
import { useLogoutFlow } from '@/shared/hooks/useLogoutFlow'
import { useWaitingMemberFcmToken } from '@/shared/hooks/useWaitingMemberFcmToken'
import { showErrorModal } from '@/shared/lib/errorModal'
import { setTokens } from '@/shared/lib/tokenStore'
import { useAuthStore } from '@/shared/stores/authStore'
import { cleanPhoneHyphen } from '@/shared/utils/cleanPhoneHyphen'

/**
 * 로그인. 레거시 `lib/queries/auth/usePatchLogin.js` 이식.
 *
 * 수동 로그인과 **자동 로그인이 같은 훅을 공유한다.** 구분은
 * `isAutoLoginInProgress` 플래그가 하고, 그 값에 따라 이동 여부·에러 표시가 갈린다.
 */
export const usePatchLogin = () => {
  const navigate = useNavigate()
  const loadLoginData = useLoginData()
  const onLogout = useLogoutFlow()
  const sendWaitingMemberInfo = useWaitingMemberFcmToken()
  const setUserAuthInfo = useAuthStore((state) => {
    return state.setUserAuthInfo
  })

  const { mutate: patchLoginMutation, isPending: isPatchLoginPending } = useMutation({
    mutationFn: ({ id, password }: LoginPayload) => {
      // 레거시는 요청을 보내기 **전에** 자격을 저장한다.
      // 실패해도 저장되므로 이후 자동 로그인이 같은 값으로 재시도할 수 있다.
      setUserAuthInfo({ id, password })

      // 저장값은 사용자가 입력한 원본, 전송값은 하이픈을 뗀 것.
      return postLogin({ id: cleanPhoneHyphen({ phone: id }), password })
    },

    onSuccess: async ({ accessToken, refreshToken, oldResidentFlag }) => {
      // ⚠️ 아래 순서와 플래그 읽는 시점이 레거시와 같아야 한다.
      // 중간에 isAutoLoginInProgress를 내리고, 뒤따르는 분기가 그 값을 **다시** 읽는다
      // (`deferred.md` D-192).
      const store = useAuthStore.getState()
      const wasAutoLogin = store.isAutoLoginInProgress

      // 수동 로그인이면 이동 플래그를 되살린다. 자동 로그인 중에는 손대지 않는다.
      if (!wasAutoLogin) store.setShouldRedirectAfterLogin(true)

      setTokens({ accessToken, refreshToken })

      // 토큰을 저장한 **뒤에** 내린다. 먼저 내리면 대기 큐가 토큰 없이 드레인된다.
      if (wasAutoLogin) store.setAutoLoginInProgress(false)

      // 🔴 레거시는 여기서 `!isAutoLogin()`을 다시 읽는다. 위에서 플래그를 내렸으므로
      // **자동 로그인이었어도 이 조건이 참이 된다.** 버전1 사용자는 자동 로그인 중에도
      // 약관 화면으로 끌려간다. 등가 이관을 위해 그대로 재현한다.
      const isAutoLoginNow = useAuthStore.getState().isAutoLoginInProgress
      if (oldResidentFlag && !isAutoLoginNow) {
        void navigate(ROUTE_PATH.VERSION_ONE_TERMS)
        return
      }

      await loadLoginData()

      if (!isAutoLoginNow && useAuthStore.getState().shouldRedirectAfterLogin) {
        void navigate(ROUTE_PATH.MAIN)
      }

      // 다음 로그인을 위해 항상 되살린다.
      useAuthStore.getState().setShouldRedirectAfterLogin(true)
    },

    onError: async (error, variables) => {
      const { isAutoLoginInProgress, setAutoLoginInProgress } = useAuthStore.getState()

      // 자동 로그인 실패는 사용자가 시작한 동작이 아니다 → 모달 없이 세션만 정리한다.
      if (isAutoLoginInProgress) {
        setAutoLoginInProgress(false)
        onLogout({ path: ROUTE_PATH.HOME })
        return
      }

      switch (error.code) {
        case LOGIN_ERROR_CODE.RESIDENT_NOT_FOUND:
        case LOGIN_ERROR_CODE.INVALID_PASSWORD:
        case LOGIN_ERROR_CODE.APT_NOT_FOUND:
          // 세 코드가 같은 문구를 쓴다 — 어느 쪽이 틀렸는지 알려주지 않는다.
          showErrorModal({ text: LOGIN_ERROR_MESSAGE.INVALID_CREDENTIAL })
          break

        case LOGIN_ERROR_CODE.HOUSEHOLD_NOT_FOUND:
          showErrorModal({ text: LOGIN_ERROR_MESSAGE.HOUSEHOLD_NOT_FOUND })
          break

        case LOGIN_ERROR_CODE.RESIDENT_NOT_APPROVED:
          // 승인 결과를 문자 대신 푸시로 보내기 위해 FCM 토큰을 먼저 등록시킨다.
          try {
            await sendWaitingMemberInfo({
              id: cleanPhoneHyphen({ phone: variables.id }),
              password: variables.password,
            })
          } catch (fcmError) {
            console.error('[usePatchLogin] 미승인 입주민 정보 발신 실패', fcmError)
          }
          void navigate(ROUTE_PATH.LOGIN_PENDING)
          break

        default:
          showErrorModal({ text: error.message })
      }
    },
  })

  return { patchLoginMutation, isPatchLoginPending }
}
