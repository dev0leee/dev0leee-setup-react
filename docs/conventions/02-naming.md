# 02. 네이밍

## 파일명 (MUST)

**파일이 무엇을 export하느냐가 파일명 규칙을 정한다.**

| 파일이 export하는 것     | 규칙                        | 예시                                                    |
| ------------------------ | --------------------------- | ------------------------------------------------------- |
| React 컴포넌트           | `PascalCase.tsx`            | `LoginPage.tsx`, `RevenueChart.tsx`, `AuthProvider.tsx` |
| 훅                       | `useCamelCase.ts`           | `useLogout.ts`                                          |
| 그 외 (함수/객체/클래스) | `camelCase.ts`              | `api.ts`, `store.ts`, `tokenStore.ts`, `queryClient.ts` |
| 테스트                   | 대상 파일명 + `.test.ts(x)` | `errors.test.ts`                                        |
| e2e                      | `kebab-case.spec.ts`        | `auth.spec.ts`                                          |

**예외: `src/shared/components/ui/**`는 `kebab-case.tsx`다.** shadcn CLI가 그렇게 만든다.
우리 규칙이 아니라 도구 규칙이니 맞추지 말고 그대로 둔다.

파일명은 **주 export와 정확히 일치**시킨다.
`LoginPage.tsx`는 `LoginPage`를 export한다. `login-page.tsx`도, `index.tsx`도 아니다.

> **왜 kebab-case가 아닌가:** 커뮤니티에는 kebab-case 파도 있지만, 이 레포는 이미
> PascalCase 컴포넌트 파일로 일관돼 있다. **일관성이 취향보다 중요하다.** 바꾸려면 전부 바꾼다.

## 폴더명 (MUST)

전부 `camelCase` 단수 또는 복수 소문자. 실제 사용례:

- 레이어 폴더는 복수형: `features/`, `components/`, `mocks/`
- feature 폴더는 도메인 단수형: `auth/`, `dashboard/`
- 하부구조는 그냥 이름: `api/`, `lib/`, `config/`, `test/`, `app/`

## 변수 · 함수

| 대상              | 규칙                                        | 예시                                |
| ----------------- | ------------------------------------------- | ----------------------------------- |
| 변수 · 함수       | `camelCase`                                 | `accessToken`, `refreshAccessToken` |
| 컴포넌트          | `PascalCase`                                | `LoginPage`                         |
| 훅                | `use` 접두                                  | `useAuthStore`, `useLogout`         |
| 불리언            | `is` / `has` / `can` / `should` 접두        | `isNetworkError`, `hasPermission`   |
| 상수 객체         | `SCREAMING_SNAKE` 또는 `camelCase as const` | `REFRESH_ENDPOINT`, `QUERY_KEYS`    |
| 타입 · 인터페이스 | `PascalCase`, 접두사 없음                   | `User`, `ApiError`, `LoginPayload`  |

> **MUST — 타입에 `I`/`T` 접두사를 붙이지 않는다.** `IUser`, `TUser` 금지. 그냥 `User`.

## 훅 이름과 도메인 (SHOULD)

**feature 안의 훅은 이름에 도메인을 넣지 않는다.** 폴더 위치가 이미 도메인을 말한다.

```ts
// GOOD - features/facility/hooks/useCoupon.ts
export const useCoupon = ({ facilityId }: { facilityId: string }) => { ... }

// BAD - 위치가 이미 facility인데 이름에 또 박는다
export const useFacilityCoupon = ...
```

**`shared/hooks/`의 훅은 도메인을 몰라야 하므로 이름에도 도메인이 없다.** 공용이라는 건
곧 도메인 무관이라는 뜻이다 — `useNativeBackButton`, `useDebounce`처럼 이름이 순수 기능이다.
훅 이름에 도메인을 넣고 싶어지면, 그건 `shared/`에 있으면 안 된다는 신호다
([01-folder-structure](./01-folder-structure.md)).

> 인자는 개수와 무관하게 객체로 받는다. `useCoupon({ facilityId })`처럼.
> 규칙은 [07-javascript](./07-javascript.md) "함수" 절에 있다.

## 도메인 어휘 (SHOULD)

같은 개념에 같은 단어를 쓴다. 이 레포의 어휘:

| 단어       | 뜻                                                                               |
| ---------- | -------------------------------------------------------------------------------- |
| `payload`  | 요청 body로 보내는 것 (`LoginPayload`)                                           |
| `response` | 서버가 준 것 (`RefreshResponse`, `SessionResponse`)                              |
| `status`   | 상태 머신의 현재 값 (`AuthStatus = 'booting' \| 'authenticated' \| 'anonymous'`) |
| `store`    | Zustand 스토어                                                                   |
| `client`   | 외부와 통신하는 인스턴스 (`api`, `refreshClient`, `queryClient`)                 |

새 단어를 만들기 전에 위에 있는지 본다.

## 함수 이름

**동사로 시작한다.** 무엇을 하는지가 이름에 있어야 한다.

```ts
// GOOD
export const login = async (payload: LoginPayload): Promise<SessionResponse> => { ... }
export const restoreSession = async (): Promise<SessionResponse> => { ... }
export const toApiError = ({ error }: { error: unknown }): ApiError => { ... }

// BAD
export const userLogin = async () => {} // 명사 시작
export const session = async () => {} // 무엇을 하는지 모름
export const apiError = () => {} // 만드는 건지 던지는 건지 모름
```

API 함수의 동사 관례:

| 동사       | 의미                |
| ---------- | ------------------- |
| `get~`     | 조회                |
| `create~`  | 생성                |
| `update~`  | 부분 수정           |
| `replace~` | 전체 교체           |
| `delete~`  | 삭제                |
| `to~`      | 변환 (`toApiError`) |

## 이벤트 핸들러

- **props로 받는 것**: `on` 접두 → `onSubmit`, `onClose`, `onSelect`
- **컴포넌트 내부 정의**: `handle` 접두 → `handleSubmit`, `handleRowClick`

```tsx
const OrdersTable = ({ onRowClick }: { onRowClick: (id: string) => void }) => {
  const handleRowClick = (order: Order) => {
    onRowClick(order.id)
  }
}
```

## Query Key

계층 구조를 배열로 표현한다. 넓은 것 → 좁은 것.

```ts
;[
  'dashboard',
] // 이 도메인 전체
[
  ('dashboard', 'revenue')
] // 특정 쿼리
[('dashboard', 'orders', { page })] // 파라미터가 붙은 쿼리
```

접두 매칭으로 한 번에 무효화할 수 있게 만드는 것이 목적이다.
자세한 건 [04-state](./04-state.md).

## 콜백 파라미터 (SHOULD)

**한 글자 약어를 쓰지 않는다.** `map`/`filter`/`find`의 콜백 인자에 무엇을 순회하는지 이름을 준다.

```ts
// GOOD
orders.filter((order) => order.id !== id)
notices.find((notice) => notice.noticeUuid === id)

// BAD
orders.filter((o) => o.id !== id)
notices.find((n) => n.noticeUuid === id)
```

`reduce`의 누산기도 `acc` 대신 뜻이 있는 이름(`sum`, `total`, `result`)을 쓴다.

## 금지

| 금지                                  | 대신                                                              |
| ------------------------------------- | ----------------------------------------------------------------- |
| `data`, `info`, `item`, `obj`, `temp` | 무엇인지 쓴다: `revenuePoints`, `order`                           |
| `handleClick2`, `newUser2`            | 이름을 다시 짓는다                                                |
| `utils.ts`에 아무거나                 | 기능별로 파일을 나눈다                                            |
| 한글 발음 영어 (`hoesu`, `geumaek`)   | 영어 단어 (`count`, `amount`)                                     |
| 축약 (`btn`, `usr`, `cfg`)            | 풀어쓴다 (`button`, `user`, `config`). `id`, `url`, `api`는 예외. |
