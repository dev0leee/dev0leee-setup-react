# 01. 폴더구조

## 레이어

```
src/
├── main.tsx          # 진입점. StrictMode, MSW 부팅, App 마운트만.
├── index.css         # Tailwind import + @theme 토큰 정의
├── app/              # 앱 조립 계층
├── features/         # 도메인 슬라이스
├── shared/           # 도메인 무관 공용 자산
├── config/           # 앱 설정
└── testing/          # 테스트 하부구조 + MSW
```

### 의존 방향 (MUST)

```
shared  →  features  →  app
```

- **`shared/`는 아무도 모른다.** `features`도 `app`도 import하지 않는다.
- **`features/`는 `shared`만 import한다.** 다른 feature를 import하지 않는다.
- **`app/`은 전부 import할 수 있다.** 조립하는 게 일이다.
- **`config/`는 어디서든 읽는다.** 부팅 시 1회 평가되는 값이라 방향에서 예외다.

이 방향은 `eslint.config.js`의 `import/no-restricted-paths`가 강제한다. 리뷰가 아니라 CI가 막는다.

## 각 레이어가 소유하는 것

### `src/app/` — 앱 조립

앱을 "실행 가능한 하나"로 묶는 코드만. 도메인 로직 금지.

```
app/
├── App.tsx            # Provider 중첩. 순서가 의미를 가진다.
├── router.tsx         # 라우트 트리
├── layouts/           # 라우트 레이아웃 (Outlet을 렌더하는 셸)
│   └── AppLayout.tsx
├── ProtectedRoute.tsx # 인증 가드
└── NotFoundPage.tsx   # 404
```

`App.tsx`의 Provider 순서는 이유가 있어서 그 순서다. 바꾸기 전에 주석을 읽는다.

#### 레이아웃은 세 층으로 나뉜다 (MUST)

| 무엇                                        | 어디                         | 판별                                     |
| ------------------------------------------- | ---------------------------- | ---------------------------------------- |
| Provider·전역 오버레이·devtools             | `app/App.tsx`                | 라우트마다 달라지지 않는다               |
| 라우트 레이아웃 (`<Outlet/>`을 렌더)        | `app/layouts/`               | 라우터에 연결된다. feature를 알아도 된다 |
| 레이아웃 조각 (AppBar, BottomNavigation 등) | `shared/components/layouts/` | props만 받는다. feature를 모른다         |

**최상위 셸을 레이아웃으로 만들지 않는다.** Provider·토스트·전역 모달은 `App.tsx`가 이미
담당한다. `LayoutBase` 같은 걸 따로 만들면 `App.tsx`와 책임이 겹친다.

**레이아웃 조각이 feature를 알기 시작하면 `shared/`에 못 있는다.** `AppBar`가
`useAuthStore`를 직접 부르는 순간 `import/no-restricted-paths`가 막는다. 사용자 정보는
`app/layouts/`에서 읽어 props로 내린다.

라우트별 레이아웃 설정(제목·뒤로가기·하단탭 노출)은 **라우트 `handle`에 둔다.**
별도 설정 파일이나 훅을 만들지 않는다.

```tsx
// app/router.tsx — 설정이 라우트 정의 옆에 붙는다
{ index: true, handle: { appBarTitle: '대시보드', showBottomNav: true }, lazy: ... }

// app/layouts/AppLayout.tsx — 가장 깊은 라우트의 handle이 이긴다
const config = useMatches().reduce((merged, match) => {
  return { ...merged, ...(match.handle ?? {}) }
}, {})
```

### `src/features/<feature>/` — 도메인 슬라이스

**하나의 기능이 필요한 모든 것을 이 폴더가 소유한다.**

```
features/<name>/
├── api/               # 이 도메인의 요청 함수
├── queries/           # 이 도메인의 TanStack Query 훅 · queryOptions
├── pages/             # 라우트에 마운트되는 화면 (~Page)
├── components/        # 이 도메인의 재사용 컴포넌트·조각
├── constants/         # 이 도메인의 상수
├── hooks/             # 쿼리와 무관한 재사용 로직
├── schemas/           # 이 도메인의 zod 스키마
├── stores/            # 이 도메인의 클라이언트 상태 (Zustand)
├── types/             # 이 도메인의 타입
└── index.ts           # 공개 API
```

**`pages/` vs `components/`:** 라우트에 걸리는 화면(`~Page`)만 `pages/`, 나머지 재사용 조각은
`components/`다 ([10-components](./10-components.md)).

**필요한 폴더만 만든다.** 전부 만들 필요 없다. `dashboard/`는 상태도 훅도 스키마도 없다.

```
features/dashboard/
├── api/
│   └── dashboard.ts        # getRevenue, getOrders
├── queries/
│   ├── ordersQuery.ts
│   └── revenueQuery.ts
├── pages/
│   └── DashboardPage.tsx
├── components/
│   ├── OrdersTable.tsx
│   └── RevenueChart.tsx
├── types/
│   └── dashboard.ts
└── index.ts
```

#### `api/` vs `queries/` vs `hooks/` (MUST)

경계는 **React를 아느냐**다.

| 폴더       | 내용                                         | React |
| ---------- | -------------------------------------------- | ----- |
| `api/`     | 요청 함수. axios만 안다.                     | 모름  |
| `queries/` | `queryOptions` · `useQuery`/`useMutation` 훅 | 앎    |
| `hooks/`   | 쿼리와 무관한 재사용 로직 (`useLogout`)      | 앎    |

- **`api/`는 도메인당 파일 하나.** `api/dashboard.ts`에 그 도메인 요청 함수를 전부 나열한다.
  도메인이 커지면 리소스별로 쪼갠다 (`api/office.ts`, `api/lobbyPhone.ts`).
- **`queries/`는 쿼리/뮤테이션당 파일 하나.** 이름은 `useGetXxx.ts` · `usePostXxx.ts` ·
  `usePatchXxx.ts` · `useDeleteXxx.ts`, `queryOptions`만 있으면 `xxxQuery.ts`.
- **뮤테이션도 `queries/`에 둔다.** 폴더 이름은 queries지만 TanStack Query 레이어 전체를 뜻한다.
- **컴포넌트 안에 `useMutation`을 인라인으로 쓰지 않는다.** `queries/`로 뺀다.
- **뮤테이션 훅은 이름 붙인 객체를 반환한다** — `{ xxxMutation, isXxxPending, isXxxSuccess }`.
  성공·실패 피드백은 훅이 소유한다 ([03-api](./03-api.md) 규칙 5).

도메인 부수효과(토큰 저장·스토어 갱신)는 훅이 갖고, 화면 전환·폼 에러는 호출부가 갖는다.

```ts
// features/auth/queries/useLogin.ts
export const useLogin = () => {
  const setAuthenticated = useAuthStore((state) => {
    return state.setAuthenticated
  })
  return useMutation({
    mutationFn: login,
    onSuccess: ({ accessToken, user }) => {
      setAccessToken({ token: accessToken })
      setAuthenticated(user)
    },
  })
}
```

```tsx
// 호출부가 화면 관심사를 넘긴다
login(values, {
  onSuccess: () => {
    void navigate(from, { replace: true })
  },
  onError: (error) => {
    setError('root', { message: error.message })
  },
})
```

> **SHOULD — 중첩은 2~3단계까지.** `features/a/components/b/parts/c/`가 나오면 구조가 틀린 것이다.
> 깊어지는 건 보통 "이건 사실 별개 feature다"라는 신호다.

### 공개 API — `index.ts` (MUST)

**feature 바깥에서는 `index.ts`가 내보낸 것만 쓴다.** 내부 파일을 직접 가리키지 않는다.

```ts
// features/auth/index.ts
export { AuthProvider } from '@/features/auth/components/AuthProvider'
export { LoginPage } from '@/features/auth/components/LoginPage'
export { useLogout } from '@/features/auth/hooks/useLogout'
```

```ts
// GOOD - app/이 auth를 소비한다
import { AuthProvider, LoginPage } from '@/features/auth'

// BAD - 내부 구현에 손을 뻗는다
import { LoginPage } from '@/features/auth/components/LoginPage'
```

이렇게 하면 feature 내부를 자유롭게 재배치해도 바깥이 안 깨진다.
**feature 안에서는** 상대경로 대신 `@/features/auth/...` 절대경로로 서로를 참조한다
([09-imports](./09-imports.md) 참고).

### feature 간 의존 (MUST)

feature A가 feature B를 import하고 싶어지면 셋 중 하나다.

1. **사실 공용이다** → `shared/`로 올린다.
2. **사실 하나의 feature다** → 합친다.
3. **진짜 관계가 필요하다** → 상위(`app/`)에서 조립해 props로 내린다.

```ts
// BAD - dashboard가 auth를 안다
import { useAuthStore } from '@/features/auth'

// GOOD - 필요한 값을 props로 받는다 (props 타입은 types/에 — 05-types)
const DashboardPage = ({ userName }: DashboardPageProps) => {}
```

> **예외:** `app/`이 `features/*`를 import하는 것은 `features` → `app` 방향이라 허용된다.

#### 어떤 상태는 도메인이 아니라 하부구조다 → `shared/`

대부분의 상태는 feature 안에 둔다. 다른 feature가 쓰고 싶어지면 그건 보통
**경계를 잘못 그었다는 신호**지 shared로 올릴 신호가 아니다 (위 "feature 간 의존" 참고).

**예외는 그 상태가 도메인이 아니라 하부구조일 때다.** 판별 질문:

> "이건 이 도메인의 규칙인가, 아니면 앱 전체가 딛고 서는 사실인가?"

인증 상태가 그 예외다. **로그인/로그아웃이라는 "동작"은 auth 도메인**이지만,
**"지금 누가 로그인했나"라는 "사실"은 API 클라이언트처럼 앱 전역 하부구조**다.
그래서 처음부터 `shared/`에 둔다 — "언젠가 다른 feature가 쓸 테니까"가 아니라,
**성격 자체가 도메인이 아니기 때문**이다.

```
shared/stores/authStore.ts   # 앱 전역 인증 사실 (status, user)
shared/types/auth.ts         # 스토어가 쓰는 타입도 같이 둔다
features/auth/               # 로그인·로그아웃 "동작"은 feature 소유
```

> **주의 — "여러 feature가 쓴다"만으로 올리지 않는다.** 그건 보통 경계 실수다.
> 오직 **하부구조라고 판단될 때만** 올린다. 인증·권한·전역 테마 정도가 여기 해당한다.
> 애매하면 feature에 두고, 진짜 하부구조로 드러날 때 옮긴다.

**스토어를 올리면 그 상태 타입도 같이 올라가야 한다.** `shared/`는 `features/`를
import할 수 없으므로 타입만 feature에 남기면 컴파일되지 않는다.

올린 것은 feature의 `index.ts`로 다시 내보내지 않는다. **소유자가 하나만 남게** 한다 —
`@/shared/stores/authStore` 하나로만 가져온다.

### `src/shared/` — 도메인 무관 공용

**feature를 하나도 모르는 것만 여기 온다.** 특정 도메인을 아는 순간 공용이 아니다.

```
shared/
├── components/
│   ├── ui/       # shadcn CLI 생성물. 직접 수정 금지.
│   ├── common/   # 우리가 만든 공용 컴포넌트 (FullPageSpinner 등)
│   ├── layouts/  # 레이아웃 조각 (AppBar, BottomNavigation)
│   └── errors/   # 에러 바운더리 · 폴백
├── lib/          # 외부와 붙는 하부구조 (HTTP 클라이언트 등)
├── utils/        # 순수 함수. 입력 → 출력이 전부다.
├── constants/    # 여러 feature가 쓰는 상수
├── schemas/      # 도메인 무관 zod 스키마
├── hooks/        # 여러 feature가 쓰는 훅
├── stores/       # 전역 클라이언트 상태
└── types/        # 여러 곳이 쓰는 타입
```

`constants/`, `schemas/`, `hooks/`, `stores/`, `types/`는 **쓸 게 생기면 만든다.** 미리 파두지 않는다.

#### `shared/lib/` — 바깥과 통신하는 창구 · 미리 설정한 외부 라이브러리

**개별 엔드포인트 함수는 여기 두지 않는다.** 그건 feature 소유다.
여기는 "모든 요청이 공통으로 거치는 것"과 "외부 라이브러리를 앱에 맞게 설정해둔 것"만 둔다.

```
shared/lib/
├── apiClient.ts    # axios 인스턴스 + 인터셉터 (토큰 주입, 401 refresh)
├── apiErrors.ts    # ApiError 클래스 + toApiError 정규화
├── queryClient.ts  # QueryClient 기본 옵션
├── tokenStore.ts   # 메모리 Access Token
├── authChannel.ts  # 탭 간 로그아웃 브로드캐스트
└── native/         # 웹뷰 ↔ 네이티브 앱 브릿지
    ├── bridge.ts   # send/subscribe. window를 만지는 유일한 곳.
    └── common.ts   # 도메인별 네이티브 호출
```

`apiClient`(서버) · `authChannel`(다른 탭) · `native/`(네이티브 앱)은 전부 **바깥과
메시지를 주고받는 창구**라 같은 층이다.

> **MUST — 바깥에서 들어오는 값은 zod로 검증한다.** 네이티브가 보내온 페이로드는
> 환경변수·폼 입력과 같은 "신뢰할 수 없는 입력"이다 ([05-types](./05-types.md) 참고).
> 나가는 호출은 그냥 함수면 된다.

#### `shared/lib/` vs `shared/utils/`

- **`lib/`** — 바깥 세계(네트워크·브라우저 API·스토리지)와 붙는다. 상태를 가질 수 있다.
- **`utils/`** — 순수 함수. 앱도 바깥도 모른다. (`cn`)

애매하면 `utils/`. 부수효과가 있으면 `lib/`.

> **MUST — `utils/`에 아무거나 넣지 않는다.** 기능별로 파일을 나눈다. `cn`은 `utils/cn.ts`다.
> `utils.ts` 한 파일에 쌓기 시작하면 쓰레기통이 된다.

#### `ui/`와 `common/`의 경계

**shadcn CLI가 만들었으면 `ui/`, 우리가 만들었으면 `common/`.**
`ui/` 컴포넌트를 커스터마이즈해야 하면 수정하지 말고 `common/`에 래퍼를 만든다.
(`eslint.config.js`가 `ui/**`의 린트 규칙을 꺼둔 이유가 이것이다 — 어차피 덮어써진다.)

> **MUST — 오버레이(모달·바텀시트)는 반드시 공통 래퍼를 경유한다.** 딤 배경·포털·스크롤 잠금은
> 래퍼가 담당하고, 자식 컴포넌트가 직접 만들지 않는다. 오버레이 상세 규칙은 11-overlay에서 다룬다.

### zod 스키마 (MUST)

**스키마는 무조건 파일로 분리한다.** 길이는 기준이 아니다. 컴포넌트 안에 인라인으로 두지 않는다.

| 범위                             | 위치                       |
| -------------------------------- | -------------------------- |
| 한 feature 안                    | `features/<name>/schemas/` |
| 여러 feature + **도메인 무관**   | `shared/schemas/`          |
| 여러 feature + **도메인을 안다** | 올리지 않는다 (아래 참고)  |
| 환경변수                         | `config/env.ts` (예외)     |

```ts
// features/auth/schemas/login.ts
export const loginSchema = z.object({
  email: z.email('올바른 이메일을 입력하세요.'),
  password: z.string().min(8, '비밀번호는 8자 이상이어야 합니다.'),
})

// 타입은 파생시킨다. types/에 손으로 다시 쓰지 않는다.
export type LoginFormValues = z.infer<typeof loginSchema>
```

**공유한다고 무조건 `shared/`로 올리는 게 아니다.** `shared/`는 도메인을 몰라야 한다는 규칙이 스키마에도 그대로 적용된다.

```ts
// GOOD - shared/schemas/ 에 가도 된다. 도메인을 모른다.
export const phoneSchema = z.string().regex(/^01[016789]\d{7,8}$/)
export const paginationSchema = z.object({ page: z.number(), size: z.number() })

// BAD - shared/schemas/ 에 두면 안 된다. 도메인을 안다.
export const loginSchema = z.object({ email: ..., password: ... })
```

도메인 스키마를 두 feature가 공유하고 있다면 그건 올릴 신호가 아니라 **경계를 잘못 그었다는 신호다.**
feature 간 import와 같은 판단을 한다 — 합치거나, 상위에서 조립한다.

> **예외: `config/env.ts`.** 환경변수 스키마는 그 모듈 자체가 검증기라 분리하지 않는다.

#### 공유는 스키마 통째가 아니라 필드 단위로 (MUST)

**`shared/schemas/`에 올리는 건 `z.object` 통째가 아니라 재사용되는 "필드"다.**
도메인 스키마는 그 필드들을 **조합**해서 만든다.

```ts
// shared/schemas/common.ts - 필드 단위. 도메인을 모른다.
export const phoneField = z.string().regex(/^01[016789]\d{7,8}$/, '올바른 전화번호를 입력하세요.')
export const nicknameField = z.string().trim().min(2, '2자 이상 입력하세요.').max(10)

// features/board/schemas/board.ts - 조합해서 도메인 스키마를 만든다
export const boardFormSchema = z.object({
  nickname: nicknameField,
  phone: phoneField,
  content: contentField,
})
```

이렇게 하면 **에러 문구가 필드 한 곳에 모여 자동으로 통일된다.** 화면마다
"올바른 전화번호를 입력하세요" / "전화번호 형식이 아닙니다"로 갈리지 않는다.

**비슷한 스키마를 손으로 두 번 쓰지 않는다. `.extend()`로 파생시킨다.**

```ts
// GOOD - 원본에서 파생. 원본이 바뀌면 같이 따라온다.
export const boardEditSchema = boardFormSchema.extend({ boardId: z.string() })

// BAD - 복사해서 필드 하나 추가. 원본이 바뀌면 조용히 어긋난다.
export const boardEditSchema = z.object({
  nickname: nicknameField,
  phone: phoneField,
  content: contentField,
  boardId: z.string(),
})
```

일부만 필요하면 `.pick()` / `.omit()`, 전부 선택적으로 만들려면 `.partial()`을 쓴다.

> 필드에 쓰는 정규식·길이 제한 같은 값은 상수다 — `constants/`에서 가져온다
> ([12-constants](./12-constants.md)). `MIN_PASSWORD_LENGTH`가 이미 그렇게 쓰이고 있다.

### 상수는 어디에 두나

**예외 없이 `constants/`에 둔다.** 로직 파일 안에서 `const`로 선언하지 않는다 — 한 파일에서만
쓰는 값이든 매직넘버든 전부 뺀다 ([12-constants](./12-constants.md)).

| 범위          | 위치                         |
| ------------- | ---------------------------- |
| 한 도메인     | `features/<name>/constants/` |
| 여러 feature  | `shared/constants/`          |
| 환경마다 다름 | `config/env.ts` (예외)       |

```ts
// features/dashboard/constants/order.ts
export const ORDER_STATUS_LABEL = { pending: '대기', shipped: '배송중' } as const

// shared/lib/authChannel.ts - 한 곳만 써도 constants로
import { CHANNEL_NAME } from '@/shared/constants/channel'
```

> **MUST — 엔드포인트 경로는 `constants/`에 두지 않는다.**
> 경로는 **그 경로로 요청하는 모듈이 소유한다.** 한 곳에서만 쓰면 인라인 문자열,
> 두 곳 이상이 쓰면 그 모듈이 `export`한다.
> 경로를 한 파일에 모으는 순간 그게 전역 `endpoints.ts`다 — [03-api](./03-api.md) 규칙 6 참고.

```ts
// GOOD - 쓰는 모듈이 소유 (shared/lib/apiClient.ts)
export const REFRESH_ENDPOINT = '/token-refresh'

// GOOD - 한 곳에서만 쓰면 인라인
const { data } = await api.get<Order[]>('/dashboard/orders')

// BAD - 경로를 상수 폴더로 모은다
// shared/constants/endpoints.ts
export const ENDPOINTS = { ORDERS: '/dashboard/orders', LOGIN: '/login' } as const
```

`constants/`에 들어가는 건 경로가 아니라 **도메인 값**이다. 상태 라벨, 임계값, 모달 문구 같은 것.

### `src/config/` — 앱 설정

부팅 시 1회 평가되는 값. `env`만 있다. 작게 유지한다.

### `src/testing/` — 테스트 하부구조

```
testing/
├── setup.ts      # Vitest 셋업
├── utils.tsx     # renderWithProviders
└── mocks/        # MSW 핸들러 · 워커 · 서버
```

프로덕션 번들에 들어가지 않는 것만 여기 둔다.

## 새 파일을 어디에 둘지

```
이 코드가 특정 도메인에 속하나?
├─ 예 → features/<도메인>/
│        ├─ 요청 함수인가?      → api/
│        ├─ 쿼리/뮤테이션 훅인가? → queries/
│        ├─ 렌더링되는 UI인가?  → components/
│        ├─ zod 스키마인가?     → schemas/
│        ├─ 훅인가?             → hooks/
│        ├─ 클라이언트 상태인가? → stores/
│        ├─ 타입인가?           → types/
│        └─ 상수인가?           → constants/   (단, 엔드포인트 경로는 api/에)
└─ 아니오
   ├─ 앱 조립인가?             → app/
   │   └─ Outlet을 렌더하는 셸? → app/layouts/
   ├─ 설정값인가?              → config/
   ├─ 테스트 전용인가?          → testing/
   └─ 공용인가 → shared/
      ├─ 레이아웃 조각인가?     → components/layouts/
      ├─ 렌더링되는 UI인가?     → components/common/
      ├─ 부수효과가 있는가?     → lib/
      ├─ 순수 함수인가?         → utils/
      ├─ 훅인가?               → hooks/
      ├─ 전역 상태인가?         → stores/
      ├─ 상수인가?             → constants/
      └─ 도메인 무관 스키마인가? → schemas/
```

## 안티패턴

| 하지 말 것                        | 이유                                                                                                           |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| feature 내부 파일 직접 import     | `index.ts`가 공개 API다. 내부는 언제든 바뀐다.                                                                 |
| feature가 다른 feature를 import   | `shared/`로 올리거나 `app/`에서 조립한다.                                                                      |
| `shared/`가 feature를 import      | 방향이 뒤집힌다. 그 순간 공용이 아니다.                                                                        |
| `shared/utils.ts` 한 파일에 쌓기  | 쓰레기통이 된다. 기능별로 파일을 나눈다.                                                                       |
| 엔드포인트 경로를 `constants/`로  | 쓰는 모듈이 소유한다. 모으면 전역 `endpoints.ts`가 된다.                                                       |
| zod 스키마를 컴포넌트에 인라인    | 무조건 `schemas/`로 분리한다. 길이는 기준이 아니다.                                                            |
| 도메인 스키마를 `shared/`로       | `shared/`는 도메인을 모른다. 경계를 잘못 그은 신호다.                                                          |
| 최상위 셸을 `LayoutBase`로 분리   | Provider·전역 오버레이는 `App.tsx` 담당이다. 책임이 겹친다.                                                    |
| 레이아웃 조각이 feature를 참조    | `shared/`에 못 있게 된다. props로 내린다.                                                                      |
| 미리 폴더 파두기                  | 파일 1개짜리 폴더는 만들지 않는다. 2개가 되면 그때 만든다.                                                     |
| 레이어 우선 플랫 구조             | `interfaces/`·`apis/`·`queries/`를 전역에 두지 않는다. 도메인 우선이다 — feature를 통째로 옮기고 지운다.       |
| 도메인 타입을 `shared/types/`로   | `shared/types/`는 여러 feature가 공유하는 것만. 도메인 타입은 `features/<f>/types/`. [05-types](./05-types.md) |
| 로직 파일에 타입/상수 인라인 선언 | 선언 타입은 `types/`, 상수는 `constants/`로. z.infer·typeof-const 파생만 소스 옆. [05-types](./05-types.md)    |
