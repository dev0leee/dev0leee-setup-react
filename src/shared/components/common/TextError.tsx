import type { ReactNode } from 'react'

import { cn } from '@/shared/utils/cn'

/**
 * 폼 필드 에러 문구. 레거시 `TextError.vue`.
 *
 * `min-h-[13px]`이 있어 **에러가 없을 때도 자리를 차지한다** — 문구가 나타날 때
 * 아래 요소가 밀리지 않게 하는 장치다. 지우면 폼이 덜컹거린다.
 */
export const TextError = ({
  className,
  children,
}: {
  className?: string
  children?: ReactNode
}) => {
  return (
    <p
      className={cn(
        'flex min-h-[13px] gap-1 text-left pretendard-14Regular text-alerts-error-text-error',
        className,
      )}
    >
      {children}
    </p>
  )
}
