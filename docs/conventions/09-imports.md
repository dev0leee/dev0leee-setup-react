# 09. import / export

import 순서와 멤버 정렬은 **사람이 지키지 않는다.** `pnpm format`이 고쳐준다.
이 문서는 도구가 못 잡는 나머지를 다룬다.

## MUST 규칙

### 1. 상대경로를 쓰지 않는다 — `@/` 절대경로만

oxlint `no-restricted-imports`가 에러로 잡는다.

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
없다. `.oxlintrc.json`의 override에서 이 규칙을 꺼둔다.

### 2. `import type`으로 타입을 가져온다

`verbatimModuleSyntax`가 켜져 있어서 값과 타입을 구분하지 않으면 런타임에 없는 모듈을
import하게 된다. oxlint `typescript/consistent-type-imports`가 잡는다.

```ts
// GOOD
import { clsx, type ClassValue } from 'clsx' // 값과 섞일 때는 인라인 type

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

`@ianvs/prettier-plugin-sort-imports`가 `pnpm format`에서 정리한다.

**그룹 순서** (그룹 사이 빈 줄 하나):

1. Node 빌트인 (`node:url`)
2. 외부 패키지 (`react`, `axios`, ...)
3. 내부 절대경로 (`@/...`)
4. 상대경로 (`./...` — e2e에서만 나온다)

```ts
import { fileURLToPath } from 'node:url'

import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'

import { api } from '@/api/client'
import { cn } from '@/lib/utils'
```

**멤버 정렬**은 플러그인이 알파벳순으로 맞추되 인라인 `type` 지정자를 뒤로 모은다
(`{ clsx, type ClassValue }`).

> oxlint의 `sort-imports`를 같이 켜면 안 된다. 그 규칙은 순수 알파벳순
> (`{ type ClassValue, clsx }`)을 요구해서 `format`과 `lint`가 서로를 무한히 되돌린다.
> 정렬의 소유자는 자동 수정이 되는 prettier 하나뿐이다.

## 함정

### `no-restricted-imports`의 글롭 패턴은 oxlint에서 동작하지 않는다

ESLint에서 쓰던 `"patterns": [".*"]`를 그대로 옮기면 **에러 없이 조용히 통과한다.**
설정은 파싱되지만 아무것도 매칭하지 않는다. `regex` 형태로 써야 한다.

```jsonc
// 동작 안 함 — 켜져 있는 줄 알지만 꺼져 있다
{ "patterns": [".*"] }
{ "patterns": ["./*", "../*"] }

// 동작함
{ "patterns": [{ "regex": "^\\.", "message": "상대경로 대신 '@/' 절대경로를 쓴다." }] }
```

이 규칙을 건드렸다면 `src/`에 상대경로 import가 든 파일을 하나 만들어 `pnpm lint`가
실제로 잡는지 확인하고 지운다.

### `import/order`는 oxlint에 없다

`Rule 'order' not found in plugin 'import'`로 설정 파싱 자체가 실패한다.
그래서 그룹 정렬을 prettier 플러그인에 맡긴 것이다.

### 문서의 GOOD/BAD 예시는 코드블럭을 나눈다

prettier는 마크다운 안의 ` ```ts ` 블럭도 포맷한다. GOOD과 BAD를 한 블럭에 넣으면
import가 전부 블럭 맨 위로 끌려올라가 대비 구조가 망가진다. 블럭을 두 개로 나눈다.

## 관련 문서

- [01-folder-structure](./01-folder-structure.md) — 레이어와 의존 방향
- [05-types](./05-types.md) — 타입 정의와 `import type`
