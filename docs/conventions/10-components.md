# 10. 컴포넌트

## 지금 커뮤니티는 (2026-07 기준)

**props 설계의 기준선이 하나로 수렴한다: prop drilling은 컴포지션으로 푼다.**

가장 인용할 만한 한 줄은 이것이다 — _"Props that describe what a component does are fine to pass, but props that describe what its children do probably shouldn't exist."_
그리고 그 실천 규칙: **이 레벨에서 쓰지 않을 prop을 넘기고 있다면, prop 대신 children을 넘겨라.**

prop drilling의 실제 비용은 "귀찮음"이 아니라 **결합**이다. 중간 컴포넌트가 자기와 무관한 prop을 떠안게 되고, prop 하나가 바뀌면 경로 전체를 고쳐야 한다.

**Compound Components 패턴**이 그 대안으로 계속 언급된다 — 긴 prop 목록("prop soup") 대신 컴포넌트끼리 컨텍스트로 소통하게 만드는 방식이다. Base UI의 `Dialog.Root` / `Dialog.Trigger` / `Dialog.Content` 구조가 정확히 이 패턴이고, 이 프로젝트가 이미 그걸 쓰고 있다.

**stateful / presentational 분리**도 여전히 권장되지만, "모든 컴포넌트를 둘로 쪼개라"가 아니라 **테스트 가능성을 위해 로직 덩어리를 분리하라**는 뜻으로 쓰인다.

## 3계층

| 계층      | 위치                 | 도메인을 아나 | 수정 가능                    |
| --------- | -------------------- | ------------- | ---------------------------- |
| primitive | `components/ui/`     | 모름          | **아니오** (shadcn CLI 소유) |
| 공용      | `components/common/` | 모름          | 예                           |
| 도메인    | `features/<f>/`      | 앎            | 예                           |

**컴포넌트를 만들기 전에 이 표에서 어디에 속하는지 먼저 정한다.**
도메인을 아는 컴포넌트가 `components/`에 들어가면 그 폴더는 곧 쓰레기통이 된다.

### `components/ui/` — 손대지 않는다 (MUST)

shadcn CLI가 생성하고 갱신한다. 여기 있는 경고를 고치면 다음 `shadcn add` 때 되돌아온다.
(그래서 `.oxlintrc.json`이 이 경로의 규칙을 꺼뒀다.)

커스터마이즈가 필요하면:

```tsx
// components/common/SubmitButton.tsx
import { Button } from '@/components/ui/button'

export function SubmitButton({ isPending, children, ...props }: SubmitButtonProps) {
  return (
    <Button type="submit" disabled={isPending} {...props}>
      {isPending ? '처리 중...' : children}
    </Button>
  )
}
```

variant를 추가해야 한다면 그때는 `ui/button.tsx`의 `buttonVariants`를 수정할 수밖에 없다.
그럴 때는 **PR 설명에 "shadcn 업그레이드 시 재적용 필요"라고 남긴다.**

## 컴포넌트 작성 규칙

### 함수 선언 + named export (MUST)

```tsx
export function OrdersTable({ orders }: OrdersTableProps) {}
```

[06-react](./06-react.md), [09-imports](./09-imports.md) 참고.

### props 설계

**MUST — props는 필요한 것만 받는다.** 전체 객체를 넘기지 말고 쓰는 필드만 받는다.

```tsx
// BAD - user 전체를 받아놓고 name만 쓴다
function Greeting({ user }: { user: User }) {
  return <p>{user.name}님</p>
}

// GOOD
function Greeting({ name }: { name: string }) {
  return <p>{name}님</p>
}
```

필드가 4개를 넘어가면 객체로 받는 게 낫다. 그때는 그 객체가 곧 도메인 타입이다.

**MUST — 불리언 props를 3개 이상 만들지 않는다.** 조합 폭발이 생긴다.

```tsx
// BAD - 8가지 조합 중 몇 개는 말이 안 된다
<Alert isError isWarning isCompact />

// GOOD
<Alert variant="error" size="compact" />
```

**MUST — 이 레벨에서 쓰지 않는 prop을 넘기지 않는다. children을 넘긴다.**
prop drilling이 보이면 Context를 꺼내기 전에 컴포지션을 먼저 시도한다.

```tsx
// BAD - Layout은 user를 쓰지 않는데 Sidebar에 전달만 한다
function Layout({ user }: { user: User }) {
  return (
    <div>
      <Sidebar user={user} />
      <Outlet />
    </div>
  )
}

// GOOD - 쓰는 곳에서 조립해 넣는다
function Layout({ sidebar }: { sidebar: ReactNode }) {
  return (
    <div>
      {sidebar}
      <Outlet />
    </div>
  )
}
```

**SHOULD — 렌더 커스터마이즈는 children이나 compound 구조로.**
`renderHeader`, `renderFooter` 같은 함수 props를 남발하지 않는다.
prop이 대여섯 개로 불어나면 compound 패턴(`X.Root` / `X.Trigger` / `X.Content`)을 검토한다 — Base UI가 쓰는 방식이다.

### className을 받는다 (SHOULD)

재사용 컴포넌트는 `className`을 받아 `cn()`으로 병합한다. 바깥에서 배치를 조정할 수 있어야 한다.

```tsx
import { cn } from '@/lib/utils'

export function FullPageSpinner({ className }: { className?: string }) {
  return <div className={cn('flex min-h-dvh items-center justify-center', className)} />
}
```

`cn`은 `clsx` + `tailwind-merge`라 뒤에 온 클래스가 앞선 충돌 클래스를 이긴다.
문자열 템플릿으로 이어붙이면 이게 안 된다 — 반드시 `cn`을 쓴다.

### 나누는 기준

파일을 나누는 기준은 줄 수가 아니라 **관심사**다. 다음 중 하나면 나눈다:

- 다른 곳에서도 쓰인다
- 자기만의 상태·데이터 페칭을 가진다
- 독립적으로 테스트하고 싶다
- 조건부로 렌더/lazy 로드된다

**200줄이 넘는데 나눌 이유가 없으면 그냥 둔다.** 억지로 쪼갠 컴포넌트가 더 읽기 어렵다.

### 데이터 페칭 위치 (SHOULD)

**그 데이터를 실제로 쓰는 컴포넌트가 가져온다.**
페이지가 다 받아서 props로 내리지 않는다 ([08-routing](./08-routing.md)).

```tsx
// features/dashboard/RevenueChart.tsx
export function RevenueChart() {
  const { data } = useQuery(revenueQuery)
  return <LineChart data={data} />
}
```

Query 캐시가 중복 요청을 막아주므로 여러 컴포넌트가 같은 쿼리를 불러도 네트워크는 한 번이다.

## 접근성 (MUST)

Base UI primitive를 쓰면 포커스 트랩·키보드·ARIA가 대부분 따라온다. **직접 만들지 않는다.**

직접 만들 때 확인할 것:

- 클릭 가능한 것은 `<button>`이다. `<div onClick>`이 아니다.
- 모든 입력에 `<Label htmlFor>`가 연결돼 있다 (`LoginPage` 참고).
- 아이콘 전용 버튼에 `aria-label`이 있다.
- 색만으로 상태를 표현하지 않는다. 텍스트나 아이콘을 같이 쓴다.
- 포커스 링을 지우지 않는다. `focus-visible:` 스타일이 이미 `buttonVariants`에 있다.

## 에러 · 로딩

`queryClient`가 `throwOnError: true`라 **조회 에러 분기를 컴포넌트에 쓰지 않는다** ([04-state](./04-state.md)).

로딩은 상황에 따라:

| 상황          | 방법                                         |
| ------------- | -------------------------------------------- |
| 앱 부팅       | `FullPageSpinner` (`AuthProvider`가 이미 함) |
| 라우트 전환   | lazy 경계                                    |
| 컴포넌트 내부 | `isPending`으로 스켈레톤                     |
| 버튼 제출 중  | `disabled={isSubmitting}`                    |

## 테스트 (SHOULD)

`renderWithProviders`로 렌더하고, **역할·라벨·텍스트로 조회한다.**
클래스나 `data-slot`으로 잡으면 shadcn/Tailwind 업그레이드에 전부 깨진다 ([06-react](./06-react.md)).

```tsx
import { renderWithProviders, screen, userEvent } from '@/test/utils'

it('이메일 형식이 틀리면 에러를 보여준다', async () => {
  renderWithProviders(<LoginPage />)
  await userEvent.type(screen.getByLabelText('이메일'), 'not-an-email')
  await userEvent.click(screen.getByRole('button', { name: '로그인' }))
  expect(await screen.findByText('올바른 이메일을 입력하세요.')).toBeInTheDocument()
})
```

모든 컴포넌트에 테스트를 쓰지 않는다. **분기·계산·상호작용이 있는 것**에 쓴다.
