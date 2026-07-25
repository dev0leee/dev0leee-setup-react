import { QueryClient } from '@tanstack/react-query'

import { DEFAULT_STALE_TIME_MS, MAX_QUERY_RETRIES } from '@/shared/constants/query'
import { ApiError } from '@/shared/lib/apiErrors'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: DEFAULT_STALE_TIME_MS,
      // 재시도는 Query가 담당한다. axios 인터셉터에도 재시도를 걸면 서버를 두 번 때린다.
      retry: (failureCount, error) => {
        if (error instanceof ApiError) {
          // 4xx는 재시도해도 결과가 같다. 401은 인터셉터가 refresh로 이미 처리했다.
          if (error.status >= 400 && error.status < 500) return false
        }
        return failureCount < MAX_QUERY_RETRIES
      },
      // 에러를 렌더 에러로 승격시켜 ErrorBoundary가 잡게 한다.
      // 화면마다 `if (error) return <Error />`를 반복하지 않아도 된다.
      throwOnError: true,
    },
    mutations: {
      retry: false,
      // 뮤테이션은 보통 폼 안에서 개별 처리하므로 바운더리로 던지지 않는다.
      throwOnError: false,
    },
  },
})
