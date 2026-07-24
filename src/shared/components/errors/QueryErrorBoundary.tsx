import * as Sentry from '@sentry/react'
import { QueryErrorResetBoundary } from '@tanstack/react-query'
import type { ComponentType, ReactNode } from 'react'
import { ErrorBoundary, type FallbackProps } from 'react-error-boundary'

interface Props {
  FallbackComponent: ComponentType<FallbackProps>
  /** 값이 바뀌면 바운더리가 자동 복구된다. 보통 라우트 pathname을 넘긴다. */
  resetKeys?: unknown[]
  children: ReactNode
}

/**
 * ErrorBoundary + QueryErrorResetBoundary 조합.
 *
 * ErrorBoundary만 리셋하면 컴포넌트는 다시 렌더되지만 Query 캐시에는 에러가 남아
 * 즉시 다시 터진다. 두 리셋을 연결해야 "다시 시도"가 실제로 동작한다.
 */
export const QueryErrorBoundary = ({ FallbackComponent, resetKeys, children }: Props) => {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary
          onReset={reset}
          resetKeys={resetKeys}
          FallbackComponent={FallbackComponent}
          onError={(error, info) => {
            Sentry.captureException(error, { extra: { ...info } })
          }}
        >
          {children}
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  )
}
