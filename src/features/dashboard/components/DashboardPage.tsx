import { Suspense } from 'react'

import { OrdersTable } from '@/features/dashboard/components/OrdersTable'
import { RevenueChart } from '@/features/dashboard/components/RevenueChart'
import { WidgetErrorFallback } from '@/shared/components/errors/fallbacks'
import { QueryErrorBoundary } from '@/shared/components/errors/QueryErrorBoundary'
import { Card, CardContent } from '@/shared/components/ui/card'

/**
 * 3계층 바운더리 - 위젯 단위.
 * 차트가 죽어도 테이블은 그대로 동작한다. 대시보드에서 가장 중요한 계층.
 */
const Widget = ({ children }: { children: React.ReactNode }) => {
  return (
    <QueryErrorBoundary FallbackComponent={WidgetErrorFallback}>
      <Suspense fallback={<WidgetSkeleton />}>{children}</Suspense>
    </QueryErrorBoundary>
  )
}

const WidgetSkeleton = () => {
  return (
    <Card>
      <CardContent className="h-56 animate-pulse rounded-lg bg-muted/40" />
    </Card>
  )
}

export const DashboardPage = () => {
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
