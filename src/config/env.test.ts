import { describe, expect, it } from 'vitest'

import { env } from '@/config/env'

/**
 * env는 모듈 로드 시점에 검증되므로 이 파일이 import되는 것 자체가 "부팅이 된다"는 뜻이다.
 * 값 주입은 `vite.config.ts`의 `test.env`가 한다.
 */
describe('env', () => {
  it('APP_ENV를 Vite MODE에서 파생한다', () => {
    // vitest의 MODE는 'test'다. `.env`에 아무것도 적지 않아도 development로 떨어진다 —
    // 이것이 VITE_ENV 변수를 없앤 근거다.
    expect(env.APP_ENV).toBe('development')
  })

  it('선택 변수의 빈 값을 기본값으로 채운다', () => {
    // test.env가 VITE_POSTHOG_HOST·VITE_ENABLE_MSW를 주지 않는다 = 미설정과 같다.
    expect(env.VITE_POSTHOG_HOST).toBe('https://us.i.posthog.com')
    expect(env.VITE_ENABLE_MSW).toBe(false)
  })

  it('필수 변수는 그대로 노출한다', () => {
    expect(env.VITE_API_URL).toBe('https://api.test.local')
  })
})
