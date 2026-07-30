# 인벤토리 추출 중 발생한 확인 항목

> 기준 SHA `6d5bf22` · 출처 `routes.md` §8, `endpoints.md` §13
> 상태: **확정** = 코드 근거로 해결 / **대기** = 사용자·도메인 판단 필요

## 요약

| #     | 항목                                        | 상태     | 결정                                         |
| ----- | ------------------------------------------- | -------- | -------------------------------------------- |
| R-1   | 항상허용 차량 수정 기능 부재                | **확정** | 의도된 제약 — **수정 기능 없이 그대로 이관** |
| R-2   | 미출차 내역 폐기 여부                       | **확정** | **이관 제외** (완전 비활성 확인됨)           |
| R-3   | opinion `/survey/list`가 NotFound 렌더      | **확정** | 등가 이관                                    |
| R-4   | 아파트몰 서비스명 불일치                    | **확정** | 등가 이관                                    |
| R-5   | 관리비 상세에 라우트 파라미터 없음          | **확정** | 설계상 정상                                  |
| R-6   | Repair 수정·상세의 `showBottomNav` 기본값   | **확정** | `false`                                      |
| E-Q2  | 미승인 입주민 조회가 비밀번호를 쿼리로 전송 | **확정** | **그대로 유지**                              |
| E-Q3  | 버전1 회원가입만 `auth` 인스턴스 사용       | **확정** | 정상 — 인증 인스턴스 유지                    |
| E-Q5a | `getNoticeTopThree` "미사용중" 주석         | **확정** | ⚠️ **주석이 틀렸다. 이관 필수**              |
| E-Q5b | `postRejectCarRelease` "미사용중" 주석      | **확정** | **이관 제외** (호출부 없음)                  |
| E-Q6  | `mealUuid` vs `aptMallOrderUuid`            | **확정** | 동일 값                                      |
| E-Q7  | 응답 봉투 `{ success, error }` 공통 여부    | **확정** | 전 API 공통                                  |

> **전 항목 확정.** 미결 없음.

---

## 확정 — 코드 근거

### R-3. opinion `/survey/list`는 NotFound를 렌더한다

`src/router/SurveyExternalIndex.js:6-15` — 라우트명은 `설문 리스트 (외부)`인데
컴포넌트는 `ExceptionView/OpinionExternalNotFoundView.vue`다. AppBar 제목은 `설문조사`.

**결론**: 의도 여부와 무관하게 **등가 이관 원칙상 동작을 그대로 재현한다.**
비회원은 설문 목록을 볼 수 없고, 딥링크로 개별 설문에만 접근한다는 뜻이므로 기능상 자연스럽다.
개선 의견은 `deferred.md`로 보낸다.

### R-4. 아파트몰 라우트명과 화면 제목이 다르다

라우트명 `아파트몰 나의 예약` / AppBar 제목 `주말조식 예약` (`src/router/AptMallIndex.js:16-25`).

**결론**: 라우트명은 내부 식별자라 사용자에게 보이지 않고, 화면에 보이는 것은 AppBar 제목이다.
**둘 다 그대로 유지**하면 등가가 성립한다. React에서는 라우트명이 사라지므로
`ROUTE_PATH` 키만 정하면 된다. 조치 불필요.

### R-5. 관리비 상세에 라우트 파라미터가 없는 것은 설계상 맞다

`src/views/ManagementFeeView/ManagementFeeDetailView.vue:9-19, 65-68`

조회 대상은 라우트가 아니라 **화면 내부 상태**로 정해진다:

1. `useGetManagementFeeImposeYearMonths()` — 조회 가능한 부과 연월 목록을 받는다
2. `selectedYear` / `selectedMonth` — 로컬 `ref`, **초기값 `null`**
3. `useGetManagementFeeBill(selectedYear, selectedMonth)` — 선택된 연월로 고지서 조회
4. `DrawerMonth` 컴포넌트에서 사용자가 연월을 고르면 `handleMonthChange({ year, month })`로 갱신

진입 경로 2곳 모두 파라미터 없이 이동한다 —
`ManagementFeeInfoView.vue:62`, `MainView/MainCardMenu/MainCardManagementFee.vue:90`.

**React 이관 시**: 연월 선택을 URL 쿼리로 올릴지(`?year=&month=`) 로컬 상태로 둘지 판단 여지가 있으나,
**등가 이관 원칙상 로컬 상태를 유지한다.** 타깃 `docs/conventions/04-state.md`의 "공유 가능한 상태는 URL"
규칙과 충돌하지만, 동작 변경(뒤로가기·새로고침 시 선택 유지 여부)이 생기므로 하지 않는다.
개선 의견은 `deferred.md`로.

### R-6. `showBottomNav` 기본값은 `false`

`src/lib/composables/useLayoutConfig.js:14-26`

```js
const DEFAULT_LAYOUT = {
  showAppBar: true,
  showBottomNav: false,
  appBarTitle: '',
  hasBackButton: true,
  backPath: null,
  appBarBackgroundColor: '#ffffff',
}
const layoutConfig = computed(() => ({ ...DEFAULT_LAYOUT, ...routeValue.meta }))
```

route meta가 기본값 위에 얕게 병합된다.

**결론**: `/repair/edit/:repairUuid`·`/repair/detail/:repairUuid`는 `showBottomNav` 미지정 →
**바텀 네비 없음**. 두 화면 모두 `showAppBar:false, hasBackButton:false`이므로 전체 화면이다.

**추가로 확정되는 전역 기본값** (meta 미지정 라우트 전체에 적용):

| 키                      | 기본값                                               |
| ----------------------- | ---------------------------------------------------- |
| `showAppBar`            | `true`                                               |
| `showBottomNav`         | `false`                                              |
| `appBarTitle`           | `''` (빈 문자열)                                     |
| `hasBackButton`         | `true`                                               |
| `backPath`              | `null` → 지정 없으면 `navigateBack()` (history back) |
| `appBarBackgroundColor` | `#ffffff`                                            |

`appBarStyle`은 배경색이 `#ffffff`가 **아닐 때만** 인라인 스타일을 반환한다
(`useLayoutConfig.js:40-49`) — 기본 흰색은 CSS 클래스가 담당.

### E-Q3. 버전1 회원가입이 `auth` 인스턴스를 쓰는 이유

`src/lib/queries/auth/usePostUserVersionOneInfo.js`

버전1 플로우는 **이미 로그인한 상태에서 시작한다**:

```
postLogin 성공 → 응답에 oldResidentFlag → /versionOne/terms (토큰 보유 상태)
  → 약관 동의 + 본인인증(KMC)
  → postVersionOneResidentSignUp  ← 토큰이 이미 있으므로 auth 인스턴스
  → onSuccess: loginDataHandler() 후 /main
```

`onSuccess`에서 **재로그인 없이 곧바로 `loginDataHandler()`**(로그인 후 부트스트랩)를 호출하는 것이
결정적 근거다. 신규 회원가입(`postSignUp`, `client`)과 달리 인증된 요청이 맞다.

에러코드: `RESIDENT_ALREADY_EXISTS` · `HOUSEHOLD_NOT_FOUND` · `HOUSEHOLD_HEAD_ALREADY_EXISTS` ·
`KMC_ERROR`. 전부 `swalErrorModal` 후 `deleteLocalInfo()` + `/`로 이동한다.

**결론**: 이관 시에도 인증 인스턴스(`api`)를 쓴다. 조치 불필요.

### E-Q6. `aptMallOrderUuid`와 `mealUuid`는 같은 값이다

`src/lib/queries/aptMall/useGetAptMallMyOrderDetail.js:17-23`

```js
queryKey: ['aptMallMyOrderDetail', getParams().aptMallOrderUuid],
queryFn: () => getAptMallMyOrderDetail({ mealUuid: getParams().aptMallOrderUuid, ... })
```

라우트 파라미터 `:aptMallOrderUuid`를 그대로 API의 `mealUuid`로 넘긴다. 이름만 다르다.

**이관 시**: 라우트 파라미터명(`:aptMallOrderUuid`)은 유지한다.

> ⚠️ **2026-07-30 정정** — `mealUuid`는 **서버 계약이 아니다.** `api/aptMall.js`가
> `` `${apiApartmant}/${aptResidentUuid}/apt-mall/order/${mealUuid}` ``로 값만 보간하므로
> **이름은 서버에 전달되지 않는다.** 즉 프론트 함수 인자명일 뿐이고, 바꿔도 요청은 동일하다.
> 통일 여부는 `features/apt-mall.md` `AM-Q22`에서 결정한다.
> 매핑 지점을 `queries/`에 두면 레거시와 동일한 구조가 된다.

> ⚠️ **부수 발견 (동작 영향 없음)**: `useDeleteAptMallMyOrder.js:20`의
> `mealUuid: mealUuid || getParams()?.mealUuid` — 폴백이 `getParams()?.mealUuid`를 읽지만
> 실제 라우트 파라미터명은 `aptMallOrderUuid`라 **항상 `undefined`**다.
> 호출부(`AptMallMyOrderCancelButton.vue:37`)가 값을 명시적으로 넘기므로 죽은 코드다.
> 이관 시 폴백을 제거해도 동작이 같다 → `deferred.md`에 기록.

### E-Q7. 응답 봉투 `{ success, error }`는 전 API 공통이다

`src/` 전수 grep 결과:

| 패턴                                                 |  출현 |
| ---------------------------------------------------- | ----: |
| `data.success`                                       |    61 |
| `data?.success`                                      |    26 |
| `data.error`                                         |    71 |
| `data?.error`                                        |    10 |
| `data.fail`                                          |     0 |
| 봉투 없이 `response.data` 직접 사용 (`lib/queries/`) | **0** |

**결론**: 모든 응답이 `{ data: { success: <실제 데이터> } }`, 모든 에러가
`{ data: { error: { errorCode, message } } }` 형태다. 예외 없음.

**이관 설계 (Phase 5에서 확정)**:

- 성공 언랩 — feature의 `api/` 함수가 `response.data.success`까지 벗겨 실제 데이터만 반환한다.
  타깃 `docs/conventions/03-api.md`의 "`data`만 반환" 규칙과 일치.
- 에러 정규화 — `toApiError`가 `error.response.data.error.errorCode`를 `ApiError.code`로,
  `.message`를 `ApiError.message`로 매핑하도록 **`apiErrors.ts`의 `ServerErrorBody` 확장이 필요하다**.
  현재는 `{ message?, code? }` 평면 구조를 가정하므로 레거시의 중첩 구조(`{ error: { errorCode, message } }`)와 맞지 않는다.
  **→ Phase 3 `tech-mapping.md`의 필수 항목.**

---

## 확정 — 사용자 결정 + 호출부 검증

### R-1. 항상허용 차량에 수정 기능이 없다 → **의도된 제약. 그대로 이관**

|          | 즐겨찾기             | 항상허용                    |
| -------- | -------------------- | --------------------------- |
| 목록     | ✅ `#48` / API `#75` | ✅ `#49` / API `#72`        |
| 등록     | ✅ `#50` / API `#76` | ✅ `#51` / API `#73`        |
| **수정** | ✅ `#52` / API `#77` | ❌ **라우트·API 모두 없음** |
| 삭제     | — / API `#78`        | — / API `#74`               |

라우트와 API **양쪽에서 일관되게 부재**한다.

**결정 (사용자)**: **의도된 제약.** 항상허용 차량은 등록·삭제만 가능하고 수정은 없다.
React 이관 시에도 수정 화면·API를 만들지 않는다.

이관 대상:

| 기능 | 즐겨찾기                 | 항상허용                 |
| ---- | ------------------------ | ------------------------ |
| 목록 | 라우트 `#48` / API `#75` | 라우트 `#49` / API `#72` |
| 등록 | 라우트 `#50` / API `#76` | 라우트 `#51` / API `#73` |
| 수정 | 라우트 `#52` / API `#77` | **없음 (이관 안 함)**    |
| 삭제 | API `#78`                | API `#74`                |

`CarManagementEditView.vue`는 즐겨찾기 전용이 된다.

### R-2. 미출차 내역 → **이관 제외**

**완전 비활성이 확인됐다.** 라우트뿐 아니라 진입점 2곳도 전부 주석 처리되어
사용자가 도달할 수 있는 경로가 하나도 없다.

| 위치                            | 상태                                                                                                                                   |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| 라우트 `/parking/notoutHistory` | `ParkingManagementIndex.js:215-228` **주석**                                                                                           |
| 메인 화면 진입점                | `MainView.vue:9` `// import MainNotOutHistory`, `:90` `<!-- <MainNotOutHistory /> -->` **주석**                                        |
| 주차관리 메뉴 진입점            | `ParkingManagementMenus.vue:3` `// import`, `:61` `<!-- ... -->` **주석**                                                              |
| 컴포넌트 3개                    | `NotOutCarHistoryListView.vue`, `MainNotOutHistory.vue`, `ParkingManagementMenusNotOutHistory.vue` — 파일은 존재하나 **렌더되지 않음** |
| 쿼리 훅 2개                     | `useGetNotOutCarList.js`, `useGetNotOutHistorySummary.js` — 위 컴포넌트에서만 사용                                                     |
| API 2개                         | `#84`·`#85` — `#82` `getInOutCarList`와 **완전히 같은 URL**, 둘은 구현까지 동일                                                        |
| 상수                            | `constants/domain/parking.js:77` `notOutHistory`                                                                                       |

**결정 (사용자)**: **이관 제외.** 위 라우트·컴포넌트 3개·훅 2개·API 2개·상수를 전부 이관 대상에서 뺀다.
사용자에게 노출된 적이 없으므로 등가 이관 원칙에 위배되지 않는다.
나중에 필요해지면 전용 서버 API가 갖춰진 뒤 새로 만든다.

### E-Q5a. `getNoticeTopThree` → ⚠️ **주석이 틀렸다. 이관 필수**

`api/board.js:39`의 주석은 `(미사용중)메인 공지사항 Top3 조회`이지만, **실제로는 살아있는 기능이다.**

```
api/board.js:40            getNoticeTopThree
  └─ lib/queries/board/useGetNoticeTopThree.js      queryKey: ['noticeTopThree', aptUuid]
       └─ views/MainView/MainNoticeTopThree.vue
            └─ views/MainView/MainView.vue:7   import MainNoticeTopThree      ← 주석 아님
               views/MainView/MainView.vue:94  <MainNoticeTopThree />         ← 주석 아님
```

같은 파일의 `MainNotOutHistory`는 `// import` / `<!-- ... -->`로 주석 처리된 반면,
`MainNoticeTopThree`는 **주석 없이 렌더된다.** 메인 화면 하단에 공지 Top3가 실제로 표시되고 있다.

**결정**: **이관 대상.** API 주석은 낡은 것이므로 무시한다.
제외했다면 메인 화면 기능이 사라져 등가 이관이 깨졌을 항목이다.

> **교훈**: `(미사용중)` 같은 코드 주석을 근거로 제외를 판단하지 않는다.
> 반드시 렌더 트리까지 호출부를 추적한다. 다른 도메인 명세 작성 시에도 동일하게 적용한다.

### E-Q5b. `postRejectCarRelease` → **이관 제외**

`api/parking.js:241`. 전수 grep 결과 **정의부 외에 호출부가 전혀 없다** — 쿼리 훅도, 컴포넌트도 없다.

**결정 (사용자)**: **이관 제외.**

### E-Q2. 미승인 입주민 조회가 비밀번호를 쿼리스트링으로 보낸다 → **그대로 유지**

`src/api/auth.js:103-108`

```js
export const getWaitingMemberLoginInfo = async ({ id, password }) => {
  const response = await client.get(`${apiApartmant}/login/waiting-info`, {
    params: { id, password },   // ← URL에 평문 비밀번호
  });
```

아이디·비밀번호가 URL에 실려 나간다. 서버 액세스 로그, 프록시 로그, 브라우저 히스토리,
리퍼러 헤더에 평문으로 남는다. 승인 대기 중인 입주민이 로그인을 시도할 때
FCM 토큰 등록을 위해 호출된다 (`useWaitingMemberFcmToken.js`).

이것은 레거시가 아이디·비밀번호를 `userAuthInfo`에 **평문 localStorage 저장**하는 것과
같은 뿌리의 문제다(Phase 0-3에서 다루기로 한 항목).

**결정 (사용자)**: **그대로 유지.** 쿼리스트링 전송을 레거시와 동일하게 이관한다.

이 결정은 이후 확정된 **로그인 전면 유지 방침**(→ `decisions/auth-strategy.md`)과 일관된다.
인증 관련은 레거시 구현을 그대로 옮기고, 보안 개선은 전환 완료 후 별도 작업으로 돌린다.
`deferred.md` D-16에 기록됨.
