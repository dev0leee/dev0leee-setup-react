import { http, HttpResponse } from 'msw'

import { env } from '@/config/env'
import type { CreateOrderPayload, UpdateOrderPayload } from '@/features/dashboard/types/dashboard'

/**
 * axios의 baseURL 조합과 동일하게 단순 이어붙인다.
 * new URL('/login', 'http://host/api')는 '/api'를 버리고 'http://host/login'이 되므로 쓰면 안 된다.
 */
export const url = ({ path }: { path: string }) => {
  return `${env.VITE_API_URL.replace(/\/$/, '')}${path}`
}

const user = { id: 'u_1', email: 'dev@example.com', name: '개발자' }

// 단일 진실 공급원 - 목록·상세·수정 핸들러가 같은 fixture에서 파생한다 (03-api).
const orders = [
  { id: 'ORD-1001', customer: '김철수', amount: 128000, createdAt: '2026-07-18' },
  { id: 'ORD-1002', customer: '이영희', amount: 89000, createdAt: '2026-07-19' },
  { id: 'ORD-1003', customer: '박민수', amount: 245000, createdAt: '2026-07-20' },
]

export const handlers = [
  http.post(url({ path: '/login' }), () => {
    return HttpResponse.json({ accessToken: 'mock-access-token', user })
  }),

  http.post(url({ path: '/token-refresh' }), () => {
    return HttpResponse.json({ accessToken: 'mock-access-token', user })
  }),

  http.post(url({ path: '/logout' }), () => {
    return new HttpResponse(null, { status: 204 })
  }),

  http.get(url({ path: '/dashboard/revenue' }), () => {
    return HttpResponse.json([
      { month: '1월', revenue: 4200 },
      { month: '2월', revenue: 3800 },
      { month: '3월', revenue: 5100 },
      { month: '4월', revenue: 4700 },
      { month: '5월', revenue: 6200 },
      { month: '6월', revenue: 5800 },
    ])
  }),

  http.get(url({ path: '/dashboard/orders' }), () => {
    return HttpResponse.json(orders)
  }),

  http.get(url({ path: '/dashboard/orders/:orderId' }), ({ params }) => {
    const order = orders.find((candidate) => {
      return candidate.id === params.orderId
    })
    return order ? HttpResponse.json(order) : new HttpResponse(null, { status: 404 })
  }),

  http.post(url({ path: '/dashboard/orders' }), async ({ request }) => {
    const payload = (await request.json()) as CreateOrderPayload
    return HttpResponse.json(
      { id: 'ORD-9999', createdAt: '2026-07-25', ...payload },
      { status: 201 },
    )
  }),

  http.patch(url({ path: '/dashboard/orders/:orderId' }), async ({ params, request }) => {
    const order = orders.find((candidate) => {
      return candidate.id === params.orderId
    })
    if (!order) return new HttpResponse(null, { status: 404 })

    const payload = (await request.json()) as UpdateOrderPayload
    return HttpResponse.json({ ...order, ...payload })
  }),

  http.delete(url({ path: '/dashboard/orders/:orderId' }), () => {
    return new HttpResponse(null, { status: 204 })
  }),
]
