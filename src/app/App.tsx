import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { RouterProvider } from 'react-router-dom'

import { QueryErrorBoundary } from '@/components/errors/QueryErrorBoundary'
import { RootErrorFallback } from '@/components/errors/fallbacks'
import { Toaster } from '@/components/ui/sonner'
import { env } from '@/config/env'
import { AuthProvider } from '@/features/auth/AuthProvider'

import { queryClient } from './queryClient'
import { router } from './router'

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      {/* 1계층 바운더리 - 최후의 보루. QueryClientProvider 안쪽이어야
          QueryErrorResetBoundary가 동작한다. */}
      <QueryErrorBoundary FallbackComponent={RootErrorFallback}>
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </QueryErrorBoundary>
      <Toaster />
      {env.VITE_ENV !== 'production' && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  )
}
