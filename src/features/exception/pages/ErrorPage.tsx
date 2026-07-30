import { useLocation, useNavigate } from 'react-router-dom'

import type { ErrorLocationState } from '@/features/exception/types/exception'
import { ButtonBase } from '@/shared/components/common/ButtonBase'
import { ROUTE_PATH } from '@/shared/constants/routes'
import { isLoggedIn } from '@/shared/lib/authSession'

/**
 * 일시적 오류 안내. 레거시 `ExceptionView/ErrorView.vue` 이식 (`exception.md` E1·E2).
 *
 * `/error`와 `/error-auth`가 **같은 컴포넌트**다. 차이는 라우트 meta의
 * `showBottomNav`뿐이다 — `/error-auth`는 인증 레이아웃 하위라 하단 탭이 보인다.
 *
 * 버튼의 문구와 목적지가 로그인 여부로 갈린다. 판정 기준은 레거시 `isLoggedIn`과
 * 같은 **액세스 토큰 존재 여부**다 — 단지 정보까지 보는 `hasStoredSession`이 아니다.
 * 이 화면은 단지 정보를 못 받아서 오는 경로도 있어서 그 둘이 갈린다.
 */
export const ErrorPage = () => {
  const navigate = useNavigate()
  const { state } = useLocation() as { state: ErrorLocationState | null }

  const errorCode = state?.errorCode ?? ''
  const errorMessage = state?.message
  const hasSession = isLoggedIn()

  const movePage = () => {
    void navigate(hasSession ? ROUTE_PATH.MAIN : ROUTE_PATH.HOME)
  }

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center gap-8 bg-defaults-secondary-background-secondary px-10">
      <img
        src="/assets/images/aptmantIntro.svg"
        alt="아파트먼트 인트로 이미지"
        className="absolute top-0 left-0 w-full"
      />
      <div className="z-10 space-y-10 text-center text-defaults-secondary-text-secondary">
        <div className="z-20 flex flex-col items-center gap-3">
          <p className="pretendard-18Bold">일시적인 오류가 발생했습니다</p>
          <p>잠시 후 다시 시도해주세요</p>
          {/* 직접 진입하면 둘 다 없어서 상세 줄이 나오지 않는다. 정상 동작이다. */}
          {(errorCode || errorMessage) && (
            <div>
              <p>
                ({errorMessage} 에러코드 : {errorCode})
              </p>
            </div>
          )}
        </div>

        <div className="mx-auto flex w-fit justify-center">
          <ButtonBase type="button" roundType="rounded" color="brand" onClick={movePage}>
            {hasSession ? '메인' : '로그인'}으로 이동
          </ButtonBase>
        </div>
      </div>
    </div>
  )
}
