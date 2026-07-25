# 03. API 함수

## 대원칙

**화면 코드는 axios를 몰라야 한다.**
axios를 아는 곳은 `src/shared/lib/apiClient.ts`와 `src/shared/lib/apiErrors.ts` 둘뿐이다.

```
컴포넌트  →  feature queries/  →  feature api/  →  @/shared/lib/apiClient의 인스턴스  →  서버
```

## 계층별 책임

| 계층       | 파일                          | 책임                                                                    |
| ---------- | ----------------------------- | ----------------------------------------------------------------------- |
| 인스턴스   | `src/shared/lib/apiClient.ts` | baseURL, 타임아웃, 토큰 주입, 401 refresh, 에러 정규화, 파라미터 직렬화 |
| 에러       | `src/shared/lib/apiErrors.ts` | `ApiError` 타입, `toApiError` 변환                                      |
| 엔드포인트 | `src/features/<f>/api/`       | 개별 요청 함수. React를 모른다.                                         |
| 쿼리       | `src/features/<f>/queries/`   | `queryOptions` · `useQuery`/`useMutation` 훅                            |
| 소비       | 컴포넌트                      | `useQuery(xxxQuery)` / `useXxxMutation()`                               |

## MUST 규칙

### 1. 인증 여부에 맞는 인스턴스를 쓴다

**`axios`를 직접 import하지 않는다.** 그리고 **그 요청이 인증을 요구하는지에 따라 인스턴스를
나눠 쓴다.** 호출부만 봐도 인증이 필요한 요청인지 드러나야 한다.

| 인스턴스    | 언제                      | 붙는 것                               |
| ----------- | ------------------------- | ------------------------------------- |
| `api`       | 인증이 필요한 요청 (기본) | 토큰 주입 + 401 refresh + 에러 정규화 |
| `publicApi` | 인증이 필요 없는 요청     | 에러 정규화만                         |

```ts
// GOOD - 인증이 필요한 조회
import { api } from '@/shared/lib/apiClient'

const { data } = await api.get<Order[]>('/dashboard/orders')
```

```ts
// GOOD - 로그인은 아직 토큰이 없다
import { publicApi } from '@/shared/lib/apiClient'

const { data } = await publicApi.post<SessionResponse>('/login', payload)
```

```ts
// BAD
import axios from 'axios'

const { data } = await axios.get('/dashboard/orders') // 토큰도, refresh도, 에러 정규화도 없다
```

**비인증 요청을 `api`로 보내면 안 되는 이유는 편의가 아니라 정확성이다.**

- 로그인·회원가입처럼 토큰이 없는 상태의 요청이 401을 받으면, `api`의 인터셉터가
  "토큰이 만료됐구나" 하고 **불필요한 refresh를 시도**한다. 실패하면 세션까지 지운다.
- 특히 **세션 복원처럼 refresh 엔드포인트를 직접 부르는 요청은 반드시 `publicApi`여야 한다.**
  `api`로 보내면 401 시 인터셉터가 **같은 엔드포인트로 또 refresh를 걸어 루프**가 된다.

> **판단 기준:** "이 요청이 성공하는 데 Access Token이 필요한가?"
> 필요하면 `api`, 아니면 `publicApi`. 애매하면 `api`가 기본값이다.

### 2. 응답 타입을 제네릭으로 명시하고, 함수는 `data`만 반환한다

컴포넌트가 `AxiosResponse`를 만지게 하지 않는다.

```ts
// GOOD
export const login = async (payload: LoginPayload): Promise<SessionResponse> => {
  const { data } = await publicApi.post<SessionResponse>('/login', payload)
  return data
}

// BAD
export const login = (payload: LoginPayload) => {
  return publicApi.post('/login', payload) // 반환 타입 any, 호출부가 .data를 알아야 함
}
```

### 3. 에러를 feature api/에서 try/catch하지 않는다

인터셉터가 이미 `ApiError`로 정규화한다. 여기서 또 잡으면 Query의 재시도/에러 바운더리가 죽는다.

```ts
// BAD
export const login = async (payload: LoginPayload) => {
  try {
    const { data } = await publicApi.post<SessionResponse>('/login', payload)
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

export const getRevenue = async (): Promise<RevenuePoint[]> => {
  const { data } = await api.get<RevenuePoint[]>('/dashboard/revenue')
  return data
}
```

```ts
// features/dashboard/queries/revenueQuery.ts - 쿼리 정의
import { queryOptions } from '@tanstack/react-query'

import { getRevenue } from '@/features/dashboard/api/dashboard'

export const revenueQuery = queryOptions({
  queryKey: ['dashboard', 'revenue'] as const,
  queryFn: getRevenue,
})
```

```tsx
// 소비
const { data: revenue } = useQuery(revenueQuery)
```

파라미터가 있으면 함수로 감싸고, 파라미터 객체를 queryKey 마지막에 둔다 (04-state). 쿼리
파라미터는 요청의 `params`로 넘긴다 (규칙 7):

```ts
// features/dashboard/queries/ordersQuery.ts
export const ordersQuery = (params: OrderListParams = {}) => {
  return queryOptions({
    queryKey: ['dashboard', 'orders', params] as const,
    queryFn: () => {
      return getOrders(params)
    },
  })
}

// 소비 - useSuspenseQuery(ordersQuery()) / useQuery(ordersQuery({ page }))
```

`queryOptions`(`xxxQuery.ts`)는 **여러 소비처가 같은 정의를 공유할 때** 쓴다 —
`useSuspenseQuery`로 위젯이 직접 소비하거나(`ordersQuery`·`revenueQuery`가 그 예),
`prefetchQuery`·`invalidateQueries`가 같은 객체를 가리켜야 할 때다.

#### 한 곳에서 쓰는 조회는 `useGetXxx` 훅으로

**`queryOptions`를 공유할 필요가 없으면 훅 하나로 감싼다.** 뮤테이션 훅과 같은 모양이다 —
파일 하나에 훅 하나, `data`·`isLoading`을 이름 붙여 반환한다.

```ts
// features/dashboard/queries/useGetOrder.ts
export const useGetOrder = ({ orderId }: { orderId: string | undefined }) => {
  const { data: order, isLoading: isOrderLoading } = useQuery({
    queryKey: ['dashboard', 'orders', orderId] as const,
    queryFn: () => {
      return getOrder({ orderId: orderId! })
    },
    // 라우트 파라미터처럼 아직 없을 수 있는 값은 요청을 막는다 (04-state).
    enabled: Boolean(orderId),
  })

  return { order, isOrderLoading }
}
```

- **파일 하나에 함수 하나.** `useGetXxx.ts`에 `queryOptions` export와 훅을 같이 두지 않는다.
  공유가 필요하면 `xxxQuery.ts`(queryOptions만), 아니면 `useGetXxx.ts`(훅만). 한 파일이 둘을
  겸하면 "이걸 어디서 가져다 쓰지"가 애매해진다.
- **반환은 이름 붙인 객체.** `data`·`isLoading`을 그대로 내보내지 않는다 — 한 화면이 조회
  여러 개를 쓰면 `isLoading`이 충돌한다 ([02-naming](./02-naming.md) 뮤테이션 반환과 같은 이유).
- **조회에는 토스트를 달지 않는다.** 화면이 곧 결과다 ([11-overlay](./11-overlay.md)).

### 5. 변경(mutation)은 `queries/`의 훅으로 감싼다

api 함수는 `useMutation`에 그대로 넘길 수 있는 평범한 async 함수다.

```ts
// features/dashboard/api/dashboard.ts
export const createOrder = async (payload: CreateOrderPayload): Promise<Order> => {
  const { data } = await api.post<Order>('/dashboard/orders', payload)
  return data
}
```

**컴포넌트 안에 `useMutation`을 인라인으로 쓰지 않는다.** 훅 하나당 파일 하나로 `queries/`에 둔다
([01-folder-structure](./01-folder-structure.md)). 훅 이름은 `usePostXxx`·`usePatchXxx`·`useDeleteXxx`.

```ts
// features/dashboard/queries/usePostOrder.ts
export const usePostOrder = () => {
  const queryClient = useQueryClient()

  const {
    mutate: postOrderMutation,
    isSuccess: isPostOrderSuccess,
    isPending: isPostOrderPending,
  } = useMutation({
    mutationFn: createOrder,
    onSuccess: () => {
      // 접두 매칭 - dashboard 하위 쿼리가 전부 무효화된다
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success(ORDER_TOAST_MESSAGE.created)
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  return { postOrderMutation, isPostOrderSuccess, isPostOrderPending }
}
```

**반환은 이름을 붙인 객체다.** `mutate`·`isPending`·`isSuccess`를 그대로 내보내지 말고
`postOrderMutation`·`isPostOrderPending`·`isPostOrderSuccess`로 리네임한다. 한 화면이 여러
뮤테이션을 쓸 때 `isPending`이 충돌하지 않고, 호출부에서 무엇의 상태인지 이름으로 드러난다
([02-naming](./02-naming.md)).

- **성공·실패 피드백은 훅이 소유한다.** 도메인 공통 결과(토스트)는 `onSuccess`/`onError`가
  낸다. 화면 전환처럼 화면마다 다른 것만 호출부가 `mutate` 콜백으로 넘긴다.
- **성공 토스트는 GET을 뺀 변경 계열(post·patch·delete)에 단다.** 조회는 화면이 곧 결과라
  토스트가 없다. 문구는 `constants/`의 `_TOAST_MESSAGE` 매핑에서 가져온다 ([12-constants](./12-constants.md)).
- **에러 표시가 폼이면 토스트 대신 호출부에서 처리한다.** 로그인처럼 필드 에러로 보여야 하는
  뮤테이션은 훅에서 토스트를 달지 말고 `onError`를 호출부에 맡긴다 (`useLogin`이 그 예다).

> **SHOULD — 수동 refetch 대신 invalidate.** 뮤테이션 후 `refetch()`를 직접 부르지 말고
> `invalidateQueries`로 캐시를 무효화한다. 화면에 떠 있는 쿼리만 자동으로 다시 받는다.

### 6. 엔드포인트 경로는 그 경로를 쓰는 모듈이 소유한다

전역 `endpoints.ts`를 만들지 않는다. 두 곳 이상에서 쓰는 경로만 상수로 뽑는다.

```ts
// src/shared/lib/apiClient.ts - refresh는 client.ts와 auth/api/auth.ts 둘 다 쓴다
export const REFRESH_ENDPOINT = '/token-refresh'
```

한 곳에서만 쓰는 경로는 인라인 문자열로 둔다. 상수화가 오히려 추적을 어렵게 한다.

### 7. 쿼리 파라미터는 `params` 설정 객체로 보낸다

**쿼리스트링을 손으로 이어붙이지 않는다.** `?page=1&status=OPEN`을 템플릿 리터럴로 만들면
인코딩·배열·`undefined` 처리를 전부 직접 해야 하고 실수가 난다. axios의 `params`로 넘긴다.

```ts
// GOOD - 인자는 객체로 받고(07-javascript), 그대로 params에 넘긴다
export const getOrders = async (params: OrderListParams = {}): Promise<Order[]> => {
  const { data } = await api.get<Order[]>('/dashboard/orders', { params })
  return data
}

// BAD - 손으로 쿼리스트링 조립
const { data } = await api.get<Order[]>(`/dashboard/orders?page=${page}&status=${status}`)
```

- **직렬화는 인스턴스가 소유한다.** `apiClient.ts`의 `paramsSerializer`가 `qs`로 배열을
  `?state=A&state=B`(repeat) 형태로 만든다. axios 기본값(`state[]=A`)은 백엔드가 못 받는
  경우가 많다. 개별 요청에서 직렬화 방식을 다시 정하지 않는다.
- **`undefined` 값은 axios가 알아서 뺀다.** `{ page, status }`에서 `status`가 `undefined`면
  쿼리스트링에 안 붙는다. 그래서 옵셔널 파라미터를 조건부로 조립할 필요가 없다.
- **파라미터 타입은 `types/`에 둔다** (`OrderListParams` — [05-types](./05-types.md)), 그리고
  파라미터가 붙는 조회는 `queryOptions`를 함수로 감싸 **queryKey 마지막에 그 객체를 넣는다**
  ([04-state](./04-state.md) Query Key 규칙).

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

### 네트워크 단절·에러 토스트는 전역에서 (MUST)

**뮤테이션 실패 토스트를 훅마다 `onError`에 넣지 않는다.** `queryClient`의 `MutationCache`에
전역 `onError`를 한 번 걸어 모든 뮤테이션 실패를 처리한다. 오프라인(`isNetworkError`, status 0)은
`NETWORK_ERROR_MESSAGE`로, 그 외는 `ApiError.message`로 — 이 분기는 `shared/lib/notifyError.ts`
한 곳에만 있다.

```ts
// shared/lib/queryClient.ts - 전역 한 곳
mutationCache: new MutationCache({
  onError: (error, _variables, _context, mutation) => {
    if (mutation.meta?.skipGlobalErrorToast) return
    notifyError({ error })
  },
}),
queryCache: new QueryCache({
  onError: (error) => {
    notifyNetworkError({ error }) // 조회 화면은 ErrorBoundary가 담당, 오프라인만 덧붙인다
  },
}),
```

```ts
// 훅은 onError를 두지 않는다. 성공만 각자 처리한다.
useMutation({
  mutationFn: createOrder,
  onSuccess: () => {
    /* invalidate + 성공 토스트 */
  },
})
```

**폼처럼 토스트가 아니라 필드 에러로 보여야 하면 `meta`로 전역을 끄고 호출부에서 처리한다.**

```ts
// useLogin - 전역 토스트 건너뛰기
useMutation({ mutationFn: login, meta: { skipGlobalErrorToast: true }, onSuccess })

// LoginPage - 문구만 가져와 필드 에러로
onError: (error) => {
  setError('root', { message: getDisplayErrorMessage({ error }) })
}
```

**요청 전에 미리 막고 싶으면 `useOnlineStatus`로 UI를 잠근다.** 오프라인일 때 제출 버튼을
비활성화하거나 배너를 띄운다 — 타임아웃까지 기다리지 않고 즉시 피드백을 준다.
`navigator.onLine`을 컴포넌트마다 직접 읽지 않는다 — 구독을 훅이 소유한다 ([04-state](./04-state.md)).

```tsx
const isOnline = useOnlineStatus()
;<Button type="submit" disabled={isPending || !isOnline}>
  저장
</Button>
```

## MSW 목킹

새 엔드포인트를 만들면 `src/testing/mocks/handlers.ts`에 핸들러를 추가한다.
`VITE_ENABLE_MSW=true`면 개발 서버가 이걸 쓴다. 테스트는 `src/testing/mocks/server.ts`를 쓴다.

엔드포인트를 추가하고 핸들러를 안 만들면 테스트가 실제 네트워크를 때린다.

### 핸들러가 돌려주는 데이터 (SHOULD)

핸들러는 **서버가 실제로 줄 응답**을 흉내내는 것이다. 그 계약을 흐리지 않는다.

- **단일 진실 공급원.** 같은 데이터를 핸들러마다 따로 하드코딩하지 않는다. fixture 하나를
  두고 거기서 파생시킨다. 두 핸들러가 어긋나면 재현 안 되는 버그가 된다.
- **raw 값만 준다. label 변환은 하지 않는다.** 서버는 `'AVAILABLE'`을 주지 `'예약 가능'`을
  주지 않는다. 표시 문구 변환은 화면에서 한다.
- **enum은 상수에서 import한다.** 핸들러에 `'SUBSCRIPTION'` 같은 리터럴을 직접 박지 않는다.
- **없는 필드는 넣지 않는다.** optional 필드를 `undefined`로 명시하지 말고, 값이 있을 때만
  포함한다 — 서버 응답과 같은 모양이어야 한다.

UI 전용 텍스트(유의사항·안내문 등 서버가 주지 않는 것)는 핸들러나 응답 타입에 끼우지 않는다.
그건 상수다 (12-constants).

## 백엔드와 합의할 것 (착수 전 · MUST)

**API 계약은 코드를 짜기 전에 합의한다.** 아래가 불명확하면 응답 타입·핸들러·검증이 전부
추측이 되고, 서버 붙일 때 갈아엎는다. 합의 결과는 응답 타입과 상수(enum)에 반영한다.

- **응답 구조** — 성공/에러 각각의 envelope 모양. 에러 코드·메시지가 어디에 담기는지
  (`toApiError`가 파싱하는 `ServerErrorBody`와 맞춰야 한다).
- **날짜·타임존** — ISO 8601 문자열인지, UTC인지 KST인지. 클라는 ISO로 받아 보관하고 표시
  직전에만 포맷한다 ([07-javascript](./07-javascript.md) 날짜).
- **누락값 정책** — 값이 없을 때 **필드가 빠지는지 / `null`인지 / `''`인지.** 셋을 섞지 않도록
  합의하고 타입에 그대로 반영한다(옵셔널 `?` vs `| null`).
- **필수값·enum** — 어떤 필드가 필수인지, enum 허용값 목록. enum은 상수로 정의한다 (12-constants).
- **네이밍 컨벤션** — 필드 표기(camelCase 등), 불리언 flag 접두(`is~`/`has~` — [02-naming](./02-naming.md)).
- **페이징 방식** — offset/cursor 중 무엇인지, 페이지 크기, 총 개수 제공 여부. 무한스크롤이면
  cursor가 안전하다.
- **정렬** — 기본 정렬 기준과 순서(오름/내림)를 서버가 정하는지 클라가 정하는지. 목록 순서가
  기대와 맞는지 실제 데이터로 확인한다.
