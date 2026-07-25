import type { ComponentType, ReactNode } from 'react'
import type { FallbackProps } from 'react-error-boundary'

export interface QueryErrorBoundaryProps {
  FallbackComponent: ComponentType<FallbackProps>
  /** 값이 바뀌면 바운더리가 자동 복구된다. 보통 라우트 pathname을 넘긴다. */
  resetKeys?: unknown[]
  children: ReactNode
}
