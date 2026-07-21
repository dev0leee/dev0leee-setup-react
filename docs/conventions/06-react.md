# 06. React 컨벤션

React 19. `jsx: "react-jsx"`라 **`import React`를 쓰지 않는다.**

## 지금 커뮤니티는 (2026-07 기준)

**두 가지가 크게 바뀌었다.**

**1. `useEffect`는 기본 도구에서 탈출구로 강등됐다.** r/reactjs의 ["What's one React pattern you stopped using after working on larger projects?"](https://www.reddit.com/r/reactjs/comments/1uqqy52/whats_one_react_pattern_you_stopped_using_after/)(130pts, 95 댓글)에서 상위 답변이 전부 이 얘기다.
[u/Krispenedladdeh542](https://reddit.com/r/reactjs/comments/1uqqy52/comment/ow9z5cs/) (139 upvotes): _"I haven't stopped using it completely but I use the useEffect hook way less now at scale. When I first started it felt like I used an effect for everything."_
[u/FearIsHere](https://reddit.com/r/reactjs/comments/1uqqy52/comment/owa3nze/) (100 upvotes): _"[You Might Not Need an Effect] is one of the most useful reads I have done. Before that I used effects for pretty much anything, now barely at all."_

**2. React Compiler가 수동 메모이제이션의 위치를 바꿨다.** 2026년 가이드들의 표현은 일관된다 — `useMemo`/`useCallback`은 *"niche tools for specific library integrations rather than everyday optimization"*이고, 컴파일러가 켜진 프로젝트에서는 컴포넌트의 95%에서 걷어내라고 한다.

**단, 이 프로젝트에는 React Compiler가 아직 켜져 있지 않다.** 그러니 위 조언을 그대로 적용하면 안 된다.
대신 컴파일러가 켜져도 **여전히 수동 메모가 필요한 경우**를 알아두는 게 실용적이다:

- interior mutability를 쓰는 라이브러리 연동 — **react-hook-form의 `watch`가 대표 사례로 지목된다** (이 프로젝트가 RHF를 쓴다)
- `try/catch` 안의 `useMemo` — 컴파일러가 제어 흐름을 분석하지 못해 건너뛴다
- 컴파일러가 볼 수 없는 컴포넌트 경계 밖 참조 동일성

---

## 컴포넌트 정의 (MUST)

**함수 선언문을 쓴다.**

```tsx
// GOOD
export function LoginPage() {}
function Button({ className, ...props }: ButtonProps) {}

// BAD
export const LoginPage = () => {}
const Button: React.FC<ButtonProps> = () => {}
```

호이스팅되어 정의 순서에 덜 민감하고, 스택 트레이스에 이름이 남는다.
`React.FC`는 children을 암묵적으로 넣던 과거 유산이라 쓰지 않는다.

## useEffect (MUST — 가장 자주 틀리는 곳)

**"React 바깥 시스템과 동기화"할 때만 쓴다.**

| 하려는 것                 | 올바른 도구             |
| ------------------------- | ----------------------- |
| 서버 데이터 가져오기      | TanStack Query          |
| props/state로부터 값 계산 | 렌더 중 계산            |
| 이벤트에 반응             | 이벤트 핸들러           |
| props 바뀌면 state 초기화 | `key` prop으로 재마운트 |
| 비싼 계산 캐싱            | `useMemo` (측정 후)     |

정당한 경우 (이 레포의 실제 사례):

```tsx
// AuthProvider - BroadcastChannel 구독 + 부팅 시 세션 복원
useEffect(() => {
  const unsubscribe = initAuthChannel(clearSession)
  void restore()
  return unsubscribe // 정리 함수를 반드시 반환
}, [clearSession, setAnonymous, setAuthenticated])
```

외부 시스템(BroadcastChannel, 타이머, 구독, DOM 이벤트)이 등장하면 정당하다.

> **MUST — 정리 함수를 반환한다.** StrictMode에서 effect가 두 번 도는 이유가 이걸 검증하기 위해서다.

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

## 조건부 렌더링

```tsx
function Example() {
  // 이른 반환 - 전체 분기
  if (status === 'booting') return <FullPageSpinner />
  if (status === 'authenticated') return <Navigate to="/" replace />

  return (
    <>
      {/* && - 있으면 보여줌 */}
      {errors.root && <p className="text-xs text-destructive">{errors.root.message}</p>}

      {/* 삼항 - 둘 중 하나 */}
      {isEditing ? <Form /> : <Detail />}
    </>
  )
}
```

> **MUST — 숫자에 `&&`를 쓰지 않는다.** `{count && <X />}`는 `count`가 0일 때 `0`을 렌더한다.
> `{count > 0 && <X />}`로 쓴다.

중첩 삼항은 금지. 이른 반환이나 별도 컴포넌트로 푼다.

## key

리스트 key는 **데이터의 안정적인 식별자**여야 한다.

```tsx
// GOOD
const good = orders.map((order) => <Row key={order.id} order={order} />)

// BAD
const bad = orders.map((order, i) => <Row key={i} order={order} />)
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
- Context → Provider가 주입하는 "거의 안 바뀌는 것" (테마, i18n)

Context를 쓴다면 value를 `useMemo`로 감싼다.

## 성능 (SHOULD — 측정 먼저)

**순서: 측정 → 원인 파악 → 최소한의 수정.** 감으로 `useMemo`를 붙이지 않는다.

붙이기 전에 확인할 것:

1. 리스트 key가 안정적인가
2. Zustand를 셀렉터로 구독하고 있는가 ([04-state](./04-state.md))
3. Context value가 매 렌더 새로 만들어지는가
4. 무거운 컴포넌트가 라우트 단위로 분리돼 있는가 ([08-routing](./08-routing.md))

다 확인한 뒤에도 느리면 React DevTools Profiler로 재고 `useMemo` / `useCallback` / `memo`를 쓴다.
`useCallback`은 **의존성으로 쓰이는 함수**에 붙일 때 실효가 있다
(`AuthProvider.clearSession`이 effect 의존성이라 붙어 있는 것).

> **React Compiler를 켜게 되면** 위 훅들의 대부분은 제거 대상이 된다.
> 단 RHF의 `watch` 연동, `try/catch` 안의 메모는 남긴다(위 커뮤니티 항목 참고).
> 켜는 건 개인 판단이 아니라 팀 결정으로 한다.

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

실제로 사람들이 겪는 일이다
([@ATechAjay](https://x.com/ATechAjay/status/2078077975598354869)):
_"R.I.P. your test suite after every shadcn/ui upgrade. R.I.P. your selectors after every
Tailwind CSS v4 migration."_
