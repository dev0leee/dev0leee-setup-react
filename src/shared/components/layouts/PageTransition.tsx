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
 *
 * ⚠️ **`h-full`이 필수다.** Vue `<Transition>`은 DOM 노드를 만들지 않아 화면 컴포넌트가
 * `<main>`의 직계 자식이었다(`LayoutAuth.vue`). React는 애니메이션을 걸 박스가 필요해
 * 래퍼가 하나 늘어나는데, 그 래퍼의 높이가 `auto`면 **화면의 `h-full`이 `auto`로 무너진다**
 * — `main`이 `overflow-hidden`이라 내용이 잘리고 **스크롤이 안 된다.**
 * `h-full`로 `main`의 높이를 그대로 통과시켜야 레거시와 같아진다.
 *
 * jsdom은 레이아웃을 계산하지 않으므로 **이 문제는 단위 테스트로 잡히지 않는다.**
 * `e2e/layout.spec.ts`가 실제 브라우저에서 스크롤 높이를 확인한다.
 */
export const PageTransition = ({ children }: PageTransitionProps) => {
  const { pathname } = useLocation()

  return (
    <div
      key={pathname}
      className="h-full animate-in duration-300 fade-in-0 motion-reduce:animate-none"
    >
      {children}
    </div>
  )
}
