import { useLocation } from 'react-router-dom'

import type { PageTransitionProps } from '@/shared/types/pageTransition'

/**
 * 라우트 전환 시 새 페이지에 fade-in을 준다.
 *
 * key를 경로로 주면 라우트가 바뀔 때마다 안쪽이 재마운트돼 enter 애니메이션이 다시 돈다
 * (Vue의 `<Transition :key="route.fullPath">`에 해당). tw-animate-css의 `animate-in`을 쓴다.
 *
 * enter만 준다 — leave 애니메이션은 이전 페이지를 남겨둬야 해서 라이브러리가 필요하다.
 * 동작 줄이기를 켠 사용자는 `motion-reduce`로 애니메이션이 꺼진다 (14-styling).
 */
export const PageTransition = ({ children }: PageTransitionProps) => {
  const { pathname } = useLocation()

  return (
    <div key={pathname} className="animate-in duration-300 fade-in-0 motion-reduce:animate-none">
      {children}
    </div>
  )
}
