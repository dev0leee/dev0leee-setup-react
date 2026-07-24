import { queryOptions } from '@tanstack/react-query'

import { getRevenue } from '@/features/dashboard/api/dashboard'

export const revenueQuery = queryOptions({
  queryKey: ['dashboard', 'revenue'] as const,
  queryFn: getRevenue,
})
