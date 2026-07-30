import { useNavigate } from 'react-router-dom'

import { ButtonBase } from '@/shared/components/common/ButtonBase'
import { ROUTE_PATH } from '@/shared/constants/routes'

/**
 * 404. 레거시 `ExceptionView/NotFoundView.vue` 이식 (`exception.md` E3).
 *
 * ⚠️ **로그인 상태를 보지 않고 무조건 `/main`으로 보낸다** (E1과 다르다).
 * 미로그인 상태에서 404를 만나면 `/main` → 가드 → `/intro`로 두 번 튄다.
 * 레거시 그대로 재현한 것이다.
 */
export const NotFoundPage = () => {
  const navigate = useNavigate()

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-5 bg-defaults-secondary-background-secondary">
      <img src="/assets/icons/InfoCircleGray.svg" alt="경고 아이콘" className="w-10" />
      <p className="text-defaults-secondary-text-secondary">경로가 올바르지 않습니다</p>
      <div>
        <ButtonBase
          type="button"
          roundType="rounded"
          color="brand"
          className="w-fit"
          onClick={() => {
            void navigate(ROUTE_PATH.MAIN)
          }}
        >
          메인으로 이동
        </ButtonBase>
      </div>
    </div>
  )
}
