/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url'

import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // 같은 네트워크의 다른 기기(모바일 실기기 등)에서 접속할 수 있게 전 인터페이스에 바인딩한다.
  server: {
    host: true,
    port: 3000,
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/testing/setup.ts'],
    /* 테스트는 .env.test에 의존하지 않는다. 여기서 전 변수를 고정 주입해
       로컬·CI가 같은 값으로 돌게 만든다. config/env.ts의 zod 스키마와 함께 유지할 것. */
    env: {
      VITE_API_URL: 'https://api.test.local',
      VITE_BASE_URL: 'https://app.test.local',
      VITE_S3_BUCKET_URL_FILE: 'https://file.test.local',
      VITE_S3_BUCKET_URL_STATICS: 'https://statics.test.local',
      VITE_VERSION_ONE_URL: 'https://v1.test.local',
      VITE_TERMS_URL: 'https://terms.test.local',
      VITE_COMMUNITY_URL: 'https://community.test.local',
      VITE_BUILD_ID: 'test',
      VITE_ENABLE_MSW: 'false',
    },
    // e2e는 Playwright가 담당한다. Vitest가 긁어가지 않도록 제외.
    exclude: ['**/node_modules/**', '**/dist/**', 'e2e/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: ['**/*.config.*', 'src/testing/**'],
    },
  },
})
