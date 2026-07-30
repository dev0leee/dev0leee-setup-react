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
      {/* 레거시 `ToastBase.vue`의 모양·위치를 그대로 맞춘다:
          하단 20px, 좌우 56px 여백(`left-14` + `w-[calc(100%-112px)]`),
          검정 80% 배경, 흰 글자, pretendard-15Regular, 가운데 정렬.
          sonner의 기본 카드 스타일은 전부 덮는다. */}
      <Toaster
        position="bottom-center"
        toastOptions={{
          unstyled: true,
          classNames: {
            toast:
              'pointer-events-none fixed bottom-5 left-14 z-[9999] flex w-[calc(100%-112px)] justify-center rounded bg-black/80 px-2 py-3 text-center pretendard-15Regular text-white',
          },
        }}
      />
      {/* 전역 오버레이는 App이 소유한다. 띄우는 쪽은 showErrorModal()만 부른다. */}
      <ErrorModal />
      {env.VITE_ENV !== 'production' && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  )
}
