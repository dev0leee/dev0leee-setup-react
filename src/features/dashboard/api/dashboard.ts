import type {
  CreateOrderPayload,
  Order,
  OrderListParams,
  RevenuePoint,
  UpdateOrderPayload,
} from '@/features/dashboard/types/dashboard'
import { api } from '@/shared/lib/apiClient'

export const getRevenue = async (): Promise<RevenuePoint[]> => {
  const { data } = await api.get<RevenuePoint[]>('/dashboard/revenue')
  return data
}

// 쿼리 파라미터는 문자열로 이어붙이지 말고 요청의 params로 넘긴다.
// 직렬화(배열 repeat 등)는 apiClient의 paramsSerializer가 담당한다 (03-api).
export const getOrders = async (params: OrderListParams = {}): Promise<Order[]> => {
  const { data } = await api.get<Order[]>('/dashboard/orders', { params })
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
