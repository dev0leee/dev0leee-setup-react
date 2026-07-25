import type { ReactNode } from 'react'

export interface WidgetProps {
  children: ReactNode
}

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

/** 주문 목록 쿼리 파라미터. 요청의 params로 전달된다. */
export interface OrderListParams {
  page?: number
  status?: string
}

export interface CreateOrderPayload {
  customer: string
  amount: number
}

export type UpdateOrderPayload = Partial<CreateOrderPayload>
