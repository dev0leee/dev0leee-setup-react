# 결정 — 기술 선택 (Phase 0-5 · 0-6 · 에러 표시)

> 결정일: 2026-07-29 · 결정자: 사용자
> 기준 SHA `6d5bf22`

## 요약

| #    | 항목              | 결정                                          |
| ---- | ----------------- | --------------------------------------------- |
| 0-6  | opinion 빌드 형태 | **멀티 엔트리 유지**                          |
| 0-5a | 날짜 선택기       | **shadcn `calendar` 추가** (react-day-picker) |
| 0-5b | 차트              | **recharts** (타깃 기설치)                    |
| 0-5c | `v-calendar`      | **제거** — 미사용 확인                        |
| Q-Q3 | 에러 표시         | **Base UI Dialog로 레거시 모달 재현**         |

---

## 0-6. opinion 빌드 — 멀티 엔트리 유지

레거시 구조를 그대로 가져간다. 별도 엔트리 · 별도 라우터 · 별도 출력 디렉터리.

### 근거

1. **경로가 충돌한다** — 두 앱이 같은 path를 다른 화면·다른 meta로 쓴다.
   `routes.md` §5에 11건. 특히 투표 개요는 경로 **구조**까지 다르다:
   메인 `/vote/detail/:voteUuid/:voterUuid` vs opinion `/vote/:voterUuid`
2. **단일 앱으로 합치면 외부 링크가 전부 깨진다** — opinion은 문자로 발송된 딥링크로만 진입한다.
   `/opinion/*` 접두사를 붙이면 이미 발송된 링크가 죽는다. **등가 이관 위배.**
3. **환경변수가 다르다** — opinion은 3개, 메인은 7개(`env-vars.md` §1-2).
   통합 스키마를 쓰면 opinion 빌드가 **부팅 시 zod 검증 실패로 죽는다.**
4. **비회원 앱에 입주민 번들을 내려보낼 이유가 없다.**

### 구현

```
src/
├── main.tsx            # 메인 앱 엔트리
├── main-opinion.tsx    # opinion 엔트리
├── app/
│   ├── App.tsx         router.tsx        # 메인
│   └── OpinionApp.tsx  routerOpinion.tsx # opinion
└── config/
    ├── env.ts          # 메인 스키마 (7 + 공통)
    └── envOpinion.ts   # opinion 스키마 (3 + 공통)
```

| 항목       | 방침                                                                                                                                                   |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Vite 설정  | `vite.config.ts`에서 `mode.includes('opinion')`으로 분기. **설정 파일은 ESLint `no-restricted-syntax` 대상 밖**이라 `import.meta.env` 금지 규칙과 무관 |
| 출력       | `dist/main` · `dist/opinion` (레거시 동일)                                                                                                             |
| 스크립트   | `dev:opinion` · `build:dev:opinion` · `build:prod:opinion` (레거시 동일)                                                                               |
| env 스키마 | **2개로 분리.** opinion 빌드가 메인 전용 변수를 요구하지 않도록                                                                                        |
| 공유 코드  | 투표·설문 feature와 `shared/**`를 양쪽이 함께 쓴다. opinion은 인증 관련을 import하지 않는다                                                            |
| 라우터     | `routerOpinion.tsx` — 인증 가드 없음. `beforeEach`의 오프라인 체크만 재현                                                                              |

> ⚠️ opinion 앱도 `CALLBACK_GO_BACK`을 구독한다(`native-protocol.md` C2, `OpinionApp.vue:19`).
> 빠뜨리기 쉬운 지점.

---

## 0-5a. 날짜 선택기 — shadcn `calendar`

`@vuepic/vue-datepicker` → **shadcn `calendar`** (내부적으로 `react-day-picker`)

```bash
npx shadcn add calendar
```

### 근거

타깃이 이미 shadcn(`base-nova` 스타일) 체계이고 `date-fns`도 설치돼 있어 결이 맞는다.
의존성 추가가 shadcn 생성물 + `react-day-picker` 하나로 끝난다.

### 사용처 5개 인스턴스 / 4개 화면

| 화면              | 파일                                                                          | 용도                                                      |
| ----------------- | ----------------------------------------------------------------------------- | --------------------------------------------------------- |
| 아파트몰 예약     | `AptMallView/AptMallFormOrderCalendarDate.vue:68`                             | 주문 날짜                                                 |
| 방문예약 등록     | `ParkingManagementView/ReservationCar/ReservationCarAddCalendarModal.vue:105` | 입·출차 예정일                                            |
| 이사예약 등록     | `MovingHouseView/MovingHouseWriteView.vue:235`                                | 이사 날짜 (휴무일 비활성화 — `getMovingHouseHolidayList`) |
| 임시비밀번호 생성 | `VisitView/LobbyPhone/VisitLobbyPhoneTempPasswordCreateView.vue:155, 172`     | 유효기간 시작·종료 **(2개)**                              |

### 주의

- **기본 모양이 다르다.** 레거시 `VueDatePicker`와 픽셀 동일하게 보이도록 래퍼에서 스타일을 맞춘다.
  등가 이관 원칙상 **신규가 레거시에 맞춘다.**
- 각 화면의 실제 옵션(시간 선택 여부, 최소·최대일, 비활성 날짜, 범위 선택 여부)은
  **도메인 명세 작성 시 원본에서 그대로 옮긴다.**
- 이사예약은 **휴무일 API 결과로 특정 날짜를 비활성화**한다. `react-day-picker`의 `disabled` matcher로 재현.
- 임시비밀번호는 한 화면에 2개가 있고 **시작 ≤ 종료** 제약이 있을 가능성이 높다. 명세 시 확인.

---

## 0-5b. 차트 — recharts

`apexcharts` → **`recharts`** (타깃 기설치, shadcn `chart` 래퍼도 있음)

### 근거

의존성 추가가 **0**이다. 사용처가 바 차트 2종뿐이라 recharts로 충분하다.

### 사용처 2개 화면

| 화면               | 파일                                                       | 차트                    |
| ------------------ | ---------------------------------------------------------- | ----------------------- |
| 관리비 정보        | `ManagementFeeView/ManagementFeeInfoView.vue:372, 388`     | 가로 바 + 세로 바 (2개) |
| 메인 주차 마일리지 | `MainView/MainCardMenu/MainCardParkingMileageChart.vue:81` | 1개                     |

### 주의

- 레거시는 `new ApexCharts(ref, options)`로 **명령형 생성**한다. recharts는 선언형이라
  구조가 달라진다. **옵션 객체를 한 줄씩 대조하며 옮긴다.**
- `ManagementFeeInfoView.vue:521`에 `:deep(.apexcharts-data-labels text)` **스코프 스타일 오버라이드**가 있다.
  ApexCharts 내부 클래스를 직접 건드리는 것이라 recharts에는 대응물이 없다 —
  동일한 시각 결과를 recharts 방식으로 다시 만들어야 한다.
- **눈금·라벨·색·간격을 픽셀 단위로 대조**한다(등가 이관). 차트는 시각 차이가 가장 눈에 띈다.

---

## 0-5c. `v-calendar` — 제거

**미사용 확인.** `src/main.js:52`에서 `app.use(VCalendar, {})`로 전역 등록하고
`v-calendar/style.css`를 import하지만, **`<VCalendar>` 컴포넌트를 쓰는 파일이 0개다.**

전수 grep 결과 `v-calendar` 관련 참조는 `main.js`의 등록 코드 2줄뿐이다.

**결정**: 이관하지 않는다. 결정이랄 것도 없는 자명한 정리다.
(레거시 번들에는 여전히 포함돼 있었다 — 제거로 번들이 줄어드는 부수 효과)

---

## Q-Q3. 에러 표시 — Base UI Dialog로 레거시 모달 재현

`sweetalert2`를 추가하지 않고, **이미 설치된 `@base-ui/react`로 같은 모양·같은 타이밍의
에러 모달 래퍼를 만든다.**

### 근거

- 등가 이관: 에러 UX가 69개 파일에 걸쳐 있어 방식을 바꾸면 체감 변화가 가장 크다
- 오버레이 체계를 둘(Base UI + SweetAlert)로 만들지 않는다
- 타깃 `docs/conventions/11-overlay.md`가 이미 Base UI Dialog 래퍼를 규정하고 있다
- 라이브러리 추가 없음

### 구현 (Phase 4)

`shared/components/common/`에 레거시 `swalErrorModal.js`(29 LOC)와 **동일한 인터페이스**의 래퍼:

```ts
showErrorModal({ text, callback })
```

레거시 사양 (`lib/swalModal/swalErrorModal.js`):

| 항목         | 값                     |
| ------------ | ---------------------- |
| 확인 버튼 색 | `#2563EB`              |
| z-index      | `9999` (클래스로 지정) |
| 콜백         | 확인 시 실행           |

**모양·문구·버튼 위치를 레거시 스크린샷과 대조**해 맞춘다.

### 전역 토스트·에러 바운더리는 어떻게 되나

타깃 `queryClient.ts`는 `MutationCache.onError` → sonner 토스트,
`queries.throwOnError: true` → 에러 바운더리 렌더로 설계돼 있다.
**레거시에는 이 두 가지가 없다** (`query-keys.md` §5).

| 타깃 기능                           | 이관 방침                                                                                                                                                             |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `MutationCache.onError` 전역 토스트 | **끈다.** 레거시는 훅마다 개별 모달을 띄운다. 켜두면 모달 + 토스트가 이중으로 뜬다                                                                                    |
| `queries.throwOnError: true`        | **끈다.** 레거시는 에러 시 화면 내부에서 처리(`isError` 분기)한다                                                                                                     |
| `queries.retry`                     | **0으로.** 레거시 `main.js` 설정                                                                                                                                      |
| `queries.staleTime`                 | **0으로.** 레거시는 미설정(기본 0)                                                                                                                                    |
| 3단 에러 바운더리                   | **최상위(RootErrorFallback)만 유지.** 예상치 못한 렌더 에러의 안전망 역할은 레거시에 없던 개선이지만 **정상 동작 시 화면에 나타나지 않으므로** 등가성을 해치지 않는다 |
| 오프라인 토스트                     | **유지.** 레거시도 라우터 가드에서 `네트워크 상태를 확인해주세요` 토스트를 띄운다(`routes.md` §6-1). 문구를 레거시와 동일하게                                         |

> 이 항목들은 계획서 3-2·3-4에 반영하고, Phase 5 파일럿(MyPage)에서 실제 화면으로 검증한다.

---

## 잔여

| #   | 항목           | 상태                                                                      |
| --- | -------------- | ------------------------------------------------------------------------- |
| 0-7 | zod 3 → 4 차이 | **Claude 진행** — 결정 사항 아님. `src/schemas/**` 대조 후 변환 규칙 작성 |

## 의존성 변화 요약

| 레거시                                                                 | 타깃                                   | 추가 여부                        |
| ---------------------------------------------------------------------- | -------------------------------------- | -------------------------------- |
| `@vuepic/vue-datepicker`                                               | shadcn `calendar` + `react-day-picker` | **추가**                         |
| `v-calendar`                                                           | —                                      | 제거                             |
| `apexcharts`                                                           | `recharts`                             | 추가 없음 (기설치)               |
| `sweetalert2`                                                          | `@base-ui/react` Dialog                | 추가 없음 (기설치)               |
| `swiper`                                                               | `swiper/react`                         | 추가 (동일 패키지, React 바인딩) |
| `mitt`                                                                 | 자체 이벤트 버스                       | 추가 없음                        |
| `vue-dompurify-html`                                                   | `dompurify`                            | **추가**                         |
| `he` · `qrcode` · `html2canvas` · `quill-delta-to-html` · `posthog-js` | 동일                                   | **추가** (프레임워크 무관)       |

> 타깃 CLAUDE.md의 "라이브러리 임의 추가 금지"에 따라, 위 목록은 **Phase 4 착수 시
> 한 번에 승인받고** 설치한다.
