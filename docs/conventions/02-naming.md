# 02. 네이밍

## 지금 커뮤니티는 (2026-07 기준)

**파일 네이밍에는 표준이 없다.** 지난번 이 문서는 "일관성이 취향보다 중요하다"며 PascalCase를 단정했는데, 실제로 커뮤니티가 뭘 쓰는지 확인하지 않고 쓴 것이었다. 확인한 결과는 이렇다.

- **React 공식 입장 없음.** React는 네이밍 가이드라인을 제공하지 않고 전적으로 팀에 맡긴다.
- **PascalCase 논거:** JSX가 컴포넌트를 PascalCase로 쓰도록 강제하므로, 파일명을 컴포넌트명과 맞추면 일관성이 생기고 HTML 엘리먼트와 구분된다.
- **kebab-case 논거:** **대소문자를 구분하지 않는 파일시스템**(macOS 기본, Windows)에서 이름 충돌과 git 대소문자 변경 사고를 막는다. 이건 취향이 아니라 실제 사고 방지 논거다.
- **가장 흔한 절충:** 폴더는 kebab-case, 컴포넌트 파일은 PascalCase.

**이 프로젝트는 그 절충안에 가깝다.** 다만 우리 폴더명은 단일 단어(`auth`, `dashboard`, `api`)라 kebab 여부가 아직 드러나지 않는다. 여러 단어 폴더가 생기면 kebab-case로 간다(`order-detail/`, `user-settings/`).

> **바꾸려면 전부 한 번에 바꾼다.** 두 방식이 섞인 레포가 어느 한쪽으로 통일된 레포보다 나쁘다.
> 지금은 PascalCase 컴포넌트 파일로 일관돼 있으므로 유지한다.

---

## 파일명 (MUST)

**파일이 무엇을 export하느냐가 파일명 규칙을 정한다.**

| 파일이 export하는 것     | 규칙                        | 예시                                                    |
| ------------------------ | --------------------------- | ------------------------------------------------------- |
| React 컴포넌트           | `PascalCase.tsx`            | `LoginPage.tsx`, `RevenueChart.tsx`, `AuthProvider.tsx` |
| 훅                       | `useCamelCase.ts`           | `useLogout.ts`                                          |
| 그 외 (함수/객체/클래스) | `camelCase.ts`              | `api.ts`, `store.ts`, `tokenStore.ts`, `queryClient.ts` |
| 테스트                   | 대상 파일명 + `.test.ts(x)` | `errors.test.ts`                                        |
| e2e                      | `kebab-case.spec.ts`        | `auth.spec.ts`                                          |

**예외: `src/components/ui/**`는 `kebab-case.tsx`다.** shadcn CLI가 그렇게 만든다.
우리 규칙이 아니라 도구 규칙이니 맞추지 말고 그대로 둔다.

파일명은 **주 export와 정확히 일치**시킨다.
`LoginPage.tsx`는 `LoginPage`를 export한다. `index.tsx`는 만들지 않는다 ([09-imports](./09-imports.md)).

### 폴더명 (MUST)

- 레이어 폴더는 복수형: `features/`, `components/`, `mocks/`
- feature 폴더는 도메인 단수형: `auth/`, `dashboard/`
- **여러 단어면 kebab-case**: `order-detail/`, `user-settings/`

## 변수 · 함수

| 대상              | 규칙                                        | 예시                                |
| ----------------- | ------------------------------------------- | ----------------------------------- |
| 변수 · 함수       | `camelCase`                                 | `accessToken`, `refreshAccessToken` |
| 컴포넌트          | `PascalCase`                                | `LoginPage`                         |
| 훅                | `use` 접두                                  | `useAuthStore`, `useLogout`         |
| 불리언            | `is` / `has` / `can` / `should` 접두        | `isNetworkError`, `hasPermission`   |
| 상수 객체         | `SCREAMING_SNAKE` 또는 `camelCase as const` | `REFRESH_ENDPOINT`, `ORDER_STATUS`  |
| 타입 · 인터페이스 | `PascalCase`, 접두사 없음                   | `User`, `ApiError`, `LoginPayload`  |

> **MUST — 타입에 `I`/`T` 접두사를 붙이지 않는다.**
> [Google TypeScript Style Guide](https://google.github.io/styleguide/tsguide.html)의 명시적 규칙이기도 하다:
> _"Do not prefix interfaces with I... By not using the I prefix, you emphasize the role and behavior
> of the interface rather than its type."_ `IUser`, `TUser` 금지. 그냥 `User`.

## 도메인 어휘 (SHOULD)

같은 개념에 같은 단어를 쓴다. 이 레포의 어휘:

| 단어       | 뜻                                                               |
| ---------- | ---------------------------------------------------------------- |
| `payload`  | 요청 body로 보내는 것 (`LoginPayload`)                           |
| `response` | 서버가 준 것 (`RefreshResponse`, `SessionResponse`)              |
| `status`   | 상태 머신의 현재 값 (`AuthStatus`)                               |
| `store`    | Zustand 스토어                                                   |
| `client`   | 외부와 통신하는 인스턴스 (`api`, `refreshClient`, `queryClient`) |

새 단어를 만들기 전에 위에 있는지 본다.

## 함수 이름

**동사로 시작한다.**

```ts
// GOOD
export async function login(payload: LoginPayload): Promise<SessionResponse>
export async function restoreSession(): Promise<SessionResponse>
export function toApiError(error: unknown): ApiError

// BAD
export async function userLogin() // 명사 시작
export async function session() // 무엇을 하는지 모름
```

API 함수의 동사 관례:

| 동사                  | 의미                |
| --------------------- | ------------------- |
| `get~` / `fetch~`     | 조회                |
| `create~`             | 생성                |
| `update~`             | 부분 수정           |
| `replace~`            | 전체 교체           |
| `delete~` / `remove~` | 삭제                |
| `to~`                 | 변환 (`toApiError`) |

## 이벤트 핸들러

- **props로 받는 것**: `on` 접두 → `onSubmit`, `onClose`, `onSelect`
- **컴포넌트 내부 정의**: `handle` 접두 → `handleSubmit`, `handleRowClick`

```tsx
function OrdersTable({ onRowClick }: { onRowClick: (id: string) => void }) {
  function handleRowClick(order: Order) {
    onRowClick(order.id)
  }
}
```

## Query Key

계층 구조를 배열로. 넓은 것 → 좁은 것.

```ts
const domain = ['dashboard'] as const // 이 도메인 전체
const revenue = ['dashboard', 'revenue'] as const // 특정 쿼리
const orders = ['dashboard', 'orders', { page }] as const // 파라미터가 붙은 쿼리
```

접두 매칭 무효화를 위해서다. 자세한 건 [04-state](./04-state.md).

## 금지

| 금지                                  | 대신                                    |
| ------------------------------------- | --------------------------------------- |
| `data`, `info`, `item`, `obj`, `temp` | 무엇인지 쓴다: `revenuePoints`, `order` |
| `handleClick2`, `newUser2`            | 이름을 다시 짓는다                      |
| 한글 발음 영어 (`hoesu`, `geumaek`)   | 영어 단어 (`count`, `amount`)           |
| 축약 (`btn`, `usr`, `cfg`)            | 풀어쓴다. `id`, `url`, `api`는 예외.    |
