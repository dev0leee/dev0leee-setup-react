# 12. 상수 관리

## 지금 커뮤니티는 (2026-07 기준)

**환경변수를 부팅 시점에 스키마로 검증하는 게 표준이 됐다.** [T3 Env](https://env.t3.gg/docs/introduction)가 그 패턴을 패키지로 만든 것이고, Vite도 지원한다. 핵심 가치는 하나다 — **필수 값이 없으면 시작 자체를 실패시켜서** "프로덕션에서 갑자기 undefined"를 없앤다.

이 프로젝트의 `src/config/env.ts`가 **이미 그 패턴을 직접 구현하고 있다** (zod 스키마 + `safeParse` + 실패 시 throw). 라이브러리를 추가할 필요는 없다. T3 Env가 추가로 주는 건 클라이언트/서버 접두사 분리 강제인데, 이 프로젝트는 SPA라 서버 시크릿 개념이 없다.

**시크릿 노출은 여전히 흔한 사고다.** r/developersIndia의 ["How do companies handle sensitive config in React apps without exposing keys"](https://www.reddit.com/r/developersIndia/comments/1usk15d/how_do_companies_handle_sensitive_config_in_react/) 같은 질문이 반복된다. 정답은 매번 같다: **브라우저로 내려가는 건 전부 공개다.** 빌드 타임 주입이든 런타임 `config.json`이든 마찬가지다. 시크릿은 서버에 둔다.

## 대원칙 (MUST)

**상수는 그것을 소유한 모듈 옆에 둔다.** `src/constants/` 폴더를 만들지 않는다.

전역 상수 파일은 처음엔 깔끔해 보이지만 곧 서로 무관한 값들의 창고가 되고,
"이 값을 누가 쓰나"를 추적할 수 없게 된다.

## 어디에 두나

```
이 값이 몇 곳에서 쓰이나?
├─ 1곳 → 인라인. 상수로 뽑지 않는다.
├─ 한 모듈 안 여러 곳 → 그 파일 최상단에 모듈 스코프 상수
├─ 한 feature 안 여러 파일 → features/<f>/constants.ts
└─ 앱 전역 → 그 개념을 소유한 모듈에서 export
```

실제 사례:

```ts
// src/api/client.ts - client.ts와 features/auth/api.ts 둘 다 쓴다
export const REFRESH_ENDPOINT = '/token-refresh'
```

`endpoints.ts`를 따로 만들지 않고, refresh 로직을 소유한 `client.ts`가 export한다.

## 한 번만 쓰는 값은 상수로 만들지 않는다 (SHOULD)

```ts
// 과잉
const LOGIN_ENDPOINT = '/login'
await api.post<SessionResponse>(LOGIN_ENDPOINT, payload)

// 충분
await api.post<SessionResponse>('/login', payload)
```

상수화의 목적은 **중복 제거와 의미 부여**지 "리터럴을 없애는 것"이 아니다.
`'/login'`은 이미 자기 의미를 다 말한다.

## 매직 넘버는 상수로 (MUST)

숫자가 **왜 그 값인지**를 이름이나 주석이 설명해야 한다.

```ts
// BAD
setTimeout(check, 300000)
if (retries < 2) {
}

// GOOD
const SESSION_CHECK_INTERVAL_MS = 300_000 // 5분
setTimeout(check, SESSION_CHECK_INTERVAL_MS)
```

**예외: 그 자리에서 뜻이 자명한 값.** 이 레포가 실제로 그렇게 쓴다:

```ts
timeout: 10_000 // refreshClient
timeout: 15_000 // api
staleTime: 60_000
```

`timeout: 15_000`은 이름이 없어도 뜻이 분명하다. `_` 구분자를 쓰는 게 규칙이다.
`0`, `1`, `-1`, `''`는 상수화하지 않는다.

## 유니온 상수 (MUST — `enum` 금지)

`erasableSyntaxOnly` 때문에 `enum`을 못 쓴다 ([05-types](./05-types.md)).

```ts
// 값 목록이 런타임에 필요하면
export const ORDER_STATUS = {
  pending: 'pending',
  shipped: 'shipped',
  delivered: 'delivered',
} as const

export type OrderStatus = (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS]

// 타입만 필요하면 - 대부분 이걸로 충분하다
export type AuthStatus = 'booting' | 'authenticated' | 'anonymous'
```

**타입만 필요한데 객체를 만들지 않는다.** `AuthStatus`가 유니온 타입인 이유가 이것이다.
반복(`Object.values`)이나 표시 라벨 매핑이 필요할 때만 `as const` 객체를 만든다.

## 표시 문자열

### UI 텍스트는 컴포넌트에 인라인으로 (SHOULD)

```tsx
<CardTitle>로그인</CardTitle>
<Label htmlFor="email">이메일</Label>
<Button type="submit">로그인</Button>
```

i18n을 도입하기 전까지 문자열 상수 파일을 만들지 않는다.
텍스트를 파일 두 개에 나눠 두면 화면을 읽고 고치기가 더 어려워진다.

> **i18n을 붙일 때가 오면** 그때 전체를 한 번에 전환한다. 미리 준비해서 반쪽만 상수화하지 않는다.

### 검증 메시지는 zod 스키마에 (MUST)

```ts
const schema = z.object({
  email: z.email('올바른 이메일을 입력하세요.'),
  password: z.string().min(8, '비밀번호는 8자 이상이어야 합니다.'),
})
```

규칙과 메시지가 붙어 있어야 규칙을 바꿀 때 메시지도 같이 고친다.

## 환경변수 (MUST)

**`import.meta.env`를 직접 읽지 않는다.** `@/config/env`의 `env`만 쓴다.

```ts
import { env } from '@/config/env'

const baseURL = env.VITE_API_URL // 타입 안전, 부팅 시 검증됨
```

### 새 환경변수를 추가할 때

1. `src/config/env.ts`의 zod 스키마에 필드 추가
2. `.env.example`에 예시 값 추가 (**반드시** — 다음 사람이 뭘 넣을지 알아야 한다)
3. `.env.development` / `.env.production`에 실제 값 추가
4. CI/배포 환경에 값 등록

스키마에만 추가하고 `.env.example`을 빼먹으면 다른 사람의 로컬이 부팅부터 실패한다.

### 규칙

- **MUST — `VITE_` 접두사가 붙은 값은 번들에 그대로 박힌다. 시크릿을 넣지 않는다.**
  (`env.ts` 주석에 이미 경고돼 있다.)
- **MUST — 옵셔널이 아니면 스키마에서 필수로 둔다.** 잘못된 env로 배포되는 사고를 부팅 시점에 터뜨린다.
- **SHOULD — 불리언은 `'true' | 'false'` enum + transform.** env는 항상 문자열이다.

```ts
VITE_ENABLE_MSW: z.enum(['true', 'false'])
  .default('false')
  .transform((v) => v === 'true')
```

## Query Key

키 문자열을 상수 파일에 모으지 않는다. `queryOptions`가 유일한 정의처다 ([04-state](./04-state.md)).

```ts
// BAD - queryKeys.ts에 모으기
export const QUERY_KEYS = { orders: ['dashboard', 'orders'] }

// GOOD - queryOptions가 키와 fetcher를 함께 소유
export const ordersQuery = queryOptions({
  queryKey: ['dashboard', 'orders'] as const,
  queryFn: fetchOrders,
})
```

## 요약

| 값                  | 위치                       |
| ------------------- | -------------------------- |
| 환경변수            | `config/env.ts` (zod 검증) |
| API 경로 (2곳 이상) | 소유 모듈에서 export       |
| API 경로 (1곳)      | 인라인                     |
| 타임아웃/간격       | 쓰는 파일 안, `_` 구분자   |
| 상태 유니온         | `features/<f>/types.ts`    |
| 검증 메시지         | zod 스키마                 |
| UI 텍스트           | 컴포넌트 인라인            |
| Query Key           | `queryOptions` 안          |
