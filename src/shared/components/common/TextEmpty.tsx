import type { ReactNode } from 'react'

/** 빈 목록 안내. 레거시 `TextEmpty.vue` — 문구는 호출부가 넘긴다 */
export const TextEmpty = ({ children }: { children: ReactNode }) => {
  return (
    <p className="flex w-full items-center justify-center pretendard-14Regular text-defaults-secondary-text-secondary">
      {children}
    </p>
  )
}
