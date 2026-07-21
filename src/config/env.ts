import { z } from 'zod'

/**
 * VITE_ 접두사가 붙은 값은 번들에 그대로 박혀 브라우저에서 보인다.
 * 시크릿은 절대 넣지 말 것.
 */
const schema = z.object({
  VITE_API_URL: z.url(),
  VITE_ENV: z.enum(['development', 'staging', 'production']),
  VITE_SENTRY_DSN: z.string().optional(),
  VITE_ENABLE_MSW: z
    .enum(['true', 'false'])
    .default('false')
    .transform((v) => v === 'true'),
})

const parsed = schema.safeParse(import.meta.env)

if (!parsed.success) {
  // 잘못된 env로 배포되는 사고를 부팅 시점에 터뜨린다.
  console.error('[env] 환경변수 검증 실패:', z.treeifyError(parsed.error))
  throw new Error('환경변수 설정이 잘못됐습니다. .env 파일을 확인하세요.')
}

/** 앱 어디서도 import.meta.env를 직접 쓰지 말고 이 객체만 사용한다. */
export const env = parsed.data
