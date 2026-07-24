# dev0leee-setup-react

사내용 React SPA 스타터. **SSR 없음** - 빌드 산출물은 정적 파일이므로 Node 런타임이 필요 없다.

## 요구 사항

Node **24.18.0** (LTS Krypton). `.nvmrc`에 고정돼 있다.

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
| Language          | TypeScript 7                                |
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
  api/          HTTP 레이어 (axios 인스턴스, 토큰, 에러 정규화)
  app/          부트스트랩, 프로바이더, 라우터, 레이아웃
  components/
    ui/         shadcn 생성물. 직접 수정하지 말 것
    common/     공용 컴포넌트
    errors/     ErrorBoundary와 fallback 3종
  config/       env (Zod 검증)
  features/     기능 단위 (auth, dashboard)
  lib/          유틸
  mocks/        MSW 핸들러
  test/         테스트 셋업 및 헬퍼
e2e/            Playwright
```

새 기능은 `src/features/<name>/` 아래에 api / 컴포넌트 / 훅을 모아 둔다.

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

`.github/workflows/ci.yml` - `verify`(typecheck·lint·format·test·build)와 `e2e` 2개 job.

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
