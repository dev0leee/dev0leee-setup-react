# dev0leee-setup-react

React 19 + TypeScript + Vite SPA 템플릿.

## 스택 (이미 확정됨 — 임의로 바꾸거나 추가하지 말 것)

| 영역            | 선택                                                  |
| --------------- | ----------------------------------------------------- |
| 빌드            | Vite 8, TypeScript 6, pnpm 11, Node 24                |
| 라우팅          | react-router-dom 7 (`createBrowserRouter`)            |
| 서버 상태       | TanStack Query 5                                      |
| 클라이언트 상태 | Zustand 5                                             |
| HTTP            | axios (`src/shared/lib/apiClient.ts` 인스턴스만 사용) |
| 폼              | react-hook-form + zod 4 (`zodResolver`)               |
| UI              | Base UI + shadcn(`base-nova` 스타일) + CVA            |
| 스타일          | Tailwind CSS 4 (CSS-first `@theme`)                   |
| 검증            | ESLint 9, Prettier, Vitest, Playwright, MSW           |
| 모니터링        | Sentry                                                |

## 절대 규칙

1. **`import.meta.env`를 직접 읽지 않는다.** `@/config/env`의 `env` 객체만 쓴다. 부팅 시 zod로 검증된다.
2. **`axios`를 직접 import하지 않는다.** `@/shared/lib/apiClient`의 `api`(인증 필요) · `publicApi`(인증 불필요) 인스턴스만 쓴다. 인터셉터가 토큰/refresh/에러 정규화를 담당한다.
3. **서버 데이터를 Zustand에 넣지 않는다.** 서버에서 온 것은 전부 TanStack Query 캐시가 소유한다. 복사하는 순간 동기화 버그가 시작된다.
4. **`any` 금지** (`@typescript-eslint/no-explicit-any: error`). 모르면 `unknown` 쓰고 좁힌다.
5. **타입 import는 `import type`.** `verbatimModuleSyntax`가 켜져 있다.
6. **`enum`, 생성자 파라미터 프로퍼티, `namespace` 금지.** `erasableSyntaxOnly` 위반이다. `as const` 객체를 쓴다.
7. **`src/shared/components/ui/**`는 직접 수정하지 않는다.** shadcn CLI가 덮어쓴다. 커스텀은 래퍼 컴포넌트로 뺀다.
8. **`useEffect`는 최후 수단.** 파생 상태는 렌더 중 계산, 서버 데이터는 Query, 이벤트 응답은 핸들러에서 처리한다.
9. **끝내기 전에 `pnpm typecheck && pnpm lint && pnpm format:check && pnpm test`를 돌린다.** 실패하면 실패했다고 말한다.

## 폴더 규칙 요약

```
src/
├── app/          # 앱 조립: App, router, queryClient, layout, guard
├── features/     # 도메인 슬라이스 (auth, dashboard, ...)
│   └── <name>/   # api · components · hooks · stores · types + index.ts(공개 API)
├── shared/       # 도메인 무관 공용
│   ├── components/
│   │   ├── ui/       # shadcn 생성물 - 손대지 않음
│   │   ├── common/   # 우리가 만든 공용 컴포넌트
│   │   └── errors/   # 에러 바운더리 / 폴백
│   ├── lib/      # HTTP 하부구조: apiClient, apiErrors, tokenStore, authChannel
│   ├── utils/    # 순수 함수 (cn 등)
│   ├── hooks/    # 여러 feature가 쓰는 훅
│   ├── stores/   # 전역 클라이언트 상태
│   └── types/    # 여러 곳이 쓰는 타입
├── config/       # env 등 앱 설정
└── testing/      # 테스트 셋업 · renderWithProviders · MSW 핸들러
```

**의존 방향은 한 방향이다:** `shared` → `features` → `app`.
feature가 다른 feature를 import하지 않는다. 필요하면 `shared`로 올린다.
**feature 바깥에서는 `index.ts`가 내보낸 것만 쓴다** — 내부 파일을 직접 가리키지 않는다.
이 방향은 `eslint.config.js`의 `import/no-restricted-paths`가 강제한다.

## 상세 컨벤션

카테고리별 상세 규칙은 [`docs/conventions/`](./docs/conventions/README.md)에 있다.
새 코드를 쓰기 전에 해당 문서를 먼저 읽는다.

| 문서                                                             | 내용                            |
| ---------------------------------------------------------------- | ------------------------------- |
| [01-folder-structure](./docs/conventions/01-folder-structure.md) | 폴더구조 · 레이어 · 의존 방향   |
| [02-naming](./docs/conventions/02-naming.md)                     | 파일/변수/함수/타입 네이밍      |
| [03-api](./docs/conventions/03-api.md)                           | API 함수 · axios · 에러 처리    |
| [04-state](./docs/conventions/04-state.md)                       | Query / Zustand / useState 경계 |
| [05-types](./docs/conventions/05-types.md)                       | 타입 정의 · zod · 제네릭        |
| [06-react](./docs/conventions/06-react.md)                       | 훅 · 렌더링 · 성능              |
| [07-javascript](./docs/conventions/07-javascript.md)             | JS 문법 · 비동기 · 불변성       |
| [08-routing](./docs/conventions/08-routing.md)                   | 라우팅 · 페이지 · 코드 스플리팅 |
| [09-imports](./docs/conventions/09-imports.md)                   | import 순서 · export 방식       |
| [10-components](./docs/conventions/10-components.md)             | 컴포넌트 설계 · props           |
| [11-overlay](./docs/conventions/11-overlay.md)                   | 모달 · 바텀시트 · 토스트        |
| [12-constants](./docs/conventions/12-constants.md)               | 상수 · 환경변수 · 매직 넘버     |
| [13-forms](./docs/conventions/13-forms.md)                       | 폼 · 입력요소 · 인터랙션        |
| [14-styling](./docs/conventions/14-styling.md)                   | Tailwind · CVA · 디자인 토큰    |
| [15-git](./docs/conventions/15-git.md)                           | 브랜치 · 커밋 · PR              |

## 명령어

```bash
pnpm dev              # 개발 서버
pnpm typecheck        # tsc -b
pnpm lint             # eslint .
pnpm format:check     # prettier --check
pnpm test             # vitest run
pnpm test:e2e         # playwright
pnpm build            # typecheck + vite build
```

CI(`.github/workflows/ci.yml`)는 `typecheck → lint → format:check → test → build`와 e2e를 병렬로 돌린다.
로컬에서 통과하지 않는 것을 push하지 않는다.
