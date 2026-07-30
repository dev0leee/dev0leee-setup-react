# 마이그레이션 진행 상태

> **세션 시작 시 이 파일부터 읽고, 세션 종료 시 갱신한다.**
> 전체 계획은 `~/.claude/plans/working-smcom-apt-resident-fe-tranquil-charm.md`

## 명세 기준 (R1 — 고정)

| 항목         | 값                                                         |
| ------------ | ---------------------------------------------------------- |
| 레거시 레포  | `~/Desktop/working/smcom/apt-resident-fe`                  |
| 브랜치       | `dev`                                                      |
| **기준 SHA** | **`6d5bf22a1d4965e005477e46a66c5006d8e3e2e3`**             |
| 기준 시각    | 2026-07-27 10:13:17 +0900                                  |
| 기준 커밋    | `feat : 요일별 무료 주차 시간(주차 정책) 기능 개발 (#462)` |

**모든 명세는 이 시점의 코드를 기준으로 작성한다.**
기능 동결 합의가 없으므로(R1), 이 SHA 이후 레거시에 들어간 커밋은 아래 「기준 이후 레거시 변경」에
누적 기록하고 Phase 6 종료 시 일괄 반영한다.

확인 명령:

```bash
git -C ~/Desktop/working/smcom/apt-resident-fe log --oneline 6d5bf22..origin/dev
```

### 기준 이후 레거시 변경

| SHA      | 날짜 | 내용 | 영향 도메인 | 반영 여부 |
| -------- | ---- | ---- | ----------- | --------- |
| _(없음)_ |      |      |             |           |

---

## Phase 0 — 선결 결정

| #       | 항목                              | 상태     | 비고                                                                             |
| ------- | --------------------------------- | -------- | -------------------------------------------------------------------------------- |
| ~~0-1~~ | ~~인증 계약 백엔드 협의~~         | **해소** | 레거시 방식 유지 결정 (`decisions/auth-strategy.md`)                             |
| ~~0-2~~ | ~~네이티브 웹뷰 쿠키 검증~~       | **해소** | 쿠키 안 씀                                                                       |
| ~~0-3~~ | ~~자동 로그인 대체 설계~~         | **해소** | 레거시 자동 로그인 그대로 이식                                                   |
| ~~0-4~~ | ~~네이티브 브릿지 핸들러명 정합~~ | **해소** | 앱이 이미 배포됨 → **웹이 레거시 프로토콜에 맞춘다** (`native-protocol.md` §0)   |
| ~~0-5~~ | ~~캘린더·차트 대체재~~            | **해소** | shadcn `calendar` / `recharts` / `v-calendar` 제거 (`decisions/tech-choices.md`) |
| ~~0-6~~ | ~~opinion 빌드 형태~~             | **해소** | **멀티 엔트리 유지** — 경로 충돌 11건 + 외부 딥링크 보존 + env 스키마 분리       |
| ~~0-7~~ | ~~zod 3 → 4 차이 확인~~           | **완료** | `zod-migration.md` — `required_error` 33 + `invalid_type_error` 5 변환 필요      |

> 🎯 **Phase 0 종료. 결정 7건 전부 확정, 외부 블로커 0건.**

### 확정된 주요 결정

| 결정                                                                                                           | 문서                               |
| -------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| **인증은 레거시 방식 그대로 유지** (헤더 토큰 + localStorage + 자동 로그인). 쿠키 전환은 전환 후 별도 작업     | `decisions/auth-strategy.md`       |
| 인벤토리 확인 항목 11건 전부 확정                                                                              | `decisions/inventory-questions.md` |
| **opinion 멀티 엔트리 유지** · 날짜선택기 shadcn `calendar` · 차트 `recharts` · `v-calendar` 제거              | `decisions/tech-choices.md`        |
| **에러 모달은 Base UI Dialog로 레거시 재현** (`sweetalert2` 추가 안 함)                                        | 〃                                 |
| **의존성 8개 승인 · `@sentry/vite-plugin` 제외 · `lodash-es` 불필요** (2026-07-30)                             | `tech-mapping.md` §12              |
| **관리비 목업 화면(`/managementFee/info`)도 이관** — ApexCharts 2개를 recharts로 (2026-07-30)                  | `features/management-fee.md` §1    |
| **미생성 클래스 6건을 현 Tailwind 토큰으로 매핑** — `globalColor.scss` 팔레트를 되살리지 않는다 (2026-07-30)   | `broken-styles.md` §5              |
| **QueryClient 기본값을 레거시에 맞춘다** — 전역 토스트 끄기, `throwOnError: false`, `retry: 0`, `staleTime: 0` | 〃                                 |

**이관 제외 확정 (2026-07-29 사용자 재확인 — "사용처 없으면 쓰지마")**:
미출차 내역 **일체**(라우트·컴포넌트 3·훅 2·API 2·상수) · `postRejectCarRelease` ·
항상허용 차량 **수정** 기능 · `MyPageFontSizeItem.vue` · `v-calendar` ·
**콘텐츠 플래그 4개**(`hasAptCommunityContent`·`hasAptMovingHouseContent`·`hasAptVoteContent`·`hasAptShoppingContent`) ·
`FIXED_MENUS`의 `'공지사항'` · 죽은 `<style scoped>` 2건 · `useGetAptList`의 `watch` 무효화

**스타일 오타 수정 확정**: CSS 클래스 **26개** 중 21개를 이관 시 수정/삭제 → `broken-styles.md`
(서버·앱 계약 오타 4건은 **그대로 유지**, 협의 후 처리 → `deferred.md`)
⚠️ 1차 조사의 "16개"는 후보 생성이 불완전해 틀렸다. 2차에서 토큰 821개 전수 빌드 검증으로 확정(25 + `center` 1 = 26).

**이관 필수로 정정**: `getNoticeTopThree` — `(미사용중)` 주석은 낡은 것이고 메인 화면에서 실제 렌더 중.

> 판단 근거는 `decisions/inventory-questions.md`가 정본이다 (R-1 · R-2 · E-Q5b).

---

## Phase 1 — 계약 인벤토리

| 산출물               | 상태     | 실측 결과                                                                                                            |
| -------------------- | -------- | -------------------------------------------------------------------------------------------------------------------- |
| `routes.md`          | **완료** | **화면 라우트 121개** (메인 99 + opinion 18). 계획서의 "127"은 `path:` 항목 수 — 컨테이너 4·리다이렉트 1·주석 1 포함 |
| `endpoints.md`       | **완료** | **엔드포인트 148개** / 17개 모듈. 계획서의 "150"은 `axios.js`의 인스턴스 export 2개 포함                             |
| `native-protocol.md` | **완료** | **Web→App 17 / App→Web 7 = 24종.** 호출부 매핑 포함. 보존 필수 항목 11건                                             |
| `query-keys.md`      | **완료** | **훅 141개 / 쿼리 키 75종** (배열 56 + 무한목록 19). v4 `invalidateQueries` 28곳                                     |
| `domain-codes.md`    | **완료** | 상수 19파일·심볼 112개. **서버 에러코드 39종**, 정규식 7종                                                           |
| `env-vars.md`        | **완료** | 레거시 변수 11 + `MODE` 23곳. 타깃에 **8개 추가 필요**                                                               |

> **Phase 1 완료.** 산출물 6종 전부 작성됨.

### 실측으로 정정된 수치

| 항목           | 계획서 |           실측 | 사유                                                  |
| -------------- | -----: | -------------: | ----------------------------------------------------- |
| 라우트         |    127 |        **121** | 레이아웃 컨테이너 4 + 리다이렉트 1 + 주석 처리 1 제외 |
| API 엔드포인트 |    150 |        **148** | `axios.js`의 `client`·`auth` 인스턴스 export 2개 제외 |
| 쿼리 훅        |    142 |        **141** | 실측                                                  |
| 쿼리 키        |  42+19 | **56+19 = 75** | 배열 키를 단일행 grep으로 세어 멀티라인 21건 누락     |
| 브릿지         |     24 |         **24** | 일치                                                  |

---

## Phase 2 / 6 — 도메인별 상태

> **명세 밀도 방침 (2026-07-29 결정)**: 대칭·반복 구조도 **줄이지 않고 전수로 풀어쓴다.**
> 도메인 명세 하나만 보고 이관할 수 있어야 한다. 예상 총량 약 24,000줄.
>
> **명세 파일은 타깃 feature 슬라이스 기준으로 묶는다.** `IntroView` + `LoginView`는
> 기능상 한 도메인이라 `features/auth.md` 하나로 작성했다.

| 도메인            | `.vue` |  LOC | 명세     | 이관   | PR               |
| ----------------- | -----: | ---: | -------- | ------ | ---------------- |
| Login             |      5 |  463 | **완료** | 미착수 |                  |
| Intro             |      2 |  121 | **완료** | 미착수 |                  |
| SignUp            |      8 |  703 | **완료** | 미착수 |                  |
| Exception         |      4 |  149 | **완료** | 미착수 |                  |
| Main              |     22 | 1708 | **완료** | 미착수 |                  |
| MyPage            |     19 | 1149 | **완료** | 미착수 | ← Phase 5 파일럿 |
| Board             |     48 | 3642 | **완료** | 미착수 |                  |
| ParkingManagement |     31 | 3278 | **완료** | 미착수 |                  |
| Visit             |     23 | 2042 | **완료** | 미착수 |                  |
| Vote              |     23 | 1673 | **완료** | 미착수 |                  |
| Survey            |     19 | 1324 | **완료** | 미착수 |                  |
| AptMall           |     19 | 1472 | **완료** | 미착수 |                  |
| FireInspection    |     13 | 1231 | **완료** | 미착수 |                  |
| MovingHouse       |     10 | 1071 | **완료** | 미착수 |                  |
| Repair            |     11 |  964 | **완료** | 미착수 |                  |
| ManagementFee     |      3 |  906 | **완료** | 미착수 |                  |
| Apass             |      3 |  301 | **완료** | 미착수 |                  |
| TermsOfUse        |      3 |  158 | **완료** | 미착수 | ← `signup.md` 내 |
| opinion 앱        |      — |    — | **완료** | 미착수 |                  |

---

## 미해결 질문 (사용자 확인 대기)

**막힌 작업 없음.** 아래는 통보·확인 수준이며 진행을 막지 않는다.

| #    | 항목                                                    | 성격                     |
| ---- | ------------------------------------------------------- | ------------------------ |
| N-Q1 | 앱 팀에 브릿지 프로토콜 변경 계획이 있는지 통보 겸 확인 | 통보. 없으면 그대로 진행 |
| N-Q3 | 앱 종료 상태 푸시가 라우터 준비 전에 도착하는지         | Phase 5 설계 시 필요     |

> 인벤토리 확인 항목 11건은 **전부 확정**됐다 → `decisions/inventory-questions.md`

### 🔴 이관 착수 전 결정이 필요한 것 (등가 이관과 충돌하는 버그)

**"고치면 화면/동작이 달라지는" 결함들이다.** 등가 이관 원칙만으로는 판단할 수 없다.

| #                      | 결함                                                                          | 고치면                                             | 문서                    |
| ---------------------- | ----------------------------------------------------------------------------- | -------------------------------------------------- | ----------------------- |
| `RP-Q4`                | 하자보수 목록의 무한 스크롤 관측 타깃이 템플릿에 없다                         | **지금까지 안 보였던 11번째 이후 항목이 보인다**   | `repair.md` §4          |
| `RP-Q1`                | 등록 화면 제목이 `하자보수 수정`, 모달이 `수정 그만두기`                      | 제목·모달 문구가 바뀐다                            | `repair.md` §1          |
| `RP-Q2`                | 등록 화면에 AppBar 2개 · `RP-Q3` 수정 화면 콘텐츠 48px 가림                   | 레이아웃이 바뀐다                                  | `repair.md` §2·§3       |
| `AP-Q3`                | A-PASS 7초 타임아웃이 전역 로딩 플래그를 못 내려 **뒤로가기 영구 차단**       | 뒤로가기가 동작하기 시작한다                       | `apass.md` AP1          |
| `O-Q6`                 | opinion 레이아웃 2중 중첩 (`pt-6`×2=48px에 의존)                              | 중첩 제거 시 **`pt-12`로 함께 고쳐야** 한다        | `opinion.md` §4         |
| `O-Q7`                 | opinion 앱에 `ToastContainer`가 없어 **모든 토스트 무음**                     | **레거시에 없던 토스트가 나타난다**                | `opinion.md` §4         |
| ~~`MF-Q1`~~            | ~~관리비 `/info` 목업~~                                                       | ✅ **이관 확정** (2026-07-30) — `§1-2`에 전수 명세 | `management-fee.md` §1  |
| `VT-Q2`·`SV-Q3`        | Vote·Survey의 `isCreateXxxFormPending` 오타 (같은 버그)                       | 중복 제출 잠금이 생긴다                            | `vote.md`·`survey.md`   |
| `MH-Q10`               | 이사예약 안내문이 `<p>` 안의 `<div>` 때문에 배경·패딩 손실                    | 회색 카드 배경이 살아난다                          | `moving-house.md` MH2   |
| `F-Q14`                | 소방 `홈으로 돌아가기`가 인트로 경유 → `getLoginInfo()` 실패 시 **로그아웃**  | 3홉 우회가 없어진다                                | `fire-inspection.md` F3 |
| v4 `invalidateQueries` | **28곳이 v5에서 no-op.** 특히 `AP-Q`(A-PASS 토글)는 **UI 갱신 경로가 이것뿐** | 화면이 즉시 갱신되기 시작한다                      | `query-keys.md`         |

> **v4 `invalidateQueries`는 "고쳐야 하는" 쪽이다** — 안 고치면 화면이 갱신되지 않는다.
> 나머지는 **레거시가 이미 그렇게 동작하고 있으므로** 사용자 결정이 필요하다.

---

## Phase 4 — 기반 구축 ✅ **완료 (2026-07-30)**

`tech-mapping.md` §14의 11단계를 전부 수행했다. 커밋 8개.

| #      | 단계                  | 결과                                                                                                                 |
| ------ | --------------------- | -------------------------------------------------------------------------------------------------------------------- |
| **1**  | 의존성 · env · eslint | 8개 설치 + shadcn 12종 · env 스키마 2분할(opinion 대응) · `FEATURE_SLICES` 18개 zone                                 |
| **2**  | 디자인 토큰           | 색 207 + 타이포 67 + `--font-scale` + `sm:392px` + `public/assets` 210개. **v3→v4 클래스 변경 4종 55곳 실측**(§10-1) |
| **3**  | HTTP 레이어           | 헤더 토큰 · errorCode 재발급 트리거 · 대기 큐 · 자동 로그인. 테스트 19개                                             |
| **4**  | 네이티브 브릿지       | `JsInterface` · `{type,data}` · iOS 객체/Android 문자열 · `window.CALLBACK_*` 7종. 테스트 14개                       |
| **5**  | 인증 슬라이스         | 로그인 에러코드 분기 · `loginDataHandler` · 로그아웃 플로우 · 자동 로그인 구동부                                     |
| **6**  | aptInfo 배치          | `authStore`가 소유. 병합 semantics·동기 접근 유지 (D-35)                                                             |
| **7**  | 오버레이 · 에러 모달  | `showErrorModal()`(호출부 293곳 대체) · `ModalBase` · `DrawerBase`. 테스트 7개                                       |
| **8**  | 공용 컴포넌트 38개    | 30개 재작성 + 레이아웃 5개 + Toast 2개는 sonner. `LayoutOpinionBase`만 Phase 6으로                                   |
| **9**  | 레이아웃 셸           | `AppBar`·`BottomNavigation`·`RootLayout`·`AppLayout` + route `handle` 메타 + 뒤로가기 라우팅표                       |
| **10** | `useInfiniteList`     | 페이지 크기 10 · `pages[0]` pageable · 접두사 `resetCache`. 테스트 6개                                               |
| **11** | 데모 제거             | `features/dashboard` 삭제 · MSW 핸들러를 실제 인증 계약으로 교체                                                     |

### 완료 조건 검증

`src/app/router.test.tsx`가 **실제 `routes` 트리로** 사슬 전체를 통과시킨다:

```
폼 제출 → 헤더 토큰 저장(레거시 키) → login/info + 단지목록 병렬 조회
→ aptInfo 적재 → SEND_INITIAL_RESIDENT_INFO 발신(' 로비폰 ' trim 확인)
→ 라우터 가드 통과 → 하단 탭 렌더
```

`pnpm typecheck && pnpm lint && pnpm format:check && pnpm test` 통과 — **테스트 51개**.

### ⚠️ Phase 4에서 끝내지 못한 것

| 항목                       | 이유                                                                                                                   |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| **`.env.*` 파일 갱신**     | 세션 권한이 `.env*` 읽기·쓰기를 차단한다. 추가할 변수는 `env-vars.md` §7. **이것 없이는 `pnpm dev`가 부팅하지 않는다** |
| **실기기 확인**            | 브릿지 24종은 앱 안에서만 검증된다. MSW 테스트는 웹 쪽 계약만 고정한다                                                 |
| **픽셀 대조**              | 에러 모달(SweetAlert2 재현)·토스트·칩 18색은 레거시와 나란히 띄워 봐야 한다 (R10)                                      |
| **opinion 엔트리**         | `main-opinion.tsx`·`routerOpinion.tsx`는 Vote·Survey 이관과 함께 (`opinion.md`)                                        |
| **`vue-quill.snow.css`**   | 전역이 아니라 `features/board`와 함께 (§10-2)                                                                          |
| **날짜 선택기 래퍼**       | `shadcn calendar`는 설치했지만 래퍼는 AptMall AM9 기준으로 만든다 (`moving-house.md` MH-Q12)                           |
| **`ImageUploader`·진행률** | Board 이관과 함께 (`repair.md` 「이관 순서」)                                                                          |

---

## 다음 작업

**Phase 0 · 1 · 2 · 3 · 4 완료.** 다음은 **Phase 5(파일럿 도메인 = MyPage)** 다.

### A. 착수 전 사용자 결정 — ✅ **3건 전부 확정 (2026-07-30)**

| #     | 항목            | 결정                                                                                                                                                                                                                       |
| ----- | --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1** | **의존성 승인** | ✅ **8개 승인** — `react-day-picker` · `dompurify` · `swiper` · `qrcode` · `html2canvas` · `quill-delta-to-html` · `he` · `posthog-js`<br>🚫 **`@sentry/vite-plugin` 제외** ("일단 sentry는 빼고") · 🚫 `lodash-es` 불필요 |
| **2** | **`MF-Q1`**     | ✅ **관리비 목업 화면도 이관한다.** ApexCharts 2개 → recharts. 목업 데이터·`TODO` 주석 유지, 진입 경로는 만들지 않는다                                                                                                     |
| **3** | **`B-Q2`**      | ✅ **미생성 클래스 6건을 현 Tailwind 토큰으로 매핑.** `globalColor.scss` 팔레트를 되살리지 않고 `@theme`에 새 색을 추가하지 않는다                                                                                         |

> 🎯 **Phase 4 착수 블로커 0건.**

#### `@sentry/vite-plugin` 제외의 범위

| 항목                                         | 처리                                                 |
| -------------------------------------------- | ---------------------------------------------------- |
| `sentryVitePlugin` · 소스맵 업로드·삭제      | 🚫 **하지 않는다** (`build.sourcemap`도 끈다)        |
| `SENTRY_AUTH_TOKEN` Secret                   | 🚫 불필요 (Phase 7 이전 목록에서 제외)               |
| **`@sentry/react`** (타깃 기설치)            | ✅ **유지** — `main.tsx`·`QueryErrorBoundary` 그대로 |
| `sentryApiError.js` 이식 · `VITE_SENTRY_DSN` | ✅ 유지                                              |

**즉 에러 리포팅은 살아 있고 스택트레이스만 난독화 상태로 남는다.**
Sentry 통합 자체를 걷어내려면 `env` 스키마·`main.tsx`·`QueryErrorBoundary`·`sentryApiError`
4곳을 함께 정리해야 한다 — **그 결정은 아직 받지 않았다.**

#### 미생성 클래스 매핑 (`broken-styles.md` §5)

| 깨진 클래스                                   | 확정 토큰                                    | 화면 변화                 |
| --------------------------------------------- | -------------------------------------------- | ------------------------- |
| `border-deep-glue-20`                         | `border-defaults-secondary-border-secondary` | 미세 (`#E5E7EB`)          |
| `border-bg-gray`                              | `border-defaults-tertiary-border-tertiary`   | 입력칸과 통일             |
| `text-brand-primary-50` · `-100`              | `text-brand-default-text-brand`              | 🔴 **검정 → 브랜드 파랑** |
| `border-defaults-secondary-border-primary`    | `border-defaults-primary-border-primary`     | 없음 (죽은 variant)       |
| `bg-brand-default-background-brand-secondary` | `bg-primary-pc-indigo-50`                    | 🔴 **배경 없음 → 연파랑** |

🔴 **아래 두 건은 눈에 보이는 변화다** — 도메인 이관 시 대조 필수.
MyPage·관리사무소 제목이 파랑으로, 소방 점검표 라디오(21×2)·이사예약 라디오에 연파랑 배경이 생긴다.

### B. 공용 인프라 ↔ 소비 도메인 (Phase 4에서 대부분 해소)

| 공용물                              | 소비 도메인                                                   | 상태                                                              |
| ----------------------------------- | ------------------------------------------------------------- | ----------------------------------------------------------------- |
| **날짜 선택기 래퍼**                | AptMall(AM9, `inline`) · 주차 · **이사예약**(휴무일) · 로비폰 | ⏳ `shadcn calendar` 설치만. 래퍼는 AptMall AM9 기준 (MH-Q12)     |
| **`ImageUploader` + 진행률**        | **Board**(10~11곳) → Repair                                   | ⏳ Board 이관과 함께                                              |
| **`CanvasSign`**                    | Vote(모달) · **소방**(화면 단계)                              | ✅ 이식 완료                                                      |
| **`DrawerMonth`**                   | 관리비 상세 · **메인 카드**                                   | ✅ 이식 완료 (선택 값을 부모가 소유하게 바꿔 D-143도 함께 해소)   |
| **`usePermissionInfo`**             | A-PASS · **메인 배지**                                        | ✅ `subscribeToPermissionInfo` + `useNativeSubscription`으로 가능 |
| **네이티브 브릿지 24종**            | **Visit(7화면) · A-PASS** — 이 둘은 브릿지 없이 이관 불가     | ✅ 24종 전부 이식                                                 |
| **`InputRadioList`** (폼 결합 제거) | 소방 · 이사예약 · 하자보수                                    | ✅ 제어 컴포넌트로 통일                                           |
| **오버레이/에러 모달**              | 69개 파일 · 호출 293곳                                        | ✅ `showErrorModal()`                                             |
| **`useInfiniteList`**               | 목록 18종                                                     | ✅ 이식 완료                                                      |

### C. Phase 6 이관 순서 제약 (명세에서 확정된 것)

```
Phase 4 브릿지 완료 ─┬─→ Visit
                     └─→ A-PASS (+ Main 배지와 같은 PR)

Board ──→ Repair            (ImageUploader·useUploadProgress·convertFormDataFile·validImage)
Vote ──→ Survey             (opinion 엔트리 + KMC 인프라)
Main ──→ 관리비 상세(MF1)    (DrawerMonth)
관리비 MF2 ──→ Main 카드      (recharts 규격을 옵션이 복잡한 MF2에서 먼저 확립)
AptMall ─→ 주차/이사예약/로비폰 (날짜 선택기 래퍼를 AM9 기준으로 먼저 만든다)

브릿지 독립 (아무 때나): AptMall · 소방 · 이사예약 · 하자보수 · 관리비
```

**opinion 앱은 마지막에 몰지 않는다** — 골격을 Phase 4에 세우고 Vote·Survey 이관 때 각자 배선한다
(계획서 리스크 R9 · `opinion.md` 「이관 순서」).

### D. 확인 항목 현황

**도메인 명세 17개에 확인 항목 총 164건**(2026-07-30 기준 **해소 16건**)이 쌓였다.
전부 진행을 막지는 않지만, **이관 착수 전에 도메인별로 한 번 훑어야 한다.**

| 성격                           | 예                                                                             | 처리 시점           |
| ------------------------------ | ------------------------------------------------------------------------------ | ------------------- |
| **버그 수정 여부** (등가 충돌) | `RP-Q4`(무한스크롤 미동작) · `AP-Q3`(뒤로가기 영구 차단) · `O-Q7`(토스트 무음) | **도메인 착수 전**  |
| **서버 응답 실물 확인**        | `AM-Q10`(단가/줄합계) · `F-Q7`(정렬 보장) · `RP-Q8`(필드명)                    | 백엔드 문의         |
| ~~**디자인 확인**~~            | ~~`B-Q2` · `F-Q11` · `MH-Q11` · `RP-Q10`~~                                     | ✅ **A-3에서 확정** |
| **스타일 오타 수정**           | `broken-styles.md` **26건 전부 조치 방침 확정** (미해결 0)                     | 도메인 이관 시      |
| **개선 아이디어**              | `deferred.md` **D-1~D-183**                                                    | 전환 후             |

---

## 세션 로그

| 날짜       | 작업                                                                                                                                                                                                                                                                                                     |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-07-29 | 계획 승인. 기준 SHA 고정(`6d5bf22`). `feat/migration-inventory` 브랜치 생성                                                                                                                                                                                                                              |
| 2026-07-29 | `routes.md` 완료 — 화면 라우트 121개 전수                                                                                                                                                                                                                                                                |
| 2026-07-29 | `endpoints.md` 완료 — 엔드포인트 148개 전수                                                                                                                                                                                                                                                              |
| 2026-07-29 | 확인 항목 11건 전부 확정. `decisions/inventory-questions.md`, `deferred.md` 작성                                                                                                                                                                                                                         |
| 2026-07-29 | **인증 방침 변경** — 레거시 방식 유지로 확정. `decisions/auth-strategy.md` 작성. 계획서 반영(Phase 0 블로커 3→1, R3·R4·R11 소멸, R12·R13 추가)                                                                                                                                                           |
| 2026-07-29 | `native-protocol.md` 완료 — 브릿지 24종 전수. **0-4 해소**(웹이 레거시 프로토콜에 맞춤). 외부 블로커 0건                                                                                                                                                                                                 |
| 2026-07-29 | `query-keys.md`·`domain-codes.md`·`env-vars.md` 완료. **Phase 1 종료**                                                                                                                                                                                                                                   |
| 2026-07-29 | 기술 선택 4건 확정 (0-5·0-6·에러 모달·QueryClient 기본값). `decisions/tech-choices.md`                                                                                                                                                                                                                   |
| 2026-07-29 | `zod-migration.md` 완료 (0-7). **Phase 0 종료**                                                                                                                                                                                                                                                          |
| 2026-07-29 | `tech-mapping.md` 완료. **Phase 3 종료**                                                                                                                                                                                                                                                                 |
| 2026-07-29 | `features/auth.md`(Intro+Login) · `features/exception.md` 완료. Phase 2 착수                                                                                                                                                                                                                             |
| 2026-07-29 | `features/signup.md` 완료 (SignUp 8 + TermsOfUse 3). 확인 항목 S-Q1 코드로 확정                                                                                                                                                                                                                          |
| 2026-07-29 | `features/main.md` 완료 (22파일). 콘텐츠 플래그 4개 미사용 확인, M-Q3 확정                                                                                                                                                                                                                               |
| 2026-07-29 | `features/mypage.md` 완료. **기반 도메인 6개 전부 완료.** P-Q3·P-Q4 코드로 확정                                                                                                                                                                                                                          |
| 2026-07-29 | `broken-styles.md` 작성 — Tailwind 빌드로 미생성 클래스 16개 확정. 12개 수정, 4개는 디자인 확인 대기                                                                                                                                                                                                     |
| 2026-07-29 | `features/board.md` 완료 (48파일 · 화면 20 + 팝업 1 · 2,984줄). 결함 15건·소통↔민원 차이 17건 정리. 확인 항목 BD-Q1~Q15                                                                                                                                                                                  |
| 2026-07-29 | **`broken-styles.md` 2차 조사 — 미생성 클래스 16 → 25로 정정.** 토큰 821개 전수 빌드 검증                                                                                                                                                                                                                |
| 2026-07-29 | `features/parking.md` 완료 (31파일 · 화면 15 · 2,221줄). 미출차 일체 제외 확정 반영. 확인 항목 PK-Q1~Q11                                                                                                                                                                                                 |
| 2026-07-29 | `features/visit.md` 완료 (23파일 · 화면 13 · 1,463줄). 브릿지 6종 의존. 확인 항목 V-Q1~Q9. PK-Q6 해소                                                                                                                                                                                                    |
| 2026-07-29 | `features/vote.md` 완료 (23파일 · 라우트 13 = 메인 6 + opinion 7 · 1,293줄). 확인 항목 VT-Q1~Q9. 미생성 클래스 `center` 추가 발견(25→26)                                                                                                                                                                 |
| 2026-07-29 | `features/survey.md` 완료 (19파일 · 라우트 14 = 메인 6 + opinion 8 · 1,053줄). **Vote와의 차이 9건** 정리. 확인 항목 SV-Q1~Q10. SV-Q5 해소                                                                                                                                                               |
| 2026-07-30 | `features/apt-mall.md` 완료 (19파일 · 라우트 3 + 드로어 위저드 8 = 화면 11 · 1,584줄). **브릿지 의존 0.** 결함 13건. 확인 항목 AM-Q1~Q22. E-Q6 전제 정정                                                                                                                                                 |
| 2026-07-30 | `features/fire-inspection.md` 완료 (13파일 · 라우트 4 + 단계 2 · 1,350줄). 점검표 21항목이 클라이언트 하드코딩. `lodash` 제거 가능 확인. 확인 항목 F-Q1~Q16                                                                                                                                              |
| 2026-07-30 | `features/moving-house.md` 완료 (10파일 · 라우트 4 · 1,265줄). `chargeFlag`가 6곳을 동시에 바꾼다. 신축 입주 기간 로직. 달력 5개 전수 비교. 확인 항목 MH-Q1~Q15                                                                                                                                          |
| 2026-07-30 | `features/repair.md` 완료 (11파일 · 라우트 4 · 1,080줄). Pinia 안의 vee-validate `useForm`. 결함 밀도 최고 — 무한 스크롤 미동작·AppBar 이중·`'write'`/`'create'` 불일치. 확인 항목 RP-Q1~Q12                                                                                                             |
| 2026-07-30 | `features/management-fee.md` 완료 (3파일 · 라우트 2 · 765줄). 🔴 **`/managementFee/info`(524줄)가 도달 불가 + 전부 목업** → 이관 제외 권장(`MF-Q1`). `startDateTIme` 오타 유지 재확인. 확인 항목 MF-Q1~Q9                                                                                                |
| 2026-07-30 | `features/apass.md` 완료 (3파일 · 라우트 1 · 620줄). 브릿지 4종 왕복. 🔴 `invalidateQueries` v4가 **UI 갱신의 유일한 경로**. 7초 타임아웃이 전역 로딩 플래그를 못 내려 뒤로가기 영구 차단. 확인 항목 AP-Q1~Q6                                                                                            |
| 2026-07-30 | `features/opinion.md` 완료 (엔트리·빌드·레이아웃·라우터 · 765줄). 🔴 **`LayoutOpinionBase` 2중 중첩** — `pt-6`×2=48px에 의존, `ToastContainer`가 버려져 **모든 토스트 무음**. `O-Q4`·`O-Q10` 실측으로 해소. **Phase 2 종료 (19/19)**                                                                     |
| 2026-07-30 | 🎯 **`broken-styles.md` §5 2건 해소** — `globalColor.scss`(이전 SCSS 팔레트)에서 `border-deep-glue-20`→`$deep-blue-20 #e6e6ec`, `border-bg-gray`→`$bg-gray #f8f8f8` 확인. Tailwind config 이식 시 `deep-blue`·`bg-*` 계열이 누락된 것                                                                    |
| 2026-07-30 | ✅ **사용자 결정 3건 확정** — ① 의존성 8개 승인 · `@sentry/vite-plugin` 제외 ② 관리비 목업 화면(MF2) **이관** — §1-2에 recharts 대조표 포함 전수 명세 작성 ③ 미생성 클래스 6건을 **현 Tailwind 토큰으로 매핑**. **Phase 4 착수 블로커 0건**                                                              |
| 2026-07-30 | **Phase 4 1단계** — 의존성 8개 설치(+shadcn 12종) · `env.ts`를 공통/메인전용 스키마로 분할해 **V-Q2 해소** · `vite.config.ts test.env` · `FEATURE_SLICES` 18개 eslint zone                                                                                                                               |
| 2026-07-30 | **Phase 4 2단계** — 디자인 토큰 이식(색 207 파싱 생성 · 타이포 67 `@utility` · `--font-scale` · `sm:392px` · `public/assets` 210개). 🔴 **Tailwind v3→v4 클래스 변경 4종 55곳 실측** — `rounded`(bare) 46곳이 v4에서 무시된다(§10-1). 죽은 코드 6건 이식 제외(D-184~D-190)                               |
| 2026-07-30 | **Phase 4 3단계** — HTTP 레이어 재작성. 재발급 트리거를 401 → **errorCode**로, 토큰을 메모리 → **localStorage**(레거시 키·따옴표 직렬화 유지), 대기 큐 + 자동 로그인. 타임아웃·paramsSerializer 제거. 테스트 19개. D-191~D-196                                                                           |
| 2026-07-30 | **Phase 4 4단계** — 네이티브 브릿지 재작성. `JsInterface` · `{type,data}` · iOS 객체/Android 문자열 · `window.CALLBACK_*` 7종 · mitt 자체 구현. zod 필드를 **전부 optional**로(필드 누락 메시지를 버리지 않게). 푸시 딥링크를 큐 + 이벤트로(순환 의존 제거). 테스트 14개                                 |
| 2026-07-30 | **Phase 4 7단계** — `showErrorModal()`로 `swalErrorModal`(293곳) 대체. SweetAlert2 v11 기본 수치 재현. `ModalBase`·`DrawerBase`. 테스트 7개                                                                                                                                                              |
| 2026-07-30 | **Phase 4 5·6·9·11단계** — 인증 슬라이스(에러코드 분기·`loginDataHandler`·로그아웃 플로우) · `aptInfo`를 `authStore`에 배치 · 레이아웃 셸(route `handle` 메타·뒤로가기 라우팅표·앱 종료 모달) · `features/dashboard` 삭제. **`AuthProvider`를 라우터 안으로 옮겼다**(밖에 있으면 `useNavigate`가 죽는다) |
| 2026-07-30 | **Phase 4 10단계** — `useInfiniteList` 이식(페이지 크기 10 · `pages[0]` pageable · 접두사 `resetCache` · `Object.values` 키 조립 유지). 테스트 6개                                                                                                                                                       |
| 2026-07-30 | **Phase 4 8단계** — 공용 컴포넌트 38개 완료. common 30개 재작성 + 레이아웃 5개 + Toast 2개 sonner 대체. 제어 컴포넌트로 바꾼 3곳에서 `useEffect` 안티패턴과 D-143을 함께 제거                                                                                                                            |
| 2026-07-30 | 🎯 **Phase 4 종료.** 완료 조건 검증 — `router.test.tsx`가 실제 라우트 트리로 로그인→메인 사슬 전체 통과. 4개 검증 통과 · 테스트 **51개**. ⚠️ `.env.*`는 권한 차단으로 사용자가 직접 추가해야 한다(`env-vars.md` §7)                                                                                      |
