import type { Page } from '@playwright/test'

/** .env.development의 VITE_API_URL과 일치해야 한다. */
const API = 'http://localhost:8080/api'

const USER = { id: 'u_1', email: 'dev@example.com', name: '개발자' }

interface Options {
  page: Page
  /** 'valid'면 새로고침만으로 로그인 상태가 복원된다. */
  session: 'valid' | 'none'
}

/**
 * e2e에서 백엔드를 대신한다.
 * MSW는 playwright.config의 serviceWorkers:'block'으로 꺼져 있으므로
 * 여기서 지정한 응답이 그대로 앱에 전달된다.
 */
export const mockApi = async ({ page, session }: Options): Promise<void> => {
  await page.route(`${API}/token-refresh`, (route) => {
    return session === 'valid'
      ? route.fulfill({ json: { accessToken: 'mock-access-token', user: USER } })
      : route.fulfill({ status: 401, json: { message: '세션이 만료되었습니다.' } })
  })

  await page.route(`${API}/login`, (route) => {
    return route.fulfill({ json: { accessToken: 'mock-access-token', user: USER } })
  })

  await page.route(`${API}/logout`, (route) => {
    return route.fulfill({ status: 204 })
  })

  await page.route(`${API}/dashboard/revenue`, (route) => {
    return route.fulfill({
      json: [
        { month: '1월', revenue: 4200 },
        { month: '2월', revenue: 3800 },
        { month: '3월', revenue: 5100 },
      ],
    })
  })

  await page.route(`${API}/dashboard/orders`, (route) => {
    return route.fulfill({
      json: [{ id: 'ORD-1001', customer: '김철수', amount: 128000, createdAt: '2026-07-18' }],
    })
  })
}
