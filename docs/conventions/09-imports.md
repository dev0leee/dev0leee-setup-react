# 09. import / export

import 순서와 멤버 정렬은 **사람이 지키지 않는다.** `pnpm lint:fix`가 고쳐준다.
이 문서는 도구가 못 잡는 나머지를 다룬다.

## MUST 규칙

### 1. 상대경로를 쓰지 않는다 — `@/` 절대경로만

ESLint `no-restricted-imports`가 에러로 잡는다.

```ts
// GOOD
import { login } from '@/features/auth/api'
import { useAuthStore } from '@/features/auth/store'
```

```ts
// BAD
import { api } from '../../api/client'
import { login } from './api'
```

같은 폴더 안이라도 예외가 없다. 이유는 파일을 옮길 때 드러난다 — `./api`는 폴더가 바뀌면
조용히 다른 파일을 가리키거나 깨지지만, `@/features/auth/api`는 옮겨도 그대로거나
확실하게 깨진다. 그리고 import만 보고 그 모듈이 어느 레이어 것인지 알 수 있다.

**유일한 예외는 `e2e/`다.** e2e는 `tsconfig.e2e.json`을 쓰는 별도 프로젝트라 `@/` alias가
없다. `eslint.config.js`의 override에서 이 규칙을 꺼둔다.

### 2. `import type`으로 타입을 가져온다

`verbatimModuleSyntax`가 켜져 있어서 값과 타입을 구분하지 않으면 런타임에 없는 모듈을
import하게 된다. `@typescript-eslint/consistent-type-imports`가 잡는다.

```ts
// GOOD
import { type ClassValue, clsx } from 'clsx' // 값과 섞일 때는 인라인 type

import type { User } from '@/features/auth/types'
```

### 3. `export let` 금지

`import/no-mutable-exports`. 내보낸 뒤 재할당하면 가져간 쪽은 그 변화를 못 본다.
바뀌는 값이 필요하면 스토어(Zustand)나 함수로 감싼다.

```ts
// BAD
export let currentUser = null

// GOOD
export const useAuthStore = create<AuthState>(...)
```

### 4. 빈 named 블럭 금지

`import/no-empty-named-blocks`. 리팩터링 찌꺼기다.

<!-- prettier-ignore -->
```ts
// BAD
import {} from '@/lib/utils'
```

### 5. AMD(`require` / `define`) 금지

`import/no-amd`. ESM만 쓴다.

## SHOULD 규칙

### 6. named export를 기본으로 한다

`src/` 전체에 default export가 하나도 없다. 이름이 하나로 고정돼야 검색·자동 import·
리네임이 정확해진다. `import/prefer-default-export`는 꺼져 있다.

```ts
// GOOD
export function LoginPage() {}

// BAD
export default function LoginPage() {}
```

코드 스플리팅도 default export를 요구하지 않는다. `src/app/router.tsx`의 `lazy` 라우트는
named export를 그대로 꺼내 쓴다.

```ts
lazy: async () => {
  const { DashboardPage } = await import('@/features/dashboard/DashboardPage')
  return { Component: DashboardPage }
}
```

예외는 `vite.config.ts`와 `playwright.config.ts`뿐이다. 두 도구가 default export를
요구하므로 어쩔 수 없다.

### 7. 사이드이펙트 import는 최소화하고 진입점에만 둔다

`import '@/index.css'`처럼 가져오는 것만으로 무언가 실행되는 import는 `src/main.tsx`
같은 진입점에서만 쓴다. 중간 모듈에 숨어 있으면 트리 셰이킹도, 실행 순서 추적도 안 된다.

## 자동으로 처리되는 것 — 신경 쓰지 말 것

`import/order`와 `sort-imports`가 담당한다. `pnpm lint:fix`가 전부 고쳐준다.

**그룹 순서** (그룹 사이 빈 줄 하나, 그룹 안은 알파벳 오름차순·대소문자 무시):

1. `builtin` — Node 빌트인 (`node:url`)
2. `external` — 외부 패키지 (`react`, `axios`, ...)
3. `internal` — `@/...` (`import/internal-regex`로 지정)
4. `parent` / `sibling` / `index` — 상대경로 (e2e에서만 나온다)

```ts
import { fileURLToPath } from 'node:url'

import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'

import { api } from '@/api/client'
import { cn } from '@/lib/utils'
```

**멤버 정렬**은 `sort-imports`가 순수 알파벳순으로 맞춘다. 인라인 `type` 지정자도
이름 기준으로 섞인다.

```ts
import { type ClassValue, clsx } from 'clsx'
```

> prettier는 import 순서에 관여하지 않는다. 정렬의 소유자는 ESLint 하나뿐이다.
> `@ianvs/prettier-plugin-sort-imports`를 다시 넣으면 안 된다 — 그 플러그인은
> `type` 지정자를 뒤로 모아서(`{ clsx, type ClassValue }`) `sort-imports`와
> 서로를 무한히 되돌린다.

## 함정

### `import/parsers`가 없으면 export 기반 규칙이 조용히 죽는다

`eslint-plugin-import`는 `.ts`/`.tsx`를 스스로 파싱하지 못한다. 파서를 알려주지 않으면
import한 모듈의 export 목록을 만들지 못하고, 거기에 의존하는 규칙이
**에러 없이 전부 통과한다.** `no-named-as-default-member`가 대표적이다.

```js
settings: {
  'import/parsers': { '@typescript-eslint/parser': ['.ts', '.tsx'] },
  'import/extensions': ['.ts', '.tsx', '.js', '.jsx'],
}
```

규칙을 추가했으면 일부러 위반하는 파일을 `src/`에 만들어 `pnpm lint`가 실제로 잡는지
확인하고 지운다. **설정이 파싱된다고 규칙이 동작하는 건 아니다.**

### 버전 조합이 좁다

| 조합                               | 결과                                                          |
| ---------------------------------- | ------------------------------------------------------------- |
| ESLint 10 + `eslint-plugin-import` | `import/order`가 크래시한다 (`getTokenOrCommentAfter` 제거됨) |
| TypeScript 7 + `typescript-eslint` | 파서가 모듈 로드 시점에 하드 에러로 죽는다                    |

그래서 이 프로젝트는 **ESLint 9 + TypeScript 6**에 고정돼 있다. 둘 중 하나를 올리려면
`eslint-plugin-import`의 ESLint 10 지원과 typescript-eslint의 TS 7 지원
([#10940](https://github.com/typescript-eslint/typescript-eslint/issues/10940))을 먼저 확인한다.

## 관련 문서

- [01-folder-structure](./01-folder-structure.md) — 레이어와 의존 방향
- [05-types](./05-types.md) — 타입 정의와 `import type`
