# 기술 변경 매핑 (Phase 3)

> 기준 SHA `6d5bf22` · 레거시 `src/` 41,496 LOC
> 입력: Phase 1 인벤토리 6종 + `decisions/` 4종
> 전체 계획: `~/.claude/plans/working-smcom-apt-resident-fe-tranquil-charm.md`

레거시 코드 자산을 **그대로 이식 / 재작성 / 폐기**로 분류하고, 각각의 타깃 위치를 정한다.
화면 단위 명세는 Phase 2(`features/<domain>.md`)가 담당한다. 이 문서는 **구조와 인프라**만 다룬다.

## 레거시 자산 규모

| 영역                                                                         | 파일 | 처리                        |
| ---------------------------------------------------------------------------- | ---: | --------------------------- |
| `views/**/*.vue`                                                             |  266 | 재작성 (Phase 6, 도메인별)  |
| `lib/queries/**`                                                             |  141 | 재작성 (기계적)             |
| `components/common` + `layouts`                                              |   38 | 재작성                      |
| `lib/composables/**`                                                         |   31 | 재작성 (React 훅)           |
| `lib/utils/**`                                                               |   25 | **그대로 이식**             |
| `constants/**`                                                               |   19 | 그대로 이식 (분산 배치)     |
| `stores/**`                                                                  |   13 | 대부분 폐기·축소            |
| `api/**`                                                                     |   18 | 재작성 (경로·계약은 보존)   |
| `schemas/**`                                                                 |   10 | 그대로 이식 (zod 4 변환)    |
| `natives/**`                                                                 |    6 | 재작성 (프로토콜 100% 보존) |
| `lib/` 기타 (`delta`·`deploy`·`emitter`·`he`·`posthog`·`sentry`·`swalModal`) |   10 | 혼합                        |

---

## 1. 그대로 이식 — 프레임워크 무관

로직 변경 없이 `.js` → `.ts`만. **동작을 바꾸지 않는다.**

| 레거시                                 | 타깃                           | 비고                                                                                      |
| -------------------------------------- | ------------------------------ | ----------------------------------------------------------------------------------------- |
| `lib/utils/**` (25)                    | `shared/utils/`                | 타깃에 이미 있는 `cn`·`formatNumber`와 중복 확인. `date-fns`로 대체 가능한 것 선별 (§1-1) |
| `lib/delta/convertDeltaToHtml.js`      | `shared/lib/`                  | Quill Delta → HTML. `customImage` blot 처리 포함                                          |
| `lib/he/decodeUrl.js`                  | `shared/utils/`                | `he.decode` + `decodeURIComponent` 폴백                                                   |
| `lib/emitter/emitter.js`               | —                              | `mitt` 대신 자체 이벤트 버스 (§5-2)                                                       |
| `lib/deploy/checkFrontVersion.js`      | `shared/lib/`                  | `VITE_BUILD_ID` vs `/version.json`                                                        |
| `lib/posthog/posthog.js` · `deploy.js` | `shared/lib/posthog/`          | 초기화만 React 진입점으로                                                                 |
| `lib/sentry/sentryApiError.js`         | `shared/lib/`                  | import만 `@sentry/react`로                                                                |
| `constants/**`                         | `features/<domain>/constants/` | `domain-codes.md` §5                                                                      |
| `schemas/**`                           | `features/<domain>/schemas/`   | `zod-migration.md` §6                                                                     |

### 1-1. `lib/utils/` 25개 선별

**먼저 확인할 것** — 타깃에 대응물이 있거나 `date-fns`로 대체 가능한지:

| 레거시 유틸                                                                                                                                                  | 판단                                                                                            |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------- |
| `formatDate.js` (84) · `formatDay.js` · `formatTime.js` · `formatMinutes.js` · `formatDayFreeTime.js` · `calculatePeriodDays.js` · `getCurrentMonthRange.js` | `date-fns` 대체 검토. **단, 출력 문자열이 한 글자라도 달라지면 안 된다** — 대체보다 이식이 안전 |
| `numberFormat.js`                                                                                                                                            | 타깃 `shared/utils/formatNumber.ts`(`formatPrice`)와 중복 확인                                  |
| `formatPhone.js` · `cleanPhoneHyphen.js` · `InputFormat.js`                                                                                                  | 그대로                                                                                          |
| `compareSemver.js` · `validImage.js` · `base64ToFile.js` · `convertFormDataFile.js` · `copyValue.js`                                                         | 그대로                                                                                          |
| `findCarType.js` · `findInParkingStatus.js` · `getBadgeColorByInParkingStatus.js`                                                                            | 주차 도메인 → `features/parking/utils/`                                                         |
| `getCommunityQueryString.js`                                                                                                                                 | 게시판 도메인                                                                                   |
| `formErrorFocus.js`                                                                                                                                          | RHF 방식으로 재작성 (`setFocus`)                                                                |
| `deleteLocalInfo.js` · `hasLocalStorageData.js`                                                                                                              | 인증 도메인. `auth-strategy.md`와 함께                                                          |
| `formatHtmlText.js`                                                                                                                                          | DOMPurify 연동부 확인                                                                           |
| `validateQueryEnabledParams.js`                                                                                                                              | 쿼리 `enabled` 가드. `queries/`로                                                               |

> **원칙**: 대체 라이브러리로 바꾸고 싶어도, **출력이 픽셀·문자 단위로 같다고 확신할 수 없으면 이식한다.**
> 날짜 포맷은 특히 위험하다. 개선 의견은 `deferred.md`로.

---

## 2. HTTP 레이어 — 재작성

`decisions/auth-strategy.md` 결정에 따라 **타깃 템플릿의 HTTP 인프라를 레거시 방식으로 다시 쓴다.**

| 레거시                           | 타깃                        | 변경                                                         |
| -------------------------------- | --------------------------- | ------------------------------------------------------------ |
| `api/axios.js` (219)             | `shared/lib/apiClient.ts`   | ⚠️ **재작성**                                                |
| —                                | `shared/lib/tokenStore.ts`  | ⚠️ **재작성** — 메모리 → localStorage                        |
| `stores/pendingRequests.js` (59) | `shared/lib/` 내부 큐       | ⚠️ **유지** (형태만 재설계)                                  |
| —                                | `shared/lib/authChannel.ts` | ⚠️ **재검토** — 웹뷰 단일 탭이라 BroadcastChannel이 필요한지 |
| —                                | `shared/lib/apiErrors.ts`   | ⚠️ **확장** — `ServerErrorBody` 중첩 구조                    |
| —                                | `shared/lib/queryClient.ts` | ⚠️ **기본값 교체** (§4-3)                                    |

### 2-1. `apiClient.ts` 재작성 사양

| 항목              | 레거시 동작 (보존)                                                                              |
| ----------------- | ----------------------------------------------------------------------------------------------- |
| 인스턴스          | `client`(비인증) / `auth`(인증) → 타깃 `publicApi` / `api`                                      |
| baseURL           | `env.VITE_API_URL` (구 `VITE_SERVER_REQUEST_SERVICE_URL`)                                       |
| 토큰 부착         | 요청 인터셉터에서 `Authorization: Bearer ${accessToken}`                                        |
| **재발급 트리거** | ⚠️ **HTTP 401이 아니라** `error.data.error.errorCode`가 `EXPIRED_TOKEN` \| `INVALID_TOKEN`일 때 |
| 재발급 요청       | `POST /apartmant/resident/token-refresh`, **헤더** `refresh-token`                              |
| 새 토큰 수신      | **응답 헤더** `authorization`                                                                   |
| 중복 방지         | 모듈 레벨 `isRefreshingToken` 락                                                                |
| 대기 큐           | 재발급 중 도착한 요청을 큐에 담고, 완료 후 새 토큰으로 replay                                   |
| 재발급 실패       | 큐에 담고 `isAutoLoginInProgress = true` → 자동 로그인 트리거                                   |
| 무한루프 가드     | `originalRequest.retry` 플래그 (⚠️ `_retry`가 아니라 **`retry`**)                               |
| 5xx               | `sentryApiError(error.response)` 호출 후 throw                                                  |
| throw 형태        | 레거시는 `error.response` 원본 → 타깃은 `ApiError`로 정규화                                     |

> 타깃의 `navigator.locks` + `withCredentials` + `_retried`는 **쿠키 방식 전제**라 쓰지 않는다.
> ESLint `no-underscore-dangle` 예외에 걸린 `_retried`도 레거시 이름(`retry`)으로 바뀐다 —
> `eslint.config.js`의 allow 목록 조정 필요.

### 2-2. 대기 요청 큐

레거시는 Pinia 스토어 + Vue `watch`로 구현했다:

```
axios.js가 authStore.isAutoLoginInProgress를 watch
  true → false 전이 시:
    accessToken 있으면 → 큐 전체를 새 토큰으로 replay (Promise.allSettled)
    없으면 → 전부 reject(new Error('자동 로그인 실패'))
```

**React 이관**: UI가 이 큐를 읽지 않으므로 **Zustand조차 필요 없다.**
`apiClient.ts` 모듈 내부의 배열 + Zustand `subscribe()`(자동 로그인 상태 감시)로 충분하다.
계획서 3-3의 "`pendingRequests` 삭제"는 **철회**됐다(헤더 방식 유지 결정).

### 2-3. 에러 정규화

```
레거시:  throw error.response
         소비자: error.data.error.errorCode / .message

타깃:    ApiError { message, status, code }
         code ← error.response.data.error.errorCode
```

`apiErrors.ts`의 `ServerErrorBody`가 현재 평면 구조(`{ message?, code? }`)라
**중첩 구조로 확장**해야 한다 (`endpoints.md` E-Q7 — 전 API 공통 확인됨).

에러코드 39종은 `domain-codes.md` §1. 코드→메시지 매핑은 feature별 `constants/`에 `as const`로.

---

## 3. 라우팅 — 재작성

| 레거시                                            | 타깃                                                        |
| ------------------------------------------------- | ----------------------------------------------------------- |
| `router/*.js` 20개 / 121 화면 라우트              | `app/router.tsx` (메인) + `app/routerOpinion.tsx` (opinion) |
| `ROUTE_PATH` 없음 (경로 문자열 직접)              | `shared/constants/routes.ts` `ROUTE_PATH`                   |
| `LayoutBase`/`LayoutPublic`/`LayoutAuth` 3단 중첩 | `ProtectedRoute` + `AppLayout`                              |
| `useLayoutConfig` (route meta → AppBar/BottomNav) | **Phase 5에서 확정**                                        |
| `useNavigate` 파사드 (52 LOC)                     | **제거.** react-router `useNavigate` 직접                   |
| `router.beforeEach` 가드 5단계                    | `ProtectedRoute` + `AuthProvider` + 오프라인 훅             |
| `setupChunkReloadOnError(router)`                 | react-router 버전으로 재작성                                |

전수는 `routes.md`. **경로 문자열을 바꾸지 않는다** — 외부 딥링크·푸시 알림·앱 내 하드코딩이 의존한다.

### 3-1. 가드 이관

`routes.md` §6의 5단계를 순서대로 재현한다.

| 단계                             | 레거시                                                    | 타깃                                          |
| -------------------------------- | --------------------------------------------------------- | --------------------------------------------- |
| 1 오프라인 차단                  | `!navigator.onLine` → 토스트 + 이동 취소                  | `useOnlineStatus`(타깃 기존) + 라우트 가드    |
| 2 `authOptional` 통과            | meta 플래그                                               | 해당 라우트를 `ProtectedRoute` **밖에** 배치  |
| 3 미인증 차단                    | localStorage `aptInfo`+`accessToken` 존재 확인 → `/intro` | `ProtectedRoute`                              |
| 4 로그인 상태로 공개 라우트 진입 | `getLoginInfo()` → 네이티브 전송 → `/main`                | `AuthProvider` 또는 공개 라우트 래퍼          |
| 5 뒤로가기 차단 3곳              | `popstate` 감지                                           | `/main`·`/mypage`·`/fire-inspection/complete` |

> 4단계가 까다롭다 — **라우팅 중에 API를 호출하고 네이티브 메시지를 보낸다.**
> React에서 라우터 가드로 async 작업을 하면 구조가 지저분해진다.
> `AuthProvider`의 부팅 로직으로 올리는 것이 자연스럽다. **Phase 5에서 확정.**

---

## 4. 서버 상태 — 기계적 재작성

| 레거시                                  | 타깃                                                     |
| --------------------------------------- | -------------------------------------------------------- |
| `lib/queries/<domain>/useGetXxx.js`     | `features/<domain>/queries/xxxQuery.ts` (`queryOptions`) |
| `lib/queries/<domain>/usePostXxx.js`    | `features/<domain>/queries/usePostXxx.ts`                |
| `lib/queries/common/useInfiniteList.js` | `shared/hooks/useInfiniteList.ts`                        |
| `@tanstack/vue-query`                   | `@tanstack/react-query`                                  |

전수·키 목록은 `query-keys.md`.

### 4-1. ⚠️ v4 `invalidateQueries` 28곳

```js
queryClient.invalidateQueries(['x']) // v4 — v5에서 동작 안 함
queryClient.invalidateQueries({ queryKey: ['x'] }) // v5
```

파일·라인 전수는 `query-keys.md` §1. **놓치면 조용히 캐시가 안 지워진다.**

### 4-2. `useInfiniteList` 이식

19종(미출차 제외 후 **18종**)이 공유하는 팩토리. 동작 명세는 `query-keys.md` §2.

보존할 것: 페이지 크기 10, `initialPageParam: 0`, `getNextPageParam` 조건,
`select`의 평탄화 + `pages[0]` 기준 `pageable` 추출, `resetCache()` 접두사 매칭,
**`Object.values(additionalParams)`로 키를 만드는 방식**(순서 의존이지만 캐시 동작이 달라지므로 유지).

### 4-3. ⚠️ QueryClient 기본값 — 레거시로 되돌린다

`decisions/tech-choices.md` 결정.

| 항목                                 | 타깃 현재           | **변경 후**                                |
| ------------------------------------ | ------------------- | ------------------------------------------ |
| `queries.retry`                      | 4xx 0회 / 그 외 2회 | **0**                                      |
| `queries.staleTime`                  | 60,000              | **0**                                      |
| `queries.throwOnError`               | `true`              | **`false`**                                |
| `mutations.retry`                    | `false`             | `false` (동일)                             |
| `MutationCache.onError` 전역 토스트  | 켜짐                | **끈다**                                   |
| `QueryCache.onError` 오프라인 토스트 | 켜짐                | **유지** (레거시도 오프라인 토스트가 있다) |

전역 토스트를 켜둔 채 레거시 모달을 붙이면 **모달 + 토스트가 이중으로** 뜬다.

---

## 5. 클라이언트 상태 — 대부분 폐기

`stores/` 13개 중 실제로 Zustand로 넘어가는 것은 **6개**다.

| 레거시 스토어                                        | 처리                  | 타깃                                                                                       |
| ---------------------------------------------------- | --------------------- | ------------------------------------------------------------------------------------------ |
| `authPermission.js` (= `useAuthStorage` 166 LOC)     | **이관**              | `shared/stores/authStore.ts` + `tokenStore.ts`. ⚠️ **localStorage 키·직렬화 그대로** (R13) |
| `fontSize.js` (+ `useFontSizeStorage`)               | **이관**              | `shared/stores/` + `--font-scale` CSS 변수                                                 |
| `auth.js` (가입 위저드 `signUpInfo`)                 | **이관**              | `features/auth/stores/`                                                                    |
| `aptMall.js` (주문 폼 draft)                         | **이관**              | `features/aptMall/stores/`                                                                 |
| `movingHouse.js` (폼 draft)                          | **이관**              | `features/movingHouse/stores/`                                                             |
| `apass.js` (`isApassLoading`)                        | **이관**              | `features/apass/stores/`                                                                   |
| `survey.js` / `vote.js`의 **cert 부분**              | **이관** (persist)    | 각 feature `stores/`                                                                       |
| `survey.js` / `vote.js`의 **detail 부분**            | ⚠️ **폐기**           | 서버 데이터 → TanStack Query로                                                             |
| `board.js` (86) — 스토어 안에 vee-validate `useForm` | ⚠️ **분해**           | RHF `FormProvider`로                                                                       |
| `repair.js` (82) — 동일                              | ⚠️ **분해**           | 〃                                                                                         |
| `pendingRequests.js`                                 | **폐기** (스토어로서) | `apiClient.ts` 내부 큐로 (§2-2)                                                            |
| `resident.js`                                        | **폐기**              | 전체 주석 처리 상태                                                                        |
| `index.js` (pinia + Sentry 플러그인)                 | **폐기**              | Sentry는 다르게 배선                                                                       |

### 5-1. ⚠️ `board.js` · `repair.js` 폼 스토어 분해

레거시는 **전역 스토어 안에 vee-validate `useForm()`을 통째로** 넣어두고,
여러 화면(작성·수정·상세)이 같은 폼 인스턴스를 공유한다.

```js
// stores/board.js — 안티패턴
export const useBoardFormStore = defineStore('boardForm', () => {
  const { values, errors, handleSubmit } = useForm({ ... })  // ← 스토어 안의 폼
  const submitHandler = ref(null)
  const submitProgressPercent = ref(0)
  ...
})
```

**React 이관 방침**: 폼 상태는 RHF가 소유하고, 화면 트리에 `FormProvider`로 내린다.
스토어에는 **폼이 아닌 것만** 남긴다(업로드 진행률, 카테고리 목록 등).

`.vue` 파일이 `repairFormStore.errors.xxx`처럼 스토어에서 에러를 직접 읽는 곳이 있으므로
(`RepairFormDetail.vue:93,111,128`), **화면 구조까지 함께 봐야 한다.** Phase 6에서 도메인 단위로.

### 5-2. 이벤트 버스

`mitt` 싱글턴(5 LOC)이 네이티브 콜백 전달에 쓰인다.
타깃 CLAUDE.md의 "라이브러리 임의 추가 금지"에 따라 **자체 구현**한다 — 5줄짜리다.
`shared/lib/native/` 내부에 두고 외부로 노출하지 않는다.

---

## 6. Composable 31개 → React 훅

로직은 대부분 1:1로 옮겨진다. **`watch` 87곳 + `watchEffect` 8곳이 실제 공수다.**

### 6-1. `watch` 변환 판단 기준 (Phase 5 레시피에 명문화)

```
1. 파생 상태인가?        → 렌더 중 계산. useEffect 금지
2. 이벤트 응답인가?      → 핸들러 안에서 처리
3. 외부 시스템 동기화인가? → useEffect + cleanup
```

기계적으로 `useEffect`로 옮기면 **대부분 안티패턴**이 된다 (`docs/conventions/06-react.md`,
`exhaustive-deps: error`).

### 6-2. 주요 composable 처리

| 레거시                                        | 처리                                                                   |
| --------------------------------------------- | ---------------------------------------------------------------------- |
| `useNavigate.js` (52)                         | **제거** — react-router `useNavigate` 직접                             |
| `useLayoutConfig.js` (58)                     | Phase 5에서 표현 방식 확정                                             |
| `useToast.js` (26) — 모듈 싱글턴 ref          | sonner `toast()` 직접                                                  |
| `useNativeBackButton.js` (105)                | 타깃 `useNativeBackButton.ts` **재작성** (`CALLBACK_GO_BACK` 구독)     |
| `useInfiniteScrollPosition.js` (89)           | VueUse `useScroll` → 자체 구현. Phase 5 패턴                           |
| `useTextareaAutoResize.js` (52)               | `nextTick` → `useLayoutEffect`                                         |
| `useKoreanTimeAgo.js` (34)                    | VueUse `useTimeAgo` → `date-fns` `formatDistanceToNow` + 한국어 로케일 |
| `useMainCardLayout.js` (242)                  | 메인 카드 그리드. Vue 컴포넌트 맵 → React 컴포넌트 맵                  |
| `useFireInspectionForm.js` (309)              | 최대 크기. RHF로 재작성                                                |
| `useSurveyForm`/`useVoteForm` + `*OptionItem` | `provide`/`inject` → RHF `FormProvider` 또는 Context                   |
| `storage/useAuthStorage.js` (166)             | Zustand persist. **키·직렬화 보존**                                    |
| `useAlarmSetting.js` (272)                    | 훅 8개 조합. 그대로                                                    |
| 나머지                                        | 1:1                                                                    |

### 6-3. `@vueuse/core` 대체

| VueUse       | 대체                                                  |
| ------------ | ----------------------------------------------------- |
| `useStorage` | Zustand `persist` 또는 자체 래퍼 (**키·직렬화 보존**) |
| `useScroll`  | 자체 구현                                             |
| `useTimeAgo` | `date-fns`                                            |

> 타깃엔 `usehooks-ts` 같은 훅 라이브러리가 없다. **필요한 것만 자체 구현**한다.

---

## 7. 네이티브 브릿지 — 재작성 (프로토콜 100% 보존)

`native-protocol.md` §4 전체가 사양이다. 요약:

| 레거시                                                       | 타깃                                        |
| ------------------------------------------------------------ | ------------------------------------------- |
| `natives/native.js` (전송/수신 계층)                         | `shared/lib/native/bridge.ts` ⚠️ **재작성** |
| `natives/common.js` (179)                                    | `shared/lib/native/common.ts`               |
| `natives/auth.js` · `apass.js` · `face.js` · `lobbyPhone.js` | 동명 파일                                   |
| `constants/nativeKeys.js`                                    | `shared/constants/native.ts` (`as const`)   |

**보존 필수 11항목**은 `native-protocol.md` §4-4.
특히 **`window.CALLBACK_*` 전역 함수 노출 방식**과 **`JsInterface` 핸들러명**은 앱 계약이다.

`natives/common.js`의 푸시 딥링크가 **라우터 싱글턴을 직접 import**하는 문제는
이벤트 발행 → 앱 레벨 `useNavigate` 구조로 푼다. 라우터 준비 전 도착 처리는 Phase 5(N-Q3).

---

## 8. 폼 — vee-validate → react-hook-form

| 레거시                                | 타깃                                      |
| ------------------------------------- | ----------------------------------------- |
| `vee-validate` `useForm`/`useField`   | `react-hook-form`                         |
| `@vee-validate/zod` `toTypedSchema()` | `@hookform/resolvers/zod` `zodResolver()` |
| `defineRule`/전역 규칙                | zod 스키마로 일원화                       |
| `formErrorFocus.js`                   | RHF `setFocus`                            |
| 동적 스키마 팩토리                    | `useMemo`로 감싸기                        |

zod 3→4 변환은 `zod-migration.md`. 폼 컴포넌트(`InputBase`·`InputPassword` 등)가
`useField`에 직접 묶여 있어 **컴포넌트와 폼을 함께 재작성**해야 한다(§9).

---

## 9. 공용 컴포넌트 38개

| 레거시                                                                                                                | 처리                                                                     |
| --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `ButtonBase` (141)                                                                                                    | shadcn `button` + CVA 래퍼. **레거시 color/size 변형 그대로**            |
| `ModalBase` (30) · `ModalButton` (140) · `ModalPage` (54) · `ModalImageViewer` (72)                                   | Base UI `Dialog` 래퍼 (`docs/11-overlay.md`)                             |
| `DrawerBase` (73) · `DrawerImages` · `DrawerList` · `DrawerMonth` (137)                                               | Base UI `Sheet` 래퍼. `DrawerMonth`는 자체 구현                          |
| `InputBase` (98) · `InputPassword` (88) · `InputSearch` · `InputCheckbox` · `InputRadioDual` · `InputRadioList` (160) | shadcn `input`/`checkbox`/`radio-group` + RHF 연결                       |
| `TabBase` (74) · `TabCategory` (45)                                                                                   | 자체 구현 (인디케이터 애니메이션이 offset 측정 기반)                     |
| `ChipBase` (102)                                                                                                      | CVA. **18색 × fill/outline 변형 그대로**                                 |
| `ToggleBase` (39)                                                                                                     | shadcn `switch`                                                          |
| `CanvasSign` (107)                                                                                                    | **자체 구현** — 터치 서명 캔버스                                         |
| `SpinnerCircle` (26) · `SpinnerDots` (43) · `SkeletonBase` (13)                                                       | 자체 구현 / shadcn `skeleton`                                            |
| `ToastBase` · `ToastContainer`                                                                                        | sonner로 대체                                                            |
| `TextError` · `TextEmpty` · `TextTitle`                                                                               | 자체 (간단)                                                              |
| `TermsCheckboxList` (55) · `FileAttachment` · `IframeBase` · `CertResponse`                                           | 자체                                                                     |
| `layouts/` 6개                                                                                                        | `app/layouts/` — `AppBar`·`BottomNavigation`은 타깃에 이미 있으나 미배선 |

> **shadcn을 쓰더라도 최종 렌더 결과가 레거시와 같아야 한다.**
> 기본 스타일이 다르면 래퍼에서 레거시 클래스로 덮는다 (`decisions/tech-choices.md`).

---

## 10. 스타일 — 토큰 이식

| 레거시                                                    | 타깃                               |
| --------------------------------------------------------- | ---------------------------------- |
| `tailwind.config.js` `theme.extend.colors` (207개)        | `src/index.css` `@theme`           |
| `addUtilities` 타이포 (496줄, `.pretendard-15Regular` 등) | `@utility`. **클래스명 유지 필수** |
| `theme.screens.sm: '392px'`                               | `@theme`                           |
| `fontFamily.pretendard` / `outfit`                        | `@theme`                           |
| `src/input.css` (133)                                     | `src/index.css` 전역 스타일        |
| `src/styles/fontSize.css` (20)                            | `--font-scale` 0.8~1.2             |
| `src/styles/globalColor.scss` (66)                        | SCSS 폐기 → CSS 변수로 흡수        |
| `src/styles/vue-quill.snow.css` (937)                     | 그대로 이식 (Quill 본문 렌더용)    |
| `<style scoped>` 10곳                                     | Tailwind 클래스로 흡수             |

⚠️ `docs/conventions/14-styling.md`의 "시맨틱 토큰만, hex 금지"가 레거시 토큰 체계와 충돌한다.
**등가 이관 우선 — 문서를 이 프로젝트에 맞게 고친다.**

라우트 meta의 `appBarBackgroundColor` hex 직접 지정 4곳(`#f9fafb` ×3, `#f3f4f6`, `rgba(248,248,248)`)도
그대로 유지한다.

---

## 11. 빌드·인프라

| 항목                                                     | 처리                                                          |
| -------------------------------------------------------- | ------------------------------------------------------------- |
| Vite 멀티 엔트리                                         | `main.tsx` / `main-opinion.tsx` (`decisions/tech-choices.md`) |
| 별칭 `@views`·`@components`                              | **폐기** — 타깃은 `@/`만 (`docs/09-imports.md`)               |
| `manualChunks` (패키지별 vendor 분리 + Sentry 단일 청크) | 이관 검토. Sentry 초기화 순서 이슈 때문이었음                 |
| `sentryVitePlugin`                                       | **추가 필요** (타깃 미설정)                                   |
| `jsconfig.json`                                          | `tsconfig.json`으로 대체 (이미 있음)                          |
| `postcss.config.js`                                      | Tailwind 4 `@tailwindcss/vite`로 대체 (이미 있음)             |
| `.env.*`                                                 | `env-vars.md` §4 — 변수 8개 추가, 스키마 2개 분리             |
| `eslint.config.js`                                       | feature마다 `import/no-restricted-paths` zone 추가            |
| CI (`aws-deploy.yml`)                                    | Phase 7. `env-vars.md` §5 체크리스트                          |

---

## 12. 의존성 변화

`decisions/tech-choices.md` 요약 + 프레임워크 무관 이식분.

### 추가

| 패키지                                 | 용도                                            |
| -------------------------------------- | ----------------------------------------------- |
| `react-day-picker` (shadcn `calendar`) | 날짜 선택기 4화면                               |
| `dompurify`                            | `v-dompurify-html` 31곳 대체                    |
| `swiper`                               | 메인 스와이퍼 2곳 (React 바인딩 `swiper/react`) |
| `qrcode`                               | 로비폰 QR                                       |
| `html2canvas`                          | 이미지 캡처                                     |
| `quill-delta-to-html`                  | 게시판 본문 렌더                                |
| `he`                                   | HTML 엔티티 디코딩                              |
| `posthog-js`                           | 분석                                            |
| `@sentry/vite-plugin`                  | 소스맵 업로드                                   |
| `lodash-es`                            | 사용처 확인 후 — 대부분 네이티브로 대체 가능    |

### 추가 없음 (타깃 기설치 활용)

`recharts`(← apexcharts) · `@base-ui/react` Dialog(← sweetalert2) · `date-fns` · `zod` ·
`axios` · `qs` · `@tanstack/react-query` · `zustand` · `react-hook-form`

### 폐기

`vue`·`vue-router`·`pinia`·`@tanstack/vue-query`·`@sentry/vue`·`@vueuse/core`·`vee-validate`·
`@vee-validate/zod`·`@vuepic/vue-datepicker`·**`v-calendar`(미사용)**·`vue-dompurify-html`·
`apexcharts`·`sweetalert2`·`mitt`·`eruda`·`slides-grab`

> **라이브러리 추가는 Phase 4 착수 시 한 번에 승인받는다** (타깃 CLAUDE.md 규칙).

---

## 13. 보존 필수 — 고치면 깨지는 것

| #   | 항목                                                    | 문서                      |
| --- | ------------------------------------------------------- | ------------------------- |
| 1   | 관리비 쿼리 파라미터 오타 `startDateTIme`/`endDateTIme` | `endpoints.md` E-6        |
| 2   | `SAVE_FILE`의 `?filName=` 접미                          | `native-protocol.md` P8   |
| 3   | 권한 필드 `locAlawaysOn`·`btTransmitt` (앱팀 합의 오타) | 〃 P7, `domain-codes.md`  |
| 4   | 에러코드 `*_MISS_MATCH` 철자                            | `domain-codes.md` §1-5    |
| 5   | localStorage 키 6종 + 토큰 직렬화 방식                  | `auth-strategy.md` (R13)  |
| 6   | 브릿지 타입 문자열 24종 + `JsInterface` + `{type,data}` | `native-protocol.md` §4-4 |
| 7   | 라우트 경로 문자열 121개                                | `routes.md`               |
| 8   | 정규식 7종                                              | `domain-codes.md` §3      |
| 9   | 모달·토스트·빈 상태 문구 전부                           | `domain-codes.md` §4      |
| 10  | 재발급 트리거가 401이 아니라 errorCode                  | §2-1                      |
| 11  | 페이지 크기 10, `useInfiniteList` 키 조립 방식          | `query-keys.md` §2        |

---

## 14. Phase 4 착수 순서

의존 관계상 이 순서를 지켜야 한다.

```
1. 의존성 승인·설치 + env 스키마 확장 + eslint zone 준비
2. 디자인 토큰 이식 (@theme / @utility)        ← 컴포넌트의 전제
3. HTTP 레이어 재작성 (apiClient/tokenStore/apiErrors/queryClient)
4. 네이티브 브릿지 재작성                       ← 인증 플로우가 의존
5. 인증 슬라이스 (authStore + features/auth)
6. 아파트 컨텍스트(aptInfo) 배치 결정           ← 쿼리 키 대부분이 의존
7. 오버레이 래퍼 + 에러 모달(showErrorModal)
8. shadcn 컴포넌트 설치 + 공용 컴포넌트 38개
9. 레이아웃 셸 배선 (AppBar/BottomNavigation)
10. useInfiniteList 이식
11. features/dashboard 데모 제거
```

**완료 조건**: 로그인 → 메인 진입이 실제 API로 동작.
`pnpm typecheck && pnpm lint && pnpm format:check && pnpm test` 통과.
