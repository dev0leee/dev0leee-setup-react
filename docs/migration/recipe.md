# 이관 레시피

> **Phase 5(MyPage 파일럿)에서 확정한 규약.** Phase 6의 모든 도메인이 이것을 따른다.
> 파일럿에서 실제로 부딪힌 것만 적었다 — 아직 부딪히지 않은 것은 §12에 미정으로 남겼다.
>
> 근거 코드: `src/features/mypage/**`, `src/shared/hooks/useResidentDetailInfo.ts`,
> 커밋 `3df0400`(shared 승격) · `aabe9dd`(exception) · `10057cf`(mypage)

## 0. 도메인 하나를 이관하는 순서

1. `docs/migration/features/<domain>.md`를 읽는다. **명세가 스펙이고 레거시 코드가 정본이다** —
   명세에 없는 세부는 레거시 파일을 직접 열어 확인한다
2. `eslint.config.js`의 `FEATURE_SLICES`에 슬라이스 이름이 있는지 확인한다 (없으면 추가)
3. 아래 순서로 만든다: `types` → `constants` → `api` → `schemas` → `queries` → `components` → `pages`
   → `index.ts` → 라우터 배선 → 테스트
4. 화면 하나가 아니라 **도메인 하나를 끝낸다.** 중간에 다른 도메인을 열지 않는다
5. `pnpm typecheck && pnpm lint && pnpm format:check && pnpm test && pnpm build`
6. 레거시와 나란히 띄워 UI 대조 (392px + 폰트 배율 5단계)
7. `progress.md` · `deferred.md` 갱신 후 커밋

---

## 1. 슬라이스 구조

```
features/<domain>/
├── api/          # 엔드포인트별 함수. apiClient의 api·publicApi만 쓴다
├── components/   # 이 도메인 전용 컴포넌트
├── constants/    # mypage.ts(문구·설정값) · query.ts(쿼리 키)
├── hooks/        # 화면 조립용 훅 (여러 쿼리를 묶는 것)
├── pages/        # 라우트가 가리키는 화면
├── queries/      # useQuery / useMutation 래퍼
├── schemas/      # zod 폼 스키마
├── types/        # 이 도메인의 타입
└── index.ts      # 공개 API — 페이지만 내보낸다
```

**`index.ts`는 페이지만 내보낸다.** 훅·API·타입을 내보내면 다른 feature가 손을 뻗게 된다.
바깥에서 필요해지면 그건 `shared`로 올릴 신호다 (§2).

파일 하나에 몰아도 되는 경우: **같은 화면만 쓰는 훅 5~6개가 같은 보일러플레이트를 반복할 때.**
알림 토글 뮤테이션 5종을 `queries/useAlarmMutations.ts` 한 파일에 넣었다 — 파일을 나누면
`aptResidentUuid` 읽기와 `onError` 모달이 5번 복사된다.

---

## 2. `shared`로 올릴지 판별하는 기준 (MUST)

파일럿에서 가장 큰 결정이었다. `useGetResidentDetailInfo`는 레거시에서 **23개 파일**이 쓴다.

> **"이건 이 도메인의 규칙인가, 앱 전체가 딛고 서는 사실인가?"**

- **하부구조다 → `shared`.** "지금 이 단지에서 어떤 서비스를 쓸 수 있나"는 12개 도메인이
  메뉴·화면을 게이팅하는 근거다. mypage의 규칙이 아니다
- **도메인이다 → feature에 두고 `index.ts`로 내보내지 않는다.** 다른 feature가 필요해하면
  경계를 잘못 그었다는 신호를 먼저 의심한다

**"여러 feature가 쓴다"만으로는 올리지 않는다.** 그 기준이면 전부 `shared`가 된다.

### 이미 올라간 것

| 대상                                       | 위치                                          |
| ------------------------------------------ | --------------------------------------------- |
| 단지 컨텍스트 조회 · 구독 콘텐츠 플래그    | `shared/hooks/useResidentDetailInfo.ts`       |
| 단지 컨텍스트 엔드포인트 · `hasAptContent` | `shared/lib/aptContext.ts`                    |
| 단지 전환                                  | `shared/hooks/useChangeApt.ts`                |
| 세션 정리(로그아웃 흐름)                   | `shared/hooks/useLogoutFlow.ts`               |
| 서비스 이름 17종 · 약관 4종                | `shared/constants/aptContent.ts` · `terms.ts` |

> **엔드포인트 함수를 `shared/lib/`에 두는 것은 하부구조에 한한다.** `03-api.md`는 API 함수를
> `features/<domain>/api/`에 두라고 하는데, `shared/lib/`의 정의가 "바깥과 통신하는 창구"이고
> `apiClient`가 재발급 엔드포인트를 직접 부르는 선례가 있다. **도메인 엔드포인트는 예외 없이
> feature에 둔다.**

### `contentList` 비교는 반드시 `hasAptContent`

```ts
// BAD — trim()을 빠뜨리면 ' 로비폰 '이 매칭되지 않는다
contentList?.some((content) => content.name === '로비폰')

// GOOD
hasAptContent({ contentList, contentName: APT_CONTENT_NAME.LOBBY_PHONE })
```

---

## 3. 라우트 · 레이아웃 메타 (확정)

**레거시 `route.meta` → react-router `handle`.** `useLayoutConfig`가 가장 안쪽 매치를 읽는다.

```tsx
{
  path: ROUTE_PATH.MYPAGE_ALARM_SETTING,
  handle: layout({ appBarTitle: '알림 설정' }),   // showAppBar·hasBackButton은 기본값 true
  lazy: async () => {
    const { AlarmSettingPage } = await import('@/features/mypage')
    return { Component: AlarmSettingPage }
  },
}
```

- **기본값을 다시 적지 않는다.** `DEFAULT_ROUTE_LAYOUT`이 `showAppBar: true`,
  `hasBackButton: true`다. 레거시 meta에 `showAppBar: true`가 적혀 있어도 생략한다
- **AppBar에 우측 버튼이 필요하면 `showAppBar: false` + 화면 안에서 `<AppBar>` 렌더.**
  본문 여백이 레이아웃의 `pt-12`가 아니라 화면이 주는 `pt-16`이 된다 (레거시 값)
- **경로는 `ROUTE_PATH` 상수로.** 단, **아직 이관되지 않은 도메인의 경로는 문자열 그대로 둔다** —
  라우트 정의가 없는 상수를 만들면 실제 경로와 어긋나도 알 수 없다. 그 도메인이 오면 함께 바꾼다

### lazy가 실제로 분리되는지 확인한다

배럴(`index.ts`)이 **어딘가에서 정적 import되면 `lazy`는 아무 효과가 없다.** `pnpm build`의
`INEFFECTIVE_DYNAMIC_IMPORT` 경고를 무시하지 않는다.

- `features/auth`는 `AuthProvider`·`IntroPage`가 eager라 배럴이 초기 번들에 있다 →
  같은 배럴의 `LogoutPage`·비밀번호 재설정 3화면도 `element`로 eager하게 둔다
  (lazy로 감싸면 거짓 표시가 된다 — `deferred.md` D-207)
- 나머지 도메인은 배럴을 **오직 lazy로만** 참조한다

### 가드는 컴포넌트가 아니라 `loader`로 옮긴다 (MUST)

레거시 `router.beforeEach`는 **이동 전에** 비동기 작업을 하고 목적지를 바꾼다.
컴포넌트로 옮기면 화면이 한 번 그려진 뒤 사라지고, **그 사이 마운트 effect가 돈다.**

Phase 6에서 실제로 문제가 됐다: 인트로는 마운트 시 `clearAuth()`를 부른다.
"세션이 있으면 메인으로" 판정을 컴포넌트로 만들면 **정상 세션이 지워진 뒤에 이동**한다.

| 레거시 가드 단계                        | 타깃                                             |
| --------------------------------------- | ------------------------------------------------ |
| `requiresAuth && 미인증`                | `ProtectedRoute` (동기 판정이라 컴포넌트로 충분) |
| `requiresAuth === false && 인증됨`      | `publicRouteLoader` (**비동기** — loader)        |
| `return false` (오프라인·뒤로가기 차단) | `useBlocker` + 즉시 `reset()`                    |

- **`authOptional` 라우트에는 걸지 않는다.** 레거시가 그 플래그를 보면 나머지 검사를 건너뛴다
- 차단 판정은 **순수 함수로 뽑는다**(`app/navigationBlocking.ts`). `useBlocker` 콜백에
  인라인으로 넣으면 라우터를 띄우지 않고 검증할 수 없다
- `reset()`을 부르지 않으면 blocker가 `blocked`에 머물러 **그 뒤 모든 이동이 막힌다**

---

## 4. 서버 상태

### 쿼리 키는 팩토리로

```ts
// features/<domain>/constants/query.ts
export const NOTIFICATION_SETTING_QUERY_KEY = ['notificationSetting'] as const
export const notificationSettingQueryKey = ({
  aptResidentUuid,
}: {
  aptResidentUuid: string | undefined
}) => [...NOTIFICATION_SETTING_QUERY_KEY, aptResidentUuid] as const
```

접두사와 전체 키를 **둘 다** 둔다 — 무효화·제거는 접두사로, 조회는 전체 키로 한다.
**문자열은 레거시 그대로** (`query-keys.md`).

### `enabled`로 uuid 없는 호출을 막는다

```ts
useQuery({
  queryKey: notificationSettingQueryKey({ aptResidentUuid }),
  queryFn: () => getNotificationSetting({ aptResidentUuid: aptResidentUuid ?? '' }),
  enabled: Boolean(aptResidentUuid),
})
```

`?? ''`는 타입을 맞추기 위한 것이고 `enabled`가 실제 가드다.

### `invalidateQueries`는 v5 시그니처로

```ts
queryClient.invalidateQueries({ queryKey: [...] })   // 객체 인자. 위치 인자는 v5에서 no-op
```

### mutation 응답을 화면 값으로 쓰는 패턴

레거시 알림 설정은 **무효화도 낙관적 업데이트도 하지 않고** mutation 응답을 조회값보다
우선한다. 등가 이관을 위해 유지했다:

```ts
const pickFlag = ({ key, mutationResult, notificationSetting }) => {
  const value = mutationResult?.[key]
  if (value != null) return value // ⚠️ != null — false 도 유효한 값이다
  return notificationSetting?.[key]
}
```

**truthy 검사(`if (value)`)를 쓰면 끈 직후 다시 켜진 것처럼 보인다.**

### ⚠️ 응답값을 핸들러 안에서 쓸 때 — stale closure (파일럿에서 실제로 터진 버그)

```ts
// BAD — 이미 만들어진 클로저는 재렌더된 mutationResult를 볼 수 없다
onChange: async (value) => {
  await mutateConsent(...)
  showToast(pickFlag({ mutationResult: marketingConsentResult, ... }))   // 이전 값!
}

// GOOD — mutateAsync 반환값을 그대로 넘긴다
onChange: async (value) => {
  const result = await mutateConsent(...)
  if (!result) return
  showToast({ ...,  result })
}
```

Vue는 `getFlag`가 `ref`를 읽어 문제가 없었다. **React 번역에서만 생기는 함정이고 조용히
틀린다** — 테스트가 잡았다. 응답을 이어서 쓰는 흐름에는 `mutateAsync` + 인자 전달을 쓴다.

---

## 5. `watch()` → React 변환 기준 (MUST)

기계적으로 `useEffect`로 바꾸지 않는다. **위에서부터 순서대로** 판단한다.

| 레거시 `watch`가 하는 일   | React                            | 파일럿 사례                                    |
| -------------------------- | -------------------------------- | ---------------------------------------------- |
| 값에서 값을 계산           | **렌더 중 계산**                 | 메뉴 그룹 필터, 구독 플래그 10종, 버전 문구    |
| 서버 응답을 화면에 반영    | **쿼리 데이터를 그냥 읽는다**    | `residentDetailInfo?.aptName`                  |
| 사용자 동작에 반응         | **이벤트 핸들러**                | 토글 변경, 슬라이더 입력                       |
| React 밖 저장소에 쓴다     | `useEffect`                      | `residentDetailInfo` → `aptInfo`(localStorage) |
| 뮤테이션 성공/실패에 반응  | 뮤테이션 콜백 (`onSuccess`) 우선 | 프로필 수정 후 이동·토스트                     |
| 〃 인데 부모에게 알려야 함 | `useEffect` (성공 플래그 감시)   | 비밀번호 변경 성공 → 모달 닫기                 |
| `{ once: true }`           | `useEffect` + `useRef` 가드      | 세대 전출 처리                                 |

`useEffect`를 쓸 때는 **왜 다른 선택지가 아닌지 주석으로 남긴다.** 리뷰에서 가장 많이
지적되는 자리다.

### `{ once: true }` 재현

```ts
const hasHandledRef = useRef(false)
useEffect(() => {
  if (!error || hasHandledRef.current) return
  hasHandledRef.current = true
  ...
}, [error, ...])
```

같은 훅을 한 화면에서 여러 번 부를 수 있다 (마이페이지는 `useResidentDetailInfo`를 3곳에서
쓴다). **가드가 없으면 모달이 3개 뜬다.**

---

## 6. 폼 (react-hook-form + zod)

### 제어 컴포넌트는 `Controller`로 잇는다 (확정)

`shared/components/common/**`의 입력들(`InputBase`·`InputPassword`·`InputCheckbox` 등)은
**부모가 값을 소유하는 제어 컴포넌트**다. RHF `register`는 DOM ref와 이벤트 객체를 요구하므로
맞지 않는다.

```tsx
<Controller
  control={control}
  name="nickName"
  render={({ field }) => (
    <InputBase id="nickName" value={field.value} onChange={field.onChange} onBlur={field.onBlur} />
  )}
/>
```

`field.onChange`는 값을 그대로 받으므로 변환이 필요 없다. shadcn `Input` 같은 비제어
입력에는 `register`를 쓴다.

### 필드명은 레거시의 `id`를 따른다

레거시 `InputBase`는 `useField(props.id)`로 등록한다. **`name` prop이 아니라 `id`가 필드명**이다.

### 버튼 활성 조건을 `isValid`로 바꾸지 않는다

레거시 `meta.valid`는 **에러 객체가 비어 있음**이라 검증 전에는 `true`다. 그대로 재현한다:

```ts
const hasNoError = Object.keys(errors).length === 0 // 진입 직후 활성색
const isFormValid = Boolean(a && b && c && hasNoError) // 값 존재 + 에러 없음
```

`formState.isValid`를 쓰면 **진입 직후 버튼 색이 달라진다.** 눈에 보이는 차이다.

### `mode: 'onChange'`

vee-validate는 입력 중 검증한다. RHF 기본(`onSubmit`)을 쓰면 에러가 늦게 뜬다.

### 읽기 전용 필드도 스키마에 넣는다

레거시가 `<form>` 밖의 입력까지 폼 컨텍스트에 등록했다면 검증 대상이다.
`defaultValues`에 넣어 같은 상태를 만든다 (§P3 이름 필드).

### 서버 에러

- 필드에 붙일 수 있으면 `setError('필드명', ...)`
- 아니면 `showErrorModal({ text: error.message })` — 레거시 `swalErrorModal`과 같은 자리
- **에러코드 분기는 레거시 `switch`를 그대로 옮긴다.** `default`만 있는 switch도 유지 의미가
  있다 (서버 메시지 그대로 노출)

---

## 7. 오버레이

| 용도           | 컴포넌트                       | 비고                                  |
| -------------- | ------------------------------ | ------------------------------------- |
| 확인 모달      | `ModalButton`                  | `modalData` 상수는 도메인 constants   |
| 자유 내용 모달 | `ModalBase` + 자식이 크기 결정 | 비밀번호 변경 모달                    |
| 에러 알림      | `showErrorModal()`             | 훅이 아니다. 뮤테이션 콜백에서 부른다 |
| 토스트         | `showToast()`                  | `ReactNode`를 받는다                  |
| 바텀시트       | `DrawerBase` 계열              | 파일럿에서 미사용                     |

- **모달의 열림 상태는 부모가 `useState`로 갖는다.** `open`/`onClose` prop으로 내린다
- **라우트가 모달인 경우도 있다** (`/logout`). 화면 없이 `ModalButton`만 렌더하고
  닫으면 `navigate(-1)`
- 토스트에 줄바꿈이 필요하면 **`<br />` 엘리먼트**를 넘긴다. 문자열 `'<br/>'`은 태그가 보인다

---

## 8. 스타일

- **레거시 클래스 문자열을 그대로 옮긴다.** 정리·통합하지 않는다. 겹친 패딩(`p-4 px-3 py-2`),
  의미 없는 `flex`, `space-y-3`이 붙은 빈 요소도 그대로 둔다 — 뒤쪽 값이 이기는 것까지 동일해야 한다
- **의사요소는 Tailwind로 표현할 수 없다** → `src/index.css`에 원시 CSS로 넣는다
  (`14-styling.md`의 문서화된 예외). 전역이므로 **클래스명을 구체적으로** 짓고
  (`progress-bar` → `font-size-progress`) `@apply` 대신 값을 풀어 쓴다

### 죽은 클래스 (MUST) — 판정 순서가 정해져 있다

레거시에는 **`tailwind.config.js`에 없어서 아무 효과가 없는 클래스가 26개** 있다
(`broken-styles.md`). Tailwind는 모르는 유틸리티를 **조용히 무시**하므로 코드만 읽으면
색이 적용되는 것처럼 보인다. UI 대조로도 잡히지 않는다 — **빌드 산출물로 검증한다.**

**옮길 때 먼저 묻는다: 같은 팔레트에 대상 토큰이 있는가?**

| 판정                                                 | 조치                                          |
| ---------------------------------------------------- | --------------------------------------------- |
| 철자·중간 경로·숫자 스케일만 틀렸다 (대상 토큰 존재) | **그 토큰으로 고친다** — 화면이 달라져도 적용 |
| Tailwind 스케일 밖 숫자                              | 임의값 문법 (`w-4.75` → `w-[19px]`)           |
| 이미 덮이거나 유틸이 아니다                          | 삭제                                          |
| **가리키는 팔레트가 config에 없다**                  | **렌더값 유지. 근사값을 추측하지 않는다**     |

```
bg-primary-400          → bg-primary-pc-indigo-400   ✅ primary 팔레트에 400이 있다
text-neutral-90         → text-neutral-b-gray-900     ✅ 경로 누락 + 숫자 ×10
text-brand-primary-50   → 렌더값(#111927) 유지         🔴 brand 에 primary 도 숫자 스케일도 없다
```

마지막 줄이 Phase 5에서 실제로 틀린 자리다. `#0037BE`를 골라 **마이페이지 메뉴 제목이
검정 → 파랑**으로 바뀌었고 되돌렸다 (`ee6409b` → `3387f32`).

### 렌더값은 **추정하지 말고 실측한다** (MUST)

`text-*`는 상속색, `border-*`는 기본색, `bg-*`는 투명 — 규칙은 알지만 **상속 체인에 뭐가
끼어 있는지는 코드로 확신할 수 없다.** `<a>`는 UA 링크색이 있고, preflight가 그걸 지우는지도
빌드 설정에 달렸다.

레거시 dev 서버에 붙어 **조상 체인을 그대로 재현하고 `getComputedStyle`로 잰다.**
로그인이 필요 없는 화면(`/intro`)에서도 색 상속은 같으므로 계정 없이 측정할 수 있다.

```ts
await page.goto('http://localhost:3000/intro')
const color = await page.evaluate(() => {
  const host = document.createElement('div')
  host.innerHTML = `<li class="...조상 클래스..."><h2 class="text-brand-primary-50">x</h2></li>`
  document.body.appendChild(host)
  return getComputedStyle(host.querySelector('h2')!).color
})
```

이 방법으로 `text-brand-primary-50`이 `#111927`(순수 상속), 라디오 선택 배경이
`rgba(0,0,0,0)`(투명)임을 확인했다 — **앵커가 파랗게 보일 가능성도 실측으로 배제했다.**
조사용 spec은 확인 후 삭제한다.

### 검증 — 빌드 CSS와 대조한다

```bash
pnpm build
# .tsx 의 className 토큰을 뽑아 dist/assets/*.css 에 셀렉터가 있는지 확인
```

새 화면을 만들 때마다 돌린다. **없는 토큰을 쓰면 조용히 무시되므로 눈으로는 못 잡는다.**

## 9. 문구·상수

- **화면 문구는 전부 `constants/<domain>.ts`로 올린다.** 등가 대조의 대상이라 한곳에 모여 있어야
  한다. 마크업에 인라인으로 남기지 않는다
- **서버가 주는 문자열은 바꾸지 않는다** (에러코드, `contentList` 이름, 요일 코드, 경로)
- 매직 넘버에는 이름을 준다: `CONSENT_DATE_LENGTH = 16`, `BUSINESS_HOUR_LENGTH = 5`
- 문구 생성이 필요하면 상수 객체에 함수를 둔다 (`APP_VERSION_TEXT.LATEST(version)`)

---

## 9-0. `div`/`li` → `button` 변환 (MUST) — 대조에서 발견

레거시는 클릭 핸들러를 `div`·`li`에 직접 단 곳이 많다. 키보드 접근성 때문에 `button`으로
바꾸는 것은 좋지만, **`button`은 UA 기본값이 `text-align: center`이고 Tailwind preflight가
그것을 리셋하지 않는다.**

```tsx
// BAD — 레거시가 div였다면 텍스트가 가운데로 밀린다
<button className="flex w-full items-center justify-between px-6 py-5">

// GOOD
<button className="flex w-full items-center justify-between px-6 py-5 text-left">
```

flex 자식이 전부 shrink-to-fit이면 눈에 안 띄지만, **`flex-col`로 늘어난 자식 안의 텍스트는
가운데로 밀린다.** 마이페이지 프로필 카드의 단지명이 그래서 들여쓰기처럼 보였다.

`e2e/layout.spec.ts`가 변환한 버튼들의 `text-align`을 확인한다.

---

## 9-1. 레이아웃 높이 체인 (MUST) — Phase 5에서 실제로 깨진 자리

레거시 화면은 대부분 `h-full` + `overflow-auto`로 **자기 스크롤 영역을 직접 만든다.**
그 `h-full`은 `<main>`의 높이에 기대는데, **부모 체인에 높이 없는 박스가 하나라도 끼면
백분율 높이가 `auto`로 무너지고 `main`의 `overflow-hidden`이 내용을 잘라 스크롤이 죽는다.**

Vue `<Transition>`은 DOM 노드를 만들지 않아 화면이 `<main>`의 직계 자식이었다.
React는 애니메이션을 걸 박스가 필요해 래퍼가 하나 늘어난다 → **그 래퍼에 `h-full`이 없으면
전 화면의 스크롤이 죽는다.** `PageTransition`이 그랬다.

- 화면 사이에 박스를 새로 끼울 때는 **`h-full`을 함께 넣는다**
- `jsdom`은 레이아웃을 계산하지 않아 **단위 테스트로는 절대 잡히지 않는다**
- `e2e/layout.spec.ts`가 실제 브라우저에서 높이 계약을 검증한다.
  **새 화면을 만들면 여기에 라우트를 한 줄 추가한다**

---

## 10. 테스트 (Vitest + MSW)

**화면 단위 통합 테스트가 기본이다.** `renderWithProviders` + MSW 핸들러.

### 반드시 덮는 것

1. **분기 조건** — 구독 콘텐츠에 따른 노출/숨김. 명세의 「엣지케이스」 표가 곧 목록이다
2. **요청 body** — 클라이언트가 값을 조합해 보내는 경우 (마케팅↔광고성 연동)
3. **폼 검증 문구** — 문구를 문자열로 단정한다. 오타가 나면 등가가 깨진다
4. **실패 경로** — 부수 API가 실패해도 주 흐름이 끝나는지 (로비폰 통보 실패 → 세션 정리)
5. **React 번역 함정** — stale closure, effect 중복 실행

### e2e (Playwright) — 브라우저만 답할 수 있는 것

**단위 테스트와 역할이 다르다.** 화면 내용·분기는 Vitest가 덮고, e2e는 **레이아웃·스크롤처럼
jsdom이 계산하지 않는 것**만 본다. 같은 것을 두 번 검증하지 않는다.

- 세션은 `e2e/support/session.ts`의 `seedSession()`으로 심는다 (로그인 폼을 매번 통과하지 않는다)
- 서버 응답은 `mockAptApis()` **하나로 API 전체를 가로챈다.** 경로별 `page.route`를 여러 개
  걸면 등록 순서가 우선순위가 되어 조용히 어긋나고, **빠뜨린 엔드포인트가 실제 백엔드로 새면
  병렬 실행에서만 타임아웃으로 나타난다** — 단독 실행은 통과해서 진단이 늦는다.
  모르는 경로는 500으로 즉시 끊는다
- `VITE_API_URL`을 하드코딩하지 않는다. 술어 함수로 `pathname`만 본다

### 쓰지 않는 것

- **로그인 흐름을 매번 다시 타지 않는다.** `useAuthStore.setState({ aptInfo })`로 컨텍스트를
  직접 넣는다. 로그인부터의 경로는 `app/router.test.tsx`가 한 번 덮는다
- 스냅샷 테스트. 클래스 문자열이 바뀌었는지는 UI 대조로 본다

### 화면 이동을 검증하려면 `<Routes>`를 직접 넣는다

`renderWithProviders`에 `initialEntries`를 넘길 수 있다. 목적지 자리를 만들어두면
"이동했는가"를 화면 내용으로 단정할 수 있다 — `useNavigate`를 모킹하지 않는다.

```tsx
renderWithProviders({
  initialEntries: [{ pathname: '/password/reset', state: { verifiedToken: 't' } }],
  ui: (
    <Routes>
      <Route path="/" element={<h1>인트로</h1>} />
      <Route path="/password/reset" element={<PasswordResetPage />} />
    </Routes>
  ),
})
```

라우터 state로 값을 받는 화면은 `initialEntries`에 객체를 넘겨 그 state까지 만든다.

### `&nbsp;`가 있으면 `getByRole(name)`이 안 맞는다

접근성 이름 계산은 `&nbsp;`(U+00A0)를 일반 공백으로 정규화하지 **않는다.** 화면에는
`아파트먼트 1단지`로 보여도 `getByRole('heading', { name: '아파트먼트 1단지' })`는 실패한다.

```ts
// BAD — nbsp 때문에 매칭 실패
screen.getByRole('heading', { name: '아파트먼트 1단지' })

// GOOD — toHaveTextContent 는 공백을 정규화한다
expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('아파트먼트 1단지')
```

어절 단위 줄바꿈처럼 **`&nbsp;`를 의도적으로 쓰는 마크업**(메인 단지 헤더)에서 걸린다.

### 타이머는 `vi.useFakeTimers({ shouldAdvanceTime: true })`

`userEvent`는 내부에서 타이머를 쓴다. 옵션 없이 가짜 타이머를 켜면 `userEvent`가 멈춘다.
시간을 밀 때는 `act(() => vi.advanceTimersByTime(ms))`로 감싼다.

### 요령

- 토스트를 검증하려면 `<Toaster />`를 함께 렌더한다
- `<input type="range">`는 `fireEvent.change`를 쓴다 (`userEvent`의 타이핑 대상이 아니다)
- 같은 문구가 트리거와 모달 제목에 둘 다 있으면 `getByRole('button', { name })`으로 좁힌다
- 서버가 식별자를 안 주는 목록은 레거시처럼 index를 key로 쓴다

---

## 11. 커밋 · PR

- **도메인 하나 = 브랜치 하나(`feat/migrate-<domain>`) = PR 하나(squash)**
- 커밋 메시지에 **"레거시가 왜 그랬는지"와 "왜 그대로 뒀는지"**를 남긴다. 나중에 리뷰하는
  사람이 "이건 버그 아닌가"라고 물을 자리마다 답이 있어야 한다
- 개선 아이디어는 코드가 아니라 `deferred.md`로 보낸다

---

## 12. 아직 확정되지 않은 것

파일럿에서 부딪히지 않았다. **처음 필요해지는 도메인에서 확정하고 이 문서에 추가한다.**

| #   | 항목                                           | 처음 필요한 도메인                                     |
| --- | ---------------------------------------------- | ------------------------------------------------------ |
| R-1 | 무한 목록 + **스크롤 위치 복원**               | Board (`useInfiniteList`는 이식됨, 위치 복원은 미구현) |
| R-2 | 이미지 업로드 + 업로드 진행률                  | Board                                                  |
| R-3 | `provide`/`inject` 폼 트리 → Context 규격      | Vote · Survey                                          |
| R-4 | `v-dompurify-html` 25곳 → `sanitizeHtml`       | Board (본문 렌더)                                      |
| R-5 | Quill Delta → HTML 렌더 + `vue-quill.snow.css` | Board                                                  |
| R-6 | ApexCharts → recharts 옵션 대조                | ManagementFee                                          |
| R-7 | 날짜 선택기 래퍼 (shadcn calendar)             | Visit · AptMall                                        |
| R-8 | opinion 멀티 엔트리 배선                       | opinion                                                |
