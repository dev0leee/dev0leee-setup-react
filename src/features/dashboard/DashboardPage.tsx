import { Suspense } from 'react'

import { QueryErrorBoundary } from '@/components/errors/QueryErrorBoundary'
import { WidgetErrorFallback } from '@/components/errors/fallbacks'
import { Card, CardContent } from '@/components/ui/card'

import { OrdersTable } from './OrdersTable'
import { RevenueChart } from './RevenueChart'

/**
 * 3계층 바운더리 - 위젯 단위.
 * 차트가 죽어도 테이블은 그대로 동작한다. 대시보드에서 가장 중요한 계층.
 */
function Widget({ children }: { children: React.ReactNode }) {
  return (
    <QueryErrorBoundary FallbackComponent={WidgetErrorFallback}>
      <Suspense fallback={<WidgetSkeleton />}>{children}</Suspense>
    </QueryErrorBoundary>
  )
}

function WidgetSkeleton() {
  return (
    <Card>
      <CardContent className="h-56 animate-pulse rounded-lg bg-muted/40" />
    </Card>
  )
}

export function DashboardPage() {
  return (
    <div className="grid gap-6 p-6 lg:grid-cols-2">
      <Widget>
        <RevenueChart />
      </Widget>
      <Widget>
        <OrdersTable />
      </Widget>
    </div>
  )
}
