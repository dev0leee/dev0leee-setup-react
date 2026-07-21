# 09. import / export 규칙

## 지금 커뮤니티는 (2026-07 기준)

**barrel 파일(`index.ts`)은 지난 몇 년 사이 "베스트 프랙티스"에서 "안티패턴"으로 뒤집혔고, 2026년에 다시 반론이 나오는 중이다.** 이 문서의 규칙은 그 양쪽을 읽고 정한 것이다.

**반대 진영 — 측정된 수치가 있다.** TkDodo의 [Please Stop Using Barrel Files](https://tkdodo.eu/blog/please-stop-using-barrel-files)는 실제 Next.js 프로젝트에서 내부 barrel을 걷어내자 모듈이 **11k → 약 3.5k (68% 감소)**, 개발 서버 시작이 5~10초에서 6초 미만으로 줄었다고 보고한다. barrel에서 import하면 JS가 재export된 모듈을 **전부 동기적으로 로드**하기 때문이다. 저자가 인정하는 예외는 하나뿐이다: _"Barrels are necessary when you are writing a library."_

**찬성 진영 — 도구가 바뀌었다는 반론.** [Why I Prefer Barrel Files in 2026](https://codecompose.com/articles/why-i-prefer-barrel-files-in-2026/)은 **Vite·Turbopack·Rolldown·Rspack이 lazy module-graph walking을 쓰기 때문에** 위 성능 논거가 레거시 Webpack에만 해당한다고 반박한다. barrel의 진짜 가치는 폴더의 **공개 인터페이스**를 선언하는 것(TS에 이 기능이 없다)이고, AI 에이전트가 barrel 유지보수를 대신 해주면서 관리 비용도 사라졌다고 본다.

**실무자 절충안.** r/reactjs의 ["What's one React pattern you stopped using after working on larger projects?"](https://www.reddit.com/r/reactjs/comments/1uqqy52/whats_one_react_pattern_you_stopped_using_after/) 스레드에서 [u/samwanekeya](https://reddit.com/r/reactjs/comments/1uqqy52/comment/owbm5sw/) (35 upvotes): _"Barrel files. At this point I'll only recommend one to use them for type-only exports in TypeScript or public API entry points for grouped component packages."_

### 그래서 이 프로젝트의 결정 (MUST — barrel 만들지 않음)

**단, 이유는 성능이 아니다.** 우리는 Vite를 쓰므로 TkDodo가 측정한 68% 모듈 감소는 그대로 적용되지 않는다. 그 논거를 근거로 쓰면 틀린 말이 된다. 실제 이유는 양쪽이 **모두 인정하는** 것들이다:

1. **순환 참조.** 찬성 진영도 *"circular imports can still crash bundlers"*라고 인정한다. 폴더 안 모듈이 자기 폴더의 barrel을 import하면 순환이 생기고, 번들러 에러 메시지가 원인을 안 알려준다.
2. **추적성.** `import { login } from './api'`는 정의처가 한 번에 보인다. barrel을 거치면 한 단계 흐려진다.
3. **규모.** barrel의 이점(공개 인터페이스 선언)은 폴더가 많고 팀이 클 때 값어치가 생긴다. 이 프로젝트는 feature가 2개다. 아직 그 비용을 낼 이유가 없다.

**재검토 조건:** feature가 10개를 넘고 "이 feature의 공개 API가 뭐냐"가 실제로 애매해지면 그때 다시 논의한다. 그때도 `export *`가 아니라 **명시적 재export**만 쓴다.

```ts
// BAD - features/auth/index.ts
export * from './api'
export * from './store'
export * from './types'
```

파일에서 직접 가져온다: `import { login } from './api'`.

**현재 유일한 예외**는 `src/test/utils.tsx`다. 테스트가 testing-library를 한 곳에서만 import하게 하려는 **의도된 파사드**이고, 앱 번들에 들어가지 않는다.

---

## import 순서 (MUST)

**3그룹, 그룹 사이 빈 줄 하나.** Prettier는 import를 정렬하지 않으므로 사람이 지킨다.

```ts
// 1. 외부 패키지
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { z } from 'zod'

// 2. 절대 경로 (@/)
import { setAccessToken } from '@/api/tokenStore'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

// 3. 상대 경로 (./ ../)
import { login } from './api'
import { useAuthStore } from './store'
```

그룹 안에서는 알파벳순.

> **자동화 가능:** 이 순서는 `eslint-plugin-import`의 `import/order`나 `prettier-plugin-organize-imports`로 강제할 수 있다.
> 지금은 oxlint를 쓰고 있어 수동이다. 손으로 지키는 게 반복적으로 어긋나면 그때 도구를 붙인다.

### 타입 전용 import

`verbatimModuleSyntax`가 켜져 있어 타입 import는 명시해야 한다.

```ts
import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'

import type { User } from './types'
```

값과 타입을 같이 가져올 때는 인라인 `type`, 타입만 가져올 때는 `import type` 문.

## 경로 규칙 (MUST)

| 상황                  | 방식           |
| --------------------- | -------------- |
| 같은 feature 안       | 상대 경로 `./` |
| 다른 레이어           | 절대 경로 `@/` |
| 상위로 올라가기 `../` | 금지           |

```ts
import { login } from './api' // 같은 feature - 상대
import { Button } from '@/components/ui/button' // 다른 레이어 - 절대

import { x } from '../dashboard/api' // BAD - 다른 feature 침범
import { cn } from '../../lib/utils' // BAD - ../ 금지
```

`../`가 나오면 둘 중 하나다: 절대 경로를 써야 하거나, 파일 위치가 틀렸다.

`@/`는 `src/`를 가리킨다. **`tsconfig.app.json`의 `paths`와 `vite.config.ts`의 `resolve.alias`
둘 다에 정의돼 있다. 하나만 고치면 타입은 통과하는데 빌드가 깨진다.**

## export 규칙 (MUST)

### named export만 쓴다

```ts
// GOOD
export function LoginPage() {}
export { Button, buttonVariants }

// BAD
export default function LoginPage() {}
```

- 이름이 강제되어 import할 때마다 달라지지 않는다
- rename·find-references가 정확하게 동작한다
- 라우터 `lazy`가 named export를 구조분해로 꺼내 쓴다 ([08-routing](./08-routing.md))

예외는 도구가 default를 요구하는 설정 파일뿐이다 (`vite.config.ts`, `playwright.config.ts`).

### 한 파일에서만 쓰는 것은 export하지 않는다

export는 계약이다. `features/auth/api.ts`의 `SessionResponse`가 미export인 이유가 이것이다.

### 컴포넌트 파일은 컴포넌트만 export한다

`react/only-export-components`가 경고한다. HMR이 깨지기 때문이다.
상수 export는 허용된다(`allowConstantExport: true`) — `button.tsx`의 `buttonVariants`가 그 경우다.

## 사이드이펙트 import

```ts
import './index.css'
```

허용된다(`import/no-unassigned-import: off`). CSS·폰트 외에는 만들지 않는다.

## 순환 참조 (MUST — 금지)

`A → B → A`는 런타임에 `undefined`를 만들고, 증상이 import 순서에 따라 달라져 디버깅이 최악이다.
barrel을 안 쓰는 첫 번째 이유이자, 레이어 의존 방향이 있는 이유다 ([01-folder-structure](./01-folder-structure.md)).

## 체크리스트

- [ ] 외부 → `@/` → 상대, 그룹 사이 빈 줄
- [ ] 그룹 안 알파벳순
- [ ] 타입은 `import type` 또는 인라인 `type`
- [ ] `../` 없음
- [ ] 다른 feature를 import하지 않음
- [ ] default export 없음
- [ ] `index.ts` 만들지 않음
