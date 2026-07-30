# 환경변수 인벤토리 — 레거시 `apt-resident-fe` → 타깃

> 기준 SHA `6d5bf22` (2026-07-27) · 추출원 `.env.*`, `src/` 전수 grep, `.github/workflows/aws-deploy.yml`
> 전체 계획: `~/.claude/plans/working-smcom-apt-resident-fe-tranquil-charm.md`

## 집계

| 구분                          |                                     수 |
| ----------------------------- | -------------------------------------: |
| 레거시 `VITE_*` 변수          |                                 **11** |
| ├ `.env.*` 파일에 정의        |                                      9 |
| └ CI 빌드 시 주입             | 2 (`VITE_BUILD_ID`, `VITE_SENTRY_DSN`) |
| Node 측 변수                  |                1 (`SENTRY_AUTH_TOKEN`) |
| `import.meta.env.MODE` 사용처 |                              **23** ⚠️ |
| 타깃 현재 변수                |                                      4 |
| **타깃에 추가 필요**          |                                  **8** |

---

## 1. 레거시 변수 전수

### 1-1. `.env.development` / `.env.production` (메인 앱, 7개 — 키 동일)

| 변수                                  | 용도                                  | 코드 참조                                                                                      |
| ------------------------------------- | ------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `VITE_BASE_URL`                       | 앱 자신의 배포 URL                    | `constants/api.js` → `baseUrl`                                                                 |
| **`VITE_SERVER_REQUEST_SERVICE_URL`** | **API 서버 baseURL**                  | `constants/api.js` → `serverRequestUrl`. `axios.js`의 `baseURL`, `resident.js`의 `customAxios` |
| `VITE_S3_BUCKET_URL_FILE`             | 첨부파일 S3                           | `constants/api.js` → `s3UrlFile`                                                               |
| `VITE_S3_BUCKET_URL_STATICS`          | 정적 이미지 S3                        | 직접 참조 1곳                                                                                  |
| `VITE_VERSION_ONE_URL`                | 버전1 입주민 앱 URL                   | `constants/api.js` → `versionOneUrl`                                                           |
| `VITE_TERMS_URL`                      | 약관 페이지 URL (별도 앱 `apt-terms`) | `constants/api.js` → `termsUrl`                                                                |
| `VITE_COMMUNITY_URL`                  | 커뮤니티 URL                          | `constants/api.js` → `communityUrl`                                                            |

### 1-2. `.env.development.opinion` / `.env.production.opinion` (opinion 앱, 3개)

`VITE_BASE_URL` · `VITE_SERVER_REQUEST_SERVICE_URL` · `VITE_S3_BUCKET_URL_FILE`

> **opinion 앱은 메인 앱 변수의 부분집합**이다. 비회원 투표/설문만 하므로
> 약관·커뮤니티·버전1 URL이 필요 없다. Phase 0-6(빌드 형태) 결정에 참고.

### 1-3. `.env.local` (개발자 로컬, gitignore됨)

| 변수                         | 용도                  |
| ---------------------------- | --------------------- |
| `VITE_POSTHOG_PROJECT_TOKEN` | PostHog 프로젝트 토큰 |
| `VITE_POSTHOG_HOST`          | PostHog 호스트        |

### 1-4. CI 빌드 시 주입 (`.env.*`에 없음)

| 변수                | 용도                                                                                                           |
| ------------------- | -------------------------------------------------------------------------------------------------------------- |
| `VITE_BUILD_ID`     | 배포 커밋 SHA. `version.json`의 `buildId`와 비교해 새 배포 감지(`checkFrontVersion.js`), PostHog `app_version` |
| `VITE_SENTRY_DSN`   | Sentry DSN                                                                                                     |
| `SENTRY_AUTH_TOKEN` | **Node 측 변수** (`VITE_` 아님). `sentryVitePlugin`의 소스맵 업로드용                                          |

### 1-5. CI의 환경별 시크릿

`.github/workflows/aws-deploy.yml`은 `_DEV`/`_PROD` 접미사 시크릿을 빌드 시 접미사 없는 이름으로 매핑한다:

```
VITE_BASE_URL_DEV / _PROD / _OPINION_DEV / _OPINION_PROD  →  VITE_BASE_URL
VITE_SERVER_REQUEST_SERVICE_URL_DEV / _PROD               →  VITE_SERVER_REQUEST_SERVICE_URL
VITE_VERSION_ONE_URL_DEV / _PROD                          →  VITE_VERSION_ONE_URL
VITE_COMMUNITY_URL_DEV / _PROD                            →  VITE_COMMUNITY_URL
```

> ⚠️ CI에 **`VITE_POSTHOG_TOKEN`과 `VITE_POSTHOG_PROJECT_TOKEN`이 둘 다** 등장한다.
> 코드가 읽는 것은 `VITE_POSTHOG_PROJECT_TOKEN`이다. → `[확인 필요]` V-Q1

---

## 2. ⚠️ `import.meta.env.MODE` 23곳 — 최대 난제

레거시는 `MODE`를 **두 가지 목적**으로 쓴다.

### 2-1. opinion 앱 분기 (빌드 타임)

```js
// src/main.js
const isOpinion = import.meta.env.MODE.includes('opinion')
// src/vite.config.js
const isOpinionExternal = mode.includes('opinion')
```

`--mode development.opinion` / `production.opinion`으로 빌드해 **엔트리·라우터·출력 디렉터리를 가른다.**
이것은 런타임 값이 아니라 **빌드 구성**이다.

### 2-2. 개발 전용 기능 게이트

```js
if (import.meta.env.MODE === 'development') {
  console.log(message)
} // natives/native.js
// eruda 디버거 로드 등
```

### 타깃 제약

타깃은 **`src/**`에서 `import.meta.env` 직접 접근을 ESLint(`no-restricted-syntax`)로 금지**한다.
공식 예외는 `src/config/env.ts`(검증기)와 `src/main.tsx`(MSW 트리셰이킹 가드) **2곳뿐**이다.

### 이관 방침

| 용도               | 이관                                                                                                                                                             |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| opinion 분기 (2-1) | **`env`로 옮기지 않는다.** 빌드 구성 문제이므로 Phase 0-6 결정에 종속. 멀티 엔트리를 유지하면 `vite.config.ts`에서만 `mode`를 읽는다(설정 파일은 ESLint 대상 밖) |
| 개발 게이트 (2-2)  | `env.VITE_ENV === 'development'`로 대체. 동작 등가 (개발 편의 기능이라 프로덕션 영향 없음)                                                                       |

> 23곳 중 대부분이 2-2 유형으로 보이나 **Phase 3에서 전수 분류가 필요하다.**
> 새 예외가 필요하면 ESLint override와 README를 함께 고친다(타깃 CLAUDE.md 규칙 1).

---

## 3. 타깃 현재 상태

`src/config/env.ts`가 zod로 부팅 시 검증한다. 실패하면 throw.

| 변수              | 스키마                                                               | 비고                      |
| ----------------- | -------------------------------------------------------------------- | ------------------------- |
| `VITE_API_URL`    | `z.url()` — 필수                                                     |                           |
| `VITE_ENV`        | `z.enum(['development','staging','production'])` — 필수              | 레거시엔 `staging`이 없다 |
| `VITE_SENTRY_DSN` | `z.string().optional()`                                              |                           |
| `VITE_ENABLE_MSW` | `z.enum(['true','false']).default('false').transform(...)` → boolean | 레거시에 없음 (신규)      |

`.env` 파일: `.env.example` · `.env.development` · `.env.test` · `.env.production`

---

## 4. 매핑표 — 이관 후 `config/env.ts`

| 레거시                            | 타깃                         | 조치                                                                |
| --------------------------------- | ---------------------------- | ------------------------------------------------------------------- |
| `VITE_SERVER_REQUEST_SERVICE_URL` | **`VITE_API_URL`**           | **이름 변경.** 타깃 `apiClient.ts`가 이미 `env.VITE_API_URL`을 쓴다 |
| `VITE_BASE_URL`                   | `VITE_BASE_URL`              | 추가                                                                |
| `VITE_S3_BUCKET_URL_FILE`         | `VITE_S3_BUCKET_URL_FILE`    | 추가                                                                |
| `VITE_S3_BUCKET_URL_STATICS`      | `VITE_S3_BUCKET_URL_STATICS` | 추가                                                                |
| `VITE_VERSION_ONE_URL`            | `VITE_VERSION_ONE_URL`       | 추가                                                                |
| `VITE_TERMS_URL`                  | `VITE_TERMS_URL`             | 추가                                                                |
| `VITE_COMMUNITY_URL`              | `VITE_COMMUNITY_URL`         | 추가                                                                |
| `VITE_POSTHOG_PROJECT_TOKEN`      | `VITE_POSTHOG_PROJECT_TOKEN` | 추가 (optional)                                                     |
| `VITE_POSTHOG_HOST`               | `VITE_POSTHOG_HOST`          | 추가 (optional)                                                     |
| `VITE_BUILD_ID`                   | `VITE_BUILD_ID`              | 추가 (optional — 로컬은 `'local'` 폴백)                             |
| `VITE_SENTRY_DSN`                 | `VITE_SENTRY_DSN`            | **이미 있음**                                                       |
| `SENTRY_AUTH_TOKEN`               | 동일                         | Node 측. `env.ts` 대상 아님                                         |
| `import.meta.env.MODE`            | `VITE_ENV` + 빌드 모드       | §2                                                                  |
| —                                 | `VITE_ENV`                   | 타깃 필수. 레거시 `MODE`를 대체                                     |
| —                                 | `VITE_ENABLE_MSW`            | 타깃 전용 (개발/테스트)                                             |

### 확장 후 `env.ts` 스키마 (초안)

```ts
const envSchema = z.object({
  // 필수
  VITE_API_URL: z.url(), // ← SERVER_REQUEST_SERVICE_URL
  VITE_ENV: z.enum(['development', 'staging', 'production']),
  VITE_BASE_URL: z.url(),
  VITE_S3_BUCKET_URL_FILE: z.url(),
  VITE_S3_BUCKET_URL_STATICS: z.url(),
  VITE_VERSION_ONE_URL: z.url(),
  VITE_TERMS_URL: z.url(),
  VITE_COMMUNITY_URL: z.url(),
  // 선택
  VITE_SENTRY_DSN: z.string().optional(),
  VITE_POSTHOG_PROJECT_TOKEN: z.string().optional(),
  VITE_POSTHOG_HOST: z.string().optional(),
  VITE_BUILD_ID: z.string().default('local'),
  VITE_ENABLE_MSW: z
    .enum(['true', 'false'])
    .default('false')
    .transform((v) => v === 'true'),
})
```

> ⚠️ **opinion 빌드는 변수가 3개뿐이다**(§1-2). 위 스키마를 그대로 쓰면
> opinion 빌드가 **부팅 시 검증 실패로 죽는다.** Phase 0-6 결정에 따라:
>
> - **멀티 엔트리 유지** → opinion 전용 스키마를 따로 두거나, 메인 전용 변수를 `.optional()`로
> - **단일 앱 흡수** → 변수 하나로 통합 (opinion 배포에도 전 변수 주입 필요)
>
> **이것이 0-6 결정의 실질적 제약이다.** → `[확인 필요]` V-Q2

---

## 5. 배포 시 체크리스트 (Phase 7)

`decisions/`나 배포 워크플로 이전 시 반드시 확인:

- [ ] GitHub Secrets 11종 이전 (`_DEV`/`_PROD` 접미사 포함하면 실제 시크릿 수는 더 많다)
- [ ] `VITE_BUILD_ID`에 배포 커밋 SHA 주입 — 없으면 **새 배포 감지가 동작하지 않는다**
- [ ] `SENTRY_AUTH_TOKEN` — 소스맵 업로드용. 타깃엔 `sentry-vite-plugin` 자체가 미설정(계획서 3-4)
- [ ] `version.json` 생성·배포 — `checkFrontVersion.js`가 이 파일을 조회한다
- [ ] opinion 빌드용 변수 세트 별도 주입
- [ ] `.env.example` 갱신 — 새 변수 8개 반영

---

## 6. `[확인 필요]`

| #        | 질문                                                                        | 근거                                                                                                                                                                                                                           |
| -------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| ~~V-Q1~~ | ~~`VITE_POSTHOG_TOKEN` vs `VITE_POSTHOG_PROJECT_TOKEN`~~                    | **확정** — 코드는 `VITE_POSTHOG_PROJECT_TOKEN`만 읽는다(`lib/posthog/posthog.js:8`). `VITE_POSTHOG_TOKEN`은 CI에만 있는 미사용 시크릿이라 이관 대상이 아니다. `VITE_POSTHOG_HOST`에는 `'https://us.i.posthog.com'` 폴백이 있다 |
| ~~V-Q2~~ | ~~opinion 빌드에 메인 앱 변수(약관·커뮤니티·버전1 URL)를 주입해도 되는가?~~ | **해소 — 주입 불필요하게 설계했다** (§7). 스키마를 둘로 갈라 opinion이 메인 전용 변수를 모르게 만들었다. 배포 쪽 변경도 없다                                                                                                   |
| V-Q3     | `VITE_ENV`에 `staging`이 실제로 필요한가?                                   | 레거시는 dev/prod 2단계뿐. 타깃 스키마엔 staging이 있다. **코드가 이 값으로 분기하는 곳은 없어** 남겨둬도 무해하다 — 실제 staging 환경이 생길 때 정리                                                                          |

---

## 7. Phase 4 1단계 적용 결과 (2026-07-30)

`src/config/env.ts`를 확장했다. §4 초안과 **한 곳이 다르다** — 스키마를 하나로 합치지 않았다.

### 스키마를 둘로 나눈 이유

§4 초안의 단일 스키마는 opinion 빌드를 부팅 단계에서 죽인다(§4 말미 경고).
그래서 검증 시점을 갈랐다.

| 스키마           | 변수                                                                                            | 검증 시점                                    |
| ---------------- | ----------------------------------------------------------------------------------------------- | -------------------------------------------- |
| `sharedSchema`   | `VITE_API_URL` · `VITE_ENV` · `VITE_BASE_URL` · `VITE_S3_BUCKET_URL_FILE` + 선택 5종            | **모듈 로드 시** — 두 빌드 공통              |
| `mainOnlySchema` | `VITE_S3_BUCKET_URL_STATICS` · `VITE_VERSION_ONE_URL` · `VITE_TERMS_URL` · `VITE_COMMUNITY_URL` | `getMainEnv()` 최초 호출 시 (`src/main.tsx`) |

- 메인 앱: `main.tsx`가 부팅 때 `getMainEnv()`를 부르므로 **fail-fast가 유지된다**
- opinion 앱: `main-opinion.tsx`가 부르지 않으므로 **변수가 없어도 뜬다**
- opinion 배포에 변수를 추가 주입할 필요가 없다 → **V-Q2 해소**

### 선택 변수의 기본값

| 변수                | 기본값                       | 근거                                            |
| ------------------- | ---------------------------- | ----------------------------------------------- |
| `VITE_BUILD_ID`     | `'local'`                    | §4 초안 그대로                                  |
| `VITE_POSTHOG_HOST` | `'https://us.i.posthog.com'` | 레거시 `lib/posthog/posthog.js`의 폴백을 그대로 |

### 테스트 환경

`.env.test`에 의존하지 않는다. **`vite.config.ts`의 `test.env`**가 전 변수를 고정 주입한다.
스키마에 변수를 추가하면 그쪽도 함께 고쳐야 한다.

### ⚠️ 남은 작업 — `.env.*` 파일 (사용자 몫)

**이 세션의 권한 설정이 `.env*` 읽기·쓰기를 모두 차단한다.** Claude가 손댈 수 없다.
아래 변수를 직접 추가해야 `pnpm dev` / `pnpm build`가 부팅한다.

`.env.development` · `.env.production` · `.env.example` **3개 파일 공통**:

```dotenv
# 필수 — 값이 없으면 부팅 시 터진다. 전부 스킴(https://)까지 있는 URL이어야 한다
VITE_BASE_URL=https://...
VITE_S3_BUCKET_URL_FILE=https://...
VITE_S3_BUCKET_URL_STATICS=https://...
VITE_VERSION_ONE_URL=https://...
VITE_TERMS_URL=https://...
VITE_COMMUNITY_URL=https://...

# 선택 — 키만 두고 비워둬도 된다(기본값으로 떨어진다)
VITE_BUILD_ID=
VITE_POSTHOG_PROJECT_TOKEN=
VITE_POSTHOG_HOST=
```

값은 레거시 `.env.development` / `.env.production`에서 그대로 옮긴다.
`VITE_SERVER_REQUEST_SERVICE_URL` → **`VITE_API_URL`**로 이름만 바뀐다(§4).

`.env.test`는 손대지 않아도 된다 — `test.env`가 덮는다.

> ### ⚠️ 빈 값 함정 (2026-07-30 실제로 밟았다)
>
> **`.env`에 키만 두고 값을 비우면 Vite는 `undefined`가 아니라 빈 문자열을 준다.**
> 그러면 zod의 `.optional()`·`.default()`가 발동하지 않는다 — 값이 "있는" 것으로 보기 때문이다.
> `VITE_POSTHOG_HOST=`가 `z.url()`에 걸려 **부팅이 막혔다.**
>
> `env.ts`에 `optionalEnv()` 래퍼를 넣어 **선택 변수의 빈 문자열을 미설정으로** 바꿨다.
> 필수 변수에는 씌우지 않았다 — 비어 있으면 터지는 게 맞다.
>
> 검증 실패 로그도 `treeifyError`(객체 → DevTools가 접는다)에서
> **`prettifyError`**(여러 줄 문자열)로 바꿨다. 어떤 키가 왜 틀렸는지 펼치지 않고 보인다.

---

**Phase 1 완료.** Phase 4 1단계에서 §7이 추가됐다.
