import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { RouterProvider } from 'react-router-dom'

import { router } from '@/app/router'
import { env } from '@/config/env'
import { AuthProvider } from '@/features/auth'
import { RootErrorFallback } from '@/shared/components/errors/fallbacks'
import { QueryErrorBoundary } from '@/shared/components/errors/QueryErrorBoundary'
import { Toaster } from '@/shared/components/ui/sonner'
import { queryClient } from '@/shared/lib/queryClient'

export const App = () => {
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
