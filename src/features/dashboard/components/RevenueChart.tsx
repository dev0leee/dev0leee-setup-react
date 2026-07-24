import { useSuspenseQuery } from '@tanstack/react-query'
import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts'

import { revenueQuery } from '@/features/dashboard/queries/revenueQuery'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/shared/components/ui/chart'

const chartConfig = {
  revenue: { label: '매출', color: 'var(--chart-1)' },
} satisfies ChartConfig

export const RevenueChart = () => {
  const { data } = useSuspenseQuery(revenueQuery)

  return (
    <Card>
      <CardHeader>
        <CardTitle>월별 매출</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-56 w-full">
          <BarChart data={data}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="revenue" fill="var(--color-revenue)" radius={4} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
