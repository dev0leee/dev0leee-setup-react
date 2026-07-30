import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, type RenderOptions, type RenderResult } from '@testing-library/react'
import type { ReactElement, ReactNode } from 'react'
import { MemoryRouter, type MemoryRouterProps } from 'react-router-dom'

/** 테스트마다 새 QueryClient를 만들어 캐시가 테스트 간에 새지 않게 한다. */
const createTestQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: 0 },
      mutations: { retry: false },
    },
  })
}

/**
 * 테스트용 렌더. Query와 라우터를 함께 씌운다.
 *
 * `initialEntries`를 넘기면 시작 위치와 **라우터 state**를 지정할 수 있다.
 * 화면 이동을 검증하려면 `ui`에 `<Routes>`를 직접 넣고 목적지 자리를 만든다:
 *
 * ```tsx
 * renderWithProviders({
 *   initialEntries: [{ pathname: '/password/reset', state: { verifiedToken: 't' } }],
 *   ui: (
 *     <Routes>
 *       <Route path="/" element={<h1>인트로</h1>} />
 *       <Route path="/password/reset" element={<PasswordResetPage />} />
 *     </Routes>
 *   ),
 * })
 * ```
 */
export const renderWithProviders = ({
  ui,
  initialEntries,
  options,
}: {
  ui: ReactElement
  initialEntries?: MemoryRouterProps['initialEntries']
  options?: Omit<RenderOptions, 'wrapper'>
}): RenderResult => {
  const Wrapper = ({ children }: { children: ReactNode }) => {
    return (
      <QueryClientProvider client={createTestQueryClient()}>
        <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
      </QueryClientProvider>
    )
  }

  return render(ui, { wrapper: Wrapper, ...options })
}

export * from '@testing-library/react'
export { default as userEvent } from '@testing-library/user-event'
