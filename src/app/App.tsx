import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { RouterProvider } from 'react-router-dom'

import { queryClient } from '@/app/queryClient'
import { router } from '@/app/router'
import { RootErrorFallback } from '@/components/errors/fallbacks'
import { QueryErrorBoundary } from '@/components/errors/QueryErrorBoundary'
import { Toaster } from '@/components/ui/sonner'
import { env } from '@/config/env'
import { AuthProvider } from '@/features/auth/AuthProvider'

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
