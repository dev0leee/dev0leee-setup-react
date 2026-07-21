# 07. JavaScript 컨벤션

타깃은 ES2023, 모듈은 ESM. Node 24 / 최신 브라우저 기준이라 신문법을 편하게 쓴다.

## 포맷 (도구가 강제 — 손대지 않는다)

`.prettierrc.json`:

- 세미콜론 **없음**
- 홑따옴표
- 100칸
- trailing comma `all`

포맷 논쟁은 하지 않는다. `pnpm format`이 답이다.

## 선언

- **MUST — `var` 금지.**
- **SHOULD — 기본은 `const`.** 재할당이 필요할 때만 `let`.
- **MUST — `==` 대신 `===`.** (`eqeqeq: ["error", "smart"]` — `== null` 하나만 허용)

```ts
if (value == null) {
} // OK - null과 undefined를 동시에 검사
if (value == 0) {
} // 에러
```

## 옵셔널 · 기본값 (SHOULD)

```ts
// 옵셔널 체이닝
const status = error.response?.status ?? 0

// nullish 병합 - || 아님
const from = location.state?.from?.pathname ?? '/'

// nullish 할당
fallbackInflight ??= performRefresh(failedToken)
```

> **MUST — 기본값에 `||`를 쓰지 않는다.** `0`, `''`, `false`가 기본값으로 덮어써진다.
> `??`를 쓴다.

## 숫자 리터럴

자릿수 구분자를 쓴다. 이 레포의 실제 사용례:

```ts
timeout: 10_000
staleTime: 60_000
```

## 불변성 (MUST)

원본을 바꾸지 않는다. 특히 React state와 Query 캐시 데이터는 절대.

```ts
// GOOD
const next = [...orders, newOrder]
const sorted = orders.toSorted((a, b) => a.amount - b.amount)
const updated = { ...order, amount: 100 }
const without = orders.filter((o) => o.id !== id)

// BAD
orders.push(newOrder)
orders.sort(...)        // 원본을 바꾼다
order.amount = 100
```

ES2023의 `toSorted` / `toReversed` / `toSpliced` / `with`를 쓸 수 있다. `sort`/`reverse` 대신 이것들을 쓴다.

## 배열 다루기

```ts
orders.map(...)      // 변환
orders.filter(...)   // 선별
orders.find(...)     // 하나 찾기 - 결과는 T | undefined
orders.some(...)     // 하나라도
orders.every(...)    // 전부
orders.reduce(...)   // 접기 - 위 것들로 안 될 때만
```

`reduce`가 3줄을 넘어가면 for-of가 더 읽기 쉽다. 억지로 쓰지 않는다.

`noUncheckedIndexedAccess` 때문에 `find`와 인덱스 접근 결과는 항상 `| undefined`다.
좁히고 쓴다.

## 비동기 (MUST)

**`.then()` 체인을 쓰지 않는다. `async/await`을 쓴다.**

```ts
// GOOD
export async function login(payload: LoginPayload): Promise<SessionResponse> {
  const { data } = await api.post<SessionResponse>('/login', payload)
  return data
}
```

### 병렬로 돌 수 있는 건 병렬로

```ts
// BAD - 순차 실행
const user = await fetchUser()
const orders = await fetchOrders()

// GOOD
const [user, orders] = await Promise.all([fetchUser(), fetchOrders()])
```

일부 실패를 허용해야 하면 `Promise.allSettled`.

### floating promise에 `void`를 붙인다

의도적으로 기다리지 않는 Promise는 `void`로 표시한다. 이 레포가 이미 그렇게 쓴다.

```tsx
void navigate(from, { replace: true })
void restore()
void queryClient.invalidateQueries({ queryKey: ['dashboard'] })
```

`void`가 없으면 "await을 빠뜨린 건지 의도한 건지" 리뷰어가 알 수 없다.

### catch에서 삼키지 않는다

```ts
// BAD
try {
  await login(payload)
} catch {}

// GOOD - 상위로 던지거나
try {
  await restoreSession()
} catch {
  setAccessToken(null)
  setAnonymous() // 실패를 명시적인 상태로 전이시킨다
}
```

빈 catch는 그 자리에서 버그를 만든다. 최소한 상태 전이나 로깅이 있어야 한다.

## 에러

`throw`하는 것은 항상 `Error`의 인스턴스여야 한다. 문자열이나 객체를 던지지 않는다.

```ts
throw new Error('환경변수 설정이 잘못됐습니다. .env 파일을 확인하세요.')
throw new ApiError(message, status, code)
```

`catch (e)`의 `e`는 `unknown`이다. 좁혀서 쓴다 ([05-types](./05-types.md)의 `toApiError` 참고).

## console (MUST)

`no-console: ["warn", { allow: ["warn", "error"] }]`.

- `console.log` 금지. 디버깅용은 커밋 전에 지운다.
- `console.warn` / `console.error`만 허용.
- 프로덕션 에러는 Sentry로 보낸다.

예외로 `src/config/env.ts`는 규칙이 꺼져 있다 — 부팅 실패를 콘솔에 찍어야 하기 때문이다.

## 함수

- **SHOULD — 인자 3개를 넘으면 객체로 받는다.**
- **SHOULD — 불리언 인자를 만들지 않는다.** `doThing(true)`는 호출부에서 뜻을 모른다.
  옵션 객체나 별도 함수로 나눈다.
- **MUST — 파라미터를 재할당하지 않는다.** 지역 변수를 만든다.

## 모듈 부수효과

import만으로 무언가 실행되는 모듈은 최소화한다.
현재 정당한 예외는 `config/env.ts`(부팅 시 env 검증)와 `index.css` import 정도다.
새로 만들 때는 그 이유를 주석으로 남긴다.

## 날짜

`date-fns`를 쓴다. `Date`를 직접 조작하거나 문자열을 잘라 쓰지 않는다.

```ts
import { format, parseISO } from 'date-fns'
format(parseISO(order.createdAt), 'yyyy-MM-dd')
```

서버와 주고받는 형식은 ISO 8601 문자열이다 (`createdAt: string`).
표시 직전에만 포맷한다. 상태에는 ISO 문자열로 보관한다.
