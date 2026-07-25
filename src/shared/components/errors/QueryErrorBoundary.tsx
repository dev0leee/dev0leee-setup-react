import * as Sentry from '@sentry/react'
import { QueryErrorResetBoundary } from '@tanstack/react-query'
import { ErrorBoundary } from 'react-error-boundary'

import type { QueryErrorBoundaryProps } from '@/shared/types/queryErrorBoundary'

/**
 * ErrorBoundary + QueryErrorResetBoundary 조합.
 *
 * ErrorBoundary만 리셋하면 컴포넌트는 다시 렌더되지만 Query 캐시에는 에러가 남아
 * 즉시 다시 터진다. 두 리셋을 연결해야 "다시 시도"가 실제로 동작한다.
 */
export const QueryErrorBoundary = ({
  FallbackComponent,
  resetKeys,
  children,
}: QueryErrorBoundaryProps) => {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => {
        return (
          <ErrorBoundary
            onReset={reset}
            resetKeys={resetKeys}
            FallbackComponent={FallbackComponent}
            onError={(error, errorInfo) => {
              Sentry.captureException(error, { extra: { ...errorInfo } })
            }}
          >
            {children}
          </ErrorBoundary>
        )
      }}
    </QueryErrorResetBoundary>
  )
}
