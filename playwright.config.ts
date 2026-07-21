import { defineConfig, devices } from '@playwright/test'

const PORT = 5173
const baseURL = `http://localhost:${PORT}`

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['html'], ['github']] : 'list',
  use: {
    baseURL,
    trace: 'on-first-retry',
    // MSW 서비스워커를 차단한다. 워커가 살아있으면 page.route보다 먼저 가로채서
    // 테스트가 원하는 응답을 지정할 수 없다. e2e에서는 Playwright가 네트워크를 통제한다.
    serviceWorkers: 'block',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  // dev 서버로 돌린다. .env.development의 VITE_ENABLE_MSW=true 덕분에
  // 백엔드 없이도 e2e가 동작한다.
  webServer: {
    command: 'pnpm dev',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
