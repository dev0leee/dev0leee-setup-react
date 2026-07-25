# 08. 라우팅 및 페이지

react-router-dom 7, `createBrowserRouter`. 라우트 정의는 `src/app/router.tsx` 한 곳뿐이다.

## 라우트 트리 구조

```
/login                    ← 비인증 진입점. 즉시 로드.
└─ <ProtectedRoute>       ← 인증 가드
   └─ <AppLayout>         ← 헤더/사이드바/Outlet
      └─ index → DashboardPage   (lazy)
*                         ← NotFoundPage
```

**중첩의 의미:**

- `ProtectedRoute` — 인증 검사. 미인증이면 `/login`으로 리다이렉트하며 `state.from`에 원래 경로를 담는다.
- `AppLayout` — 인증된 사용자만 보는 셸. 여기 있는 것은 로그인 화면에 안 나온다.
- `index` — 부모 경로(`/`)에 정확히 매칭될 때의 화면.

새 인증 필요 페이지는 `AppLayout`의 `children`에 넣는다. 그것만 하면 가드가 자동 적용된다.

## 페이지 컨벤션 (MUST)

### 페이지는 feature가 소유한다

라우트 파일은 페이지를 **가리키기만** 한다. 페이지 자체는 그 feature의 `pages/`에 있다
(라우트에 걸리는 화면만 `pages/`, 나머지 조각은 `components/` — [10-components](./10-components.md)).

```
features/auth/pages/LoginPage.tsx
features/dashboard/pages/DashboardPage.tsx
app/NotFoundPage.tsx        ← 도메인이 없는 페이지만 app/
```

전역 `src/pages/`를 만들지 않는다. 페이지는 그 도메인의 일부다.

### 페이지 컴포넌트 이름은 `~Page`로 끝난다

`LoginPage`, `DashboardPage`, `NotFoundPage`. named export한다 (default export 금지 — [09-imports](./09-imports.md)).

### 페이지가 하는 일

**조합과 배치.** 로직은 아래로 내린다.

```tsx
export const DashboardPage = () => {
  return (
    <div className="flex flex-col gap-6 p-6">
      <RevenueChart />
      <OrdersTable />
    </div>
  )
}
```

데이터 페칭은 그 데이터를 실제로 쓰는 컴포넌트가 한다. 페이지가 다 받아서 props로 뿌리지 않는다.
Query 캐시가 있어서 여러 컴포넌트가 같은 쿼리를 불러도 요청은 한 번이다.

## 코드 스플리팅 (MUST)

**모든 신규 라우트는 `lazy`로 붙인다.** `/login`처럼 첫 진입에 반드시 필요한 것만 예외다.

```tsx
{
  path: '/orders',
  lazy: async () => {
    const { OrdersPage } = await import('@/features/orders/pages/OrdersPage')
    return { Component: OrdersPage }
  },
}
```

이게 있어야 `recharts`, `@tanstack/react-table` 같은 무거운 의존성이 초기 번들에서 빠진다.
`router.tsx`의 대시보드 라우트에 이 이유가 주석으로 남아 있다.

**lazy 라우트는 named export여야 한다.** `default` export를 쓰면 이 패턴이 깨진다.

## 네비게이션

| 상황                 | 방법                                       |
| -------------------- | ------------------------------------------ |
| 사용자가 누르는 이동 | `<Link to="...">` / `<NavLink>`            |
| 렌더 중 리다이렉트   | `<Navigate to="..." replace />`            |
| 이벤트/콜백에서 이동 | `void navigate(path, { replace: true })`   |
| 탭·필터·정렬 전환    | `setSearchParams(next, { replace: true })` |

> **MUST — 렌더 중에 `navigate()`를 호출하지 않는다.** `<Navigate>`를 반환한다.
> `LoginPage`의 `if (status === 'authenticated') return <Navigate to="/" replace />`가 그 예다.

> **SHOULD — 리다이렉트와 같은 화면 안의 상태 전환에는 `replace`.**
> 로그인·리다이렉트는 뒤로가기로 다시 갇히지 않게, 탭·필터 전환은 히스토리를 쌓지 않게 한다.
> 탭을 `push`로 바꾸면 열 번 누른 게 뒤로가기 열 번이 되어, 한 번에 이전 페이지로 못 나간다.

```tsx
// 탭 전환 - 같은 페이지의 뷰 변경이지 새 페이지 이동이 아니다
const selectTab = (next: string) => {
  setSearchParams({ tab: next }, { replace: true }) // 히스토리 쌓지 않는다
}
```

`navigate`는 Promise를 반환하므로 `void`를 붙인다 ([07-javascript](./07-javascript.md)).

## URL 파라미터

```tsx
const { orderId } = useParams() // string | undefined - 항상 옵셔널이다
const [searchParams, setSearchParams] = useSearchParams()
```

**MUST — `useParams` 결과를 검증 없이 쓰지 않는다.** 타입은 `string | undefined`다.

```tsx
const { orderId } = useParams()
const { data } = useQuery({ ...orderQuery({ orderId: orderId! }), enabled: Boolean(orderId) })
```

필터·정렬·페이지·탭은 URL에 둔다 ([04-state](./04-state.md)). 새로고침과 공유가 공짜로 된다.

## state로 데이터 전달

URL에 노출하고 싶지 않은 값은 `navigate`의 `state`로 넘긴다. react-router가 `history.state`를 감싼다.

```tsx
// 전달
void navigate(`/orders/${orderId}/payment`, { state: { selectedDate } })

// 수신 - 타입 없는 API라 단언이 허용되는 자리다 ([05-types](./05-types.md))
const location = useLocation()
const state = location.state as { selectedDate?: string } | null
const selectedDate = state?.selectedDate ?? ''
```

> **MUST — `state`에만 의존하는 화면을 만들지 않는다.** 사용자가 그 URL로 **직접 들어오면
> `state`는 `null`**이다(북마크·새로고침·링크 공유). 없으면 다시 조회하거나 이전 화면으로 돌린다.

**뒤로가기해도 남아야 하거나 공유돼야 하는 값은 `state`가 아니라 URL에 둔다.** `state`는
"이번 이동에만 딸려 보내는 힌트"다 — 예: 목록에서 고른 날짜를 결제 화면에 미리 채워주되,
없어도 화면이 동작하는 경우.

## 라우트에서 데이터 로딩

**loader를 쓰지 않는다.** 이 프로젝트는 TanStack Query가 서버 상태를 소유한다.
loader와 Query를 섞으면 캐시가 두 개가 된다.

빠른 표시가 필요하면 lazy 안에서 prefetch한다:

```tsx
lazy: async () => {
  const { OrdersPage } = await import('@/features/orders/pages/OrdersPage')
  void queryClient.prefetchQuery(ordersQuery)
  return { Component: OrdersPage }
}
```

## 페이지 전환 애니메이션 (SHOULD)

라우트가 바뀔 때 페이지에 fade-in을 준다. **라우트 레이아웃 한 곳**(`app/layouts/AppLayout`)에서
`Outlet`을 `PageTransition`으로 감싼다. 페이지마다 각자 애니메이션을 붙이지 않는다.

```tsx
<PageTransition>
  <Outlet />
</PageTransition>
```

- **key로 재마운트해 enter 애니메이션을 돌린다.** `PageTransition`이 `location.pathname`을 key로
  주면 라우트가 바뀔 때 안쪽이 다시 마운트되며 `animate-in fade-in`이 다시 돈다 — React판
  `<Transition :key="route.fullPath">`다.
- **enter만 준다.** leave(빠지는) 애니메이션은 이전 페이지를 남겨둬야 해서 별도 라이브러리가
  필요하다. 지금은 넣지 않는다.
- **`motion-reduce`로 끈다.** 동작 줄이기를 켠 사용자에겐 전환이 없다 ([14-styling](./14-styling.md)).

## 페이지 추가 체크리스트

1. `src/features/<도메인>/pages/XxxPage.tsx` 생성 (named export)
2. 필요한 쿼리를 `features/<도메인>/queries/`에 `queryOptions`로 추가
3. `src/testing/mocks/handlers.ts`에 MSW 핸들러 추가
4. `src/app/router.tsx`에 `lazy` 라우트 추가 — 인증 필요하면 `AppLayout` children 아래
5. e2e가 필요하면 `e2e/`에 `.spec.ts` 추가
6. `pnpm typecheck && pnpm lint && pnpm test` 통과 확인
