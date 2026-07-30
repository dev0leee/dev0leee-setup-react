# 도메인 명세 — 아파트몰 / 주말조식 예약 (aptMall)

> 기준 SHA `6d5bf22` · 레거시 `views/AptMallView/` 19개 파일 1,472 LOC
> 타깃 슬라이스 `features/aptMall/`
> API 8개 (`endpoints.md` #102~#109) · 쿼리 훅 8개 · Pinia 스토어 1개 · 라우트 **3개**

**라우트는 3개인데 화면은 11개다.** 예약 생성 전체가 라우트 없는 **바텀시트 5단계 위저드**로 들어있다
(`AptMallForm.vue`). 라우트 수만 보고 "작은 도메인"으로 판단하면 안 된다 — 예약 위저드가
이 도메인 LOC의 절반이고, 이관 난이도의 대부분이다.

**네이티브 브릿지 연동이 하나도 없다.** 24종 중 어느 것도 쓰지 않는다. Phase 4의 브릿지 재작성과
독립적으로 이관할 수 있는 몇 안 되는 도메인이다.

> ⚠️ **화면 ID는 `AM*`, 확인 항목은 `AM-Q*`를 쓴다.**
> `main.md`가 `M*`, `mypage.md`가 `MY*`를 점유했다.

---

## 화면 목록

### 라우트 (`router/AptMallIndex.js` — 3개)

| #   | 경로                                        | name                    | 컴포넌트                   | meta                                                                                   |
| --- | ------------------------------------------- | ----------------------- | -------------------------- | -------------------------------------------------------------------------------------- |
| AM1 | `/aptMall/list`                             | 아파트몰 리스트         | `AptMallListView`          | AppBar `아파트몰` · `hasBackButton` · **`appBarBackgroundColor: 'rgba(248,248,248)'`** |
| AM2 | `/aptMall/myOrder`                          | 아파트몰 나의 예약      | `AptMallMyOrderView`       | AppBar `주말조식 예약` · `hasBackButton` · `appBarBackgroundColor: '#f3f4f6'`          |
| AM3 | `/aptMall/myOrder/detail/:aptMallOrderUuid` | 아파트몰 나의 예약 상세 | `AptMallMyOrderDetailView` | AppBar `주말조식 예약 상세` · `hasBackButton`                                          |

**전 화면 `showBottomNav: false`, `showAppBar: true`, `backPath` 없음** (브라우저 히스토리 back).
**eager 라우트 없음** — 3개 전부 `() => import(...)`.

> ⚠️ **AM1의 `appBarBackgroundColor`가 `rgba(248,248,248)`이다** — `rgba()`에 인자가 3개다.
> CSS Color 4에서 `rgba(r,g,b)`는 `rgb(r,g,b)`의 별칭으로 허용되므로 최신 브라우저에서는
> `#f8f8f8`으로 렌더된다. **AM2는 같은 회색을 `#f3f4f6`(= `neutral-b-gray-100`)으로 쓴다.**
> 두 값이 다르고(248,248,248 = `#f8f8f8` vs `#f3f4f6`) 한쪽만 토큰이다. → `AM-Q1`
>
> 🔴 **AM1은 UI에서 도달할 수 없다.** 메인 메뉴는 `/aptMall/myOrder`로 직행하고(아래 「진입 경로」),
> AM1 자신도 어느 몰을 눌러도 `/aptMall/myOrder`로 보낸다. 딥링크·푸시 매핑에도 `/aptMall/list`가 없다.
> → `AM-Q2`

### 드로어 위저드 (라우트 없음 — `AptMallForm.vue`)

AM2의 `예약하기` 버튼이 `AptMallForm`을 `v-if`로 마운트한다. 내부는 `currentStep` ref로만
전환되는 5단계다. **URL이 바뀌지 않는다** — 뒤로가기를 누르면 위저드가 아니라 화면이 빠져나간다.

| #   | 단계 | `steps[].name` (드로어 제목) | 컴포넌트                    | 라인 |
| --- | ---- | ---------------------------- | --------------------------- | ---: |
| AM4 | 0    | `예약 유형 선택`             | `AptMallFormOrderType`      |   43 |
| AM5 | 1    | `일자 및 인원 선택`          | `AptMallFormOrderCalendar`  |   47 |
| AM6 | 2    | `메뉴 선택`                  | `AptMallFormOrderMenu`      |  225 |
| AM7 | 3    | `예약 정보가 맞으신가요?`    | `AptMallFormOrderConfirm`   |  190 |
| AM8 | 4    | `예약완료`                   | `AptMallFormOrderCompleted` |   49 |

AM5는 다시 3개 하위 화면으로 쪼개진다.

| #    | 영역        | 컴포넌트                              | 라인 | 조건               |
| ---- | ----------- | ------------------------------------- | ---: | ------------------ |
| AM9  | 달력        | `AptMallFormOrderCalendarDate`        |   83 | 항상               |
| AM10 | 인원 수     | `AptMallFormOrderCalendarPersonCount` |   44 | **`VISIT`일 때만** |
| AM11 | 시간대 선택 | `AptMallFormOrderCalendarTime`        |  114 | 항상               |

### 진입 경로

| 화면 | 진입 출처                                                                                  |
| ---- | ------------------------------------------------------------------------------------------ |
| AM2  | **메인 메뉴** — `MAIN_SWIPER_MENU_LIST`의 `contentName: '아파트몰'`, **표시명 `조식예약`** |
| AM3  | AM2 목록 아이템 클릭                                                                       |
| AM4  | AM2 하단 고정 `예약하기` 버튼                                                              |
| AM1  | **없음** (§ 위 `AM-Q2`)                                                                    |

> ⚠️ **메뉴 표시명과 AppBar 제목이 3중으로 다르다.**
>
> | 위치                       | 문구                   |
> | -------------------------- | ---------------------- |
> | 메인 메뉴 (`menuName`)     | **조식예약**           |
> | AM1 AppBar (`appBarTitle`) | **아파트몰**           |
> | AM2 AppBar (`appBarTitle`) | **주말조식 예약**      |
> | AM8 완료 문구              | **주말조식 예약 완료** |
>
> **전부 그대로 옮긴다.** 통일하지 않는다.

---

## 1. 도메인이 실질적으로 "주말조식" 전용이다

이름은 "아파트몰"이지만 코드 전체가 **`'주말조식'` 문자열 하나**에 묶여 있다.

```js
// useGetAptMallDetail.js — 목록을 받아 이름으로 몰을 찾는다
const aptMallMealUuid = firstResponse.data.success.find(
  (item) => item.aptMallName === '주말조식',
).aptMallUuid
```

```js
// constants/domain/aptMall.js — 아이콘 매핑도 1개뿐
export const APT_MALL_LIST = [{ aptMallName: '주말조식', icon: '/assets/icons/AptMallMeal.svg' }]
```

즉 **서버가 몰을 여러 개 주더라도 예약 위저드는 항상 `주말조식` 몰만 다룬다.**
`aptMallUuid`를 라우트 파라미터로 받지 않고 매번 목록에서 이름으로 되찾는 구조다.

🔴 **`.find(...)` 뒤에 옵셔널 체이닝이 없다.** 서버 응답에 `주말조식`이 없으면
`TypeError: Cannot read properties of undefined (reading 'aptMallUuid')`로
`queryFn`이 던진다 → 쿼리 error 상태 → **AM2/AM4가 스피너에서 멈춘다**(에러 UI 없음).
→ `AM-Q3`

> **네이밍 잔재**: 파일·API·스토어 곳곳에 `meal`이 남아 있다.
>
> | 위치                                  | 이름                                                        |
> | ------------------------------------- | ----------------------------------------------------------- |
> | `stores/aptMall.js`                   | `defineStore('mealForm', ...)` ← 스토어 **id가 `mealForm`** |
> | `useDeleteAptMallMyOrder.js`          | `const useDeleteMealMyOrder = () => {...}` ← 파일명과 다름  |
> | `api/aptMall.js` #105 · #106 파라미터 | `mealUuid` (라우트는 `aptMallOrderUuid`)                    |
>
> 앞의 둘은 **내부 식별자라 자유롭게 정리한다.**
> `mealUuid`는 **서버 경로 파라미터가 아니라 프론트 함수 인자명**이다 — 경로가
> `` `${...}/order/${mealUuid}` ``로 보간되므로 **이름은 서버에 나가지 않는다.**
>
> ⚠️ **`inventory-questions.md` E-Q6은 이것을 "서버 계약"으로 보고 유지로 확정했다.**
> 그 전제는 사실과 다르다(값만 나가고 이름은 나가지 않는다). 다만 **확정된 결정을 임의로
> 뒤집지 않는다** — 이름을 바꿔도 서버 요청은 한 글자도 달라지지 않는다는 사실만 기록하고,
> 정리 여부는 `AM-Q22`로 남긴다.

---

## 2. 하위 컴포넌트 전수 (19개)

| 파일                                      | 라인 | 역할                       | 부모                 |
| ----------------------------------------- | ---: | -------------------------- | -------------------- |
| `AptMallListView.vue`                     |   58 | AM1 몰 그리드              | 라우트               |
| `AptMallMyOrderView.vue`                  |   57 | AM2 셸 (목록 + 예약 버튼)  | 라우트               |
| `AptMallMyOrderList.vue`                  |   79 | 무한 목록 + 스크롤 복원    | `AptMallMyOrderView` |
| `AptMallMyOrderListItem.vue`              |  105 | 목록 카드                  | `AptMallMyOrderList` |
| `AptMallMyOrderDetailView.vue`            |   32 | AM3 셸                     | 라우트               |
| `AptMallMyOrderDetailTitle.vue`           |   37 | 상세 제목 + 상태 칩        | `...DetailView`      |
| `AptMallMyOrderDetailInfo.vue`            |   69 | 예약 정보 4필드            | 〃                   |
| `AptMallMyOrderDetailMenuList.vue`        |   42 | 결제금액 내역              | 〃                   |
| `AptMallMyOrderDetailCancel.vue`          |   40 | 취소 정보 (취소 건만)      | 〃                   |
| `AptMallMyOrderCancelButton.vue`          |   77 | 하단 고정 취소 버튼 + 모달 | 〃                   |
| `AptMallForm.vue`                         |   81 | 드로어 + 5단계 스테퍼      | `AptMallMyOrderView` |
| `AptMallFormOrderType.vue`                |   43 | AM4 유형 라디오            | `AptMallForm`        |
| `AptMallFormOrderCalendar.vue`            |   47 | AM5 셸                     | 〃                   |
| `AptMallFormOrderCalendarDate.vue`        |   83 | AM9 달력                   | `...OrderCalendar`   |
| `AptMallFormOrderCalendarPersonCount.vue` |   44 | AM10 인원 라디오           | 〃                   |
| `AptMallFormOrderCalendarTime.vue`        |  114 | AM11 시간대 버튼           | 〃                   |
| `AptMallFormOrderMenu.vue`                |  225 | AM6 메뉴 수량              | `AptMallForm`        |
| `AptMallFormOrderConfirm.vue`             |  190 | AM7 확인 + 제출            | 〃                   |
| `AptMallFormOrderCompleted.vue`           |   49 | AM8 완료                   | 〃                   |

### 사용하는 공용 컴포넌트

| 컴포넌트        | 사용처                                      | 비고                                       |
| --------------- | ------------------------------------------- | ------------------------------------------ |
| `ButtonBase`    | AM5·AM6·AM7·AM8·AM2·`CancelButton`          | AM2가 유일하게 **`size="2xl"`**을 쓴다     |
| `DrawerBase`    | `AptMallForm`                               | `isClose` · **`isButton: false`**          |
| `ModalButton`   | AM7 (`single`) · `CancelButton` (`outline`) |                                            |
| `ChipBase`      | `MyOrderListItem` · `MyOrderDetailTitle`    | `variant="fill"` · 색상 `blue`/`red`       |
| `SpinnerDots`   | AM1 · AM2 목록 · AM3 · `AptMallForm`        |                                            |
| `SpinnerCircle` | AM11 · `CancelButton`                       | `color="black"`                            |
| `TextEmpty`     | AM2 빈 상태                                 | `예약 내역이 없습니다`                     |
| `VueDatePicker` | AM9                                         | ⚠️ 대체 대상 — `decisions/tech-choices.md` |

### 쓰이는 공용 유틸

| 유틸                         | 사용처                              | 동작                                                 |
| ---------------------------- | ----------------------------------- | ---------------------------------------------------- |
| `formatIsoStringDate`        | 목록·상세·취소 버튼                 | `.dateTime()` → `YYYY-MM-DD HH:mm` (문자열 슬라이스) |
| `formatObjectDate`           | AM7·AM8·AM9 · `usePostAptMallOrder` | `Date` → `'hyphen'` = `YYYY-MM-DD`                   |
| `formatDay`                  | AM7·AM8                             | `SATURDAY` → `토요일`, 앞 1자만 잘라 `(토)`          |
| `formatHtmlText`             | `MyOrderListItem` 몰 이름           | `decodeUrl` + `\n` → `<br/>`, `v-dompurify-html`     |
| `validateQueryEnabledParams` | `useGetAptMallMyOrderDetail`        | `INVALID_VALUES` 미포함 여부                         |
| `useInfiniteScrollPosition`  | `AptMallMyOrderList`                | `moveFrom: '/detail'` · `moveTo: '/aptMall/myOrder'` |
| `useInfiniteList`            | `useGetAptMallMyOrderList`          | 공용 무한목록 팩토리                                 |

---

## 3. 상수 전문 — `constants/domain/aptMall.js` (39줄)

```js
export const STATUS_LIST = [
  { status: 'RESERVATION', label: '예약완료', color: 'blue' },
  { status: 'CANCELED', label: '취소', color: 'red' },
]

export const MEAL_TYPE = {
  VISIT: '방문식사',
  TAKEOUT: '포장',
  DELIVERY: '배달',
}

export const LIST_ITEM_FIELD = [
  { key: 'aptMallOrderType', label: '예약유형' },
  { key: 'orderDateTime', label: '이용예정 일자' },
  { key: 'personCount', label: '인원 수' },
]

export const DETAIL_PAGE_INFO_FIELD = [
  { key: 'aptMallOrderType', label: '예약유형' },
  { key: 'orderDateTime', label: '이용예정 일자' },
  { key: 'personCount', label: '인원 수' },
  { key: 'orderNote', label: '고객 요청사항' },
]

export const DETAIL_CANCEL_MODAL_DATA = {
  title: '예약취소',
  description: '취소하시겠습니까?',
  firstButton: '닫기',
  secondButton: '취소',
}

export const TYPE_DATA = [
  { label: '방문식사', icon: '/assets/icons/Meal.svg', key: 'VISIT' },
  { label: '포장', icon: '/assets/icons/TakeOut.svg', key: 'TAKEOUT' },
]

export const APT_MALL_LIST = [{ aptMallName: '주말조식', icon: '/assets/icons/AptMallMeal.svg' }]
```

### 상수에서 읽히는 것

| 관찰                                                                                                                                         | 조치                             |
| -------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| `MEAL_TYPE`에 **`DELIVERY`(배달)가 있으나 `TYPE_DATA`에는 없다** — 선택은 불가하고 표시만 가능하다. 서버가 `DELIVERY` 주문을 줄 수 있다는 뜻 | **둘 다 그대로 이관.** → `AM-Q4` |
| `STATUS_LIST`가 2종뿐 — `RESERVATION`·`CANCELED`. 그 밖의 상태가 오면 칩이 빈칸이 된다                                                       | 등가 이관. → `AM-Q5`             |
| `LIST_ITEM_FIELD`는 AM7에서 `personCount`를 걸러내지만 **`MyOrderListItem`은 걸러내지 않는다** (§7-6)                                        | 등가 이관                        |
| `DETAIL_CANCEL_MODAL_DATA`의 버튼이 `닫기`(1) / `취소`(2) — **취소가 두 번째(빨강)** 이다                                                    | 순서 유지                        |
| `TYPE_DATA`·`APT_MALL_LIST`의 아이콘은 `public/assets/icons/` 정적 경로                                                                      | 파일 그대로 복사                 |

---

## 4. Pinia 스토어 — `useAptMallFormStore` (31줄 전문)

```js
export const useAptMallFormStore = defineStore('mealForm', () => {
  const aptMallFormData = ref(undefined)
  const menuInitialized = ref(false) // 메뉴 초기화 상태 추가

  const setAptMallFormData = (newValue) => {
    const newData = { ...aptMallFormData.value, ...newValue }

    // menu 데이터가 변경되면 totalPrice도 자동으로 업데이트
    if (newValue.menu) {
      newData.totalPrice = newData.menu.reduce((sum, item) => {
        return sum + (item.price || 0) * item.count
      }, 0)
    }

    aptMallFormData.value = newData
  }
  const resetAptMallFormData = () => {
    menuInitialized.value = false
    aptMallFormData.value = undefined
  }

  return { aptMallFormData, menuInitialized, setAptMallFormData, resetAptMallFormData }
})
```

### 저장되는 필드 (단계별 누적)

| 필드           | 형태                                                                     | 쓰는 단계 | 읽는 곳                                  |
| -------------- | ------------------------------------------------------------------------ | --------- | ---------------------------------------- |
| `selectedType` | `TYPE_DATA` 원소 (`{label, icon, key}`)                                  | AM4       | AM5·AM6·AM7·AM11 · `usePostAptMallOrder` |
| `date`         | **`Date` 객체**                                                          | AM9       | AM7·AM8·AM11 · `usePostAptMallOrder`     |
| `personCount`  | ⚠️ **`Ref<number>`** (아래)                                              | AM10      | AM6·AM7·AM11 · `usePostAptMallOrder`     |
| `time`         | 시간 응답 원소 (`aptMallOrderTimeUuid` 등)                               | AM11      | AM7·AM8 · `usePostAptMallOrder`          |
| `menu`         | `[{name, uuid, price, orderMenuCountEqualsOrderPersonCountFlag, count}]` | AM6       | AM6·AM7 · `usePostAptMallOrder`          |
| `totalPrice`   | number (`menu` 세팅 시 자동 계산)                                        | (파생)    | AM6·AM7                                  |

`orderNote`는 **스토어에 넣지 않는다** — AM7의 로컬 `ref`로 두고 mutate 인자로 넘긴다.

### 🔴 4-1. `personCount`에 값이 아니라 `Ref`가 들어간다

```js
// AptMallFormOrderCalendarPersonCount.vue
const selectedPersonCount = ref(1)

const handlePersonCountRadio = () => {
  setAptMallFormData({ personCount: selectedPersonCount }) // ← .value 가 없다
}
onMounted(() => {
  setAptMallFormData({ personCount: selectedPersonCount }) // ← 여기도
})
```

Vue에서 `ref(object)`는 내부를 `reactive`로 감싸고, **reactive 객체는 프로퍼티 접근 시 ref를 자동
언랩한다.** 그래서 `store.aptMallFormData.personCount`를 읽으면 숫자가 나오고 화면은 정상 동작한다.

**그러나 부작용이 두 개 있다.**

1. **살아있는 링크가 된다.** 라디오를 바꾸면 `setAptMallFormData`를 다시 부르지 않아도
   스토어 값이 따라 바뀐다. AM11의 잔여석 판정이 이 동작에 **의존**한다.
2. `usePostAptMallOrder`가 `aptMallFormData.personCount`를 읽는 경로도 reactive 프록시를 지나므로
   결과적으로 숫자가 전송된다. **운 좋게** 맞는다.

**React에는 이 자동 언랩이 없다.** 그대로 옮기면 안 되고, **숫자를 저장하고 시간대 판정이
현재 인원 수를 읽도록** 배선해야 한다. 화면 동작(인원 바꾸면 잔여석 판정이 즉시 갱신)이
등가의 기준이다. → 「반드시 지켜야 할 것」

### 🔴 4-2. 스토어를 구조분해해서 반응성을 잃는 곳이 3개다

```js
const { aptMallFormData } = useAptMallFormStore() // ← 값 스냅샷
```

| 파일                        | 영향                                                               |
| --------------------------- | ------------------------------------------------------------------ |
| `AptMallFormOrderCalendar`  | `aptMallFormData?.selectedType.key === 'VISIT'`로 AM10 표시를 결정 |
| `AptMallFormOrderConfirm`   | 필드·메뉴·총액 렌더 전부                                           |
| `AptMallFormOrderCompleted` | 완료 문구의 날짜·시간                                              |
| `usePostAptMallOrder`       | 제출 페이로드 전부                                                 |

`setAptMallFormData`는 **매번 새 객체를 만들어 교체**하므로, 구조분해로 잡아둔 참조는
그 이후의 변경을 보지 못한다.

**지금 안 깨지는 이유**: 각 컴포넌트가 마운트되는 시점(= 해당 단계 도달)에는 필요한 값이
이미 다 채워져 있고, 그 단계에서 스토어를 더 쓰지 않는다. AM5는 유형 선택 직후에 마운트되므로
`selectedType`이 이미 있다.

**즉 단계 순서가 우연히 맞아떨어져서 동작하는 코드다.** 타깃에서는 스토어를 구독해서 읽는다
(화면 결과는 동일하다).

### 4-3. 드로어를 닫지 않고 화면을 벗어나면 상태가 남는다

`resetAptMallFormData`는 **`AptMallForm`의 `closeDrawer`에서만** 호출된다
(드로어 X 버튼 · 배경 클릭 · AM5 `닫기` · AM8 `확인`).

라우트 이동(안드로이드 하드웨어 back 등)으로 벗어나면 리셋되지 않는다.
다시 AM2에 들어와 `예약하기`를 누르면 `currentStep`은 0으로 시작하지만
스토어에는 **이전 `menu`·`time`·`date`가 남아 있고 `menuInitialized`가 `true`** 다.
→ AM6의 초기화 `watch`가 `return`으로 빠져 **이전 수량이 그대로 보인다.**

🔴 실제 결함이다. → `AM-Q6`

---

## 5. 쿼리 훅 전수 (8개)

| 훅                                   | API             | 쿼리 키                                                | `enabled`                                      |
| ------------------------------------ | --------------- | ------------------------------------------------------ | ---------------------------------------------- |
| `useGetAptMallList`                  | #102            | `['aptMallList']`                                      | `hasAptMall`                                   |
| `useGetAptMallDetail`                | #102 **+** #103 | `['aptMallDetail']`                                    | `hasAptMall`                                   |
| `useGetAptMallMyOrderList`           | #104            | `['aptMallMyOrderList', aptResidentUuid, ...params]`   | ⚠️ **무시됨** (§7-1)                           |
| `useGetAptMallMyOrderDetail`         | #105            | `['aptMallMyOrderDetail', aptMallOrderUuid]`           | `validateQueryEnabledParams(aptMallOrderUuid)` |
| `useDeleteAptMallMyOrder`            | #106            | (mutation)                                             | —                                              |
| `useGetAptMallOrderCalendarTimeList` | #107            | `['aptMallOrderCalendarTimeList', formattedOrderDate]` | `!!aptMallUuid && !!formattedOrderDate`        |
| `useGetAptMallOrderMenuList`         | #108            | `['aptMallOrderMenuList', aptMallUuid]`                | `!!aptMallUuid`                                |
| `usePostAptMallOrder`                | #109            | (mutation)                                             | —                                              |

### 5-1. 콘텐츠 게이트 — `hasAptMall`

세 훅이 **같은 식을 각자 복제**한다.

```js
const hasAptMall = authStore
  .getAptInfo()
  .contentList.some((item) => item.name.trim() === '아파트몰')
```

> ⚠️ **이관 제외 확정된 `hasAptShoppingContent` 계열 4개 플래그와는 다른 메커니즘이다.**
> 이쪽은 `aptInfo.contentList`를 **이름 문자열로 조회**한다. 메인 메뉴 노출 조건
> (`MAIN_SWIPER_MENU_LIST`의 `contentName`)과 같은 체계이므로 **이관 대상이다.**
>
> `.trim()`이 붙어 있다 — **서버 데이터에 앞뒤 공백이 섞여 들어온다는 뜻**이다. 유지한다.
>
> 🔴 **`getAptInfo()` 뒤에 `?.`가 없다.** 같은 파일 안에서 `getAptInfo()?.aptResidentUuid`는
> 옵셔널인데 `getAptInfo().contentList`는 아니다. `aptInfo`가 비어 있으면 **훅 호출 시점에 즉시 throw**
> → 화면 전체가 에러 바운더리로 떨어진다. → `AM-Q7`

### 5-2. `useGetAptMallDetail`은 한 번에 두 번 호출한다

```js
queryFn: async () => {
  const firstResponse = await getAptMallList({ aptResidentUuid }) // #102
  const aptMallMealUuid = firstResponse.data.success.find(
    (item) => item.aptMallName === '주말조식',
  ).aptMallUuid
  const secondResponse = await getAptMallDetail({ aptResidentUuid, aptMallUuid: aptMallMealUuid }) // #103
  return secondResponse
}
```

- 키가 `['aptMallDetail']`뿐이라 **단지를 바꿔도 캐시가 갈리지 않는다.** `aptResidentUuid`가 키에 없다.
  🔴 단지 전환 시 이전 단지의 상세가 보일 수 있다. → `AM-Q8`
- `useGetAptMallList`(`['aptMallList']`)도 같은 문제다.
- 이 훅은 **세 곳에서 각자 호출**된다 — `AptMallForm` · `AptMallFormOrderCalendarDate` ·
  `AptMallFormOrderCalendarTime` · `usePostAptMallOrder`. 키가 같아 캐시를 공유하므로 요청은 1회다.

**응답에서 쓰는 필드**

| 필드                       | 쓰는 곳       | 용도                                               |
| -------------------------- | ------------- | -------------------------------------------------- |
| `aptMallUuid`              | AM6·AM11·제출 | 메뉴/시간 조회 및 제출 경로                        |
| `reservationLimitDays`     | AM9           | 달력 `max-date` · 첫 선택일 탐색 범위              |
| `operatingDayList`         | AM9           | 운영 요일 (`['SATURDAY', ...]`) → 비활성 요일 산출 |
| `orderTimeLimitPersonFlag` | AM11          | `잔여 N석` 표시 여부                               |

### 5-3. `useGetAptMallOrderCalendarTimeList`

```js
enabled: computed(() => !!aptMallDetail.value.aptMallUuid && !!formattedOrderDate.value),
```

🔴 **`aptMallDetail.value`에 `?.`가 없다.** 상세가 아직 없으면 `enabled` computed가 throw한다.
정상 경로에서는 `AptMallForm`이 `isAptMallDetailLoading` 동안 스피너를 띄워 가려주지만,
**`hasAptMall`이 `false`면 쿼리가 disabled → `isLoading`이 `false` → 자식이 렌더 → 크래시**다.
→ `AM-Q7`과 같은 뿌리

`setDate(value)`는 `formatObjectDate(value, 'hyphen')`으로 `YYYY-MM-DD`를 만들어
쿼리 키에 넣는다. **날짜 문자열이 바뀔 때만 재조회**된다.

### 5-4. mutation 2개의 캐시 무효화

```js
// useDeleteAptMallMyOrder
onSuccess: () => {
  queryClient.invalidateQueries(['aptMallMyOrderDetail'])
}

// usePostAptMallOrder
onSuccess: () => {
  queryClient.invalidateQueries(['aptMallMyOrderList'])
}
```

🔴 **둘 다 v4 위치인자다 — v5에서 조용히 no-op** (`query-keys.md` 28곳 중 2곳).
`{ queryKey: [...] }`로 바꾼다. 안 바꾸면:

| 케이스    | 증상                                                              |
| --------- | ----------------------------------------------------------------- |
| 예약 취소 | AM3의 상태 칩·하단 버튼이 `예약완료` / `취소하기`에 그대로 머문다 |
| 예약 생성 | AM2 목록에 새 예약이 안 보인다                                    |

⚠️ **취소는 목록을 무효화하지 않는다** (`aptMallMyOrderList` 누락). v4에서도 그렇다.
`staleTime: 0`이라 AM2로 돌아가면 재조회되므로 눈에 안 띈다. **키를 고칠 때도 목록은 추가하지 않는다** —
등가 이관이다. → `AM-Q9`

### 5-5. `useDeleteAptMallMyOrder`의 이중 uuid 경로

```js
mutationFn: (mealUuid) =>
  deleteAptMallMyOrder({ ..., mealUuid: mealUuid || getParams()?.mealUuid }),
```

`getParams()?.mealUuid`는 **항상 `undefined`** 다 — 라우트 파라미터 이름이 `:aptMallOrderUuid`이기
때문이다. 호출부(`AptMallMyOrderCancelButton`)가 항상 인자를 넘기므로 폴백은 죽은 코드다.
→ 타깃에서는 인자만 받는다.

에러 처리는 `switch (errorCode) { default: swalErrorModal({ text: message }) }` —
분기 없이 서버 메시지를 모달로 띄운다.

---

## 6. AM1 `AptMallListView` (58줄)

### 표시

| 영역      | 마크업                                                                          |
| --------- | ------------------------------------------------------------------------------- |
| 컨테이너  | `flex h-full flex-col overflow-auto bg-defaults-secondary-background-secondary` |
| 내부      | `h-full pt-12` ← **AppBar가 이미 있는데 추가 상단 여백 48px**                   |
| 그리드    | `grid grid-cols-2 gap-4 px-5 py-6`                                              |
| 카드      | `<li>` `rounded-lg border border-defaults-tertiary-border-tertiary`             |
| 버튼      | `flex h-[168px] w-full flex-col items-center justify-center gap-2.5 p-4`        |
| 아이콘 원 | `flex h-14 w-14 items-center justify-center rounded-full bg-blue-s-info-50`     |
| 라벨      | `text-center pretendard-16Medium`                                               |

### 아이콘 매핑

```js
:src="APT_MALL_LIST.find((item) => item.aptMallName === mall.aptMallName)?.icon"
:alt="`${APT_MALL_LIST.find((item) => item.aptMallName === mall.aptMallName)?.aptMallName} 아이콘`"
```

- `주말조식` 외의 몰이 오면 `src`가 `undefined` → **깨진 이미지**, `alt`는 `undefined 아이콘`.
- `alt`가 `mall.aptMallName`이 아니라 **상수 쪽 이름**을 참조한다. 찾지 못하면 이름이 사라진다.
- 같은 `.find()`를 두 번 실행한다.

**전부 등가 이관.** (AM1 자체가 도달 불가이므로 우선순위는 낮다 — `AM-Q2`)

### 동작

| 액션      | 결과                                                |
| --------- | --------------------------------------------------- |
| 카드 클릭 | `navigateTo('/aptMall/myOrder')` — **몰 무관 고정** |
| 로딩      | `SpinnerDots` (그리드 대신)                         |
| 빈 목록   | 빈 `<ul>` — **빈 상태 문구 없음**                   |

---

## 7. 도메인 전역 결함 (13건)

전부 `deferred.md`가 아니라 **여기서 결정해야 하는 것**만 모았다.
(순수 개선 아이디어는 `deferred.md`로 보냈다.)

| #   | 결함                                                                                                                   | 파일                           | 심각도      |
| --- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------ | ----------- |
| 1   | **`useInfiniteList`에 `enable` 옵션이 없다** — `useGetAptMallMyOrderList`가 넘기는 `enable: hasAptMall`이 **무시**된다 | `useGetAptMallMyOrderList`     | 🔴          |
| 2   | `setAdditionalParams`(`orderStatus` 필터)가 **아무도 호출하지 않는 죽은 코드**                                         | 〃                             | 정리        |
| 3   | 목록 `:key="item?.uuid"` — 아이템에 `uuid` 필드가 없다(`aptMallOrderUuid`) → **전 항목 key `undefined`**               | `AptMallMyOrderList`           | 🔴          |
| 4   | `onReservationClick` prop을 부모가 넘기는데 **자식이 선언하지 않았다** → 죽은 prop                                     | 〃 / `AptMallMyOrderView`      | 정리        |
| 5   | `// 투표상태` 주석 — Vote에서 복붙한 잔재                                                                              | `AptMallMyOrderListItem`       | 정리        |
| 6   | 목록 카드는 `TAKEOUT`에도 `인원 수` 행을 보여준다 (AM7은 걸러냄) → `-` 표시                                            | 〃                             | 등가        |
| 7   | `default: () => {}` — 화살표 블록이라 **`undefined`를 반환**하는 잘못된 기본값 (4개 파일)                              | Detail 4종                     | 무해        |
| 8   | `findStatus.status` — `?.` 없음. 알 수 없는 상태값이면 **크래시**                                                      | `AptMallMyOrderDetailCancel`   | 🔴          |
| 9   | 상세 총액이 `item.price`만 더한다 — **`* item.count`가 없다** (AM7은 곱한다)                                           | `AptMallMyOrderDetailMenuList` | ⚠️ `AM-Q10` |
| 10  | `info.aptMallOrderMenuList.reduce` — `?.` 없음                                                                         | 〃                             | 중          |
| 11  | 잔여석 계산이 **문자열 산술**이다 — `"1,000" - 1 → NaN` (§9-3)                                                         | `AptMallFormOrderCalendarTime` | 🔴          |
| 12  | `watch(aptMallFormStore, ...)`가 **스토어 전체**를 감시 → 메뉴·시간 변경에도 날짜 재계산                               | 〃                             | 중          |
| 13  | 제출 실패 시 `mutateAsync`가 던지고 **아무도 잡지 않는다** → unhandled rejection (모달은 별도 `watch`가 띄운다)        | `AptMallFormOrderConfirm`      | 🔴          |

> **스타일 결함은 없다.** `broken-styles.md`의 26개 중 AptMall 파일에 걸리는 것이 **0건**이다.
> 821개 토큰 전수 빌드에서 이 도메인은 전부 유효한 클래스만 쓴다.

---

## AM2 — 나의 예약 (`AptMallMyOrderView` 57줄 + `AptMallMyOrderList` 79줄)

### 레이아웃

```
┌────────────────────────────┐
│ AppBar  주말조식 예약  (bg #f3f4f6)
├────────────────────────────┤
│ 총 3건                      ← list.pageable.totalElements
│ ┌────────────────────────┐ │
│ │ 주말조식 [예약완료]  12,000원 ›│ │
│ │ ─────────────────────  │ │
│ │ 예약유형      방문식사  │ │
│ │ 이용예정 일자  2026-08-01 08:00 │
│ │ 인원 수        2명      │ │
│ └────────────────────────┘ │
│ ... (무한 스크롤)          │
├────────────────────────────┤
│      예약하기               ← fixed bottom, size 2xl, square
└────────────────────────────┘
```

| 영역      | 클래스                                                                                      |
| --------- | ------------------------------------------------------------------------------------------- |
| 셸        | `relative flex h-full flex-col bg-defaults-secondary-background-secondary`                  |
| 총 건수   | `space-y-4 px-5 py-2 text-defaults-primary-text-primary pretendard-16SemiBold`              |
| 목록      | `flex w-full flex-1 flex-col items-start gap-3 overflow-auto px-5 py-6 pb-10`               |
| 관측 타깃 | `<div ref="target" class="w-full pt-4">` — `<ul>` 안의 `<div>`                              |
| 하단 버튼 | `fixed bottom-0 left-0 right-0` + `ButtonBase color="brand" round-type="square" size="2xl"` |

⚠️ **`예약하기` 버튼이 `fixed`이고 목록 여백은 `pb-10`(40px)뿐이다.** 버튼 높이는
`2xl`(`py-4` + `pretendard-18Medium`) ≈ 60px이라 **마지막 카드가 가려진다.**
등가 이관 → 그대로 옮긴다. 개선은 `deferred.md`.

### 상태별 표시

| 상태     | 표시                                                                           |
| -------- | ------------------------------------------------------------------------------ |
| 로딩     | `SpinnerDots`                                                                  |
| 데이터 O | `총 N건` + 카드 목록 + 관측 타깃                                               |
| 빈 목록  | `flex flex-1 items-center justify-center` + `TextEmpty` `예약 내역이 없습니다` |
| 에러     | **없음** — `isListError`를 쓰지 않는다. 빈 상태로 보인다                       |

빈 상태 판정은 `list?.pages?.length > 0`이다 (`useInfiniteList`의 `select`가 평탄화한 배열).

### 무한 스크롤

```js
useIntersectionObserver(target, ([{ isIntersecting }]) => {
  targetIsVisible.value = isIntersecting
})
watchEffect(() => {
  if (props.hasNextPage && targetIsVisible.value) props.fetchNextPage()
})
```

- 페이지 크기 **10** (`useInfiniteList` 하드코딩)
- `getNextPageParam`: `!last && pages.length < totalPages` → `number + 1`

### 스크롤 위치 복원

```js
useInfiniteScrollPosition({ moveFrom: '/detail', moveTo: '/aptMall/myOrder' })
```

⚠️ 세션스토리지 키가 **전 도메인 공용 `'scrollRestoration'` 하나**다 (`recipe.md`에서 정리 예정).

### 카드 (`AptMallMyOrderListItem` 105줄)

| 영역        | 값                                                                                                                            |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------- |
| 몰 이름     | `v-dompurify-html="formatHtmlText(info?.aptMallName \|\| '-')"` · `pretendard-15SemiBold`                                     |
| 상태 칩     | `ChipBase :color="statusInfo?.color" variant="fill"` → `{{ statusInfo?.label }}`                                              |
| 금액        | `Number(info?.orderPrice).toLocaleString()`원 · `pretendard-15SemiBold`                                                       |
| 화살표      | `/assets/icons/ArrowRight.svg` `h-5 w-5` `aria-hidden`                                                                        |
| 필드 3행    | `LIST_ITEM_FIELD` 전수 · 라벨 `pretendard-13Medium` / 값 `pretendard-13Regular`, 둘 다 `text-defaults-tertiary-text-tertiary` |
| 카드        | `rounded-lg border border-defaults-tertiary-border-tertiary bg-base-b-white px-3 py-4`                                        |
| 상단 구분선 | `border-b border-b-defaults-tertiary-border-tertiary pb-3`                                                                    |

**`renderFieldValue` 전문 (등가 이관 대상)**

```js
if (value === undefined) return '-'
if (value[field.key] === undefined) return '-'
if (field.key === 'aptMallOrderType') return MEAL_TYPE[value[field.key]]
if (field.key === 'orderDateTime') return formatIsoStringDate(value[field.key]).dateTime()
if (field.key === 'personCount') return `${value[field.key]}명`
return `${value[field.key]}` || '-'
```

- `statusInfo`가 없으면 **칩이 빈 상태로 렌더된다** (배경도 없음 — `convertChipColors`가 `props.color`
  즉 `undefined`를 반환). Vote/Survey와 달리 **여기는 `?.`가 둘 다 붙어 있어 크래시하지 않는다.**
- 값 텍스트는 `overflow-hidden text-ellipsis whitespace-nowrap`

### 클릭

```js
navigateTo(`/aptMall/myOrder/detail/${item.aptMallOrderUuid}`)
```

`@click`은 `AptMallMyOrderListItem`의 루트 `<li>`로 폴스루된다.

### QA 체크리스트 (AM2)

- [ ] 예약 0건 → `예약 내역이 없습니다`
- [ ] 예약 11건 → 스크롤 시 2페이지 자동 로드, `총 11건` 유지
- [ ] `RESERVATION` 카드 → 파랑 `예약완료` 칩 / `CANCELED` → 빨강 `취소`
- [ ] `TAKEOUT` 예약 카드에 `인원 수  -` 행이 보인다 (§7-6, 의도된 등가)
- [ ] 카드 → 상세 → 뒤로 → **스크롤 위치 복원**
- [ ] `예약하기` 버튼이 마지막 카드를 가린다 (레거시와 동일하게)

---

## AM3 — 예약 상세 (`AptMallMyOrderDetailView` 32줄)

### 조립

```
AptMallMyOrderDetailTitle      ← 몰 이름 · 등록일시 · 상태 칩
<section>
  AptMallMyOrderDetailInfo     ← 예약 정보 4필드
  AptMallMyOrderDetailMenuList ← 결제금액
  AptMallMyOrderDetailCancel   ← 취소일시·취소사유 (CANCELED만)
</section>
AptMallMyOrderCancelButton     ← fixed bottom
```

- 셸: `h-full space-y-3 overflow-auto pb-20`
- 하단 고정: `fixed bottom-0 left-0 right-0 z-[200] bg-defaults-primary-background-primary p-5`
- 로딩 중에는 `SpinnerDots`만 (버튼도 안 보인다)

### 제목 (`AptMallMyOrderDetailTitle` 37줄)

| 요소     | 값                                                                                                                            |
| -------- | ----------------------------------------------------------------------------------------------------------------------------- |
| 섹션     | `flex justify-between border-b-8 border-defaults-secondary-background-secondary bg-base-b-white p-5`                          |
| `<h2>`   | `info.aptMallName` · `pretendard-18SemiBold`                                                                                  |
| 등록일시 | `{{ formatIsoStringDate(info.createdDate).dateTime() }} 등록` · `text-defaults-secondary-text-secondary pretendard-14Regular` |
| 칩       | `ChipBase :color="findStatus?.color" variant="fill" class="h-fit"`                                                            |

### 예약 정보 (`AptMallMyOrderDetailInfo` 69줄)

`DETAIL_PAGE_INFO_FIELD` 4개(`예약유형`·`이용예정 일자`·`인원 수`·`고객 요청사항`) 전수 렌더.

| 요소     | 클래스                                                    |
| -------- | --------------------------------------------------------- |
| 컨테이너 | `border-b bg-base-b-white p-5`                            |
| `<h3>`   | `pb-6 pretendard-17SemiBold` → `예약 정보`                |
| 라벨     | `flex h-5 items-center pretendard-15Medium`               |
| 값       | `text-defaults-primary-text-primary pretendard-14Regular` |

⚠️ **`orderNote`만 `v-dompurify-html`로 렌더한다.** 나머지는 텍스트 보간이다.
`renderFieldValue`가 반환하는 값을 그대로 HTML로 넣으므로, 값이 없으면 `-`가 HTML로 들어간다.
`formatHtmlText`를 통과하지 않으니 **줄바꿈은 `<br>`로 바뀌지 않는다** — 개행이 사라진다.
→ `AM-Q11`

⚠️ `renderFieldValue`가 `AptMallMyOrderListItem`판과 **거의 같지만 첫 가드(`value === undefined`)가 없다.**
`info`가 필수 prop이라 실사용 차이는 없다.

### 결제금액 (`AptMallMyOrderDetailMenuList` 42줄)

| 요소     | 값                                                                                       |
| -------- | ---------------------------------------------------------------------------------------- |
| 컨테이너 | `bg-base-b-white p-5`                                                                    |
| `<h3>`   | `pb-6 pretendard-17SemiBold` → `결제금액`                                                |
| 항목     | `{{ item.menuName }} x {{ item.count }}` / `{{ Number(item.price).toLocaleString() }}원` |
| 합계     | `총 결제 금액` / `{{ Number(totalPrice).toLocaleString() }}원` · `pretendard-15SemiBold` |
| `:key`   | **`item.menuName`** (uuid가 아니다 — 동명 메뉴면 중복 key)                               |

```js
const totalPrice = computed(() =>
  props.info.aptMallOrderMenuList.reduce((sum, item) => sum + item.price, 0),
)
```

🔴 **`* item.count`가 없다.** AM7(확인 단계)은 `item.count * item.price`로 계산한다.
서버의 `price`가 **이미 수량이 반영된 줄 합계**라면 맞고, 단가라면 틀렸다.
`x {{ item.count }}`를 함께 보여주면서 단가를 그대로 찍는 UI는 **단가 해석에 가깝다.**
서버 응답 실물 확인이 필요하다. → `AM-Q10`

### 취소 정보 (`AptMallMyOrderDetailCancel` 40줄)

```html
<ul v-if="findStatus.status === 'CANCELED'" class="space-y-3 border-t bg-base-b-white p-5"></ul>
```

| 행       | 라벨 / 값                                                                                                |
| -------- | -------------------------------------------------------------------------------------------------------- |
| 취소일시 | `pretendard-15Medium` / `formatIsoStringDate(info.canceledDateTime).dateTime()` · `pretendard-15Regular` |
| 취소사유 | 〃 / `info.canceledReason`                                                                               |

🔴 **`findStatus.status`에 `?.`가 없다.** `STATUS_LIST`에 없는 상태값(`DELIVERY` 주문의 별도 상태 등)이
오면 `findStatus`가 `undefined` → **상세 화면이 통째로 크래시**한다.
같은 파일의 `findStatus` 정의는 `props.info?.aptMallOrderState`로 옵셔널인데 사용부만 아니다.
→ `AM-Q5`

### 하단 버튼 (`AptMallMyOrderCancelButton` 77줄) — 상태머신

| `aptMallOrderState` | 렌더                                                                                                 |
| ------------------- | ---------------------------------------------------------------------------------------------------- |
| `RESERVATION`       | `ButtonBase has-outline color="alerts-error"` → `취소하기` (진행 중엔 `SpinnerCircle color="black"`) |
| 그 밖 전부          | `ButtonBase has-outline color="defaults-secondary" :disabled="true"` → `{{ 취소일시 }} 취소 완료`    |

```js
:disabled="!isReservation || isDeleteAptMallMyOrderPending"
custom-class="flex gap-2 justify-center"
@click="openCancelConfirmModal"
@click.stop
```

- `v-if="isReservation"` / `v-else-if="!isReservation"` — **두 조건이 상보적**이라 `v-else`로 충분하다.
  `key="button-base-1"` / `"button-base-2"`로 재사용을 막아뒀다.
- `@click`과 `@click.stop`이 **같은 요소에 둘 다** 달려 있다. Vue는 둘을 모두 등록한다.
  하단 고정 영역이라 버블링 대상이 없어 실효는 없다.
- `CANCELED`가 아닌 미지의 상태에서는 `canceledDateTime`이 없으므로
  `formatIsoStringDate(undefined).dateTime()` → **`undefined 취소 완료`** 로 표시된다.
  (`formatIsoStringDate`는 인자가 falsy면 `undefined`를 반환하는 함수들을 준다.)
  → `AM-Q5`

**취소 흐름**

```
취소하기 클릭
  → ModalButton (button-type="outline", DETAIL_CANCEL_MODAL_DATA)
      "예약취소 / 취소하시겠습니까?"  [닫기] [취소]
  → 두 번째 버튼(취소, 빨강) → deleteAptMallMyOrderMutationAsync(info.aptMallOrderUuid)
  → 성공: invalidate ['aptMallMyOrderDetail'] (🔴 v5 no-op) → 모달 닫기
  → 실패: swalErrorModal({ text: 서버 message })  ※ 모달은 닫히지 않는다
```

⚠️ **실패 시 `closeCancelConfirmModal()`이 실행되지 않는다.** `mutateAsync`가 던져
`cancelReservation`의 다음 줄이 건너뛰어진다. 확인 모달 위에 에러 모달이 겹친다.
그리고 `cancelReservation`의 rejection을 아무도 잡지 않는다(§7-13과 동일 패턴).
**등가 이관.** → `AM-Q12`

### QA 체크리스트 (AM3)

- [ ] `RESERVATION` 상세 → 하단 `취소하기`(빨강 아웃라인), 취소 섹션 없음
- [ ] `CANCELED` 상세 → 하단 `YYYY-MM-DD HH:mm 취소 완료`(회색, disabled) + 취소일시·취소사유 섹션
- [ ] `취소하기` → 모달 `[닫기][취소]` → `취소` → 상세가 `취소` 상태로 갱신
- [ ] 취소 실패(서버 에러) → 확인 모달이 남은 채 에러 모달이 겹친다
- [ ] `고객 요청사항`이 비면 `-`
- [ ] 결제금액 합계 = 각 항목 금액의 단순 합 (`AM-Q10` 결정 전까지 레거시와 동일하게)

---

## AM4 — 예약 유형 선택 (`AptMallFormOrderType` 43줄)

### 드로어 셸 (`AptMallForm` 81줄)

```html
<DrawerBase
  :title="steps[currentStep].name"
  :is-close="true"
  :is-button="false"
  @close="closeDrawer"
></DrawerBase>
```

| 요소        | 값                                                                                                                                                                                            |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 오버레이    | `fixed left-0 top-0 z-[9999] h-full w-full` + `absolute inset-0 bg-black/50`                                                                                                                  |
| 시트        | `absolute bottom-0 ... rounded-t-[20px] bg-white` · `Transition name="slide-up"`                                                                                                              |
| 제목        | `px-[30px] py-2 pr-5 pretendard-18Bold` + X 버튼 `CloseBold.svg`                                                                                                                              |
| 본문        | `h-full w-full pt-2.5` > `max-h-[90vh] w-full overflow-auto`                                                                                                                                  |
| 로딩        | `SpinnerDots` (상세 로딩 중)                                                                                                                                                                  |
| **진행 바** | `currentStep > 0`일 때만. 트랙 `mb-3 h-1.5 bg-defaults-secondary-background-mono`, 채움 `h-full bg-brand-default-background-brand transition-all duration-300`, 폭 `(currentStep / 4) * 100%` |

- `DrawerBase`가 마운트 시 `document.body.style.overflow = 'hidden'`, 언마운트 시 `'unset'`
- **배경 클릭 = 닫기** (`resetAptMallFormData` 실행). 위저드 중간에 실수로 닫힐 수 있다 — 등가 이관
- 단계 전환은 `nextStep`/`prevStep`이 `currentStep`을 ±1. **경계 검사만 있고 검증은 없다**
- `contents-info`로 `aptMallDetail`을 자식에 내린다 (AM6만 실제로 쓴다)

> ⚠️ **진행 바가 0단계에서 숨는다.** 1→4단계에서 25/50/75/100%로 찬다.

### AM4 표시

```html
<div class="flex gap-2.5 p-5">
  <label
    v-for="type in TYPE_DATA"
    :class="`flex h-32 w-1/2 flex-col items-center justify-center gap-2.5 rounded-lg border p-4
             ${selectedType?.key === type.key ? 'bg-blue-s-info-50' : ''}`"
  >
    <input type="radio" name="orderType" :value="type" class="hidden" @change="handleRadio" />
    <div
      :class="`flex h-[58px] w-[58px] items-center justify-center rounded-full p-4
                  ${selectedType?.key === type.key ? 'bg-base-b-white' : 'bg-blue-s-info-50'}`"
    >
      <img :src="type.icon" :alt="`${type.label} 아이콘`" class="h-7 w-7" />
    </div>
    <span :class="`pretendard-16Medium`">{{ type.label }}</span>
  </label>
</div>
```

- 카드 2개: `방문식사`(`Meal.svg`) · `포장`(`TakeOut.svg`)
- 선택 시 **카드 배경과 아이콘 원 배경이 서로 바뀐다** (연청↔흰색)
- `<input class="hidden">` + `<label :for>` 패턴

### 동작

```js
const handleRadio = () => {
  setAptMallFormData({ selectedType: selectedType.value })
  emits('nextStep')
}
```

**선택 즉시 다음 단계로 넘어간다.** 확인 버튼이 없다.
선택 상태 스타일은 **화면에 보일 틈이 없다** (즉시 언마운트) — 그래도 그대로 옮긴다.

🔴 **AM5에서 AM4로 되돌아올 방법이 없다.** AM5의 버튼은 `닫기`(드로어 종료)뿐이고
`prevStep`을 부르지 않는다. AM6의 `이전`은 AM5로 간다. 즉 **유형을 잘못 고르면 처음부터 다시**다.
→ `AM-Q13`

---

## AM5 — 일자 및 인원 선택 (`AptMallFormOrderCalendar` 47줄)

### 조립

```
AptMallFormOrderCalendarDate                 ← 달력 (px-5)
<div class="space-y-[18px] p-5">
  AptMallFormOrderCalendarPersonCount        ← v-if selectedType.key === 'VISIT'
  AptMallFormOrderCalendarTime
</div>
<div class="p-5 pt-2">
  ButtonBase has-outline round-type="rounded" color="defaults-secondary" → 닫기
</div>
```

`aptMallFormData?.selectedType.key`로 인원 영역을 켠다 — **`?.`가 앞에만 있고
`selectedType` 뒤에는 없다.** 구조분해 스냅샷이므로 유형 선택 후에만 마운트되어 문제되지 않는다(§4-2).

---

## AM9 — 달력 (`AptMallFormOrderCalendarDate` 83줄)

### VueDatePicker 설정 전수

```html
<VueDatePicker
  v-model="selectedDate"
  inline
  no-today
  auto-apply
  locale="ko"
  :min-date="new Date()"
  :max-date="getMaxDate"
  :disabled-week-days="disabledWeekDaysIndexArray"
  :enable-time-picker="false"
  :month-change-on-scroll="false"
  :week-start="0"
  @update:model-value="handleDate"
/>
```

| prop                              | 값                            | react-day-picker 대응                    |
| --------------------------------- | ----------------------------- | ---------------------------------------- |
| `inline`                          | 팝업 아님, 항상 펼침          | 기본 동작                                |
| `no-today`                        | 오늘 강조 제거                | `modifiersClassNames`에서 `today` 무효화 |
| `auto-apply`                      | 확인 버튼 없이 즉시 반영      | 기본 동작                                |
| `locale="ko"`                     | 월/요일 한국어                | `locale={ko}` (`date-fns/locale`)        |
| `:min-date="new Date()"`          | 오늘 이전 비활성              | `disabled={{ before: today }}`           |
| `:max-date`                       | 오늘 + `reservationLimitDays` | `disabled={{ after: maxDate }}`          |
| `:disabled-week-days`             | **비운영 요일 인덱스 배열**   | `disabled={{ dayOfWeek: [...] }}`        |
| `:enable-time-picker="false"`     | 날짜만                        | 기본 동작                                |
| `:month-change-on-scroll="false"` | 스크롤로 월 이동 금지         | 기본 동작                                |
| `:week-start="0"`                 | **일요일 시작**               | `weekStartsOn={0}`                       |

> ⚠️ 스타일은 `main.js`의 `import '@vuepic/vue-datepicker/dist/main.css'` 전역 CSS다.
> **레거시에 커스텀 오버라이드가 없다** — 라이브러리 기본 모양이 그대로 화면이다.
> react-day-picker로 갈면 **모양이 달라진다.** 등가 이관의 최대 위험 지점이다.
> → 「회귀 위험 지점」 · `AM-Q14`
>
> 레거시에서 `VueDatePicker`를 쓰는 화면은 총 4개다 — AM9 · `ReservationCarAddCalendarModal`
> (주차) · `MovingHouseWriteView` · `VisitLobbyPhoneTempPasswordCreateView`.
> **AM9만 `inline`(항상 펼침)이다.** 공용 래퍼 설계 시 이 차이를 반영한다.

### 비활성 요일 계산

```js
const getDayOfWeek = (day) => WEEK_DAYS.indexOf(day) // WEEK_DAYS[0] = 'SUNDAY'

const disabledWeekDaysIndexArray = computed(() =>
  WEEK_DAYS.map((_, index) => index).filter(
    (item) =>
      !aptMallDetail?.value.operatingDayList?.map((day) => getDayOfWeek(day)).includes(item),
  ),
)
```

`WEEK_DAYS`가 `SUNDAY`부터 시작하므로 인덱스가 `Date.getDay()`와 일치한다. 의도적이다.
`operatingDayList`가 `['SATURDAY','SUNDAY']`면 비활성은 `[1,2,3,4,5]`.

⚠️ **`aptMallDetail?.value.operatingDayList`** — 옵셔널이 `aptMallDetail` 뒤에 붙어 있어
`.value`는 보호되지 않는다. ref 자체는 항상 존재하므로 무의미한 위치다.

### 초기 선택일

```js
const findFirstAvailableDate = () => {
  const today = new Date()
  const maxDays = aptMallDetail.value.reservationLimitDays || 0
  for (let i = 0; i < maxDays; i++) {
    const date = new Date()
    date.setDate(today.getDate() + i)
    if (!disabledWeekDaysIndexArray.value.includes(date.getDay())) return date
  }
  return today // 못 찾으면 오늘
}

onMounted(() => {
  selectedDate.value = findFirstAvailableDate()
  setAptMallFormData({ date: selectedDate.value })
})
```

🔴 **폴백이 `today`인데 오늘은 비운영일일 수 있다.** 그 경우 `min-date`/`disabled-week-days`가
막고 있는 날짜가 선택된 상태로 시작한다 → AM11이 그 날짜로 시간 조회를 하고,
서버가 빈 배열을 주면 **시간대가 하나도 없는 빈 화면**이 된다.
`reservationLimitDays`가 0이거나 없을 때도 같다(`maxDays = 0` → 루프 0회).
→ `AM-Q15`

⚠️ **`i < maxDays`는 `maxDays`일째를 탐색하지 않는다** (`max-date`는 포함하는데).
경계 1일 불일치. 등가 이관.

### 최대 날짜

```js
const getMaxDate = computed(() => {
  const date = new Date()
  date.setDate(date.getDate() + aptMallDetail.value.reservationLimitDays)
  return date
})
```

`reservationLimitDays`가 `undefined`면 `setDate(NaN)` → **Invalid Date** → `max-date` 무효.

### 날짜 변경

```js
const handleDate = () => {
  setAptMallFormData({ date: selectedDate.value })
}
```

스토어가 갱신되면 AM11의 `watch`가 받아 시간 목록을 재조회한다(§AM11).

---

## AM10 — 인원 수 (`AptMallFormOrderCalendarPersonCount` 44줄)

`VISIT`일 때만 렌더. **1~10명 고정** (`MAX_PERSON_COUNT = 10`, 컴포넌트 안 하드코딩).

| 요소   | 클래스                                                                                           |
| ------ | ------------------------------------------------------------------------------------------------ |
| `<ol>` | `flex h-11 items-center gap-2 overflow-x-scroll`                                                 |
| `<li>` | `whitespace-nowrap`                                                                              |
| input  | `type="radio" name="personCount" class="hidden"`                                                 |
| label  | `flex h-11 w-11 items-center justify-center rounded-full border text-center pretendard-14Medium` |
| 선택   | `border-brand-default-border-brand bg-brand-default-background-brand text-base-b-white`          |

- 기본값 **1명**, `onMounted`에서도 스토어에 반영
- 라벨 문구는 `{{ number }}명`
- 가로 스크롤 원형 칩

🔴 `setAptMallFormData({ personCount: selectedPersonCount })` — **`.value`가 없다** (§4-1).

> ⚠️ **`MAX_PERSON_COUNT`가 서버 값이 아니다.** `aptMallDetail`에 인원 상한이 있어도 무시한다.
> 잔여석보다 큰 인원을 고를 수 있고, 그러면 AM11의 모든 시간대가 비활성이 된다.
> → `AM-Q16`

---

## AM11 — 시간대 선택 (`AptMallFormOrderCalendarTime` 114줄)

### 표시

| 상태    | 렌더                                                                         |
| ------- | ---------------------------------------------------------------------------- |
| 로딩    | `SpinnerCircle color="black" class="mx-auto"`                                |
| 목록    | `<ol class="flex gap-3 overflow-y-scroll">` ← **가로 배치인데 `overflow-y`** |
| 빈 응답 | 빈 `<ol>` — **빈 상태 문구 없음**                                            |

| 요소      | 클래스                                                          |
| --------- | --------------------------------------------------------------- |
| 버튼      | `flex flex-col items-center gap-1.5`                            |
| 시간 배지 | `whitespace-nowrap rounded-md px-2.5 py-2 pretendard-15Regular` |
| — 활성    | `bg-brand-default-background-brand text-base-b-white`           |
| — 비활성  | `bg-neutral-b-gray-700 text-base-b-white`                       |
| 잔여석    | `pretendard-14Medium` → `잔여 N석`                              |

배지 문구: `{{ classifyTimeOfDay(time.orderTime) }} {{ time.orderTime.slice(0, 5) }}`
→ 예: `오전 08:00`

```js
const classifyTimeOfDay = (timeSlot) =>
  parseInt(timeSlot.split(':')[0], 10) < 12 ? '오전' : '오후'
```

잔여석 표시 조건: `aptMallDetail.orderTimeLimitPersonFlag && selectedType.key === 'VISIT'`

### 🔴 잔여석 판정이 문자열 산술이다

```js
const findTimeRemainingSeat = (time) =>
  (time.limitPersonCount - time.orderPersonCount).toLocaleString() // ← 문자열 반환

const isTimeDisable = (time) => {
  const hasNoSeat = findTimeRemainingSeat(time) - aptMallFormStore.aptMallFormData.personCount < 0
  return hasNoSeat || isPastTime(time)
}
```

|   잔여석 | `toLocaleString()` | `- personCount(2)` | `< 0` | 결과                |
| -------: | ------------------ | ------------------ | ----- | ------------------- |
|        5 | `"5"`              | `3`                | false | 선택 가능 ✅        |
|        1 | `"1"`              | `-1`               | true  | 비활성 ✅           |
| **1000** | **`"1,000"`**      | **`NaN`**          | false | **비활성 안 됨** 🔴 |

잔여석이 **1,000 이상이면 자릿수 쉼표 때문에 `NaN`** 이 되고 판정이 무력화된다.
잔여석이 그만큼 많으면 어차피 통과해야 하므로 **실무 영향은 거의 없다.**

**정작 문제는 `personCount`가 `undefined`인 경우다.** `TAKEOUT`은 AM10을 렌더하지 않아
`personCount`가 없다 → `"5" - undefined = NaN` → **좌석 판정이 전면 무효화**된다.
포장은 좌석을 안 쓰므로 결과는 맞지만, **우연히 맞는 것**이다.

→ `AM-Q17`

### 과거 시간 판정

```js
const isPastTime = (time) => {
  const selectedDate = new Date(aptMallFormStore.aptMallFormData.date)
  const today = new Date()
  if (selectedDate.toDateString() !== today.toDateString()) return false // 오늘 아니면 통과

  const now = new Date()
  const currentTime = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds()
  const [hours, minutes, seconds] = time.orderTime.split(':').map(Number)
  return hours * 3600 + minutes * 60 + seconds <= currentTime
}
```

오늘 날짜일 때만 현재 시각 이전을 막는다. **`<=`이므로 정확히 현재 시각인 슬롯도 비활성**이다.

### 선택

```js
const clickTime = (time) => {
  aptMallFormStore.setAptMallFormData({ time })
  emits('nextStep')
}
```

**선택 즉시 AM6으로 넘어간다.** AM4와 같은 패턴 — 확인 버튼이 없다.

### ⚠️ 날짜 연동이 스토어 전체 감시로 되어 있다

```js
watch(aptMallFormStore, (newValue) => {
  setDate(newValue.aptMallFormData.date)
})
```

- **스토어 객체 전체**를 감시한다. `menu`·`time`·`personCount` 변경에도 콜백이 돈다.
  `setDate`가 같은 문자열을 넣으면 쿼리 키가 안 바뀌어 재조회는 없다 — 낭비만 있다.
- `immediate`가 없어 **초기 1회는 실행되지 않는다.** 그래도 동작하는 이유:
  형제 컴포넌트의 마운트 순서가 `Date → PersonCount → Time`인데,
  **`setup`은 세 개가 먼저 다 돌고**(여기서 이 `watch`가 등록됨) **그 다음 `onMounted`가 순서대로** 실행된다.
  즉 `AptMallFormOrderCalendarDate`의 `onMounted`가 날짜를 넣는 시점에 이 `watch`는 이미 살아 있다.

  🔴 **형제 마운트 순서에 의존하는 초기화다.** 타깃에서는 "선택된 날짜가 곧 조회 파라미터"로
  직접 배선한다(파생 값). 화면 결과는 동일하다.

### QA 체크리스트 (AM5 / AM9~AM11)

- [ ] `방문식사` 선택 → 달력 + 인원 + 시간대 3영역, `포장` → 인원 영역 없음
- [ ] 운영일이 토·일이면 달력에서 월~금이 비활성
- [ ] 오늘이 운영일이 아니면 달력이 **다음 운영일**에서 시작
- [ ] `reservationLimitDays`가 14면 15일 뒤 날짜가 비활성
- [ ] 오늘 날짜 선택 시 이미 지난 시간대가 회색
- [ ] `orderTimeLimitPersonFlag`가 켜지고 `방문식사`일 때만 `잔여 N석` 표시
- [ ] 인원 5명 + 잔여 3석 시간대 → 회색(선택 불가)
- [ ] 시간대 클릭 → 즉시 메뉴 단계, 진행 바 50%
- [ ] `닫기` → 드로어 닫힘 + 스토어 초기화

---

## AM6 — 메뉴 선택 (`AptMallFormOrderMenu` 225줄)

이 도메인에서 가장 큰 파일이고 규칙도 가장 많다.

### 메뉴 초기화

```js
watch(
  aptMallOrderMenuList,
  (newValue) => {
    if (aptMallFormStore.menuInitialized) return
    if (newValue) {
      aptMallFormStore.setAptMallFormData({
        menu: newValue?.map((item) => ({
          name: item.aptMallMenuName,
          uuid: item.aptMallMenuUuid,
          price: isVisit.value ? item.price : item.takeOutPrice, // ← 유형에 따라 단가 확정
          orderMenuCountEqualsOrderPersonCountFlag: item.orderMenuCountEqualsOrderPersonCountFlag,
          count: 0,
        })),
      })
      aptMallFormStore.menuInitialized = true
    }
  },
  { immediate: true },
)
```

- **유형에 따라 `price`를 서버 필드 두 개 중 하나로 고정**한다 (`price` / `takeOutPrice`).
  이후 모든 계산은 이 `price`만 쓴다.
- `menuInitialized` 가드로 재초기화를 막는다. `prevStep`에서만 `false`로 되돌린다.
- 전 메뉴 `count: 0`으로 시작.

### 표시 규칙

| 규칙                                       | 코드                                                                  |
| ------------------------------------------ | --------------------------------------------------------------------- |
| **단가가 없는 메뉴는 숨긴다** (유형별)     | `v-if="(isVisit && menu.price) \|\| (!isVisit && menu.takeOutPrice)"` |
| `VISIT`이면 상단에 `총 인원 수  N명`       | `v-if="isVisit"` · `pretendard-18SemiBold`                            |
| `VISIT`이고 필수 메뉴면 이름 뒤에 `(필수)` | `v-if="isVisit && menu.orderMenuCountEqualsOrderPersonCountFlag"`     |
| 가격 표기                                  | `${Number(price).toLocaleString()}원`                                 |

| 요소      | 클래스                                                                      |
| --------- | --------------------------------------------------------------------------- |
| 컨테이너  | `space-y-[18px] px-5 py-6`                                                  |
| 카드      | `space-y-3 rounded-lg bg-defaults-secondary-background-secondary px-4 py-3` |
| 이름줄    | `flex justify-between pretendard-15SemiBold`                                |
| 수량줄    | `flex items-center justify-end gap-1 pretendard-15Medium`                   |
| ± 버튼    | `h-8 w-8 rounded-lg border bg-base-b-white`                                 |
| 수량      | `w-8 text-center text-brand-default-text-brand`                             |
| 총액 영역 | `h-[68px] py-3 text-center pretendard-18SemiBold`                           |

### 수량 규칙 — `VISIT`과 `TAKEOUT`이 완전히 다르다

```js
// 인원 수와 같아야 하는 필수 메뉴들의 수량 합
const sumOfEssentialMenuCountMatchingPersonCount = computed(() =>
  aptMallFormStore.aptMallFormData.menu
    ?.filter((menu) => menu.orderMenuCountEqualsOrderPersonCountFlag)
    ?.reduce((total, cur) => total + cur.count, 0),
)

const checkValidMenuCount = computed(() => {
  if (isVisit.value) {
    return (
      aptMallFormStore.aptMallFormData.personCount ===
      sumOfEssentialMenuCountMatchingPersonCount.value
    ) // 정확히 일치
  }
  return aptMallFormStore.aptMallFormData.menu?.reduce((total, cur) => total + cur.count, 0) > 0 // 1개 이상
})
```

| 유형      | `다음` 활성 조건                  | `+` 버튼 비활성 조건            |
| --------- | --------------------------------- | ------------------------------- |
| `VISIT`   | **필수 메뉴 수량 합 === 인원 수** | `checkValidMenuCount`가 참일 때 |
| `TAKEOUT` | 전체 수량 합 > 0                  | **없음** (무제한)               |

⚠️ **`checkValidMenuCount`가 두 역할을 겸한다** — `다음` 버튼 활성화와 `+` 버튼 잠금.
`VISIT`에서 필수 수량이 인원 수에 도달하면 **모든 메뉴의 `+`가 잠긴다** (선택 메뉴까지).
→ `AM-Q18`

```html
<!-- - 버튼 -->
:disabled="findMenuCount(menu.aptMallMenuUuid) <= 0" :class="... ${findMenuCount(...) <= 0 ?
'border-defaults-tertiary-border-tertiary' : 'border-base-b-black'}"

<!-- + 버튼 -->
:disabled="isVisit && checkValidMenuCount" :class="... ${isVisit ? (checkValidMenuCount ?
'border-defaults-tertiary-border-tertiary' : 'border-base-b-black') : 'border-base-b-black'}"
```

### 총액 영역

```html
<p v-if="totalPrice === 0">메뉴를 선택해주세요</p>
<div v-else>
  <span
    >총
    <span class="text-brand-default-text-brand">{{ formatPrice(totalPrice) || 0 }}</span> 원</span
  >
  <p v-if="isVisit && !checkValidMenuCount">(필수메뉴 중 인원수만큼 선택해주세요.)</p>
</div>
```

⚠️ **`totalPrice`가 `undefined`이면 `=== 0`이 거짓이라 `v-else`로 간다.** 초기 진입 직후
(메뉴 초기화 전) 순간적으로 `총  원`이 보일 수 있다. `formatPrice(undefined)` → `"NaN"` 이므로
정확히는 `총 NaN 원`이다. **`|| 0` 폴백은 `"NaN"`이 truthy라서 동작하지 않는다.**
`{ immediate: true }` watch가 즉시 도는 덕에 실사용에서는 거의 안 보인다. → `AM-Q19`

### 버튼

| 버튼   | 설정                                                                               |
| ------ | ---------------------------------------------------------------------------------- |
| `이전` | `has-outline color="defaults-secondary"` → `menuInitialized = false` 후 `prevStep` |
| `다음` | `color="brand" :disabled="!checkValidMenuCount"`                                   |

`이전`이 `menuInitialized`를 리셋하므로 **AM5에서 다시 오면 수량이 0으로 초기화**된다.
(날짜·시간·인원은 유지) 등가 이관.

### 🔴 `findMenuCount`에 옵셔널이 없다

```js
const findMenuCount = (aptMallMenuUuid) =>
  aptMallFormStore.aptMallFormData.menu?.find((item) => item.uuid === aptMallMenuUuid).count
```

`?.find` 뒤의 `.count`는 보호되지 않는다. `menu`에 없는 uuid가 렌더되면 크래시다.
§4-3(스토어 잔존)과 겹치면 실제로 발생할 수 있다 — 이전 몰의 `menu`가 남은 상태에서
다른 메뉴 목록이 렌더되는 경우. → `AM-Q6`

### QA 체크리스트 (AM6)

- [ ] `방문식사` → `총 인원 수 N명` 표시, `포장` → 없음
- [ ] `price`가 없는 메뉴는 `방문식사`에서 숨는다 / `takeOutPrice`가 없는 메뉴는 `포장`에서 숨는다
- [ ] `방문식사`에서 필수 메뉴 이름 뒤 `(필수)`
- [ ] 인원 3명, 필수 메뉴 수량 합 2 → `다음` 비활성 + `(필수메뉴 중 인원수만큼 선택해주세요.)`
- [ ] 합이 3이 되면 `다음` 활성 + **모든 `+` 버튼이 잠긴다** (`AM-Q18`)
- [ ] `포장`은 `+`에 상한이 없고 1개만 담아도 `다음` 활성
- [ ] 수량 0 → `-` 비활성(테두리 연회색)
- [ ] 총액 0 → `메뉴를 선택해주세요`
- [ ] `이전` → AM5 → 다시 `메뉴 선택` → **수량이 0으로 리셋**

---

## AM7 — 예약 확인 (`AptMallFormOrderConfirm` 190줄)

### 필드 구성

```js
const convertListItemField = computed(() =>
  aptMallFormData.selectedType.key === 'VISIT'
    ? LIST_ITEM_FIELD
    : LIST_ITEM_FIELD.filter((item) => item.key !== 'personCount'),
)
```

`TAKEOUT`이면 `인원 수` 행을 **제거**한다. (목록 카드는 제거하지 않는다 — §7-6)

```js
const renderFieldValue = (field) => {
  const value = aptMallFormData
  if (field.key === 'aptMallOrderType') return MEAL_TYPE[value?.selectedType.key]
  if (field.key === 'orderDateTime')
    return `${formatObjectDate(value.date, 'hyphen')} (${formatDay(WEEK_DAYS[value.date.getDay()]).slice(0, 1)}) ${value?.time.orderTime.slice(0, 5)}`
  if (field.key === 'personCount') return `${value[field.key]}명`
  return `${value[field.key]}` || '-'
}
```

- 날짜 표기: **`2026-08-01 (토) 08:00`** — `formatDay`로 `SATURDAY`→`토요일` 변환 후 첫 글자만
- **목록·상세는 `formatIsoStringDate(...).dateTime()` = `2026-08-01 08:00`** (요일 없음).
  같은 정보를 화면마다 다르게 표기한다. 각각 그대로 옮긴다.

### 화면 구성 (위→아래)

| 영역          | 내용                                                                                                                                                 |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| 필드 목록     | `예약유형` · `이용예정 일자` (+ `VISIT`이면 `인원 수`) — 라벨 `pretendard-16SemiBold` / 값 `text-defaults-primary-text-primary pretendard-16Regular` |
| 메뉴          | `메뉴` 제목 + `count > 0`인 항목만 `{{ name }} x {{ count }}` / `{{ (count*price).toLocaleString() }}원`                                             |
| 고객 요청사항 | `<textarea rows="5" maxlength="200">` placeholder `요청사항이 있다면 작성해주세요.`                                                                  |
| 예약 유의사항 | 고정 문구 1줄 (아래)                                                                                                                                 |
| 총 결제금액   | `총 결제금액` + `*관리비 후불 청구` / `{{ totalPrice.toLocaleString() }}원`                                                                          |
| 버튼          | `이전` (아웃라인) · `예약하기` (brand, `:disabled="isPostAptMallOrderPending"`)                                                                      |

**고정 문구 (원문 그대로)**

```
· 방문이 어려우실 경우 관리사무실로 사전에 연락주시기 바랍니다.
```

`space-y-2 pretendard-13Regular` 컨테이너 안 `<p>` 1개. `·`는 문자 그대로다(리스트 마커 아님).

| 요소                | 클래스                                                                                                                                                                  |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 컨테이너            | `px-5 py-6` > `flex flex-col gap-5`                                                                                                                                     |
| textarea            | `rounded-[4px] border border-defaults-tertiary-border-tertiary bg-defaults-secondary-background-secondary px-3 py-2.5 placeholder:text-defaults-tertiary-text-tertiary` |
| 총액 카드           | `flex justify-between gap-3 rounded-lg bg-defaults-secondary-background-mono p-4`                                                                                       |
| `*관리비 후불 청구` | `text-defaults-secondary-text-secondary pretendard-13Medium`                                                                                                            |
| 버튼 행             | `flex w-full items-center gap-3 px-5 py-1`                                                                                                                              |

> ⚠️ 메뉴 줄 합계는 `item.count * item.price`다. **AM3 상세는 곱하지 않는다** (§7-9 / `AM-Q10`).
> `textareaRef`는 선언만 되고 쓰이지 않는다 — 죽은 ref.
> `maxlength="200"`이 유일한 입력 제약이다. 검증 스키마가 없다.

### 제출

```js
const nextStep = async () => {
  await postAptMallOrderMutationAsync({ orderNote }) // ← ref 자체를 넘긴다
  emits('nextStep')
}
```

`usePostAptMallOrder`의 `mutationFn`이 `orderNote.value`를 읽는다. **ref를 인자로 넘기는 패턴**이다.

**페이로드 조립 전문**

```js
{
  aptResidentUuid: authStore.getAptInfo()?.aptResidentUuid,
  aptMallUuid: aptMallDetail.value.aptMallUuid,
  aptMallOrderMenuList: aptMallFormData.menu
    .filter((item) => item.count > 0)
    .map((item) => ({ aptMallOrderMenuUuid: item.uuid, count: item.count })),
  aptMallOrderTimeUuid: aptMallFormData.time.aptMallOrderTimeUuid,
  orderDate: formatObjectDate(aptMallFormData.date, 'hyphen'),
  aptMallOrderType: aptMallFormData.selectedType.key,
  personCount: aptMallFormData.selectedType.key === 'VISIT' ? aptMallFormData.personCount : undefined,
  orderNote: orderNote.value,
}
```

- `count > 0`인 메뉴만 전송
- `TAKEOUT`은 `personCount: undefined` → JSON에서 키가 사라진다
- `orderNote`가 비면 `undefined` → 키 없음

### 에러 처리

```js
watch(isPostAptMallOrderError, (newValue) => {
  if (newValue) {
    openModal()
    return
  }
})
```

```html
<ModalButton
  v-if="isErrorModalOpen"
  button-type="single"
  :modal-data="{ title: '예약 실패', description: postAptMallOrderError.data.error.message, firstButton: '확인' }"
  :first-handle="closeModal"
  @close="closeModal"
/>
```

🔴 **두 가지 문제**

1. `mutateAsync`가 던지고 `nextStep`이 잡지 않는다 → **unhandled rejection**.
   화면상으로는 `watch`가 모달을 띄우므로 정상처럼 보이지만 Sentry에 잡힐 수 있다.
2. `postAptMallOrderError.data.error.message` — 서버가 정규 형식으로 응답하지 않으면
   (네트워크 단절, 502 HTML 등) **모달 렌더가 크래시**한다.

**등가 이관하되, 타깃에서는 `ApiError`로 정규화된 뒤라 `.data.error.message`가 아니라
`error.message`를 읽는다** (`tech-mapping.md` 3-2 에러 매핑). **모달 문구는 서버 메시지 그대로.**
→ `AM-Q20`

⚠️ `isPostAptMallOrderError`는 다음 시도에서 `false`로 리셋되지 않는다(같은 mutation 인스턴스).
`watch`는 `false → true` 전환에서만 돌므로 **연속 실패 시 두 번째부터 모달이 안 뜬다.**
→ `AM-Q20`

### QA 체크리스트 (AM7)

- [ ] `방문식사` → 3필드(`예약유형`·`이용예정 일자`·`인원 수`), `포장` → 2필드
- [ ] 이용예정 일자가 `2026-08-01 (토) 08:00` 형식
- [ ] 수량 0인 메뉴는 목록에 안 나온다
- [ ] 요청사항 200자에서 더 입력 안 됨
- [ ] `총 결제금액`과 `*관리비 후불 청구` 문구
- [ ] `예약하기` 누르는 동안 버튼 비활성
- [ ] 서버 실패 → `예약 실패` 모달에 서버 메시지 그대로
- [ ] 실패 후 다시 `예약하기` → **모달이 다시 뜬다** (`AM-Q20` 결정 반영 시)
- [ ] 성공 → AM8, 진행 바 100%

---

## AM8 — 예약 완료 (`AptMallFormOrderCompleted` 49줄)

```html
<div class="space-y-9 p-5">
  <div class="flex flex-col items-center justify-center gap-3">
    <img src="/assets/icons/CheckCircleBlue.svg" class="h-12 w-12" alt="확인 아이콘" />
    <div class="space-y-2 text-center">
      <div class="pretendard-18SemiBold">주말조식 예약 완료</div>
      <div class="pretendard-16Medium">{{ dateTime }}</div>
    </div>
  </div>
  <div class="flex w-full gap-3">
    <ButtonBase type="button" round-type="rounded" color="brand" @click="closeDrawer"
      >확인</ButtonBase
    >
  </div>
</div>
```

```js
const dateTime = computed(
  () =>
    `${formatObjectDate(aptMallFormData.date, 'hyphen')} (${formatDay(WEEK_DAYS[aptMallFormData.date.getDay()]).slice(0, 1)}) ${aptMallFormData?.time.orderTime.slice(0, 5)}`,
)
```

- **문구가 `주말조식 예약 완료`로 하드코딩**돼 있다. 몰 이름을 쓰지 않는다.
- 날짜 표기 로직이 AM7의 `renderFieldValue`와 **완전히 중복**이다 (공용 함수로 뺄 후보 —
  단 결과 문자열은 동일해야 한다).
- `확인` → `closeDrawer` → **스토어 리셋 + 드로어 닫기**. 목록으로 돌아간다
  (`usePostAptMallOrder`의 invalidate가 v5에서 no-op이면 새 예약이 안 보인다 — §5-4).
- **드로어 제목이 `예약완료`, 본문이 `주말조식 예약 완료`** 로 둘 다 나온다.

### QA 체크리스트 (AM8)

- [ ] 파란 체크 아이콘 + `주말조식 예약 완료` + `2026-08-01 (토) 08:00`
- [ ] 드로어 제목이 `예약완료`
- [ ] `확인` → 드로어 닫힘 → **목록에 새 예약이 보인다** (invalidate 수정 후)
- [ ] 다시 `예약하기` → 1단계부터, 이전 선택이 남아 있지 않다

---

## 타깃 슬라이스 구조 (제안)

```
src/features/aptMall/
├── api/
│   └── aptMall.ts                      # #102~#109
├── queries/
│   ├── aptMallQueries.ts               # queryOptions 5종
│   ├── useAptMallMyOrderList.ts        # useInfiniteList 래퍼
│   ├── useCreateAptMallOrder.ts        # #109
│   └── useCancelAptMallOrder.ts        # #106
├── stores/
│   └── aptMallFormStore.ts             # Zustand — 위저드 상태
├── components/
│   ├── AptMallOrderCard.tsx            # 목록 카드
│   ├── AptMallOrderStatusChip.tsx      # STATUS_LIST → Chip
│   └── form/
│       ├── AptMallOrderDrawer.tsx      # 5단계 셸 + 진행 바
│       ├── StepOrderType.tsx           # AM4
│       ├── StepCalendar.tsx            # AM5
│       ├── OrderDatePicker.tsx         # AM9
│       ├── OrderPersonCount.tsx        # AM10
│       ├── OrderTimeSlots.tsx          # AM11
│       ├── StepMenu.tsx                # AM6
│       ├── StepConfirm.tsx             # AM7
│       └── StepCompleted.tsx           # AM8
├── pages/
│   ├── AptMallListPage.tsx             # AM1
│   ├── AptMallMyOrderPage.tsx          # AM2
│   └── AptMallMyOrderDetailPage.tsx    # AM3
├── constants/
│   └── aptMall.ts                      # STATUS_LIST · MEAL_TYPE · *_FIELD · TYPE_DATA · APT_MALL_LIST
├── types/
│   └── aptMall.ts
└── index.ts
```

### `shared`로 올릴 것

| 항목                                                     | 이유                                                              |
| -------------------------------------------------------- | ----------------------------------------------------------------- |
| **날짜 선택기 래퍼**                                     | AM9 · 주차 · 이사예약 · 로비폰 임시비밀번호 = **4개 도메인 공용** |
| `formatObjectDate` · `formatDay` · `formatIsoStringDate` | 이미 여러 도메인이 쓴다                                           |
| `useInfiniteList`                                        | 계획대로 `shared/hooks/`                                          |
| `Drawer` (바텀시트)                                      | `11-overlay.md` 규격. `DrawerBase` 대체                           |
| `ConfirmModal` / `ErrorModal`                            | `ModalButton`(`single`/`outline`) · `swalErrorModal` 대체         |
| `Chip`                                                   | `ChipBase` 18색 변형                                              |

### 이 도메인이 요구하는 신규 의존성

| 패키지                                 | 용도            | 상태                          |
| -------------------------------------- | --------------- | ----------------------------- |
| `react-day-picker` (shadcn `calendar`) | AM9             | Phase 0-5에서 결정, 승인 필요 |
| `dompurify`                            | 2곳 (§ AM2·AM3) | Phase 4 일괄 승인 대기        |

---

## 이관 순서 — 2개 PR

| PR       | 범위                        | 선행                                                  |
| -------- | --------------------------- | ----------------------------------------------------- |
| **AM-1** | AM1 · AM2 · AM3 (조회·취소) | Phase 4 (레이아웃 · Chip · Modal · `useInfiniteList`) |
| **AM-2** | AM4~AM11 (예약 위저드)      | AM-1 · **날짜 선택기 래퍼 확정**                      |

**AM-2를 쪼개지 않는다.** 5단계가 하나의 스토어를 공유하고 단계 간 검증이 얽혀 있어
부분 이관하면 동작을 확인할 수 없다.

> **날짜 선택기 래퍼가 AM-2의 유일한 외부 블로커다.** 주차·이사예약·로비폰이 같은 래퍼를 쓰므로
> **AM-2 전에 래퍼를 확정하면 나머지 3개 도메인이 그것을 물려받는다.**
> Phase 4에서 AM9(`inline` 모드)를 기준으로 먼저 만드는 것을 권한다 — 가장 많은 prop을 쓴다.

---

## 반드시 지켜야 할 것

1. **위저드는 URL을 만들지 않는다.** 라우트로 쪼개면 뒤로가기 동작이 달라진다.
   레거시는 위저드 중 뒤로가기 = 화면 이탈이다.
2. **AM4·AM11은 선택 즉시 다음 단계로 넘어간다.** 확인 버튼을 추가하지 않는다.
3. **AM5에서 AM4로 돌아가는 경로를 만들지 않는다** (`AM-Q13` 결정 전까지).
4. **`price`는 단계 진입 시 유형에 따라 확정된다** (`price` vs `takeOutPrice`).
   이후 계산에서 다시 분기하지 않는다.
5. **`VISIT`의 `다음` 조건은 "필수 메뉴 수량 합 === 인원 수"** 다. `>=`가 아니다.
6. **`+` 버튼 잠금이 `다음` 활성 조건과 같은 값이다** (`AM-Q18` 결정 전까지 유지).
7. **인원 수 상한 10은 클라이언트 하드코딩**이다. 서버 값으로 바꾸지 않는다.
8. **인원 수를 바꾸면 시간대 잔여석 판정이 즉시 갱신된다.**
   레거시는 `Ref`를 스토어에 넣어 우연히 얻은 동작이지만 **화면 동작은 등가로 유지한다** (§4-1).
9. **날짜 표기가 화면마다 다르다.** AM7·AM8은 `(토)` 포함, AM2·AM3는 미포함. 통일하지 않는다.
10. **AM8 문구는 `주말조식 예약 완료` 하드코딩**이다. 몰 이름으로 바꾸지 않는다.
11. **에러 모달 문구는 서버 `message` 그대로.** 자체 문구로 바꾸지 않는다.
12. **`hasAptMall` 게이트는 `aptInfo.contentList`의 이름을 `.trim()` 비교**한다. 유지한다.
13. **`TAKEOUT`은 `personCount`를 전송하지 않는다** (키 자체가 없다).
14. **취소 성공 시 목록은 무효화하지 않는다** (§5-4 / `AM-Q9`).

---

## 정리해도 되는 것 (등가 영향 없음)

| 항목                                                             | 근거                                                                     |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `setAdditionalParams` (`orderStatus` 필터)                       | 호출부 0 (§7-2)                                                          |
| `onReservationClick` prop                                        | 자식이 선언하지 않음 (§7-4)                                              |
| `useDeleteAptMallMyOrder`의 `getParams()?.mealUuid` 폴백         | 항상 `undefined` (§5-5)                                                  |
| `AptMallFormOrderConfirm`의 `textareaRef`                        | 선언만 되고 미사용                                                       |
| `// 투표상태` 주석                                               | Vote 복붙 잔재 (§7-5)                                                    |
| `default: () => {}` (4곳)                                        | `undefined` 반환하는 잘못된 기본값 (§7-7)                                |
| 스토어 id `'mealForm'` → `'aptMallForm'`                         | 내부 식별자                                                              |
| `useDeleteMealMyOrder` → `useCancelAptMallOrder`                 | 〃                                                                       |
| API 함수 인자명 `mealUuid` → `aptMallOrderUuid`                  | 경로에 노출되지 않는 프론트 인자명. **단 E-Q6이 유지로 확정 → `AM-Q22`** |
| `v-if="isReservation"` / `v-else-if="!isReservation"` → `v-else` | 상보 조건                                                                |
| `@click` + `@click.stop` 중복 (`CancelButton`)                   | 버블링 대상 없음                                                         |
| `<ol class="overflow-y-scroll">` (AM11, 가로 배치)               | 축 불일치 — 실제 스크롤 없음. `AM-Q21`                                   |
| `.find()` 2회 중복 실행 (AM1 아이콘)                             | 순수 계산                                                                |

---

## 스타일

**`broken-styles.md`의 26개 중 이 도메인에 해당하는 것은 0건이다.**
AptMall 19개 파일의 모든 Tailwind 클래스가 레거시 config에서 유효하게 생성된다.

**단, 아래 두 값은 스타일이 아니라 라우트 meta다.**

| 항목                                             | 조치                                          |
| ------------------------------------------------ | --------------------------------------------- |
| AM1 `appBarBackgroundColor: 'rgba(248,248,248)'` | 3인자 `rgba()`. `#f8f8f8`로 렌더된다. `AM-Q1` |
| AM2 `appBarBackgroundColor: '#f3f4f6'`           | `neutral-b-gray-100`. 토큰으로 바꿀 후보      |

---

## 확인 필요 (`AM-Q*`)

| #      | 질문                                                                                                                                                                          | 관련         |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| AM-Q1  | AM1의 `rgba(248,248,248)`(3인자)과 AM2의 `#f3f4f6`가 다른 회색이다. **의도인가?** 통일할 것인가                                                                               | 라우트 meta  |
| AM-Q2  | **`/aptMall/list`(AM1)는 도달 경로가 없다.** 이관하는가, 라우트째로 제외하는가                                                                                                | AM1          |
| AM-Q3  | `.find(aptMallName === '주말조식')` 실패 시 무한 스피너다. **에러 UI를 추가하는가, 등가 유지인가**                                                                            | §1           |
| AM-Q4  | `MEAL_TYPE`의 **`DELIVERY`(배달)** — 서버가 실제로 이 값을 주는가? (선택 UI는 없다)                                                                                           | §3           |
| AM-Q5  | `STATUS_LIST`에 없는 상태값이 오면 **AM3가 크래시**한다(`findStatus.status`). `?.`를 붙이는가                                                                                 | §7-8 · AM3   |
| AM-Q6  | 드로어를 닫지 않고 화면을 벗어나면 **스토어가 남아 다음 예약에 이전 메뉴가 보인다.** 라우트 이탈 시 리셋을 추가하는가                                                         | §4-3 · AM6   |
| AM-Q7  | `hasAptMall`이 `false`인 단지에서 AM2·AM4에 진입하면 `getAptInfo().contentList` / `aptMallDetail.value`에서 **크래시**한다. 메뉴가 숨겨져 실제로 도달 불가한가? 가드를 넣는가 | §5-1 · §5-3  |
| AM-Q8  | `['aptMallList']` · `['aptMallDetail']` 키에 **`aptResidentUuid`가 없다** → 단지 전환 시 캐시 오염. 키에 추가하는가                                                           | §5-2         |
| AM-Q9  | 예약 취소가 **목록을 무효화하지 않는다.** v5로 고칠 때 `aptMallMyOrderList`도 추가하는가                                                                                      | §5-4         |
| AM-Q10 | **AM3 상세 총액이 `price`만 더한다** (AM7은 `count * price`). 서버 `price`는 **단가인가 줄 합계인가?** 실 응답 확인 필요                                                      | §7-9 · AM3   |
| AM-Q11 | AM3의 `orderNote`가 `v-dompurify-html`인데 `formatHtmlText`를 안 거쳐 **개행이 사라진다.** 등가 유지인가                                                                      | AM3          |
| AM-Q12 | 취소 **실패 시 확인 모달이 안 닫히고** 에러 모달이 겹친다. 등가 유지인가                                                                                                      | AM3          |
| AM-Q13 | **AM5→AM4 되돌아가기 경로가 없다** (유형을 바꾸려면 처음부터). 등가 유지인가                                                                                                  | AM4 · AM5    |
| AM-Q14 | **`VueDatePicker` 기본 CSS가 그대로 화면이다.** react-day-picker로 갈면 모양이 바뀐다. 어디까지 맞출 것인가                                                                   | AM9          |
| AM-Q15 | 초기 선택일 폴백이 `today`인데 **오늘이 비운영일일 수 있다** (`reservationLimitDays`가 0/없을 때도). 등가 유지인가                                                            | AM9          |
| AM-Q16 | 인원 상한 **10이 클라이언트 하드코딩**이다. 서버에 상한 필드가 있는가                                                                                                         | AM10         |
| AM-Q17 | 잔여석 판정이 문자열 산술이다. **`TAKEOUT`은 `personCount`가 없어 판정이 전면 무효**다. 등가 유지인가                                                                         | §7-11 · AM11 |
| AM-Q18 | `VISIT`에서 필수 수량이 인원 수에 도달하면 **선택 메뉴의 `+`까지 잠긴다.** 의도인가                                                                                           | AM6          |
| AM-Q19 | 메뉴 초기화 직전 순간 `총 NaN 원`이 보일 수 있다 (`\|\| 0` 폴백 무효). 등가 유지인가                                                                                          | AM6          |
| AM-Q20 | 제출 실패 시 ① unhandled rejection ② **연속 실패에서 두 번째부터 모달이 안 뜬다.** 고치는가                                                                                   | AM7          |
| AM-Q21 | AM11 `<ol>`이 가로 배치인데 `overflow-y-scroll`이다. `overflow-x`로 고치는가                                                                                                  | AM11         |
| AM-Q22 | `mealUuid`는 서버에 나가지 않는 **프론트 인자명**이다(E-Q6의 "서버 계약" 전제가 부정확). `aptMallOrderUuid`로 통일하는가                                                      | §1 · E-Q6    |

---

## 등가 대조 (레거시 :3000 ↔ 신규 :5173, 392px)

| 대조 지점                                                                    |
| ---------------------------------------------------------------------------- |
| AM2 카드 간격·테두리·칩 색상·금액 정렬·화살표 위치                           |
| AM2 하단 `예약하기` 버튼 높이(`2xl` = `py-4` + 18px)와 마지막 카드 겹침 정도 |
| AM3 제목 섹션의 `border-b-8` 두께와 색                                       |
| AM3 하단 고정 영역 `z-[200]`과 스크롤 겹침                                   |
| AM4 카드 2개의 선택/비선택 배경 반전                                         |
| **AM9 달력 전체** — 월 헤더·요일 행·비활성 날짜 색·선택 원 (`AM-Q14`)        |
| AM10 원형 칩 44×44, 가로 스크롤 시작 위치                                    |
| AM11 시간 배지 활성(파랑)/비활성(진회색), `잔여 N석` 위치                    |
| AM6 ± 버튼 32×32, 테두리 색 전환, 수량 색(brand)                             |
| AM6 총액 영역 고정 높이 68px                                                 |
| AM7 유의사항 `·` 들여쓰기, 총액 카드 배경                                    |
| AM8 체크 아이콘 48×48, `space-y-9` 간격                                      |
| 드로어 `rounded-t-[20px]`, `slide-up` 트랜지션 속도                          |
| 진행 바 높이 6px, `duration-300` 애니메이션                                  |
| 폰트 배율 5단계에서 AM6 카드·AM11 배지가 깨지지 않는지                       |

---

## 회귀 위험 지점

| 지점                        | 위험                                                                                                  |
| --------------------------- | ----------------------------------------------------------------------------------------------------- |
| **AM9 달력**                | 라이브러리 교체. 모양·비활성 날짜·초기 선택일·주 시작 요일 전부 재현 필요                             |
| **`personCount` 반응성**    | 레거시는 `Ref` 자동 언랩에 의존. React에서 배선을 놓치면 잔여석 판정이 굳는다                         |
| **스토어 구조분해 3곳**     | 레거시는 단계 순서 덕에 동작. 타깃에서 구독으로 바꿀 때 렌더 타이밍 확인                              |
| **AM11 `watch` 초기화**     | 형제 마운트 순서 의존. 파생 값으로 바꿀 때 첫 조회가 빠지지 않는지                                    |
| **`invalidateQueries` 2곳** | v4 위치인자 → v5에서 no-op. 고치면 **취소·생성 후 화면이 즉시 갱신되기 시작한다** (레거시보다 빨라짐) |
| **`menuInitialized` 가드**  | `prevStep`에서만 리셋. React에서 마운트/언마운트 주기가 달라지면 초기화 시점이 바뀐다                 |
| **드로어 `body.overflow`**  | `DrawerBase`가 직접 조작. Base UI Dialog는 자체 스크롤 락이 있어 이중 적용 주의                       |
