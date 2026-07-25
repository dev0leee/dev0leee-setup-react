# 14. 스타일링

Tailwind CSS 4 (CSS-first `@theme`) + shadcn `base-nova` 토큰 + CVA. 폰트는 Geist.
`src/shared/components/ui/**`는 shadcn 생성물이라 이 규칙의 예외다 — 손대지 않는다.

## 컬러 (MUST)

**하드코딩 hex를 쓰지 않는다. 시맨틱 토큰 클래스만 쓴다.** `src/index.css`의 `@theme`이
`--color-primary` / `--color-destructive` / `--color-muted` … 를 정의하고, 다크 테마 값도 함께 가진다.

```tsx
// GOOD
<span className="bg-primary text-primary-foreground" />
<p className="text-destructive" />
<div className="bg-muted" />

// BAD
<span className="bg-[#12b669] text-[#ecfdf3]" />
<div className="bg-black/50" />
```

하드코딩 hex를 뿌리면 **다크모드에서 전부 깨진다.** `next-themes`가 이미 테마를 토글하므로,
색은 반드시 토큰을 거쳐야 라이트/다크가 같이 따라온다.

### 토큰은 원시 → 시맨틱 2계층으로 (SHOULD)

**팔레트가 늘어나면 색을 두 층으로 나눈다.** 1층은 원시 팔레트(색 그 자체), 2층은 시맨틱
토큰(그 색의 용도). **컴포넌트는 2층만 쓴다.**

```css
/* 1층 - 원시 팔레트. 이름이 "무슨 색"이다. @theme 밖(:root)에 둔다. */
:root {
  --green-500: #12b669;
  --green-50: #ecfdf3;
}

/* 2층 - 시맨틱. 이름이 "무슨 용도"다. @theme 안에 둔다. 컴포넌트는 이것만 쓴다. */
@theme {
  --color-primary: var(--green-500);
  --color-primary-foreground: var(--green-50);
}
```

```tsx
// GOOD - 용도 이름
<span className="bg-primary" />

// BAD - 원시 팔레트를 컴포넌트가 직접 쓴다
<span className="bg-green-500" />
```

이렇게 나누면 **리브랜딩은 1층만 갈아끼우면 끝나고, 다크 테마는 2층에서만 갈린다.**
컴포넌트는 어느 쪽도 모른다. 한 층으로 두면 "브랜드 색을 바꿔주세요"가 전체 컴포넌트 수정이 된다.

**1층을 `@theme` 밖에 두는 것이 규칙의 강제 장치다.** Tailwind 4는 `@theme` 안의 `--color-*`
변수마다 유틸리티 클래스를 만든다. 원시 팔레트를 `@theme` 안에 넣으면 `bg-green-500` 클래스가
생겨 컴포넌트가 쓸 수 있게 되지만, `:root`에 두면 그 클래스 자체가 생성되지 않아 위 BAD가
물리적으로 불가능해진다. (Tailwind 기본 팔레트의 `bg-green-500`은 여전히 존재한다 — 그건
맨 위의 "시맨틱 토큰 클래스만 쓴다" MUST가 막는다.)

> 지금은 토큰이 몇 개뿐이라 1층을 따로 두는 게 과하다. **팔레트가 늘어나기 시작하면** 나눈다.

## 타이포 (SHOULD)

**`text-[14px] font-semibold leading-[20px]` 같은 개별 유틸 조합을 쓰지 않는다.** 반복되는
타이포는 `@theme`에 토큰으로 정의하고 그 유틸만 쓴다.

```css
/* index.css — @theme */
--text-body-sm: 0.875rem;
--text-body-sm--line-height: 1.25rem;
--text-body-sm--font-weight: 600;
```

```tsx
// GOOD
<span className="text-body-sm" />

// BAD
<span className="text-[14px] font-semibold leading-[20px]" />
```

Tailwind 4 토큰은 IntelliSense가 이름을 잡아주므로 오타로 조용히 안 먹는 일이 없다.

## 간격 · 크기 (SHOULD)

**표준 유틸리티를 우선한다. 임의값(`[16px]`)은 표준에 없는 값일 때만 쓴다.** spacing 스케일은
표준 유틸로 거의 다 덮인다.

| 임의값 (지양) | 표준 유틸 |
| ------------- | --------- |
| `gap-[4px]`   | `gap-1`   |
| `gap-[8px]`   | `gap-2`   |
| `gap-[16px]`  | `gap-4`   |
| `p-[16px]`    | `p-4`     |
| `px-[12px]`   | `px-3`    |
| `h-[1px]`     | `h-px`    |
| `w-[48px]`    | `w-12`    |

Border radius도 같다: `rounded-[8px]` → `rounded-lg`, `rounded-[12px]` → `rounded-xl`,
`rounded-[16px]` → `rounded-2xl`.

## 변형 · 조건부 클래스 (MUST)

**클래스 분기를 마크업에 삼항/중첩 삼항으로 박지 않는다.** variant는 CVA로, 조합은 `cn()`으로.

- **CVA** (`class-variance-authority`)로 컴포넌트 variant를 정의한다. `shared/components/ui/button.tsx`가
  이미 이 패턴이다. 색·크기 조합을 손으로 만든 매핑 객체보다 낫다.
- **`cn()`** (`shared/utils/cn.ts` — clsx + tailwind-merge)으로 고정 클래스와 조건부 클래스를 합친다.
  백틱 문자열로 합치면 tailwind-merge를 못 타서 충돌 클래스(`p-4`와 `p-6`)가 같이 남는다.

```tsx
// GOOD - variant는 CVA
const badgeVariants = cva('rounded px-1', {
  variants: {
    tone: {
      info: 'bg-cyan-50 text-cyan-500',
      warning: 'bg-amber-500 text-primary-foreground',
      danger: 'bg-pink-50 text-pink-500',
    },
  },
  defaultVariants: { tone: 'info' },
})

// GOOD - 조건부 결합은 cn()
<div className={cn('flex flex-col gap-4 rounded-lg bg-card p-4', isActive && 'opacity-50')} />

// BAD - 마크업 안 중첩 삼항 / 백틱 결합
<div className={`... ${tone === 'info' ? 'bg-cyan-50' : tone === 'warning' ? 'bg-amber-500' : '...'}`} />
```

## 텍스트 오버플로·레이아웃 견고성 (MUST)

**짧은 더미가 아니라 실제로 긴 값을 넣어 레이아웃이 안 터지는지 확인한다.** 사용자 이름·주소·
URL은 얼마든지 길어진다.

- **말줄임표.** 한 줄은 `truncate`, 여러 줄은 `line-clamp-2`처럼. flex/grid 안에서는 컨테이너에
  `min-w-0`이 없으면 `truncate`가 안 먹는다(자식이 안 줄어든다).
- **긴 단어·URL 줄바꿈.** 공백 없는 긴 문자열은 `break-words`(필요하면 `break-all`)로 컨테이너
  밖으로 삐져나가지 않게 한다.
- **최하단 여백.** 하단 고정 바(`BottomNavigation`)·모바일 safe-area가 마지막 콘텐츠를 가리지
  않게 스크롤 영역에 `padding-bottom`(또는 `pb-[env(safe-area-inset-bottom)]`)을 준다.

## 모션 (MUST)

**애니메이션에는 `prefers-reduced-motion`을 존중한다.** 전정기관 장애가 있는 사용자에게
큰 움직임·시차 효과는 실제로 어지럼증을 유발한다. OS 설정으로 "동작 줄이기"를 켠 사용자에게는
움직임을 없애거나 페이드로 대체한다.

Tailwind는 `motion-reduce:` variant를 기본 제공하므로 클래스 하나면 된다.

```tsx
// GOOD - 동작 줄이기를 켠 사용자에게는 트랜지션이 꺼진다
<div className="transition-transform duration-300 motion-reduce:transition-none" />

// GOOD - 움직임 대신 페이드만
<div className="animate-slide-up motion-reduce:animate-none" />
```

- **없애도 되는 움직임만 없앤다.** 로딩 스피너처럼 상태를 전달하는 애니메이션까지 끄면
  사용자가 진행 중인지 알 수 없다. 장식적 움직임(슬라이드·패럴랙스·바운스)이 대상이다.
- **JS 애니메이션도 같다.** `window.matchMedia('(prefers-reduced-motion: reduce)')`로 확인하고
  분기한다. CSS만 대응하고 JS 카운트업·스크롤 효과를 빼먹지 않는다.
