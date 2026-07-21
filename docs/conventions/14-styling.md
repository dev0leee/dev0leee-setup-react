# 14. 스타일링

Tailwind CSS 4 (CSS-first). **`tailwind.config.js`는 없다.** 설정은 전부 `src/index.css`에 있다.

## 지금 커뮤니티는 (2026-07 기준)

**Tailwind v4 + shadcn이 신규 React 프로젝트의 지배적 조합이다** (shadcn-ui/ui 119K stars). v4의 가장 큰 변화는 **CSS-first 설정** — `tailwind.config.js`가 사라지고 전부 CSS의 `@theme`으로 들어갔다.

**shadcn primitive에 `data-slot`이 붙는 것이 v4 시대의 규약이다.** 그리고 `components.json`의 `style` 값이 primitive 라이브러리(radix vs base)를 결정한다 — 이 프로젝트는 `base-nova`라 **Base UI** 기반이다.

**Radix → Base UI 이동이 실제로 일어나고 있다.** [@krisbogdanov](https://x.com/krisbogdanov/status/2079423595676062168): _"I've also been using Base UI outside of shadcn and it is indeed incredible! Been a fan of Tailwind's headlessUI since it's creation but now that it's not maintained as well anymore so I've slowly started moving all of my projects over it."_ 신규 블록/템플릿들도 "Tailwind CSS v4, Base UI" 조합으로 배포된다.

**대가도 함께 이야기된다.** [@ATechAjay](https://x.com/ATechAjay/status/2078077975598354869) (12 likes): _"R.I.P. your test suite after every shadcn/ui upgrade. R.I.P. your selectors after every Tailwind CSS v4 migration."_ → 그래서 **테스트 셀렉터를 클래스나 `data-slot`이 아니라 role/label로 잡는 규칙**이 있다 ([06-react](./06-react.md)).

## 계층

```
src/index.css
├── @import 'tailwindcss'          # Tailwind 본체
├── @import 'shadcn/tailwind.css'  # shadcn 프리셋
├── @custom-variant dark           # .dark 클래스 기반 다크모드
├── @theme inline { ... }          # 시맨틱 토큰 → Tailwind 유틸리티 매핑
└── :root / .dark { ... }          # 실제 색값 (oklch)
```

- **`:root` / `.dark`** — 원시 값. `--primary: oklch(0.205 0 0)`
- **`@theme inline`** — 그 값을 Tailwind 유틸리티로 노출. `--color-primary: var(--primary)` → `bg-primary`

색을 바꾸려면 `:root` / `.dark`의 값만 고친다. `@theme` 매핑은 건드릴 일이 거의 없다.

## 토큰만 쓴다 (MUST)

```tsx
// GOOD
<div className="bg-background text-foreground border-border" />
<p className="text-destructive" />

// BAD
<div className="bg-white text-black border-gray-200" />
<p className="text-red-500" />
<div style={{ color: '#ef4444' }} />
```

**하드코딩 색을 쓰면 다크모드가 깨진다.** 토큰은 `.dark`에서 자동으로 값이 바뀐다.

사용 가능한 시맨틱 토큰:

| 용도                 | 토큰                                 |
| -------------------- | ------------------------------------ |
| 페이지 배경/전경     | `background` / `foreground`          |
| 카드                 | `card` / `card-foreground`           |
| 팝오버               | `popover` / `popover-foreground`     |
| 주요 액션            | `primary` / `primary-foreground`     |
| 보조                 | `secondary` / `secondary-foreground` |
| 약한 강조            | `muted` / `muted-foreground`         |
| 강조                 | `accent` / `accent-foreground`       |
| 위험                 | `destructive`                        |
| 테두리/입력/포커스링 | `border` / `input` / `ring`          |
| 차트                 | `chart-1` ~ `chart-5`                |
| 사이드바             | `sidebar-*`                          |

### 새 토큰이 필요하면

1. `:root`와 `.dark` **양쪽에** `--my-token` 추가
2. `@theme inline`에 `--color-my-token: var(--my-token)` 추가
3. `bg-my-token`으로 사용

한쪽만 추가하면 다크모드에서 깨진다.

### 반경(radius)

`--radius` 하나에서 `--radius-sm` ~ `--radius-4xl`이 계산된다.
`rounded-lg`, `rounded-md`를 쓰고 `rounded-[10px]` 같은 임의값을 쓰지 않는다.

## `cn()`으로 병합한다 (MUST)

```tsx
import { cn } from '@/lib/utils'

function Row({ isActive, className }: RowProps) {
  return <div className={cn('flex items-center gap-2', isActive && 'bg-muted', className)} />
}
```

`cn` = `clsx` + `tailwind-merge`. **뒤에 온 클래스가 앞선 충돌 클래스를 이긴다.**

```tsx
// 문자열 이어붙이기는 충돌을 해결하지 못한다
<div className={`p-2 ${className}`} />        // BAD - className이 p-4여도 p-2가 남는다
<div className={cn('p-2', className)} />      // GOOD - p-4가 이긴다
```

조건부 클래스도 `cn` 안에서 처리한다. 삼항으로 문자열을 조립하지 않는다.

## variant는 CVA로 (MUST)

같은 컴포넌트가 여러 모양을 가지면 `class-variance-authority`를 쓴다.
`components/ui/button.tsx`가 기준 구현이다.

```tsx
const badgeVariants = cva('inline-flex items-center rounded-md px-2 py-0.5 text-xs', {
  variants: {
    variant: {
      default: 'bg-primary text-primary-foreground',
      outline: 'border border-border text-foreground',
      destructive: 'bg-destructive/10 text-destructive',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
})

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant, className }))} {...props} />
}
```

- **base 클래스는 첫 인자**, 변하는 부분만 `variants`에.
- **`defaultVariants`를 반드시 준다.** props 없이도 동작해야 한다.
- **타입은 `VariantProps<typeof xVariants>`로 파생**시킨다. 손으로 유니온을 쓰지 않는다.
- **불리언 variant를 만들지 않는다.** `isLarge` 대신 `size: 'lg'` ([10-components](./10-components.md)).

## data-slot과 상태 스타일링

shadcn 컴포넌트는 각 primitive에 `data-slot`을 붙인다. 부모에서 자식 상태에 반응할 때 쓴다.

```tsx
<ButtonPrimitive data-slot="button" className={cn(buttonVariants({ variant, size, className }))} />
```

상태는 **속성 셀렉터**로 잡는다. JS로 클래스를 토글하지 않는다.

```
disabled:opacity-50
aria-invalid:border-destructive
aria-expanded:bg-muted
focus-visible:ring-3
data-[state=open]:animate-in
```

`button.tsx`의 `has-data-[icon=inline-end]:pr-2` 같은 패턴도 같은 원리다.

> **MUST — 테스트에서 `data-slot`이나 클래스로 요소를 찾지 않는다.**
> role/label로 찾는다 ([06-react](./06-react.md)).

## 클래스 순서

`prettier-plugin-tailwindcss`가 자동 정렬한다. **손으로 정렬하지 않는다.**
`.prettierrc.json`의 `tailwindStylesheet: "./src/index.css"`가 커스텀 토큰까지 인식하게 해준다.

## 임의값 (SHOULD — 최소화)

```tsx
w-[137px]        // 왜 137인지 아무도 모른다
mt-[13px]        // 스케일을 벗어난다
```

스케일 안에서 해결한다: `w-32`, `mt-3`. 정말 필요하면 주석으로 이유를 남긴다.

`button.tsx`의 `rounded-[min(var(--radius-md),10px)]`처럼 **토큰을 참조하는 임의값**은 괜찮다.
하드코딩된 매직 넘버가 문제지 임의값 문법 자체가 문제는 아니다.

## 레이아웃

- **flex / grid를 쓴다.** `float`, `position: absolute`로 레이아웃을 짜지 않는다.
- **간격은 `gap`.** 자식에 `margin`을 붙여 간격을 만들지 않는다.
- **높이는 `min-h-dvh`.** `100vh`는 모바일 브라우저 주소창 때문에 틀린다. (`LoginPage`가 이미 `min-h-dvh`)

## 반응형 (SHOULD)

모바일 퍼스트. 접두사 없는 클래스가 모바일, `sm:` 이상이 데스크톱이다.

```tsx
<div className="flex flex-col gap-4 sm:flex-row sm:gap-6" />
```

`max-*` 브레이크포인트는 꼭 필요할 때만 쓴다. 섞이면 우선순위를 읽기 어렵다.

## 다크모드

`next-themes`가 `<html>`에 `.dark`를 붙인다. `@custom-variant dark (&:is(.dark *))`가 이걸 받는다.

- **토큰을 쓰면 다크모드는 자동이다.** `dark:` 접두사를 붙일 일이 거의 없다.
- `dark:`가 필요한 경우는 토큰으로 표현 안 되는 미세 조정뿐이다
  (`button.tsx`의 `dark:bg-input/30` 같은 것).
- **새 컴포넌트를 만들면 다크모드에서 한 번 눈으로 확인한다.**

## CSS 파일을 새로 만들지 않는다 (MUST)

- CSS Module, styled-components, 별도 `.css` 파일을 추가하지 않는다.
- 전역 스타일이 정말 필요하면 `src/index.css`에 추가한다.
- 애니메이션은 `tw-animate-css`가 이미 있다. keyframe을 직접 쓰기 전에 확인한다.
