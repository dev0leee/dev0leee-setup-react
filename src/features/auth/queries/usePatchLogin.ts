import { useMutation } from '@tanstack/react-query'

import { postLogin } from '@/features/auth/api/auth'
import type { LoginPayload } from '@/features/auth/types/auth'
import { setTokens } from '@/shared/lib/tokenStore'
import { useAuthStore } from '@/shared/stores/authStore'
import { cleanPhoneHyphen } from '@/shared/utils/cleanPhoneHyphen'

/**
 * 로그인. 레거시 `lib/queries/auth/usePatchLogin.js` 이식.
 *
 * 이 훅의 책임은 **토큰 저장과 자동 로그인 플래그 정리**까지다.
 * 화면 전환·에러 모달은 호출부가 `mutate`의 콜백으로 넘긴다 —
 * 수동 로그인과 자동 로그인이 같은 훅을 쓰면서 이동 여부가 다르기 때문이다.
 */
export const usePatchLogin = () => {
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
    onSuccess: ({ accessToken, refreshToken }) => {
      // ⚠️ 레거시의 호출 순서를 그대로 지킨다. 이 안에서 isAutoLoginInProgress가
      // 바뀌고, 뒤따르는 분기들이 그 값을 다시 읽기 때문이다(`deferred.md` D-192).
      const store = useAuthStore.getState()

      // 수동 로그인이면 이동 플래그를 되살린다. 자동 로그인 중에는 손대지 않는다.
      if (!store.isAutoLoginInProgress) store.setShouldRedirectAfterLogin(true)

      setTokens({ accessToken, refreshToken })

      // 토큰을 저장한 **뒤에** 내린다. 먼저 내리면 대기 큐가 토큰 없이 드레인된다.
      if (store.isAutoLoginInProgress) store.setAutoLoginInProgress(false)
    },
  })

  return { patchLoginMutation, isPatchLoginPending }
}
