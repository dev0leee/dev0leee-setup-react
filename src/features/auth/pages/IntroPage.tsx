import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import { IntroForm } from '@/features/auth/components/IntroForm'
import { ROUTE_PATH } from '@/shared/constants/routes'
import { useAuthStore } from '@/shared/stores/authStore'

/**
 * 인트로. 레거시 `IntroView/IntroView.vue` 이식 (`auth.md` A1).
 *
 * **앱의 실질적 진입점이자 로그인 화면이다.** 별도 `/login` 경로는 없다.
 *
 * ⚠️ **마운트 시 `clearAuth()`를 호출한다.** 로그아웃·가드 실패로 돌아오는 자리이므로
 * 남은 세션 조각을 지운다. 이미 로그인한 사용자는 이 화면에 도달하지 않는다 —
 * `publicRouteLoader`가 렌더 전에 `/main`으로 돌린다. 그래서 이 호출이 정상 세션을
 * 지울 위험은 없다.
 *
 * ⚠️ 레거시에는 `deleteLocalInfo()` 호출이 **주석 처리**된 채 남아 있다
 * (`IntroView.vue:21-23`). 주석이므로 옮기지 않는다.
 */
export const IntroPage = () => {
  const navigate = useNavigate()
  const clearAuth = useAuthStore((state) => {
    return state.clearAuth
  })

  // 화면 진입이라는 외부 사건에 대한 응답이고 렌더 결과를 만들지 않는다 → effect가 맞다.
  useEffect(() => {
    clearAuth()
  }, [clearAuth])

  return (
    <div className="relative flex h-full w-full flex-col overflow-y-auto">
      <img
        src="/assets/images/aptmantIntro.svg"
        alt="아파트먼트 인트로 이미지"
        className="absolute top-0 left-0 -z-10 h-full w-full object-cover"
      />
      <div className="flex min-h-[200px] flex-1 items-center justify-center">
        <img src="/assets/images/aptmantLogoLong.png" alt="아파트먼트 로고" className="w-60" />
      </div>
      <div className="flex flex-1 flex-col bg-base-b-white">
        <IntroForm />
        <div className="flex flex-1 flex-col items-center justify-between gap-14 pb-10">
          <button
            type="button"
            className="flex items-center pretendard-16SemiBold text-navy-default-text-navy"
            onClick={() => {
              void navigate(ROUTE_PATH.PASSWORD_CERT)
            }}
          >
            비밀번호를 잊어버리셨나요?
          </button>
          <button
            type="button"
            className="flex items-center gap-2 pretendard-16Regular text-defaults-secondary-text-secondary"
            onClick={() => {
              void navigate(ROUTE_PATH.SIGNUP_TERMS)
            }}
          >
            아직 회원이 아니신가요?
            <span className="pretendard-16SemiBold text-navy-default-text-navy">회원가입</span>
          </button>
        </div>
      </div>
    </div>
  )
}
