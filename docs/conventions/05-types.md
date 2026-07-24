# 05. 타입

## tsconfig가 이미 강제하는 것

`tsconfig.app.json`이 켜둔 옵션은 협상 대상이 아니다. 왜 켜져 있는지만 알아둔다.

| 옵션                                    | 의미                                        |
| --------------------------------------- | ------------------------------------------- |
| `strict`                                | 전부 켬                                     |
| `noUncheckedIndexedAccess`              | `arr[0]`의 타입이 `T \| undefined`          |
| `noUnusedLocals` / `noUnusedParameters` | 안 쓰는 것 남기면 빌드 실패                 |
| `verbatimModuleSyntax`                  | 타입 import는 `import type`으로 명시해야 함 |
| `erasableSyntaxOnly`                    | 런타임 코드를 생성하는 TS 문법 금지         |
| `noFallthroughCasesInSwitch`            | switch fall-through 금지                    |

### `erasableSyntaxOnly` 때문에 못 쓰는 것 (MUST)

```ts
// BAD - 전부 컴파일 에러
enum Role {
  Admin,
  User,
}
class ApiError {
  constructor(readonly status: number) {}
}
namespace Utils {}

// GOOD
const ROLE = { admin: 'admin', user: 'user' } as const
type Role = (typeof ROLE)[keyof typeof ROLE]

class ApiError extends Error {
  readonly status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}
```

`src/shared/lib/apiErrors.ts`에 이 이유가 주석으로 남아 있다.

### `noUncheckedIndexedAccess` 다루기

```ts
const first = orders[0] // Order | undefined
if (!first) return null
first.amount // OK

// 또는
const [first] = orders
if (first) {
  /* ... */
}
```

`orders[0]!`는 정말 확실할 때만. 대부분은 확실하지 않다.

배열에서 `undefined`를 걸러낼 때는 **type guard filter**로 타입까지 좁힌다. 조인·`find` 결과에서
자주 나온다.

```ts
// GOOD - filter가 T | undefined를 T로 좁힌다
const orders = ids
  .map((id) => orderMap.get(id))
  .filter((order): order is Order => order !== undefined)

// BAD - 걸러도 타입은 여전히 (Order | undefined)[]
const orders = ids.map((id) => orderMap.get(id)).filter((order) => order !== undefined)
```

## 타입을 어디에 두나 (MUST)

**선언한 타입은 예외 없이 `types/`에 둔다.** 로직 파일(컴포넌트·훅·api·스토어·lib) 안에서
`interface`/`type`을 선언하지 않는다. 그 파일 하나만 쓰더라도 타입은 `types/`에서 import한다.

| 타입                                              | 위치                        |
| ------------------------------------------------- | --------------------------- |
| 도메인 엔티티·모델 (`User`, `Order`)              | `features/<f>/types/`       |
| API 요청/응답 (`LoginPayload`, `SessionResponse`) | `features/<f>/types/`       |
| 컴포넌트 props (`OrdersTableProps`)               | 그 컴포넌트가 속한 `types/` |
| 모듈 내부 타입 (`AuthState`, `NativeWindow`)      | 그 모듈이 속한 `types/`     |
| 여러 feature가 공유                               | `shared/types/`             |

feature 것은 `features/<f>/types/`, shared 것은 `shared/types/`에 둔다.

```ts
// features/auth/types/auth.ts - 이 도메인의 타입을 전부 모은다
export interface User { ... }
export interface LoginPayload { ... }
export interface SessionResponse { ... }

// features/auth/api/auth.ts - 선언하지 않고 import해서 쓴다
import type { LoginPayload, SessionResponse } from '@/features/auth/types/auth'
```

### 예외 — 타입이 "정의 소스"를 따라갈 때 (MUST)

정의가 다른 곳에 있고 타입은 거기서 **파생만** 되면, `types/`로 옮기지 않고 소스 옆에 둔다.
소스를 `types/`로 거꾸로 import해서 파생시키는 게 더 나쁘기 때문이다.

| 파생 타입                            | 소스            | 타입 위치           |
| ------------------------------------ | --------------- | ------------------- |
| `z.infer<typeof schema>`             | zod 스키마      | `schemas/`          |
| `(typeof CONST)[keyof typeof CONST]` | `as const` 상수 | `constants/`        |
| shadcn 생성 타입 (`ChartConfig`)     | shadcn CLI      | `ui/` (손대지 않음) |

이 셋만 예외다. 그 밖의 모든 선언 타입은 `types/`로 간다.

## `interface` vs `type` (SHOULD)

- **객체 모양 → `interface`.** 이 레포의 기본값. (`User`, `LoginPayload`, `AuthState`)
- **유니온·튜플·매핑·조건부 → `type`.** interface로 표현 못 한다. (`AuthStatus`)

섞어 쓰지 말고 위 기준으로만 고른다.

## props 타입

**props 타입도 인라인으로 선언하지 않는다.** 명명한 인터페이스를 `types/`에 두고 import한다.

```tsx
// features/dashboard/types/ordersTable.ts
export interface OrdersTableProps {
  orders: Order[]
  onRowClick?: (id: string) => void
}

// features/dashboard/components/OrdersTable.tsx
import type { OrdersTableProps } from '@/features/dashboard/types/ordersTable'
const OrdersTable = ({ orders, onRowClick }: OrdersTableProps) => {}
```

`React.FC`는 쓰지 않는다. 매개변수에 props 타입을 붙인다 ([06-react](./06-react.md)).

기본 HTML 속성을 받으려면 확장한다:

```tsx
interface FieldProps extends React.ComponentProps<'input'> {
  label: string
}
```

Base UI 컴포넌트를 감쌀 때는 그 primitive의 Props를 확장한다 (`button.tsx` 참고):

```tsx
const Button = (props: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) => {}
```

## zod와 타입의 관계 (MUST)

**신뢰할 수 없는 입력에는 zod, 그 외에는 TS 타입.**

| 대상     | 방법                                                 |
| -------- | ---------------------------------------------------- |
| 환경변수 | zod (`config/env.ts`) — 부팅 시 검증                 |
| 폼 입력  | zod (`zodResolver`) — 사용자 입력                    |
| API 응답 | 기본은 TS 타입만. 백엔드 계약이 불안정한 구간만 zod. |

**타입은 스키마에서 파생시킨다. 손으로 두 번 쓰지 않는다.**

```ts
const schema = z.object({
  email: z.email('올바른 이메일을 입력하세요.'),
  password: z.string().min(8, '비밀번호는 8자 이상이어야 합니다.'),
})
type FormValues = z.infer<typeof schema> // 스키마가 유일한 진실
```

> **왜 모든 API 응답에 zod를 안 거는가:** 런타임 비용과 유지보수 비용이 든다.
> 백엔드가 스펙을 지키면 TS 타입으로 충분하다. 지키지 않는 게 확인된 엔드포인트만 방어한다.
> 전면 도입하려면 팀 논의가 먼저다.

zod 4를 쓴다. `z.string().email()`이 아니라 `z.email()`, 에러 출력은 `z.treeifyError()`다.

## `any` 대신

`typescript/no-explicit-any: error`. 예외는 `src/shared/components/ui/**`(shadcn 생성물)와 테스트뿐이다.

```ts
// BAD
const toApiError = ({ error }: { error: any }) => {}

// GOOD - unknown으로 받고 좁힌다
export const toApiError = ({ error }: { error: unknown }): ApiError => {
  if (error instanceof ApiError) return error
  if (axios.isAxiosError(error)) {
    /* ... */
  }
  if (error instanceof Error) return new ApiError(error.message, 0)
  return new ApiError('알 수 없는 오류가 발생했습니다.', 0)
}
```

## 타입 단언 (SHOULD)

`as`는 "타입체커보다 내가 더 잘 안다"는 선언이다. 대부분 틀렸다.

허용되는 경우:

- `as const` — 리터럴 고정. 권장.
- 외부에서 온 unknown 값을 좁힌 직후 (`error.response?.data as ServerErrorBody | undefined`)
- 라우터 `location.state`처럼 타입이 없는 API (`location.state as LocationState | null`)

`as unknown as T` 이중 단언은 금지다. 그 지점의 설계가 틀린 것이다.

**느슨한 인덱스 타입을 `as`로 때우지 않는다.** `Record<string, string>`이라 좁혀지지 않으면
`as`가 아니라 **타입을 제대로 잡는다** — `as const` 객체나 zod 스키마에서 `typeof`/`z.infer`로
파생시키면 단언이 필요 없다. JSX는 그냥 TS 표현식이라 템플릿이 타입을 못 좁히는 문제 자체가 없다.

## 제네릭 (SHOULD)

- **두 곳 이상에서 실제로 다른 타입으로 쓰일 때만** 제네릭을 만든다.
- 이름은 의미를 담는다: `TData`, `TPayload`. `T` 하나짜리는 정말 아무거나일 때만.
- 제약을 건다: `<T extends { id: string }>`.

한 번만 쓰이는 제네릭은 그냥 구체 타입으로 쓴다.
