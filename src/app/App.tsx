import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { RouterProvider } from 'react-router-dom'

import { router } from '@/app/router'
import { env } from '@/config/env'
import { ErrorModal } from '@/shared/components/common/ErrorModal'
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
        {/* AuthProvider는 라우터 밖이 아니라 루트 라우트(AppRoot)에 있다.
            자동 로그인·로그인 성공 시 useNavigate로 화면을 옮기기 때문이다. */}
        <RouterProvider router={router} />
      </QueryErrorBoundary>
      <Toaster />
      {/* 전역 오버레이는 App이 소유한다. 띄우는 쪽은 showErrorModal()만 부른다. */}
      <ErrorModal />
      {env.VITE_ENV !== 'production' && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  )
}
