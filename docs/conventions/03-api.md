# 03. API 함수

## 대원칙

**화면 코드는 axios를 몰라야 한다.**
axios를 아는 곳은 `src/shared/lib/apiClient.ts`와 `src/shared/lib/apiErrors.ts` 둘뿐이다.

```
컴포넌트  →  feature queries/  →  feature api/  →  @/shared/lib/apiClient의 api  →  서버
```

## 계층별 책임

| 계층       | 파일                          | 책임                                                   |
| ---------- | ----------------------------- | ------------------------------------------------------ |
| 인스턴스   | `src/shared/lib/apiClient.ts` | baseURL, 타임아웃, 토큰 주입, 401 refresh, 에러 정규화 |
| 에러       | `src/shared/lib/apiErrors.ts` | `ApiError` 타입, `toApiError` 변환                     |
| 엔드포인트 | `src/features/<f>/api/`       | 개별 요청 함수. React를 모른다.                        |
| 쿼리       | `src/features/<f>/queries/`   | `queryOptions` · `useQuery`/`useMutation` 훅           |
| 소비       | 컴포넌트                      | `useQuery(xxxQuery)` / `useXxxMutation()`              |

## MUST 규칙

### 1. `api` 인스턴스만 쓴다

```ts
// GOOD
import { api } from '@/shared/lib/apiClient'

const { data } = await api.get<Order[]>('/dashboard/orders')
```

```ts
// BAD
import axios from 'axios'

const { data } = await axios.get('/dashboard/orders') // 토큰도, refresh도, 에러 정규화도 없다
```

### 2. 응답 타입을 제네릭으로 명시하고, 함수는 `data`만 반환한다

컴포넌트가 `AxiosResponse`를 만지게 하지 않는다.

```ts
// GOOD
export async function login(payload: LoginPayload): Promise<SessionResponse> {
  const { data } = await api.post<SessionResponse>('/login', payload)
  return data
}

// BAD
export function login(payload: LoginPayload) {
  return api.post('/login', payload) // 반환 타입 any, 호출부가 .data를 알아야 함
}
```

### 3. 에러를 feature api/에서 try/catch하지 않는다

인터셉터가 이미 `ApiError`로 정규화한다. 여기서 또 잡으면 Query의 재시도/에러 바운더리가 죽는다.

```ts
// BAD
export async function login(payload: LoginPayload) {
  try {
    const { data } = await api.post<SessionResponse>('/login', payload)
    return data
  } catch (e) {
    console.error(e) // 삼켜버림. Query가 실패를 모른다.
    return null
  }
}
```

에러는 위로 던지고, **표시할 곳에서** 처리한다:

- 조회 실패 → `throwOnError: true`라 ErrorBoundary가 잡는다
- 변경 실패 → `useMutation`의 `onError`에서 폼 에러/토스트로 표시한다

### 4. 조회는 `queries/`에서 `queryOptions`로 정의한다

`queryKey`와 `queryFn`을 한 곳에 묶어 타입 추론까지 가져간다.
`useQuery`, `useSuspenseQuery`, `prefetchQuery`, `invalidateQueries`가 전부 같은 객체를 쓴다.

```ts
// features/dashboard/api/dashboard.ts - 요청 함수
import { api } from '@/shared/lib/apiClient'

export async function getOrders(): Promise<Order[]> {
  const { data } = await api.get<Order[]>('/dashboard/orders')
  return data
}
```

```ts
// features/dashboard/queries/ordersQuery.ts - 쿼리 정의
import { queryOptions } from '@tanstack/react-query'

import { getOrders } from '@/features/dashboard/api/dashboard'

export const ordersQuery = queryOptions({
  queryKey: ['dashboard', 'orders'] as const,
  queryFn: getOrders,
})
```

```tsx
// 소비
const { data: orders } = useQuery(ordersQuery)
```

파라미터가 있으면 함수로 감싼다:

```ts
export function orderQuery(orderId: string) {
  return queryOptions({
    queryKey: ['dashboard', 'orders', orderId] as const,
    queryFn: async () => {
      const { data } = await api.get<Order>(`/dashboard/orders/${orderId}`)
      return data
    },
  })
}
```

### 5. 변경(mutation)은 평범한 async 함수로 export한다

`useMutation`에 그대로 넘길 수 있는 모양이어야 한다.

```ts
export async function createOrder(payload: CreateOrderPayload): Promise<Order> {
  const { data } = await api.post<Order>('/dashboard/orders', payload)
  return data
}
```

```tsx
const mutation = useMutation({
  mutationFn: createOrder,
  onSuccess: () => {
    // 접두 매칭 - dashboard 하위 쿼리가 전부 무효화된다
    void queryClient.invalidateQueries({ queryKey: ['dashboard'] })
  },
})
```

> **SHOULD — 수동 refetch 대신 invalidate.** 뮤테이션 후 `refetch()`를 직접 부르지 말고
> `invalidateQueries`로 캐시를 무효화한다. 화면에 떠 있는 쿼리만 자동으로 다시 받는다.

### 6. 엔드포인트 경로는 그 경로를 쓰는 모듈이 소유한다

전역 `endpoints.ts`를 만들지 않는다. 두 곳 이상에서 쓰는 경로만 상수로 뽑는다.

```ts
// src/shared/lib/apiClient.ts - refresh는 client.ts와 auth/api/auth.ts 둘 다 쓴다
export const REFRESH_ENDPOINT = '/token-refresh'
```

한 곳에서만 쓰는 경로는 인라인 문자열로 둔다. 상수화가 오히려 추적을 어렵게 한다.

## 인터셉터를 건드릴 때 (주의)

`src/shared/lib/apiClient.ts`의 401 refresh 로직은 세 가지 동시성을 동시에 처리한다.
**고치기 전에 주석을 전부 읽는다.**

1. `_retried` 플래그 — 재시도는 요청당 1회. 없으면 401 무한 루프.
2. Web Locks (`auth:refresh`) — 탭을 가로질러 refresh를 직렬화.
3. 락 획득 후 토큰 재확인 — 다른 요청이 이미 갱신했으면 그 토큰을 쓴다.

> **알아둘 것:** 백엔드가 "권한 부족"을 401로 주면 이 로직이 무한히 돈다. 그건 403이어야 한다.
> 새 엔드포인트를 붙일 때 백엔드 상태 코드를 확인한다.

**refresh 실패 시 여기서 화면을 전환하지 않는다.** 라우팅은 `AuthProvider`가 담당한다.

## 에러 다루기

```ts
import { ApiError } from '@/shared/lib/apiErrors'

if (error instanceof ApiError) {
  if (error.isNetworkError) {
    // status === 0. 서버 응답 자체가 없음.
  }
  if (error.status === 404) {
    /* ... */
  }
  error.code // 서버가 준 비즈니스 에러 코드
}
```

`ApiError.message`는 **서버가 준 메시지가 있으면 그것**, 없으면 axios 기본 메시지다.
사용자에게 그대로 보여도 되는 문구인지는 백엔드와 합의한 것에 달렸다.
합의가 없으면 화면에서 자체 문구로 치환한다.

## MSW 목킹

새 엔드포인트를 만들면 `src/testing/mocks/handlers.ts`에 핸들러를 추가한다.
`VITE_ENABLE_MSW=true`면 개발 서버가 이걸 쓴다. 테스트는 `src/testing/mocks/server.ts`를 쓴다.

엔드포인트를 추가하고 핸들러를 안 만들면 테스트가 실제 네트워크를 때린다.
