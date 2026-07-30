import { QueryCache, QueryClient } from '@tanstack/react-query'

import { DEFAULT_STALE_TIME_MS, QUERY_RETRY_COUNT } from '@/shared/constants/query'
import { notifyNetworkError } from '@/shared/lib/notifyError'

/**
 * 기본값을 **레거시 `main.js`의 QueryClient에 맞춘다**
 * (`docs/migration/tech-mapping.md` §4-3).
 *
 * 템플릿 기본값(retry 2 · staleTime 60s · throwOnError · 전역 뮤테이션 토스트)을
 * 그대로 두면 등가 이관이 깨진다:
 *  - 전역 뮤테이션 토스트 + 레거시 에러 모달이 **둘 다** 떠서 알림이 이중으로 보인다
 *  - `throwOnError: true`는 조회 실패를 ErrorBoundary 화면으로 승격시키는데,
 *    레거시는 화면마다 자체 빈/에러 상태를 그린다
 *  - `staleTime: 60s`는 화면 재진입 시 재요청 여부를 바꿔 데이터 신선도가 달라진다
 */
export const queryClient = new QueryClient({
  // 레거시에 전역 뮤테이션 에러 토스트가 없으므로 MutationCache.onError를 두지 않는다.
  // 조회 에러도 화면이 처리한다. 여기서는 오프라인만 알린다 —
  // 레거시 라우터 가드의 오프라인 토스트와 같은 문구다.
  queryCache: new QueryCache({
    onError: (error) => {
      notifyNetworkError({ error })
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: DEFAULT_STALE_TIME_MS,
      retry: QUERY_RETRY_COUNT,
      throwOnError: false,
    },
    mutations: {
      retry: QUERY_RETRY_COUNT,
      throwOnError: false,
    },
  },
})
