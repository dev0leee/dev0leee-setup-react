# 도메인 명세 — 소방 자가 점검 (fireInspection)

> 기준 SHA `6d5bf22` · 레거시 `views/FireInspectionView/` 13개 파일 1,231 LOC
> (상수 308 + composable 309 + 쿼리 134 + API 51 포함 **총 2,087 LOC**)
> 타깃 슬라이스 `features/fireInspection/`
> API 3개 (`endpoints.md` #137~#139) · 쿼리 훅 3개 · composable 1개 · Pinia 스토어 **없음** · 라우트 4개

**이 도메인은 다른 도메인과 성격이 다르다.**

| 특징                                                                                                           | 의미                                                  |
| -------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| **점검표 21개 항목이 전부 클라이언트 하드코딩**이다 (`INSPECTION_CATEGORIES` 308줄)                            | 서버는 **답만 저장**한다. 문항이 바뀌면 프론트 재배포 |
| Pinia 스토어를 쓰지 않는다 — composable 하나가 상태 전부를 들고 있다                                           | React `useReducer`/커스텀 훅으로 1:1 대응 가능        |
| **`lodash` 의존이 이 도메인에 집중**돼 있다 (`every` `filter` `forEach` `get` `isEmpty` `size` `sumBy` `find`) | `tech-mapping.md`의 `lodash-es` 검토 대상             |
| **`AppBar`를 라우트 meta가 아니라 뷰가 직접 렌더**한다 (3개 화면)                                              | Vote/Survey의 AppBar 이중 노출 버그가 **여기엔 없다** |
| 서명 캔버스를 자체 구현했다 (`CanvasSign` 공용 컴포넌트를 안 쓴다)                                             | Vote의 `CanvasSign`과 **별개 구현**. 통합 후보        |
| 네이티브 브릿지 연동 **0건**                                                                                   | AptMall과 함께 브릿지 독립 도메인                     |

> ⚠️ **화면 ID는 `F*`, 확인 항목은 `F-Q*`를 쓴다.**

---

## 화면 목록

### 라우트 (`router/FireInspectionIndex.js` — 4개)

| #   | 경로                                                                       | name           | 컴포넌트                                  | meta                                                                  |
| --- | -------------------------------------------------------------------------- | -------------- | ----------------------------------------- | --------------------------------------------------------------------- |
| F1  | `/fire-inspection`                                                         | 소방 자가 점검 | `FireInspectionView`                      | AppBar `소방 자가 점검` · `hasBackButton` · **`showBottomNav: true`** |
| F2  | `/fire-inspection/process/:householdFireInspectionUuid`                    | 자가점검 진행  | `Process/FireInspectionProcessView`       | `showAppBar: false` · `showBottomNav: false`                          |
| F3  | `/fire-inspection/complete`                                                | 점검 완료      | `Complete/FireInspectionCompleteView`     | `showAppBar: false` · `showBottomNav: false`                          |
| F4  | `/fire-inspection/detail/:fireInspectionUuid/:householdFireInspectionUuid` | 점검 상세      | `History/FireInspectionHistoryDetailView` | `showAppBar: false` · `showBottomNav: false`                          |

**eager 라우트 없음** — 4개 전부 `() => import(...)`.

> ⚠️ **F1만 `showBottomNav: true`다.** 이 도메인에서 유일하고, `hasBackButton: true`와 동시에 켜져 있다.
> 메인 메뉴에서 진입하는 화면이므로 바텀네비가 있는 것이 맞다. 유지한다.
>
> ⚠️ **경로만 kebab-case다** — `/fire-inspection`. 다른 도메인은 `/aptMall`·`/movingHouse`처럼
> camelCase다. → `deferred.md` D-7에 이미 기록됨. **경로는 그대로 유지한다** (외부 링크 가능성).
>
> ⚠️ **F2·F3·F4는 `showAppBar: false`인데 컴포넌트가 `<AppBar>`를 직접 렌더한다.**
> Vote(`VT-Q1`)·Survey(`SV-Q1`)의 "AppBar 2개 겹침"과 **정반대로 올바르게** 되어 있다.
> **이 도메인이 모범 사례다** — 동적 제목(F4)·커스텀 뒤로가기(F2)가 필요해서 뷰가 직접 든 것이다.

### 화면 안의 단계 (라우트 없음)

F2는 **라우트 없이 2단계**로 갈린다. `isSignatureStep` ref 하나로 전환된다.

| #   | 단계        | 컴포넌트                     | 라인 | 하단 버튼 |
| --- | ----------- | ---------------------------- | ---: | --------- |
| F2a | 점검표 체크 | `FireInspectionCategory` ×10 |  131 | `다음`    |
| F2b | 입주민 서명 | `FireInspectionSignature`    |  171 | `완료`    |

**URL이 바뀌지 않는다.** AppBar 뒤로가기는 `handleClose`가 가로채 F2b→F2a로 되돌리지만,
**네이티브/하드웨어 뒤로가기는 라우트를 벗어난다** (그러면 점검 내용이 전부 사라진다).
→ `F-Q1`

### 진입 경로

| 화면 | 진입 출처                                                                                                       |
| ---- | --------------------------------------------------------------------------------------------------------------- |
| F1   | 메인 메뉴 — `MAIN_SWIPER_MENU_LIST`의 `contentName: '소방 자가 점검'`, 표시명 `소방자가점검`, **`isNew: true`** |
| F2   | F1 헤더 `자가점검 시작하기` → 확인 모달 `시작하기`                                                              |
| F3   | F2b 제출 성공 (`navigateReplace`)                                                                               |
| F4   | F1 점검 내역 카드 클릭 (**`SUBMITTED`인 카드만**)                                                               |

> ⚠️ **메인 메뉴에서 이 항목만 `isNew: true`다** — 신규 배지가 붙는다.
> `MAIN_SWIPER_MENU_LIST` 14개 중 유일하다. `main.md`의 배지 로직을 그대로 따른다.
>
> ⚠️ **F3는 URL로 직접 진입할 수 있다.** 가드가 없어 아무 때나 "점검이 완료되었습니다"가 보인다.
> 다만 `router/index.js`의 `beforeEach`가 **`/fire-inspection/complete`에서의 popstate 뒤로가기를 막는다**
> (`/main`·`/mypage`와 같은 취급). 제출 후 뒤로가기로 점검 화면에 돌아가지 못하게 한 것이다.
> **이 가드는 반드시 이관한다.**

---

## 1. 점검표가 클라이언트에 하드코딩돼 있다

`constants/domain/fireInspection.js`의 `INSPECTION_CATEGORIES`가 **10개 카테고리 · 21개 항목**을
전부 들고 있다. 서버로는 `sectionId`·`groupId`·`questionId`·`answer`만 보낸다.

### 카테고리 전수 (10개)

|   # | `categoryName`           | `sectionId`            | `groupId`                  | 항목 | `description`                     | 항목 `tooltipText` |
| --: | ------------------------ | ---------------------- | -------------------------- | ---: | --------------------------------- | ------------------ |
|   1 | 소화기                   | `FIRE_EQUIPMENT`       | `EXTINGUISHER`             |    5 | —                                 | —                  |
|   2 | 자동확산소화기           | `FIRE_EQUIPMENT`       | `AUTO_EXTINGUISHER`        |    2 | **`보일러가 설치된 장소의 천장`** | —                  |
|   3 | 주거용 주방자동 소화장치 | `FIRE_EQUIPMENT`       | **`PARKING_EXTINGUISHER`** |    2 | —                                 | **2개 항목 모두**  |
|   4 | 스프링클러               | `FIRE_EQUIPMENT`       | `SPRINKLER`                |    1 | —                                 | —                  |
|   5 | 자동화재 탐지설비        | `ALARM_EQUIPMENT`      | `AUTO_FIRE_ALARM`          |    1 | —                                 | —                  |
|   6 | 가스누설 경보기          | `ALARM_EQUIPMENT`      | `GAS_ALARM`                |    1 | —                                 | —                  |
|   7 | 완강기                   | `EVACUATION_EQUIPMENT` | `DESCENDING_LIFE_LINE`     |    3 | —                                 | —                  |
|   8 | 피난구용 내림식 사다리   | `EVACUATION_EQUIPMENT` | `EVACUATION_LADDER`        |    2 | —                                 | —                  |
|   9 | 대피공간                 | `OTHER_EQUIPMENT`      | `EVACUATION_SPACE`         |    2 | —                                 | —                  |
|  10 | 경량칸막이               | `OTHER_EQUIPMENT`      | `LIGHTWEIGHT_PARTITION`    |    2 | —                                 | —                  |

**항목 합계 21개.** `categoryId`와 `categoryNumber`가 1~~10으로 **항상 같다** (중복 필드).
`itemId`는 1~~21로 카테고리를 가로질러 연속이다.

> 🔴 **3번 카테고리의 `groupId`가 `PARKING_EXTINGUISHER`(주차장)인데 카테고리명은 `주거용 주방자동 소화장치`(주방)다.**
> 게다가 **화면에 보이는 설명 문구도 "주차장"으로 잘못 적혀 있다.**
>
> ```js
> questionId: 'PARKING_EXTINGUISHER_01',
> label: '소화약제용기 지시압력계의 정상 여부',
> description: '주차장 소화장치의 압력게이지가 정상 범위에 있는지 확인합니다.',   // 🔴 주방이어야 한다
> tooltipText: '가스레인지, 인덕션등이 설치된 장소의 천장 또는 싱크대 상단',      // ← 주방이 맞다
> ```
>
> 같은 착오가 **이미지 매핑 주석에도** 있다 — `constants/domain/fireInspection.js:274`의
> `// 주거용 주차장 소화장치`. 즉 오탈자가 한 곳이 아니다.
>
> **`groupId`/`questionId`는 서버 enum이므로 그대로 유지한다** (`deferred.md` 서버·앱 계약 오타 계열).
> **`description`의 "주차장"은 화면에 보이는 오탈자이므로 등가 이관 원칙과 충돌한다.** → `F-Q2`
>
> ⚠️ **2번 카테고리만 `description`을 가진다.** 이 값이 카테고리 헤더의 `도움말` 아이콘 + 툴팁으로 쓰인다.
> 즉 **카테고리 툴팁은 2번에만 뜬다.**
>
> ⚠️ **`tooltipText`는 3번 카테고리의 2개 항목에만 있다.** 즉 **항목 툴팁은 21개 중 2개에만 뜬다.**

### `sectionId`는 화면에 쓰이지 않는다

UI는 카테고리 10개를 평평하게 나열한다. `sectionId`(설비 대분류 4종)는 **제출 페이로드에만** 들어간다.
→ 타깃에서도 화면 그룹핑을 만들지 않는다.

### 이미지 매핑 — `FIRE_INSPECTION_ITEM_IMAGES`

`itemId` → 이미지 경로 배열. **21개 전부 정의돼 있다.**

| 이미지 수 | `itemId`                                           |
| --------: | -------------------------------------------------- |
|         0 | **5 · 15 · 17** — 명시적 빈 배열 = "이미지 없음"   |
|         1 | 1·2·3·4·6·7·8·9·10·11·12·13·16·18·19·20·21         |
|         3 | **14** (완강기 외형) — 좌우 화살표 슬라이더가 뜬다 |

```js
const hasImages = (item) => {
  const images = get(FIRE_INSPECTION_ITEM_IMAGES, item.itemId)
  return !(Array.isArray(images) && isEmpty(images)) // 빈 배열만 false
}

const getItemImages = (item) => {
  const images = get(FIRE_INSPECTION_ITEM_IMAGES, item.itemId)
  return isEmpty(images)
    ? ['/assets/images/자가점검표/fire-inspection.svg'] // 폴백 = F1 헤더 히어로 이미지
    : images
}
```

`undefined`(매핑 누락)와 `[]`(명시적 없음)를 **구분**한다. 현재 누락은 0개이므로 폴백은 죽은 경로다.

> 🔴 **이미지 경로에 한글이 들어 있다** — `/assets/images/자가점검표/소화기/fire-extinguisher-1.svg`.
> Vite dev 서버와 S3+CloudFront에서 잘 동작하고 있으나, 경로 인코딩에 민감한 배포 환경으로 바뀌면 깨진다.
> **파일을 그대로 옮기므로 이관 자체에는 문제가 없다.** 리네이밍은 `deferred.md`로. → `F-Q3`

### 응답 enum

```js
export const FIRE_INSPECTION_ANSWER = {
  NORMAL: 'NORMAL',
  DEFECTIVE: 'DEFECTIVE',
  NOT_APPLICABLE: 'NOT_APPLICABLE',
}

export const FIRE_INSPECTION_RADIO_OPTIONS = [
  { key: FIRE_INSPECTION_ANSWER.DEFECTIVE, label: '불량' }, // ← 불량이 먼저다
  { key: FIRE_INSPECTION_ANSWER.NORMAL, label: '정상' },
]
```

> ⚠️ **라디오 순서가 `불량` → `정상`이다.** 통상 긍정이 먼저인데 반대다.
> `NOT_APPLICABLE`은 라디오에 없고 **카테고리 단위 `해당없음` 체크박스**로만 설정된다.
> **순서를 바꾸지 않는다.**

### 제출 상태 enum

```js
export const FIRE_INSPECTION_SUBMISSION_STATUS = {
  BEFORE_START: 'BEFORE_START', // 점검 기간 전
  NOT_SUBMITTED: 'NOT_SUBMITTED', // 기간 중 미제출 → 유일하게 점검 가능
  SUBMITTED: 'SUBMITTED', // 제출 완료 → 상세 조회 가능
  NOT_PARTICIPATED: 'NOT_PARTICIPATED', // 기간 종료 미참여
}
```

**4개 상태가 3곳에서 각자 다른 표를 만든다** — 헤더 버튼 · 카드 칩 · 카드 메시지. 전수는 아래 F1.

---

## 2. API 3개

접두사 `/board/resident/{aptResidentUuid}/fire-inspection`. 전부 `auth`.

|   # | 함수                       | METHOD | 경로                                                            | 비고                      |
| --: | -------------------------- | ------ | --------------------------------------------------------------- | ------------------------- |
| 137 | `getFireInspectionStatus`  | GET    | ``                                                              | 점검 회차 목록            |
| 138 | `postFireInspectionSubmit` | POST   | `/{householdFireInspectionUuid}`                                | **`multipart/form-data`** |
| 139 | `getFireInspectionDetail`  | GET    | `/{fireInspectionUuid}/household/{householdFireInspectionUuid}` | 제출된 점검 상세          |

> ⚠️ **접두사가 `apiBoard`다** — 게시판 API 네임스페이스를 쓴다. 도메인 분류상 어긋나지만
> **서버 경로이므로 그대로 유지한다.**

### 제출 페이로드 (`FormData` 인덱스 표기)

```js
formData.append('signatureFile', signatureFile)
questionAnswerList.forEach((item, index) => {
  formData.append(`questionAnswerList[${index}].sectionId`, item.sectionId)
  formData.append(`questionAnswerList[${index}].groupId`, item.groupId)
  formData.append(`questionAnswerList[${index}].questionId`, item.questionId)
  formData.append(`questionAnswerList[${index}].answer`, item.answer)
})
```

Spring MVC의 중첩 리스트 바인딩 형식(`list[0].field`)이다. **키 형식을 한 글자도 바꾸지 않는다.**
21개 항목 × 4필드 = **84개 필드 + 서명 파일 1개**가 전송된다.

`Content-Type: multipart/form-data`를 **명시적으로 설정**한다 (boundary 없이). axios가 `FormData`를
감지해 boundary를 붙이므로 동작한다. 타깃 `apiClient`에서도 같은 처리가 되는지 확인 필요. → `F-Q4`

---

## 3. `useFireInspectionForm` — 상태 전부를 든 composable (309줄)

Pinia를 쓰지 않고 **F2에서 한 번 호출해 자식에게 prop으로 내린다.**

```html
<!-- FireInspectionProcessView -->
<FireInspectionCategory :category="category" :inspection-form="inspectionForm" />
<!-- FireInspectionCategory -->
<FireInspectionItem :item="item" :inspection-form="inspectionForm" />
```

🔴 **composable 반환 객체를 그대로 props로 2단 내린다 (props drilling).**
타깃 컨벤션(`10-components.md`)이 금지하는 패턴이고, 프로젝트 규칙에도 명시돼 있다.
**React Context로 바꾼다** — 화면 동작은 동일하다.

⚠️ props로 넘어간 ref는 **자동 언랩되지 않는다.** 그래서 자식이 `.value`를 직접 쓴다.

```js
// FireInspectionCategory.vue
!!props.inspectionForm.notApplicableCategories.value[props.category.categoryId]
props.inspectionForm.activeTooltipId.value === props.category.categoryId
// FireInspectionItem.vue
!!props.inspectionForm.activeItemTooltips.value[props.item.itemId]
```

React에서는 `.value`가 사라진다. 옮길 때 놓치기 쉬운 지점이다.

### 상태 6개

| ref                       | 형태                        | 의미                                   |
| ------------------------- | --------------------------- | -------------------------------------- |
| `inspectionResults`       | `{ [itemId]: ANSWER }`      | 항목별 응답. **진행률의 유일한 출처**  |
| `notApplicableCategories` | `{ [categoryId]: boolean }` | 카테고리 `해당없음` 체크               |
| `expandedCategories`      | `{ [categoryId]: boolean }` | 아코디언 펼침                          |
| `activeTooltipId`         | `categoryId \| null`        | **카테고리 툴팁 — 한 번에 하나만**     |
| `activeItemTooltips`      | `{ [itemId]: boolean }`     | **항목 툴팁 — 여러 개 동시 오픈 허용** |
| `imageSliderIndex`        | `{ [itemId]: number }`      | 이미지 슬라이더 인덱스                 |

> ⚠️ **툴팁 정책이 카테고리와 항목에서 다르다** (하나만 vs 여러 개). 의도된 비대칭인지 불명이나
> **그대로 옮긴다.**

### 카테고리 로직

```js
const getCategoryProgress = (category) => {
  const total = size(category.items)
  const isNotApplicable = !!get(notApplicableCategories.value, category.categoryId)
  const answeredItems = filter(category.items, (item) => get(inspectionResults.value, item.itemId))
  const completed = isNotApplicable ? total : size(answeredItems)
  return { completed, total }
}

const isCategoryCompleted = (category) => {
  if (get(notApplicableCategories.value, category.categoryId)) return true
  if (isEmpty(category.items)) return false
  return every(category.items, (item) => get(inspectionResults.value, item.itemId))
}

const isCategoryExpanded = (categoryId) => {
  if (get(notApplicableCategories.value, categoryId)) return false // 해당없음이면 절대 펼치지 않는다
  return get(expandedCategories.value, categoryId, false) // 기본 접힘
}
```

⚠️ `isNotApplicable`일 때 `completed = total`로 **덮어쓴다.** 실제로는 `toggleNotApplicable`이
모든 항목에 `NOT_APPLICABLE`을 넣으므로 `answeredItems`도 같은 값이 된다 — **중복 계산**이지만
결과는 동일하다.

### 아코디언 토글 — 완료된 다른 카테고리를 자동으로 접는다

```js
const toggleCategory = (categoryId) => {
  if (get(notApplicableCategories.value, categoryId)) return // 해당없음이면 토글 자체 차단
  const isOpening = !get(expandedCategories.value, categoryId)

  if (isOpening && !isEmpty(INSPECTION_CATEGORIES)) {
    forEach(INSPECTION_CATEGORIES, (category) => {
      const isOtherCategory = category.categoryId !== categoryId
      const isExpanded = get(expandedCategories.value, category.categoryId)
      if (isOtherCategory && isExpanded && isCategoryCompleted(category)) {
        expandedCategories.value[category.categoryId] = false // 완료된 것만 접는다
      }
    })
  }

  expandedCategories.value[categoryId] = isOpening

  if (!isOpening) {
    // 접을 때 툴팁 정리
    if (activeTooltipId.value === categoryId) activeTooltipId.value = null
    const category = INSPECTION_CATEGORIES.find((c) => c.categoryId === categoryId)
    if (category)
      forEach(category.items, (item) => {
        activeItemTooltips.value[item.itemId] = false
      })
  }
}
```

**핵심 UX**: 새 카테고리를 펼치면 **이미 완료된** 다른 카테고리만 접힌다.
**미완료 카테고리는 여러 개 동시에 펼쳐진 상태로 남는다.** 아코디언이지만 단일 오픈이 아니다.
→ **반드시 이 규칙을 지킨다.**

### `해당없음` 토글 — 응답을 지운다

```js
const toggleNotApplicable = (category, event) => {
  event.stopPropagation()
  const { categoryId } = category
  const newValue = !get(notApplicableCategories.value, categoryId)
  notApplicableCategories.value[categoryId] = newValue

  if (newValue) {
    forEach(category.items, (item) => {
      inspectionResults.value[item.itemId] = FIRE_INSPECTION_ANSWER.NOT_APPLICABLE
    })
    expandedCategories.value[categoryId] = false // 자동 접기
  } else {
    forEach(category.items, (item) => {
      delete inspectionResults.value[item.itemId]
    })
  }
}
```

🔴 **해제 시 그 카테고리의 응답을 전부 `delete`한다.**
"정상/불량을 다 고른 뒤 실수로 해당없음을 켰다가 다시 끄면 **입력이 전부 사라진다.**"
→ `F-Q5`

⚠️ `event.stopPropagation()`이 필수다 — 체크박스가 카테고리 헤더 `<button>` **안에** 있어서
전파되면 아코디언이 토글된다. 템플릿에도 `@click.stop`이 별도로 걸려 있다 (이중 방어).

### 진행률

```js
const totalItems = computed(() => sumBy(INSPECTION_CATEGORIES, (c) => size(c.items))) // 21 고정
const completedItems = computed(() => size(inspectionResults.value)) // 키 개수
const progressPercent = computed(() => Math.round((completedItems.value / totalItems.value) * 100))
const isAllCompleted = computed(
  () => totalItems.value > 0 && completedItems.value === totalItems.value,
)
```

**`completedItems`가 `inspectionResults`의 키 개수다.** `NOT_APPLICABLE`도 카운트에 포함된다.
`delete`로 지우므로 감소도 정확하다.

⚠️ `Math.round`이므로 20/21 = **95%**, 21/21 = 100%. 1개 남았을 때 95%로 보인다.

### 제출 리스트 조립

```js
const buildQuestionAnswerList = () => {
  const result = []
  INSPECTION_CATEGORIES.forEach((category) => {
    category.items.forEach((item) => {
      const answer = get(inspectionResults.value, item.itemId)
      if (answer)
        result.push({
          sectionId: category.sectionId,
          groupId: category.groupId,
          questionId: item.questionId,
          answer,
        })
    })
  })
  return result
}
```

**응답이 없는 항목은 제외**한다. 다만 `isAllCompleted`가 아니면 `다음` 버튼이 잠기므로
실제로는 항상 21개가 전송된다.

### 이미지 슬라이더 — 순환

```js
const prevImage = (itemId, totalImages) => {
  const current = get(imageSliderIndex.value, itemId, 0)
  imageSliderIndex.value[itemId] = current > 0 ? current - 1 : totalImages - 1 // 첫→마지막
}
const nextImage = (itemId, totalImages) => {
  const current = get(imageSliderIndex.value, itemId, 0)
  imageSliderIndex.value[itemId] = current < totalImages - 1 ? current + 1 : 0 // 마지막→첫
}
```

**실제 슬라이더가 뜨는 항목은 `itemId: 14`(완강기 외형) 하나뿐**이다 (이미지 3장).

---

## 4. 쿼리 훅 3개

| 훅                            | 쿼리 키                                                                     | `enabled`              |
| ----------------------------- | --------------------------------------------------------------------------- | ---------------------- |
| `useGetFireInspectionStatus`  | `['fireInspectionStatus']`                                                  | (없음 — 항상)          |
| `useGetFireInspectionDetail`  | `['fireInspectionDetail', fireInspectionUuid, householdFireInspectionUuid]` | 두 uuid가 모두 있을 때 |
| `usePostFireInspectionResult` | (mutation)                                                                  | —                      |

### 4-1. `useGetFireInspectionStatus`

```js
queryKey: ['fireInspectionStatus'],
queryFn: () => getFireInspectionStatus({ aptResidentUuid: authStore.getAptInfo().aptResidentUuid }),
select: (data) => data.data.success,
```

- 🔴 **키에 `aptResidentUuid`가 없다** → 단지 전환 시 캐시 오염. AptMall `AM-Q8`과 같은 계열. → `F-Q6`
- 🔴 **`getAptInfo()` 뒤에 `?.`가 없다** — 이 도메인 3개 훅 모두 그렇다.
- `refetchInspectionStatus`를 반환하지만 **호출부가 없다.** 죽은 반환값.
- **콘텐츠 게이트(`hasAptMall` 같은 것)가 없다.** 소방 콘텐츠가 없는 단지도 쿼리가 돈다.
  메인 메뉴가 `contentName: '소방 자가 점검'`으로 게이팅하므로 도달 자체는 막힌다.

### 4-2. `useGetFireInspectionDetail`

인자로 **ref 2개**를 받는다 (`fireInspectionUuid`, `householdFireInspectionUuid`).

```js
select: (data) => {
  const detail = data.data.success
  const answerList = detail.questionAnswerList ?? []
  return {
    ...detail,
    normalCount: answerList.filter((qa) => qa.answer === 'NORMAL').length,
    defectiveCount: answerList.filter((qa) => qa.answer === 'DEFECTIVE').length,
    notApplicableCount: answerList.filter((qa) => qa.answer === 'NOT_APPLICABLE').length,
  }
}
```

🔴 **`normalCount`·`defectiveCount`·`notApplicableCount` 3개를 계산하는데 F4가 하나도 쓰지 않는다.**
집계 요약 UI를 만들려다 만 흔적이다. → `deferred.md` 죽은 코드

⚠️ `select`에서 `'NORMAL'` 등을 **문자열 리터럴로** 비교한다. 같은 파일에서 `FIRE_INSPECTION_ANSWER`를
import하지 않았다. 상수를 쓰도록 정리해도 등가다.

### 4-3. `usePostFireInspectionResult` — 에러코드 4종 매핑

```js
onSuccess: async () => {
  await navigateReplace({ path: '/fire-inspection/complete' });
  queryClient.invalidateQueries({ queryKey: ['fireInspectionStatus'] });   // ✅ v5 객체 형식
},
onError: (error) => {
  const { errorCode, message } = error.data.error;
  let text;
  switch (errorCode) {
    case 'NOT_IN_INSPECTION_PERIOD':              text = '점검 기간이 아닙니다.'; break;
    case 'ALREADY_SUBMITTED':                     text = '이미 제출된 점검입니다.'; break;
    case 'APT_RESIDENT_NOT_FOUND':                text = '입주민 정보를 찾을 수 없습니다.'; break;
    case 'HOUSEHOLD_FIRE_INSPECTION_NOT_FOUND':   text = '세대 점검 정보를 찾을 수 없습니다.'; break;
    default:                                      text = message;
  }
  swalErrorModal({ text });
},
```

> ✅ **이 도메인의 `invalidateQueries`는 v5 객체 형식이다.** 레거시 28곳 중 몇 안 되는 정상 호출.
> 소방점검이 가장 늦게 개발된 기능이라 최신 문법으로 작성된 것으로 보인다.
>
> ⚠️ **`navigateReplace`를 먼저 `await`하고 그 다음에 무효화한다.** 화면을 떠난 뒤 무효화하므로
> F1로 돌아올 때 최신 상태가 보장된다. 순서를 바꾸지 않는다.
>
> ⚠️ **에러 메시지 4종은 프론트가 자체 문구로 덮어쓴다.** 서버 `message`는 `default`에서만 쓴다.
> **문구를 한 글자도 바꾸지 않는다** (마침표 포함).
>
> `mutate`(not `mutateAsync`)를 쓰므로 **unhandled rejection이 없다.** AptMall `AM-Q20`과 대비된다.

---

## F1 — 점검 메인 (`FireInspectionView` 94줄)

### 레이아웃

```
┌────────────────────────────┐
│ AppBar  소방 자가 점검      │
├────────────────────────────┤
│ FireInspectionHeader        │  ← 안내문 + 히어로 이미지 + 상태별 버튼
├────────────────────────────┤  ← h-2 구분선
│ 우리 집 점검 내역            │
│ ┌────────────────────────┐ │
│ │ 2026.07.01 ~ 2026.07.31 [점검필요] │
│ │ 자가점검을 진행해주세요.  │ │
│ └────────────────────────┘ │
│ ... (회차별 카드)           │
├────────────────────────────┤
│ BottomNavigation            │  ← 이 도메인 유일
└────────────────────────────┘
```

| 영역      | 클래스                                                                                     |
| --------- | ------------------------------------------------------------------------------------------ |
| 셸        | `flex h-full w-full flex-col overflow-auto bg-defaults-secondary-background-secondary`     |
| 구분선    | `h-2 bg-defaults-secondary-background-secondary`                                           |
| 내역 영역 | `flex flex-1 flex-col gap-4 bg-base-b-white px-5 py-5`                                     |
| `<h3>`    | `text-defaults-primary-text-primary pretendard-16Bold` → `우리 집 점검 내역`               |
| 목록      | `flex flex-col gap-3`                                                                      |
| 빈 상태   | `flex h-32 items-center justify-center` + `점검 내역이 없습니다.` (`pretendard-14Regular`) |

⚠️ **셸 배경과 구분선 배경이 같은 토큰**이다 (`defaults-secondary-background-secondary`).
헤더·내역이 흰색이라 그 사이 8px 띠로 보인다.

### 데이터

```js
const inspectionList = computed(() => inspectionStatusData.value ?? [])
const latestInspection = computed(() => inspectionList.value[0] ?? null) // 🔴 0번째가 최신이라고 가정
```

🔴 **정렬을 하지 않고 `[0]`을 최신으로 쓴다.** 서버가 최신순으로 주는지 확인이 필요하다.
순서가 뒤바뀌면 **헤더 버튼이 과거 회차 상태를 보여주고, `시작하기`가 과거 회차의
`householdFireInspectionUuid`로 이동한다.** → `F-Q7`

### 헤더 (`FireInspectionHeader` 75줄)

**고정 문구 (원문 그대로)**

```
아파트먼트에서<br />소방시설을 자가점검 할 수 있어요.
미점검 세대에는 과태료가 부과됩니다. 우리집 안전을 위해 세대 내 소방시설 자가점검을 실시해주세요.
```

| 요소     | 클래스                                                                 |
| -------- | ---------------------------------------------------------------------- |
| 컨테이너 | `flex flex-col gap-4 bg-base-b-white px-5 py-6`                        |
| `<h2>`   | `text-defaults-primary-text-primary pretendard-20SemiBold`             |
| `<p>`    | `text-defaults-secondary-text-secondary pretendard-16Medium`           |
| 히어로   | `/assets/images/자가점검표/fire-inspection.svg` · `w-full rounded-2xl` |
| 버튼     | `ButtonBase size="xl"` (색·문구·비활성은 상태별)                       |

**상태별 버튼 전수 (`buttonConfig`)**

| `submissionStatus`      | 문구                                   | `color`              | `disabled` |
| ----------------------- | -------------------------------------- | -------------------- | ---------- |
| `NOT_SUBMITTED`         | `자가점검 시작하기`                    | `brand`              | false      |
| `SUBMITTED`             | `이미 제출이 완료되었습니다.`          | `defaults-secondary` | **true**   |
| `BEFORE_START`          | `점검 기간이 아닙니다.`                | `defaults-secondary` | **true**   |
| `NOT_PARTICIPATED`      | `점검 기간이 종료되었습니다.`          | `defaults-secondary` | **true**   |
| `default` (`null` 포함) | 〃 (`NOT_PARTICIPATED`와 fall-through) | 〃                   | **true**   |

⚠️ **`NOT_PARTICIPATED`와 `default`가 fall-through로 묶여 있다.** 점검 내역이 아예 없으면
(`latestInspection === null`) `submissionStatus`가 `undefined`가 되어 **`점검 기간이 종료되었습니다.`** 가
보인다. 점검이 한 번도 없던 단지에는 부정확한 문구다. → `F-Q8`

### 시작 흐름

```js
const handleStartInspection = () => {
  if (
    latestInspection.value?.submissionStatus === FIRE_INSPECTION_SUBMISSION_STATUS.NOT_SUBMITTED
  ) {
    isStartModalOpen.value = true
  }
}
const handleConfirmStart = () => {
  isStartModalOpen.value = false
  if (latestInspection.value) {
    navigateTo(`/fire-inspection/process/${latestInspection.value.householdFireInspectionUuid}`)
  }
}
```

버튼이 `NOT_SUBMITTED`에서만 활성이므로 가드는 **중복 방어**다 (무해).

### 확인 모달 (`FireInspectionStartModal` 102줄)

`ModalBase` 위에 **자체 마크업**으로 만들었다 — `ModalButton`을 쓰지 않는다.

| 영역      | 내용 / 클래스                                                                           |
| --------- | --------------------------------------------------------------------------------------- |
| 컨테이너  | `w-[296px] max-w-[80vw] ... rounded-2xl bg-base-b-white` (`ModalButton`은 `rounded-md`) |
| 아이콘 원 | `h-14 w-14 rounded-full bg-brand-default-background-brand`                              |
| 아이콘    | **`/assets/icons/Link.svg`** + `brightness-0 invert` (흰색으로 반전)                    |
| 타이틀    | `자가점검을 시작할까요?` · `pretendard-16Bold`                                          |
| 기간 카드 | `rounded-xl bg-defaults-secondary-background-secondary px-4 py-3`                       |
| — 라벨    | `점검 기간` · `text-defaults-tertiary-text-tertiary pretendard-13Medium`                |
| — D-day   | `text-alerts-error-text-error pretendard-13SemiBold` (진행 중일 때만)                   |
| — 기간    | `2026.07.01 ~ 2026.07.31` · `pretendard-14SemiBold`                                     |
| 안내      | `점검 항목을 체크하고 서명하면<br />관리사무소에 자동으로 제출됩니다.`                  |
| 버튼      | `취소`(회색) · 세로 구분선 `w-px` · `시작하기`(brand) — **각 `flex-1 py-3.5`**          |

```js
const dday = calculateDday(props.inspection.endDate) // 'D-3' / 'D-Day' / 'D+1'

const today = new Date()
today.setHours(0, 0, 0, 0)
const endDate = new Date(props.inspection.endDate)
endDate.setHours(0, 0, 0, 0)
const isInspectionOngoing = endDate >= today // 종료일 당일 포함
```

⚠️ **모든 값이 `computed`가 아니라 setup 실행 시점 상수다.** 모달은 `v-if`로 매번 새로 마운트되므로
문제되지 않는다.

> ⚠️ **아이콘이 `Link.svg`(링크 아이콘)다.** 소방/점검과 무관한 아이콘을 색 반전해서 쓰고 있다.
> 의도된 것인지 임시인지 불명. **그대로 옮긴다.** → `F-Q9`

### 내역 카드 (`FireInspectionStatusCard` 114줄)

| 요소   | 클래스                                                                                                           |
| ------ | ---------------------------------------------------------------------------------------------------------------- |
| `<li>` | `overflow-hidden rounded-xl border border-defaults-tertiary-border-tertiary` (+ `cursor-pointer` if `SUBMITTED`) |
| 내부   | `flex flex-col gap-1.5 px-4 py-3.5`                                                                              |
| 기간   | `pretendard-18SemiBold` → `2026.07.01 ~ 2026.07.31` (`dotDate()`)                                                |
| 칩     | `ChipBase :color variant="fill" :class-name`                                                                     |
| 메시지 | `text-defaults-secondary-text-secondary pretendard-13Medium`                                                     |

**상태별 칩 + 메시지 전수**

| `submissionStatus` | 칩 색      | 칩 문구    | `className` 오버라이드                          | 메시지                                    |
| ------------------ | ---------- | ---------- | ----------------------------------------------- | ----------------------------------------- |
| `SUBMITTED`        | `green`    | `점검완료` | `!bg-alerts-success-background-success-primary` | `제출 날짜 : {submissionDateTime.date()}` |
| `NOT_SUBMITTED`    | `red`      | `점검필요` | `!bg-alerts-error-background-error-primary`     | `자가점검을 진행해주세요.`                |
| `BEFORE_START`     | `gray`     | `점검예정` | —                                               | `점검 시작일 : {startDate.dotDate()}`     |
| `NOT_PARTICIPATED` | `darkGray` | `미참여`   | —                                               | `점검 기간이 종료되었습니다.`             |
| `default`          | `gray`     | `''`(빈칸) | —                                               | `''`(빈칸)                                |

> ⚠️ **`className`으로 `!bg-*`를 강제 주입해 `ChipBase`의 기본 배경을 덮는다.**
> **결과는 더 연한 배경이다** — `ChipBase`의 `green`/`red` fill 기본값이 `-secondary`인데
> `-primary`로 덮기 때문이다.
>
> | 칩      | `ChipBase` 기본                          | `className` 덮어쓰기                       |
> | ------- | ---------------------------------------- | ------------------------------------------ |
> | `green` | `background-success-secondary` `#D1FADF` | **`background-success-primary` `#ECFDF3`** |
> | `red`   | `background-error-secondary`             | **`background-error-primary` `#FEF3F2`**   |
>
> **`ChipBase`를 고치지 않고 호출부에서 `!important`로 덮는 패턴**이다.
> 타깃에서는 `cn()` 병합으로 자연스럽게 처리하되 **최종 색이 같아야 한다.**
>
> ⚠️ **날짜 포맷이 섞여 있다** — 기간·시작일은 `dotDate()`(`2026.07.01`), 제출일만 `date()`(`2026-07-01`).
> **각각 그대로 옮긴다.**

**클릭**

```js
if (submissionStatus === SUBMITTED && householdFireInspectionUuid) {
  router.push(`/fire-inspection/detail/${fireInspectionUuid}/${householdFireInspectionUuid}`)
}
```

⚠️ **이 컴포넌트만 `useNavigate` 대신 `useRouter`를 직접 쓴다.** 도메인 내 유일. 정리 대상.

⚠️ `:key="`${inspection.fireInspectionUuid}-${index}`"` — uuid만으로 충분한데 index를 붙였다.

### QA 체크리스트 (F1)

- [ ] `NOT_SUBMITTED` → 파란 `자가점검 시작하기` 활성
- [ ] `SUBMITTED` → 회색 `이미 제출이 완료되었습니다.` 비활성
- [ ] `BEFORE_START` → 회색 `점검 기간이 아닙니다.` 비활성
- [ ] `NOT_PARTICIPATED` → 회색 `점검 기간이 종료되었습니다.` 비활성
- [ ] 점검 내역 0건 → `점검 내역이 없습니다.` + 버튼은 `점검 기간이 종료되었습니다.` (`F-Q8`)
- [ ] 카드 칩 4종 색·문구, `SUBMITTED`/`NOT_SUBMITTED`는 `!bg-*-primary`로 **더 연하게**
- [ ] `SUBMITTED` 카드만 클릭 가능 (커서 포인터), 나머지는 반응 없음
- [ ] `시작하기` → 모달에 기간·D-day·안내 문구
- [ ] 종료일 지난 회차는 모달 D-day가 **표시되지 않는다**
- [ ] 바텀네비가 보인다 (이 도메인 유일)

---

## F2a — 점검표 작성 (`FireInspectionProcessView` 105줄)

### 셸

```html
<div class="bg-base-b-white flex h-full w-full flex-col">
  <AppBar title="자가점검표 작성" :navigate-fn="handleClose" />
  <template v-if="isSignatureStep"> ... </template>
  <template v-else>
    <div class="flex flex-1 flex-col overflow-auto pt-12">
      <FireInspectionProgress :percent="progressPercent" />
      <div class="flex flex-col gap-4 px-5 py-6">...</div>
    </div>
  </template>
  <div class="border-defaults-tertiary-border-tertiary border-t px-5 py-4">
    <ButtonBase ...>{{ isSignatureStep ? '완료' : '다음' }}</ButtonBase>
  </div>
</div>
```

- `AppBar`가 `fixed top-0 h-12`이므로 본문에 `pt-12`로 자리를 만든다
- **AppBar 제목이 두 단계 모두 `자가점검표 작성`이다** (서명 단계에서도 바뀌지 않는다)
- 하단 버튼 영역은 **두 단계 공통**이고 `fixed`가 아니라 flex 마지막 자식이다

```js
const handleClose = () => {
  if (isSignatureStep.value) {
    isSignatureStep.value = false
    return
  } // 서명 → 점검표
  navigateBack()
}

const isNextButtonEnabled = computed(() =>
  isSignatureStep.value ? !!signatureData.value : isAllCompleted.value,
)
```

**버튼 색이 활성 여부에 따라 바뀐다** — `isNextButtonEnabled ? 'brand' : 'defaults-secondary'`.
그리고 `:disabled="!isNextButtonEnabled || isSubmitPending"`.

⚠️ **제출 중 스피너가 없다.** 버튼만 비활성되고 문구는 `완료`로 남는다. AptMall·주차와 다르다.

### 진행률 바 (`FireInspectionProgress` 31줄)

```html
<div
  class="border-defaults-tertiary-border-tertiary bg-base-b-white sticky top-0 z-10 flex flex-col gap-2 border-b px-5 pt-4 pb-4"
>
  <p class="pretendard-16SemiBold">자가점검표를 체크하여 완료해주세요.</p>
  <div class="flex items-center gap-2">
    <span class="text-brand-default-text-brand pretendard-14Medium">{{ percent }}%</span>
    <div class="bg-defaults-secondary-background-secondary h-1 flex-1 rounded-full">
      <div
        class="bg-brand-default-background-brand h-full rounded-full transition-all duration-300"
        :style="{ width: `${percent}%` }"
      />
    </div>
  </div>
</div>
```

**`sticky top-0`** 이므로 스크롤 시 AppBar 아래에 붙어 따라온다.
⚠️ AppBar가 `z-[100]`, 진행률 바가 `z-10`이므로 AppBar 아래로 지나간다. 의도된 계층이다.

### 카테고리 아코디언 (`FireInspectionCategory` 131줄)

**헤더 (`<button>`)** — `relative flex w-full items-center justify-between gap-3 px-3 py-5 text-left`

| 요소          | 값                                                                                                                                                                      |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 번호 배지     | `h-5 w-5 shrink-0 rounded pretendard-12Bold` · 완료 `bg-brand-default-background-brand` / 미완료 `bg-defaults-tertiary-icon-tertiary`, 글자는 둘 다 `text-base-b-white` |
| 카테고리명    | `pretendard-16SemiBold`                                                                                                                                                 |
| 도움말 아이콘 | `description`이 있을 때만 · `/assets/images/자가점검표/Info.svg` · `min-h-5 min-w-5` · `-ml-1`                                                                          |
| 진행 `(n/m)`  | `pretendard-13Medium` · 꽉 차면 `text-brand-default-text-brand`, 아니면 `text-defaults-tertiary-text-tertiary` · `-ml-1`                                                |
| `해당없음`    | `<input type="checkbox" class="h-4 w-4 rounded border-defaults-tertiary-border-tertiary">` + 라벨 `pretendard-13Medium`                                                 |
| 화살표        | `/assets/icons/ChevronDown.svg` · `h-5 w-5 transition-transform duration-200` · 펼침 시 `rotate-180`                                                                    |

**본문** — `v-show="isExpanded"` · `flex flex-col gap-6 border-t border-defaults-tertiary-border-tertiary px-5 py-6`

> ⚠️ **`v-show`다 (`v-if`가 아니다).** 접힌 카테고리의 항목도 DOM에 남아 있다 —
> 이미지 21개가 처음부터 전부 로드된다. React에서 `hidden`으로 옮기면 등가,
> 조건 렌더로 바꾸면 **이미지 로딩 시점이 달라진다.** → `hidden` 유지 권장
>
> 🔴 **`<button>` 안에 `<label>`·`<input type="checkbox">`·툴팁 `<button>`이 들어 있다.**
> HTML 명세 위반(interactive content 중첩)이고 스크린리더가 헤더를 읽지 못한다.
> `@click.stop` + `event.stopPropagation()` 이중 방어로 동작만 맞춰놨다.
> **등가 이관하되 타깃에서는 헤더를 `<div role="button">`으로 바꿔도 화면은 같다.** → `F-Q10`
>
> ⚠️ **컨테이너가 `overflow-visible`이다** (툴팁이 카드 밖으로 나가야 하므로).
> F4의 같은 카드는 `overflow-hidden`이다 — **비대칭이지만 각각 맞다.**

### 항목 (`FireInspectionItem` 83줄)

```
[이미지 슬라이더]         ← hasImages(item)일 때만
[항목 라벨] [도움말?]      ← tooltipText 있을 때만 아이콘
[설명 문구]
[불량] [정상]             ← InputRadioList
```

| 요소    | 클래스                                                                            |
| ------- | --------------------------------------------------------------------------------- |
| 래퍼    | `flex flex-col gap-3`                                                             |
| 라벨 행 | `relative flex items-center gap-1` (툴팁 absolute 기준)                           |
| 라벨    | `text-defaults-primary-text-primary pretendard-18SemiBold`                        |
| 도움말  | `h-[18px] w-[18px] shrink-0 cursor-pointer`                                       |
| 설명    | `text-defaults-secondary-text-secondary pretendard-16Regular`                     |
| 라디오  | `InputRadioList` `show-checkbox` `round-type="round-square"` `custom-class="p-4"` |

### 이미지 슬라이더 (`FireInspectionItemImage` 54줄)

| 요소      | 클래스                                                                           |
| --------- | -------------------------------------------------------------------------------- |
| 이미지    | `min-h-[200px] w-full rounded-xl object-contain`                                 |
| 좌 화살표 | `absolute left-2 top-1/2 -translate-y-1/2` · `ArrowFrameCaretLeft.svg` `h-8 w-8` |
| 우 화살표 | `absolute right-2 top-1/2 -translate-y-1/2` · `ArrowFrameCaretRight.svg`         |

**화살표는 `images.length > 1`일 때만** = `itemId: 14` 하나. 인디케이터(점)는 없다.

### 툴팁 (`FireInspectionTooltip` 47줄)

| 요소     | 값                                                                                                                        |
| -------- | ------------------------------------------------------------------------------------------------------------------------- |
| 컨테이너 | `absolute z-20 rounded-lg bg-defaults-primary-background-primary-inverse p-[12px]` + `positionClass`                      |
| 라벨     | **`어디에 있나요?`** (prop 기본값, 어디서도 덮어쓰지 않는다) · `text-defaults-tertiary-text-tertiary pretendard-14Medium` |
| 닫기     | `CloseBold.svg` `h-3 w-3` — `$emit('close', $event)`                                                                      |
| 본문     | **`!leading-5`** + `text-defaults-primary-text-primary-inverse pretendard-14Regular`                                      |

**`positionClass` 2종**

| 호출부                   | 값                                   |
| ------------------------ | ------------------------------------ |
| `FireInspectionCategory` | `inset-x-3 top-full mt-1`            |
| `FireInspectionItem`     | `left-0 top-full mt-1 max-w-[300px]` |

⚠️ **닫기 버튼이 `$event`를 함께 emit한다.** 부모가 `toggleTooltip(id, $event)`로 받아
`event.stopPropagation()`을 호출하기 때문이다. **이 결합을 끊으면 카테고리 툴팁을 닫을 때
아코디언이 함께 토글된다.** 이관 시 주의.

### 🔴 라디오 선택 상태에 배경색이 안 나온다

`InputRadioList`의 선택 클래스에 `bg-brand-default-background-brand-secondary`가 있는데,
**이 클래스는 레거시 Tailwind config에서 생성되지 않는다** (`broken-styles.md` §5).

```js
currentValue === radio?.key
  ? 'bg-brand-default-background-brand-secondary border-brand-default-border-brand text-brand-default-text-brand pretendard-14SemiBold'
  : '... bg-defaults-secondary-background-mono ...'
```

즉 **선택된 항목은 배경이 없는 상태**(부모 흰색)로, 미선택은 `background-mono` 회색으로 보인다.
테두리·글자색·체크박스 이미지로 구분된다.

✅ **2026-07-30 확정 — `bg-primary-pc-indigo-50`(`#E6EBF9`)으로 매핑한다** (`broken-styles.md` §5).
**소방점검이 이 클래스의 최대 사용처다**(21개 항목 × 2옵션).

🔴 **이관 후에는 선택된 항목에 연한 브랜드 파랑 배경이 생긴다** — 지금은 배경이 없다.
**F4(상세)는 `:disabled="true"`의 `bg-[#e7e7e7] opacity-50`과 클래스 충돌이 되므로
비활성 라디오의 최종 배경을 실기기에서 확인해야 한다.**

⚠️ `InputRadioList`의 루트가 **`<li role="group">`** 인데 `<ul>`/`<ol>` 밖에서 쓰인다.
F2a·F4 모두 그렇다. 무해하지만 타깃에서는 `<div role="radiogroup">`으로 바꾼다.

### QA 체크리스트 (F2a)

- [ ] 진입 시 **모든 카테고리가 접혀 있다**, 진행률 0%
- [ ] 카테고리 헤더 클릭 → 펼침, 화살표 180° 회전
- [ ] 미완료 카테고리 2개를 연달아 펼치면 **둘 다 펼쳐진 상태로 남는다**
- [ ] 카테고리를 다 채운 뒤 다른 카테고리를 펼치면 **완료된 것이 자동으로 접힌다**
- [ ] 번호 배지가 완료 시 파랑, 미완료 시 회색
- [ ] `(n/m)` 카운터가 꽉 차면 파랑으로 바뀐다
- [ ] `해당없음` 체크 → 아코디언이 접히고 다시 열 수 없다, 카운터가 `(m/m)`
- [ ] `해당없음` 해제 → **그 카테고리의 응답이 모두 사라진다** (`F-Q5`)
- [ ] 2번 카테고리(자동확산소화기)만 헤더에 도움말 아이콘 → 툴팁 `어디에 있나요?` + `보일러가 설치된 장소의 천장`
- [ ] 3번 카테고리의 2개 항목만 항목 도움말 아이콘 → 툴팁
- [ ] 카테고리 툴팁은 **하나만**, 항목 툴팁은 **여러 개 동시**로 열린다
- [ ] 툴팁 닫기 버튼을 눌러도 아코디언이 토글되지 않는다
- [ ] `itemId: 14`(완강기 외형)에만 좌우 화살표, 순환 동작
- [ ] `itemId: 5·15·17`에는 이미지가 없다
- [ ] 21개 전부 선택 → 100%, `다음` 파랑 활성
- [ ] 20개 선택 → **95%**

---

## F2b — 입주민 서명 (`FireInspectionSignature` 171줄)

### 표시

```
입주민 확인 서명                          ← pretendard-20Bold
작성한 자가점검 내용이 관리자에게 제출되며
점검내용은 2년 동안 유효합니다.            ← pretendard-14Regular

        2026년 7월 30일                   ← 중앙
        (동/호)                           ← 🔴 항상 비어 있다

┌──────────────────────────┐
│                          │
│    여기에 서명해주세요.    │  ← h-[240px] 캔버스
│                          │
└──────────────────────────┘
        [다시 작성]                        ← 서명 후에만
```

| 요소        | 클래스                                                                                                                |
| ----------- | --------------------------------------------------------------------------------------------------------------------- |
| 래퍼        | `flex flex-1 flex-col overflow-auto px-5 pb-5 pt-16`                                                                  |
| 날짜/주소   | `mt-8 flex flex-col items-center gap-1`                                                                               |
| 캔버스 영역 | `relative mt-6 h-[240px]`                                                                                             |
| 캔버스      | `h-full w-full rounded-xl border border-defaults-tertiary-border-tertiary bg-defaults-secondary-background-secondary` |
| 안내 문구   | `pointer-events-none absolute inset-0 flex items-center justify-center`                                               |
| 다시 작성   | `rounded-lg border ... bg-base-b-white px-6 py-2 pretendard-14Medium`                                                 |

⚠️ **래퍼가 `pt-16`(64px)이다.** F2a는 `pt-12`(48px). AppBar는 48px이므로 서명 화면만 16px 더 띄운다.

### 🔴 동/호가 항상 비어 있다

```js
const props = defineProps({
  dong: { type: String, default: '' },
  ho: { type: String, default: '' },
})
const address = computed(() => (props.dong && props.ho ? `${props.dong}동 ${props.ho}호` : ''))
```

```html
<!-- FireInspectionProcessView — prop을 넘기지 않는다 -->
<FireInspectionSignature @complete="handleSignatureComplete" />
```

**`dong`·`ho`를 아무도 넘기지 않으므로 주소 줄이 렌더되지 않는다.**
`authStore.getAptInfo()`에 동·호 정보가 있는데도 배선이 빠졌다.
공식 서명 문서에 세대 식별이 없는 셈이다. → `F-Q12`

### 날짜

```js
const today = new Date()
const formattedDate = `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일`
```

**월/일에 zero-pad가 없다** — `2026년 7월 5일`. `formatObjectDate(_, 'korean')`은 pad를 하므로
**공용 유틸을 쓰면 표시가 달라진다.** 이 문자열 조립을 그대로 옮긴다.

### 캔버스 구현

```js
onMounted(() => {
  const canvas = canvasRef.value
  if (canvas) {
    ctx = canvas.getContext('2d')
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * window.devicePixelRatio
    canvas.height = rect.height * window.devicePixelRatio
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
    ctx.strokeStyle = '#1F2937' // ← 하드코딩 hex (neutral-b-gray-800 계열)
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
  }
})
```

**이벤트 6종**: `mousedown` `mousemove` `mouseup` `mouseleave` / `touchstart` `touchmove` `touchend`

```js
const getCoordinates = (e) => {
  const rect = canvasRef.value.getBoundingClientRect()
  if (e.touches) return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top }
  return { x: e.clientX - rect.left, y: e.clientY - rect.top }
}
```

- `startDrawing`/`draw`가 `e.preventDefault()`로 스크롤을 막는다
- **`draw`에서만 `hasSignature = true`** — 탭만 하면(이동 없이) 서명으로 인정되지 않는다
- `stopDrawing`이 `canvas.toDataURL('image/png')`로 **매번 emit**한다 (mouseup·mouseleave·touchend)
- `clearSignature`는 `emit('complete', null)` → 부모 `signatureData = null` → `완료` 버튼 비활성

⚠️ `clearSignature`가 `ctx.clearRect(0, 0, canvas.width, canvas.height)`인데 `ctx`는 이미
`dpr`로 스케일돼 있다. **실제 지워지는 영역이 dpr배 크다** — 캔버스보다 넓으므로 결과는 정상이다.

⚠️ **`onUnmounted` 정리가 없다.** 이벤트가 템플릿 바인딩이라 Vue가 정리한다.
React에서도 JSX 이벤트로 옮기면 동일하다.

### 제출

```js
const handleSubmit = () => {
  const signatureFile = base64ToFile(signatureData.value, 'signature.png')
  const questionAnswerList = buildQuestionAnswerList()
  submitInspectionResult({
    householdFireInspectionUuid: householdFireInspectionUuid.value,
    signatureFile,
    questionAnswerList,
  })
}
```

**`base64ToFile`** (`lib/utils/base64ToFile.js`) — data URL → `File`.
MIME은 base64 **magic prefix**로 판별한다 (`/9j/` → jpeg, `iVBO` → png, 그 외 jpeg).
캔버스가 항상 PNG를 주므로 `iVBO` 분기만 타지만 **유틸은 그대로 이식**한다
(`VoteView`의 `CanvasSign`도 같은 유틸을 쓴다).

파일명은 **`'signature.png'` 고정**이다.

### 🔴 `CanvasSign`과 중복 구현이다

Vote 도메인의 `components/common/CanvasSign.vue`가 같은 일을 한다.
**소방점검은 그것을 쓰지 않고 자체 구현했다.**

|           | Vote `CanvasSign` | FireInspection `FireInspectionSignature` |
| --------- | ----------------- | ---------------------------------------- |
| 위치      | 공용 컴포넌트     | 도메인 내부                              |
| 표시      | 모달 안           | **화면 단계 하나**                       |
| 부가 표시 | 없음              | **날짜 · 동/호(미배선)**                 |
| 지우기    | 있음              | `다시 작성`                              |

**등가 이관 원칙상 지금은 통합하지 않는다.** 두 화면이 다르게 생겼기 때문이다.
공용 `SignaturePad`를 만들고 **각 화면이 다른 껍데기를 씌우는 방식**을 권한다. → `F-Q13`

### QA 체크리스트 (F2b)

- [ ] `다음` → 서명 화면, AppBar 제목은 **`자가점검표 작성` 그대로**
- [ ] 진입 시 `여기에 서명해주세요.` 안내, `완료` 버튼 회색 비활성
- [ ] 날짜가 `2026년 7월 30일` 형식 (**월/일 zero-pad 없음**)
- [ ] **동/호는 표시되지 않는다** (`F-Q12`)
- [ ] 손가락으로 그리면 선이 그려지고 안내 문구가 사라진다
- [ ] 그리는 중 화면이 스크롤되지 않는다
- [ ] 선을 그으면 `다시 작성` 버튼이 나타나고 `완료`가 파랑 활성
- [ ] `다시 작성` → 캔버스 비워지고 `완료` 다시 비활성
- [ ] 탭만 하고 움직이지 않으면 서명으로 인정되지 않는다
- [ ] AppBar 뒤로가기 → **점검표 단계로 돌아가고 입력이 유지된다**
- [ ] `완료` → 제출 → F3 (버튼 비활성, **스피너 없음**)
- [ ] 제출 실패 4종 → 각 문구 모달 (`점검 기간이 아닙니다.` 등)

---

## F3 — 점검 완료 (`FireInspectionCompleteView` 60줄)

```
┌────────────────────────────┐
│ AppBar 자가점검표 작성 (뒤로가기 없음)
├────────────────────────────┤
│                            │
│         ✓ (초록 원)         │  ← h-20 w-20, 인라인 <svg> 체크
│   점검이 완료되었습니다      │  ← pretendard-24Bold
│  소방 자가 점검이 성공적으로 제출되었습니다.
│  점검 내역에서 결과를 확인할 수 있습니다.
│                            │
├────────────────────────────┤
│      홈으로 돌아가기         │
└────────────────────────────┘
```

| 요소      | 클래스                                                                                                     |
| --------- | ---------------------------------------------------------------------------------------------------------- |
| AppBar    | `<AppBar title="자가점검표 작성" :has-back-button="false" />`                                              |
| 콘텐츠    | `flex flex-1 flex-col items-center justify-center px-5 pt-12`                                              |
| 아이콘 원 | `h-20 w-20 rounded-full bg-alerts-success-background-success-secondary`                                    |
| 체크      | **인라인 `<svg>`** 40×40 · `stroke="currentColor"` `stroke-width="3"` · `text-alerts-success-text-success` |
| `<h1>`    | `mt-6 pretendard-24Bold` → `점검이 완료되었습니다`                                                         |
| 설명      | `mt-2 text-center text-defaults-tertiary-text-tertiary pretendard-14Regular`                               |
| 버튼 영역 | `px-5 pb-8`                                                                                                |

> ⚠️ **코드베이스에서 거의 유일한 인라인 `<svg>`다.** 나머지는 전부 `/assets/icons/*.svg` `<img>`다.
> `currentColor` + 토큰 클래스로 색을 받으므로 **인라인이어야 동작한다.** 그대로 옮긴다.
>
> ⚠️ **뒤로가기 버튼이 없다.** `AppBar`의 `hasBackButton` 기본값이 `true`인데 명시적으로 `false`를 넘겼다.
> 게다가 라우터 가드가 `/fire-inspection/complete`에서의 **popstate 뒤로가기까지 차단**한다.
> **이중 차단을 둘 다 이관한다.**

### 🔴 `홈으로 돌아가기`가 인트로를 경유한다

```js
const handleGoToHome = () => {
  navigateTo('/')
}
```

`/` → `children[0].redirect: { name: '인트로' }` → **`/intro`**.
그런데 `router.beforeEach`가 `to.meta.requiresAuth === false && hasAptInfo && hasAccessToken`이면
`getLoginInfo()`를 호출하고 `nativeSendInitialResidentInfo(...)`를 보낸 뒤 `{ name: '메인' }`으로 보낸다.

**결과적으로 메인에 도착하지만, 경로가 3홉이고 부작용이 2개 붙는다.**

| 부작용                                                         | 영향                                  |
| -------------------------------------------------------------- | ------------------------------------- |
| `getLoginInfo()` 추가 호출                                     | 불필요한 API 1회                      |
| `nativeSendInitialResidentInfo` 재전송                         | 앱에 초기 입주민 정보를 다시 보낸다   |
| 🔴 `getLoginInfo()` 실패 시 `authStore.clearAuth()` + `/intro` | **네트워크 순간 단절로 로그아웃된다** |

**Vote·Survey의 완료 화면은 `navigateTo('/main')`으로 직행한다.** 소방만 `'/'`를 쓴다.
`'/'`는 회원가입·비밀번호 변경처럼 **인증 정보를 새로 세우는 흐름**에서 쓰는 경로다.

**등가 이관 원칙상 화면 결과(메인 도착)는 같으므로 `'/'`를 유지할 수도 있으나,
로그아웃 리스크가 실재한다.** → `F-Q14`

### QA 체크리스트 (F3)

- [ ] 제출 성공 후 자동 진입, AppBar에 **뒤로가기 아이콘이 없다**
- [ ] 초록 원 + 체크 아이콘, `점검이 완료되었습니다`
- [ ] 하드웨어/브라우저 뒤로가기가 **막힌다** (라우터 가드)
- [ ] `홈으로 돌아가기` → 메인 화면 (`F-Q14` 결정에 따라 경로가 달라질 수 있다)
- [ ] 메인 진입 후 F1의 카드가 `점검완료`로 갱신돼 있다 (invalidate 확인)

---

## F4 — 점검 상세 (`FireInspectionHistoryDetailView` 164줄)

**제출된 점검을 읽기 전용으로 재현한다.** F2a와 같은 아코디언 구조지만 별도 구현이다.

### 셸

```html
<div class="bg-base-b-white flex h-full w-full flex-col">
  <AppBar :title="appBarTitle" />
  <div class="flex flex-1 flex-col overflow-auto pt-12">
    <SpinnerDots v-if="isInspectionDetailLoading" />
    <template v-else-if="inspectionDetail"> ... </template>
  </div>
</div>
```

```js
const appBarTitle = computed(() => {
  const dateTime = get(inspectionDetail.value, 'submissionDateTime')
  return dateTime ? `${formatIsoStringDate(dateTime).dotDate()} 점검 상세` : '점검 상세'
})
```

**AppBar 제목이 동적이다** — `2026.07.15 점검 상세`. 로딩 중에는 `점검 상세`.
**라우트 meta로는 불가능하므로 뷰가 `AppBar`를 직접 든 이유다.**

🔴 **`v-else-if="inspectionDetail"`에 `v-else`가 없다.** 조회 실패/빈 응답이면
**AppBar만 있는 흰 화면**이 된다. 에러 UI가 없다. → `F-Q15`

### 아코디언 — F2a와 기본값이 반대다

```js
const expandedCategories = ref({})
const toggleCategory = (categoryId) => {
  expandedCategories.value[categoryId] = !get(expandedCategories.value, categoryId, true)
}
const isCategoryExpanded = (categoryId) => get(expandedCategories.value, categoryId, true)
```

**기본값이 `true`** — 진입 시 **10개 카테고리가 전부 펼쳐져 있다.**
F2a는 전부 접힌 상태로 시작한다. **의도된 차이다** (조회 화면이므로 한눈에 보이게).

⚠️ 아코디언 **자동 접기 로직이 없다.** 여러 개가 동시에 펼쳐진다.

### 해당없음 카테고리 판정

```js
const getItemAnswer = (questionId) => {
  const answerList = get(inspectionDetail.value, 'questionAnswerList', [])
  return get(find(answerList, { questionId }), 'answer', null)
}

const isCategoryNotApplicable = (category) =>
  every(
    category.items,
    (item) => getItemAnswer(item.questionId) === FIRE_INSPECTION_ANSWER.NOT_APPLICABLE,
  )
```

**항목 전체가 `NOT_APPLICABLE`이면 카테고리를 "해당없음"으로 본다.**
그 카테고리는 **칩만 보이고 아코디언이 잠긴다** (화살표도 안 보인다).

⚠️ **`getItemAnswer`가 렌더마다 `find`를 반복한다.** 카테고리 10개 × 항목 21개 × `answerList` 21개.
규모가 작아 문제는 없으나 타깃에서는 `questionId → answer` Map을 한 번 만든다 (등가).

### 카테고리 카드

| 요소          | 값                                                                                                      |
| ------------- | ------------------------------------------------------------------------------------------------------- |
| 카드          | `overflow-hidden rounded-xl border border-defaults-tertiary-border-tertiary` (F2a는 `overflow-visible`) |
| 헤더          | `flex w-full items-center justify-between px-5 py-4` (F2a는 `px-3 py-5`)                                |
| 번호 배지     | **항상 `bg-brand-default-background-brand`** (완료/미완료 분기가 없다)                                  |
| 카테고리명    | **`pretendard-18Medium`** (F2a는 `16SemiBold`)                                                          |
| 도움말 아이콘 | `description`이 있을 때 표시되지만 **클릭 핸들러가 없다** — 툴팁이 뜨지 않는다 🔴                       |
| `해당없음` 칩 | `ChipBase color="gray" variant="fill"`                                                                  |
| 화살표        | 해당없음이 **아닐 때만** 표시                                                                           |
| 항목 라벨     | **`pretendard-16SemiBold`** (F2a는 `18SemiBold`)                                                        |
| 라디오        | `InputRadioList` + **`:disabled="true"`**                                                               |

> 🔴 **F4의 도움말 아이콘은 장식이다.** `@click`이 없어 눌러도 아무 일이 없다.
> F2a에서 복사하면서 툴팁 배선을 빼먹은 것으로 보인다. → `F-Q16`
>
> ⚠️ **F2a와 F4의 타이포·패딩이 서로 다르다** (위 표의 굵은 항목 4개).
> 같은 점검표인데 글자 크기가 다르다. **각각 그대로 옮긴다.**

### 🔴 비활성 라디오가 선택 여부를 배경으로 구분하지 못한다

`InputRadioList`의 `disabled` 분기가 `bg-[#e7e7e7] opacity-50`을 준다.
선택 분기의 `bg-brand-default-background-brand-secondary`는 **존재하지 않는 클래스**이므로
**선택/미선택 모두 `#e7e7e7` 배경 + 50% 투명도**가 된다.

구분되는 것은 **테두리 색 · 글자 색 · 체크박스 이미지** 세 가지뿐이고, 전부 `opacity-50`을 통과한다.

즉 **제출한 점검 결과를 읽기 어렵다.** `F-Q11`과 같은 뿌리다. → `F-Q11`

⚠️ `bg-[#e7e7e7]`는 하드코딩 hex다. `broken-styles.md` 대상은 아니지만 토큰이 아니다.

### QA 체크리스트 (F4)

- [ ] AppBar 제목이 `2026.07.15 점검 상세`
- [ ] 진입 시 **10개 카테고리가 전부 펼쳐져 있다**
- [ ] 번호 배지가 **전부 파랑** (F2a와 달리 회색이 없다)
- [ ] 카테고리명 글자 크기가 F2a보다 작다 (`18Medium` vs `16SemiBold`)
- [ ] 항목 전체가 `해당없음`인 카테고리 → 회색 `해당없음` 칩, 화살표 없음, 열리지 않는다
- [ ] 라디오가 전부 비활성 (회색 + 반투명), 선택된 쪽은 체크박스 이미지·테두리·글자색으로만 구분
- [ ] 2번 카테고리 도움말 아이콘을 눌러도 **아무 일도 일어나지 않는다** (`F-Q16`)
- [ ] 조회 실패 시 **빈 흰 화면** (`F-Q15`)

---

## 타깃 슬라이스 구조 (제안)

```
src/features/fireInspection/
├── api/
│   └── fireInspection.ts               # 3개
├── queries/
│   ├── fireInspectionQueries.ts         # status · detail queryOptions
│   └── useSubmitFireInspection.ts        # multipart POST
├── hooks/
│   └── useFireInspectionForm.ts          # composable 1:1 이식
├── context/
│   └── FireInspectionFormContext.tsx     # props drilling 제거
├── components/
│   ├── FireInspectionHeader.tsx
│   ├── FireInspectionStatusCard.tsx
│   ├── FireInspectionStartModal.tsx
│   ├── FireInspectionProgress.tsx
│   ├── FireInspectionCategory.tsx
│   ├── FireInspectionItem.tsx
│   ├── FireInspectionItemImage.tsx
│   ├── FireInspectionTooltip.tsx
│   └── FireInspectionSignature.tsx
├── pages/
│   ├── FireInspectionPage.tsx            # F1
│   ├── FireInspectionProcessPage.tsx     # F2a + F2b
│   ├── FireInspectionCompletePage.tsx    # F3
│   └── FireInspectionDetailPage.tsx      # F4
├── constants/
│   └── fireInspection.ts                 # 308줄 그대로 (TS 타입 부여)
├── types/
│   └── fireInspection.ts
└── index.ts
```

### `shared`로 올릴 것

| 항목                  | 이유                                                               |
| --------------------- | ------------------------------------------------------------------ |
| `base64ToFile`        | Vote `CanvasSign`도 쓴다 → `shared/utils/`                         |
| `SignaturePad` (신규) | Vote 모달판 + 소방 화면판의 공통 코어. **껍데기는 각자** (`F-Q13`) |
| `RadioList`           | `InputRadioList` 대체. **vee-validate 결합을 떼고** RHF와 분리     |
| `Chip`                | `ChipBase`                                                         |
| `Accordion`           | F2a·F4 + 다른 도메인. 단 **자동 접기 규칙은 소방 전용**            |
| `calculateDday`       | 이미 공용 유틸                                                     |

### 상수 타입화

```ts
// as const로 두고 타입을 뽑는다 (enum 금지)
export const FIRE_INSPECTION_ANSWER = {
  NORMAL: 'NORMAL',
  DEFECTIVE: 'DEFECTIVE',
  NOT_APPLICABLE: 'NOT_APPLICABLE',
} as const
export type FireInspectionAnswer =
  (typeof FIRE_INSPECTION_ANSWER)[keyof typeof FIRE_INSPECTION_ANSWER]
```

`INSPECTION_CATEGORIES`도 `as const satisfies InspectionCategory[]`로 두면
`questionId` 유니온이 자동으로 생겨 **제출 페이로드가 타입 안전해진다.** 레거시에 없던 이득이다.

---

## 이관 순서 — 1개 PR

| PR      | 범위       | 선행                                                           |
| ------- | ---------- | -------------------------------------------------------------- |
| **F-1** | F1~F4 전체 | Phase 4 (`AppBar`·`Chip`·`RadioList`·`ErrorModal`·라우터 가드) |

**쪼개지 않는다.** 화면 4개가 작고, F2a/F2b/F4가 같은 상수·같은 아코디언 로직을 공유한다.

> **`lodash` 의존을 이 PR에서 정리한다.** 8개 함수(`every` `filter` `forEach` `get` `isEmpty`
> `size` `sumBy` `find`)가 전부 **표준 JS로 대체 가능**하다 — 옵셔널 체이닝·`Object.keys().length`·
> `Array.prototype.*`. **`lodash-es` 추가 없이 이관할 수 있다.** → `tech-mapping.md` 3-5 반영

---

## 반드시 지켜야 할 것

1. **`INSPECTION_CATEGORIES` 21개 항목의 `sectionId`·`groupId`·`questionId`를 한 글자도 바꾸지 않는다.**
   서버 enum이다. `PARKING_EXTINGUISHER`(주방 카테고리)도 그대로 둔다.
2. **`FormData` 키 형식 `questionAnswerList[N].field`를 유지한다.** Spring 바인딩이다.
3. **라디오 순서는 `불량` → `정상`.**
4. **`NOT_APPLICABLE`은 카테고리 체크박스로만 설정된다.** 라디오에 3번째 옵션을 넣지 않는다.
5. **아코디언 자동 접기는 "완료된 다른 카테고리"만 대상이다.** 단일 오픈으로 바꾸지 않는다.
6. **`해당없음` 해제 시 그 카테고리의 응답을 전부 지운다** (`F-Q5` 결정 전까지).
7. **F2a는 전부 접힌 상태, F4는 전부 펼친 상태로 시작한다.**
8. **F2a와 F4의 타이포·패딩이 다르다.** 통일하지 않는다.
9. **접힌 카테고리는 `v-show`(=`hidden`)다.** 조건 렌더로 바꾸면 이미지 로딩 시점이 달라진다.
10. **툴팁 정책이 카테고리(하나만)와 항목(여러 개)에서 다르다.**
11. **툴팁 닫기가 `event`를 부모로 올려 `stopPropagation`을 호출한다.** 이 결합을 끊으면 아코디언이 토글된다.
12. **서명은 "이동이 있어야" 인정된다** (탭만으로는 안 된다).
13. **서명 날짜에 zero-pad가 없다** — `2026년 7월 5일`.
14. **F3에 뒤로가기가 없고, 라우터 가드가 popstate까지 막는다.** 둘 다 이관한다.
15. **제출 에러 4종 문구를 그대로 쓴다** (마침표 포함). 나머지는 서버 `message`.
16. **F4 AppBar 제목은 제출일 + `점검 상세`** 이고 로딩 중엔 `점검 상세`다.
17. **`invalidateQueries`는 이미 v5 객체 형식이다.** 되돌리지 않는다.
18. **`navigateReplace` → `invalidateQueries` 순서를 유지한다.**

---

## 정리해도 되는 것 (등가 영향 없음)

| 항목                                                                               | 근거                                           |
| ---------------------------------------------------------------------------------- | ---------------------------------------------- |
| `FireInspectionSignature`의 `dong`/`ho` prop                                       | 아무도 넘기지 않는다 (`F-Q12` 결정에 종속)     |
| `useGetFireInspectionStatus`의 `refetchInspectionStatus`                           | 호출부 0곳                                     |
| `useGetFireInspectionDetail`의 `normalCount`·`defectiveCount`·`notApplicableCount` | 사용처 0곳                                     |
| `FireInspectionView.handleStartInspection`의 상태 가드                             | 버튼이 이미 비활성 — 중복 방어                 |
| `categoryNumber` (= `categoryId`와 항상 동일)                                      | 중복 필드                                      |
| `getItemImages`의 폴백 이미지 경로                                                 | 매핑 누락이 0개라 도달 불가                    |
| `FireInspectionStatusCard`의 `useRouter` 직접 사용                                 | 도메인 내 유일 — `useNavigate`로 통일          |
| `useGetFireInspectionDetail` `select`의 `'NORMAL'` 문자열 리터럴                   | `FIRE_INSPECTION_ANSWER` 상수로                |
| `getCategoryProgress`의 `isNotApplicable ? total : ...` 분기                       | 두 값이 항상 같다                              |
| `FireInspectionTooltip`의 `label` prop                                             | 기본값 `어디에 있나요?`만 쓰인다               |
| `<li role="group">` (`InputRadioList` 루트)                                        | 리스트 밖에서 쓰인다 → `div role="radiogroup"` |
| `<button>` 안의 중첩 인터랙티브 요소                                               | `div role="button"`으로 (`F-Q10`)              |
| `lodash` 8개 함수                                                                  | 표준 JS로 대체 가능                            |

---

## 스타일

| 항목                                          | 상태                                                                                                          |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `bg-brand-default-background-brand-secondary` | ✅ **`bg-primary-pc-indigo-50`(`#E6EBF9`)로 확정** (`broken-styles.md` §5). **이 도메인이 최대 사용처**(21×2) |
| `bg-[#e7e7e7]` (`InputRadioList` disabled)    | 하드코딩 hex. 토큰 아님 → `deferred.md`                                                                       |
| `#1F2937` (서명 캔버스 `strokeStyle`)         | JS 하드코딩 hex. `neutral-b-gray-800` 계열                                                                    |
| `!bg-alerts-*-primary` (F1 카드 칩)           | `ChipBase` 기본을 `!important`로 덮는다. 최종 색만 맞추면 된다                                                |
| `!leading-5` (툴팁 본문)                      | `pretendard-14Regular`의 line-height를 덮는다                                                                 |
| 그 외 클래스                                  | ✅ `broken-styles.md` 26개 중 이 도메인 고유 항목은 **없다**                                                  |

---

## 확인 필요 (`F-Q*`)

| #         | 질문                                                                                                                                                                               | 관련     |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| F-Q1      | F2의 서명 단계가 라우트가 아니다. **하드웨어 뒤로가기로 이탈하면 점검 내용이 사라진다.** 이탈 확인 모달을 넣는가                                                                   | F2       |
| F-Q2      | 3번 카테고리 항목 `description`이 **"주차장 소화장치"** 라고 잘못 적혀 있다(카테고리는 주방). 화면에 보이는 문구인데 고치는가                                                      | §1       |
| F-Q3      | 이미지 경로에 한글이 들어 있다. 배포 환경에서 문제된 적이 있는가                                                                                                                   | §1       |
| F-Q4      | 타깃 `apiClient`가 `Content-Type: multipart/form-data` 명시 + `FormData` 조합을 그대로 처리하는가                                                                                  | §2       |
| F-Q5      | `해당없음`을 해제하면 **그 카테고리의 응답이 전부 삭제**된다. 의도인가                                                                                                             | §3       |
| F-Q6      | `['fireInspectionStatus']` 키에 `aptResidentUuid`가 없다 → 단지 전환 시 캐시 오염. 추가하는가                                                                                      | §4-1     |
| F-Q7      | `inspectionList[0]`을 최신으로 쓴다. **서버가 최신순 정렬을 보장하는가?**                                                                                                          | F1       |
| F-Q8      | 점검 내역이 0건이면 헤더 버튼이 `점검 기간이 종료되었습니다.`로 나온다. 문구를 바꾸는가                                                                                            | F1       |
| F-Q9      | 시작 모달 아이콘이 **`Link.svg`(링크 아이콘)** 다. 의도인가, 임시인가                                                                                                              | F1       |
| F-Q10     | 카테고리 헤더 `<button>` 안에 체크박스·툴팁 버튼이 중첩돼 있다. `div role="button"`으로 바꾸는가                                                                                   | F2a      |
| ~~F-Q11~~ | ~~라디오 선택 배경색~~ → ✅ **2026-07-30 확정: `bg-primary-pc-indigo-50`(`#E6EBF9`).** 연한 브랜드 틴트 (`broken-styles.md` §5). **F4는 `opacity-50`과 겹치므로 실기기 대조 필요** | F2a · F4 |
| F-Q12     | 서명 화면의 **동/호가 항상 비어 있다** (prop 미배선). 배선하는가                                                                                                                   | F2b      |
| F-Q13     | Vote `CanvasSign`과 소방 서명이 **중복 구현**이다. 공용 `SignaturePad` 코어로 합치는가                                                                                             | F2b      |
| F-Q14     | `홈으로 돌아가기`가 `'/'` → 인트로 → 가드 → 메인으로 **3홉 우회**한다. `getLoginInfo()` 실패 시 **로그아웃된다.** `/main` 직행으로 바꾸는가                                        | F3       |
| F-Q15     | F4 조회 실패 시 **빈 흰 화면**이다. 에러 UI를 추가하는가                                                                                                                           | F4       |
| F-Q16     | F4의 도움말 아이콘에 **클릭 핸들러가 없다** (툴팁이 안 뜬다). 배선하는가, 아이콘을 없애는가                                                                                        | F4       |

---

## 등가 대조 (레거시 :3000 ↔ 신규 :5173, 392px)

| 대조 지점                                                                                           |
| --------------------------------------------------------------------------------------------------- |
| F1 헤더 히어로 이미지 비율 · `rounded-2xl`                                                          |
| F1 카드 칩 4종의 실제 배경색 (`!bg-*-primary` 오버라이드 반영)                                      |
| F1 헤더/내역 사이 8px 회색 띠                                                                       |
| 시작 모달 `rounded-2xl` · 아이콘 원 색 반전 · 버튼 세로 구분선 1px                                  |
| F2a 번호 배지 20×20 · 완료 파랑 / 미완료 회색                                                       |
| F2a 진행률 바 높이 4px · `sticky` 동작 · `duration-300`                                             |
| F2a 카테고리 헤더 `px-3 py-5` vs F4 `px-5 py-4`                                                     |
| F2a 항목 라벨 `18SemiBold` vs F4 `16SemiBold`                                                       |
| **라디오 선택 배경이 연한 브랜드 파랑(`#E6EBF9`)** 인가 · F4는 `opacity-50`과 겹칠 때 판독 가능한가 |
| 라디오 체크박스 아이콘 20×20 (`checkbox-base-on/off.svg`)                                           |
| 툴팁 배경(다크) · `p-[12px]` · `!leading-5` · 위치 2종                                              |
| 이미지 슬라이더 `min-h-[200px]` · 화살표 32×32 위치                                                 |
| F2b 캔버스 240px · 선 두께 2px · 색 `#1F2937` · `lineCap: round`                                    |
| F2b `pt-16` (F2a는 `pt-12`)                                                                         |
| F3 초록 원 80×80 · 인라인 SVG 체크 40×40 · `pretendard-24Bold`                                      |
| F4 비활성 라디오 `opacity-50` 실제 명도                                                             |
| 폰트 배율 5단계에서 F2a 카테고리 헤더가 2줄로 깨지지 않는지                                         |

---

## 회귀 위험 지점

| 지점                         | 위험                                                                                   |
| ---------------------------- | -------------------------------------------------------------------------------------- |
| **props drilling → Context** | composable ref가 자식에서 `.value`로 읽힌다. 옮길 때 `.value` 제거를 빠뜨리기 쉽다     |
| **아코디언 자동 접기**       | "완료된 것만" 접는 규칙. 단일 오픈으로 잘못 구현하면 UX가 달라진다                     |
| **`해당없음` 토글**          | 켜기=전부 `NOT_APPLICABLE`, 끄기=전부 `delete`. 진행률과 직결                          |
| **`v-show` → `hidden`**      | 조건 렌더로 바꾸면 이미지 21개의 로딩 시점이 달라진다                                  |
| **툴팁 이벤트 전파**         | `stopPropagation` 사슬이 3단(닫기 버튼 → 부모 핸들러 → 헤더 버튼)                      |
| **`FormData` 인덱스 키**     | 한 글자만 달라도 서버 바인딩이 전부 실패한다                                           |
| **서명 캔버스 DPR 스케일**   | `canvas.width = rect.width * dpr` + `ctx.scale(dpr, dpr)`. 놓치면 선이 굵거나 흐려진다 |
| **`base64ToFile` MIME 판별** | magic prefix 방식. 캔버스가 PNG를 주는 전제                                            |
| **F3 뒤로가기 이중 차단**    | `hasBackButton={false}` + 라우터 가드. 한쪽만 옮기면 제출 화면으로 되돌아갈 수 있다    |
| **`'/'` 홈 이동**            | 인트로 경유. 가드를 함께 이관하지 않으면 **인트로에서 `clearAuth()`가 실행된다**       |
