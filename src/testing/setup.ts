import '@testing-library/jest-dom/vitest'

import { cleanup } from '@testing-library/react'
import { afterAll, afterEach, beforeAll } from 'vitest'

import { server } from '@/testing/mocks/server'

/**
 * jsdom에는 `IntersectionObserver`가 없다. 무한 스크롤 목록(게시판 4종·공지 2종)이
 * 전부 이것을 쓰므로 최소 스텁을 둔다.
 *
 * **교차를 발생시키지는 않는다** — 다음 페이지 로딩은 통합 테스트의 관심사가 아니고,
 * 실제 교차 판정은 브라우저 레이아웃에 의존해 jsdom에서 재현할 수 없다.
 */
class IntersectionObserverStub {
  readonly root = null
  readonly rootMargin = ''
  readonly scrollMargin = ''
  readonly thresholds: readonly number[] = []

  observe(): void {
    // 교차 이벤트를 만들지 않는다
  }
  unobserve(): void {}
  disconnect(): void {}
  takeRecords(): IntersectionObserverEntry[] {
    return []
  }
}

globalThis.IntersectionObserver = IntersectionObserverStub as unknown as typeof IntersectionObserver

beforeAll(() => {
  // 핸들러가 없는 요청은 실패시킨다. 목킹 누락을 조용히 넘기지 않기 위함.
  server.listen({ onUnhandledRequest: 'error' })
})

afterEach(() => {
  cleanup()
  server.resetHandlers()
})

afterAll(() => {
  server.close()
})
