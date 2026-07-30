import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'

import { postVersionOneResidentSignUp } from '@/features/auth/api/versionOne'
import { useLoginData } from '@/features/auth/hooks/useLoginData'
import { SIGNUP_ERROR_CODE } from '@/shared/constants/errorCode'
import { SIGNUP_ERROR_MESSAGE } from '@/shared/constants/message'
import { ROUTE_PATH } from '@/shared/constants/routes'
import { showErrorModal } from '@/shared/lib/errorModal'
import { clearTokens } from '@/shared/lib/tokenStore'
import { useAuthStore } from '@/shared/stores/authStore'

/**
 * 버전1 입주민 전환 제출. 레거시 `lib/queries/auth/usePostUserVersionOneInfo.js` 이식.
 *
 * 성공하면 **로그인 부트스트랩을 그대로 돌린다** — 이 시점에 이미 토큰이 있으므로
 * 단지 컨텍스트만 채우면 정상 로그인 상태가 된다.
 *
 * ⚠️ **에러 시 모달을 띄운 뒤 세션을 지우고 `/`로 보낸다.** 회원가입(S4)과 에러 문구 표는
 * 같지만 처리가 다르다 — 여기는 이미 로그인 상태라 어중간한 세션을 남기면 안 된다.
 *
 * ⚠️ 레거시 `deleteLocalInfo()`는 **`clearAuth()`가 아니다.** 토큰 2개와 `aptInfo`만
 * 지우고 `userAuthInfo`(자동 로그인용 아이디·비밀번호)는 **남긴다.** 그대로 옮겼다.
 *
 * ⚠️ `KMC_ERROR`는 모달 콜백에서 한 번 더 `/`로 보낸다. 레거시가 `callback`과 공통 처리
 * 양쪽에 이동을 넣어둔 것으로, 결과적으로 같은 곳으로 두 번 간다. 그대로 재현한다.
 */
export const usePostUserVersionOneInfo = () => {
  const navigate = useNavigate()
  const loadLoginData = useLoginData()

  const { mutate: postUserVersionOneInfoMutation, isPending: isPostUserVersionOneInfoPending } =
    useMutation({
      mutationFn: ({ apiToken, certNum }: { apiToken: string; certNum: string }) => {
        return postVersionOneResidentSignUp({ apiToken, certNum })
      },

      onSuccess: async () => {
        await loadLoginData()
        void navigate(ROUTE_PATH.MAIN)
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

        // 레거시 `deleteLocalInfo()` — 토큰과 단지 정보만 지운다(자동 로그인 자격은 남긴다).
        clearTokens()
        useAuthStore.getState().clearAptInfo()
        void navigate(ROUTE_PATH.HOME)
      },
    })

  return { postUserVersionOneInfoMutation, isPostUserVersionOneInfoPending }
}
