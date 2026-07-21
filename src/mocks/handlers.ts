import { http, HttpResponse } from 'msw'

import { env } from '@/config/env'

/**
 * axios의 baseURL 조합과 동일하게 단순 이어붙인다.
 * new URL('/login', 'http://host/api')는 '/api'를 버리고 'http://host/login'이 되므로 쓰면 안 된다.
 */
const url = (path: string) => `${env.VITE_API_URL.replace(/\/$/, '')}${path}`

const user = { id: 'u_1', email: 'dev@example.com', name: '개발자' }

export const handlers = [
  http.post(url('/login'), () => HttpResponse.json({ accessToken: 'mock-access-token', user })),

  http.post(url('/token-refresh'), () =>
    HttpResponse.json({ accessToken: 'mock-access-token', user }),
  ),

  http.post(url('/logout'), () => new HttpResponse(null, { status: 204 })),

  http.get(url('/dashboard/revenue'), () =>
    HttpResponse.json([
      { month: '1월', revenue: 4200 },
      { month: '2월', revenue: 3800 },
      { month: '3월', revenue: 5100 },
      { month: '4월', revenue: 4700 },
      { month: '5월', revenue: 6200 },
      { month: '6월', revenue: 5800 },
    ]),
  ),

  http.get(url('/dashboard/orders'), () =>
    HttpResponse.json([
      { id: 'ORD-1001', customer: '김철수', amount: 128000, createdAt: '2026-07-18' },
      { id: 'ORD-1002', customer: '이영희', amount: 89000, createdAt: '2026-07-19' },
      { id: 'ORD-1003', customer: '박민수', amount: 245000, createdAt: '2026-07-20' },
    ]),
  ),
]
