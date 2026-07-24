import type { Order, RevenuePoint } from '@/features/dashboard/types/dashboard'
import { api } from '@/shared/lib/apiClient'

export const getRevenue = async (): Promise<RevenuePoint[]> => {
  const { data } = await api.get<RevenuePoint[]>('/dashboard/revenue')
  return data
}

export const getOrders = async (): Promise<Order[]> => {
  const { data } = await api.get<Order[]>('/dashboard/orders')
  return data
}
