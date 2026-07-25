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

export interface CreateOrderPayload {
  customer: string
  amount: number
}

export type UpdateOrderPayload = Partial<CreateOrderPayload>
