import { queryOptions } from '@tanstack/react-query'

import { getOrders } from '@/features/dashboard/api/dashboard'
import type { OrderListParams } from '@/features/dashboard/types/dashboard'

// 파라미터가 있으면 함수로 감싼다. 파라미터는 queryKey 마지막에 객체로 둔다 (04-state).
export const ordersQuery = (params: OrderListParams = {}) => {
  return queryOptions({
    queryKey: ['dashboard', 'orders', params] as const,
    queryFn: () => {
      return getOrders(params)
    },
  })
}
