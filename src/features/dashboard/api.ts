import { queryOptions } from '@tanstack/react-query'

import { api } from '@/api/client'

export interface RevenuePoint {
  month: string
  revenue: number
}

export interface Order {
  id: string
  customer: string
  amount: number
  createdAt: string
}

export const revenueQuery = queryOptions({
  queryKey: ['dashboard', 'revenue'] as const,
  queryFn: async () => {
    const { data } = await api.get<RevenuePoint[]>('/dashboard/revenue')
    return data
  },
})

export const ordersQuery = queryOptions({
  queryKey: ['dashboard', 'orders'] as const,
  queryFn: async () => {
    const { data } = await api.get<Order[]>('/dashboard/orders')
    return data
  },
})
