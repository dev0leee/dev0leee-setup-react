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
>
> **빈 문자열도 폴백하고 싶으면 조건을 드러낸다.** `??`는 `''`를 통과시킨다(널이 아니라서).
> 빈 문자열까지 기본값으로 바꾸려면 `name.trim() ? name : '이름 없음'`처럼 명시한다 —
> `name || '이름 없음'`은 `0`·`false`까지 삼켜 의도가 흐려진다.

## 숫자 리터럴

자릿수 구분자를 쓴다. 이 레포의 실제 사용례:

```ts
timeout: 10_000
staleTime: 60_000
```

> **MUST — 의미 있는 숫자는 이름을 주고 `constants/`에 둔다.** 도메인·설정 의미가 있는 값은
> 한 곳에서만 써도 상수로 뽑는다 ([12-constants](./12-constants.md)). 인라인 매직넘버를 남기지 않는다.
> (구조적 리터럴 — 배열 인덱스 `0`, `+ 1` 같은 건 상수가 아니다.)

```ts
// BAD - 10000이 무슨 값인지 안 보인다
getMileageList({ hours: queryString.hours ?? 10000 })

// GOOD - features/<f>/constants/ 또는 shared/constants/
export const MAX_HOURS = 10_000
getMileageList({ hours: queryString.hours ?? MAX_HOURS })
```

## 복잡한 조건에는 이름을 붙인다 (MUST)

**여러 항을 `&&`/`||`로 엮은 조건을 그 자리에 두지 않는다.** 의미를 담은 변수(또는 함수)로 빼서
읽는 사람이 조건의 "뜻"을 보게 한다. 매직넘버에 이름을 주는 것과 같은 이유다.

```ts
// BAD - 이 괄호 뭉치가 참이면 무슨 상황인지 읽어야 안다
if (user.age >= 19 && !user.isBlocked && user.emailVerified) {
  allowCheckout()
}

// GOOD - 조건에 이름이 있다
const canCheckout = user.age >= 19 && !user.isBlocked && user.emailVerified
if (canCheckout) {
  allowCheckout()
}
```

- **불리언 이름은 `is`/`has`/`can`/`should` 접두** ([02-naming](./02-naming.md)).
- **JSX 안의 조건도 마찬가지다.** `{a && b && c && <X />}`를 그대로 두지 말고 이름을 준 뒤
  `{canShowX && <X />}`로 렌더한다 ([06-react](./06-react.md) 조건부 렌더링).
- **재사용되거나 인자를 받으면 함수로.**

```ts
const isAdult = (user: User) => {
  return user.age >= 19
}
```

조건이 길수록 이름이 주는 이득이 크다. "이게 참이면 무슨 뜻인가"를 이름 한 번으로 끝낸다.

## 불변성 (MUST)

원본을 바꾸지 않는다. 특히 React state와 Query 캐시 데이터는 절대.

```ts
// GOOD
const next = [...orders, newOrder]
const sorted = orders.toSorted((orderA, orderB) => {
  return orderA.amount - orderB.amount
})
const updated = { ...order, amount: 100 }
const without = orders.filter((order) => {
  return order.id !== id
})
const { [couponId]: _removed, ...rest } = selectedCoupons // 키 제거

// BAD
orders.push(newOrder)
orders.sort(...)          // 원본을 바꾼다
order.amount = 100
delete selectedCoupons[couponId]
```

ES2023의 `toSorted` / `toReversed` / `toSpliced` / `with`를 쓸 수 있다. `sort`/`reverse` 대신 이것들을 쓴다.

> **MUST — `delete`로 키를 지우지 않는다.** 구조분해로 남길 것만 뽑아 새 객체를 만든다.
> React state에 `delete`를 쓰면 참조가 안 바뀌어 리렌더가 안 되는, 재현 어려운 버그가 된다.

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
export const login = async (payload: LoginPayload): Promise<SessionResponse> => {
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
  setAccessToken({ token: null })
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

- **MUST — 화살표 함수 + `const`로 쓴다.** 함수 선언문(`function foo() {}`)을 쓰지 않는다.
  컴포넌트·훅·유틸·API 함수 전부 통일한다. 화살표는 호이스팅되지 않으니 **정의가 사용보다 앞에**
  와야 한다 — 파일 안에서 헬퍼를 먼저, 그걸 쓰는 쪽을 뒤에 둔다. 유일한 예외는
  `src/shared/components/ui/**`(shadcn 생성물)다.
- **MUST — 화살표 함수 본문은 항상 중괄호 + `return`.** 암묵적 반환(`() => value`)을 쓰지 않는다.
  콜백도 예외가 아니다. (린트로 강제하려면 `arrow-body-style: ['error', 'always']` — 아직 켜지 않았다.
  켜는 순간 기존 코드 43곳이 걸리고 `--fix`가 전부 고친다.)
- **MUST — 인자는 개수와 무관하게 객체로 받는다.** 인자가 1개여도 객체로 감싼다.
  순서 의존 위치 인자를 만들지 않는다. 호출부에서 각 인자의 의미가 이름으로 드러나고,
  기본값 선언과 인자 추가가 자유롭다. (예외 없음 — 0개면 그냥 인자 없는 함수다.)
- **SHOULD — 불리언 인자를 만들지 않는다.** `doThing(true)`는 호출부에서 뜻을 모른다.
  옵션 객체나 별도 함수로 나눈다.
- **MUST — 파라미터를 재할당하지 않는다.** 지역 변수를 만든다.

```ts
// GOOD - 인자 1개여도 객체로
formatDate({ date })
getMileageList({ hours })

// BAD - 순서 의존 위치 인자
formatDate(date, '.', false)
```

```ts
// GOOD - 본문은 항상 중괄호 + return
export const getToday = () => {
  return startOfDay(new Date())
}
orders.filter((order) => {
  return order.id !== id
})

// BAD - 암묵적 반환
export const getToday = () => startOfDay(new Date())
orders.filter((order) => order.id !== id)
```

한 줄짜리를 여러 줄로 늘릴 때 diff가 본문에만 남고, 객체 리터럴을 반환할 때
`() => ({ ... })`처럼 괄호로 감싸야 하는 함정도 사라진다.

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

> **MUST — "현재 시각"은 상수가 아니라 함수로.** `const TODAY = new Date()`는 모듈 로드
> 시점에 고정된다. SPA는 탭을 며칠씩 열어두므로 자정을 넘기면 날짜가 어긋난다. 호출 시점에
> 계산한다.

```ts
// BAD - 모듈 로드 시점에 고정. 자정을 넘겨도 어제다.
const TODAY = startOfDay(new Date())

// GOOD
export const getToday = () => {
  return startOfDay(new Date())
}
```

## 포맷 함수

**MUST — 표시용 포맷 함수를 컴포넌트마다 다시 만들지 않는다.** 통화·숫자·날짜 포맷은
`shared/utils/`에 한 번 정의하고 import한다. 컴포넌트 안에서 `formatPrice`를 새로 만들거나
`toLocaleString()`을 직접 부르지 않는다.

컴포넌트마다 포맷이 갈리면(`1,000원` / `1000원` / `₩1,000`) 타입체커도 린터도 못 잡고 QA에서야 드러난다.

```ts
// GOOD - 유틸에서 가져온다
import { formatPrice } from '@/shared/utils/formatNumber'

// BAD - 컴포넌트 안에 로컬 정의 / 직접 toLocaleString
const formatPrice = (price: number) => {
  return `${price.toLocaleString()}원`
}
```
