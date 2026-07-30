import type { ReactNode } from 'react'

/** 화면 제목. 레거시 `TextTitle.vue` — 마크업·클래스 그대로 */
export const TextTitle = ({ children }: { children: ReactNode }) => {
  return <h2 className="mb-8 flex flex-col pretendard-22Bold text-base-b-black">{children}</h2>
}
