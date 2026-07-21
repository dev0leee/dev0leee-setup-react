# 06. React 컨벤션

React 19. `jsx: "react-jsx"`라 **`import React`를 쓰지 않는다.**

## 컴포넌트 정의 (MUST)

**함수 선언문을 쓴다.** 화살표 함수 + `const` 조합은 쓰지 않는다.

```tsx
// GOOD
export function LoginPage() {}
function Button({ className, ...props }: ButtonProps) {}

// BAD
export const LoginPage = () => {}
const Button: React.FC<ButtonProps> = () => {}
```

이유: 호이스팅이 되어 파일 안에서 정의 순서에 덜 민감하고, 스택 트레이스에 이름이 남는다.
`React.FC`는 children을 암묵적으로 넣던 과거 유산이라 쓰지 않는다.

## useEffect (MUST — 가장 자주 틀리는 곳)

**useEffect는 "React 바깥 시스템과 동기화"할 때만 쓴다.** 그 외에는 전부 다른 도구가 있다.

| 하려는 것                 | 올바른 도구                      |
| ------------------------- | -------------------------------- |
| 서버 데이터 가져오기      | TanStack Query                   |
| props/state로부터 값 계산 | 렌더 중 계산                     |
| 이벤트에 반응             | 이벤트 핸들러                    |
| props 바뀌면 state 초기화 | `key` prop으로 컴포넌트 재마운트 |
| 비싼 계산 캐싱            | `useMemo`                        |

useEffect가 정당한 경우 (이 레포의 실제 사례):

```tsx
// AuthProvider - BroadcastChannel 구독 + 부팅 시 세션 복원
useEffect(() => {
  const unsubscribe = initAuthChannel(clearSession)
  void restore()
  return unsubscribe // 정리 함수를 반드시 반환
}, [clearSession, setAnonymous, setAuthenticated])
```

외부 시스템(BroadcastChannel, 타이머, 구독, DOM 이벤트)이 등장하면 정당하다.

> **MUST — 정리 함수를 반환한다.** 구독/타이머/리스너를 만들었으면 반드시 해제한다.
> StrictMode에서 effect가 두 번 도는 이유가 이걸 검증하기 위해서다.

> **MUST — `react/exhaustive-deps`가 `error`다.** 의존성 배열을 임의로 비우지 않는다.
> 배열을 채우기 싫어지면 effect가 필요 없다는 신호다.

## 파생 상태 금지

```tsx
// BAD
const [total, setTotal] = useState(0)
useEffect(() => {
  setTotal(orders.reduce((sum, o) => sum + o.amount, 0))
}, [orders])

// GOOD
const total = orders.reduce((sum, o) => sum + o.amount, 0)
```

느려지면 그때 `useMemo`. **재보지 않고 감으로 `useMemo`를 붙이지 않는다.**

## 조건부 렌더링

```tsx
// 이른 반환 - 전체 분기
if (status === 'booting') return <FullPageSpinner />
if (status === 'authenticated') return <Navigate to="/" replace />

// && - 있으면 보여줌
{
  errors.root && <p className="text-xs text-destructive">{errors.root.message}</p>
}

// 삼항 - 둘 중 하나
{
  isEditing ? <Form /> : <Detail />
}
```

> **MUST — 숫자에 `&&`를 쓰지 않는다.** `{count && <X />}`는 `count`가 0일 때 `0`을 렌더한다.
> `{count > 0 && <X />}`로 쓴다.

중첩 삼항은 금지. 이른 반환이나 별도 컴포넌트로 푼다.

## key

리스트 key는 **데이터의 안정적인 식별자**여야 한다.

```tsx
{
  orders.map((order) => <Row key={order.id} order={order} />)
} // GOOD
{
  orders.map((order, i) => <Row key={i} order={order} />)
} // BAD
```

정렬/필터/삽입이 일어나면 인덱스 key는 상태를 엉뚱한 행에 남긴다.

**의도적인 재마운트에도 key를 쓴다:**

```tsx
<EditForm key={selectedId} initial={selected} /> // id가 바뀌면 폼이 초기화된다
```

## ref

React 19는 `ref`를 일반 prop으로 받는다. **`forwardRef`를 새로 쓰지 않는다.**

```tsx
function Input({ ref, ...props }: React.ComponentProps<'input'>) {
  return <input ref={ref} {...props} />
}
```

## Context

**전역 상태 도구로 쓰지 않는다.** Context 값이 바뀌면 구독자 전체가 리렌더된다.

- 서버 데이터 → Query
- 전역 클라이언트 상태 → Zustand
- Context → Provider가 주입하는 "거의 안 바뀌는 것" (테마, i18n 등)

Context를 쓴다면 value를 `useMemo`로 감싼다. 안 그러면 매 렌더 새 객체가 내려간다.

## 성능 (SHOULD — 측정 먼저)

React 19 + React Compiler가 아직 이 프로젝트에 켜져 있지 않다.
그래도 순서는 같다: **측정 → 원인 파악 → 최소한의 수정.**

붙이기 전에 확인할 것:

1. 리스트 key가 안정적인가
2. Zustand를 셀렉터로 구독하고 있는가 ([04-state](./04-state.md))
3. Context value가 매 렌더 새로 만들어지는가
4. 무거운 컴포넌트가 라우트 단위로 분리돼 있는가 ([08-routing](./08-routing.md))

이걸 다 확인한 뒤에도 느리면 `useMemo` / `useCallback` / `memo`를 쓴다.
`useCallback`은 **의존성으로 쓰이는 함수**에 붙일 때 실효가 있다
(`AuthProvider.clearSession`이 effect 의존성이라 붙어 있는 것).

## Suspense

`throwOnError: true` + ErrorBoundary 조합이 이미 에러를 담당한다.
로딩은 라우트 lazy 경계와 `useQuery`의 `isPending`으로 처리한다.
`useSuspenseQuery`로 전환하려면 폴백 설계가 먼저다. 개별 판단으로 섞지 않는다.

## StrictMode

`main.tsx`에서 켜져 있다. **effect가 두 번 도는 건 버그가 아니라 검사다.**
두 번 돌아서 깨지면 정리 함수가 없거나 effect가 멱등하지 않은 것이다. StrictMode를 끄지 않는다.

## 테스트에서의 컴포넌트 (MUST)

`renderWithProviders`(`src/test/utils.tsx`)를 쓴다. Query·Router 컨텍스트가 붙는다.

**셀렉터는 role/label/text로 잡는다. 클래스명이나 `data-slot`으로 잡지 않는다.**

```tsx
// GOOD
screen.getByRole('button', { name: '로그인' })
screen.getByLabelText('이메일')

// BAD - shadcn 업그레이드 한 번에 전부 깨진다
container.querySelector('.bg-primary')
```

이건 실제로 사람들이 겪는 일이다
([@ATechAjay](https://x.com/ATechAjay/status/2078077975598354869)):
_"R.I.P. your test suite after every shadcn/ui upgrade. R.I.P. your selectors after every
Tailwind CSS v4 migration."_
