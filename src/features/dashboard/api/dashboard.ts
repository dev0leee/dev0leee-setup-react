import type {
  CreateOrderPayload,
  Order,
  RevenuePoint,
  UpdateOrderPayload,
} from '@/features/dashboard/types/dashboard'
import { api } from '@/shared/lib/apiClient'

export const getRevenue = async (): Promise<RevenuePoint[]> => {
  const { data } = await api.get<RevenuePoint[]>('/dashboard/revenue')
  return data
}

export const getOrders = async (): Promise<Order[]> => {
  const { data } = await api.get<Order[]>('/dashboard/orders')
  return data
}

export const getOrder = async ({ orderId }: { orderId: string }): Promise<Order> => {
  const { data } = await api.get<Order>(`/dashboard/orders/${orderId}`)
  return data
}

export const createOrder = async (payload: CreateOrderPayload): Promise<Order> => {
  const { data } = await api.post<Order>('/dashboard/orders', payload)
  return data
}

export const updateOrder = async ({
  orderId,
  payload,
}: {
  orderId: string
  payload: UpdateOrderPayload
}): Promise<Order> => {
  const { data } = await api.patch<Order>(`/dashboard/orders/${orderId}`, payload)
  return data
}

export const deleteOrder = async ({ orderId }: { orderId: string }): Promise<void> => {
  await api.delete(`/dashboard/orders/${orderId}`)
}
