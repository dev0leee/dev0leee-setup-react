# 도메인 명세 — 주차 관리 (parking)

> 기준 SHA `6d5bf22` · 레거시 `views/ParkingManagementView/` 31개 파일 3,278 LOC
> 타깃 슬라이스 `features/parking/`
> API 20개 (`endpoints.md` #63~#82 대역) · 쿼리 훅 24개 · 라우트 15개

**Board 다음으로 큰 도메인이다.** 마일리지·방문예약·차량관리(즐겨찾기/항상허용)·입출차내역·
정기권차량·거부차량 6개 계보가 한 폴더에 있다.

> ⚠️ **화면 ID는 `PK*`, 확인 항목은 `PK-Q*`를 쓴다.**
> `mypage.md`가 `P1`~~`P8`·`P-Q1`~~`P-Q4`를, `broken-styles.md`가 `B-Q*`를 이미 점유했다.

## 이관 제외 (확정)

`decisions/inventory-questions.md` R-1 · R-2 · E-Q5b가 정본이다.

| 대상                                                                 | 근거                                                        |
| -------------------------------------------------------------------- | ----------------------------------------------------------- |
| **미출차 내역 일체**                                                 | R-2 — 라우트·진입점 2곳 전부 주석 처리, 도달 경로 없음      |
| ├ 라우트 `/parking/notoutHistory`                                    | `ParkingManagementIndex.js:215-228` 주석                    |
| ├ `NotOutHistory/NotOutCarHistoryListView.vue` (82줄)                | 라우트 없음                                                 |
| ├ `ParkingManagement/ParkingManagementMenusNotOutHistory.vue` (47줄) | `ParkingManagementMenus.vue:2,63` 주석                      |
| ├ `MainView/MainNotOutHistory.vue`                                   | `MainView.vue:9,90` 주석 (`main.md` 참조)                   |
| ├ 훅 `useGetNotOutCarList` · `useGetNotOutHistorySummary`            | 위 컴포넌트 전용                                            |
| ├ API `getNotOutCarList` · `getNotOutCarHistorySummary`              | 위 훅 전용                                                  |
| └ 상수 `CARD_ITEM_FIELD.notOutHistory`                               | 위 컴포넌트 전용                                            |
| **`postRejectCarRelease`** (`api/parking.js:241`)                    | E-Q5b — 정의부 외 호출부 전무                               |
| **항상허용 차량 _수정_ 기능**                                        | R-1 — 라우트·API 양쪽에 애초에 없다. **새로 만들지 않는다** |

> ⚠️ `getNotOutCarList`·`getNotOutCarHistorySummary`는 **본문이 완전히 동일하며**
> `getInOutCarList`와 **같은 엔드포인트**(`/inout-parking/{aptResidentUuid}`)를 친다.
> 파라미터만 `page`·`size`뿐이다. 제외 대상이라 이관하지 않는다.

**제외 후 실이관 범위: 화면 15개 · 파일 28개 · API 18개 · 훅 22개**

---

## 화면 목록

| #    | 경로                                         | name               | 컴포넌트                                  | meta                             |
| ---- | -------------------------------------------- | ------------------ | ----------------------------------------- | -------------------------------- |
| PK1  | `/parking`                                   | 주차 관리          | `ParkingManagement/ParkingManagementView` | AppBar `주차 관리` · **eager**   |
| PK2  | `/parking/mileage/history`                   | 마일리지 내역      | `Mileage/MileageHistoryListView`          | AppBar `마일리지 내역`           |
| PK3  | `/parking/carManagement/bookmark/list`       | 즐겨찾기 차량      | `CarManagement/CarManagementListView`     | AppBar `즐겨찾기 차량`           |
| PK4  | `/parking/carManagement/alwaysAllow/list`    | 항상허용 차량      | `CarManagement/CarManagementListView`     | AppBar `항상허용 차량`           |
| PK5  | `/parking/carManagement/bookmark/add`        | 즐겨찾기 차량 등록 | `CarManagement/CarManagementAddView`      | AppBar `즐겨찾기 차량 등록`      |
| PK6  | `/parking/carManagement/alwaysAllow/add`     | 항상허용 차량 등록 | `CarManagement/CarManagementAddView`      | AppBar `항상허용 차량 등록`      |
| PK7  | `/parking/carManagement/bookmark/edit/:uuid` | 즐겨찾기 차량 수정 | `CarManagement/CarManagementEditView`     | AppBar `즐겨찾기 차량 수정`      |
| PK8  | `/parking/inoutHistory`                      | 입출차 내역        | `InOutHistory/InOutCarHistoryListView`    | AppBar `입출차 내역`             |
| PK9  | `/parking/inoutHistory/detail/:uuid`         | 입출차 차량 상세   | `InOutHistory/InOutCarHistoryDetailView`  | AppBar `입출차 차량 상세`        |
| PK10 | `/parking/reject/:uuid`                      | 차량 거부          | `RejectCar/RejectReasonView`              | AppBar `차량 거부`               |
| PK11 | `/parking/reservation`                       | 방문예약 관리      | `ReservationCar/ReservationCarListView`   | AppBar `방문예약 관리`           |
| PK12 | `/parking/reservation/add`                   | 방문예약 등록      | `ReservationCar/ReservationCarAddView`    | AppBar `방문예약 등록`           |
| PK13 | `/parking/reservation/add/:uuid`             | 방문예약 재등록    | `ReservationCar/ReservationCarAddView`    | AppBar `방문예약 재등록`         |
| PK14 | `/parking/reservation/detail/:uuid`          | 방문예약 상세      | `ReservationCar/ReservationCarDetailView` | **`showAppBar:false`**           |
| PK15 | `/parking/regular-car`                       | 정기권 차량        | `RegularCar/RegularCarListView`           | AppBar `정기권 차량` · **eager** |

**전 화면 `showBottomNav: false` · `hasBackButton: true`.**
PK1·PK15만 정적 import(eager). 나머지 13개는 동적.

> ⚠️ **PK3/PK4, PK5/PK6, PK12/PK13은 같은 컴포넌트를 경로만 바꿔 재사용한다.**
> 분기는 `useCarManagementType`(경로에 `alwaysAllow` 포함 여부) 또는 `:uuid` 유무로 한다.
> **라우트 파라미터가 아니라 경로 문자열을 읽는다** — React 이관 시 `useLocation().pathname` 기반 유지.
>
> ⚠️ **PK7만 있고 항상허용 수정 라우트는 없다** (R-1, 의도된 제약).
> `CarManagementEditView`는 **즐겨찾기 전용**이 된다.
>
> ⚠️ **PK14만 `showAppBar:false`다.** 우측에 `삭제` 버튼을 넣기 위해 화면 안에서 직접 렌더한다.

### 진입 경로

| 화면 | 진입 출처                                                                                 |
| ---- | ----------------------------------------------------------------------------------------- |
| PK1  | 메인 메뉴 `constants/domain/common.js:17` · `MyPageMenuList.vue:18`                       |
| PK2  | PK1 `잔여 주차 마일리지` 헤더 · `MainCardParkingMileage.vue:57` · `MyPageMenuList.vue:19` |
| PK3  | PK1 메뉴 `즐겨찾기 차량`                                                                  |
| PK4  | PK1 메뉴 `항상허용 차량` (**마일리지 한도 제한 단지에서는 숨겨짐** → §PK1)                |
| PK5  | PK3 하단 `+ 등록하기`                                                                     |
| PK6  | PK4 하단 `+ 등록하기`                                                                     |
| PK7  | PK3 카드 클릭 → 드로어 `수정`                                                             |
| PK8  | PK1 메뉴 `입출차 내역`                                                                    |
| PK9  | PK8 카드 클릭 · **네이티브 푸시 딥링크** (`natives/common.js:88`)                         |
| PK10 | PK9 `거부하기` → 모달 `거부하기`                                                          |
| PK11 | PK1 메뉴 `주차 방문예약` · `MainCardReservation.vue:35`                                   |
| PK12 | PK11 하단 `예약하기`                                                                      |
| PK13 | PK11 카드 `방문예약 재신청하기` · PK14 하단 `방문예약 재신청하기`                         |
| PK14 | PK11 카드 클릭                                                                            |
| PK15 | `MyPageMenuList.vue:20` (PK1에는 **임베드**되어 있고 링크가 아니다)                       |

**네이티브 푸시 딥링크**: `natives/common.js:88` — `targetPath = /parking/inoutHistory/detail/${dataUuid}`.
게시판 공지 상세(`board.md` B2)와 함께 **푸시 대상 2곳 중 하나**다.

---

## 1. 하위 컴포넌트 전수 (이관 대상 28개)

| 파일                                 |  줄 | 역할                                    | 사용 화면                 |
| ------------------------------------ | --: | --------------------------------------- | ------------------------- |
| `CardList.vue`                       | 124 | **주차 도메인 공용 목록 셸**            | PK2·PK3·PK4·PK8·PK11·PK15 |
| `BookmarkCarSelectorButton.vue`      |  49 | 즐겨찾기 차량 불러오기 드로어           | PK6·PK12·PK13             |
| `VisitPurposeSelect.vue`             | 126 | 방문목적 선택 드로어                    | PK6·PK12·PK13             |
| **ParkingManagement/**               |     |                                         |                           |
| `ParkingManagementView.vue`          |  17 | PK1 셸                                  | PK1                       |
| `ParkingManagementMileage.vue`       | 103 | 잔여 마일리지 + 정책 버튼               | PK1                       |
| `ParkingMileageProgressBar.vue`      |  79 | 마일리지 진행바 (애니메이션)            | PK1                       |
| `ParkingManagementPolicy.vue`        |  32 | `아파트 주차 정책` 버튼                 | PK1                       |
| `ParkingManagementPolicyModal.vue`   | 154 | 주차 정책 드로어                        | PK1                       |
| `ParkingManagementMenus.vue`         |  63 | 2열 메뉴 그리드                         | PK1                       |
| `ParkingManagementItem.vue`          |  65 | 메뉴 타일 1개 (흔들림 애니메이션)       | PK1                       |
| **Mileage/**                         |     |                                         |                           |
| `MileageHistoryListView.vue`         | 144 | PK2                                     | PK2                       |
| `MileageCardMenus.vue`               |  83 | 잔여/사용 마일리지 카드 2개             | PK2                       |
| `MileageCard.vue`                    |  41 | 마일리지 카드 1개                       | PK2                       |
| **CarManagement/**                   |     |                                         |                           |
| `CarManagementListView.vue`          | 119 | PK3·PK4 셸 (드로어·삭제모달·등록버튼)   | PK3·PK4                   |
| `CarManagementList.vue`              | 188 | 차량 카드 목록 (즐겨찾기/항상허용 분기) | PK3·PK4 + 드로어          |
| `CarManagementAddView.vue`           |   7 | PK5·PK6 래퍼                            | PK5·PK6                   |
| `CarManagementEditView.vue`          |   7 | PK7 래퍼                                | PK7                       |
| `CarManagementForm.vue`              | 268 | 등록·수정 공용 폼                       | PK5·PK6·PK7               |
| `CarManagementEmptyText.vue`         |  11 | ⛔ **미사용 (죽은 파일)**               | —                         |
| **InOutHistory/**                    |     |                                         |                           |
| `InOutCarHistoryListView.vue`        | 148 | PK8                                     | PK8                       |
| `InOutCarHistoryDetailView.vue`      | 226 | PK9                                     | PK9                       |
| **RejectCar/**                       |     |                                         |                           |
| `RejectReasonView.vue`               |  75 | PK10                                    | PK10                      |
| **ReservationCar/**                  |     |                                         |                           |
| `ReservationCarListView.vue`         | 188 | PK11                                    | PK11                      |
| `ReservationCarAddView.vue`          | 221 | PK12·PK13                               | PK12·PK13                 |
| `ReservationCarDetailView.vue`       | 192 | PK14                                    | PK14                      |
| `ReservationCarAddCalendar.vue`      | 104 | 예약 기간 선택 필드                     | PK12·PK13                 |
| `ReservationCarAddCalendarModal.vue` | 171 | 달력 드로어 (`@vuepic/vue-datepicker`)  | PK12·PK13                 |
| `ReservationAgainButton.vue`         |  40 | `방문예약 재신청하기` 버튼              | PK11·PK14                 |
| **RegularCar/**                      |     |                                         |                           |
| `RegularCarListView.vue`             | 104 | PK15 + **PK1에 임베드**                 | PK1·PK15                  |

> ⚠️ **`CarManagementEmptyText.vue`는 어디서도 import되지 않는다.**
> 빈 상태 문구는 `CardList`의 `empty-message` prop으로 처리된다.
> → `deferred.md` 「죽은 코드」. **이관 제외**

---

## 2. 공용 컴포넌트 의존

| 컴포넌트         | 주차에서 넘기는 props                                                                                        |
| ---------------- | ------------------------------------------------------------------------------------------------------------ |
| `AppBar`         | PK14만 사용 — `title="방문예약 차량 상세"` + 슬롯(`삭제` 버튼)                                               |
| `DrawerBase`     | `title` · `is-close` · `is-button` · `@close` + `#content` / `#firstButton` 슬롯                             |
| `DrawerMonth`    | `initial-year` · `initial-month` · `none-padding` · `@change-month`                                          |
| `ModalButton`    | `button-type`(`outline`/`dual`) · `:modal-data` · `:first-handle` · `:second-handle`                         |
| `ChipBase`       | `color`(`green`/`gray`/`blue`/`purple`/`red`/`orange`/`deepPurple`) · `variant="fill"` · `class-name`        |
| `ButtonBase`     | `type` · `color` · `size`(`md`/`lg`/`xl`/`2xl`) · `round-type` · `has-outline` · `custom-class` · `disabled` |
| `InputBase`      | `id` · `type` · `placeholder` · `maxlength`                                                                  |
| `InputRadioDual` | `:list="PARKING_WALL_PAD_ALARM_INPUT"` · `name="parkingWallPadAlarm"`                                        |
| `SkeletonBase`   | `class`로 크기 지정                                                                                          |
| `SpinnerCircle`  | `color`(PK14의 `삭제`만 `black`)                                                                             |
| `TextEmpty`      | 슬롯 텍스트                                                                                                  |
| `TextError`      | 슬롯에 `errors.<field>`                                                                                      |

> ⚠️ **주차 도메인은 `SpinnerDots`가 아니라 `SkeletonBase`를 쓴다.**
> 게시판(`board.md`)은 전부 `SpinnerDots` 전체화면 오버레이인데, 주차는 **골격 스켈레톤**이다.
> 로딩 UX가 도메인마다 다르다. **그대로 이관.**

### `DrawerMonth` (월 선택) — 주차 3화면이 사용

| 항목                    | 동작                                                                            |
| ----------------------- | ------------------------------------------------------------------------------- |
| 기본 선택               | `initialYear ?? 현재 연도` · `initialMonth ?? 현재 월`                          |
| 선택 가능 목록          | `availableYearmonths`가 없으면 **`generateMonths()` — 이번 달 포함 최근 3개월** |
| emit                    | `changeMonth({ year, month })`                                                  |
| `lodash`의 `times` 사용 |                                                                                 |

**주차에서는 `availableYearmonths`를 넘기지 않는다** → 항상 **최근 3개월만** 선택 가능.
(관리비 도메인은 넘긴다 — `ManagementFee` 명세 참조)

---

## 3. 공용 훅·유틸·상수

### 3-1. `useCarManagementType` — 즐겨찾기/항상허용 분기

```js
carManagementType = computed(() =>
  getCurrentRoutePath().includes('alwaysAllow')
    ? { label: '항상허용', key: 'alwaysAllow' }
    : { label: '즐겨찾기', key: 'bookmark' },
)
```

**경로 문자열 기반.** `CarManagementList`·`CarManagementListView`·`CarManagementForm`·
`CarManagementEmptyText`가 사용한다.

> ⚠️ **`label`로 분기하는 곳과 `key`로 분기하는 곳이 섞여 있다.**
> `CarManagementForm`: `carManagementType.label === '항상허용'`(3곳) + `carManagementType.key === 'alwaysAllow'`(1곳)
> `CarManagementListView`: `carManagementType.label === '즐겨찾기'`
> `CarManagementList`: `carManagementType.value.key === 'bookmark'`
> **한글 문자열 비교가 분기 조건으로 쓰인다.** 타깃에서는 `key`로 통일해도 동작이 같다.

### 3-2. `useWallPadContent` — 월패드 UI 노출 판정 🔴

`residentDetailInfo.contentList`의 **한글 서비스명**으로 판정한다.

| 판정                                    | 조건 (`contentList`에 해당 `name` 존재)              |
| --------------------------------------- | ---------------------------------------------------- |
| `hasParkingWallPadAlarm`                | `'차량세대통보'` (샘물 연동)                         |
| `hasParkingExternalWallPadAlarmRegular` | `'외부월패드(정기차량)'`                             |
| `hasParkingExternalWallPadAlarm`        | `'외부월패드'` **AND** 위 `(정기차량)`이 **없을 때** |

```js
hasWallPadUI = computed(() => {
  if (hasParkingWallPadAlarm || hasParkingExternalWallPadAlarm) return true;
  if (carType === 'regular' && hasParkingExternalWallPadAlarmRegular) return true;
  return false;
});
hasWallPadAlarmUI = 세 가지 중 아무거나
```

**호출 시 `carType` 인자**:

| 호출부                     | 인자        | 의미                            |
| -------------------------- | ----------- | ------------------------------- |
| `RegularCarListView`       | `'regular'` | 정기차량 전용 외부월패드도 인정 |
| `CarManagementForm`        | 없음        | 정기차량 전용은 인정 안 함      |
| `CarManagementList`        | 없음        | 〃                              |
| `ReservationCarAddView`    | 없음        | 〃                              |
| `ReservationCarDetailView` | 없음        | 〃                              |
| `ReservationCarListView`   | 없음        | 〃                              |

> ⚠️ **`hasWallPadAlarmUI`는 어디서도 쓰이지 않는다.** → `deferred.md` 「죽은 코드」
>
> ⚠️ **`contentList`를 `ref`에 복사한 뒤 `watch`로 동기화한다.** 서버 데이터를 로컬 상태에
> 복사하는 패턴이다. 타깃 규칙(`04-state.md` — 서버 데이터를 클라이언트 상태에 복사 금지)에
> 어긋나므로 **`residentDetailInfo`에서 직접 파생**시킨다. 렌더 결과는 동일하다.
>
> ⚠️ **`'외부월패드'`와 `'외부월패드(정기차량)'`은 `===` 비교라 공백이 있으면 어긋난다.**
> 다른 곳(`ParkingManagementMenus`)은 `.trim()`을 쓰는데 여기는 안 쓴다. **비대칭.**
> → `[확인 필요]` PK-Q1

### 3-3. `CardList` — 주차 공용 목록 셸 (124줄)

**6개 화면이 쓰는 핵심 컴포넌트다.**

| prop                | 기본값                          | 용도                                              |
| ------------------- | ------------------------------- | ------------------------------------------------- |
| `isLoading`         | (필수)                          | 스켈레톤 10개 표시                                |
| `isError`           | `false`                         | 에러 문구                                         |
| `errorMessage`      | `'데이터를 불러올 수 없습니다'` | 에러 1행 (2행은 고정 `잠시 후 다시 시도해주세요`) |
| `list`              | (필수)                          | 길이 판정용 (**렌더는 슬롯이 한다**)              |
| `hasNextPage`       | `undefined`                     | 무한스크롤                                        |
| `fetchNextPage`     | `undefined`                     | 〃                                                |
| `emptyMessage`      | `''`                            | 빈 상태 문구                                      |
| `hasScroll`         | `true`                          | `overflow-auto` 부여 여부                         |
| `scrollRestorePath` | `''`                            | 있으면 스크롤 복원 활성화                         |

| 상태          | 렌더                                                                                        |
| ------------- | ------------------------------------------------------------------------------------------- |
| 루트          | `h-full w-full bg-defaults-primary-background-primary`                                      |
| 로딩          | `flex h-full w-full flex-col items-start gap-[10px] p-5` — `<li>` 10개 × 각 4행 스켈레톤    |
| 스켈레톤 카드 | `w-full space-y-2 rounded-md border border-defaults-tertiary-border-tertiary p-4`           |
| 스켈레톤 행   | `flex w-full items-start justify-between gap-2` + `h-4 w-20` / `h-4 flex-1`                 |
| 에러          | `flex h-full items-center justify-center text-center` + `TextEmpty`(2줄)                    |
| 목록          | `flex h-full w-full flex-col items-start gap-[10px] p-5` (+ `overflow-auto` if `hasScroll`) |
| 빈 상태       | `flex h-full items-center justify-center py-20` + `TextEmpty`                               |
| 센티널        | `w-full` — `ref="target"`                                                                   |

**무한스크롤**:

```js
watch(targetIsVisible, (isVisible) => {
  if (isVisible && props.hasNextPage && props.list?.length > 0) props.fetchNextPage()
})
```

> `board.md`의 `watchEffect`와 달리 **`watch(targetIsVisible)`이라 가시성 전이에서만 발화**한다.
> `props.list?.length > 0` 가드도 추가로 있다. **게시판보다 안전한 구현.**

> 🔴 **`useInfiniteScrollPosition`을 조건부로 호출한다.**
>
> ```js
> const { scrollContainerRef } = props.scrollRestorePath
>   ? useInfiniteScrollPosition({ moveFrom: '/detail', moveTo: props.scrollRestorePath })
>   : { scrollContainerRef: ref(null) }
> ```
>
> Vue 컴포저블은 조건부 호출이 되지만 **React 훅은 안 된다.**
> 이관 시 훅을 무조건 호출하고 **내부에서 `enabled` 플래그로 분기**해야 한다.
> → Phase 5 레시피 항목. 동작은 동일하게 유지 가능.

**`scrollRestorePath`를 넘기는 곳은 2곳뿐이다**: PK8(`/parking/inoutHistory`) · PK11(`/parking/reservation`).
나머지 4곳(PK2·PK3·PK4·PK15)은 스크롤 복원이 없다.

> ⚠️ **`CardList`는 `list`를 렌더하지 않는다.** 부모가 `<slot>`으로 `<li>`를 직접 넣는다.
> `list`는 **로딩/빈 상태 판정에만** 쓰인다. 부모가 넘긴 슬롯과 `list`가 어긋나도 막지 못한다.
>
> ⚠️ **로딩 스켈레톤의 `<li>`가 `<div>` 직계 자식이다** (`<ul>` 없음). HTML 규격 위반. 그대로.
>
> ⚠️ **선언되지 않은 prop이 fallthrough로 붙는다** — `CarManagementList`의 `:is-drawer`,
> `MileageHistoryListView`의 `card-type="dateDetail"`. 둘 다 `CardList`가 선언하지 않아
> **루트 `<div>`의 HTML 속성**이 된다. 동작 영향 없음. **이관 시 제거.**

### 3-4. `useInfiniteList` 사용 현황 (주차 7건)

| 훅                         | `queryKey`           | `additionalParams`                   | 진입 시 캐시 초기화                 |
| -------------------------- | -------------------- | ------------------------------------ | ----------------------------------- |
| `useGetAlwaysAllowCarList` | `alwaysAllowCarList` | 없음                                 | ✅ setup에서 `removeQueries`        |
| `useGetBookmarkCarList`    | `bookmarkCarList`    | 없음                                 | ✅                                  |
| `useGetRegularCarList`     | `regularCarList`     | 없음                                 | ✅                                  |
| `useGetParkingMileageList` | `parkingMileageList` | `startDate`·`endDate`·**`isLatest`** | ✅                                  |
| `useGetInOutCarList`       | `inOutCarList`       | `startDate`·`endDate`·`desc`         | ⚠️ **상세에서 돌아온 게 아닐 때만** |
| `useGetReservationCarList` | `reservationCarList` | `startDate`·`endDate`                | ⚠️ 〃                               |

**전부 `defaultStoreKey: ['aptResidentUuid']`.**

> 🔴 **`queryClient.removeQueries()`를 setup 본문에서 호출한다** (렌더 중 부수효과).
> React에서는 렌더 중 캐시를 건드리면 안 된다. **`useEffect`(마운트 1회) 또는 `useRef` 가드**로 옮긴다.
> 호출 시점이 "마운트 시 1회"라는 결과는 같으므로 등가 이관에 어긋나지 않는다.
>
> 🔴 **`CarManagementList`는 두 훅을 모두 호출한다** — `useGetAlwaysAllowCarList`와
> `useGetBookmarkCarList`. `enabled`로 실제 fetch만 막을 뿐, **두 `removeQueries`는 전부 실행된다.**
> 즐겨찾기 목록(PK3)에 들어가면 항상허용 캐시도 지워지고, 그 반대도 마찬가지다.
> **드로어(`BookmarkCarSelectorButton`)가 열릴 때도 같은 일이 벌어진다** — 예약 등록 화면에서
> 드로어를 열면 항상허용 캐시가 날아간다. 그대로 이관.

**상세 복귀 감지** (PK8·PK11):

```js
const previousPath = router.options.history.state?.forward;
const isFromDetail = previousPath?.includes('/detail');
if (!isFromDetail) queryClient.removeQueries({ queryKey: [...] });
// 그리고 isFromDetail이면 staleTime: Infinity 를 걸어 재조회를 막는다
```

> **뒤로가기로 돌아왔을 때 목록을 유지**하려는 장치다. `history.state.forward`는
> vue-router가 관리한다. **react-router에는 같은 필드가 없다** — `useNavigationType()`이
> `POP`인지로 판정하거나 `location.key`를 쓴다. → Phase 5 레시피. `[확인 필요]` PK-Q2

### 3-5. `useGetParkingRemainingMileage` — 잔여 마일리지 🔴

PK1(`ParkingManagementMileage`)과 PK2(`MileageCardMenus`)가 **각각 호출**한다.

```js
queryKey: ['parkingRemainingMileage', dateRange] // dateRange는 ref
queryFn: getParkingRemainingMileage({
  residentUuid,
  startDate: `${s} 00:00:00`,
  endDate: `${e} 23:59:59`,
})
select: ({ useMileage, remainingMileage }) => ({ useMileage, remainingMileage, totalMileage: 합 })
enabled: isQueryEnabled
```

```js
const hasManagementFeeContent = computed(() =>
  (authStore.getAptInfo()?.contentList || []).some((c) => c.name.trim() === '주차'),
)

const isQueryEnabled = computed(() => {
  const aptCreatedDate = residentDetailInfo.value?.aptCreatedDate
  if (!aptCreatedDate) return false
  const a = new Date(aptCreatedDate),
    s = new Date(dateRange.value.startDate)
  const comparedDate =
    a.getFullYear() === s.getFullYear()
      ? a.getMonth() - s.getMonth()
      : a.getFullYear() - s.getFullYear()
  return comparedDate <= 0 && hasManagementFeeContent // ← .value 누락
})
```

> 🔴 **`hasManagementFeeContent`에 `.value`가 없다.** computed **객체**는 항상 truthy이므로
> **'주차' 서비스 가입 여부 검사가 통째로 무효**다. 실제로는 단지 생성일 조건만 본다.
> → 주차 서비스 미가입 단지에서도 마일리지를 조회한다. `deferred.md` 「동작 의심」
>
> ⚠️ **변수명이 `hasManagementFeeContent`인데 검사 대상은 `'주차'`다.** 관리비에서 복사한 흔적.
>
> ⚠️ **`comparedDate` 비교가 특이하다.** 연도가 같으면 `월 차이`, 다르면 `연도 차이`를 쓴다.
> 단지 생성일이 조회 시작일보다 **이후 연도**면 양수가 되어 `false`가 되지만,
> **이전 연도**면 음수가 되어 `true`. 결과적으로 "단지 생성 전 달은 조회 안 함"이 의도.
> 연도가 다르고 생성일이 미래인 경계는 검증되지 않았다. → `[확인 필요]` PK-Q3

**`setDateRange`**: PK2의 월 변경 시 `MileageCardMenus`가 호출한다.
PK1에서는 호출하지 않아 **항상 이번 달**이다.

### 3-6. `useGetVisitPurpose` — 방문목적 🔴

```js
queryKey: ['visitPurpose'] // ← aptUuid가 없다
queryFn: () => getVisitPurposeList(authStore.getAptInfo().aptUuid)
```

> 🔴 **쿼리 키에 `aptUuid`가 빠져 있다.** 단지를 전환해도 이전 단지의 방문목적 목록이
> 캐시에서 나온다. `staleTime: 0`이라 재조회되긴 하지만 **첫 프레임에 이전 단지 목록이 보인다.**
> 게시판(`board.md` §5-1)과 같은 유형의 결함이다. **키 내용은 레거시 그대로 유지한다.**

### 3-7. 유틸

| 유틸                             | 동작                                                                                        |
| -------------------------------- | ------------------------------------------------------------------------------------------- |
| `formatMinutes(n)`               | `{ hours, minutes }`. falsy면 `{0,0}`. **음수는 `hours`에만 부호 유지**, `minutes`는 절댓값 |
| `formatPhone(p)`                 | 8자리 → `1234-5678` · 9~11자리 → `010-1234-5678`(02는 별도) · 그 외 **원본 반환**           |
| `cleanPhoneHyphen(p)`            | 하이픈 제거 (전송 직전에 사용)                                                              |
| `findCarType(key)`               | `CAR_TYPE`에서 `{ label, chipColor }`. 못 찾으면 **`{undefined, undefined}`**               |
| `findInParkingStatus({...})`     | `inParkingFlag` → `입차` / 예정일 지남 → `미입차` / 그 외 `입차예정`                        |
| `getBadgeColorByInParkingStatus` | `입차`→`blue` · `입차예정`→`orange` · `미입차`→`deepPurple` · 그 외 `''`                    |
| `getCurrentMonthRange(date?)`    | 해당 월 1일~말일을 `YYYY-MM-DD`로                                                           |
| `calculatePeriodDays(s, e)`      | `s` 없으면 0 · `e` 없으면 1 · 아니면 `ceil(차이/일) + 1`                                    |
| `formatDayFreeTime(list)`        | 요일별 무료시간 → 월~일 순 정렬 목록. **빈 배열이면 `null`**(단일 시간대로 폴백)            |
| `formatTime('HH:mm:ss')`         | `'HH:mm'` (뒤 초 절삭). falsy면 `''`                                                        |
| `formatObjectDate(d, 'hyphen')`  | `YYYY-MM-DD`                                                                                |
| `formatObjectDate(d, 'korean')`  | `YYYY년 MM월 DD일` 계열 — 호출부가 `.slice(5)`로 앞 5자를 잘라 쓴다                         |

> ⚠️ **`findCarType`이 못 찾으면 `ChipBase`에 `color: undefined`가 간다.**
> `CAR_TYPE`에 없는 새 유형이 서버에서 오면 칩이 색 없이 렌더된다. 그대로.
>
> ⚠️ **`findInParkingStatus`는 `new Date('YYYY-MM-DD HH:mm:ss')`를 쓴다.**
> ISO가 아닌 공백 구분 형식이라 **구형 Safari에서 Invalid Date가 될 수 있다.**
> 웹뷰 대상이므로 실기기 확인이 필요하다. → `[확인 필요]` PK-Q4
>
> ⚠️ **`formatObjectDate(...).slice(5)`가 5곳에 하드코딩돼 있다.** 포맷이 바뀌면 전부 깨진다.
> → `deferred.md` 「구조 개선」

### 3-8. 상수 — `constants/domain/parking.js` 전문

| 심볼                                         | 내용                                                                                                                                                                                                                                 |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `CAR_INFO_DELETE_MODAL_DATA`                 | 본문 `차량정보를 삭제하시겠어요?` / `취소`·`삭제` (**`title` 없음**)                                                                                                                                                                 |
| `CAR_TYPE` (8종)                             | `REGULAR`=정기차량(green) · `REGULAR_RESIDENT`=입주민(green) · `RESERVATION`=방문예약(gray) · `GENERAL`=일반방문(gray) · `ALWAYS_ALLOW`=항상허용(blue) · `UNKNOWN`=미등록(purple) · `REJECT`=거부(red) · `BLACKLIST`=블랙리스트(red) |
| `CARD_ITEM_FIELD.regular`                    | `name`(차주 이름) · `phone`(연락처)                                                                                                                                                                                                  |
| `CARD_ITEM_FIELD.bookmark`                   | `nickName`(별칭) · `phone`(연락처)                                                                                                                                                                                                   |
| `CARD_ITEM_FIELD.alwaysAllow`                | `phone`(연락처) · `memo`(메모)                                                                                                                                                                                                       |
| `CARD_ITEM_FIELD.mileageHistory`             | `inParkingTime`(입차시간) · `outParkingTime`(출차시간) · `parkingMinutes`(총 주차시간) · `useMileage`(사용한 마일리지)                                                                                                               |
| `CARD_ITEM_FIELD.inOutHistory`               | `inParkingTime` · `outParkingTime` · `parkingMinutes`                                                                                                                                                                                |
| ~~`CARD_ITEM_FIELD.notOutHistory`~~          | **이관 제외**                                                                                                                                                                                                                        |
| `PARKING_WALL_PAD_ALARM_INPUT`               | `[{label:'예',key:true},{label:'아니오',key:false}]`                                                                                                                                                                                 |
| `PARKING_WALL_PAD_ALARM`                     | `예 선택 시, 해당 차량 입출차 시 세대 내 월패드로 알림이 옵니다.` / `마이페이지 > 알림 설정 > 입출차알림이 켜져있어야 알림이 수신됩니다.`                                                                                            |
| `PARKING_MANAGEMENT_POLICY_MODAL_FIELD_LIST` | `monthBaseMileage`(기본 마일리지) · `freeParkingMinute`(회차 시간(분)) · `freeParkingTime`(무료 주차 시간) · `minuteAmount`(분당 금액)                                                                                               |
| `DAY_OF_WEEK_LIST`                           | `MONDAY`~~`SUNDAY` → `월`~~`일` (**월요일 시작 고정**)                                                                                                                                                                               |
| `DAY_FREE_TYPE_LABEL`                        | `NONE`=`무료 시간 없음` · `ALL_DAY`=`종일 무료` (`TIME_RANGE`는 라벨 없음 — 시각을 직접 조합)                                                                                                                                        |
| `IN_OUT_HISTORY_DETAIL_FIELD`                | `carNum`(차량번호) · `inParkingTime`(입차시간) · `outParkingTime`(출차시간) · `parkingMinutes`(총 주차시간) · `phone`(연락처) · `visitPurpose`(방문목적) · `carType`(차량유형)                                                       |
| `PARKING_REJECT_MODAL_DATA`                  | 제목 `주차를 거부하시겠습니까?` / 본문 `거부시, 마일리지 차감이 되지 않습니다.` / `취소`·`거부하기`                                                                                                                                  |
| `PARKING_MENU_LIST` (4종)                    | `주차 방문예약`(`/parking/reservation`) · `입출차 내역`(`/parking/inoutHistory`) · `즐겨찾기 차량`(`.../bookmark/list`) · `항상허용 차량`(`.../alwaysAllow/list`) — 각 `icon` 경로 포함                                              |
| `RESERVATION_CAR_DETAIL_FIELD`               | `carNum`(차량번호) · `inOutParkingScheduledDate`(입출차 예약 기간) · `inParkingFlag`(입차여부) · `phone`(연락처) · `visitPurpose`(방문목적) · `memo`(메모)                                                                           |

### 3-9. 스키마 — `schemas/parking.js`

| 스키마                                                      | 필드                                                                                     |
| ----------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `carManagementBookmarkFormSchema`                           | `carNum` · `nickName` · `phone` — **`toTypedSchema` 적용됨**                             |
| `carManagementAlwaysAllowFormSchema`                        | `carNum` · `phone` · `visitPurpose` · `memo` — **raw zod**                               |
| `carManagementAlwaysAllowFormSchemaWithParkingWallPadAlarm` | 위 + `parkingWallPadAlarm`                                                               |
| `reservationAddSchema`                                      | `carNum` · `inOutParkingScheduledDate` · `phone` · `visitPurpose` · `memo` — **raw zod** |
| `reservationAddSchemaWithParkingWallPadAlarm`               | 위 + `parkingWallPadAlarm`                                                               |
| `rejectCarSchema`                                           | `rejectReason` — 1~100자, **`toTypedSchema` 적용됨**                                     |

**공용 필드** (`schemas/common.js`, zod 3 원문):

| 필드                        | 규칙                                                                                                       |
| --------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `carNum`                    | `.trim().min(1).regex(CARNUM_REGEX)` — 메시지 3개 모두 `123가1234, 서울12가1234 형식으로 입력해주세요`     |
| `nickName`                  | `.trim().min(2,'2~10자로 입력해주세요').regex(NICKNAME_REGEX,'한글, 영문, 숫자만')`                        |
| `phone`                     | `.trim().regex(PHONE_REGEX,'휴대폰 번호 형식으로 - 없이 입력해주세요').max(13,'숫자만 입력해주세요')`      |
| `visitPurpose`              | `z.object({ name, uuid })` + `required_error`·`invalid_type_error` 모두 `방문목적을 선택해주세요`          |
| `memo`                      | `z.string().optional()`                                                                                    |
| `inOutParkingScheduledDate` | `z.tuple([z.date(), z.date().nullish()])` + `.refine(값[0] >= 오늘, '오늘 이후의 날짜만 선택 가능합니다')` |
| `parkingWallPadAlarm`       | `z.boolean({ required_error: '예, 아니오 중에 선택해주세요' })`                                            |
| `rejectReason`              | `.min(1,'최소 1자 이상 입력해주세요').max(100,'최대 100자 이내로 입력해주세요')`                           |

> ⚠️ **`toTypedSchema` 적용 위치가 일관되지 않다.** `bookmark`·`reject`는 스키마 파일에서,
> `alwaysAllow`·`reservation`은 **컴포넌트에서** 감싼다. `CarManagementForm`의 `schema` computed가
> `bookmark`면 그대로, 아니면 `toTypedSchema(...)`를 씌우는 이유다. 그대로 이관.
>
> ⚠️ **`nickName`은 `.max(10)`이 없다.** 메시지는 `2~10자`인데 스키마는 최소 2자만 본다.
> 대신 `InputBase`에 `:maxlength="10"`이 걸려 있어 UI로 막는다. → `deferred.md`
>
> ⚠️ **`phone`은 `PHONE_REGEX`를 쓴다** — `domain-codes.md`에 기록된 대로 **`^...$` 앵커가 없다.**
> 부분 일치만으로 통과한다. **그대로 유지.**
>
> **zod 4 이관**: `required_error` 9건 + `invalid_type_error` 3건 → `error`. `zod-migration.md` 규칙.

### 3-10. 마이페이지 알림설정이 쓰는 주차 훅 3개

| 훅                                 | API                                                                                   |
| ---------------------------------- | ------------------------------------------------------------------------------------- |
| `usePutParkingRegularAlarmState`   | `putRegularPush` — `/apartmant/apt-resident/{uuid}/notification-setting/regular-push` |
| `usePutParkingExternalAlarmState`  | `putExternalPush` — `.../notification-setting/external-push`                          |
| `usePatchParkingWallPadAlarmState` | `patchWallPadNotification` — `.../notification-setting/wall-pad`                      |

**호출부는 `lib/composables/useAlarmSetting.js` 하나뿐**이고, 이는 **마이페이지 알림 설정**
(`mypage.md` P4) 화면이 쓴다.

> ⚠️ **주차 화면에서는 이 3개를 전혀 쓰지 않는다.** 파일 위치만 `queries/parking/`이다.
> **타깃에서는 `features/mypage/queries/`로 옮긴다.** API 경로도 `apiApartmant` 기반이라
> 주차와 무관하다. 화면 동작에 영향 없다.

---

# PK1. 주차 관리 — `/parking`

`ParkingManagement/ParkingManagementView.vue` (17줄) · **eager import**

## 화면 구성

```
┌─────────────────────────────┐
│ ← 주차 관리                  │  라우트 meta AppBar
├─────────────────────────────┤ ┐ 그라데이션 영역
│ 잔여 주차 마일리지 →         │ │  ParkingManagementMileage
│ 12시간 30분   [아파트 주차정책]│ │
│ ▓▓▓▓▓░░░░░░░░              │ │  ParkingMileageProgressBar
│ 3시간 사용        총 15시간30분│ │
│                             │ │
│ ┌────────┐ ┌────────┐      │ │  ParkingManagementMenus (2열)
│ │주차방문예약│ │입출차 내역│      │ │
│ └────────┘ └────────┘      │ │
│ ┌────────┐ ┌────────┐      │ │
│ │즐겨찾기차량│ │항상허용차량│      │ │
│ └────────┘ └────────┘      │ ┘
├─────────────────────────────┤
│ 정기권 차량 등록 현황         │  RegularCarListView (임베드)
│ ┌─────────────────────────┐ │
│ │ 12가3456                 │ │
│ │ 차주 이름       홍길동    │ │
│ │ 연락처   010-1234-5678   │ │
│ └─────────────────────────┘ │
└─────────────────────────────┘
```

| 요소            | 클래스 (원문)                                                                                                          |
| --------------- | ---------------------------------------------------------------------------------------------------------------------- |
| 루트            | `flex h-full w-full flex-col space-y-2 overflow-auto`                                                                  |
| 상단 그라데이션 | `w-full space-y-5 bg-gradient-to-b from-defaults-primary-background-primary to-defaults-secondary-background-mono p-5` |

**`RegularCarListView`가 라우트 컴포넌트이자 임베드 컴포넌트다** (PK15와 공용).
`isRegularPage` computed로 구분한다 → §PK15

## 잔여 마일리지 — `ParkingManagementMileage` (103줄)

| 요소      | 클래스 / 값                                                                                                                                                                     |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 루트      | `space-y-2.5`                                                                                                                                                                   |
| 상단 행   | `flex justify-between gap-3`                                                                                                                                                    |
| 좌측      | `space-y-1`                                                                                                                                                                     |
| 제목 버튼 | `flex items-center gap-2 break-keep text-left text-defaults-secondary-text-secondary pretendard-14Medium` → `잔여 주차 마일리지` + `ArrowNarrowRight.svg` (alt `화살표 아이콘`) |
| 제목 클릭 | `navigateTo('/parking/mileage/history')` → PK2                                                                                                                                  |
| 로딩      | `SkeletonBase class="h-8 w-32 rounded-lg"`                                                                                                                                      |
| 에러      | `pt-2 text-defaults-secondary-text-secondary pretendard-14Regular` → `주차 마일리지를 불러올 수 없습니다.` `<br/>` `잠시 후 다시 시도해주세요.`                                 |
| 값        | `pretendard-24Bold` → `{hours}시간 {minutes ? minutes+'분' : undefined}`                                                                                                        |

> ⚠️ **분이 0이면 템플릿이 `undefined`를 렌더한다.**
> `{{ minutes ? `${minutes}분` : undefined }}` — Vue는 `undefined`를 빈 문자열로 보간하므로
> 실제로는 `12시간 `(뒤 공백)이 된다. **화면상 문제 없지만 의도한 코드는 아니다.**
> `ParkingMileageProgressBar`에도 같은 패턴이 2곳 더 있다. 그대로 이관.

**`totalMileage` = `remainingMileage + useMileage`** (컴포넌트에서 계산).
쿼리 `select`도 `totalMileage`를 만들지만 **여기서는 쓰지 않고 다시 계산한다.** 중복.

## 진행바 — `ParkingMileageProgressBar` (79줄)

**네이티브 `<progress>` 엘리먼트**를 쓴다.

| 요소    | 클래스 (원문)                                                                                                                                                                                                                                                                                                                                                                                                                        |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 루트    | `space-y-1.5`                                                                                                                                                                                                                                                                                                                                                                                                                        |
| 로딩    | `SkeletonBase class="h-2 w-full rounded-full"`                                                                                                                                                                                                                                                                                                                                                                                       |
| 진행바  | `h-2 w-full transition-all duration-1000 ease-out` + `[&::-webkit-progress-bar]:rounded-full` `[&::-webkit-progress-bar]:bg-defaults-secondary-background-secondary` `[&::-webkit-progress-value]:rounded-full` `[&::-webkit-progress-value]:bg-brand-default-background-brand` `[&::-webkit-progress-value]:transition-all` `[&::-webkit-progress-value]:duration-1000` `[&::-webkit-progress-value]:ease-out` (+ `-moz-` 동등 6개) |
| 하단 행 | `flex justify-between pretendard-14Medium`                                                                                                                                                                                                                                                                                                                                                                                           |
| 사용량  | `text-brand-default-text-brand` → `{h}시간 {m}분 사용`                                                                                                                                                                                                                                                                                                                                                                               |
| 총량    | `text-defaults-secondary-text-secondary` → `총 {h}시간 {m}분`                                                                                                                                                                                                                                                                                                                                                                        |

**애니메이션**:

```js
watch(
  [() => props.useMileage, () => props.isLoading],
  ([useMileage, isLoading]) => {
    if (useMileage !== undefined && !isLoading) {
      setTimeout(() => {
        animatedProgressValue.value = useMileage
      }, 100)
    }
  },
  { immediate: true },
)
```

→ 100ms 뒤 값을 넣어 CSS `transition duration-1000`이 채워지는 연출.

> ⚠️ **`isError` prop을 부모가 넘기는데 `defineProps`에 선언돼 있지 않다.**
> fallthrough로 루트 `<div>`에 `iserror="false"` 속성이 붙는다. 무해. **이관 시 제거.**
>
> ⚠️ **`[&::-webkit-progress-*]` 임의 변형자 12개는 `broken-styles.md` 검증에서 정상 생성 확인됨.**
> Tailwind 4 `@theme` 이관 후에도 동작하는지 확인 필요.

## 주차 정책 — `ParkingManagementPolicy` + `ParkingManagementPolicyModal`

**버튼**: `<ButtonBase type="button" color="defaults-secondary" size="md">아파트 주차 정책</ButtonBase>`

**드로어** (`DrawerBase` `title="우리 아파트 주차 정책"` `is-button` `is-close`):

| 요소      | 클래스 (원문)                                                                                                                                   |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| 래퍼      | `w-full px-5`                                                                                                                                   |
| 목록      | `mt-4 flex w-full flex-col gap-3 rounded-lg bg-neutral-b-gray-50 px-3 py-4`                                                                     |
| 로딩      | `space-y-3` × 5행 — `h-4 w-32` / `h-4 w-40` 스켈레톤                                                                                            |
| 에러      | `py-10 text-center text-defaults-tertiary-text-tertiary pretendard-16Regular` → `정보를 불러올 수 없습니다` `<br/>` `잠시 후 다시 시도해주세요` |
| 항목 행   | `flex justify-between gap-4`                                                                                                                    |
| 라벨      | `whitespace-nowrap text-defaults-secondary-text-secondary pretendard-15SemiBold`                                                                |
| 값        | `text-right pretendard-15Regular`                                                                                                               |
| 닫기 버튼 | `<ButtonBase custom-class="h-10 w-full">닫기</ButtonBase>`                                                                                      |

**API**: `getParkingPolicy` — `/parking/resident/{aptResidentUuid}/parking-policy?yearMonthDate=YYYY-MM-01`
쿼리 키 `['parkingPolicy', aptResidentUuid]` · **이번 달 1일 고정**

### 필드 렌더 로직

| 필드                | 표시                                                                          |
| ------------------- | ----------------------------------------------------------------------------- |
| `monthBaseMileage`  | `0분/월` (0일 때) · `{m}분/월` · `{h}시간/월` · `{h}시간 {m}분/월`            |
| `freeParkingMinute` | `{n}분`                                                                       |
| `freeParkingTime`   | 시각 없거나 시작=종료면 **`무료 시간 없음`**, 아니면 `매일 {HH:mm} ~ {HH:mm}` |
| `minuteAmount`      | `{n.toLocaleString()}원/분`                                                   |
| 그 외               | `-`                                                                           |

### 요일별 무료 주차 시간 (기준 SHA의 최신 기능)

`parkingPolicy.dayFreeTimeList`가 있으면 **`freeParkingTime` 행이 요일별 목록으로 바뀐다.**

| 요소      | 클래스 (원문)                                                                    |
| --------- | -------------------------------------------------------------------------------- |
| 항목      | `flex flex-col gap-2`                                                            |
| 라벨      | `whitespace-nowrap text-defaults-secondary-text-secondary pretendard-15SemiBold` |
| 요일 목록 | `flex w-full flex-col gap-2 pl-2`                                                |
| 요일 행   | `flex justify-between gap-4`                                                     |
| 요일      | `whitespace-nowrap text-defaults-tertiary-text-tertiary pretendard-15Regular`    |
| 값        | `text-right pretendard-15Regular`                                                |

**`formatDayFreeTime`**:

- 목록이 비면 `null` → **단일 시간대 표시로 폴백**
- `DAY_OF_WEEK_LIST` 순서(월~일)로 재정렬, 응답에 없는 요일은 제외
- 값: 시각 둘 다 있으면 `{HH:mm} ~ {HH:mm}`, 없으면 `DAY_FREE_TYPE_LABEL[freeType] ?? '-'`
- `ALL_DAY` → `종일 무료` · `NONE` → `무료 시간 없음` · `TIME_RANGE`인데 시각 없음 → `-`

> **주석에 명시**: "시각이 있으면 시간대로 표기(freeType 누락된 구버전 데이터도 자연히 흡수)".
> 구버전 응답 호환 장치다. 그대로 이관.

## 메뉴 그리드 — `ParkingManagementMenus` (63줄)

| 상태 | 렌더                                                                                  |
| ---- | ------------------------------------------------------------------------------------- |
| 로딩 | `grid w-full grid-cols-2 gap-[14px]` + `SkeletonBase class="h-16 w-full rounded"` × 4 |
| 완료 | `grid w-full grid-cols-2 gap-3` + `ParkingManagementItem` × 3~4                       |

> ⚠️ **로딩과 완료의 `gap`이 다르다** (`gap-[14px]` vs `gap-3`=12px). 전환 시 미세하게 흔들린다.
>
> ⚠️ **로딩 판정이 `isResidentDetailInfoLoading`이다.** 메뉴 자체는 상수(`PARKING_MENU_LIST`)라
> 서버를 기다릴 필요가 없지만, `hasMileageLimit` 판정에 `contentList`가 필요해서다.
> 단 `hasMileageLimit`은 **`authStore`**(localStorage)에서 읽고 `residentDetailInfo`(서버)는
> 로딩 게이트로만 쓴다. **읽는 곳과 기다리는 곳이 다르다.** → `deferred.md`

### 마일리지 한도 제한 단지 분기 🔴

```js
hasMileageLimit = authStore
  .getAptInfo()
  .contentList.some((item) => item.name.trim() === '마일리지 한도 제한')

parkingMenuList = computed(() => {
  if (!hasMileageLimit.value) return PARKING_MENU_LIST // 4개
  const [reservation, inOut, bookmark] = PARKING_MENU_LIST // 항상허용(4번째) 버림
  return [{ ...reservation, isLarge: true }, { ...inOut }, { ...bookmark }]
})
```

| 단지 유형              | 메뉴                                                        | 배치                             |
| ---------------------- | ----------------------------------------------------------- | -------------------------------- |
| 일반                   | 주차 방문예약 · 입출차 내역 · 즐겨찾기 차량 · 항상허용 차량 | 2×2 균등                         |
| **마일리지 한도 제한** | 주차 방문예약(**크게**) · 입출차 내역 · 즐겨찾기 차량       | 방문예약이 `row-span-2` 세로 2칸 |

> **항상허용 차량 메뉴가 사라진다.** 다만 **라우트(PK4)는 살아 있어** URL 직접 진입은 가능하다.
> 마이페이지에도 링크가 없으므로 실질적으로 도달 불가. → `[확인 필요]` PK-Q5

## 메뉴 타일 — `ParkingManagementItem` (65줄)

```html
<button
  type="button"
  class="border-defaults-tertiary-border-tertiary bg-defaults-primary-background-primary active:bg-defaults-tertiary-border-tertiary/40 [isLarge ? 'flex-col items-start' : 'items-center'] flex justify-between gap-2 overflow-hidden rounded-lg border p-3"
>
  <span class="pretendard-14SemiBold whitespace-nowrap">{{ info.name }}</span>
  <img
    :src="info.icon"
    :alt="`${info.name} 아이콘`"
    :class="[isLarge ? 'self-end' : undefined, shouldShake && enableShake ? 'shake-animation' : undefined]"
  />
</button>
```

**흔들림 애니메이션** — `enableShake`는 **`주차 방문예약`에만** 부여된다.

```js
onMounted(() => {
  if (enableShake) setTimeout(() => (shouldShake.value = true), 300)
})
```

```css
@keyframes shake { 0%,100% { transform: rotate(0deg); } 25% { rotate(10deg); } 75% { rotate(-10deg); } }
.shake-animation { animation: shake 0.6s ease-in-out 2; }
```

→ **300ms 뒤에 0.6초짜리 흔들림을 2회** 재생. `<style scoped>`라 이관 시 CSS도 함께 옮긴다.

> `main.md`의 `MainCardReservation`에도 같은 `shake-animation`이 있다. **중복 정의.**
> 타깃에서는 공용 CSS 또는 유틸리티로 한 번만 정의한다. 시각 결과는 동일.

## 상태·엣지케이스

| 상황                 | 동작                                                            |
| -------------------- | --------------------------------------------------------------- |
| 마일리지 로딩        | 값 자리에 스켈레톤, 진행바도 스켈레톤                           |
| 마일리지 에러        | 2줄 문구 + **진행바 자체가 미렌더** (`v-if="!isError"`)         |
| 마일리지 쿼리 비활성 | 단지 생성일이 미래거나 `aptCreatedDate` 없음 → 로딩 상태로 남음 |
| 정책 로딩/에러       | 드로어 안에서만 처리                                            |
| 정기권 0건           | `등록된 정기차량이 없습니다`                                    |

## QA 체크리스트

- [ ] 잔여 마일리지 헤더 클릭 → PK2
- [ ] 진행바가 100ms 뒤 1초에 걸쳐 차오르는가
- [ ] `주차 방문예약` 아이콘이 진입 300ms 뒤 2회 흔들리는가
- [ ] 마일리지 한도 제한 단지에서 **항상허용 메뉴가 사라지고 방문예약이 세로로 커지는가**
- [ ] `아파트 주차 정책` → 드로어 4개 필드
- [ ] 요일별 무료 시간이 설정된 단지에서 **월~일 순서로** 표시되는가
- [ ] 요일 설정이 없는 단지는 `매일 HH:mm ~ HH:mm` 단일 표시로 폴백되는가
- [ ] 무료 시간 미적용 단지에서 `무료 시간 없음`
- [ ] 하단에 정기권 차량 목록이 임베드되어 보이는가 (스크롤 X — §PK15)

---

# PK2. 마일리지 내역 — `/parking/mileage/history`

`Mileage/MileageHistoryListView.vue` (144줄)

## 화면 구성

```
┌─────────────────────────────┐
│ ← 마일리지 내역              │
├─────────────────────────────┤
│ 2026년 7월 ▾                │  DrawerMonth (none-padding)
│ ┌──────────┐ ┌──────────┐  │  MileageCardMenus
│ │잔여 주차   │ │사용한 주차 │  │
│ │마일리지    │ │마일리지    │  │
│ │12시간 30분 │ │3시간 0분   │  │
│ └──────────┘ └──────────┘  │
╞═════════════════════════════╡  border-b-8
│ 총 12건                      │
│ ┌─────────────────────────┐ │
│ │ 12가3456        [미출차] │ │  outParkingTime 없을 때만 칩
│ │ ─────────────────────── │ │
│ │ 입차시간   2026-07-29 …  │ │
│ │ 출차시간            -    │ │
│ │ 총 주차시간      2시간30분│ │
│ │ 사용한 마일리지   2시간30분│ │
│ └─────────────────────────┘ │
└─────────────────────────────┘
```

| 요소      | 클래스 (원문)                                                                                                          |
| --------- | ---------------------------------------------------------------------------------------------------------------------- |
| 루트      | `flex h-full w-full flex-col overflow-hidden`                                                                          |
| 상단 블록 | `w-full shrink-0 border-b-8 border-b-defaults-secondary-background-secondary bg-base-b-white px-5 pb-[29px] pt-[18px]` |
| 카드 영역 | `MileageCardMenus class="pt-3"`                                                                                        |
| 목록 블록 | `flex min-h-0 w-full flex-1 flex-col bg-base-b-white`                                                                  |
| 건수      | `shrink-0 px-6 py-4 text-defaults-primary-text-primary pretendard-16SemiBold` → `총 {n}건`                             |
| 목록 래퍼 | `min-h-0 flex-1`                                                                                                       |

**건수 소스**: `parkingMileageList?.pageable?.totalElements || 0`
(`useInfiniteList`의 `pageable`은 **첫 페이지 응답 기준**)

## 마일리지 카드 — `MileageCardMenus`(83) + `MileageCard`(41)

| 상태 | 렌더                                                                                |
| ---- | ----------------------------------------------------------------------------------- |
| 로딩 | `flex gap-3` + 카드 골격 2개 (`h-5 w-32` + `h-6 w-24` 스켈레톤)                     |
| 에러 | `flex h-20 gap-3` + **카드 1개만** — `주차 마일리지` / `정보를 불러올 수 없습니다.` |
| 완료 | `flex gap-3` + `MileageCard` 2개                                                    |

| `MileageCard` 요소 | 클래스 (원문)                                                                                                 |
| ------------------ | ------------------------------------------------------------------------------------------------------------- |
| 루트               | `flex flex-1 flex-col items-start justify-between gap-3 self-stretch rounded-xl bg-white px-4 py-3 shadow-md` |
| 제목               | `break-keep text-defaults-secondary-text-secondary pretendard-14Bold`                                         |
| 값 래퍼            | `flex flex-wrap items-end gap-1`                                                                              |
| 숫자               | `text-right outfit-18SemiBold` ← **Outfit 폰트**                                                              |
| 단위               | `mb-1 pretendard-13SemiBold`                                                                                  |

**카드 2개**: `잔여 주차 마일리지` / `사용한 주차 마일리지`

> ⚠️ **에러 시 카드가 2개→1개로 줄고 제목도 `주차 마일리지`로 바뀐다.** 레이아웃이 변한다.
> ⚠️ **로딩 스켈레톤의 `gap-2`와 실제 카드의 `gap-3`이 다르다.** 미세한 흔들림.
> ⚠️ **`outfit-18SemiBold`는 Outfit 폰트 유틸리티다.** `tech-mapping.md`의 타이포 이식 대상.

**월 변경 연동**:

```js
watch(
  () => props.selectedMonthRange,
  (v) => setDateRange(v),
) // immediate 없음
```

→ 초기값은 `useGetParkingRemainingMileage` 내부 기본값(이번 달)을 쓰고,
사용자가 월을 바꿔야 `setDateRange`가 돈다.

## 목록

**API**: `getParkingMileageList` — `/parking/resident/inout-parking/{aptResidentUuid}/mileage`
쿼리 파라미터 `page` · `size`(=10) · `startDate` · `endDate` · **`isDesc`**

**훅이 실제로 보내는 것**: `startDate` · `endDate` · **`isLatest`** 🔴

```js
additionalParamsRef = ref({ startDate: `${s} 00:00:00`, endDate: `${e} 23:59:59`, isLatest })
// useInfiniteList가 { ...additionalParams.value } 를 그대로 전개해 fetchFunction에 넘긴다
// getParkingMileageList는 { page, size, startDate, endDate, isDesc } 만 params에 담는다
```

> 🔴 **`isLatest`는 API 함수가 받지 않는다. `isDesc`는 아무도 채우지 않는다.**
> **정렬 파라미터가 서버에 전달되지 않는다.** 서버 기본 정렬이 적용된다.
> `isLatest`는 화면에서 `ref(true)` 고정이고 토글 UI도 없으므로 **사용자가 체감할 수 없다.**
> → `deferred.md` 「동작 의심」. **이관 시 그대로**(파라미터 미전송 유지)
>
> 대조: `useGetInOutCarList`는 `desc: true`를 넣고 `getInOutCarList`가 `desc`를 받는다. **정상.**

**월 변경**:

```js
handleMonthChange({ year, month }):
  selectedMonthRange = getCurrentMonthRange(new Date(year, month - 1));
  setAdditionalParams({ startDate, endDate, isLatest });   // 내부에서 resetCache() 먼저
```

> PK8·PK11과 달리 **`history.replaceState`로 월을 저장하지 않는다.**
> PK2에서 나갔다 오면 항상 이번 달로 돌아온다. **비대칭.** → `deferred.md`

## 카드 렌더

| 요소      | 클래스 (원문)                                                                                             |
| --------- | --------------------------------------------------------------------------------------------------------- |
| `<li>`    | `border-deep-glue-20 flex flex-col gap-3 self-stretch rounded-xl border p-3 shadow-md`                    |
| 상단      | `w-full border-b border-b-defaults-tertiary-border-tertiary pb-3`                                         |
| 상단 행   | `flex items-center justify-between gap-2`                                                                 |
| 차량번호  | `text-defaults-primary-text-primary pretendard-18SemiBold`                                                |
| 미출차 칩 | `outParkingTime`이 falsy일 때 `<ChipBase color="red" class-name="pretendard-12Regular">미출차</ChipBase>` |
| 정보 목록 | `flex w-full flex-col items-start gap-2.5`                                                                |
| 정보 행   | `flex w-full items-start justify-between gap-2`                                                           |
| 라벨      | `whitespace-nowrap text-defaults-tertiary-text-tertiary pretendard-14SemiBold`                            |
| 값        | `text-left text-defaults-secondary-text-secondary pretendard-14Regular`                                   |
| 하단 여백 | `<div class="p-2"></div>` (슬롯 마지막)                                                                   |

> ⚠️ **`border-deep-glue-20`은 CSS를 생성하지 않는다** (`broken-styles.md` §5).
> `border`만 적용되어 **기본 회색 테두리**로 보인다. 대응 토큰 불명이라 **현행 유지.**
> PK3·PK4·PK8·PK11의 카드도 같은 클래스를 쓴다(4곳).
>
> ⚠️ **`ChipBase`에 `variant`를 넘기지 않는다.** 다른 곳은 전부 `variant="fill"`인데 여기만 없다.
> `ChipBase`의 기본 variant가 적용된다. → `[확인 필요]` PK-Q6

**값 렌더** (`renderFieldValue`):

| 조건                               | 결과                                    |
| ---------------------------------- | --------------------------------------- |
| `value === undefined`              | `-`                                     |
| `parkingMinutes` · `useMileage`, 0 | `0분`                                   |
| 〃, 1시간 미만                     | `{m}분`                                 |
| 〃, 그 외                          | `{h}시간 {m}분`                         |
| 그 외 필드                         | 원본 (`inParkingTime`·`outParkingTime`) |
| 최종                               | `renderFieldValue(...)                  |     | '-'` |

> ⚠️ **`formatMinutes`를 한 렌더에서 최대 6번 호출한다** (`renderFieldValue` 안에서 반복).
> 성능 이슈는 아니지만 타깃에서는 한 번만 계산한다. 결과 동일.
>
> ⚠️ **`inParkingTime`·`outParkingTime`은 서버 문자열을 그대로 출력한다.** 포맷 가공 없음.
> 서버가 `2026-07-29 14:30:00`으로 주면 그대로 보인다. → `[확인 필요]` PK-Q7

## 상태·엣지케이스

| 상황      | 동작                                                               |
| --------- | ------------------------------------------------------------------ |
| 로딩      | `CardList` 스켈레톤 10개                                           |
| 에러      | `마일리지 내역을 불러올 수 없습니다` + `잠시 후 다시 시도해주세요` |
| 0건       | `마일리지 사용 내역이 없습니다`                                    |
| 미출차 건 | `출차시간` `-`, 빨간 `미출차` 칩                                   |
| 월 변경   | 캐시 초기화 후 page 0부터                                          |

## QA 체크리스트

- [ ] 월 선택 드로어에 **최근 3개월만** 나오는가
- [ ] 월 변경 시 카드 2개와 목록이 함께 갱신되는가
- [ ] 미출차 건에 빨간 칩 + 출차시간 `-`
- [ ] 총 건수가 첫 페이지 기준으로 표시되는가
- [ ] 카드 테두리가 **회색**인가 (`deep-glue-20` 미적용, 레거시와 동일)
- [ ] PK2에서 나갔다 오면 **이번 달로 초기화**되는가 (PK8·PK11과 다름)

---

# PK3·PK4. 즐겨찾기 / 항상허용 차량 목록

`CarManagement/CarManagementListView.vue` (119줄) + `CarManagementList.vue` (188줄)

**같은 컴포넌트를 경로로 분기한다** — `useCarManagementType`.

| 구분          | PK3 즐겨찾기                                                    | PK4 항상허용                                               |
| ------------- | --------------------------------------------------------------- | ---------------------------------------------------------- |
| 경로          | `/parking/carManagement/bookmark/list`                          | `/parking/carManagement/alwaysAllow/list`                  |
| AppBar        | `즐겨찾기 차량`                                                 | `항상허용 차량`                                            |
| 카드 필드     | `nickName`(별칭) · `phone`(연락처)                              | `phone`(연락처) · `memo`(메모)                             |
| 별 아이콘     | ✅ 카드에 `Star.svg`                                            | ❌                                                         |
| 월패드 칩     | ❌                                                              | ✅ `hasWallPadUI && notificationFlag`                      |
| 드로어 `수정` | ✅                                                              | ❌ **없음** (R-1)                                          |
| 드로어 `삭제` | ✅                                                              | ✅                                                         |
| API 목록      | `getBookmarkCarList` `/{uuid}/bookmark`                         | `getAlwaysAllowCarList` `/always-allow/list/{uuid}`        |
| API 삭제      | `deleteBookmarkedCar` `/{residentUuid}/bookmark/{bookmarkUuid}` | `deleteAlwaysAllowedCar` `/always-allow/{alwaysAllowUuid}` |
| 빈 문구       | `즐겨찾기 차량이 없습니다`                                      | `항상허용 차량이 없습니다`                                 |
| 에러 문구     | `즐겨찾기 차량 목록을 불러올 수 없습니다`                       | `항상허용 차량 목록을 불러올 수 없습니다`                  |

> ⚠️ **삭제 API의 인자 구조가 다르다.** 즐겨찾기는 `{residentUuid, bookmarkUuid}` 객체,
> 항상허용은 `alwaysAllowUuid` 단일 문자열이다. 서버 경로 설계가 비대칭.

## 화면 구성

```
┌─────────────────────────────┐
│ ← 즐겨찾기 차량              │
├─────────────────────────────┤
│ ┌─────────────────────────┐ │
│ │ [월패드 알림]  ← 항상허용만│ │
│ │ 12가3456 ★         ⋮    │ │
│ │ ─────────────────────── │ │
│ │ 별칭            친구차   │ │
│ │ 연락처  010-1234-5678   │ │
│ └─────────────────────────┘ │
│                             │
│ [      + 등록하기       ]   │  fixed bottom-0, size 2xl
└─────────────────────────────┘
```

| 요소          | 클래스 (원문)                                                                                                           |
| ------------- | ----------------------------------------------------------------------------------------------------------------------- |
| 루트          | `h-full w-full overflow-auto`                                                                                           |
| `<li>`        | `border-deep-glue-20 flex flex-col gap-3 self-stretch rounded-xl border bg-base-b-white p-3 shadow-md`                  |
| 카드 버튼     | `flex flex-col gap-3`                                                                                                   |
| 상단          | `flex w-full items-center justify-between gap-1 border-b border-b-defaults-tertiary-border-tertiary pb-3`               |
| 차량번호 영역 | `flex items-center gap-1 text-defaults-primary-text-primary pretendard-18SemiBold`                                      |
| 월패드 칩     | `<ChipBase color="blue" variant="fill" class-name="pb-2">월패드 알림</ChipBase>`                                        |
| 별 아이콘     | `Star.svg` alt `별 아이콘` (즐겨찾기만)                                                                                 |
| 더보기        | `MoreVertical.svg` alt `더보기 아이콘` `class="more-icon"` (드로어 모드에서는 숨김)                                     |
| 정보 목록     | `flex w-full flex-col items-start gap-2.5`                                                                              |
| 라벨          | `whitespace-nowrap text-defaults-tertiary-text-tertiary pretendard-14SemiBold`                                          |
| 값            | `text-left text-defaults-secondary-text-secondary pretendard-14Regular`                                                 |
| 하단 여백     | `<div class="pt-8"></div>`                                                                                              |
| 등록 버튼     | `<ButtonBase custom-class="fixed bottom-0 left-0" color="brand" size="2xl" round-type="square">+ 등록하기</ButtonBase>` |

> ⚠️ **`.more-icon`은 `<style scoped>`에도 정의가 없다.** 소스 어디에도 규칙이 없어
> **아무 효과 없는 클래스**다. → `deferred.md` 「죽은 코드」. 이관 시 제거.
>
> ⚠️ **월패드 칩이 차량번호 `<span>`과 같은 `<div>` 안에 세로로 쌓인다.**
> `class-name="pb-2"`로 간격을 준다. 칩이 있으면 카드 높이가 늘어난다.

## 값 렌더 (`renderFieldValue`)

| 키          | 처리                                                                                      |
| ----------- | ----------------------------------------------------------------------------------------- |
| `phone`     | `formatPhone(value)`                                                                      |
| `nickName`  | `formatHtmlText(value)` — 엔티티 디코드 + `\n`→`<br/>`                                    |
| `memo`      | `formatHtmlText` → `<br>` 제거 → 개행/탭 → 공백 → 연속 공백 1개 → `trim()` **1줄로 압축** |
| 그 외       | 원본                                                                                      |
| `undefined` | `-`                                                                                       |

> ⚠️ **`nickName`은 `formatHtmlText`를 거치는데 `v-dompurify-html`이 아니라 텍스트 보간이다.**
> `\n`이 들어 있으면 화면에 **`<br/>` 문자열이 그대로 보인다.** → `deferred.md` 「동작 의심」
>
> ⚠️ **`memo`는 줄바꿈을 공백으로 눌러 한 줄로 만든다.** 카드 레이아웃 유지용. 의도된 동작.

## 목록 조회 분기 🔴

```js
const isBookmarkList = computed(() => carManagementType.value.key === 'bookmark' || props.isDrawer)

useGetAlwaysAllowCarList({
  enabled: !props.isDrawer && carManagementType.value.key === 'alwaysAllow',
})
useGetBookmarkCarList({ enabled: isBookmarkList.value })
```

**두 훅을 항상 호출하고 `enabled`로 fetch만 막는다.**
`pageList`·`isLoading`·`isError`·`hasNextPage`·`fetchNextPage`를 `isBookmarkList`로 골라 쓴다.

> 🔴 **`enabled`에 `.value`를 벗겨 넣는다** (`isBookmarkList.value`, `carManagementType.value.key`).
> setup 시점 값으로 **고정**된다. 경로가 바뀌면 컴포넌트가 재생성되므로 실제 문제는 없다.
> React에서는 자연히 리렌더마다 계산되므로 **더 정확해진다.** 동작 차이 없음.
>
> 🔴 **두 훅의 `removeQueries`가 모두 실행된다** (§3-4). PK3에 들어가면 항상허용 캐시도 지워진다.

## 카드 클릭 → 드로어

```js
selectCard(info) → selectedCard = info; 드로어 열기
```

**드로어** (`DrawerBase`, 제목 없음):

| 버튼   | 조건                                     | 클래스                                                                                                                                                                          |
| ------ | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `수정` | `carManagementType.label === '즐겨찾기'` | `flex items-center justify-center self-stretch border-b border-b-defaults-tertiary-border-tertiary bg-base-b-white p-4 text-defaults-primary-text-primary pretendard-16Regular` |
| `삭제` | 항상                                     | `flex items-center justify-center self-stretch bg-base-b-white p-4 text-alerts-error-text-error pretendard-16Regular`                                                           |

래퍼: `flex w-full flex-col items-start self-stretch px-5 py-0`

**수정** → `navigateTo({ path: '/parking/carManagement/bookmark/edit/{uuid}', state: { carInfo: JSON.stringify(selectedCard) } })`

> ⚠️ **경로를 `carManagementType.value.key`로 만든다.** 항상허용에서는 `수정` 버튼 자체가 없어
> `/parking/carManagement/alwaysAllow/edit/...` 경로는 생성되지 않는다. **라우트도 없다** (R-1).

**삭제** → `CAR_INFO_DELETE_MODAL_DATA` 모달 → 확인 시:

```js
isDeleted = true; 모달 닫기;
if (bookmark) { if (isDeleteBookmarkedCarPending) return; deleteBookmarkedCarMutation(uuid); }
else          { if (isDeleteAlwaysAllowedCarPending) return; deleteAlwaysAllowedCarMutation(uuid); }
```

> ⚠️ **`isDeleted` ref는 설정만 되고 어디서도 읽지 않는다.** → `deferred.md` 「죽은 코드」
>
> ⚠️ **`@close="isDeleteModalOpen = false"`** — `handleDeleteModalClose`를 안 쓰고 인라인이라
> **`isDeleted`가 초기화되지 않는다.** 어차피 안 읽히므로 무해.

**삭제 성공**: `invalidateQueries([...])` (**v4 위치인자**) + 토스트 `삭제되었습니다`

**삭제 에러 (항상허용 전용 분기)**:

| `errorCode`              | 문구                                                   |
| ------------------------ | ------------------------------------------------------ |
| `ALWAYS_ALLOW_NOT_FOUND` | `항상허용 차량을 찾을 수 없습니다.`                    |
| `GUARD_NETWORK_ERROR`    | `단지 네트워크 장애입니다. 관리사무소에 문의해주세요.` |
| 그 외                    | 서버 `message`                                         |

**즐겨찾기 삭제는 전용 분기가 없다** — 전부 서버 `message`.

## QA 체크리스트

- [ ] PK3에 별 아이콘, PK4에 없음
- [ ] PK4 카드 필드가 `연락처`·`메모`
- [ ] PK4에서 월패드 서비스 단지 + `notificationFlag` 시 파란 `월패드 알림` 칩
- [ ] PK4 드로어에 **`수정`이 없는지** (R-1)
- [ ] 메모의 줄바꿈이 공백으로 눌려 한 줄로 보이는가
- [ ] 별칭에 줄바꿈이 있으면 `<br/>` 문자열이 보이는가 (레거시와 동일)
- [ ] 삭제 → 토스트 `삭제되었습니다` + 목록 갱신 (v5 무효화 수정 후)
- [ ] 카드 테두리가 회색인가

---

# PK5·PK6·PK7. 차량 등록 / 수정

`CarManagement/CarManagementAddView.vue`(7) · `CarManagementEditView.vue`(7) → 둘 다
`CarManagementForm.vue`(268) 한 줄 래퍼.

| 구분                   | PK5 즐겨찾기 등록 | PK6 항상허용 등록    | PK7 즐겨찾기 수정  |
| ---------------------- | ----------------- | -------------------- | ------------------ |
| 차량번호               | ✅                | ✅                   | ✅                 |
| 즐겨찾기 불러오기 버튼 | ❌                | ✅                   | ❌                 |
| 별칭                   | ✅                | ❌                   | ✅                 |
| 연락처                 | ✅                | ✅                   | ✅                 |
| 방문 목적              | ❌                | ✅                   | ❌                 |
| 메모                   | ❌                | ✅                   | ❌                 |
| 월패드 알림            | ❌                | ✅ (`hasWallPadUI`)  | ❌                 |
| 제출 버튼              | `등록하기`        | `등록하기`           | `수정하기`         |
| API                    | `postBookmarkCar` | `postAlwaysAllowCar` | `patchBookmarkCar` |

**항상허용 수정(PK7의 alwaysAllow 대응)은 존재하지 않는다** (R-1).

## 화면 구성 (PK6 기준)

```
┌─────────────────────────────┐
│ ← 항상허용 차량 등록          │
├─────────────────────────────┤
│ 차량번호 *   [★즐겨찾기 차량 불러오기]│
│ [차량번호를 입력하세요. 예)10서1234]│
│                             │
│ 연락처 *                     │
│ [연락처를 입력하세요]         │
│                             │
│ 방문 목적 *                  │
│ [방문 목적을 선택해주세요  ▾] │
│                             │
│ 메모                        │
│ ┌─────────────────────────┐ │
│ │메모를 입력하세요           │ │
│ │(최대 공백 포함 50자 이내)  │ │
│ └─────────────────────────┘ │
│                             │
│ 입출차 시 월패드 알림 *       │
│ 예 선택 시, 해당 차량 …       │
│ ( ) 예    ( ) 아니오         │
│                             │
│ [        등록하기        ]   │  fixed bottom-4 left-4, w-calc(100%-32px)
└─────────────────────────────┘
```

| 요소             | 클래스 (원문)                                                                                                                                                                                                                                                                        |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| form             | `flex h-full w-full flex-col justify-between overflow-auto`                                                                                                                                                                                                                          |
| 필드 목록        | `w-full space-y-5 p-5 pb-20`                                                                                                                                                                                                                                                         |
| 필드             | `flex flex-col items-start gap-[11px] self-stretch`                                                                                                                                                                                                                                  |
| 라벨             | `flex items-center gap-1 px-1 py-0 text-defaults-primary-text-primary pretendard-15SemiBold`                                                                                                                                                                                         |
| 필수 표시        | `Essential.svg` alt `별표 아이콘`                                                                                                                                                                                                                                                    |
| 입력 래퍼        | `w-full space-y-1.5` (차량번호) / `flex w-full flex-col items-start gap-[6px]` (나머지)                                                                                                                                                                                              |
| 메모 textarea    | `flex min-h-[105px] w-full flex-col items-start justify-center gap-2.5 self-stretch rounded border border-defaults-tertiary-border-tertiary p-2.5 px-3 font-['Pretendard'] text-defaults-primary-text-primary pretendard-16Regular placeholder:text-defaults-tertiary-text-tertiary` |
| 월패드 라벨      | `flex flex-col gap-1 px-1 py-0 ...` + 안내문 `flex flex-col gap-1 pretendard-14Regular`                                                                                                                                                                                              |
| 제출 버튼        | `custom-class="submit-button fixed bottom-4 left-4 flex justify-center"` `round-type="rounded"` `size="xl"`                                                                                                                                                                          |
| `.submit-button` | `<style scoped>` — `width: calc(100% - 32px)`                                                                                                                                                                                                                                        |

**placeholder**:

| 필드      | 문구                                                             |
| --------- | ---------------------------------------------------------------- |
| 차량번호  | `차량번호를 입력하세요. 예)10서1234`                             |
| 별칭      | `별칭을 입력하세요` (`maxlength=10`)                             |
| 연락처    | `연락처를 입력하세요` (`maxlength=13`)                           |
| 방문 목적 | `방문 목적을 선택해주세요`                                       |
| 메모      | `메모를 입력하세요\n(최대 공백 포함 50자 이내)` (`maxlength=50`) |

> ⚠️ **PK12의 차량번호 placeholder는 다르다** — `차량번호 예)123가1234, 서울12가1234`.
> 같은 필드인데 문구가 갈린다. → `deferred.md` 「오타·표기」

## 제출 버튼 상태

```html
:color="meta.valid ? 'brand' : 'defaults-secondary'" :has-outline="!meta.valid"
:disabled="isPostBookmarkCarPending || isPostAlwaysAllowCarPending || isPatchBookmarkedCarPending"
<SpinnerCircle v-if="…Pending" /><span v-else>{{ isAddPage ? '등록' : '수정' }}하기</span>
```

> **검증 실패 시에도 눌린다** (`disabled`는 제출 중일 때만). 누르면 vee-validate가
> 필드별 `TextError`를 표시한다. 게시판(`board.md` §5-12)과 같은 패턴이지만
> **주차는 인라인 에러가 실제로 렌더된다** — 게시판은 모달이었다. **도메인 간 비대칭.**
>
> ⚠️ **`isPending` 3개를 OR로 묶는다.** 즐겨찾기 등록 화면에서도 항상허용 mutation의
> pending을 본다. 서로 배타적이라 실제 문제는 없다.

## 수정 화면의 초기값 🔴

```js
const editCarInfo = ref(
  window?.history?.state?.carInfo ? JSON.parse(window.history.state.carInfo) : '',
)
useForm({
  validationSchema: schema,
  initialValues: !isAddPage.value && {
    ...editCarInfo.value,
    phone: formatPhone(editCarInfo.value.phone),
  },
})
```

> 🔴 **`history.state`가 사라지면 폼이 빈다.** PK7에서 **새로고침하면** `carInfo`가 없어
> `editCarInfo`가 `''`가 되고, `{ ...'' }`는 빈 객체라 **모든 필드가 비어 저장된다.**
> `board.md` §5-13(ReportView), `parking.md` §PK10(RejectReasonView)과 같은 유형.
> → `deferred.md` 「동작 의심」. **이관 시 그대로**(react-router `location.state`로 이전)
>
> ⚠️ **등록 화면에서는 `initialValues`가 `false`(불리언)다.** `!isAddPage.value && {...}`의
> 단락 평가 결과. vee-validate가 falsy를 무시해 동작하지만 의도한 타입이 아니다.
>
> ⚠️ **`phone`은 `formatPhone`으로 하이픈을 넣어 표시하고, 전송 직전 `cleanPhoneHyphen`으로 뺀다.**
> 3개 mutation 훅 전부 동일. 왕복 규칙을 지켜야 한다.

## 즐겨찾기 차량 불러오기 — `BookmarkCarSelectorButton` (49줄)

**PK6·PK12·PK13에만 있다.**

```html
<button
  class="border-navy-default-border-navy bg-base-b-white text-navy-default-text-navy pretendard-12SemiBold flex h-6 items-center justify-center gap-1 rounded-full border px-3"
>
  <img src="/assets/icons/Star.svg" alt="별 아이콘" />
  <span>즐겨찾기 차량 불러오기</span>
</button>
```

**드로어** (`DrawerBase` `title="즐겨찾기 차량 불러오기"` `is-close` `is-button=false`):

- 래퍼 `h-full w-full pt-2.5` > `h-full max-h-[70vh] min-h-72 w-full overflow-auto`
- 내용: `<CarManagementList is-drawer @select-card="…" />`

**선택 시**:

```js
setFieldValue('carNum', info.carNum)
setFieldValue('phone', formatPhone(info.phone))
```

→ 차량번호와 연락처만 채운다. 별칭·메모는 안 채운다.

> ⚠️ **`is-drawer`면 `CarManagementList`가 항상 즐겨찾기 목록을 보여준다** (`isBookmarkList` OR 조건).
> 항상허용 등록 화면에서도 **즐겨찾기** 목록이 뜬다. 의도된 동작.
>
> ⚠️ **드로어를 열면 `useGetAlwaysAllowCarList`의 `removeQueries`가 실행된다** (§3-4).

## 방문목적 선택 — `VisitPurposeSelect` (126줄)

**PK6·PK12·PK13에 있다.**

```js
const { value: inputValue, setValue } = useField(props.id) // ← 필드명이 id prop
```

> ⚠️ **필드명이 `name`이 아니라 `id` prop이다.** `InputBase`와 같은 패턴
> (`signup.md`에 기록됨). 넘기는 값은 `id="visitPurpose"`.

| 요소        | 클래스 (원문)                                                                                                                                                                                                                                                                                              |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 버튼        | `relative w-full`                                                                                                                                                                                                                                                                                          |
| input       | `flex h-10 w-full flex-col justify-center gap-[10px] self-stretch rounded-[4px] border border-defaults-tertiary-border-tertiary px-4 py-[10px] text-defaults-primary-text-primary caret-brand-default-background-brand pretendard-16Regular placeholder:text-defaults-tertiary-text-tertiary` (`readonly`) |
| 화살표      | `absolute right-[10px] top-1/2 h-4 w-4 translate-y-[-50%]` — `DownArrowSmall.svg` alt `화살표 아이콘`                                                                                                                                                                                                      |
| 드로어 내용 | `flex max-h-[70vh] w-full flex-col gap-3 overflow-auto px-5 py-4`                                                                                                                                                                                                                                          |
| 로딩        | `flex items-center border-b border-b-defaults-tertiary-border-tertiary pb-4` × 5 + `h-5 w-40` 스켈레톤                                                                                                                                                                                                     |
| 에러        | `flex flex-col items-center justify-center py-10 text-center` → `방문 목적을 불러올 수 없습니다` `<br/>` `잠시 후 다시 시도해주세요`                                                                                                                                                                       |
| 목록 항목   | `flex items-center self-stretch p-4 text-center text-defaults-primary-text-primary pretendard-16Regular` (+ 마지막 아닌 항목에 `border-b border-b-defaults-tertiary-border-tertiary`)                                                                                                                      |
| 빈 상태     | `방문목적 목록이 비어있습니다` `<br/>` `관리사무소에 문의해주세요`                                                                                                                                                                                                                                         |

**드로어 제목은 `placeholder` prop을 그대로 쓴다** — PK6은 `방문 목적을 선택해주세요`,
PK12·PK13은 `방문 목적을 선택하세요`. **문구가 다르다.** → `deferred.md` 「오타·표기」

> ⚠️ **`:value="inputValue.name"`에 옵셔널 체이닝이 없다.** 초기값이 `undefined`면
> 템플릿 평가 시 TypeError가 난다. 실제로는 화면이 동작하므로 vee-validate가
> 빈 값을 넣어주는 것으로 보이나 **확인이 필요하다.** → `[확인 필요]` PK-Q8
>
> ⚠️ **`<li>`에 `@click`을 걸었다** (`<button>`이 아니다). 키보드 접근 불가.
> `:key="category"`도 객체를 키로 쓴다. 그대로 이관.

## 월패드 알림 — `InputRadioDual`

**`hasWallPadUI && carManagementType.key === 'alwaysAllow'`일 때만 렌더** (PK6 전용).

- 라벨 `입출차 시 월패드 알림` + 필수 아이콘
- 안내문 2줄 = `PARKING_WALL_PAD_ALARM`
- 선택지 `PARKING_WALL_PAD_ALARM_INPUT` = `예`(true) / `아니오`(false)
- 스키마: `parkingWallPadAlarm` (`z.boolean`, 미선택 시 `예, 아니오 중에 선택해주세요`)

## 제출

```js
onSubmit = handleSubmit((values) => {
  if (isAddPage) {
    carManagementType.key === 'bookmark'
      ? postBookmarkCarMutation(values)
      : postAlwaysAllowCarMutation(values)
  } else {
    patchBookmarkedCarMutation({ ...values, bookmarkUuid: getParams().uuid })
  }
})
```

| 훅                        | 전송 변환                                                                                      | 성공                                                                                                                              |
| ------------------------- | ---------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `usePostBookmarkCar`      | `phone: cleanPhoneHyphen(phone)`                                                               | `invalidateQueries(['bookmarkCarList'])`(v4) + `navigateBack()` + 토스트 `등록되었습니다`                                         |
| `usePostAlwaysAllowedCar` | `phone` 정리 + `visitPurposeUuid: visitPurpose.uuid` + `notificationFlag: parkingWallPadAlarm` | `invalidateQueries(['alwaysAllowCarList'])`(v4) + `navigateBack()` + 토스트 `항상허용 차량이 등록되었습니다`                      |
| `usePatchBookmarkedCar`   | `phone` 정리                                                                                   | `invalidateQueries(['bookmarkCarList'])`(v4) + **`navigateTo('/parking/carManagement/bookmark/list')`** + 토스트 `수정되었습니다` |

> ⚠️ **수정만 `navigateTo`(치환)이고 등록은 `navigateBack`이다.** 히스토리 스택이 달라진다.
> 수정 후 뒤로가면 목록이 아니라 그 이전 화면으로 간다. 그대로 이관.
>
> ⚠️ **토스트 문구가 제각각이다** — `등록되었습니다` / `항상허용 차량이 등록되었습니다` / `수정되었습니다`.

### 등록 에러 분기

**즐겨찾기** (`usePostBookmarkCar`):

| `errorCode`           | 문구                               |
| --------------------- | ---------------------------------- |
| `BOOKMARK_DUPLICATED` | `이미 등록된 즐겨찾기 차량입니다.` |
| 그 외                 | 서버 `message`                     |

**항상허용** (`usePostAlwaysAllowedCar`):

| `errorCode`           | 문구                                                   |
| --------------------- | ------------------------------------------------------ |
| `REGULAR_EXISTS`      | `해당 단지에 이미 등록된 정기권 차량입니다.`           |
| `ALWAYS_ALLOW_EXISTS` | `해당 단지에 이미 등록된 항상허용 차량입니다.`         |
| `RESERVATION_EXISTS`  | `해당 단지에 이미 방문예약된 차량입니다.`              |
| `BLACK_LIST_EXISTS`   | `블랙리스트로 등록된 차량입니다.`                      |
| `REJECT_EXISTS`       | `거절된 차량입니다.`                                   |
| `GUARD_NETWORK_ERROR` | `단지 네트워크 장애입니다. 관리사무소에 문의해주세요.` |
| 그 외                 | 서버 `message`                                         |

**수정** (`usePatchBookmarkedCar`): 전용 분기 **없음** — 전부 서버 `message`.

## QA 체크리스트

- [ ] PK5에 별칭 필드, PK6에 방문목적·메모 필드
- [ ] PK6에만 `즐겨찾기 차량 불러오기` 버튼
- [ ] 불러오기 → 차량번호·연락처만 채워지는가
- [ ] 월패드 서비스 단지에서만 라디오가 보이는가
- [ ] 검증 실패 시 버튼이 회색이지만 **눌리고**, 필드 아래 인라인 에러가 뜨는가
- [ ] 연락처가 입력 중 하이픈으로 표시되고 전송 시 제거되는가
- [ ] PK7 진입 시 기존 값이 채워지는가
- [ ] **PK7에서 새로고침하면 폼이 비는가** (레거시와 동일)
- [ ] 중복 차량 등록 시 유형별 에러 문구
- [ ] 수정 성공 후 뒤로가기가 목록이 아닌 곳으로 가는가 (레거시와 동일)

---

# PK8. 입출차 내역 — `/parking/inoutHistory`

`InOutHistory/InOutCarHistoryListView.vue` (148줄)

## 화면 구성

```
┌─────────────────────────────┐
│ ← 입출차 내역                │
├─────────────────────────────┤
│ 2026년 7월 ▾                │  DrawerMonth (초기값 = history.state)
├─────────────────────────────┤
│ ┌─────────────────────────┐ │
│ │ [정기차량]               │ │  ChipBase (carType별 색)
│ │ 12가3456  →             │ │
│ │ ─────────────────────── │ │
│ │ 입차시간  2026-07-29 …   │ │
│ │ 출차시간  2026-07-29 …   │ │
│ │ 총 주차시간     2시간30분 │ │
│ └─────────────────────────┘ │
└─────────────────────────────┘
```

| 요소      | 클래스 (원문)                                                                                          |
| --------- | ------------------------------------------------------------------------------------------------------ |
| 루트      | `h-full pb-10`                                                                                         |
| `<li>`    | `border-deep-glue-20 flex flex-col gap-3 self-stretch rounded-xl border bg-base-b-white p-3 shadow-md` |
| 카드 버튼 | `flex flex-col gap-3`                                                                                  |
| 상단      | `flex w-full flex-col gap-1 border-b border-b-defaults-tertiary-border-tertiary pb-3`                  |
| 유형 칩   | `<ChipBase :color="findCarType(carType).chipColor" variant="fill">{label}</ChipBase>`                  |
| 번호 행   | `flex w-full items-center gap-1`                                                                       |
| 차량번호  | `text-defaults-primary-text-primary pretendard-18SemiBold`                                             |
| 화살표    | `ArrowRight.svg` alt `화살표 아이콘` `h-[18px] w-[18px]`                                               |
| 정보 목록 | `flex w-full flex-col items-start gap-2.5`                                                             |
| 라벨      | `whitespace-nowrap text-defaults-tertiary-text-tertiary pretendard-14SemiBold`                         |
| 값        | `text-left text-defaults-secondary-text-secondary pretendard-14Regular`                                |

**필드**: `CARD_ITEM_FIELD.inOutHistory` = 입차시간 · 출차시간 · 총 주차시간

**차량 유형 칩** (`CAR_TYPE`):

| `carType`          | 라벨       | 색     |
| ------------------ | ---------- | ------ |
| `REGULAR`          | 정기차량   | green  |
| `REGULAR_RESIDENT` | 입주민     | green  |
| `RESERVATION`      | 방문예약   | gray   |
| `GENERAL`          | 일반방문   | gray   |
| `ALWAYS_ALLOW`     | 항상허용   | blue   |
| `UNKNOWN`          | 미등록     | purple |
| `REJECT`           | 거부       | red    |
| `BLACKLIST`        | 블랙리스트 | red    |

## 데이터

**API**: `getInOutCarList` — `/parking/resident/inout-parking/{aptResidentUuid}`
쿼리 파라미터 `page` · `size`(=10) · `startDate` · `endDate` · **`desc`** · `carType`

훅이 보내는 것: `startDate: '{YYYY-MM-DD} 00:00:00'` · `endDate: '{YYYY-MM-DD} 23:59:59'` · `desc: true`
**`carType`은 채우지 않는다** — 필터 UI가 없다.

쿼리 키 `['inOutCarList', aptResidentUuid, startDate, endDate, true]`

## 월 상태 보존

```js
const savedYear  = window.history.state?.selectedYear  ?? now.getFullYear();
const savedMonth = window.history.state?.selectedMonth ?? now.getMonth() + 1;

handleMonthChange({ year, month }):
  window.history.replaceState({ ...window.history.state, selectedYear: year, selectedMonth: month }, '');
  setAdditionalParams(getCurrentMonthRange(new Date(year, month - 1)));
```

**상세(PK9)에 다녀와도 선택한 월이 유지된다.** `DrawerMonth`에 `initial-year`·`initial-month`로 되먹인다.

> ⚠️ **`replaceState`의 두 번째 인자가 `''`(title)이고 URL은 생략됐다.** 현재 URL 유지. 정상.
>
> ⚠️ **PK11도 같은 방식이지만 PK2는 안 한다.** 3개 중 2개만 보존. **비대칭.**

## 캐시·스크롤 복원

- `useGetInOutCarList`: 상세에서 복귀가 아니면 `removeQueries`, 복귀면 `staleTime: Infinity` (§3-4)
- `CardList`에 `scroll-restore-path="/parking/inoutHistory"` → `useInfiniteScrollPosition` 활성

**두 장치가 함께 작동해야 "상세 다녀와도 목록·스크롤 유지"가 성립한다.**
`useInfiniteScrollPosition`의 저장 키는 `'scrollRestoration'` 하나뿐이라 PK11과 공유한다
(`board.md` §3-2와 동일한 전역 키 문제).

## 값 렌더

`parkingMinutes`만 `formatMinutes` 가공(0이면 `0분`), 나머지는 원본.
최종 `|| '-'`.

## QA 체크리스트

- [ ] 차량 유형별 칩 색 8종
- [ ] 카드 클릭 → PK9
- [ ] 월 변경 → 목록 갱신
- [ ] **상세 다녀온 뒤 선택한 월과 스크롤 위치가 유지되는가**
- [ ] 다른 화면에서 다시 진입하면 이번 달로 초기화되는가
- [ ] 0건 시 `입출차 내역이 없습니다`
- [ ] 에러 시 `입출차 내역을 불러올 수 없습니다`

---

# PK9. 입출차 차량 상세 — `/parking/inoutHistory/detail/:uuid`

`InOutHistory/InOutCarHistoryDetailView.vue` (226줄)

## 화면 구성

```
┌─────────────────────────────┐
│ ← 입출차 차량 상세           │
├─────────────────────────────┤
│ 차량번호          12가3456   │
│ 입차시간   2026-07-29 14:30  │
│ 출차시간   2026-07-29 17:00  │
│ 총 주차시간        2시간 30분 │
│ 연락처     010-1234-5678     │
│ 방문목적            택배     │
│ 차량유형          [미등록]   │
│                             │
│ 미확인 차량 거부             │  canRejectCar일 때만
│ [        거부하기        ]   │
│                             │
│ 차량 이미지                  │
│ [입차]                      │
│ ┌─────────────────────────┐ │  aspect-[2/1]
│ │      (입차 사진)         │ │
│ └─────────────────────────┘ │
│ [출차]                      │
│ ┌─────────────────────────┐ │
│ │      (출차 사진)         │ │
│ └─────────────────────────┘ │
└─────────────────────────────┘
```

| 요소          | 클래스 (원문)                                                                                                                                                 |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 루트          | `h-full w-full overflow-auto`                                                                                                                                 |
| 내부          | `relative flex h-full w-full flex-col items-start justify-between p-5`                                                                                        |
| 목록          | `flex h-full w-full flex-col items-start gap-5 self-stretch pb-12`                                                                                            |
| 항목          | `flex min-h-6 items-start justify-between self-stretch`                                                                                                       |
| 라벨          | `text-defaults-primary-text-primary pretendard-15SemiBold`                                                                                                    |
| 값            | `text-defaults-secondary-text-secondary pretendard-15Regular`                                                                                                 |
| 차량유형 래퍼 | `flex w-52 items-center justify-end gap-2`                                                                                                                    |
| 거부 영역     | `flex w-full flex-col gap-3` + 제목 `text-defaults-primary-text-primary pretendard-15SemiBold`                                                                |
| 이미지 섹션   | `car-image-section flex w-full flex-col gap-2` + 제목 `mb-4 …pretendard-15SemiBold`                                                                           |
| 이미지 래퍼   | `aspect-[2/1] w-full overflow-hidden rounded-lg`                                                                                                              |
| 이미지        | `h-full w-full object-cover`                                                                                                                                  |
| 이미지 없음   | `flex aspect-video w-full items-center justify-center rounded-lg bg-neutral-b-gray-200` + `text-neutral-b-gray-500 pretendard-14Regular` → `차량 이미지 없음` |
| 출차 블록     | `mb-20 flex flex-col gap-2` ← 하단 여백                                                                                                                       |

> ⚠️ **`.car-image-section`은 `<style scoped>`에 정의가 없다.** 죽은 클래스.
> → `deferred.md` 「죽은 코드」
>
> ⚠️ **이미지 있을 때는 `aspect-[2/1]`, 없을 때는 `aspect-video`(16/9)다.** 높이가 달라진다.
> → `deferred.md` 「동작 의심」. 그대로 이관.
>
> ⚠️ **거부 영역이 `<ul>` 안에 `<div>`로 들어간다** (`<li>` 아님). HTML 규격 위반.

## 필드 렌더 (`IN_OUT_HISTORY_DETAIL_FIELD`)

| 키               | 렌더                                                                              |
| ---------------- | --------------------------------------------------------------------------------- |
| `carNum`         | 원본 `                                                                            |     | '-'` |
| `inParkingTime`  | 원본 `                                                                            |     | '-'` |
| `outParkingTime` | 원본 `                                                                            |     | '-'` |
| `parkingMinutes` | `renderParkingMinutes` — 0이면 **`-`**, 1시간 미만 `{m}분`, 그 외 `{h}시간 {m}분` |
| `phone`          | `formatPhone(...)                                                                 |     | '-'` |
| `visitPurpose`   | 원본 `                                                                            |     | '-'` |
| `carType`        | `ChipBase` (`findCarType`)                                                        |

> ⚠️ **PK8 목록은 0분을 `0분`으로, PK9 상세는 `-`로 표시한다.** 같은 값의 표기가 다르다.
> → `deferred.md` 「오타·표기」. **이관 시 그대로**

## 거부 기능

```js
canRejectCar = (carType === 'UNKNOWN' || carType === 'GENERAL') && !rejectFlag
```

**조건**: 미등록 또는 일반방문 차량이고 아직 거부되지 않았을 때만 `미확인 차량 거부` 영역 노출.

**흐름**: `거부하기` 버튼 → `PARKING_REJECT_MODAL_DATA` 모달(`button-type="dual"`)
→ `거부하기` → `navigateTo({ path: '/parking/reject/{uuid}', state: { carNum } })` → PK10

**모달**: 제목 `주차를 거부하시겠습니까?` / 본문 `거부시, 마일리지 차감이 되지 않습니다.` / `취소`·`거부하기`

> ⚠️ **`carUuid` ref는 `onMounted`에서 `getParams().uuid`를 담는데, `getParams().uuid`는
> 처음부터 쓸 수 있다.** 불필요한 간접. `useGetInOutCarDetail(getParams().uuid)`는 직접 쓴다.
> → `deferred.md` 「죽은 코드」

## 데이터

**API**: `getInOutCarDetail` — `/parking/resident/inout-parking/{residentUuid}/{parkingUuid}`
쿼리 키 `['inOutCarDetail', aptResidentUuid, parkingUuid]` — **키가 온전하다** (게시판과 대조적)

## 상태

| 상황        | 렌더                                                                                 |
| ----------- | ------------------------------------------------------------------------------------ |
| 로딩        | 필드 7행 스켈레톤(`h-6 w-32` / `h-6 w-40`) + 이미지 섹션 스켈레톤(`aspect-[2/1]` ×2) |
| 에러        | `입출차 상세 정보를 불러올 수 없습니다` `<br/>` `잠시 후 다시 시도해주세요`          |
| 이미지 없음 | `차량 이미지 없음` (회색 박스)                                                       |
| 거부 불가   | 거부 영역 미렌더                                                                     |

## QA 체크리스트

- [ ] 7개 필드가 순서대로 표시
- [ ] `총 주차시간` 0일 때 **`-`** (PK8 목록은 `0분`)
- [ ] 미등록/일반방문 + 미거부일 때만 거부 영역
- [ ] 거부 모달 문구
- [ ] 입차·출차 이미지 비율이 2:1, 없으면 16:9 회색 박스
- [ ] 푸시 딥링크로 직접 진입 가능한가

---

# PK10. 차량 거부 — `/parking/reject/:uuid`

`RejectCar/RejectReasonView.vue` (75줄)

## 화면 구성

```
┌─────────────────────────────┐
│ ← 차량 거부                  │
├─────────────────────────────┤
│ 거부 사유를 입력해주세요      │  pretendard-18Bold
│ ┌─────────────────────────┐ │
│ │ 내용을 입력해주세요       │ │  h-[216px]
│ └─────────────────────────┘ │
│ (에러)        글자 수 제한 0/100│
│                             │
│ [        거부하기        ]   │  absolute bottom-0 left-0
└─────────────────────────────┘
```

| 요소        | 클래스 (원문)                                                                                                                                     |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| 루트        | `relative h-full space-y-4 overflow-auto p-5`                                                                                                     |
| 제목 래퍼   | `space-y-2.5`                                                                                                                                     |
| 제목        | `pretendard-18Bold` → `거부 사유를 입력해주세요`                                                                                                  |
| textarea    | `h-[216px] w-full rounded border border-defaults-tertiary-border-tertiary bg-defaults-secondary-background-mono px-3 py-2.5 pretendard-16Regular` |
| placeholder | `내용을 입력해주세요`                                                                                                                             |
| 하단 행     | `flex w-full justify-between`                                                                                                                     |
| 에러        | `<TextError>{{ errors.rejectReason }}</TextError>`                                                                                                |
| 카운터      | `space-x-1 text-defaults-secondary-text-secondary pretendard-13Regular` + `글자 수 제한`(SemiBold) `{n}/100`                                      |
| 버튼        | `custom-class="absolute bottom-0 left-0 flex justify-center"` `round-type="square"` `size="2xl"`                                                  |

> ⚠️ **빈 `<span class="text-[#8f8f8f] pretendard-13Regular"></span>`이 제목 아래에 있다.**
> 내용이 없어 아무것도 안 보인다. → `deferred.md` 「죽은 코드」. 이관 시 제거.
>
> ⚠️ **루트에 `relative`가 있어 버튼의 `absolute bottom-0`이 정상 동작한다.**
> `board.md` B20(`ReportView`)은 `relative`가 없어 기준이 다르다. **비대칭.**

## 검증

`rejectCarSchema` — `rejectReason` 1~100자.
`board.md` B20과 달리 **`maxlength` 하드 절단이 아니라 zod `.max(100)` 검증**이다.
100자를 넘겨 입력할 수 있고, 제출 시 `최대 100자 이내로 입력해주세요`가 뜬다.

**버튼 색**: `meta.valid ? 'alerts-error' : 'defaults-secondary'`
**`disabled`**: `isPostRejectCarPending`만 → **검증 실패에도 눌린다** (인라인 에러 표시)

## 제출

```js
onSubmit = handleSubmit((values) => {
  postRejectCarMutation({
    uuid: getParams().uuid,
    carNum: carNum.value,
    reason: values.rejectReason,
  })
})
onMounted(() => {
  carNum.value = window?.history?.state?.carNum
})
```

**API**: `postRejectCar` — `POST /parking/resident/reject/{residentUuid}` body `{ carNum, reason }`

> 🔴 **`carNum`을 `history.state`에서 읽는다.** PK9에서 넘겨준 값이다.
> **새로고침·딥링크 재진입 시 `undefined`가 되어 빈 차량번호로 거부 요청이 나간다.**
> `board.md` §5-13, §PK5~PK7과 같은 유형. → `deferred.md` 「동작 의심」. **이관 시 그대로**
>
> ⚠️ **`mutationFn`은 `{ carNum, reason }`만 쓴다.** `uuid`는 `onSuccess`의 무효화 키에만 쓰인다.

**성공**: `invalidateQueries(['inOutCarDetail', aptResidentUuid, variables?.uuid])` (**v4 위치인자**)

- `navigateBack()` + 토스트 `거부되었습니다`

### 에러 분기

| `errorCode`                   | 문구                                                   |
| ----------------------------- | ------------------------------------------------------ |
| `REJECT_ALREADY_EXISTS`       | `이미 거부된 차량이 존재합니다.`                       |
| `CAR_TYPE_NOT_ALLOWED`        | `거부 할 수 없는 차량 종류 입니다.`                    |
| `REJECT_HOUSE_HOLD_NOT_MATCH` | `거부 요청한 세대 정보가 일치 하지 않습니다.`          |
| `GUARD_NETWORK_ERROR`         | `단지 네트워크 장애입니다. 관리사무소에 문의해주세요.` |
| 그 외                         | 서버 `message`                                         |

> ⚠️ 문구에 띄어쓰기 오류가 있다 — `거부 할 수 없는`, `일치 하지 않습니다`.
> **표시 문구이므로 등가 이관 원칙에 따라 그대로 둔다.** → `deferred.md` 「오타·표기」

## QA 체크리스트

- [ ] PK9 → 거부 모달 → PK10 진입 시 차량번호가 전달되는가
- [ ] 100자 초과 입력이 **가능하고** 제출 시 에러가 뜨는가 (B20과 다름)
- [ ] 1자 이상이면 버튼이 빨강
- [ ] 거부 성공 → 뒤로가기 + 토스트 `거부되었습니다`
- [ ] 이미 거부된 차량 → `이미 거부된 차량이 존재합니다.`
- [ ] **새로고침 후 제출 시 차량번호가 비는가** (레거시와 동일)

---

# PK11. 방문예약 관리 — `/parking/reservation`

`ReservationCar/ReservationCarListView.vue` (188줄)

## 화면 구성

```
┌─────────────────────────────┐
│ ← 방문예약 관리              │
├─────────────────────────────┤
│ 2026년 7월 ▾                │  DrawerMonth
│ 총 3건                      │
│ ┌─────────────────────────┐ │
│ │ [입차예정] [월패드 알림]  │ │
│ │ 12가3456  →             │ │
│ │ ─────────────────────── │ │
│ │ 입출차 예약 기간 07/29~07/31│ │
│ │ [ 방문예약 재신청하기 ]   │ │
│ └─────────────────────────┘ │
│                             │
│ [        예약하기        ]   │  fixed bottom-0
└─────────────────────────────┘
```

| 요소        | 클래스 (원문)                                                                                          |
| ----------- | ------------------------------------------------------------------------------------------------------ |
| 루트        | `h-full border-b border-neutral-b-gray-300 pb-20`                                                      |
| 건수 로딩   | `px-6 py-1.5` + `SkeletonBase class="h-5 w-16 rounded"`                                                |
| 건수        | `px-6 py-1.5 text-defaults-primary-text-primary pretendard-16SemiBold` → `총 {n}건`                    |
| `<li>`      | `border-deep-glue-20 flex flex-col gap-3 self-stretch rounded-xl border bg-base-b-white p-3 shadow-md` |
| 상단        | `flex w-full flex-col gap-1 border-b border-b-defaults-tertiary-border-tertiary pb-3`                  |
| 칩 행       | `flex gap-2`                                                                                           |
| 번호 행     | `flex w-full items-center gap-1` + `pretendard-18SemiBold` + `ArrowRight.svg` `h-[18px] w-[18px]`      |
| 정보 목록   | `flex w-full flex-col items-start gap-2.5`                                                             |
| 재신청 영역 | `w-full pt-2`                                                                                          |
| 예약 버튼   | `custom-class="fixed bottom-0 left-0"` `color="brand"` `size="2xl"` `round-type="square"`              |

> ⚠️ **`총 {n}건`에 `|| 0`이 없다.** 응답 전에는 `총 건`으로 보인다(로딩 중엔 스켈레톤이라 가려짐).
> PK2는 `|| 0`이 있다. **비대칭.**

## 상태 칩

```js
findInParkingStatus({ inParkingFlag, outParkingScheduledDate })
```

| 조건                           | 라벨       | 색         |
| ------------------------------ | ---------- | ---------- |
| `inParkingFlag`                | `입차`     | blue       |
| 예정일 < 오늘 (자정 기준 비교) | `미입차`   | deepPurple |
| 그 외                          | `입차예정` | orange     |

**월패드 칩**: `hasWallPadUI && card.notificationFlag` → `<ChipBase color="blue" variant="fill">월패드 알림</ChipBase>`

> ⚠️ **`입차` 칩과 `월패드 알림` 칩이 둘 다 파랑이다.** 나란히 있으면 구분이 어렵다.
> → `deferred.md` 「동작 의심」

## 예약 기간 표시

```js
renderScheduledDate(card):
  const inD  = card?.inParkingScheduledDate?.replaceAll('-', '/');
  const outD = card?.outParkingScheduledDate?.replaceAll('-', '/');
  return in === out ? inD.slice(5) : `${inD.slice(5)} ~ ${outD.slice(5)}`;
```

`2026-07-29 00:00:00` → `2026/07/29 00:00:00` → `.slice(5)` → **`07/29 00:00:00`**

> ⚠️ **`.slice(5)`가 시각까지 남긴다.** 서버가 시각을 포함해 주면 `07/29 00:00:00`처럼 보인다.
> 응답 형식 확인 필요. → `[확인 필요]` PK-Q9
>
> ⚠️ **`?.`가 `replaceAll`까지만 걸려 있고 `.slice(5)`에는 없다.**
> 값이 없으면 `undefined.slice()` → TypeError.

## 재신청 버튼 — `ReservationAgainButton` (40줄)

```html
<ButtonBase
  :has-outline="!isDetailPage"
  round-type="rounded"
  :color="isDetailPage ? 'brand' : 'defaults-secondary'"
  :size="isDetailPage ? '2xl' : 'lg'"
  @click="handleReservationAgainButton"
  @click.stop
>
  <span
    :class="isDetailPage ? 'text-base-b-white'
                             : 'text-navy-default-text-navy pretendard-16SemiBold'"
  >
    방문예약 재신청하기</span
  >
</ButtonBase>
```

| 위치      | 색                   | 크기  | 외곽선 | 글자색                        |
| --------- | -------------------- | ----- | ------ | ----------------------------- |
| PK11 카드 | `defaults-secondary` | `lg`  | ✅     | `text-navy-default-text-navy` |
| PK14 상세 | `brand`              | `2xl` | ❌     | `text-base-b-white`           |

**이동**: `/parking/reservation/add/{uuid}` → PK13

> ⚠️ **`@click`과 `@click.stop`을 둘 다 선언했다.** 카드 전체가 클릭 가능한 `<button>`이라
> 전파를 막아야 하는데, 두 리스너가 별도로 등록된다. 결과적으로 핸들러 실행 + 전파 차단이
> 모두 일어나 의도대로 동작한다. → `deferred.md` 「구조 개선」
>
> 🔴 **PK11의 카드는 `<button>` 안에 `ReservationAgainButton`(또 다른 `<button>`)이 중첩된다.**
> HTML 규격 위반. React에서도 그대로 두면 동일하게 동작하지만 경고가 날 수 있다.

## 데이터

**API**: `getReservationCarList` — `/parking/resident/reservation/{aptResidentUuid}/list`
파라미터 `page` · `size`(=10) · `startDate` · `endDate`

월 보존은 PK8과 동일 (`history.replaceState`), 캐시 복원도 동일 (§3-4),
`scroll-restore-path="/parking/reservation"`.

## QA 체크리스트

- [ ] 상태 칩 3종(입차/입차예정/미입차) 색
- [ ] 월패드 칩이 파란색으로 나란히 표시
- [ ] 예약 기간 표기 (단일일 때 1개, 기간일 때 `~`)
- [ ] 카드 클릭 → PK14, 재신청 버튼 클릭 → PK13 (**카드 클릭으로 전파되지 않는가**)
- [ ] `예약하기` → PK12
- [ ] 상세 다녀온 뒤 월·스크롤 유지
- [ ] 0건 시 `예약 내역이 없습니다`

---

# PK12·PK13. 방문예약 등록 / 재등록

`ReservationCar/ReservationCarAddView.vue` (221줄)

| 구분      | PK12 등록                  | PK13 재등록                      |
| --------- | -------------------------- | -------------------------------- |
| 경로      | `/parking/reservation/add` | `/parking/reservation/add/:uuid` |
| AppBar    | `방문예약 등록`            | `방문예약 재등록`                |
| 초기값    | 없음                       | **기존 예약에서 채움**           |
| 예약 기간 | 비어 있음                  | **비어 있음** (날짜는 안 채운다) |

## 화면 구성

```
┌─────────────────────────────┐
│ ← 방문예약 등록              │
├─────────────────────────────┤
│ 차량번호 *  [★즐겨찾기 차량 불러오기]│
│ [차량번호 예)123가1234, 서울12가1234]│
│                             │
│ 입출차 예약 기간 *           │
│ [예약 기간을 선택해주세요  >] │
│ ⓘ 방문예약 기간 설정은 최대 7일입니다│
│                             │
│ 연락처 *                     │
│ 방문 목적 *                  │
│ 메모                        │
│ 입출차 시 월패드 알림 *  ← hasWallPadUI
│                             │
│ [        등록하기        ]   │  fixed bottom-4 left-4
└─────────────────────────────┘
```

| 요소      | 클래스 (원문)                                                               |
| --------- | --------------------------------------------------------------------------- |
| form      | `h-full w-full overflow-auto`                                               |
| 필드 목록 | `w-full space-y-5 px-5 pb-20` ← **PK5~PK7은 `p-5`, 여기는 `px-5`**          |
| 필드      | `flex flex-col items-start gap-3 self-stretch` ← **PK5~PK7은 `gap-[11px]`** |
| 제출 버튼 | `custom-class="submit-button fixed bottom-4 left-4 flex justify-center"`    |

> ⚠️ **PK5~PK7 폼과 간격이 미묘하게 다르다** (`gap-3`=12px vs `gap-[11px]`, `p-5` vs `px-5`).
> 같은 폼처럼 보이지만 픽셀이 다르다. **등가 이관 대조 시 주의.**

## 예약 기간 — `ReservationCarAddCalendar` (104줄)

| 요소    | 클래스 (원문)                                                                                                                                                                            |
| ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `<li>`  | `flex flex-col items-start gap-[11px] self-stretch`                                                                                                                                      |
| 라벨    | `flex items-center gap-1 px-1 py-0 text-defaults-primary-text-primary pretendard-15SemiBold` + `Essential.svg`                                                                           |
| 버튼    | `flex w-full items-center justify-between self-stretch rounded-md border border-defaults-tertiary-border-tertiary p-2.5 text-defaults-primary-text-primary pretendard-16Regular`         |
| 선택 전 | `text-defaults-secondary-text-secondary` → `예약 기간을 선택해주세요`                                                                                                                    |
| 선택 후 | `{start}` `~{end}` `({n}일)`                                                                                                                                                             |
| 화살표  | `ArrowRight.svg` alt `화살표 아이콘` `h-5 w-5`                                                                                                                                           |
| 안내    | `flex items-center gap-1` + `InfoCircleGray.svg` alt `정보 아이콘` `h-3.5 w-3.5` + `text-defaults-secondary-text-secondary pretendard-14Regular` → `방문예약 기간 설정은 최대 7일입니다` |

**필드명**: `useField('inOutParkingScheduledDate')` — 값은 `[Date, Date|null]` 튜플.

**표시**: `formatObjectDate(date, 'korean')?.slice(5)` → 앞 5자(연도) 제거
**기간**: `calculatePeriodDays(start, end)` — end 없으면 1일

## 달력 드로어 — `ReservationCarAddCalendarModal` (171줄)

**`@vuepic/vue-datepicker`** 사용 → 타깃에서는 **shadcn `calendar`(react-day-picker)**로 교체
(`decisions/tech-choices.md` 0-5).

```html
<VueDatePicker
  v-model="dates"
  inline
  range
  locale="ko"
  :enable-time-picker="false"
  auto-apply
  :min-date="new Date()"
  :max-date="afterSevenDays"
  format="yyyy-MM-dd"
  class="custom-date-picker"
  week-start="0"
  @range-start="onRangeStart"
  @range-end="onRangeEnd"
/>
```

| 설정         | 값                                |
| ------------ | --------------------------------- |
| `min-date`   | 오늘                              |
| `max-date`   | **오늘 + 6일** (`afterSevenDays`) |
| `week-start` | `"0"` = **일요일 시작**           |
| `locale`     | `ko`                              |
| 시간 선택    | 비활성                            |

**CSS 변수** (`<style scoped>`):

```css
.custom-date-picker {
  --dp-font-family: 'Pretendard', …;
  --dp-font-size: 15px;
  --dp-font-weight: 600;
  --dp-border-color: #f3f3f3;
}
.custom-date-picker :deep(.dp__input) {
  line-height: calc(var(--dp-font-size) * 1.8);
}
```

### 선택 로직

```js
onRangeStart(date):
  errorMessages = null;
  if (start && end) { start = date; end = null; }   // 둘 다 선택된 상태면 초기화
  else start = date;

onRangeEnd(date):
  errorMessages = null;
  if (start && date.getTime() === start.getTime()) return;   // 같은 날은 종료일로 안 잡음
  if (start && date < start) { end = start; start = date; }  // 역순이면 교환
  else end = date;
```

### 하단 표시

| 상태   | 렌더                                                                    |
| ------ | ----------------------------------------------------------------------- |
| 에러   | `<p class="text-red-500">날짜를 선택해주세요.</p>`                      |
| 선택됨 | `Calendar.svg` alt **`알림 아이콘`** `h-5 w-5` + `{start}~{end}({n}일)` |
| 미선택 | 빈 영역 (`flex h-4 …`로 높이만 유지)                                    |

**적용 버튼**: `<ButtonBase round-type="rounded" color="brand">적용하기</ButtonBase>`
→ 미선택이면 `날짜를 선택해주세요.` 표시, 아니면 `emit('apply', [start, end])`

> ⚠️ **`Calendar.svg`의 alt가 `알림 아이콘`이다.** 오타. → `deferred.md` 「오타·표기」
>
> ⚠️ **`dates` ref와 `startDate`/`endDate` ref가 이중으로 존재한다.**
> `v-model="dates"`는 컴포넌트 표시용, 실제 값은 `@range-start`/`@range-end`가 채우는
> 별도 ref다. `onMounted`에서 `dates`에 초기값을 넣는다. **동기화가 단방향이라 취약하다.**
> → 타깃에서는 react-day-picker의 `selected`/`onSelect` 단일 소스로 재작성한다.
> **동작(최대 7일·역순 교환·같은 날 무시)은 그대로 재현해야 한다.** → Phase 5 레시피

## PK13 재등록 초기값 🔴

```js
const { reservationCarDetail } = useGetReservationCarDetail() // 내부에서 getParams().uuid

watch(
  [reservationCarDetail, visitPurpose],
  ([detail, purposes]) => {
    if (detail && purposes) {
      const findVisitPurposeUuid = purposes?.find((p) => p.name === detail.visitPurpose).uuid
      setFieldValue('carNum', detail.carNum)
      setFieldValue('phone', formatPhone(detail.phone))
      setFieldValue('visitPurpose', { name: detail.visitPurpose, uuid: findVisitPurposeUuid })
      setFieldValue('memo', detail.memo)
      setFieldValue('parkingWallPadAlarm', detail.notificationFlag)
    }
  },
  { immediate: true },
)
```

> 🔴 **`.find(...).uuid`에 옵셔널 체이닝이 없다.** 기존 예약의 방문목적이 현재 목록에 없으면
> (관리사무소가 삭제) `.find()`가 `undefined`를 반환해 **TypeError로 화면이 깨진다.**
> → `deferred.md` 「동작 의심」. **이관 시 그대로**(등가) — 단 에러 바운더리로 잡히는지 확인.
> → `[확인 필요]` PK-Q10
>
> ⚠️ **`useGetReservationCarDetail()`을 인자 없이 호출한다.** 훅 내부가 `getParams().uuid`를
> 직접 읽고 `enabled: !!parkingUuid`로 판정한다. **PK12(`/add`)에서는 `uuid`가 없어 비활성**,
> PK13(`/add/:uuid`)에서만 조회된다. **경로만으로 등록/재등록이 갈리는 암묵적 설계.**
>
> ⚠️ **예약 기간은 채우지 않는다.** 재등록이라도 날짜는 새로 골라야 한다. **의도된 동작.**
>
> ⚠️ **`watch`가 `immediate`라 첫 실행 시 둘 다 `undefined`여서 통과한다.** 이후 도착 시 실행.

## 제출 — `usePostReservationCar`

**mutate 전 사전 검증** (훅이 감싼 `postReservationCarMutation`):

| 조건                                         | 모달 문구                              |
| -------------------------------------------- | -------------------------------------- |
| `startDate`가 `Date`가 아님                  | `기간을 선택해주세요.`                 |
| `startDate < 오늘`                           | `오늘 이후의 날짜만 선택 가능합니다.`  |
| `startDate > 오늘+6` 또는 `endDate > 오늘+6` | `방문예약 기간 설정은 최대 7일입니다.` |

**날짜 변환**:

```js
formatToDate(date) = 타임존 오프셋 보정 후 formatIsoStringDate(...).date()
// end 없거나 start === end  → in: `${start} 00:00:00`, out: `${start} 23:59:59`
// 그 외                      → in: `${start} 00:00:00`, out: `${end} 23:59:59`
```

> ⚠️ **`new Date(date.getTime() - offset).toISOString()`으로 로컬 날짜를 보정한다.**
> UTC 변환 시 날짜가 밀리는 것을 막는 장치. **이관 시 반드시 재현해야 한다** —
> 안 하면 자정 근처에서 하루 밀린다. → Phase 5 레시피

**API**: `postReservationCar` — `POST /parking/resident/reservation/{residentUuid}`
body `{ carNum, inParkingScheduledDate, outParkingScheduledDate, phone, visitPurposeUuid, memo, notificationFlag }`

**성공**: `invalidateQueries(['reservationCarList'])` (**v4**) + `navigateBack()` + 토스트 `예약되었습니다`

### 에러 분기

| `errorCode`                 | 문구                                                   |
| --------------------------- | ------------------------------------------------------ |
| `RESERVATION_DATE_INVALID`  | `방문예약 기간 설정은 최대 7일입니다.`                 |
| `RESERVATION_EXISTS`        | `해당 단지에 이미 방문예약된 차량입니다.`              |
| `ALWAYS_ALLOW_EXISTS`       | `해당 단지에 이미 등록된 항상허용 차량입니다.`         |
| `REGULAR_EXISTS`            | `해당 단지에 이미 등록된 정기권 차량입니다.`           |
| `BLACK_LIST_EXISTS`         | `블랙리스트로 등록된 차량입니다.`                      |
| `REJECT_EXISTS`             | `거절된 차량입니다.`                                   |
| `GUARD_NETWORK_ERROR`       | `단지 네트워크 장애입니다. 관리사무소에 문의해주세요.` |
| `RESERVATION_MILEAGE_LIMIT` | `마일리지가 모두 소진 되어 예약 할 수 없습니다.`       |
| 그 외                       | 서버 `message`                                         |

## QA 체크리스트

- [ ] PK12는 빈 폼, PK13은 차량번호·연락처·방문목적·메모·월패드가 채워짐
- [ ] PK13에서도 **예약 기간은 비어 있는가**
- [ ] 달력이 오늘~오늘+6일만 선택 가능
- [ ] 일요일 시작 주 배치
- [ ] 시작일과 같은 날을 종료일로 고르면 무시되는가
- [ ] 역순 선택 시 자동 교환되는가
- [ ] 기간 미선택 후 `적용하기` → `날짜를 선택해주세요.`
- [ ] **자정 직전에 예약해도 날짜가 밀리지 않는가** (타임존 보정)
- [ ] 마일리지 소진 단지에서 `마일리지가 모두 소진 되어 예약 할 수 없습니다.`
- [ ] 삭제된 방문목적이 걸린 예약을 재등록하면 화면이 깨지는가 (PK-Q10)

---

# PK14. 방문예약 상세 — `/parking/reservation/detail/:uuid`

`ReservationCar/ReservationCarDetailView.vue` (192줄) · **`showAppBar:false`**

## 화면 구성

```
┌─────────────────────────────┐
│ ←  방문예약 차량 상세   삭제 │  화면 내 <AppBar>
├─────────────────────────────┤
│ 차량번호          12가3456   │
│ 입출차 예약 기간  07/29~07/31│
│ 입차여부         [입차예정]  │
│ 연락처     010-1234-5678     │
│ 방문목적            택배     │
│ 메모              문앞에 …   │
│ 입출차 시 월패드 알림 여부  예│  hasWallPadUI일 때만
│                             │
│ [   방문예약 재신청하기   ]   │
└─────────────────────────────┘
```

| 요소      | 클래스 (원문)                                                               |
| --------- | --------------------------------------------------------------------------- |
| 루트      | `h-full w-full overflow-auto`                                               |
| 본문      | `mt-12 h-[calc(100%-50px)] w-full p-5` ← **AppBar 48px인데 50px을 뺀다**    |
| 목록      | `space-y-5`                                                                 |
| 항목      | `flex min-h-6 justify-between gap-5`                                        |
| 라벨      | `min-w-fit text-defaults-primary-text-primary pretendard-15SemiBold`        |
| 값        | `text-defaults-secondary-text-secondary pretendard-15Regular`               |
| 내용 래퍼 | `flex h-full w-full flex-col justify-between` (재신청 버튼을 하단에 밀어냄) |

**AppBar 우측**:

```html
<button type="button" :disabled="isDeleteReservedCarPending" class="flex justify-center">
  <SpinnerCircle v-if="isDeleteReservedCarPending" color="black" /><span v-else>삭제</span>
</button>
```

## 필드 렌더 (`RESERVATION_CAR_DETAIL_FIELD`)

| 키                          | 렌더                                                                                    |
| --------------------------- | --------------------------------------------------------------------------------------- |
| `carNum`                    | `formatHtmlText(...)                                                                    |     | '-'`                         |
| `inOutParkingScheduledDate` | `scheduledDate` computed (PK11의 `renderScheduledDate`와 동일 로직)                     |
| `inParkingFlag`             | `ChipBase` — `findInParkingStatus` + `getBadgeColorByInParkingStatus`                   |
| `phone`                     | `formatPhone(...)                                                                       |     | '-'`                         |
| `visitPurpose`              | `formatHtmlText(...)                                                                    |     | '-'`                         |
| `memo`                      | **`v-dompurify-html="formatHtmlText(...)                                                |     | '-'"`** ← 유일하게 HTML 렌더 |
| (추가) 월패드               | `hasWallPadUI`일 때 `입출차 시 월패드 알림 여부` / `notificationFlag ? '예' : '아니오'` |

> ⚠️ **`memo`만 `v-dompurify-html`이다.** 다른 필드는 텍스트 보간이라 `formatHtmlText`가 만든
> `<br/>`이 문자로 보인다. **메모만 줄바꿈이 살아난다.** → `deferred.md` 「동작 의심」
>
> ⚠️ **`scheduledDate` computed에 `?.`가 불완전하다** — `reservationCarDetail?.value.inParkingScheduledDate`.
> `.value`에는 옵셔널이 없다. 로딩 중에는 `v-else` 안이라 평가되지 않아 실제 문제는 없다.

## 삭제

`CAR_INFO_DELETE_MODAL_DATA` 모달(`button-type="outline"`) → `deleteReservedCarMutation(getParams().uuid)`

**API**: `deleteReservedCar` — `DELETE /parking/resident/reservation/{residentUuid}/{reservationUuid}`

**성공**: `invalidateQueries({ queryKey: ['reservationCarList'] })` ← **v5 객체 시그니처!**

- `navigateBack()` + 토스트 `예약이 취소되었습니다`

> ✅ **주차 도메인에서 유일하게 v5 객체 시그니처를 쓴다.** 나머지 8곳은 v4 위치인자다.
> 이관 시 나머지를 이 형태로 맞춘다.

### 삭제 에러 분기 🔴

| `errorCode`                        | 문구                                                   |
| ---------------------------------- | ------------------------------------------------------ |
| `VISIT_PURPOSE_NOT_FOUND`          | `방문목적을 다시 선택해주세요.`                        |
| **`RESERVATION_DATE_INVALID(`** 🔴 | `예약일자는 7일 이내로 선택가능합니다.`                |
| `RESERVATION_NOT_FOUND`            | `등록된 방문예약 차량이 아닙니다.`                     |
| `GUARD_NETWORK_ERROR`              | `단지 네트워크 장애입니다. 관리사무소에 문의해주세요.` |
| 그 외                              | 서버 `message`                                         |

> 🔴 **`case 'RESERVATION_DATE_INVALID('` — 뒤에 여는 괄호가 붙어 있다.**
> 서버 코드는 `RESERVATION_DATE_INVALID`이므로 **이 분기는 절대 매치되지 않는다.**
> 게다가 **삭제 요청에서 날짜 검증 에러가 날 이유가 없다** — 등록 훅의 에러 목록을 복사한 흔적이다.
>
> **이 오타는 서버·앱 계약이 아니라 프론트 내부 비교 문자열이다.** 고쳐도 서버와의 통신은 안 바뀐다.
> 다만 **고치면 사용자에게 보이는 메시지가 달라질 수 있다**(서버 원문 → 고정 문구).
> 실제로 이 코드가 삭제 응답에 올 가능성은 희박하다.
> → **결정 필요.** `[확인 필요]` PK-Q11

## QA 체크리스트

- [ ] AppBar 우측 `삭제`, 진행 중 검은 스피너
- [ ] 6개 필드 + 월패드 행(해당 단지)
- [ ] 메모의 줄바꿈이 **살아 있는가** (다른 필드는 `<br/>` 문자로 보임)
- [ ] 삭제 → 모달 → 뒤로가기 + 토스트 `예약이 취소되었습니다`
- [ ] 하단 `방문예약 재신청하기`가 브랜드색·2xl로 보이는가 (목록의 회색·lg와 다름)
- [ ] 재신청 → PK13

---

# PK15. 정기권 차량 — `/parking/regular-car`

`RegularCar/RegularCarListView.vue` (104줄) · **PK1에도 임베드된다**

## 이중 사용

```js
const isRegularPage = computed(() => getCurrentRoutePath().includes('/parking/regular-car'))
```

| 구분         | PK15 (라우트)                 | PK1 임베드                                                  |
| ------------ | ----------------------------- | ----------------------------------------------------------- |
| 루트 클래스  | `h-full`                      | `flex-1`                                                    |
| 제목         | 없음 (AppBar가 `정기권 차량`) | `정기권 차량 등록 현황` (`px-7 pt-7 pretendard-16SemiBold`) |
| `has-scroll` | `true`                        | **`false`** (PK1 전체가 스크롤)                             |

**공통 루트**: `w-full space-y-2 bg-defaults-primary-background-primary`

> ⚠️ **PK1 임베드 시 `has-scroll=false`라 `overflow-auto`가 빠진다.**
> 정기권이 많으면 PK1 페이지 전체가 길어진다. 무한스크롤 센티널도 페이지 끝에 있어
> **PK1에서 스크롤을 끝까지 내리면 다음 페이지가 로드된다.** 의도된 동작.

## 카드

| 요소      | 클래스 (원문)                                                                                                         |
| --------- | --------------------------------------------------------------------------------------------------------------------- |
| `<li>`    | `w-full rounded-xl bg-defaults-secondary-background-mono p-3` ← **테두리·그림자 없음**                                |
| 카드 버튼 | `flex w-full flex-col gap-3`                                                                                          |
| 상단      | `w-full space-y-1 border-b border-defaults-secondary-border-secondary pb-3`                                           |
| 월패드 칩 | `hasWallPadUI && notificationFlag` → `<ChipBase color="blue" variant="fill" class-name="pb-2">월패드 알림</ChipBase>` |
| 차량번호  | `text-left pretendard-16SemiBold` ← **다른 목록은 `18SemiBold`**                                                      |
| 정보 목록 | `flex w-full flex-col items-start gap-2.5`                                                                            |
| 라벨      | `whitespace-nowrap text-defaults-tertiary-text-tertiary pretendard-14Medium` ← **다른 목록은 `14SemiBold`**           |
| 값        | `text-defaults-secondary-text-secondary pretendard-14Regular`                                                         |

> ⚠️ **PK15 카드만 스타일 체계가 다르다** — `deep-glue-20` 테두리·`shadow-md`·`bg-base-b-white`가
> 없고 배경이 `secondary-background-mono`다. 차량번호와 라벨 폰트도 한 단계씩 작다.
> **의도적 구분으로 보인다**(클릭 불가 목록). 그대로 이관.
>
> ⚠️ **카드가 `<button>`인데 `@click`이 없다.** 눌러도 아무 일이 없다.
> `active:` 스타일도 없어 사용자는 알 수 없다. → `deferred.md` 「죽은 코드」

**필드**: `CARD_ITEM_FIELD.regular` = `name`(차주 이름) · `phone`(연락처)
`phone`은 `formatPhone`, 나머지 원본, `undefined`면 `-`.

## 월패드 판정

```js
const { hasWallPadUI } = useWallPadContent('regular')
```

> **`'regular'` 인자를 넘기는 유일한 호출부다** (§3-2).
> `'외부월패드(정기차량)'` 서비스만 가입한 단지에서도 정기권 목록에는 월패드 칩이 보인다.

## 데이터

**API**: `getRegularCarList` — `/parking/resident/{aptResidentUuid}/regular/household`
파라미터 `page` · `size`(=10). 진입 시 `removeQueries` (§3-4).

## QA 체크리스트

- [ ] PK15에서는 제목 없이 목록만, PK1에서는 `정기권 차량 등록 현황` 제목
- [ ] PK1 임베드 시 자체 스크롤이 없고 페이지 전체가 스크롤되는가
- [ ] PK1에서 끝까지 내리면 다음 페이지가 로드되는가
- [ ] 카드 스타일이 다른 목록과 다른가 (테두리·그림자 없음)
- [ ] `외부월패드(정기차량)`만 가입한 단지에서 **여기만** 월패드 칩이 보이는가
- [ ] 카드를 눌러도 아무 일이 없는가 (레거시와 동일)
- [ ] 0건 시 `등록된 정기차량이 없습니다`

---

# 이관 지침 요약

## 타깃 슬라이스 구조 (제안)

```
src/features/parking/
├── api/
│   ├── common.ts        # getVisitPurposeList · getParkingPolicy
│   ├── reservation.ts   # 예약 4개
│   ├── carManagement.ts # 항상허용 3 + 즐겨찾기 4
│   ├── inOut.ts         # 입출차 2
│   ├── regular.ts       # 정기권 1
│   ├── reject.ts        # postRejectCar (postRejectCarRelease 제외)
│   └── mileage.ts       # 마일리지 2
├── queries/
├── components/
│   ├── CardList.tsx                 # 도메인 공용 목록 셸
│   ├── BookmarkCarSelectorButton.tsx
│   ├── VisitPurposeSelect.tsx
│   ├── dashboard/  (ParkingMileage · ProgressBar · Policy · PolicyModal · Menus · MenuItem)
│   ├── mileage/    (MileageCard · MileageCardMenus)
│   ├── carManagement/ (CarManagementList · CarManagementForm)
│   ├── inOut/      (카드·상세 필드)
│   └── reservation/ (Calendar · CalendarModal · AgainButton)
├── pages/            # 15개 화면
├── hooks/
│   ├── useCarManagementType.ts
│   └── useWallPadContent.ts
├── constants/parking.ts
├── schemas/parking.ts
├── types/
└── index.ts
```

**`shared`로 올릴 것**: `formatMinutes` · `formatPhone` · `cleanPhoneHyphen` ·
`getCurrentMonthRange` · `calculatePeriodDays` · `formatTime` · `formatObjectDate` ·
`DrawerMonth` · `useInfiniteList` · `useInfiniteScrollPosition`

**`features/mypage/`로 옮길 것**: `usePutParkingRegularAlarmState` ·
`usePutParkingExternalAlarmState` · `usePatchParkingWallPadAlarmState` (§3-10)

**주차 전용으로 남길 것**: `findCarType` · `findInParkingStatus` ·
`getBadgeColorByInParkingStatus` · `formatDayFreeTime`

## 이관 순서 (도메인 내부) — 3개 PR

| PR  | 범위                                          | 선행 조건                                         |
| --- | --------------------------------------------- | ------------------------------------------------- |
| 1   | PK1 · PK2 · PK15 (대시보드·마일리지·정기권)   | Phase 4 (`CardList`·`DrawerMonth`·`SkeletonBase`) |
| 2   | PK3~~PK7 (차량관리) + PK8~~PK10 (입출차·거부) | PR 1 (`CardList` 확정)                            |
| 3   | PK11~PK14 (방문예약)                          | PR 2 + **shadcn `calendar` 확정**                 |

**PR 3이 가장 무겁다** — 달력 라이브러리 교체가 들어간다.

## 반드시 지켜야 할 것

| #   | 항목                                                                                              |
| --- | ------------------------------------------------------------------------------------------------- |
| 1   | `queryClient` 기본값을 레거시에 맞춘다 (`staleTime: 0`) — `useGetVisitPurpose` 키 결함(§3-6) 때문 |
| 2   | 쿼리 키 내용을 레거시 그대로 유지 (§3-6의 `aptUuid` 누락 포함). 형태만 v5로                       |
| 3   | `invalidateQueries` **8곳**을 객체 시그니처로. `useDeleteReservedCar`는 이미 v5                   |
| 4   | `removeQueries`를 렌더 중이 아니라 **마운트 1회**로 (§3-4). 호출 시점 결과는 동일하게             |
| 5   | `CardList`의 조건부 컴포저블 호출을 **훅 + `enabled` 플래그**로 (§3-3)                            |
| 6   | `history.state.forward` 기반 상세 복귀 감지를 react-router 방식으로 (§3-4, PK-Q2)                 |
| 7   | 예약 등록의 **타임존 오프셋 보정**을 그대로 (§PK12) — 안 하면 자정 근처에서 날짜가 밀린다         |
| 8   | 달력의 **최대 7일 · 역순 교환 · 같은 날 무시** 규칙 재현 (§PK12)                                  |
| 9   | `history.state` 의존 3곳(PK5~PK7 `carInfo` · PK10 `carNum` · PK8·PK11 월)을 `location.state`로    |
| 10  | 월 상태 보존이 **PK8·PK11에만 있고 PK2에는 없는** 비대칭 유지                                     |
| 11  | 폼 검증 에러를 **인라인 `TextError`로** 표시 (게시판은 모달 — 도메인 간 비대칭 유지)              |
| 12  | `phone` 왕복 규칙: 표시 `formatPhone` ↔ 전송 `cleanPhoneHyphen`                                   |
| 13  | 로딩 UX가 **스켈레톤**이다 (게시판의 `SpinnerDots` 오버레이와 다름)                               |
| 14  | 항상허용 **수정 기능을 만들지 않는다** (R-1)                                                      |
| 15  | `zod` 3→4: `required_error` 9 + `invalid_type_error` 3 → `error`                                  |

## 삭제할 것 (등가 영향 없음)

- `CarManagementEmptyText.vue` (미사용)
- `.more-icon` · `.car-image-section` (정의 없는 죽은 클래스)
- `isDeleted` ref (`CarManagementListView`)
- `carUuid` ref (`InOutCarHistoryDetailView` · `ReservationCarDetailView`) — `getParams().uuid` 직접 사용
- `hasWallPadAlarmUI` (`useWallPadContent`, 호출부 없음)
- 빈 `<span class="text-[#8f8f8f] …"></span>` (`RejectReasonView`)
- `ParkingMileageProgressBar`의 미선언 `isError` prop
- `CardList`에 넘기는 미선언 prop `is-drawer` · `card-type`
- `ParkingManagementMileage`의 중복 `totalMileage` 계산 (쿼리 `select`에 이미 있음)
- 미출차 관련 일체 (이관 제외 §0)

## 스타일 수정 (`broken-styles.md` 연동)

| 클래스                | 위치                                      | 조치                                         |
| --------------------- | ----------------------------------------- | -------------------------------------------- |
| `border-deep-glue-20` | PK2 · PK3 · PK4 · PK8 · PK11 카드 (4파일) | ⚠️ **현행 유지** — 대응 토큰 불명 (§5, B-Q2) |

`glue`가 `blue`의 오타로 보이지만 config에 `deep-blue`도 없다. **디자인 확인 전까지 회색 테두리 유지.**

---

# 확인 필요 항목

| #      | 질문                                                                                                   | 성격       | 진행 차단 |
| ------ | ------------------------------------------------------------------------------------------------------ | ---------- | --------- |
| PK-Q1  | `useWallPadContent`가 서비스명을 `.trim()` 없이 `===` 비교한다. 서버 값에 공백이 섞이는가 (§3-2)       | 서버 확인  | 아니오    |
| PK-Q2  | `history.state.forward` 기반 "상세 복귀 감지"를 react-router에서 어떻게 재현할지 (§3-4)                | **결정**   | 아니오    |
| PK-Q3  | `useGetParkingRemainingMileage`의 `comparedDate` 연/월 혼합 비교가 의도한 동작인가 (§3-5)              | 확인       | 아니오    |
| PK-Q4  | `findInParkingStatus`의 `new Date('YYYY-MM-DD HH:mm:ss')`가 실기기 웹뷰에서 파싱되는가 (§3-7)          | **실기기** | 아니오    |
| PK-Q5  | 마일리지 한도 제한 단지에서 PK4(항상허용) 라우트를 살려둘지 (§PK1) — 현재 도달 경로 없음               | **결정**   | 아니오    |
| PK-Q6  | PK2 `미출차` 칩에 `variant`가 없다. `ChipBase` 기본 variant가 무엇인가 (§PK2)                          | 확인       | 아니오    |
| PK-Q7  | `inParkingTime`·`outParkingTime` 서버 응답 형식 — 가공 없이 그대로 출력한다 (§PK2)                     | 서버 확인  | 아니오    |
| PK-Q8  | `VisitPurposeSelect`의 `inputValue.name`이 초기 렌더에서 터지지 않는 이유 (§PK5) — vee-validate 초기값 | 확인       | 아니오    |
| PK-Q9  | 예약 기간 `.slice(5)` 결과에 시각이 남는가 (§PK11) — 서버 응답 형식 확인                               | 서버 확인  | 아니오    |
| PK-Q10 | 삭제된 방문목적이 걸린 예약을 PK13에서 열면 TypeError로 깨진다. 에러 바운더리로 잡히는가 (§PK12)       | 확인       | 아니오    |
| PK-Q11 | `case 'RESERVATION_DATE_INVALID('` 오타를 고칠지 (§PK14) — 고치면 사용자 메시지가 달라진다             | **결정**   | 아니오    |

**진행을 막는 항목은 없다.**

---

# 도메인 QA 체크리스트 (통합)

## 네이티브 연동

- [ ] 푸시 딥링크 `/parking/inoutHistory/detail/{uuid}` 진입 (실기기)

## 크로스 도메인

- [ ] 메인 메뉴 → PK1 · 메인 카드 → PK2 · PK11
- [ ] 마이페이지 → PK1 · PK2 · PK15
- [ ] 마이페이지 알림 설정의 주차 알림 3종 (`mypage.md` P4 — 훅 위치만 이동)

## 등가 대조 (레거시 :3000 ↔ 신규 :5173, 392px)

- [ ] PK1 그라데이션 배경 (`from-primary-background-primary` → `to-secondary-background-mono`)
- [ ] 진행바 애니메이션 타이밍 (100ms 지연 + 1s transition)
- [ ] 방문예약 타일 흔들림 (300ms 지연 + 0.6s × 2회)
- [ ] 카드 4종의 테두리·그림자 차이 (PK15만 다름)
- [ ] 폼 2종의 간격 차이 (PK5~PK7 `gap-[11px]` vs PK12·PK13 `gap-3`)
- [ ] 스켈레톤 크기·개수 (`CardList` 10개 × 4행)
- [ ] 달력 드로어 렌더 (vue-datepicker → react-day-picker 교체 후)
- [ ] 폰트 배율 5단계

## 회귀 위험 지점

- [ ] `staleTime` 변경 시 `visitPurpose` 캐시가 단지 간 새는지 (**반드시 0 유지**)
- [ ] `removeQueries` 위치 변경 후 목록이 항상 page 0부터 시작하는지
- [ ] `CardList` 훅 구조 변경 후 스크롤 복원이 PK8·PK11에서만 동작하는지
- [ ] 예약 등록 시 자정 근처 날짜 밀림
- [ ] `invalidateQueries` v5 전환 후 등록·삭제가 목록에 즉시 반영되는지
