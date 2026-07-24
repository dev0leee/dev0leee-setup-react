import { queryOptions } from '@tanstack/react-query'

import { getOrders } from '@/features/dashboard/api/dashboard'

export const ordersQuery = queryOptions({
  queryKey: ['dashboard', 'orders'] as const,
  queryFn: getOrders,
})
