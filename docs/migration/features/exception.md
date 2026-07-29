# 도메인 명세 — 예외 화면 (exception)

> 기준 SHA `6d5bf22` · 레거시 `views/ExceptionView/` 4개 파일 149 LOC
> 타깃 위치: **`app/`** (도메인 없는 앱 레벨 화면) + `shared/components/errors/`

## 화면 목록

| #   | 경로              | name               | 컴포넌트                                 | 앱      | 인증                                     |
| --- | ----------------- | ------------------ | ---------------------------------------- | ------- | ---------------------------------------- |
| E1  | `/error`          | 에러               | `ErrorView.vue`                          | 메인    | `authOptional` (가드 우회)               |
| E2  | `/error-auth`     | 에러(로그인)       | `ErrorView.vue` (동일)                   | 메인    | `authOptional`, **`showBottomNav:true`** |
| E3  | `:pathMatch(.*)*` | 404페이지          | `NotFoundView.vue`                       | 메인    | `requiresAuth:false`                     |
| E4  | `error`           | 에러페이지         | `OpinionExternalErrorView.vue`           | opinion | 없음                                     |
| E5  | `:pathMatch(.*)*` | 404페이지          | `OpinionExternalNotFoundView.vue`        | opinion | 없음                                     |
| E6  | `` (루트)         | 의견 메인          | `OpinionExternalNotFoundView.vue` (동일) | opinion | 없음                                     |
| E7  | `/survey/list`    | 설문 리스트 (외부) | `OpinionExternalNotFoundView.vue` (동일) | opinion | 없음                                     |

> **E1·E2는 같은 컴포넌트를 다른 meta로 쓴다.** 차이는 `showBottomNav`뿐이다
> (E2는 인증 레이아웃 하위라 하단 네비가 보인다).
> **E5·E6·E7은 같은 컴포넌트다.** opinion 앱은 딥링크로만 진입하므로 루트와 설문 목록이 NotFound다
> (`decisions/inventory-questions.md` R-3).

전부 `showAppBar:false`. 상세는 `routes.md` §3-1, §4.

---

## E1 · E2. 에러 화면 (메인 앱)

### 화면 구성

```
┌─────────────────────────────┐
│ aptmantIntro.svg (상단 배경)  │  absolute left-0 top-0 w-full
│                             │
│      일시적인 오류가 발생했습니다  │  pretendard-18Bold
│      잠시 후 다시 시도해주세요    │
│      (메시지 에러코드 : 코드)     │  ← errorCode·message 있을 때만
│                             │
│      [ 메인으로 이동 ]         │  ← 로그인 상태에 따라 문구·목적지 변경
└─────────────────────────────┘
```

| 요소        | 클래스 (원문)                                                                                                             |
| ----------- | ------------------------------------------------------------------------------------------------------------------------- |
| 루트        | `relative flex h-full w-full flex-col items-center justify-center gap-8 bg-defaults-secondary-background-secondary px-10` |
| 배경 이미지 | `absolute left-0 top-0 w-full`                                                                                            |
| 본문 래퍼   | `z-10 space-y-10 text-center text-defaults-secondary-text-secondary`                                                      |
| 텍스트 그룹 | `z-20 flex flex-col items-center gap-3`                                                                                   |
| 제목        | `pretendard-18Bold`                                                                                                       |
| 버튼 래퍼   | `mx-auto flex w-fit justify-center`                                                                                       |
| 버튼        | `round-type="rounded"`, `color="brand"`                                                                                   |

### 고정 문구

| 위치          | 문구                                   |
| ------------- | -------------------------------------- |
| 배경 alt      | `아파트먼트 인트로 이미지`             |
| 제목          | `일시적인 오류가 발생했습니다`         |
| 설명          | `잠시 후 다시 시도해주세요`            |
| 상세 (조건부) | `({message} 에러코드 : {errorCode})`   |
| 버튼          | `메인으로 이동` 또는 `로그인으로 이동` |

### 동작

| 항목           | 동작                                                              |
| -------------- | ----------------------------------------------------------------- |
| 에러 정보 출처 | `window.history.state.errorCode` · `window.history.state.message` |
| 상세 표시 조건 | `errorCode` 또는 `message`가 있을 때만                            |
| 버튼 문구      | `authStore.isLoggedIn ? '메인' : '로그인'` + `으로 이동`          |
| 버튼 목적지    | `authStore.isLoggedIn ? '/main' : '/'`                            |

> ⚠️ **에러 정보를 `history.state`로 받는다.** 다른 화면이 `navigateTo({ path: '/error', state: {...} })`로
> 넘긴다. React Router에서는 `useLocation().state`로 받는다.
> ⚠️ 직접 진입하면 `errorCode`·`message`가 없어 상세 줄이 안 나온다. 정상 동작이다.

---

## E3. 404 (메인 앱)

라우트는 `LayoutAuth` 하위지만 자신의 meta로 `requiresAuth:false`를 덮어쓴다
→ **타깃에서는 `ProtectedRoute` 밖에 배치**한다 (`routes.md` §3-1 주석).

| 요소   | 내용 / 클래스                                                                                              |
| ------ | ---------------------------------------------------------------------------------------------------------- |
| 루트   | `flex h-full w-full flex-col items-center justify-center gap-5 bg-defaults-secondary-background-secondary` |
| 아이콘 | `InfoCircleGray.svg`, alt `경고 아이콘`, `w-10`                                                            |
| 문구   | `경로가 올바르지 않습니다` — `text-defaults-secondary-text-secondary`                                      |
| 버튼   | `메인으로 이동` — `round-type="rounded"`, `color="brand"`, `custom-class="w-fit"` → `/main`                |

> E3는 **무조건 `/main`으로** 보낸다. 로그인 상태를 보지 않는다 (E1과 다름).
> 미로그인 상태에서 404를 만나면 `/main` → 가드 → `/intro`로 두 번 튄다. **그대로 재현.**

---

## E4. 에러 화면 (opinion 앱)

메인 앱 E1과 **레이아웃이 다르다.** 로고가 크게 들어가고 버튼이 없다.

| 요소        | 내용 / 클래스                                                                                             |
| ----------- | --------------------------------------------------------------------------------------------------------- |
| 루트        | `relative h-full w-full`                                                                                  |
| 배경        | `aptmantIntro.svg` — `absolute left-0 top-0 w-full`                                                       |
| 로고 영역   | `flex h-2/3 items-center justify-center`                                                                  |
| 로고        | `aptmantLogoLong.png`, `w-60`, alt `아파트먼트 로고`                                                      |
| 아이콘      | **`InfoCircle.svg`** (E5는 회색 버전), alt `경고 아이콘`, `w-10`                                          |
| 메시지      | `ERROR : {errorMessage}` — `px-10 leading-10 text-defaults-secondary-text-secondary pretendard-20Regular` |
| 메시지 출처 | `window.history.state.message`                                                                            |
| 버튼        | **없음** — 비회원이라 갈 곳이 없다                                                                        |

---

## E5 · E6 · E7. 404 (opinion 앱)

E4와 같은 레이아웃, 아이콘만 회색이고 문구가 고정이다.

| 요소     | 내용                                                                                       |
| -------- | ------------------------------------------------------------------------------------------ |
| 아이콘   | **`InfoCircleGray.svg`**                                                                   |
| 문구     | `경로가 올바르지 않습니다` — `text-defaults-secondary-text-secondary pretendard-20Regular` |
| 스크립트 | **없음** (`<script setup></script>` 빈 블록)                                               |
| 버튼     | 없음                                                                                       |

---

## 접근 거부 모달 — `useForbiddenError`

예외 화면은 아니지만 같은 계열의 공용 로직이다. **여러 도메인이 쓴다.**

```
마운트 → window.history.state.auth 가 없으면 → 모달 열기
모달 닫기 → authStore.isLoggedIn ? '/main' : '/'
```

| 반환                       | 용도                           |
| -------------------------- | ------------------------------ |
| `modalType`                | `'forbiddenError'` 또는 `null` |
| `closeForbiddenErrorModal` | 모달 닫고 이동                 |

모달 문구는 `constants/domain/common.js`의 `ACCESS_DENIED_MODAL_DATA`.
`CertResponse` 공용 컴포넌트도 같은 상수를 쓴다 (`auth.md` A6).

> **`history.state.auth` 플래그로 화면 진입 권한을 판정한다.** 어떤 화면이 이 플래그를 세우는지는
> 해당 도메인 명세에서 확인. React Router에서는 `useLocation().state?.auth`.

---

## 상태

| 값                      | 종류         | 비고                                    |
| ----------------------- | ------------ | --------------------------------------- |
| `errorCode` · `message` | 라우트 state | `history.state` → `useLocation().state` |
| `isLoggedIn`            | 클라이언트   | Zustand                                 |

**서버 호출 없음.** 이 도메인은 API를 하나도 부르지 않는다.

---

## 이관 방침

### 타깃 배치

| 레거시                                    | 타깃                                                                |
| ----------------------------------------- | ------------------------------------------------------------------- |
| `ErrorView.vue` (E1·E2)                   | `app/ErrorPage.tsx`                                                 |
| `NotFoundView.vue` (E3)                   | `app/NotFoundPage.tsx` — **타깃에 이미 있다.** 내용을 레거시로 교체 |
| `OpinionExternalErrorView.vue` (E4)       | `app/opinion/ErrorPage.tsx`                                         |
| `OpinionExternalNotFoundView.vue` (E5~E7) | `app/opinion/NotFoundPage.tsx`                                      |
| `useForbiddenError.js`                    | `shared/hooks/useForbiddenError.ts`                                 |

`docs/conventions/01-folder-structure.md`가 **도메인 없는 페이지만 `app/`에 둘 수 있다**고 정하고 있고,
`NotFoundPage`가 그 예로 명시돼 있다. 예외 화면 전체가 여기 해당한다.

### 타깃 에러 바운더리와의 관계

타깃엔 3단 에러 바운더리(`RootErrorFallback`·`RouteErrorFallback`·`WidgetErrorFallback`)가 있다.
**레거시엔 없다.**

| 항목                                         | 방침                                                                                               |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `RootErrorFallback`                          | **유지.** 예상치 못한 렌더 에러의 안전망. 정상 동작 시 화면에 안 나타나므로 등가성을 해치지 않는다 |
| `RouteErrorFallback` · `WidgetErrorFallback` | **끈다.** `queries.throwOnError: false`로 바뀌므로 트리거되지 않는다 (`decisions/tech-choices.md`) |
| `/error` 라우트                              | **유지.** 레거시가 명시적으로 이 경로로 이동시킨다                                                 |

> 즉 **에러 처리 경로는 레거시 그대로**(모달 또는 `/error` 이동)이고,
> 타깃의 바운더리는 최상위 하나만 보험으로 남긴다.

---

## 엣지케이스

| 상황                                  | 기대 동작                                                      |
| ------------------------------------- | -------------------------------------------------------------- |
| `/error` 직접 진입                    | 상세 줄 없이 기본 문구만. 버튼은 로그인 상태에 따라            |
| 미로그인 상태로 404                   | `메인으로 이동` → `/main` → 가드 → `/intro` (2단계 리다이렉트) |
| opinion 앱에서 잘못된 경로            | NotFound. **되돌아갈 버튼이 없다** — 딥링크 전용이라 정상      |
| opinion `/` 루트 진입                 | NotFound (E6)                                                  |
| opinion `/survey/list` 진입           | NotFound (E7)                                                  |
| `history.state`가 없는 상태로 E4 진입 | `ERROR : undefined`로 표시된다 ⚠️                              |

### `[확인 필요]` X-Q1

E4는 `errorMessage`가 없으면 화면에 **`ERROR : undefined`**가 그대로 노출된다
(`OpinionExternalErrorView.vue:30` — `ref(undefined)` 초기값 + 조건 렌더 없음).

메인 앱 E1은 `v-if`로 가리는데 opinion E4는 가리지 않는다. 실제로 이 상태가 발생하는지,
발생한다면 사용자에게 `undefined`가 보이는 게 맞는지 확인 필요.
**등가 이관 원칙상 일단 그대로 재현**하고 `deferred.md`에 기록.

---

## QA 체크리스트

- [ ] `/error`에 state 없이 진입 → 상세 줄이 안 나오는가
- [ ] 로그인 상태에서 `/error` → 버튼이 `메인으로 이동`, 클릭 시 `/main`
- [ ] 미로그인 상태에서 `/error` → 버튼이 `로그인으로 이동`, 클릭 시 `/`
- [ ] `/error-auth`에서 하단 네비게이션이 보이는가 (E1과의 유일한 차이)
- [ ] 없는 경로 진입 → 404 화면 + `메인으로 이동`
- [ ] opinion 앱 루트(`/`) 진입 → NotFound
- [ ] opinion 앱 `/survey/list` 진입 → NotFound
- [ ] opinion 에러 화면에 로고가 상단 2/3 영역에 크게 나오는가
- [ ] 아이콘 색 구분: 에러는 `InfoCircle`, 404는 `InfoCircleGray`
- [ ] 접근 거부 모달 → 닫으면 로그인 상태에 따라 `/main` 또는 `/`

---

## `[확인 필요]`

| #    | 질문                                                                     |
| ---- | ------------------------------------------------------------------------ |
| X-Q1 | opinion 에러 화면에 `ERROR : undefined`가 노출되는 상황이 실제로 있는가? |
| X-Q2 | `history.state.auth` 플래그를 세우는 화면 목록 — 각 도메인 명세에서 수집 |
