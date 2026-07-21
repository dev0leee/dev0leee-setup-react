# 01. 폴더구조

## 지금 커뮤니티는 (2026-07 기준)

**feature 기반이 이겼고, 남은 논쟁은 "얼마나 규범적일 것인가"다.**

- **Feature-Sliced Design(FSD)**이 2026년의 이름 붙은 패러다임으로 자주 언급된다. 핵심 가치는 폴더 이름이 아니라 **레이어 간 의존이 한 방향으로만 흐른다**는 규칙이고, 그게 순환 의존을 구조적으로 막는다. 다만 layers/slices/segments라는 고유 어휘와 규범이 무겁다.
- **[Bulletproof React](https://github.com/alan2207/bulletproof-react)**(36K stars)는 덜 규범적인 대안이다. 대부분의 코드를 `features/` 아래 두고, 각 feature가 자기 슬라이스를 통째로 소유한다.
- **[Robin Wieruch](https://www.robinwieruch.de/react-folder-structure/)**의 2026 가이드가 요약하는 원칙은 **"Colocate first, extract later"** — 미리 구조를 파지 말고 같이 바뀌는 파일을 붙여두라는 것. 중첩은 2~3단계까지.
- 2026년의 실용적 흐름은 **점진적 채택**이다: FSD의 아이디어(단방향 의존)는 가져가되 전면 규범은 필요한 곳에만 적용한다.

**이 프로젝트는 그 절충점에 있다.** 폴더 구조는 Bulletproof React에 가깝고, **의존 방향 규칙은 FSD에서 가져왔다.** 아래 "의존 방향"이 이 문서에서 가장 중요한 규칙인 이유가 그것이다 — 폴더 이름은 취향이지만 의존 방향은 순환 참조를 막는 실제 장치다.

## 레이어

```
src/
├── main.tsx          # 진입점. Sentry init, MSW 부팅, StrictMode + App 마운트.
├── index.css         # Tailwind import + @theme 토큰 정의
├── app/              # 앱 조립 계층
├── api/              # HTTP 하부구조
├── features/         # 도메인 슬라이스
├── components/       # 도메인 무관 UI
├── config/           # 앱 설정
├── lib/              # 순수 유틸
├── mocks/            # MSW
└── test/             # 테스트 하부구조
```

### 의존 방향 (MUST)

```
lib · config · api  →  components  →  features  →  app
```

화살표 반대 방향 import는 금지다. 구체적으로:

- **`lib`, `config`은 아무것도 import하지 않는다.** 순수해야 한다.
- **`api/`는 `config`만 import한다.** feature를 모른다.
- **`components/`는 feature를 import하지 않는다.** feature를 아는 순간 공용이 아니다.
- **`features/`끼리 import하지 않는다.** 아래 "feature 간 의존" 참고.
- **`app/`은 전부 import할 수 있다.** 조립하는 게 일이다.

린터가 잡아주지 않으므로 리뷰에서 본다.

## 각 레이어가 소유하는 것

### `src/app/` — 앱 조립

앱을 "실행 가능한 하나"로 묶는 코드만. 도메인 로직 금지.

```
app/
├── App.tsx            # Provider 중첩. 순서가 의미를 가진다.
├── router.tsx         # 라우트 트리
├── queryClient.ts     # QueryClient 기본 옵션
├── AppLayout.tsx      # 인증된 사용자의 셸(헤더/사이드바/Outlet)
├── ProtectedRoute.tsx # 인증 가드
└── NotFoundPage.tsx   # 404
```

`App.tsx`의 Provider 순서는 이유가 있어서 그 순서다. 바꾸기 전에 주석을 읽는다.

### `src/api/` — HTTP 하부구조

**개별 엔드포인트 함수는 여기 두지 않는다.** 그건 feature 소유다.
여기는 "모든 요청이 공통으로 거치는 것"만 둔다.

```
api/
├── client.ts       # axios 인스턴스 + 인터셉터 (토큰 주입, 401 refresh)
├── errors.ts       # ApiError 클래스 + toApiError 정규화
├── tokenStore.ts   # 메모리 Access Token
└── authChannel.ts  # 탭 간 로그아웃 브로드캐스트
```

### `src/features/<feature>/` — 도메인 슬라이스

**하나의 기능이 필요한 모든 것을 이 폴더가 소유한다.** API, 타입, 상태, 컴포넌트, 페이지.

```
features/auth/
├── LoginPage.tsx      # 라우트가 가리키는 페이지
├── AuthProvider.tsx   # 이 feature가 앱에 제공하는 것
├── api.ts             # 이 도메인의 엔드포인트 함수 + queryOptions
├── types.ts           # 이 도메인의 타입
├── store.ts           # 이 도메인의 클라이언트 상태 (Zustand)
└── useLogout.ts       # 이 도메인의 훅
```

파일 수가 늘어나면 **그때** 하위 폴더로 쪼갠다. 처음부터 만들지 않는다:

```
features/dashboard/
├── DashboardPage.tsx
├── api.ts
├── types.ts
└── components/          # 파일이 4개를 넘어갈 때 생성
    ├── RevenueChart.tsx
    └── OrdersTable.tsx
```

> **SHOULD — 중첩은 2~3단계까지.** `features/a/components/b/parts/c/`가 나오면 구조가 틀린 것이다.
> 깊어지는 건 보통 "이건 사실 별개 feature다"라는 신호다.

### feature 간 의존 (MUST)

feature A가 feature B를 import하고 싶어지면 셋 중 하나다.

1. **사실 공용이다** → `components/common/` 또는 `lib/`으로 올린다.
2. **사실 하나의 feature다** → 합친다.
3. **진짜 관계가 필요하다** → 상위(`app/`)에서 조립해 props로 내린다.

```ts
// BAD - dashboard가 auth 내부를 안다
import { useAuthStore } from '@/features/auth/store'

// GOOD - 필요한 값을 props나 공용 훅으로 받는다
function DashboardPage({ userName }: { userName: string }) {}
```

> **예외:** `AuthProvider`처럼 앱 전역 인증 상태는 실질적으로 하부구조다.
> 현재 `app/ProtectedRoute.tsx`가 `features/auth`를 import하는 것은 `app` → `features` 방향이라 허용된다.

### `src/components/` — 도메인 무관 UI

```
components/
├── ui/       # shadcn CLI 생성물. 직접 수정 금지.
├── common/   # 우리가 만든 공용 컴포넌트 (FullPageSpinner 등)
└── errors/   # 에러 바운더리 · 폴백
```

`ui/`와 `common/`의 경계: **shadcn CLI가 만들었으면 `ui/`, 우리가 만들었으면 `common/`.**
`ui/` 컴포넌트를 커스터마이즈해야 하면 수정하지 말고 `common/`에 래퍼를 만든다.
(`.oxlintrc.json`이 `ui/**`의 린트 규칙을 꺼둔 이유가 이것이다 — 어차피 덮어써진다.)

### `src/lib/` vs `src/config/`

- **`lib/`** — 입력 → 출력이 전부인 순수 함수. 앱을 모른다. (`cn`)
- **`config/`** — 앱 설정값. 부팅 시 1회 평가된다. (`env`)

애매하면 `lib/`. `config/`는 작게 유지한다.

## 새 파일을 어디에 둘지

```
이 코드가 특정 도메인에 속하나?
├─ 예 → features/<도메인>/
└─ 아니오
   ├─ HTTP 공통 처리인가? → api/
   ├─ 렌더링되는 UI인가? → components/common/
   ├─ 순수 함수인가? → lib/
   ├─ 설정값인가? → config/
   └─ 앱 조립인가? → app/
```

## 안티패턴

| 하지 말 것              | 이유                                                             |
| ----------------------- | ---------------------------------------------------------------- |
| `src/utils/` 만들기     | 뭐든 들어가는 쓰레기통이 된다. `lib/` 또는 feature 안에 둔다.    |
| `src/types/` 만들기     | 타입은 쓰는 곳 옆에 있어야 한다. [05-types](./05-types.md) 참고. |
| `src/hooks/` 만들기     | 도메인 훅은 feature 안, 공용 훅은 `lib/`.                        |
| `src/constants/` 만들기 | [12-constants](./12-constants.md) 참고. 소유자 모듈 옆에 둔다.   |
| 미리 폴더 파두기        | 파일 1개짜리 폴더는 만들지 않는다. 2개가 되면 그때 만든다.       |
