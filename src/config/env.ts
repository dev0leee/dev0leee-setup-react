import { z } from 'zod'

/**
 * VITE_ 접두사가 붙은 값은 번들에 그대로 박혀 브라우저에서 보인다.
 * 시크릿은 절대 넣지 말 것.
 */

/** 배포 환경. `.env` 변수가 아니라 Vite `MODE`에서 파생된다 */
export type AppEnv = 'development' | 'staging' | 'production'

/**
 * 배포 환경을 Vite `MODE`에서 뽑는다.
 *
 * **`.env`에 따로 적지 않는다.** `--mode`가 이미 환경을 결정하는데 변수로 또 받으면
 * 둘이 어긋날 수 있다 — `--mode production`으로 빌드하면서 `VITE_ENV=development`가
 * 남아 있으면 프로덕션에서 스택트레이스가 노출되고 Sentry가 dev로 태깅된다.
 * 레거시도 `import.meta.env.MODE`로 판단했다.
 *
 * opinion 빌드는 `production.opinion`처럼 접미사가 붙으므로 첫 조각만 본다.
 * vitest는 `test`인데, 프로덕션이 아니면 전부 개발로 취급하면 되므로 따로 다루지 않는다.
 */
const resolveAppEnv = (): AppEnv => {
  const [baseMode] = import.meta.env.MODE.split('.')

  if (baseMode === 'production') return 'production'
  if (baseMode === 'staging') return 'staging'
  if (baseMode === 'development' || baseMode === 'test') return 'development'

  // 새 배포 모드를 만들었으면 위에 한 줄 추가한다. 조용히 개발로 떨어지지 않게 알린다.
  console.warn(`[env] 알 수 없는 모드 '${import.meta.env.MODE}' — development로 취급합니다.`)
  return 'development'
}

/**
 * `.env`에 키만 두고 값을 비워두면 Vite는 `undefined`가 아니라 **빈 문자열**을 준다.
 * 그러면 `.optional()`·`.default()`가 발동하지 않아 "설정 안 함"을 표현할 수 없다.
 *
 * 빈 플레이스홀더(`VITE_POSTHOG_HOST=`)는 `.env` 파일의 흔한 관행이므로
 * 선택 변수에만 이 래퍼를 씌워 미설정으로 취급한다.
 * **필수 변수에는 씌우지 않는다** — 값이 비었으면 부팅 시 터져야 한다.
 */
const optionalEnv = <T extends z.ZodType>(schema: T) => {
  return z.preprocess((value) => {
    return value === '' ? undefined : value
  }, schema)
}

/**
 * 메인 앱과 opinion 앱이 **둘 다** 주입받는 변수.
 * 모듈 로드 시점에 검증하므로 하나라도 없으면 앱이 부팅하지 못한다.
 */
const sharedSchema = z.object({
  /** API 서버 baseURL. 레거시 `VITE_SERVER_REQUEST_SERVICE_URL`의 새 이름. */
  VITE_API_URL: z.url(),
  /** 앱 자신의 배포 URL. 외부 인증 콜백의 returnUrl 등에 쓴다. */
  VITE_BASE_URL: z.url(),
  /** 첨부파일 S3 버킷 */
  VITE_S3_BUCKET_URL_FILE: z.url(),

  VITE_SENTRY_DSN: optionalEnv(z.string().optional()),
  /** 배포 커밋 SHA. `version.json`의 buildId와 비교해 새 배포를 감지한다. */
  VITE_BUILD_ID: optionalEnv(z.string().default('local')),
  VITE_POSTHOG_PROJECT_TOKEN: optionalEnv(z.string().optional()),
  /** 레거시 `lib/posthog/posthog.js`의 폴백 값을 그대로 기본값으로 둔다. */
  VITE_POSTHOG_HOST: optionalEnv(z.url().default('https://us.i.posthog.com')),
  VITE_ENABLE_MSW: optionalEnv(
    z
      .enum(['true', 'false'])
      .default('false')
      .transform((value) => {
        return value === 'true'
      }),
  ),
})

/**
 * 메인 앱 **전용** 변수. opinion 빌드에는 주입되지 않는다(`docs/migration/env-vars.md` §1-2).
 *
 * sharedSchema에 합치면 opinion 앱이 부팅 시 검증 실패로 죽는다.
 * 그래서 검증을 분리하고, 메인 엔트리(`src/main.tsx`)가 부팅 때 한 번 호출해
 * fail-fast를 유지한다. opinion 엔트리는 호출하지 않으므로 영향받지 않는다.
 */
const mainOnlySchema = z.object({
  /** 정적 이미지 S3 버킷 */
  VITE_S3_BUCKET_URL_STATICS: z.url(),
  /** 버전1 입주민 앱 URL */
  VITE_VERSION_ONE_URL: z.url(),
  /** 약관 페이지 URL (별도 앱 apt-terms) */
  VITE_TERMS_URL: z.url(),
  VITE_COMMUNITY_URL: z.url(),
})

type MainOnlyEnv = z.infer<typeof mainOnlySchema>

const parse = <T extends z.ZodType>(schema: T, label: string): z.infer<T> => {
  const parsed = schema.safeParse(import.meta.env)

  if (!parsed.success) {
    // 잘못된 env로 배포되는 사고를 부팅 시점에 터뜨린다.
    //
    // `treeifyError`는 객체를 돌려줘 DevTools가 접어버린다 — 어떤 키가 틀렸는지
    // 보려면 손으로 펼쳐야 한다. `prettifyError`는 여러 줄 문자열이라 그대로 읽힌다.
    // 부팅이 막힌 상황에서 원인을 한눈에 보는 것이 이 로그의 존재 이유다.
    console.error(`[env] ${label} 환경변수 검증 실패\n${z.prettifyError(parsed.error)}`)
    throw new Error('환경변수 설정이 잘못됐습니다. .env 파일을 확인하세요.')
  }

  return parsed.data
}

/**
 * 앱 어디서도 import.meta.env를 직접 쓰지 말고 이 객체만 사용한다.
 *
 * `VITE_*` 키는 `.env`에서 온 것이고, `APP_ENV`는 빌드 모드에서 파생된 것이다 —
 * 이름에 `VITE_` 접두사가 없는 이유다. `.env`에 `VITE_APP_ENV`를 적어도 읽지 않는다.
 */
export const env = {
  ...parse(sharedSchema, '공통'),
  APP_ENV: resolveAppEnv(),
}

let mainOnlyEnv: MainOnlyEnv | null = null

/**
 * 메인 앱 전용 변수를 검증해 반환한다. 최초 호출에서만 검증하고 이후엔 캐시를 준다.
 * opinion 앱 코드에서는 호출하지 않는다 — 호출하면 변수가 없어 throw한다.
 */
export const getMainEnv = (): MainOnlyEnv => {
  mainOnlyEnv ??= parse(mainOnlySchema, '메인 앱 전용')
  return mainOnlyEnv
}
