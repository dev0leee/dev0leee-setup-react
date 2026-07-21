import { expect, test } from '@playwright/test'

import { mockApi } from './support/api'

test('세션이 없으면 로그인 화면으로 보낸다', async ({ page }) => {
  await mockApi(page, { session: 'none' })

  await page.goto('/')

  await expect(page).toHaveURL(/\/login$/)
  await expect(page.getByRole('heading', { name: '로그인' })).toBeVisible()
})

test('로그인하면 대시보드 위젯이 모두 보인다', async ({ page }) => {
  await mockApi(page, { session: 'none' })
  await page.goto('/login')

  await page.getByLabel('이메일').fill('dev@example.com')
  await page.getByLabel('비밀번호').fill('password123')
  await page.getByRole('button', { name: '로그인' }).click()

  await expect(page.getByText('월별 매출')).toBeVisible()
  await expect(page.getByText('최근 주문')).toBeVisible()
  await expect(page.getByText('ORD-1001')).toBeVisible()
})

test('세션이 살아있으면 새로고침해도 대시보드가 유지된다', async ({ page }) => {
  await mockApi(page, { session: 'valid' })

  await page.goto('/')

  await expect(page).toHaveURL('/')
  await expect(page.getByText('월별 매출')).toBeVisible()
})
