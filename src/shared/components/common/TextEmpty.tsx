import type { ReactNode } from 'react'

import { cn } from '@/shared/utils/cn'

/**
 * 빈 목록 안내. 레거시 `TextEmpty.vue` — 문구는 호출부가 넘긴다.
 *
 * `className`은 Vue의 클래스 fallthrough를 대신한다. 레거시 호출부가
 * `<TextEmpty class="text-center pretendard-14Regular">`처럼 루트 `<p>`에 클래스를 얹는다
 * (메인 공지 Top3 — `main.md` §10).
 */
export const TextEmpty = ({ children, className }: { children: ReactNode; className?: string }) => {
  return (
    <p
      className={cn(
        'flex w-full items-center justify-center pretendard-14Regular text-defaults-secondary-text-secondary',
        className,
      )}
    >
      {children}
    </p>
  )
}
