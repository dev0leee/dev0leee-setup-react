import { useNavigate } from 'react-router-dom'

import { FIRE_INSPECTION_MESSAGE } from '@/features/fireInspection/constants/fireInspection'
import { ButtonBase } from '@/shared/components/common/ButtonBase'
import { AppBar } from '@/shared/components/layouts/AppBar'
import { ROUTE_PATH } from '@/shared/constants/routes'

/**
 * 점검 완료 (F3). 레거시 `FireInspectionCompleteView.vue` 이식.
 *
 * ⚠️ **뒤로가기가 이중으로 막혀 있다** — AppBar에 버튼이 없고(`hasBackButton={false}`),
 * `app/navigationBlocking.ts`가 이 경로에서의 popstate까지 막는다. 둘 다 필요하다.
 *
 * ✅ **F-Q14 결정 적용 — `홈으로 돌아가기`가 `/main`으로 직행한다.**
 * 레거시는 `/`로 보냈고 그것이 인트로 → 라우터 가드 → 메인으로 **3홉 우회**하면서
 * `getLoginInfo()`를 한 번 더 부르고 초기 입주민 정보를 앱에 재전송했다.
 * 🔴 **그 호출이 실패하면 `clearAuth()`가 돌아 로그아웃됐다** — 네트워크가 순간 끊기면
 * 점검을 마치자마자 튕기는 경로였다. 투표·설문 완료 화면은 원래 `/main` 직행이다.
 *
 * ⚠️ **인라인 `<svg>`다** — 코드베이스에서 거의 유일하다. `currentColor`로 토큰 색을
 * 받으므로 `<img>`로 바꾸면 색이 죽는다.
 */
export const FireInspectionCompletePage = () => {
  const navigate = useNavigate()

  return (
    <div className="flex h-full w-full flex-col bg-base-b-white">
      <AppBar title={FIRE_INSPECTION_MESSAGE.processTitle} hasBackButton={false} />

      <div className="flex flex-1 flex-col items-center justify-center px-5 pt-12">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-alerts-success-background-success-secondary">
          <svg
            width="40"
            height="40"
            viewBox="0 0 40 40"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="text-alerts-success-text-success"
          >
            <path
              d="M33.3334 11.6667L15.0001 30L6.66675 21.6667"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <h1 className="mt-6 pretendard-24Bold text-defaults-primary-text-primary">
          {FIRE_INSPECTION_MESSAGE.completeTitle}
        </h1>
        <p className="mt-2 text-center pretendard-14Regular text-defaults-tertiary-text-tertiary">
          {FIRE_INSPECTION_MESSAGE.completeDescriptionFirst}
          <br />
          {FIRE_INSPECTION_MESSAGE.completeDescriptionSecond}
        </p>
      </div>

      <div className="px-5 pb-8">
        <ButtonBase
          type="button"
          color="brand"
          size="xl"
          onClick={() => {
            // ✅ 레거시의 `'/'` 3홉 우회를 없앴다 (F-Q14)
            void navigate(ROUTE_PATH.MAIN)
          }}
        >
          {FIRE_INSPECTION_MESSAGE.goHome}
        </ButtonBase>
      </div>
    </div>
  )
}
