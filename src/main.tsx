import * as Sentry from '@sentry/react'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { App } from '@/app/App'
import { env, getMainEnv } from '@/config/env'
import {
  DEVELOPMENT_TRACES_SAMPLE_RATE,
  PRODUCTION_TRACES_SAMPLE_RATE,
} from '@/shared/constants/sentry'

import '@/index.css'

if (env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: env.VITE_SENTRY_DSN,
    environment: env.VITE_ENV,
    tracesSampleRate:
      env.VITE_ENV === 'production'
        ? PRODUCTION_TRACES_SAMPLE_RATE
        : DEVELOPMENT_TRACES_SAMPLE_RATE,
  })
}

const enableMocking = async (): Promise<void> => {
  // import.meta.env.DEV는 빌드 타임에 상수로 치환된다.
  // 이 가드가 없으면 msw 400KB가 프로덕션 번들에 그대로 딸려간다
  // (env.VITE_ENABLE_MSW는 Zod transform을 거쳐 정적 분석이 안 되기 때문).
  if (!import.meta.env.DEV || !env.VITE_ENABLE_MSW) return

  try {
    const { worker } = await import('@/testing/mocks/browser')
    await worker.start({ onUnhandledRequest: 'bypass' })
  } catch (error) {
    // 서비스워커를 못 쓰는 환경(e2e에서 차단, 비 secure context 등)에서도
    // 앱은 떠야 한다. 목킹 실패로 화면이 안 뜨는 게 더 나쁘다.
    console.warn('[msw] 목 서버를 시작하지 못했습니다. 실제 API로 요청합니다.', error)
  }
}

const bootstrap = async (): Promise<void> => {
  // 메인 앱 전용 환경변수를 부팅 시점에 검증한다(config/env.ts 참고).
  // opinion 엔트리는 이 호출을 하지 않는다 — 해당 변수를 주입받지 않기 때문이다.
  getMainEnv()

  const rootElement = document.getElementById('root')
  if (!rootElement) throw new Error('#root 엘리먼트를 찾을 수 없습니다.')

  // 목 서버가 뜨기 전에 렌더하면 첫 요청이 실제 네트워크로 새어나간다.
  await enableMocking()

  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

void bootstrap()
