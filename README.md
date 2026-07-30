# dev0leee-setup-react

사내용 React SPA 스타터. **SSR 없음** - 빌드 산출물은 정적 파일이므로 Node 런타임이 필요 없다.

## 요구 사항

Node **24.18.0** (LTS Krypton). `.nvmrc`에 고정돼 있고, CI도 `node-version-file: .nvmrc`로 같은 값을 읽는다.
`package.json`의 `engines.node`는 하한선(`>=24.18.0`)이다 — 둘 중 하나만 올리면 로컬과 CI가 갈린다.

```bash
nvm use          # .nvmrc 읽음
corepack enable pnpm
pnpm install
pnpm dev
```

`pnpm dev`는 MSW 목 서버가 켜진 상태로 뜬다. 백엔드 없이 바로 화면을 볼 수 있다.

## 스크립트

| 명령                           | 설명                     |
| ------------------------------ | ------------------------ |
| `pnpm dev`                     | 개발 서버 (MSW 켜짐)     |
| `pnpm build`                   | 타입체크 + 프로덕션 빌드 |
| `pnpm preview`                 | 빌드 결과 미리보기       |
| `pnpm typecheck`               | `tsc -b`                 |
| `pnpm lint` / `lint:fix`       | ESLint                   |
| `pnpm format` / `format:check` | Prettier                 |
| `pnpm test` / `test:watch`     | Vitest (jsdom + MSW)     |
| `pnpm test:e2e`                | Playwright               |

## 스택

| 레이어            | 선택                                        |
| ----------------- | ------------------------------------------- |
| UI Library        | React 19                                    |
| Build             | Vite 8 (Rolldown + Oxc)                     |
| Language          | TypeScript 6                                |
| Routing           | React Router v7 (library mode)              |
| Server State      | TanStack Query v5                           |
| HTTP              | axios + `src/shared/lib/apiClient.ts`       |
| Client State      | Zustand                                     |
| Form / Validation | React Hook Form + Zod                       |
| UI / Component    | Tailwind CSS v4 + shadcn/ui (Base UI)       |
| Icons             | Lucide React                                |
| Table             | TanStack Table v8                           |
| Charts            | shadcn/ui Chart (Recharts)                  |
| Date              | date-fns                                    |
| Error Handling    | react-error-boundary + Query `throwOnError` |
| Lint / Format     | ESLint + Prettier                           |
| Test              | Vitest + RTL + Playwright + MSW             |
| Monitoring        | Sentry                                      |
| Package Manager   | pnpm                                        |

## 폴더 구조

```
src/
  app/          앱 조립 (App, router, queryClient, layouts, guard)
  config/       env (Zod 검증)
  features/     도메인 슬라이스
    auth/       api · queries · pages · components · hooks · schemas · constants · types + index.ts
    dashboard/  api · queries · pages · components · constants · types + index.ts
  shared/       도메인 무관 공용
    components/
      ui/       shadcn 생성물. 직접 수정하지 말 것
      common/   우리가 만든 공용 컴포넌트
      errors/   ErrorBoundary와 fallback 3종
      layouts/  레이아웃 조각
    lib/        HTTP 하부구조 (apiClient, apiErrors, tokenStore, authChannel, native/)
    hooks/      여러 feature가 쓰는 훅
    stores/     전역 클라이언트 상태
    schemas/    공용 zod 스키마
    constants/  공용 상수
    types/      여러 곳이 쓰는 타입
    utils/      순수 함수 (cn 등)
  testing/      테스트 셋업 · renderWithProviders · MSW 핸들러(mocks/)
e2e/            Playwright
```

새 기능은 `src/features/<name>/` 아래에 api / queries / pages / components를 모으고 `index.ts`로
공개 API를 내보낸다. **의존 방향은 `shared` → `features` → `app` 한 방향**이고,
`eslint.config.js`의 `import/no-restricted-paths`가 강제한다.

레이어와 폴더 규칙의 상세는 [`docs/conventions/01-folder-structure.md`](./docs/conventions/01-folder-structure.md)에 있다.

## 환경변수

`VITE_` 접두사가 붙은 값은 **번들에 그대로 박혀 브라우저에서 보인다. 시크릿 금지.**

| 파일               | 로드 시점       | git  |
| ------------------ | --------------- | ---- |
| `.env.development` | `pnpm dev`      | 커밋 |
| `.env.production`  | `pnpm build`    | 커밋 |
| `.env.test`        | `pnpm test`     | 커밋 |
| `.env.*.local`     | 개인 오버라이드 | 제외 |

계약은 `src/config/env.ts`의 Zod 스키마다. 값이 빠지거나 형식이 틀리면 **앱 부팅 시점에** 죽는다.
코드에서 `import.meta.env`를 직접 쓰지 말고 `env` 객체를 쓴다.
`eslint.config.js`의 `no-restricted-syntax`가 `src/**`에서 이를 강제한다.

`pnpm test`는 `.env.test`를 쓰지 않는다. `vite.config.ts`의 `test.env`가 전 변수를 고정 주입해
로컬과 CI가 같은 값으로 돌게 한다. 스키마에 변수를 추가하면 **여기도 같이 고친다.**

### 변수 목록

| 변수                                                                                            | 필수                      | 비고                                       |
| ----------------------------------------------------------------------------------------------- | ------------------------- | ------------------------------------------ |
| `VITE_API_URL`                                                                                  | ✅                        | API 서버 baseURL                           |
| `VITE_BASE_URL`                                                                                 | ✅                        | 앱 자신의 배포 URL                         |
| `VITE_S3_BUCKET_URL_FILE`                                                                       | ✅                        | 첨부파일 버킷                              |
| `VITE_S3_BUCKET_URL_STATICS` · `VITE_VERSION_ONE_URL` · `VITE_TERMS_URL` · `VITE_COMMUNITY_URL` | ✅ (메인 앱만)            | `getMainEnv()`가 검증. opinion 빌드는 제외 |
| `VITE_SENTRY_DSN`                                                                               | —                         | 없으면 Sentry 초기화를 건너뛴다            |
| `VITE_BUILD_ID`                                                                                 | — (기본 `local`)          | 배포 커밋 SHA. 새 배포 감지에 쓴다         |
| `VITE_POSTHOG_PROJECT_TOKEN`                                                                    | —                         | 없으면 PostHog를 초기화하지 않는다         |
| `VITE_POSTHOG_HOST`                                                                             | — (기본 us.i.posthog.com) |                                            |
| `VITE_ENABLE_MSW`                                                                               | — (기본 `false`)          | 개발 중 목 서버                            |

**필수 변수는 값을 비워두면 부팅 시 터진다. 선택 변수는 키만 두고 비워둬도 된다** —
`.env`에 `KEY=`만 있으면 Vite가 빈 문자열을 주는데, 선택 변수는 그것을 미설정으로 바꿔
기본값으로 떨어뜨린다(`optionalEnv`).

**메인 앱 전용 변수 4개는 `env`가 아니라 `getMainEnv()`로 읽는다.** opinion 빌드에는 이 변수가
주입되지 않으므로(`docs/migration/env-vars.md` §1-2) `env`에 합치면 opinion 앱이 부팅하지 못한다.
`src/main.tsx`가 부팅 시 `getMainEnv()`를 한 번 불러 메인 앱의 fail-fast를 유지한다.

### `env.APP_ENV` — 변수가 아니다

배포 환경은 **`.env`로 받지 않고 Vite `MODE`에서 파생한다.** 이름에 `VITE_` 접두사가 없는 이유다.

```
--mode production         → 'production'
--mode production.opinion → 'production'   (opinion 접미사는 떼고 본다)
--mode development        → 'development'
vitest (MODE=test)        → 'development'
```

`--mode`가 이미 환경을 결정하는데 변수로 또 받으면 둘이 어긋날 수 있다. `--mode production`으로
빌드하면서 `VITE_ENV=development`가 남아 있으면 **프로덕션에서 스택트레이스가 노출되고
Sentry가 dev로 태깅된다.** 파생시키면 그 실패가 불가능해진다.

새 배포 모드를 만들면 `src/config/env.ts`의 `resolveAppEnv()`에 한 줄 추가한다.
`APP_ENV`가 게이트하는 것: Sentry `environment`·트레이스 샘플링, React Query Devtools,
에러 화면의 스택트레이스 노출, 네이티브 메시지 콘솔 로그.

### `import.meta.env` 직접 접근이 허용되는 곳 (공식 예외 2곳)

| 파일                | 이유                                                                                                                                                                   |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/config/env.ts` | 검증기 자신. 원본을 읽어 Zod로 검사해 `env` 객체를 만든다                                                                                                              |
| `src/main.tsx`      | MSW 트리셰이킹 가드. `import.meta.env.DEV`는 빌드 타임 리터럴로 치환돼 번들러가 죽은 가지를 잘라낸다. `env.VITE_ENABLE_MSW`는 Zod transform을 거쳐 정적 분석이 안 된다 |

두 파일은 `eslint.config.js`에 override로 명시돼 있다. **여기에 없는 파일에서 쓰면 lint가 막는다.**
새 예외가 필요하면 이 표와 ESLint override를 같이 고친다 — 한쪽만 고치면 규칙이 다시 문서와 어긋난다.

## 인증

- Access Token은 **메모리**(`src/shared/lib/tokenStore.ts`). localStorage 금지
- Refresh Token은 **HttpOnly 쿠키**. 프론트는 건드리지 않는다
- 401 → `/token-refresh` → RTR → 원요청 1회 재시도 (`src/shared/lib/apiClient.ts`)
- 동시 401과 **멀티탭**은 Web Locks + BroadcastChannel로 직렬화. RTR에서 폐기된 RT를
  두 번 쓰면 서버가 재사용 공격으로 판정해 세션을 통째로 날리기 때문이다
- 새로고침 시 `AuthProvider`가 `/token-refresh`로 세션을 복원하고, 그 전까지 렌더를 막는다

### 백엔드 계약

| 항목             | 요구사항                                                    |
| ---------------- | ----------------------------------------------------------- |
| `/token-refresh` | POST, `{ accessToken, user }` 반환, RT 쿠키 자동 전송       |
| CORS             | `Allow-Credentials: true` + Origin 화이트리스트 (`*` 불가)  |
| Cookie           | `HttpOnly; Secure; SameSite=Lax` (크로스 도메인이면 `None`) |
| 401              | **만료된 토큰에만** 사용. 권한 부족은 403이어야 한다        |

마지막 항목이 지켜지지 않으면 refresh가 무한 반복된다.

## 에러 처리

3계층 ErrorBoundary. Query는 `throwOnError: true`라 에러가 렌더 에러로 승격돼 바운더리가 잡는다.

| 계층 | 위치                                   | 죽었을 때                  |
| ---- | -------------------------------------- | -------------------------- |
| 1    | `app/App.tsx`                          | 전체 에러 화면             |
| 2    | `app/AppLayout.tsx`                    | 헤더는 유지, 페이지만 대체 |
| 3    | `features/dashboard/DashboardPage.tsx` | 위젯 하나만 대체           |

ErrorBoundary는 **렌더링 중 에러만** 잡는다. 이벤트 핸들러와 비동기 콜백은 직접 try/catch.

## CI

`.github/workflows/ci.yml` - `verify`(lint·format·test·build)와 `e2e` 2개 job.

`build`가 `tsc -b && vite build`라 타입체크를 겸한다. 그래서 CI에는 `pnpm typecheck` 단계를 따로
두지 않는다. 로컬에서는 빌드 없이 타입만 빠르게 보려고 스크립트를 남겨둔다.

`permissions: contents: read`로 `GITHUB_TOKEN` 권한을 최소화하고, job마다 `timeout-minutes`를
둔다. 없으면 매달린 job이 기본값인 6시간을 채우고 죽는다.

job에 `name:`을 붙이지 않는다. GitHub은 required status check를 job id가 아니라 `name:` 값으로
식별하기 때문에, 이름을 붙였다가 나중에 다듬으면 보호 규칙이 조용히 깨져 PR이 무한 대기한다.

Husky는 로컬 편의일 뿐 게이트가 아니다 (`--no-verify`로 뚫린다). CI가 방어선이다.

## 브랜치 보호 (`main`) — 적용 완료

| 항목                              | 값              |
| --------------------------------- | --------------- |
| Required status checks            | `verify`, `e2e` |
| Strict (머지 전 main 최신화 요구) | 켬              |
| PR 필수                           | 켬              |
| 승인 필요 인원                    | **0명**         |
| 오래된 승인 자동 해제             | 켬              |
| force push / 브랜치 삭제          | 차단            |
| 미해결 리뷰 코멘트 시 머지 차단   | 켬              |
| 관리자에게도 적용                 | 끔              |

**승인이 0명인 이유:** GitHub은 자기 PR을 자기가 승인할 수 없다. 현재 리포에 계정이 하나뿐이라
승인을 1명으로 두면 모든 PR이 관리자 우회로만 머지된다. 그러면 "우회가 기본값"이 되어
정작 팀원이 합류했을 때 규칙이 무력해진다. PR과 CI 통과는 그대로 강제된다.

**두 번째 사람이 합류하면 되돌린다:**

```bash
gh api -X PATCH repos/dev0leee/dev0leee-setup-react/branches/main/protection/required_pull_request_reviews \
  -f required_approving_review_count=1
```

## 아직 안 정한 것

- 배포 타겟 (S3+CloudFront / Cloudflare Pages / 사내 nginx)
- 인증 서버 실제 엔드포인트 (현재는 MSW 목)
