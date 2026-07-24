import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, type RenderOptions } from '@testing-library/react'
import type { ReactElement, ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'

/** 테스트마다 새 QueryClient를 만들어 캐시가 테스트 간에 새지 않게 한다. */
const createTestQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: 0 },
      mutations: { retry: false },
    },
  })
}

const Wrapper = ({ children }: { children: ReactNode }) => {
  return (
    <QueryClientProvider client={createTestQueryClient()}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  )
}

export const renderWithProviders = ({
  ui,
  options,
}: {
  ui: ReactElement
  options?: Omit<RenderOptions, 'wrapper'>
}) => {
  return render(ui, { wrapper: Wrapper, ...options })
}

export * from '@testing-library/react'
export { default as userEvent } from '@testing-library/user-event'
