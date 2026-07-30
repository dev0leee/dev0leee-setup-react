import { AlertTriangle, RefreshCw } from 'lucide-react'
import type { FallbackProps } from 'react-error-boundary'

import { env } from '@/config/env'
import { Button } from '@/shared/components/ui/button'
import type { DevDetailProps } from '@/shared/types/fallbacks'

const DevDetail = ({ error }: DevDetailProps) => {
  if (env.APP_ENV === 'production') return null
  const message = error instanceof Error ? error.message : String(error)
  return <pre className="mt-2 text-xs break-all text-muted-foreground">{message}</pre>
}

/** 1계층 - 앱 루트. 여기까지 왔으면 화면 전체가 살아남지 못한 상태다. */
export const RootErrorFallback = ({ error, resetErrorBoundary }: FallbackProps) => {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 p-6 text-center">
      <AlertTriangle className="size-10 text-destructive" />
      <div>
        <h1 className="text-lg font-semibold">문제가 발생했습니다</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          잠시 후 다시 시도해 주세요. 문제가 계속되면 관리자에게 문의하세요.
        </p>
        <DevDetail error={error} />
      </div>
      <Button onClick={resetErrorBoundary}>
        <RefreshCw /> 다시 시도
      </Button>
    </div>
  )
}

/** 2계층 - 라우트. 헤더/사이드바는 살아있고 페이지 영역만 대체된다. */
export const RouteErrorFallback = ({ error, resetErrorBoundary }: FallbackProps) => {
  return (
    <div className="flex flex-col items-center justify-center gap-4 p-12 text-center">
      <AlertTriangle className="size-8 text-destructive" />
      <div>
        <h2 className="font-semibold">페이지를 불러오지 못했습니다</h2>
        <DevDetail error={error} />
      </div>
      <Button variant="outline" onClick={resetErrorBoundary}>
        <RefreshCw /> 다시 시도
      </Button>
    </div>
  )
}

/** 3계층 - 위젯. 차트 하나가 죽어도 나머지 대시보드는 그대로 동작한다. */
export const WidgetErrorFallback = ({ error, resetErrorBoundary }: FallbackProps) => {
  return (
    <div className="flex h-full min-h-32 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border p-4 text-center">
      <p className="text-sm text-muted-foreground">데이터를 불러오지 못했습니다</p>
      <DevDetail error={error} />
      <Button size="sm" variant="ghost" onClick={resetErrorBoundary}>
        <RefreshCw /> 다시 시도
      </Button>
    </div>
  )
}
