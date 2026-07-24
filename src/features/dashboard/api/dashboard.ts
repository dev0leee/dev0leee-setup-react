import type { Order, RevenuePoint } from '@/features/dashboard/types/dashboard'
import { api } from '@/shared/lib/apiClient'

export async function getRevenue(): Promise<RevenuePoint[]> {
  const { data } = await api.get<RevenuePoint[]>('/dashboard/revenue')
  return data
}

export async function getOrders(): Promise<Order[]> {
  const { data } = await api.get<Order[]>('/dashboard/orders')
  return data
}
