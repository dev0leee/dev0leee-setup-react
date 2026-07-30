import { z } from 'zod'

/**
 * VITE_ 접두사가 붙은 값은 번들에 그대로 박혀 브라우저에서 보인다.
 * 시크릿은 절대 넣지 말 것.
 */

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
  VITE_ENV: z.enum(['development', 'staging', 'production']),
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

/** 앱 어디서도 import.meta.env를 직접 쓰지 말고 이 객체만 사용한다. */
export const env = parse(sharedSchema, '공통')

let mainOnlyEnv: MainOnlyEnv | null = null

/**
 * 메인 앱 전용 변수를 검증해 반환한다. 최초 호출에서만 검증하고 이후엔 캐시를 준다.
 * opinion 앱 코드에서는 호출하지 않는다 — 호출하면 변수가 없어 throw한다.
 */
export const getMainEnv = (): MainOnlyEnv => {
  mainOnlyEnv ??= parse(mainOnlySchema, '메인 앱 전용')
  return mainOnlyEnv
}
