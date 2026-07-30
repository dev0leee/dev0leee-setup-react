# 도메인 명세 — opinion 앱 (외부 링크용 비회원 투표·설문)

> 기준 SHA `6d5bf22` · 엔트리·라우터·레이아웃·빌드 설정
> 타깃: `src/main-opinion.tsx` + `src/app/routerOpinion.tsx` + `src/config/envOpinion.ts`
> 라우트 **18개** (`routes.md` §4) · 화면 명세는 `vote.md`·`survey.md`·`exception.md`에 있다

**이 문서는 화면이 아니라 "앱 껍데기"를 다룬다.**

opinion 앱은 **같은 코드베이스에서 빌드되는 두 번째 SPA**다. 문자·알림톡의 딥링크를 받아
로그인 없이 투표·설문에 참여하게 하는 용도다.

| 항목      | 메인 앱                                    | opinion 앱                                   |
| --------- | ------------------------------------------ | -------------------------------------------- |
| 엔트리    | `MainApp.vue`                              | `OpinionApp.vue`                             |
| 라우터    | `router/index.js`                          | `router/index-opinion.js`                    |
| 레이아웃  | `LayoutBase` → `LayoutPublic`/`LayoutAuth` | `LayoutOpinionBase`                          |
| 라우트    | 99개                                       | **18개**                                     |
| 빌드 출력 | `dist/main`                                | `dist/opinion`                               |
| 빌드 모드 | `development` / `production`               | `development.opinion` / `production.opinion` |
| env 변수  | 11개                                       | **3개** (`env-vars.md` §1-2)                 |
| 인증      | 필수 (자동 로그인)                         | **없음** (KMC 본인인증만)                    |
| 바텀네비  | 있음                                       | **없음**                                     |
| 폭        | 전체                                       | **`max-w-[480px]` 중앙 정렬**                |

> ⚠️ **확인 항목은 `O-Q*`를 쓴다.**
>
> **화면별 명세는 이 문서에 없다.** 아래를 참조한다.
>
> | 대상                               | 문서                   |
> | ---------------------------------- | ---------------------- |
> | 투표 opinion 라우트 7개            | `vote.md` (VT1′~VT10)  |
> | 설문 opinion 라우트 8개            | `survey.md` (SV1′~SV9) |
> | 에러·404·의견 메인 3개             | `exception.md` (E4~E7) |
> | 라우트 18개 전수 (path·meta·eager) | `routes.md` §4         |
> | 경로 충돌 11건                     | `routes.md` §5         |
> | env 변수 3개                       | `env-vars.md` §1-2     |

---

## 1. 엔트리 분기 — `main.js`

**두 앱이 파일 하나를 공유한다.**

```js
const common = (App, router) => {
  const app = createApp(App)
  initSentry({ app, router })
  app.config.errorHandler = (err) => {
    posthog.captureException(err)
  }

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: 0 },
      mutations: { retry: 0 },
    },
  })

  app.use(pinia)
  app.use(VCalendar, {})
  app.use(VueQueryPlugin, { queryClient })
  app.component('VueDatePicker', VueDatePicker)
  app.use(VueDOMPurifyHTML)
  app.use(router)
  app.mount('#app')
}

if (import.meta.env.MODE.includes('opinion')) {
  common(OpinionApp, OpinionRouter)
} else {
  common(MainApp, MainRouter)
}
```

### 두 앱이 공유하는 것 (전수)

| 항목                                | 비고                                                            |
| ----------------------------------- | --------------------------------------------------------------- |
| `initPostHog()`                     | 모듈 최상단 — **분기 전에 실행**된다                            |
| `initSentry({ app, router })`       | 라우터를 넘겨 라우팅 계측까지 붙는다                            |
| `app.config.errorHandler`           | PostHog `captureException`                                      |
| Pinia (13개 스토어 전부)            | opinion이 쓰지 않는 스토어까지 등록된다                         |
| `QueryClient`                       | **`retry: 0` (쿼리·뮤테이션 모두), `staleTime` 미지정 → `0`**   |
| `VCalendar`                         | 🔴 **미사용** — 제거 확정 (`tech-choices.md` 0-5)               |
| `VueDatePicker` (전역 컴포넌트)     | opinion은 달력을 쓰지 않는다                                    |
| `VueDOMPurifyHTML`                  | opinion도 `v-dompurify-html`을 쓴다 (투표·설문 본문)            |
| `styles/fontSize.css` · `input.css` | 폰트 배율 CSS도 opinion에 들어간다                              |
| **네이티브 브릿지 4모듈**           | `apass` · `auth` · `face` · `lobbyPhone` **side-effect import** |

🔴 **`main.js`가 `window.CALLBACK_*` 전역 함수 등록 모듈 4개를 무조건 import한다.**

```js
import '@/natives/apass.js'
import '@/natives/auth.js'
import '@/natives/face.js'
import '@/natives/lobbyPhone.js'
```

opinion 앱은 웹뷰가 아니라 **일반 브라우저에서 열리는데도** A-PASS·안면인식·로비폰 콜백이
`window`에 등록된다. 동작에는 영향이 없지만 **번들에 브릿지 코드가 들어간다.**

**타깃에서는 엔트리를 나누므로 자연스럽게 해결된다** — `main-opinion.tsx`가 브릿지를 import하지 않으면 된다.
⚠️ 단 **`OpinionApp`이 `CALLBACK_GO_BACK`을 쓴다**(§3). 그 하나는 필요하다.

### eruda(모바일 콘솔)는 opinion에 안 붙는다

```js
if (import.meta.env.MODE === 'development') {
  import('eruda').then(({ default: eruda }) => eruda.init())
}
```

**`===` 정확 비교**이므로 `development.opinion`은 걸리지 않는다.
`.includes('development')`가 아니다. **의도인지 불명이지만 그대로 옮긴다** (타깃은 eruda를 안 쓴다).

### `QueryClient` 기본값 — `tech-choices.md` 결정의 근거

```js
queries: { retry: 0 },
mutations: { retry: 0 },
```

**`staleTime`·`gcTime`·`throwOnError`·전역 `onError` 모두 미지정 → TanStack 기본값.**
즉 `staleTime: 0`, 전역 토스트 없음, `throwOnError: false`.

**타깃 템플릿의 `queryClient.ts`(전역 mutation 토스트 · `throwOnError: true` · `retry: 2` · `staleTime: 60s`)를
이 값으로 되돌리는 것이 `decisions/tech-choices.md`에서 이미 확정됐다.**
**opinion 앱도 같은 `queryClient` 설정을 쓴다.**

---

## 2. 빌드 설정 — `vite.config.js`

```js
export default defineConfig(({ mode }) => {
  const isOpinionExternal = mode.includes('opinion');
  return {
    plugins: [vue(), vueJsx(), VueDevTools(), sentryVitePlugin({ … })],
    base: '/',
    resolve: { alias: { '@': …/src, '@views': …/src/views, '@components': …/src/components } },
    css: { preprocessorOptions: { scss: { additionalData: `@import "@/styles/globalColor.scss";` } } },
    server: { port: 3000 },
    build: {
      rollupOptions: {
        output: {
          dir: isOpinionExternal ? 'dist/opinion' : 'dist/main',
          manualChunks: (id) => { … },
        },
      },
      sourcemap: 'hidden',
    },
  };
});
```

### 두 빌드의 유일한 차이는 출력 디렉터리다

| 항목        | 값                                                    |
| ----------- | ----------------------------------------------------- |
| `dir`       | `dist/opinion` vs `dist/main`                         |
| 엔트리 HTML | **동일한 `index.html`** — 엔트리 분기는 런타임 `MODE` |
| 플러그인    | 동일                                                  |
| 청크 전략   | 동일                                                  |

🔴 **엔트리를 빌드 타임에 나누지 않고 `main.js` 안에서 런타임 분기한다.**
즉 **두 빌드 모두 `MainApp`·`OpinionApp`·양쪽 라우터를 전부 번들에 포함**할 가능성이 있다.

```js
import MainApp from '@/MainApp.vue'
import OpinionApp from '@/OpinionApp.vue'
import OpinionRouter from '@/router/index-opinion.js'
import MainRouter from '@/router/index.js'
```

**정적 import 4개가 조건 밖에 있다.** `import.meta.env.MODE`는 빌드 타임 리터럴이므로
Rollup이 `if (…) { A } else { B }` 자체는 접을 수 있지만, **정적 import는 이미 그래프에 들어와 있다.**
라우터 파일들이 lazy `import()`로 뷰를 참조하므로 **눈에 띄는 것은 라우터 정의와 eager 뷰 정도**다.

**타깃은 엔트리를 물리적으로 분리한다** (`main.tsx` / `main-opinion.tsx` + `index.html` 2개).
그러면 이 낭비가 사라진다 — **번들 크기가 레거시보다 작아지는 것은 등가성 위반이 아니다.**
→ `O-Q1` (실측 확인)

### 청크 전략

```js
manualChunks: (id) => {
  if (id.indexOf('node_modules') !== -1) {
    if (id.includes('@sentry')) return 'vendor-sentry';   // 초기화 순서 문제 방지
    const module = id.split('node_modules/').pop().split('/')[0];
    return `vendor-${module}`;
  }
  return null;
},
```

**node_modules 패키지마다 별도 청크**를 만든다 (`vendor-vue`, `vendor-axios`, …).
`@sentry` 계열만 하나로 묶는다 — **주석에 이유가 적혀 있다** (초기화 순서).

⚠️ **`@scope/name` 패키지가 `@scope`로 잘린다** (`split('/')[0]`).
`@tanstack/vue-query`와 `@tanstack/vue-query-devtools`가 **같은 `vendor-@tanstack` 청크**가 된다.
의도적인지 불명이나 결과적으로 스코프 단위 묶음이 된다.

**타깃 Vite 8은 기본 청크 전략이 다르다.** 이 설정을 그대로 옮길 필요는 없다
(빌드 산출물 구조는 사용자에게 보이지 않는다). → `O-Q2`

### Sentry 소스맵

```js
sentryVitePlugin({
  org: 'smcom', project: 'apt-resident-fe',
  authToken: process.env.SENTRY_AUTH_TOKEN,
  sourcemaps: { filesToDeleteAfterUpload: ['./dist/**/*.map'] },
}),
…
sourcemap: 'hidden',
```

- **`sourcemap: 'hidden'`** — 소스맵을 만들지만 번들에 주석을 남기지 않는다
- **업로드 후 `dist/**/*.map`을 삭제**한다 → S3에 소스가 노출되지 않는다
- **org·project가 하드코딩**돼 있다. `authToken`만 환경변수

🔴 **`filesToDeleteAfterUpload: ['./dist/**/*.map']`가 `dist/main`·`dist/opinion` 둘 다 지운다.**
두 빌드를 순차로 돌리면 각각 자기 디렉터리만 생성되므로 문제는 없다.

### 🚫 이 설정은 이관하지 않는다 (2026-07-30 결정)

> **"일단 sentry는 빼고 하자"** — `@sentry/vite-plugin` 승인 제외 (`tech-mapping.md` §12)

| 레거시                     | 타깃                                   |
| -------------------------- | -------------------------------------- |
| `sentryVitePlugin({ … })`  | **설정하지 않는다**                    |
| `sourcemap: 'hidden'`      | **소스맵을 만들지 않는다**             |
| `filesToDeleteAfterUpload` | 불필요 (애초에 `.map`이 생기지 않는다) |
| `SENTRY_AUTH_TOKEN` Secret | 불필요                                 |

**결과: Sentry에 올라가는 스택트레이스가 난독화 상태로 남는다.** 감수하고 진행한다.

⚠️ **에러 리포팅 자체는 유지된다** — 타깃에 `@sentry/react`가 이미 배선돼 있다
(`package.json` · `src/main.tsx` · `QueryErrorBoundary.tsx`).
빠지는 것은 **소스맵 업로드**뿐이다. (`O-Q3` 소멸)

### SCSS 전역 주입

```js
css: { preprocessorOptions: { scss: { additionalData: `@import "@/styles/globalColor.scss";` } } },
```

**확인 결과 (2026-07-30):**

| 항목                                | 실측                                                 |
| ----------------------------------- | ---------------------------------------------------- |
| `lang="scss"` 블록                  | **8개 파일** (주차 3 · 게시판 2 · 약관 2 · 로그인 1) |
| 그중 **SCSS 전용 문법**을 쓰는 파일 | **1개** — `NoticeDetailView.vue`의 `//` 주석         |
| `globalColor.scss`의 `$` 변수 사용  | 🔴 **0곳** (전수 검색)                               |

**8개 블록의 내용은 `width: calc(100% - 32px)` · `padding: 0 !important` ·
CSS 변수(`--dp-*`) 재정의뿐이다.** SCSS 기능을 실질적으로 쓰지 않는다.

🔴 **`globalColor.scss` 주입은 죽은 설정이다.** **이식하지 않는다.**

> 🎯 **다만 이 파일이 `broken-styles.md` §5의 답을 갖고 있다.**
> `$deep-blue-20: #e6e6ec` · `$bg-gray: #f8f8f8` · `$bg-deep-blue: #fafbfc` —
> **깨진 클래스 이름들이 이 이전 팔레트를 따르고 있었다.**
> Tailwind config로 옮길 때 `deep-blue`·`bg-*` 계열이 누락된 것이다.
> → `broken-styles.md` §5에 반영했다. (`O-Q4` 해소)

### 스크립트 8개

```json
"dev": "vite --host --mode development",
"dev:opinion": "vite --host --mode development.opinion",
"prod": "vite --host --mode production",
"prod:opinion": "vite --host --mode production.opinion",
"build:dev": "vite build --mode development",
"build:dev:opinion": "vite build --mode development.opinion",
"build:prod": "vite build --mode production",
"build:prod:opinion": "vite build --mode production.opinion",
```

**메인/opinion × dev/prod × serve/build = 8개.**
`"start": "vite --host"`는 모드 없이 실행 → `development` 기본값.

⚠️ **`server.port: 3000`** — 타깃 Vite 기본은 5173이다. 등가 대조 시 두 포트를 동시에 띄운다
(계획서 「검증」이 이미 :3000 ↔ :5173으로 정해 뒀다).

---

## 3. `OpinionApp.vue` — 메인과 다른 3가지

```html
<template>
  <LayoutOpinionExternal>
    <RouterView />
    <ToastContainer />
    <VueQueryDevtools />
  </LayoutOpinionExternal>
</template>
```

### 메인(`MainApp.vue`)에는 있고 opinion에는 없는 것

| 항목                                      | 메인 | opinion | 이유                         |
| ----------------------------------------- | ---- | ------- | ---------------------------- |
| 자동 로그인 `watch`                       | ✅   | ❌      | 로그인 개념이 없다           |
| `usePatchLogin` · `useLogoutFlow`         | ✅   | ❌      | 〃                           |
| `nativeEndSplash()` (`onMounted`)         | ✅   | ❌      | 앱 스플래시가 없다           |
| `useNativeBackButton` (`LayoutBase`)      | ✅   | ❌      | 자체 `CALLBACK_GO_BACK` 처리 |
| 앱 종료 모달 (`LayoutBase`)               | ✅   | ❌      | 앱이 아니다                  |
| 폰트 배율 `data-font-size` (`LayoutBase`) | ✅   | ❌      | 접근성 배율 미적용           |
| **`ToastContainer`**                      | ✅   | 🔴 (§4) | —                            |

### opinion에만 있는 것 — `CALLBACK_GO_BACK` 처리

```js
emitter.on(fromNativeKeys.CALLBACK_GO_BACK, () => {
  if (
    getCurrentRoutePath().includes('/vote/form') ||
    getCurrentRoutePath().includes('/vote/completed')
  ) {
    navigateTo(`/vote/${voteCertStore.voteCertInfo.voterUuid}`)
    return
  }
  if (
    getCurrentRoutePath().includes('/survey/form') ||
    getCurrentRoutePath().includes('/survey/completed')
  ) {
    navigateTo(`/survey/${surveyCertStore.surveyCertInfo.participantUuid}`)
    return
  }
  navigateBack()
})
```

| 현재 경로                             | 뒤로가기 목적지                   |
| ------------------------------------- | --------------------------------- |
| `/vote/form*` · `/vote/completed`     | `/vote/{voterUuid}` (상세로 복귀) |
| `/survey/form*` · `/survey/completed` | `/survey/{participantUuid}`       |
| 그 밖                                 | `navigateBack()`                  |

**`voterUuid`·`participantUuid`를 persist 스토어에서 읽는다** (`vote.md` §5 · `survey.md` §5).
KMC 왕복 후에도 유지되므로 동작한다.

> ⚠️ **`emitter.off`가 없다.** App 루트라 언마운트되지 않으므로 실질 누수는 없다.
> 다만 `useNativeBackButton`(메인 앱)과 **같은 키를 다르게 처리**한다 — 두 앱의 뒤로가기 정책이 별개다.
>
> 🔴 **opinion 앱은 브라우저에서 열리는데 `CALLBACK_GO_BACK`은 네이티브 콜백이다.**
> 즉 **이 핸들러는 앱 웹뷰로 opinion URL을 열었을 때만 동작한다.**
> 딥링크를 앱이 인터셉트해 웹뷰로 띄우는 경로가 있다는 뜻이다. → `O-Q5`

---

## 4. 🔴 `LayoutOpinionBase`가 두 번 중첩 렌더된다

### 구조 분석

```js
// index-opinion.js
routes: [
  { path: '/', component: LayoutOpinionBase, children: [ …18개 ] },
]
```

```html
<!-- OpinionApp.vue -->
<LayoutOpinionExternal>
  <!-- = LayoutOpinionBase -->
  <RouterView />
  <!-- 🔴 슬롯 콘텐츠 -->
  <ToastContainer />
  <VueQueryDevtools />
</LayoutOpinionExternal>
```

```html
<!-- LayoutOpinionBase.vue — <slot>이 없다 -->
<div class="bg-defaults-secondary-background-mono">
  <div class="mx-auto h-screen w-screen max-w-[480px] overflow-auto bg-base-b-white shadow-lg">
    <AppBar v-if="layoutConfig.showAppBar" … />
    <main
      :class="`${showBottomNav ? 'h-[calc(100%-67px)]' : 'h-full'} ${showAppBar ? 'pt-6' : ''}`"
    >
      <RouterView v-slot="{ Component, route }">
        <Transition name="fade"><component :is="Component" :key="route.fullPath" /></Transition>
      </RouterView>
    </main>
  </div>
</div>
```

**`LayoutOpinionBase`에 `<slot>`이 없으므로 `OpinionApp`이 넘긴 3개 자식은 전부 버려진다.**
실제로 렌더되는 `RouterView`는 **`LayoutOpinionBase` 안의 것**이다.

vue-router의 `RouterView`는 주입된 depth로 `matched[depth]`를 고른다.

```
OpinionApp
└─ LayoutOpinionBase           (템플릿에서 직접)
   └─ RouterView (depth 0)  →  matched[0] = LayoutOpinionBase   ← 라우트 컴포넌트
      └─ LayoutOpinionBase     (두 번째 인스턴스)
         └─ RouterView (depth 1) → matched[1] = 실제 페이지
```

### 결과 4가지

|   # | 결과                                                                                                 |
| --: | ---------------------------------------------------------------------------------------------------- |
|   1 | **`max-w-[480px] h-screen w-screen overflow-auto bg-base-b-white shadow-lg` 컨테이너가 2중**이다     |
|   2 | `showAppBar: true`인 라우트에서 **`AppBar`가 2개** 렌더된다 (둘 다 `fixed top-0 z-[100]`이라 겹친다) |
|   3 | **`main`의 `pt-6`(24px)이 두 번 적용돼 48px** = `AppBar` 높이 `h-12`와 정확히 일치한다               |
|   4 | 🔴 **`ToastContainer`·`VueQueryDevtools`가 렌더되지 않는다**                                         |

### ③ 이 버그는 "동작을 성립시키는" 버그다

`LayoutAuth`(메인 앱)는 `pt-12`(48px)를 쓴다. `AppBar`가 `h-12`(48px)이므로 맞다.
**`LayoutOpinionBase`는 `pt-6`(24px)뿐이다** — 단독 렌더라면 콘텐츠 상단 24px이 AppBar에 가린다.

**중첩으로 `pt-6`이 두 번 적용되어 48px이 되고, 결과적으로 화면이 맞는다.**

🔴 **중첩을 없애면 콘텐츠가 24px 가려진다.** 타깃에서 구조를 바로잡을 때
**`pt-12`로 함께 고쳐야 화면이 같아진다.** → `O-Q6`

### ④ opinion 앱에는 토스트가 표시되지 않는다

```bash
$ grep -rn "ToastContainer" src
src/OpinionApp.vue:2,47              ← 🔴 버려지는 슬롯 안
src/components/layouts/LayoutBase.vue:3,36   ← 메인 앱만
```

`useToast`는 **모듈 스코프 싱글턴 ref**다.

```js
const toast = ref(null);        // 모듈 최상단
const useToast = () => {
  const showToast = (message, duration = 3000) => { … toast.value = message; … };
  return { toast, showToast };
};
```

`showToast()`는 값을 넣지만 **그 값을 그리는 `ToastContainer`가 opinion 앱에 없다.**

**즉 `index-opinion.js`의 오프라인 가드가 아무것도 보여주지 못한다.**

```js
router.beforeEach(async () => {
  const { showToast } = useToast()
  if (!window.navigator.onLine) {
    showToast('네트워크 상태를 확인해주세요') // 🔴 보이지 않는다
    return false
  }
  return true
})
```

**오프라인에서 opinion 앱은 화면 전환이 조용히 막힌다** — 사용자는 이유를 알 수 없다.

⚠️ `ToastContainer`는 `<Teleport to="body">`를 쓰므로 **렌더만 되면 중첩과 무관하게 정상 동작한다.**
타깃에서 슬롯을 배선하거나 레이아웃에 직접 넣으면 해결된다.

🔴 **이것은 등가성 판단이 필요하다** — 고치면 **레거시에 없던 토스트가 나타난다.** → `O-Q7`

### 다른 opinion 토스트 호출부

| 호출부                                        | 문구                           | 현재 보이는가 |
| --------------------------------------------- | ------------------------------ | ------------- |
| `index-opinion.js` 오프라인 가드              | `네트워크 상태를 확인해주세요` | ❌            |
| `vote.md`·`survey.md`의 폼 토스트 (있는 경우) | 각 문서 참조                   | ❌            |

→ **opinion 앱에서 `showToast`를 부르는 모든 곳이 무음이다.**

---

## 5. `index-opinion.js` — 라우터

### 라우트 구성 (18개)

```js
{ path: '/', component: LayoutOpinionBase, children: [
    { path: '',                  name: '의견 메인',  component: OpinionExternalNotFoundView },
    { path: 'error',             name: '에러페이지', component: OpinionExternalErrorView },
    { path: ':pathMatch(.*)*',   name: '404페이지',  component: OpinionExternalNotFoundView },
    ...VoteExternalIndex,      // 7개 → vote.md
    ...SurveyExternalIndex,    // 8개 → survey.md
] }
```

**합계 3 + 7 + 8 = 18.** `routes.md` §4의 #104~#121과 일치한다.

> ⚠️ **루트(`''`)가 NotFound 화면이다.** opinion 앱은 딥링크로만 진입한다 — 홈이 없다.
> ⚠️ **`:pathMatch(.*)*`가 3번째로 선언됐는데 그 뒤에 실제 라우트들이 온다.**
> vue-router 4는 **선언 순서가 아니라 랭킹**으로 매칭하므로 catch-all이 먼저 있어도 정확한 경로가 이긴다.
> **타깃 react-router 7도 랭킹 기반이라 동일하다.** 다만 **정적 경로를 먼저 선언하는 관례는 유지한다**
> (`survey.md`의 `// 동적 경로는 맨 뒤에 배치` 주석 참조).
> ⚠️ **eager 라우트 4개** — `#104`(의견 메인) · `#105`(에러) · `#106`(404) · `#114`(`/survey/list`).
> `routes.md` 확인 항목 B에 기록됨. **타깃은 `/login` 외 전부 lazy가 기본**이라 판단이 필요하다.

### 가드는 오프라인 체크 1개뿐이다

```js
router.beforeEach(async () => {
  const { showToast } = useToast()
  if (!window.navigator.onLine) {
    showToast('네트워크 상태를 확인해주세요')
    return false
  }
  return true
})
```

**메인 앱 가드가 하는 나머지 전부가 없다** (`routes.md` §6 참조).

| 메인 앱 가드                                                | opinion |
| ----------------------------------------------------------- | ------- |
| 오프라인 차단                                               | ✅      |
| `meta.authOptional` 통과                                    | ❌      |
| `requiresAuth` + 토큰 검사 → 인트로 리다이렉트              | ❌      |
| 로그인 상태에서 공개 페이지 → 메인 리다이렉트               | ❌      |
| `nativeSendInitialResidentInfo` 전송                        | ❌      |
| `/main`·`/mypage`·`/fire-inspection/complete` popstate 차단 | ❌      |

⚠️ **`async`인데 `await`가 없다.** 무해.

### 메인 앱에는 있고 opinion에는 없는 라우터 부가 기능

```js
// router/index.js 에만 있다
setupChunkReloadOnError(router) // lazy 청크 로드 실패 → 리로드 후 SPA 이동
router.afterEach(() => {
  reloadIfNewVersion()
}) // 배포 감지 → 리로드
```

🔴 **opinion 앱은 청크 로드 실패 복구도, 신규 배포 감지도 하지 않는다.**
외부 링크로 들어온 사용자가 **구버전 청크를 요청하면 흰 화면**이 된다.

**등가 이관 원칙상 지금은 추가하지 않는다.** → `O-Q8`

---

## 6. `LayoutOpinionBase` 스타일 전수

| 요소     | 클래스                                                                            |
| -------- | --------------------------------------------------------------------------------- |
| 외곽     | `bg-defaults-secondary-background-mono`                                           |
| 컨테이너 | `mx-auto h-screen w-screen max-w-[480px] overflow-auto bg-base-b-white shadow-lg` |
| `main`   | `h-full` (또는 바텀네비 시 `h-[calc(100%-67px)]`) + `showAppBar`면 `pt-6`         |
| 전환     | `<Transition name="fade">` + `:key="route.fullPath"`                              |

- **데스크톱에서 480px 중앙 정렬 + 그림자** — 외부 링크를 PC에서 열 수 있으므로 모바일 폭을 흉내낸다
- 🔴 **`w-screen`(100vw)** — 스크롤바가 있는 데스크톱에서 **가로 오버플로**가 생긴다.
  `max-w-[480px]`가 실제 폭을 제한하므로 눈에 띄지는 않는다
- **`h-[calc(100%-67px)]` 바텀네비 분기가 있지만 opinion 라우트에 `showBottomNav: true`가 하나도 없다** → 죽은 분기
- **`AppBar`가 opinion 모드에서 `w-full max-w-[480px]`로 바뀐다**

```js
// AppBar.vue
const isOpinionExternal = import.meta.env.MODE.includes('opinion');
…
:class="`fixed top-0 z-[100] … ${isOpinionExternal ? 'w-full max-w-[480px]' : 'w-full'}`"
```

🔴 **`AppBar`가 `import.meta.env.MODE`를 직접 읽는다.**
타깃 절대 규칙 1(`import.meta.env` 직접 읽기 금지, 공식 예외 2곳)과 충돌한다.

**해결책 2가지**

| 방안                                    | 평가                                              |
| --------------------------------------- | ------------------------------------------------- |
| A. `env` 객체에 `isOpinion` 플래그 추가 | 규칙 준수. 다만 zod transform이라 트리셰이킹 불가 |
| **B. `AppBar`에 prop/Context로 내린다** | **권장** — 레이아웃이 이미 두 벌이므로 자연스럽다 |

→ `O-Q9`

⚠️ **`AppBar`가 `MODE`를 읽는 곳이 opinion 관련 유일한 런타임 분기다.**
나머지 opinion 분기(`vote.md`·`survey.md`의 `isOpinionExternal`)도 같은 패턴이므로
**전부 같은 방식으로 처리한다** (`routes.md` §5·`env-vars.md` §2-1과 연동).

---

## 7. opinion 화면 2개 (`exception.md` E4·E6·E7 상세)

`exception.md`가 이미 다루지만 **opinion 앱의 유일한 자체 화면**이므로 마크업을 여기 남긴다.

### `OpinionExternalNotFoundView` (E5·E6·E7 공용)

```html
<div class="relative h-full w-full">
  <img
    src="/assets/images/aptmantIntro.svg"
    alt="아파트먼트 인트로 이미지"
    class="absolute top-0 left-0 w-full"
  />
  <div class="flex h-2/3 items-center justify-center">
    <img src="/assets/images/aptmantLogoLong.png" alt="아파트먼트 로고" class="w-60" />
  </div>
  <div class="flex flex-col items-center justify-center gap-5">
    <img src="/assets/icons/InfoCircleGray.svg" alt="경고 아이콘" class="w-10" />
    <p class="pretendard-20Regular text-defaults-secondary-text-secondary">
      경로가 올바르지 않습니다
    </p>
  </div>
</div>
```

**문구: `경로가 올바르지 않습니다`** · 아이콘 `InfoCircleGray.svg`

### `OpinionExternalErrorView` (E4)

```js
const errorMessage = ref(undefined)
onMounted(() => {
  errorMessage.value = window.history?.state?.message
})
```

```html
<p class="px-10 pretendard-20Regular leading-10 text-defaults-secondary-text-secondary">
  ERROR : {{ errorMessage }}
</p>
```

- **`history.state.message`에서 에러 문구를 읽는다** — `navigateTo`가 `state`로 넘긴다
- 아이콘이 `InfoCircle.svg`(NotFound는 `InfoCircleGray.svg`)
- 🔴 **`ERROR : undefined`가 노출될 수 있다** (`ref(undefined)` + 조건 렌더 없음).
  `deferred.md` **D-23** · `exception.md` **X-Q1**에 이미 기록됨
- ⚠️ `leading-10`(40px)이 `pretendard-20Regular`의 line-height를 덮는다

**두 화면 모두 `<script setup>`이 비어 있거나 최소**이고 인트로 배경 이미지를 재사용한다.

---

## 타깃 구조 (제안)

```
index.html                          # 메인 앱 엔트리
index-opinion.html                  # 🔴 신규 — opinion 엔트리
src/
├── main.tsx                        # 메인: 브릿지 4모듈 + 자동 로그인 + 스플래시
├── main-opinion.tsx                # opinion: 브릿지 1개(GO_BACK)만
├── app/
│   ├── App.tsx                     # 메인 셸
│   ├── OpinionApp.tsx              # opinion 셸 (CALLBACK_GO_BACK 처리)
│   ├── router.tsx                  # 메인 99개
│   ├── routerOpinion.tsx           # opinion 18개
│   ├── queryClient.ts              # 두 앱 공용 (retry 0 · staleTime 0)
│   └── layouts/
│       ├── AppLayout.tsx           # 메인 (AppBar + BottomNav)
│       └── OpinionLayout.tsx       # opinion (480px 중앙 + AppBar, 중첩 없음)
└── config/
    ├── env.ts                      # 메인 스키마 (11개)
    └── envOpinion.ts               # 🔴 opinion 스키마 (3개)
```

### `vite.config.ts` 멀티 엔트리

```ts
build: {
  rollupOptions: {
    input: {
      main: resolve(__dirname, 'index.html'),
      opinion: resolve(__dirname, 'index-opinion.html'),
    },
  },
}
```

**확인 결과 (2026-07-30): 레거시 방식(`--mode` 분리)을 유지한다.**

`.github/workflows/aws-deploy.yml`이 이미 두 빌드를 각각 돌리고 디렉터리로 분기한다.

```yaml
# main 빌드 (dist/main)      → npm run build:prod
# opinion 빌드 (dist/opinion) → npm run build:prod:opinion
…
BUILD_DIR="dist/opinion"   # 또는 "dist/main"
…
aws s3 sync "$BUILD_DIR/assets" "s3://$BUCKET_NAME/assets"
aws s3 cp   "$BUILD_DIR/index.html"   "s3://$BUCKET_NAME/index.html"
aws s3 cp   "$BUILD_DIR/version.json" "s3://$BUCKET_NAME/version.json"
aws s3 cp   "$BUILD_DIR/favicon.ico"  "s3://$BUCKET_NAME/favicon.ico"
```

**두 앱이 서로 다른 S3 버킷에 각자 `index.html`을 올린다.**
따라서 **Rollup `input` 멀티 엔트리(한 dist에 두 HTML)로 바꾸면 배포 스크립트를 고쳐야 한다.**

→ **`--mode` + `dist/main`·`dist/opinion` 구조를 그대로 유지한다.** (`O-Q10` 해소)

⚠️ 각 빌드가 **`version.json`을 만든다** — `checkFrontVersion`(신규 배포 감지)이 이 파일을 읽는다.
🔴 **그런데 opinion 앱에는 배포 감지가 없다**(§5). `version.json`을 올리지만 아무도 읽지 않는다.

### env 스키마 분리 (`env-vars.md` V-Q2)

**opinion 빌드에는 변수가 3개뿐이다.** 메인 스키마를 그대로 쓰면 **부팅 시 zod 검증 실패로 죽는다.**

| 방안                                                | 평가                                               |
| --------------------------------------------------- | -------------------------------------------------- |
| **A. `envOpinion.ts` 별도 스키마**                  | **권장.** 3개만 검증. 엔트리가 갈리므로 자연스럽다 |
| B. 메인 스키마에서 opinion 미사용 변수를 `optional` | 검증 강도가 떨어진다                               |
| C. opinion 빌드에도 전 변수 주입                    | 배포 설정이 늘어난다                               |

→ `env-vars.md` **V-Q2**와 동일 항목

---

## 이관 순서

| 시점                       | 작업                                                                                     |
| -------------------------- | ---------------------------------------------------------------------------------------- |
| **Phase 4** (기반 구축)    | `index-opinion.html` · `main-opinion.tsx` · `OpinionLayout` · `envOpinion.ts` **골격만** |
| **Phase 6** Vote 이관 시   | `routerOpinion.tsx`에 opinion 투표 7개 배선                                              |
| **Phase 6** Survey 이관 시 | opinion 설문 8개 배선                                                                    |
| **Phase 6** 마지막         | 에러·404·의견 메인 3개 + opinion 전용 QA                                                 |

> 🔴 **opinion 앱을 마지막에 몰아서 만들지 않는다** (계획서 리스크 R9).
> **골격을 Phase 4에 세워두고 Vote·Survey 이관 때 각자 배선한다.**
> 그래야 `vote.md`·`survey.md`의 비회원 분기를 이관하는 시점에 바로 확인할 수 있다.

---

## 반드시 지켜야 할 것

1. **`QueryClient` 기본값은 두 앱이 같다** — `retry: 0`(쿼리·뮤테이션), `staleTime: 0`, 전역 토스트 없음.
2. **opinion 앱에 자동 로그인·스플래시·앱 종료 모달·폰트 배율이 없다.** 추가하지 않는다.
3. **`CALLBACK_GO_BACK` 분기 3가지를 유지한다** — 투표 폼/완료 → 상세, 설문 폼/완료 → 상세, 그 밖 → back.
4. **뒤로가기 목적지의 uuid는 persist 스토어에서 읽는다** (`voteCertInfo.voterUuid` · `surveyCertInfo.participantUuid`).
5. **opinion 라우터 가드는 오프라인 체크 하나뿐이다.** 인증 가드를 추가하지 않는다.
6. **opinion 앱에 청크 리로드 복구·배포 감지가 없다** (`O-Q8` 결정 전까지).
7. **레이아웃은 `max-w-[480px]` 중앙 정렬 + `shadow-lg` + 흰 배경, 외곽은 `background-mono`.**
8. **AppBar가 opinion에서 `w-full max-w-[480px]`로 제한된다.**
9. 🔴 **콘텐츠 상단 여백은 최종적으로 48px이어야 한다** (레거시는 중첩된 `pt-6` × 2).
   중첩을 없애면 **`pt-12`로 고쳐야 화면이 같다.**
10. **루트(`/`)는 NotFound 화면이다.** 홈을 만들지 않는다.
11. **`/survey/list`(opinion)도 NotFound다** (`survey.md` R-3 확정).
12. **NotFound 문구는 `경로가 올바르지 않습니다`**, 에러는 **`ERROR : {history.state.message}`**.
13. **에러 화면은 `history.state.message`에서 문구를 읽는다.** 쿼리스트링이 아니다.
14. **opinion env 변수는 3개다.** 스키마를 분리한다 (V-Q2).
15. ~~Sentry 소스맵 업로드~~ → **이관하지 않는다** (2026-07-30 결정). 소스맵을 만들지 않는다.

---

## 정리해도 되는 것 (등가 영향 없음)

| 항목                                                      | 근거                                       |
| --------------------------------------------------------- | ------------------------------------------ |
| `main.js`의 `VCalendar` 등록                              | 미사용 — 제거 확정 (`tech-choices.md` 0-5) |
| opinion 번들의 네이티브 브릿지 4모듈 (`GO_BACK` 제외)     | 엔트리 분리로 자연히 해결                  |
| opinion 번들의 `MainApp`·`MainRouter` 정적 import         | 엔트리 분리로 해결 (`O-Q1`)                |
| `LayoutOpinionBase`의 `h-[calc(100%-67px)]` 바텀네비 분기 | opinion에 `showBottomNav: true`가 없다     |
| `LayoutOpinionBase`의 `w-screen`                          | `max-w-[480px]`가 실제 폭을 정한다         |
| `index-opinion.js` 가드의 `async` (await 없음)            | 무해                                       |
| `OpinionApp`의 버려지는 슬롯 3개                          | `<slot>`이 없다 — 배선하거나 제거          |
| `manualChunks`의 `@scope` 잘림                            | 빌드 산출물 구조는 사용자에게 안 보인다    |
| `css.preprocessorOptions.scss` (`globalColor.scss` 주입)  | `$` 변수 사용 0곳 — 죽은 설정 (O-Q4 해소)  |
| eruda (`MODE === 'development'` 정확 비교)                | 타깃은 eruda를 쓰지 않는다                 |

---

## 확인 필요 (`O-Q*`)

| #         | 질문                                                                                                                                             | 관련      |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | --------- |
| O-Q1      | 레거시가 `main.js`에서 런타임 분기하므로 **두 빌드에 양쪽 앱·라우터가 함께 들어갈 수 있다.** 실측해서 확인하는가 (타깃은 엔트리 분리로 해결)     | §2        |
| O-Q2      | `manualChunks` 패키지별 청크 전략을 타깃에도 옮기는가 (Vite 8 기본과 다르다)                                                                     | §2        |
| ~~O-Q3~~  | ~~Sentry project 이름~~ → **소멸.** `@sentry/vite-plugin` 이관 제외 확정 (2026-07-30)                                                            | §2        |
| ~~O-Q4~~  | ~~SCSS 주입을 이식하는가~~ → **해소.** `$` 변수 사용 0곳 = 죽은 설정, **이식하지 않는다.** 단 이 파일이 `broken-styles.md` §5의 답을 갖고 있었다 | §2        |
| O-Q5      | opinion URL을 **앱 웹뷰로 여는 경로가 있는가?** (`CALLBACK_GO_BACK` 핸들러의 존재 이유)                                                          | §3        |
| O-Q6      | 🔴 **`LayoutOpinionBase` 중첩을 없애면 `pt-6`(24px)만 남아 콘텐츠가 24px 가려진다.** `pt-12`로 함께 고치는가                                     | §4        |
| O-Q7      | 🔴 **opinion 앱에 `ToastContainer`가 없어 모든 토스트가 무음이다** (오프라인 안내 포함). 배선하는가 (**레거시에 없던 토스트가 나타난다**)        | §4        |
| O-Q8      | opinion 앱에 **청크 로드 실패 복구·신규 배포 감지가 없다.** 추가하는가 (외부 링크 사용자가 흰 화면을 볼 수 있다)                                 | §5        |
| O-Q9      | `AppBar`가 `import.meta.env.MODE`를 직접 읽는다 (타깃 절대 규칙 1 위반). **prop/Context로 내리는가**(권장) / `env`에 플래그 추가                 | §6        |
| ~~O-Q10~~ | ~~멀티 엔트리 형태~~ → **해소.** `aws-deploy.yml`이 두 빌드를 각각 다른 버킷에 올린다. **`--mode` + `dist/main`·`dist/opinion` 유지**            | 타깃 구조 |

> **`env-vars.md` V-Q2**(opinion 스키마 분리)도 이 문서의 결정 대상이다 → **A(별도 스키마) 권장.**

---

## 등가 대조 (레거시 opinion :3000 ↔ 신규 opinion, 392px + 데스크톱)

| 대조 지점                                                                     |
| ----------------------------------------------------------------------------- |
| **데스크톱에서 480px 중앙 정렬 + `shadow-lg`** 그림자 강도                    |
| 외곽 배경 `background-mono` 색                                                |
| **콘텐츠 상단 여백이 48px인지** (`O-Q6` 핵심)                                 |
| `showAppBar: true` 라우트에서 **AppBar가 1개로 보이는지** (레거시는 2개 겹침) |
| AppBar 폭이 480px로 제한되는지                                                |
| 페이지 전환 `fade` 트랜지션 속도                                              |
| NotFound: 인트로 배경 + 로고 `w-60` + `InfoCircleGray.svg` `w-10` + 문구      |
| 에러: `InfoCircle.svg` + `ERROR : {메시지}` + `px-10 leading-10`              |
| `history.state.message`가 없을 때 `ERROR : undefined` 노출 (X-Q1)             |
| 오프라인에서 화면 전환이 막히고 **안내가 없는지** (`O-Q7` 전까지)             |
| 딥링크 직접 진입 (`/vote/{uuid}` · `/survey/{uuid}`)                          |
| 잘못된 경로 → NotFound                                                        |
| 폰트 배율: **opinion에는 `data-font-size`가 없으므로 배율이 적용되지 않는다** |

---

## 회귀 위험 지점

| 지점                            | 위험                                                                                    |
| ------------------------------- | --------------------------------------------------------------------------------------- |
| 🔴 **레이아웃 중첩 제거**       | `pt-6` × 2 = 48px에 의존한다. 함께 `pt-12`로 고치지 않으면 **콘텐츠가 가려진다**        |
| 🔴 **`ToastContainer` 배선**    | 고치면 **레거시에 없던 토스트가 나타난다.** 등가성 판단 필요 (`O-Q7`)                   |
| **env 스키마**                  | opinion 빌드에 변수 3개뿐. 메인 스키마를 쓰면 **부팅 시 죽는다**                        |
| **`AppBar`의 `MODE` 직접 읽기** | prop으로 바꿀 때 두 레이아웃 모두 배선해야 한다                                         |
| **경로 충돌 11건**              | 두 라우터를 합치면 `/vote/:voterUuid`가 `/vote/detail/...`를 먹는다 (`routes.md` §5)    |
| **eager 라우트 4개**            | 타깃은 전부 lazy가 기본. 초기 로딩 체감이 달라진다                                      |
| **`CALLBACK_GO_BACK`**          | opinion에 브릿지를 하나만 남길 때 이것만 정확히 골라야 한다                             |
| **persist 스토어 의존**         | 뒤로가기 목적지가 `voteCertInfo`·`surveyCertInfo`에 있다. KMC 왕복 후에도 유지돼야 한다 |
| ~~Sentry 소스맵 삭제~~          | **소멸** — 소스맵을 만들지 않으므로 노출 위험도 없다 (플러그인 제외 결정)               |
| **배포 워크플로**               | 두 디렉터리 구조를 바꾸면 `aws-deploy.yml`도 함께 고쳐야 한다 (`O-Q10`)                 |
