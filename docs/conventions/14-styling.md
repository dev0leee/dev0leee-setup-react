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
