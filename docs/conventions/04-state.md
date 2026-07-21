# 04. 상태 관리

## 지금 커뮤니티는 (2026-07 기준)

**서버 상태와 클라이언트 상태를 분리하는 것이 2026년의 컨센서스다.** 이 문서에서 가장 확신 있게 말할 수 있는 규칙이 이것이다.

- **서버 상태 → TanStack Query.** 페칭·캐싱·뮤테이션·낙관적 업데이트·페이지네이션을 전부 가져간다.
- **클라이언트 상태 → Zustand.** 앱 안에서만 살고 사용자가 통제하는 값, 동기적이고 캐싱이 필요 없는 값.
- **절대 규칙:** _"Never store server data in client state libraries. TanStack Query handles caching, refetching, and invalidation — duplicating in Zustand creates synchronization bugs."_

TanStack Query 공식 문서도 같은 선을 긋는다("Does TanStack Query replace Redux?" — 서버 상태는 대체하지만 클라이언트 상태는 대체하지 않는다).

**전역 상태 자체에 대한 피로감도 크다.** r/reactjs "그만 쓰게 된 패턴" 스레드 1위([u/Major-Front](https://reddit.com/r/reactjs/comments/1uqqy52/comment/ow9z2ce/), 142 upvotes): _"Redux and global state in general. Multiple contributors to a single app is a nightmare when a change in global reducers can break an unrelated part of the app."_

동시에 **"무조건 Zustand"도 아니다.** [@CertificatesDev](https://x.com/CertificatesDev/status/2077715586209984780): _"Not every React app needs Zustand. Not every state belongs in Context. And `useState` definitely isn't the answer to everything."_ 그래서 아래 결정 트리가 필요하다.

## 결정 트리 (MUST)

상태를 어디에 둘지는 **출처와 수명**이 정한다. 취향이 아니다.

```
이 값은 서버에서 왔나?
├─ 예 → TanStack Query. 끝. 다른 데 복사하지 않는다.
└─ 아니오
   ├─ URL에 있어야 하나? (공유·새로고침·뒤로가기) → 라우터 (searchParams / path)
   ├─ 이 컴포넌트만 쓰나? → useState / useReducer
   ├─ 부모-자식 몇 단계인가? → props로 내린다
   └─ 앱 전역이고 자주 안 바뀌나? → Zustand
```

> **MUST — 서버 데이터를 Zustand에 넣지 않는다.**
> Query가 캐싱·재검증·무효화를 전부 한다. 스토어에 복사하는 순간 두 개의 진실이 생기고,
> 그 둘이 어긋나는 버그는 재현이 안 된다.
>
> 커뮤니티가 이걸 계속 말한다 — r/reactjs 최다 추천 댓글(142 upvotes):
> _"Redux and global state in general. Multiple contributors to a single app is a nightmare
> when a change in global reducers can break an unrelated part of the app."_

## 서버 상태 — TanStack Query

### 기본 옵션은 `src/app/queryClient.ts`가 정한다

```ts
staleTime: 60_000       // 1분간 fresh. 화면 전환마다 재요청하지 않는다.
retry: 4xx면 중단        // 4xx는 재시도해도 같다. 401은 인터셉터가 이미 처리.
throwOnError: true      // 조회 에러 → ErrorBoundary
mutations.retry: false
mutations.throwOnError: false   // 변경 에러 → 폼/토스트에서 개별 처리
```

**개별 쿼리에서 이 기본값을 덮어쓸 때는 왜 필요한지 주석을 단다.**

### `throwOnError: true`가 의미하는 것

화면마다 `if (error) return <Error />`를 반복하지 않는다. 에러는 바운더리로 올라간다.

```tsx
// GOOD - 에러 분기가 없다
function DashboardPage() {
  const { data } = useQuery(ordersQuery)
  return <OrdersTable orders={data} />
}

// 에러는 QueryErrorBoundary가 잡는다
```

세밀한 에러 UI가 필요하면 그 구간만 `<QueryErrorBoundary>`로 감싼다.
`App.tsx`의 최상위 바운더리는 최후의 보루지 일상적인 에러 표시 수단이 아니다.

### Query Key 규칙 (MUST)

```ts
const domainKey = ['dashboard'] as const // 도메인
const listKey = ['dashboard', 'orders'] as const // 리소스
const detailKey = ['dashboard', 'orders', orderId] as const // 개별
const pagedKey = ['dashboard', 'orders', { page, sort }] as const // 파라미터는 마지막에 객체로
```

- **넓은 것 → 좁은 것 순서.** 접두 매칭 무효화를 위해서다.
- **`as const`를 붙인다.** 타입 추론이 넓어지는 걸 막는다.
- **키 문자열을 손으로 반복하지 않는다.** `queryOptions`가 유일한 정의처여야 한다.

접두 매칭이 실제로 어떻게 쓰이는지 — 커뮤니티가 정확히 이 패턴을 씁니다
([@KavishSriv90549](https://x.com/KavishSriv90549/status/2078917897574035566)):
_"TanStack Query with prefix-matching query keys - one invalidation call covers related queries.
Mutations invalidate cache instead of manual refetch."_

```ts
queryClient.invalidateQueries({ queryKey: ['dashboard'] })
// ['dashboard','orders'], ['dashboard','revenue'] 전부 무효화
```

### 쿼리를 조건부로 끄기

라우트 파라미터가 아직 없을 때 요청이 나가지 않게 한다.

```ts
useQuery({ ...orderQuery(orderId!), enabled: Boolean(orderId) })
```

### 캐시 비우기

로그아웃/세션 종료 시 `queryClient.clear()`를 부른다.
이전 사용자 데이터가 다음 로그인 화면에 새어나가면 사고다.
(`AuthProvider.clearSession`이 이미 하고 있다.)

## 클라이언트 상태 — Zustand

### 스토어에 넣어도 되는 것

- 인증 상태 머신 (`status`, `user`)
- 전역 UI 설정 (사이드바 접힘, 테마 — `next-themes`가 이미 테마를 담당)
- 여러 라우트에 걸쳐 살아남아야 하는 순수 클라이언트 값

### 스토어에 넣으면 안 되는 것

- **서버 데이터** — Query가 소유
- **폼 값** — react-hook-form이 소유
- **Access Token** — `src/api/tokenStore.ts`가 소유 (스토어에 넣으면 리렌더가 도미노로 번진다)
- **한 컴포넌트만 쓰는 값** — `useState`

### 스토어 작성 규칙

```ts
// features/auth/store.ts
import { create } from 'zustand'
import type { AuthStatus, User } from './types'

interface AuthState {
  status: AuthStatus
  user: User | null
  setAuthenticated: (user: User) => void
  setAnonymous: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  status: 'booting',
  user: null,
  setAuthenticated: (user) => set({ status: 'authenticated', user }),
  setAnonymous: () => set({ status: 'anonymous', user: null }),
}))
```

- **MUST — 상태와 액션을 한 인터페이스에 둔다.** 분리된 액션 파일을 만들지 않는다.
- **MUST — 상태 전이는 액션으로만.** `set`을 컴포넌트에서 직접 부르지 않는다.
- **SHOULD — 불리언 여러 개 대신 상태 머신 유니온.**
  `isLoading` + `isLoggedIn` 조합은 불가능한 상태를 표현할 수 있다.
  `'booting' | 'authenticated' | 'anonymous'`는 못 한다.

### 구독은 반드시 셀렉터로 (MUST)

```tsx
// GOOD - status가 바뀔 때만 리렌더
const status = useAuthStore((s) => s.status)
const setAuthenticated = useAuthStore((s) => s.setAuthenticated)

// BAD - 스토어의 무엇이든 바뀌면 리렌더
const { status, setAuthenticated } = useAuthStore()
```

객체를 반환하는 셀렉터는 매 렌더 새 참조를 만든다. 필요하면 `useShallow`를 쓴다.

```ts
import { useShallow } from 'zustand/react/shallow'
const { status, user } = useAuthStore(useShallow((s) => ({ status: s.status, user: s.user })))
```

## 로컬 상태 — useState / useReducer

- 필드 2~3개까지는 `useState` 여러 개.
- 전이 규칙이 있으면 `useReducer`.
- **다른 상태로부터 계산되는 값은 상태가 아니다.** 렌더 중에 계산한다.

```tsx
// BAD
const [total, setTotal] = useState(0)
useEffect(() => setTotal(orders.reduce((a, o) => a + o.amount, 0)), [orders])

// GOOD
const total = orders.reduce((a, o) => a + o.amount, 0)
```

이건 커뮤니티가 가장 자주 후회하는 지점이다 (u/FearIsHere, 100 upvotes):
_"react.dev/learn/you-might-not-need-an-effect is one of the most useful reads I have done.
Before that I used effects for pretty much anything, now barely at all."_

## URL 상태

**공유 가능해야 하거나 새로고침 후에도 남아야 하면 URL에 둔다.**
필터, 정렬, 페이지, 탭, 검색어가 여기 해당한다.

```tsx
const [searchParams, setSearchParams] = useSearchParams()
const page = Number(searchParams.get('page') ?? '1')
```

모달 열림 여부는 보통 URL에 두지 않는다 — [11-overlay](./11-overlay.md) 참고.
