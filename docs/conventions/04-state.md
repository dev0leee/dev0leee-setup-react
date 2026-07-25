# 04. 상태 관리

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
const DashboardPage = () => {
  const { data } = useQuery(ordersQuery)
  return <OrdersTable orders={data} />
}

// 에러는 QueryErrorBoundary가 잡는다
```

세밀한 에러 UI가 필요하면 그 구간만 `<QueryErrorBoundary>`로 감싼다.
`App.tsx`의 최상위 바운더리는 최후의 보루지 일상적인 에러 표시 수단이 아니다.

### Query Key 규칙 (MUST)

```ts
// 모양만 보여주는 예시다. 실제 정의는 queryOptions 안에 인라인으로 쓴다.
const dashboardKey = ['dashboard'] as const // 도메인
const ordersKey = ['dashboard', 'orders'] as const // 리소스
const orderKey = ['dashboard', 'orders', orderId] as const // 개별
const pagedOrdersKey = ['dashboard', 'orders', { page, sort }] as const // 파라미터는 마지막에 객체로
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
useQuery({ ...orderQuery({ orderId: orderId! }), enabled: Boolean(orderId) })
```

### 캐시 비우기

로그아웃/세션 종료 시 `queryClient.clear()`를 부른다.
이전 사용자 데이터가 다음 로그인 화면에 새어나가면 사고다.
(`AuthProvider.clearSession`이 이미 하고 있다.)

### 조회 화면의 상태를 다 그린다 (MUST)

목록·상세는 **로딩·빈값·에러·정상** 네 상태를 전부 처리한다. 하나라도 빠지면 느린 네트워크나
빈 응답에서 화면이 깨진다. **느린 네트워크(3G)로 "빈값 → 로딩 → 새 데이터" 전환**을 직접 확인한다.

- **첫 로딩과 추가 로딩을 구분한다.** `isPending`(캐시 없는 첫 로딩)은 스켈레톤/shimmer로,
  `isFetching`(재검증·무한스크롤 다음 페이지)은 인라인 스피너로. 추가 로딩을 전체 스켈레톤으로 덮지 않는다.
- **페이지 전환·무한스크롤은 이전 데이터를 유지한다.** `placeholderData: keepPreviousData`로
  페이지가 바뀔 때 화면이 빈값으로 깜빡이지 않게 한다.
- **빈값(empty state)에 안내를 준다.** 빈 배열/`null`을 로딩과 구분해 "데이터 없음" UI를 그린다.
- **에러 상태에 재시도를 준다.** 조회 에러는 ErrorBoundary가 잡되(`throwOnError`), 그 fallback에
  재시도 버튼과 안내 문구를 둔다.
- **필수 파라미터가 없으면 `enabled`로 요청을 막는다.** 위 "쿼리를 조건부로 끄기" 참고.

## 클라이언트 상태 — Zustand

### 스토어에 넣어도 되는 것

- 인증 상태 머신 (`status`, `user`)
- 전역 UI 설정 (사이드바 접힘, 테마 — `next-themes`가 이미 테마를 담당)
- 여러 라우트에 걸쳐 살아남아야 하는 순수 클라이언트 값

### 스토어에 넣으면 안 되는 것

- **서버 데이터** — Query가 소유
- **폼 값** — react-hook-form이 소유
- **Access Token** — `src/shared/lib/tokenStore.ts`가 소유 (스토어에 넣으면 리렌더가 도미노로 번진다)
- **한 컴포넌트만 쓰는 값** — `useState`

### 스토어 작성 규칙

```ts
// shared/types/auth.ts - 스토어 타입도 로직 파일이 아니라 types/에 선언한다 (05-types)
export interface AuthState {
  status: AuthStatus
  user: User | null
  setAuthenticated: (user: User) => void
  setAnonymous: () => void
}
```

```ts
// shared/stores/authStore.ts - 선언하지 않고 import해서 쓴다
import { create } from 'zustand'

import type { AuthState } from '@/shared/types/auth'

export const useAuthStore = create<AuthState>((set) => {
  return {
    status: 'booting',
    user: null,
    setAuthenticated: (user) => {
      set({ status: 'authenticated', user })
    },
    setAnonymous: () => {
      set({ status: 'anonymous', user: null })
    },
  }
})
```

- **MUST — 상태와 액션을 한 인터페이스에 둔다.** 분리된 액션 파일을 만들지 않는다.
- **MUST — 상태 전이는 액션으로만.** `set`을 컴포넌트에서 직접 부르지 않는다.
- **SHOULD — 불리언 여러 개 대신 상태 머신 유니온.**
  `isLoading` + `isLoggedIn` 조합은 불가능한 상태를 표현할 수 있다.
  `'booting' | 'authenticated' | 'anonymous'`는 못 한다.

### 구독은 반드시 셀렉터로 (MUST)

```tsx
// GOOD - status가 바뀔 때만 리렌더
const status = useAuthStore((state) => {
  return state.status
})
const setAuthenticated = useAuthStore((state) => {
  return state.setAuthenticated
})

// BAD - 스토어의 무엇이든 바뀌면 리렌더
const { status, setAuthenticated } = useAuthStore()
```

객체를 반환하는 셀렉터는 매 렌더 새 참조를 만든다. 필요하면 `useShallow`를 쓴다.

```ts
import { useShallow } from 'zustand/react/shallow'

const { status, user } = useAuthStore(
  useShallow((state) => {
    return { status: state.status, user: state.user }
  }),
)
```

## store냐 hook이냐 (자주 헷갈리는 경계 · MUST)

둘 다 `useXxx`라 헷갈린다. 하지만 소유하는 게 다르다.

|             | `stores/` (Zustand)                      | `hooks/`                                       |
| ----------- | ---------------------------------------- | ---------------------------------------------- |
| 소유하는 것 | **상태** — 값이 사는 곳                  | **동작** — 무언가를 하는 로직                  |
| 질문        | "이 값은 어디 사나?"                     | "이걸 어떻게 하나?"                            |
| 정체성      | 싱글톤. 모든 호출부가 **같은** 값을 본다 | 호출부마다 **독립**. 각 호출이 자기 인스턴스다 |
| 안에 든 것  | 상태 + 그 상태를 바꾸는 액션             | store·query·useState·effect를 **엮는** 로직    |
| 부수효과    | 없다. 액션은 상태 전이만                 | 여기서 한다. 구독·네트워크·화면 전환           |

**한 문장으로: store는 데이터, hook은 안무(choreography)다.** store는 값을 들고만 있고,
그 값을 가지고 실제로 뭔가 하는 절차는 hook이 짠다.

이 레포의 실제 짝이 정확히 그 경계다.

```ts
// shared/stores/authStore.ts — store: 상태와 전이 액션만. 부수효과 없음.
export const useAuthStore = create<AuthState>((set) => {
  return {
    status: 'booting',
    user: null,
    setAuthenticated: (user) => {
      set({ status: 'authenticated', user })
    },
    setAnonymous: () => {
      set({ status: 'anonymous', user: null })
    },
  }
})
```

```ts
// features/auth/hooks/useLogout.ts — hook: 여러 시스템을 순서대로 엮는 "절차"
export const useLogout = () => {
  const queryClient = useQueryClient()
  const setAnonymous = useAuthStore((state) => {
    return state.setAnonymous
  })

  return useCallback(async () => {
    try {
      await logout() // 1. 서버에서 토큰 폐기
    } finally {
      broadcastLogout() // 2. 다른 탭에 전파
      setAccessToken({ token: null }) // 3. 메모리 토큰 제거
      queryClient.clear() // 4. 쿼리 캐시 비우기
      setAnonymous() // 5. store 상태 전이 ← 이 한 줄만 store 몫
    }
  }, [queryClient, setAnonymous])
}
```

`setAnonymous`는 store가 하는 유일한 일(상태 전이)이고, 나머지 1~4의 **순서와 조합**이
hook이 하는 일이다. 이 절차를 store 액션 안에 넣으면 store가 네트워크·캐시·다른 탭을 알게 돼
경계가 무너진다.

hook이 상태를 가져도 되지만, 그 상태는 **호출부마다 독립**이라는 점이 store와 다르다.

```ts
// shared/hooks/useDisclosure.ts — 상태를 갖지만 호출부마다 별개다
export const useDisclosure = () => {
  const [isOpen, setIsOpen] = useState(false)
  const open = useCallback(() => {
    setIsOpen(true)
  }, [])
  const close = useCallback(() => {
    setIsOpen(false)
  }, [])
  return { isOpen, open, close }
}

// 모달 A와 모달 B가 각각 useDisclosure()를 부르면 isOpen이 서로 다르다.
// 반대로 useAuthStore는 어디서 부르든 같은 status다 — 그게 store다.
```

**판별 질문 세 개:**

1. **여러 컴포넌트가 같은 값을 읽고 서로의 변경을 봐야 하나?** → store.
   아니면(호출부 지역 상태) → hook 안 `useState`.
2. **구독·부수효과·여러 소스를 엮는 절차인가?** → hook.
3. **훅이 상태를 갖더라도** 그게 그 호출부만의 것이면 hook, 앱 전역에서 공유되면 store다.

> **MUST — hook 안에서 전역 상태를 흉내내지 않는다.** 모듈 스코프 변수 + `useState`로
> "모든 호출부가 공유하는 값"을 만들면 그건 **숨은 store**다. 그럴 거면 Zustand store로 만든다.
> 숨은 store는 devtools에도 안 잡히고 구독 규칙(셀렉터)도 못 태운다.
>
> **MUST — store 안에 부수효과를 넣지 않는다.** 액션에서 `navigate`·`api` 호출을 하지 않는다.
> store 액션은 상태 전이만 하고, 그 전후의 절차는 hook이 소유한다 ([01-folder-structure](./01-folder-structure.md)).

hook이 store를 읽고 액션을 부르는 건 정상이다 — 그게 hook이 store를 **쓰는** 방식이다.
경계는 "hook이 store를 대체하거나, store가 hook 일을 하기 시작할 때" 무너진다.

## 로컬 상태 — useState / useReducer

- 필드 2~3개까지는 `useState` 여러 개.
- 전이 규칙이 있으면 `useReducer`.
- **다른 상태로부터 계산되는 값은 상태가 아니다.** 렌더 중에 계산한다.

```tsx
// BAD
const [total, setTotal] = useState(0)
useEffect(() => {
  setTotal(
    orders.reduce((sum, order) => {
      return sum + order.amount
    }, 0),
  )
}, [orders])

// GOOD
const total = orders.reduce((sum, order) => {
  return sum + order.amount
}, 0)
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
