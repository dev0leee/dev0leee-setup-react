# 도메인 명세 — 하자보수 (repair)

> 기준 SHA `6d5bf22` · 레거시 `views/RepairView/` 11개 파일 964 LOC
> (상수 60 + 스키마 19 + 스토어 82 + 쿼리 270 + API 92 포함 **총 1,530 LOC**)
> 타깃 슬라이스 `features/repair/`
> API 6개 (`endpoints.md` #131~#136) · 쿼리 훅 6개 · Pinia 스토어 1개 · 라우트 4개

**이 도메인의 가장 큰 특징은 Pinia 스토어 안에 vee-validate `useForm`이 들어 있다는 것이다.**
전역 싱글턴 폼이라 라우트를 벗어나도 값이 남고, 등록/수정 화면이 같은 폼 인스턴스를 공유한다.
계획서 3-3에서 이미 **"RHF `FormProvider`로 분해"** 로 확정된 항목이다.

**두 번째 특징은 결함 밀도다.** 문자열 하나(`'write'` vs `'create'`)가 틀려서
등록 화면의 **제목·모달·복원 경로 3가지가 동시에 잘못 동작**하고, 무한 스크롤 관측 타깃이
템플릿에서 빠져 **2페이지가 아예 로드되지 않는다.**

| 특징                                                    | 의미                                                |
| ------------------------------------------------------- | --------------------------------------------------- |
| **경로에 `aptUuid` + `aptResidentUuid`를 둘 다** 요구   | 레거시 148개 엔드포인트 중 이 도메인만 그렇다       |
| **이미지 업로드 + 업로드 진행률** (`useUploadProgress`) | Board와 함께 유일. Phase 5 레시피 항목              |
| **multipart PATCH** (#136)                              | 수정도 multipart. `fileUuid`로 기존 파일을 유지한다 |
| 네이티브 브릿지 연동 **0건**                            | AptMall·소방·이사예약과 함께 브릿지 독립            |

> ⚠️ **화면 ID는 `RP*`, 확인 항목은 `RP-Q*`를 쓴다.**
> `inventory-questions.md`가 `R-1`~`R-3`을 결정 번호로 쓰고 있어 `R*`을 피한다.

---

## 화면 목록

### 라우트 (`router/RepairIndex.js` — 4개)

| #   | 경로                         | name            | 컴포넌트           | meta                                                         |
| --- | ---------------------------- | --------------- | ------------------ | ------------------------------------------------------------ |
| RP1 | `/repair/list`               | 하자보수 리스트 | `RepairView`       | AppBar `하자보수` · `hasBackButton` · `showBottomNav: false` |
| RP2 | `/repair/create`             | 하자보수 작성   | `RepairWriteView`  | **AppBar `하자보수 접수`** · `hasBackButton`                 |
| RP3 | `/repair/edit/:repairUuid`   | 하자보수 수정   | `RepairEditView`   | `showAppBar: false` · `hasBackButton: false`                 |
| RP4 | `/repair/detail/:repairUuid` | 하자접수 상세   | `RepairDetailView` | `showAppBar: false` · `hasBackButton: false`                 |

**eager 라우트 없음.**

> ⚠️ **RP3·RP4의 `hasBackButton: false`는 아무 효과가 없다.**
> `showAppBar: false`라 레이아웃 AppBar가 렌더되지 않고, 뷰가 직접 든 `<AppBar>`는
> `hasBackButton` 기본값 `true`를 쓴다. → `deferred.md` D-8(apass)과 같은 계열의 무의미한 meta.
>
> ⚠️ **RP2·RP3만 `showBottomNav`를 지정하지 않았다.** `useLayoutConfig`의 `DEFAULT_LAYOUT`이
> `showBottomNav: false`이므로 결과는 같다.

### 진입 경로

| 화면 | 진입 출처                                                |
| ---- | -------------------------------------------------------- |
| RP1  | 메인 메뉴 — `contentName: '하자보수'`, 표시명 `하자보수` |
| RP2  | RP1 `접수하기` 버튼                                      |
| RP3  | RP4 AppBar `수정` 버튼 (**`WAITING` 상태만**)            |
| RP4  | RP1 목록 카드 클릭                                       |

---

## 🔴 1. `'write'` vs `'create'` — 문자열 하나가 3곳을 망친다

```js
// RepairFormContainer.vue
const isWritingPage = computed(() => getCurrentRoutePath().includes('write'))
```

**등록 라우트는 `/repair/create`다.** `'write'`를 포함하지 않는다.
수정 라우트는 `/repair/edit/...`이고 이것도 `'write'`를 포함하지 않는다.

**즉 `isWritingPage`는 두 화면 모두에서 항상 `false`다.**

| 영향                 | 코드                                                           | 결과                                                                           |
| -------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| ① **AppBar 제목**    | `` `하자보수 ${isWritingPage ? '접수' : '수정'}` ``            | 🔴 등록 화면에서도 **`하자보수 수정`** 이라고 표시된다                         |
| ② **뒤로가기 모달**  | `isWritingPage ? WRITE_BACK_MODAL_DATA : EDIT_BACK_MODAL_DATA` | 🔴 등록 중 그만두려면 **`수정 그만두기` / `수정을 그만두시겠습니까?`** 가 뜬다 |
| ③ **폼 초기값 분기** | `const editValues = isWritingPage ? {} : { …newValue }`        | 등록 화면이 "수정 복원" 경로를 탄다 (아래)                                     |

**③의 실제 동작**

```js
watch(
  () => props.repairDetailData,
  (newValue) => {
    const editValues = isWritingPage.value
      ? {}
      : {
          emergencyPhone: formatPhone(newValue?.emergencyPhone), // formatPhone(undefined) → ''
          location: formatHtmlText(newValue?.location), // undefined
          content: formatHtmlText(newValue?.content)?.replaceAll('<br/>', '\n'),
          requirement: formatHtmlText(newValue?.requirement)?.replaceAll('<br/>', '\n'),
          imageList: newValue?.fileList || [], // []
        }
    repairFormStore.setValues({ ...defaultInfo.value, ...editValues })
  },
  { immediate: true },
)
```

등록 화면에서는 `repairDetailData`가 `{}`(prop 기본값)이므로 `emergencyPhone: ''`,
`imageList: []`가 설정되고 나머지는 `undefined`로 덮인다. **결과적으로 빈 폼이 되어 동작한다.**

즉 **③은 우연히 무해하고, ①·②는 사용자에게 그대로 보인다.**

> **가장 작은 수정은 `.includes('create')`로 바꾸는 것**이지만, 그러면 등록 화면의 제목과 모달이
> 바뀌어 **화면이 달라진다.** 등가 이관 원칙과 정면으로 충돌한다. → `RP-Q1`

### 🔴 2. 등록 화면에 AppBar가 2개다

`LayoutAuth`의 DOM 순서:

```html
<AppBar v-if="layoutConfig.showAppBar" … />
<!-- ① 레이아웃 -->
<main :class="… showAppBar ? 'pt-12' : ''">
  <RouterView />
  <!-- ② 뷰가 든 AppBar -->
</main>
```

둘 다 `fixed top-0 z-[100]`이고 **② 가 DOM에서 뒤에 있어 위에 올라온다** (`bg-base-b-white`로 덮는다).

| 화면 | `showAppBar` | 레이아웃 AppBar               | 뷰 AppBar                                 | 결과                                             |
| ---- | ------------ | ----------------------------- | ----------------------------------------- | ------------------------------------------------ |
| RP2  | **`true`**   | `하자보수 접수` (평범한 back) | `하자보수 수정` (`완료` 버튼 + 모달 back) | 🔴 **2개 겹침.** 보이는 건 뷰 것 → 제목이 `수정` |
| RP3  | `false`      | 없음                          | `하자보수 수정`                           | 정상 (제목도 맞다)                               |
| RP4  | `false`      | 없음                          | `하자보수 상세`                           | 정상                                             |

**Vote `VT-Q1` · Survey `SV-Q1`과 같은 계열의 이중 AppBar다.** → `RP-Q2`

### 🔴 3. 수정 화면의 콘텐츠가 AppBar에 가린다

```html
<!-- RepairFormContainer.vue -->
<div class="h-full">
  <AppBar … />
  <!-- fixed h-12 -->
  <div v-else class="h-full w-full space-y-6 overflow-auto p-5">…</div>
  <!-- 🔴 pt-12 없음 -->
</div>
```

| 화면 | `<main>`의 `pt-12`            | 결과                                                                    |
| ---- | ----------------------------- | ----------------------------------------------------------------------- |
| RP2  | ✅ (meta `showAppBar: true`)  | 우연히 정상 — 레이아웃이 48px를 밀어준다                                |
| RP3  | ❌ (meta `showAppBar: false`) | 🔴 **콘텐츠 상단 48px가 AppBar에 덮인다** (`동`/`호수` 라벨이 가려진다) |

`MovingHouseWriteView`·`FireInspectionProcessView`·`RepairDetailView`는 모두 콘텐츠에 `pt-12`를 준다.
**`RepairFormContainer`만 빠졌다.** → `RP-Q3`

### 🔴 4. 무한 스크롤이 동작하지 않는다

```js
// RepairList.vue
const target = ref(null)
const targetIsVisible = ref(false)
useIntersectionObserver(target, ([{ isIntersecting }]) => {
  targetIsVisible.value = isIntersecting
})
watchEffect(() => {
  if (props.hasNextPage && targetIsVisible.value) props.fetchNextPage()
})
```

```html
<ul v-else-if="list?.pageable?.numberOfElements" …>
  <RepairListItem v-for="item in list?.pages" … />
</ul>
<!-- 🔴 ref="target" 요소가 없다 -->
```

**`target`이 영원히 `null`이므로 `targetIsVisible`이 `true`가 되지 않고 `fetchNextPage`가 호출되지 않는다.**

`AptMallMyOrderList`는 `<div ref="target" class="w-full pt-4"></div>`를 목록 끝에 둔다.
**Repair에는 그 줄이 없다.**

**결과: 하자 접수가 11건 이상이어도 첫 10건만 보인다.** `총 N건`은 전체 수를 보여주므로
목록과 개수가 어긋난다.

→ `RP-Q4` (**고치면 화면이 달라진다** — 지금까지 안 보였던 항목이 보이기 시작한다)

---

## 5. Pinia 스토어 안의 vee-validate `useForm` (82줄 전문)

```js
export const useRepairFormStore = defineStore('repairForm', () => {
  const submitHandler = ref(null);                    // 🔴 스토어가 콜백을 든다
  const submitProgressPercent = ref(0);
  const setSubmitHandler = (handler) => { submitHandler.value = handler; };
  const setSubmitProgressPercent = (value) => { submitProgressPercent.value = value; };

  const { defineField, values, errors, meta, isSubmitting, handleSubmit,
          setFieldValue, setValues, resetForm } = useForm({ validationSchema: repairFormSchema });

  const [dong] = defineField('dong');
  const [ho] = defineField('ho');
  const [phone] = defineField('phone');
  const [emergencyPhone] = defineField('emergencyPhone');
  const [location] = defineField('location');
  const [content] = defineField('content');
  const [requirement] = defineField('requirement');
  const [imageList] = defineField('imageList');

  const submitForm = handleSubmit(async (value) => {
    if (submitHandler.value) {
      const formData = {
        location: value.location || null,
        content: value.content || null,
        fileList: values.imageList || [],              // ⚠️ value가 아니라 values(스토어)에서 읽는다
      };
      if (value.emergencyPhone !== undefined && value.emergencyPhone !== '')
        formData.emergencyPhone = value.emergencyPhone?.replaceAll('-', '');
      if (value.requirement !== undefined && value.requirement !== '')
        formData.requirement = value.requirement;

      await submitHandler.value(formData);
      resetForm();
    }
  });
  return { …, submitForm, resetForm, setSubmitHandler, submitProgressPercent, setSubmitProgressPercent };
});
```

### 이 구조가 만드는 결과 6가지

|   # | 결과                                                                                                              |
| --: | ----------------------------------------------------------------------------------------------------------------- |
|   1 | **폼이 전역 싱글턴이다.** 라우트를 떠나도 값이 남는다                                                             |
|   2 | **RP2와 RP3가 같은 폼 인스턴스를 공유한다.** 수정 화면에서 채운 값이 등록 화면에 남을 수 있다                     |
|   3 | `resetForm()`은 **제출 성공 후**와 **`그만두기` 모달**에서만 호출된다                                             |
|   4 | 🔴 **레이아웃 AppBar의 back(RP2) · 하드웨어 back으로 나가면 초기화되지 않는다** → 다음 진입 시 이전 초안이 남는다 |
|   5 | 제출 핸들러를 뷰가 `onMounted`에 주입한다 (`setSubmitHandler`) — **스토어가 mutation 함수를 든다**                |
|   6 | 업로드 진행률도 뷰가 `watch`로 스토어에 밀어 넣는다 (`setSubmitProgressPercent`)                                  |

**타깃에서는 RHF `useForm` + `FormProvider`로 분해한다** (계획서 3-3 확정).
그러면 **폼이 화면 언마운트와 함께 사라진다** — 즉 ④의 "초안이 남는 동작"이 없어진다.

🔴 **이것은 등가성 이탈이다.** 다만 ④는 **버그로 보이는 동작**이므로
"등가 이관"을 그대로 적용하기 어렵다. → `RP-Q5`

### 스키마는 4필드만 검증한다

```js
export const repairFormSchema = toTypedSchema(
  z.object({ emergencyPhone, location, content, requirement }),
)
```

| 필드             | 검증                                                                           | 필수 |
| ---------------- | ------------------------------------------------------------------------------ | ---- |
| `location`       | `min(1)` + `trim` · `위치를 입력해주세요` / `위치를 한 글자 이상 입력해주세요` | ✅   |
| `content`        | `min(1)` · `내용을 입력해주세요` / `내용을 한 글자 이상 입력해주세요`          | ✅   |
| `emergencyPhone` | `union([phone, '', null]).optional()`                                          | ❌   |
| `requirement`    | `union([string.min(1), '', null]).optional()`                                  | ❌   |

🔴 **`dong`·`ho`·`phone`·`imageList`는 스키마에 없다.**
`defineField`로 선언만 되어 있어 **검증도 받지 않고 `meta.valid`에도 영향을 주지 않는다.**
앞 3개는 `disabled` 표시 전용이고 `imageList`는 선택 항목이므로 의도된 것으로 보인다.

⚠️ **`meta.valid`가 `location`·`content` 두 필드로만 결정된다.**

### 제출 페이로드

```js
{ location, content, fileList, emergencyPhone?, requirement? }
```

- `location`·`content`가 빈 값이면 **`null`** 을 보낸다 (검증이 막으므로 실제로는 발생하지 않는다)
- `emergencyPhone`은 **하이픈을 제거**해서 보낸다
- `emergencyPhone`·`requirement`는 값이 있을 때만 키를 만든다
- `dong`·`ho`·`phone`은 **전송하지 않는다** (서버가 `aptResidentUuid`로 안다)

`convertFormDataFile`이 이것을 `FormData`로 바꾼다.

```js
if (key === 'fileList') {
  files.forEach((file, index) => {
    if (file instanceof File) formData.append(`fileList[${index}].file`, file)
    else formData.append(`fileList[${index}].fileUuid`, file?.fileUuid)
    formData.append(`fileList[${index}].orderNum`, index)
  })
} else formData.append(key, data[key])
```

**신규 파일은 `.file`, 기존 파일은 `.fileUuid`로 보낸다.** 수정 시 기존 이미지를 유지하는 방식이다.
`orderNum`은 배열 인덱스다. **키 형식을 한 글자도 바꾸지 않는다** (Spring 바인딩).

---

## 6. 상수 전문 — `constants/domain/repair.js` (60줄)

```js
export const REPAIR_TOAST_MESSAGE = {
  create: '접수되었습니다',
  delete: '취소되었습니다',
  edit: '수정되었습니다',
  image: {
    countLimit: '이미지는 최대 5장까지만 첨부할 수 있습니다',
    sizeLimit: '파일 사이즈는 10M 이하만 업로드 가능 합니다', // ⚠️ '가능 합니다' 띄어쓰기
    fileTypeLimit: 'jpg, jpeg, png, gif만 첨부 가능합니다',
  },
}

export const REPAIR_STATUS_LIST = [
  { status: 'WAITING', label: '접수 대기', color: 'gray' },
  { status: 'RECEIVED', label: '접수 완료', color: 'orange' },
  { status: 'COMPLETED', label: '처리 완료', color: 'blue' },
  { status: 'IMPOSSIBLE', label: '처리 불가', color: 'red' },
]

export const REPAIR_LIST_ITEM_FIELD = [
  { key: 'location', label: '위치' },
  { key: 'content', label: '내용' },
]

export const REPAIR_DETAIL_CONTENT_FIELD = [
  { key: 'receiptNum', label: '접수번호' },
  { key: 'createdDate', label: '접수일시' },
  { key: 'location', label: '위치' },
  { key: 'emergencyPhone', label: '비상연락처' },
  { key: 'content', label: '접수내용' },
  { key: 'requirement', label: '요청사항' },
]

export const REPAIR_DETAIL_ANSWER_FIELD = [
  { key: 'repairState', label: '접수상태' },
  { key: 'visitDateTime', label: '방문일자' },
  { key: 'adminComment', label: '전달사항' },
]

export const REPAIR_DETAIL_MODAL_DATA = {
  title: '하자 접수 취소',
  description: ['접수를 취소하시면 접수 내역이 사라집니다.', '취소하시겠어요?'],
  firstButton: '닫기',
  secondButton: '접수취소',
}

export const REPAIR_DETAIL_NONEDITABLE_MODAL_DATA = (status) => {
  const findStatus = REPAIR_STATUS_LIST.find((item) => item.status === status)
  return {
    title: `${findStatus?.label}`,
    description: `${findStatus?.label}된 접수는 수정할 수 없습니다`,
    firstButton: '확인',
  }
}
```

> ⚠️ **`REPAIR_DETAIL_NONEDITABLE_MODAL_DATA`는 함수형 상수다.** 상태 라벨을 문구에 끼워 넣는다.
> `접수 완료된 접수는 수정할 수 없습니다` / `처리 완료된 접수는 …` / `처리 불가된 접수는 …`
>
> 🔴 **`처리 불가된 접수는 수정할 수 없습니다`는 문법이 어색하다** (`불가`+`된`).
> 라벨을 재사용하는 구조의 부작용이다. **그대로 옮긴다.** → `RP-Q6`
>
> ⚠️ `sizeLimit` 문구의 `가능 합니다` 띄어쓰기, `10M`(`10MB`가 아님).
> **실제 검증 기준은 `10000000` 바이트 = 10MB가 아니라 10,000,000B ≈ 9.54MiB다.**

---

## 7. 쿼리 훅 6개

| 훅                         | API  | 쿼리 키                                                                | 비고                   |
| -------------------------- | ---- | ---------------------------------------------------------------------- | ---------------------- |
| `useGetRepairStatusCount`  | #131 | `['repairStatusCount', aptUuid, aptResidentUuid]`                      | 상태별 건수            |
| `useGetRepairList`         | #132 | `['repairList', aptResidentUuid, aptUuid, …state]` (`useInfiniteList`) | 페이지 10              |
| `useGetRepairDetail`       | #133 | `['repairDetail', aptUuid, aptResidentUuid, repairUuid]`               | `enabled` **없음**     |
| `useDeleteRepairReceipt`   | #134 | (mutation)                                                             | `mutate`               |
| `usePostRepairSubmission`  | #135 | (mutation)                                                             | `mutateAsync` + 진행률 |
| `usePatchRepairSubmission` | #136 | (mutation)                                                             | `mutateAsync` + 진행률 |

> ✅ **쿼리 키에 `aptUuid`·`aptResidentUuid`가 전부 들어 있다.** 이 도메인이 가장 안전하다.
>
> 🔴 **어느 mutation도 `invalidateQueries`를 호출하지 않는다.**
> 등록·수정·취소 후 `repairList`·`repairStatusCount`·`repairDetail`이 무효화되지 않는다.
> 전부 `navigateBack()`으로 화면을 떠나고 `staleTime: 0`이라 재조회되어 눈에 띄지 않는다.
> **`repairStatusCount`는 RP1이 다시 마운트되므로 갱신된다.** → `RP-Q7`
>
> ⚠️ **`useGetRepairDetail`에 `enabled`가 없다.** `getParams().repairUuid`가 없으면
> `undefined`로 요청이 나간다. 다른 도메인은 `validateQueryEnabledParams`를 쓴다.
> RP3·RP4 모두 파라미터가 있는 라우트라 실제로는 문제되지 않는다.

### 7-1. `useGetRepairList` — 필터 초기값이 올바르다

```js
const additionalParamsRef = ref({})
useInfiniteList({
  queryKey: 'repairList',
  defaultStoreKey: ['aptResidentUuid', 'aptUuid'],
  fetchFunction: getRepairList,
  additionalParams: additionalParamsRef,
})

const setAdditionalParams = (newValue) => {
  additionalParamsRef.value = { state: newValue.status }
}
```

`useInfiniteList`가 `...additionalParams.value`를 스프레드하므로 초기 `{}`는 **아무 키도 만들지 않는다.**
**MovingHouse(`moveReservationStatus: {}`를 그대로 넘김)보다 안전한 구조다.**

`전체` 탭은 `{ uuid: undefined, category: '전체' }`를 emit → `state: undefined` → axios가 키를 생략.

⚠️ **`defaultStoreKey`가 `['aptResidentUuid', 'aptUuid']` 순서다.** `useInfiniteList`가
`Object.fromEntries`로 파라미터를 만들므로 순서는 무관하지만, **쿼리 키의 순서는 이 배열을 따른다.**

### 7-2. 업로드 진행률 (`useUploadProgress`)

```js
const useUploadProgress = () => {
  const progressPercent = ref(0)
  const handleUploadProgressHandler = () => ({
    onUploadProgress: (event) => {
      if (event.total) progressPercent.value = Math.round((event.loaded * 100) / event.total)
    },
    onSuccess: () => {
      progressPercent.value = 100
    },
    onError: () => {
      progressPercent.value = 0
    },
  })
  return { progressPercent, handleUploadProgressHandler }
}
```

axios `onUploadProgress`를 그대로 쓴다. **`event.total`이 없으면(청크 인코딩) 진행률이 0에 머문다.**

진행률이 화면에 닿는 경로:

```
axios onUploadProgress
  → useUploadProgress.progressPercent (쿼리 훅 안)
  → RepairWriteView/RepairEditView의 watch
  → repairFormStore.setSubmitProgressPercent()
  → RepairFormContainer의 <SpinnerDots :progress-percent="…">
```

🔴 **뷰 → 스토어 → 뷰로 한 바퀴 돈다.** 같은 컴포넌트 트리 안인데 스토어를 경유한다.
타깃에서는 mutation 훅의 `progressPercent`를 컨테이너가 직접 읽는다 (등가).

`SpinnerDots`는 `progressPercent`가 **truthy일 때만** `{{ percent }}%`를 보여준다 →
**0%는 표시되지 않는다.**

---

## RP1 — 접수 목록 (`RepairView` 105줄)

### 레이아웃

```
┌────────────────────────────┐
│ AppBar  하자보수            │
├────────────────────────────┤
│ 접수 현황                    │
│ ┌────┐┌────┐┌────┐┌────┐   │  ← 4개 카드 (shadow-md)
│ │접수대기││접수완료││처리완료││처리불가│
│ │  2 ││  1 ││  5 ││  0 │   │  ← outfit-20SemiBold
│ └────┘└────┘└────┘└────┘   │
│      [접수하기]              │
├────────────────────────────┤  ← space-y-2 회색 띠
│ 접수 이력            총 8건  │
│ [전체][접수대기][접수완료][처리완료][처리불가]
│ ┌────────────────────────┐ │
│ │ [접수 대기] ›  2026-07-30 14:00 │
│ │ ─────────────────────  │ │
│ │ 위치            거실     │ │
│ │ 내용        타일이 깨졌… │ │
│ └────────────────────────┘ │
└────────────────────────────┘
```

| 영역            | 클래스                                                                                                                 |
| --------------- | ---------------------------------------------------------------------------------------------------------------------- |
| 스크롤 컨테이너 | `h-full w-full space-y-2 overflow-auto bg-defaults-secondary-background-secondary`                                     |
| 접수 현황 섹션  | `w-full space-y-4 border-b border-b-defaults-tertiary-border-tertiary bg-base-b-white px-5 pb-[29px] pt-[18px]`        |
| 현황 카드       | `flex flex-1 flex-col items-center justify-center gap-2 self-stretch rounded-xl bg-base-b-white px-3 py-1.5 shadow-md` |
| 건수            | **`outfit-20SemiBold`** (Outfit 폰트 — 이 도메인이 거의 유일한 사용처)                                                 |
| 접수 이력 섹션  | `flex h-full w-full flex-col items-start border-b … bg-base-b-white`                                                   |
| 헤더 행         | `flex w-full items-start justify-between px-6 py-4`                                                                    |
| 총 건수         | `총 {{ repairList?.pageable?.totalElements \|\| 0 }}건` · `pretendard-14SemiBold`                                      |

### 상태별 건수 조회

```html
<span v-if="repairStatusCount" class="outfit-20SemiBold">
  {{ repairStatusCount[status?.status?.toLocaleLowerCase()] || 0 }}
</span>
```

🔴 **`toLocaleLowerCase()`** 를 쓴다 (`toLowerCase()`가 아니다).
`WAITING` → `waiting` 으로 서버 응답 키를 만든다. ASCII 대문자라 결과는 같지만
**터키어 로케일에서는 `I` → `ı`로 변환**되어 키가 깨질 수 있다. → `deferred.md`

⚠️ **`v-if="repairStatusCount"`가 `<span>`에만 걸려 있다.** 로딩 중에는 칩만 보이고 숫자가 없다.
`isRepairStatusCountLoading`을 받아오지만 **사용하지 않는다** (죽은 반환값).

### 탭

`REPAIR_STATUS_LIST`를 `category` 필드로 변환해 `TabCategory`에 넘긴다 (MovingHouse와 동일 패턴).

| 탭        | emit                                    | `state` 파라미터 |
| --------- | --------------------------------------- | ---------------- |
| 전체      | `{ uuid: undefined, category: '전체' }` | `undefined`      |
| 접수 대기 | `{ status: 'WAITING', … }`              | `'WAITING'`      |
| 접수 완료 | `{ status: 'RECEIVED', … }`             | `'RECEIVED'`     |
| 처리 완료 | `{ status: 'COMPLETED', … }`            | `'COMPLETED'`    |
| 처리 불가 | `{ status: 'IMPOSSIBLE', … }`           | `'IMPOSSIBLE'`   |

🔴 **여기도 `color="deepBlue"`를 넘기는데 `TabCategory`에 `color` prop이 없다** (MovingHouse와 동일).

### 스크롤 위치 복원

```js
useInfiniteScrollPosition({ moveFrom: '/detail', moveTo: '/repair/list' })
```

`scrollContainerRef`가 **`RepairView`의 외곽 div**에 걸려 있다 (`RepairList` 안이 아니다).
즉 접수 현황 카드까지 포함한 전체 스크롤 위치를 복원한다.

### 카드 (`RepairListItem` 67줄)

| 요소     | 값                                                                                                |
| -------- | ------------------------------------------------------------------------------------------------- |
| `<li>`   | `flex w-full flex-col gap-3 rounded-lg border border-defaults-tertiary-border-tertiary px-3 py-4` |
| 상태 칩  | `ChipBase :color="statusInfo?.color" variant="fill"` + `ArrowRight.svg` `h-4 w-4`                 |
| 등록일시 | `formatIsoStringDate(createdDate).dateTime()` · `pretendard-12Regular`                            |
| 필드 2개 | `위치` · `내용`                                                                                   |

```html
{{ formatHtmlText(repairInfo[field.key]?.replaceAll('\n', '')) || '-' }}
```

⚠️ **개행을 제거한 뒤 `formatHtmlText`를 통과시킨다.** `formatHtmlText`는 `\n`을 `<br/>`로 바꾸는데
그 전에 개행을 지웠으므로 **`<br/>`이 생기지 않는다** — 한 줄 요약이 목적이다.
게다가 **`v-dompurify-html`이 아니라 텍스트 보간**이라 태그가 그대로 문자로 보인다.
`decodeUrl`(내부 `he` 디코딩)만 유효하게 작동한다.

⚠️ **`statusInfo`는 `repairInfo.state`로 찾는다** — 목록 응답은 `state`, 상세 응답은 `repairState`다.
**서버 필드명이 화면마다 다르다.** → `RP-Q8`

### QA 체크리스트 (RP1)

- [ ] 접수 현황 4카드에 상태 칩 + 건수, 그림자
- [ ] 건수가 없으면 `0`
- [ ] `접수하기` → RP2
- [ ] 탭 5개, `전체` 기본 선택
- [ ] `총 N건`이 전체 건수
- [ ] 카드 좌측에 칩+화살표, 우측에 등록일시
- [ ] 내용이 여러 줄이면 **한 줄로 축약**되어 보인다
- [ ] 🔴 **접수가 11건 이상이어도 10건만 보인다** (`RP-Q4` 결정 전까지)
- [ ] 접수 0건 → `하자 접수 이력이 없습니다` (`py-28` 여백)
- [ ] 카드 → 상세 → 뒤로 → **접수 현황까지 포함한 스크롤 위치 복원**

---

## RP2 · RP3 — 접수 등록 / 수정 (`RepairFormContainer` 128줄)

**두 화면이 같은 컴포넌트를 쓴다.** 다른 것은 뷰 래퍼가 주입하는 `submitHandler`뿐이다.

```js
// RepairWriteView.vue (23줄)
onMounted(() => {
  repairFormStore.setSubmitHandler(postRepairSubmissionMutationAsync)
})
watch(createdPostProgressPercent, (v) => repairFormStore.setSubmitProgressPercent(v))

// RepairEditView.vue (32줄)
onMounted(() => {
  repairFormStore.setSubmitHandler(patchRepairSubmissionMutationAsync)
})
watch(editedRepairProgressPercent, (v) => repairFormStore.setSubmitProgressPercent(v))
// + useGetRepairDetail()로 상세를 받아 :repair-detail-data로 내린다
```

### AppBar

```html
<AppBar
  :title="`하자보수 ${isWritingPage ? '접수' : '수정'}`"
  is-modal-visible
  @open-modal="handleBackModalOpen"
>
  <button
    type="submit"
    form="repairForm"
    :disabled="repairFormStore.isSubmitting"
    :class="repairFormStore.meta?.valid ? 'text-brand-default-text-brand' : 'text-defaults-secondary-text-secondary'"
  >
    <SpinnerCircle v-if="repairFormStore.isSubmitting" color="black" />
    <span v-else>완료</span>
  </button>
</AppBar>
```

- **제출 버튼이 AppBar 우측 슬롯에 있다.** 하단 고정 버튼이 아니다 — 이 도메인 고유 패턴
- `form="repairForm"` 속성으로 **폼 밖에서 폼을 제출**한다
- **`:disabled`는 `isSubmitting`만 본다** — 검증 실패 상태에서도 누를 수 있다 (색만 회색)
- `§1`의 제목 버그가 여기에 있다

### 폼 필드 전수 (`RepairFormDetail` 146줄)

|   # | 필드             | 라벨                   | 상태              | 제약                         | 에러 표시               |
| --: | ---------------- | ---------------------- | ----------------- | ---------------------------- | ----------------------- |
|   1 | `dong`           | `동`                   | **disabled**      | `maxlength=5`                | 없음                    |
|   2 | `ho`             | `호수`                 | **disabled**      | `maxlength=5`                | 없음                    |
|   3 | `phone`          | `연락처`               | **disabled**      | `maxlength=13`               | 없음                    |
|   4 | `emergencyPhone` | `비상 연락처(선택)`    | 입력              | `maxlength=13` + 자동 하이픈 | `TextError` (항상 렌더) |
|   5 | `location`       | `위치` + 별표          | 입력              | `maxlength=20`               | `TextError`             |
|   6 | `content`        | `접수 내용` + 별표     | textarea `rows=7` | `maxlength=200`              | `TextError`             |
|   7 | `requirement`    | `기타 요청 사항(선택)` | textarea `rows=7` | `maxlength=200`              | **없음** 🔴             |

**placeholder 원문**

| 필드             | placeholder                            |
| ---------------- | -------------------------------------- |
| `dong`           | `동 입력`                              |
| `ho`             | `호수 입력`                            |
| `phone`          | `휴대폰 번호(- 없이 숫자만 입력)`      |
| `emergencyPhone` | 〃                                     |
| `location`       | `ex) 거실, 발코니, 화장실 등`          |
| `content`        | `하자 내용을 상세히 작성해주세요`      |
| `requirement`    | `ex) 방문 희망 날짜, 추가 요청사항 등` |

🔴 **`requirement`에 `TextError`가 없다.** 스키마는 `min(1)` 실패 시
`요구사항을 한 글자 이상 입력해주세요`를 만들지만 **화면에 표시할 곳이 없다.**
빈 문자열은 `z.literal('')`로 허용되므로 실제로는 발동하지 않는다.

⚠️ **`TextError`가 값 없이도 항상 렌더된다** (`min-h-[13px]`). 에러가 생겨도 레이아웃이 밀리지 않게 한 것.

🔴 **`phone`의 disabled 배경만 다르다.**

| 필드        | `disabled:bg-*`                               |
| ----------- | --------------------------------------------- |
| `dong`·`ho` | `defaults-secondary-background-mono`          |
| `phone`     | **`defaults-secondary-background-secondary`** |

세 필드가 나란히 비활성인데 **`연락처`만 다른 회색**이다. → `RP-Q9`

⚠️ **`emergencyPhone`·`location`·`content` 입력에도 `disabled:bg-*-secondary`가 붙어 있다.**
비활성이 되는 경우가 없어 죽은 클래스다.

🔴 **`border-bg-gray`가 textarea 2개에 붙어 있다** (`content`·`requirement`).
`broken-styles.md` §5의 미생성 클래스 — 현재 `border` 기본 회색으로 렌더된다.

✅ **2026-07-30 확정 — `border-defaults-tertiary-border-tertiary`(`#F3F4F6`)로 바꾼다.**
같은 폼의 `<input>`들이 이미 이 토큰을 쓰므로 **입력칸 테두리가 통일된다.**
(이사예약 MH3의 textarea도 동일 처리)

### 기본값 주입 순서

```js
watch(() => props.repairDetailData, (newValue) => { … setValues({ ...defaultInfo.value, ...editValues }); }, { immediate: true });

onMounted(() => {
  repairUuid.value = getParams().repairUuid;                      // ⚠️ 이후 사용처 없음
  repairFormStore.setValues({
    dong: authStore.getAptInfo()?.dong,
    ho: authStore.getAptInfo()?.ho,
    phone: formatPhone(authStore.getAptInfo()?.residentId),
  });
});
```

실행 순서: **`immediate` watch(setup 중) → `onMounted`**.
`setValues`는 지정한 키만 덮으므로 `dong`/`ho`/`phone`이 나중에 들어가도 서로 간섭하지 않는다.

RP3에서는 상세가 **비동기로** 도착 → watch가 다시 실행 → `editValues`로 6필드를 덮고
`dong`/`ho`/`phone`은 유지된다. ✅

⚠️ **`residentId`를 연락처로 쓴다.** 로그인 ID가 휴대폰 번호인 구조다.
🔴 **`defaultInfo = ref({})`는 아무도 할당하지 않는다.** 죽은 ref (스프레드가 항상 `{}`).
🔴 **`repairUuid = ref('')`는 할당만 되고 쓰이지 않는다.** 죽은 ref.

### 수정 시 HTML ↔ 개행 변환

```js
content: formatHtmlText(newValue?.content)?.replaceAll('<br/>', '\n'),
requirement: formatHtmlText(newValue?.requirement)?.replaceAll('<br/>', '\n'),
```

`formatHtmlText`가 `\n` → `<br/>`로 바꾼 직후 **다시 `<br/>` → `\n`으로 되돌린다.**
결과적으로 `decodeUrl`(HTML 엔티티 디코딩)만 적용된 원문이 textarea에 들어간다.

⚠️ **서버가 이미 `<br/>`로 저장했다면 그것도 `\n`으로 바뀐다.** 왕복 변환이 성립한다.
**이 왕복을 그대로 옮긴다** — 단순화하면 수정 화면의 줄바꿈이 달라진다.

### 로딩 / 진행률

```html
<SpinnerDots
  v-if="isLoading || repairFormStore.isSubmitting"
  :progress-percent="repairFormStore.submitProgressPercent"
/>
<div v-else class="h-full w-full space-y-6 overflow-auto p-5">
  <RepairFormDetail />
  <RepairFormImage />
</div>
```

`SpinnerDots`는 `fixed inset-0 z-[9999]` 전체 화면 오버레이다.
**제출 중에는 폼이 언마운트된다** (`v-else`) — 그래서 스토어에 값이 있어야 제출이 완주한다.

⚠️ **업로드 0%일 때는 퍼센트가 표시되지 않는다** (`v-if="progressPercent"`).

### 이미지 첨부 (`RepairFormImage` 101줄)

| 요소      | 클래스                                                                                                                        |
| --------- | ----------------------------------------------------------------------------------------------------------------------------- |
| 라벨      | `flex gap-1 … pretendard-15SemiBold` → `이미지 첨부(선택)` (⚠️ `<div for="imageUpload">`)                                     |
| 목록      | `flex gap-3 overflow-x-auto`                                                                                                  |
| 썸네일    | `relative flex h-20 w-20 shrink-0` · `<img class="h-full w-full rounded-md">`                                                 |
| 삭제 버튼 | `Xcircle.svg` `absolute right-1 top-1 h-5 w-5`                                                                                |
| 추가 버튼 | `h-20 w-20` · `rounded-md border border-dashed border-defaults-tertiary-border-tertiary` + `PhotoAdd.svg` `h-[18px] w-[18px]` |
| 안내      | `최대 5장 첨부 가능` · `pretendard-13Regular`                                                                                 |

```js
const previewImageList = computed(() =>
  repairFormStore?.imageList?.map((image) => ({
    url: image instanceof File ? URL.createObjectURL(image) : `${s3UrlFile}${image.fileUrl}`,
    name: image.name,
  })),
)
```

🔴 **`URL.createObjectURL`이 매 재계산마다 새 URL을 만들고 `revokeObjectURL`이 없다.**
수량 변경·다른 필드 입력 등으로 computed가 재평가될 때마다 blob URL이 누적된다.
**메모리 누수.** React에서도 같은 함정이 있으므로 `useMemo` + cleanup으로 옮긴다. → `RP-Q11`

🔴 **`:key="preview.name"`** — 서버에서 온 기존 이미지는 `image.name`이 `undefined`다
(`fileUrl`·`fileUuid`만 있다). **기존 이미지가 2장 이상이면 key가 중복**된다.

**추가 버튼 표시 조건**: `!previewImageList || previewImageList?.length <= 4` → **5장이면 숨는다.**

**검증 (`validImage` 유틸)**

```js
const remainingSlots = 5 - (store.imageList?.length || 0);
if (remainingSlots <= 0) { handler('countLimit'); return; }
const filesToProcess = Math.min(files.length, remainingSlots);
for (…) {
  if (!['image/jpeg','image/jpg','image/png','image/gif'].includes(file.type.toLowerCase())) { handler('fileTypeLimit'); return; }
  if (file.size > 10000000) { handler('sizeLimit'); return; }
  validFiles.push(file);
}
if (files.length > remainingSlots) handler('countLimit');
store.setFieldValue('imageList', (store.imageList || []).concat(validFiles));
event.target.value = '';
```

| 규칙           | 값                                                      |
| -------------- | ------------------------------------------------------- |
| 최대 장수      | **5**                                                   |
| 허용 MIME      | `image/jpeg` `image/jpg` `image/png` `image/gif`        |
| 최대 크기      | **`10000000` 바이트** (= 10,000,000B ≈ 9.54MiB)         |
| 초과 선택      | 남은 슬롯만큼 처리 + `countLimit` 토스트                |
| 형식/크기 위반 | **즉시 중단** — 그 전까지 통과한 파일도 추가되지 않는다 |

🔴 **`validImage`가 스토어 객체를 직접 받는다** (`validImage(event, repairFormStore, handler)`).
유틸이 스토어 형태(`imageList`, `setFieldValue`)에 결합돼 있다.
타깃에서는 순수 함수로 분리한다 — `validateImages(files, currentCount) → { valid, error }`.

⚠️ `<input accept="image/*">` 이므로 파일 선택 창은 모든 이미지를 보여주지만
`validImage`가 4종만 허용한다. **webp/heic를 고르면 토스트가 뜬다.**

### QA 체크리스트 (RP2 · RP3)

- [ ] 🔴 **RP2에서 AppBar 제목이 `하자보수 수정`으로 나온다** (`RP-Q1` 결정 전까지)
- [ ] 🔴 **RP2에 AppBar가 2개 겹쳐 있다** (`RP-Q2`)
- [ ] 🔴 **RP3에서 `동`/`호수` 라벨이 AppBar에 가린다** (`RP-Q3`)
- [ ] `동`·`호수`·`연락처`가 세대 정보로 채워지고 비활성
- [ ] 🔴 **`연락처`의 비활성 배경만 다른 회색이다** (`RP-Q9`)
- [ ] `위치` 미입력 → `위치를 입력해주세요`
- [ ] `접수 내용` 미입력 → `내용을 입력해주세요`
- [ ] 필수 2개를 채우면 AppBar `완료`가 파랑으로 바뀐다
- [ ] 검증 실패 상태에서도 `완료`를 **누를 수 있다**
- [ ] 비상 연락처 자동 하이픈
- [ ] 이미지 5장 초과 선택 → `이미지는 최대 5장까지만 첨부할 수 있습니다`
- [ ] webp 선택 → `jpg, jpeg, png, gif만 첨부 가능합니다`
- [ ] 10MB 초과 → `파일 사이즈는 10M 이하만 업로드 가능 합니다`
- [ ] 5장 첨부 시 추가 버튼이 사라진다
- [ ] 제출 중 전체 화면 스피너 + 퍼센트 (0%는 표시 안 됨)
- [ ] 등록 성공 → 뒤로 + `접수되었습니다` 토스트
- [ ] 수정 성공 → 뒤로 + `수정되었습니다` 토스트
- [ ] 🔴 **AppBar 뒤로가기 → `수정 그만두기` 모달** (등록 화면에서도) (`RP-Q1`)
- [ ] 🔴 **레이아웃 AppBar의 back(RP2)으로 나가면 초안이 남는다** (`RP-Q5`)
- [ ] RP3에서 기존 이미지가 썸네일로 보이고 삭제 가능

---

## RP4 — 접수 상세 (`RepairDetailView` 57줄)

### 조립

```
AppBar 하자보수 상세  [수정]
├── RepairDetailContent   ← 접수 내용 6필드 + 이미지 + 취소 버튼/안내
└── RepairDetailAnswer    ← 접수 답변 3필드
```

- 셸: `h-full overflow-auto`
- 콘텐츠: `flex flex-col gap-2 bg-defaults-secondary-background-secondary pt-12` ✅ `pt-12` 있다
- `<AppBar class="bg-base-b-white" title="하자보수 상세">` — 슬롯에 `수정` 버튼

### `수정` 버튼 분기

```js
const handleEditButton = () => {
  if (repairDetail?.value?.repairState === 'WAITING') {
    navigateTo(`/repair/edit/${getParams().repairUuid}`)
  } else {
    isNonEditableModalOpen.value = true
  }
}
```

| 상태      | 동작                                                     |
| --------- | -------------------------------------------------------- |
| `WAITING` | RP3로 이동                                               |
| 그 외     | `REPAIR_DETAIL_NONEDITABLE_MODAL_DATA(repairState)` 모달 |

**버튼은 항상 보인다.** 상태에 따라 이동하거나 안내 모달을 띄운다.

### 접수 내용 (`RepairDetailContent` 148줄)

| 요소   | 클래스                                                                         |
| ------ | ------------------------------------------------------------------------------ |
| 섹션   | `flex flex-col gap-5 px-5 pb-[30px] pt-[18px]` (+ `bg-base-b-white`)           |
| `<h2>` | `pretendard-16SemiBold` → `접수 내용`                                          |
| 행     | `flex min-h-5 justify-between gap-6`                                           |
| 라벨   | `whitespace-nowrap text-defaults-tertiary-text-tertiary pretendard-14SemiBold` |
| 값     | `v-dompurify-html` · `text-defaults-primary-text-primary pretendard-14Regular` |

**필드 6개**: `접수번호` · `접수일시` · `위치` · `비상연락처` · `접수내용` · `요청사항`

```js
if (field.key === 'createdDate' || field.key === 'desiredVisitDate')
  return { value: formatIsoStringDate(props.repairInfo[field.key]).dateTime() || '-' };
if (field.key === 'emergencyPhone') return { value: formatPhone(…) || '-' };
if (field.key === 'content' || field.key === 'requirement')
  return { value: formatHtmlText(…)?.replaceAll('\n', '<br/>') || '-' };
return { value: formatHtmlText(props.repairInfo[field.key]) || '-' };
```

⚠️ **`desiredVisitDate` 분기는 죽은 코드다** — `REPAIR_DETAIL_CONTENT_FIELD`에 없는 키다.
⚠️ **`content`/`requirement`의 두 번째 `replaceAll('\n', '<br/>')`은 무해한 중복**
(`formatHtmlText`가 이미 했다).
⚠️ **모든 값이 `v-dompurify-html`이다.** MovingHouse와 같은 패턴 — 접수번호까지 HTML로 들어간다.

### 이미지 목록

```html
<ul v-if="repairInfo?.fileList" class="grid w-full grid-cols-3 gap-2 sm:flex sm:flex-wrap">
  <li v-for="image in repairInfo?.fileList" :key="image?.fileUuid" class="flex justify-center">
    <img
      class="border-defaults-tertiary-border-tertiary h-28 w-28 rounded-md border object-cover"
      :src="`${s3UrlFile}${image?.fileUrl}`"
      :alt="`${image?.fileUrl.split('/').at(-1)}`"
    />
  </li>
</ul>
```

- **`grid-cols-3`이 기본, `sm:`(≥392px)에서 `flex flex-wrap`으로 바뀐다.**
  레거시 `screens.sm = '392px'`이므로 **거의 모든 모바일에서 flex 쪽이 적용된다.**
  즉 `grid-cols-3`은 392px 미만에서만 유효하다.
- 🔴 `image?.fileUrl.split(...)` — `fileUrl`에 `?.`가 없다. `fileUrl`이 없으면 크래시.
- 확대(라이트박스) 기능이 **없다.** 썸네일만 보인다.

### 취소 / 안내

| `repairState`              | 표시                                                                                                                    |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `WAITING`                  | `ButtonBase has-outline color="alerts-error"` → `접수 취소하기` (진행 중 스피너)                                        |
| `RECEIVED`                 | 회색 안내 박스 — `접수가 완료되어 직접 접수 취소가 불가능합니다. 접수 취소를 원할 경우 관리사무소에 문의 부탁드립니다.` |
| `COMPLETED` · `IMPOSSIBLE` | **아무것도 없다**                                                                                                       |

```js
const handlePostCancel = () => {
  handleModalClose() // ✅ 모달을 먼저 닫는다
  deleteRepairReceiptMutation()
}
```

취소 모달: `outline` 2버튼 — `닫기` / `접수취소`(빨강)
성공 시 `navigateBack()` → `취소되었습니다` 토스트 (목록에서 보인다).

⚠️ `modalType`이 `ref('')`로 시작하고 `handleModalClose`가 `null`을 넣는다 — 타입 불일치(무해).

### 접수 답변 (`RepairDetailAnswer` 96줄)

| 요소   | 값                                       |
| ------ | ---------------------------------------- |
| `<h2>` | `접수 답변`                              |
| 필드   | `접수상태`(칩) · `방문일자` · `전달사항` |

```js
const filterField = (field) => {
  const isImpossible = props.repairInfo?.repairState === 'IMPOSSIBLE'
  if (field.key === 'repairState') return true
  if (field.key === 'visitDateTime') return !isImpossible // 처리불가면 방문일자 숨김
  return true
}
```

**라벨 동적 변경**

```html
<template v-if="field.key === 'adminComment'">
  {{ repairInfo.repairState === 'IMPOSSIBLE' ? '처리불가 사유' : field.label }}
</template>
```

`IMPOSSIBLE`이면 `전달사항` → **`처리불가 사유`** 로 바뀐다.

⚠️ `repairInfo.repairState`에 `?.`가 없다 (같은 파일의 다른 곳은 있다). prop 기본값이 `{}`라 무해.
⚠️ `renderFieldValue`의 기본 분기가 `formatHtmlText((repairInfo && repairInfo[key]) || '-')` —
**`'-'`를 `formatHtmlText`에 통과시킨다.** 결과는 `'-'` 그대로.

⚠️ **답변이 없어도 섹션이 항상 보인다.** `접수상태`는 항상 있고 `방문일자`·`전달사항`은 `-`로 표시된다.

### QA 체크리스트 (RP4)

- [ ] AppBar 제목 `하자보수 상세` + 우측 `수정` 버튼
- [ ] `WAITING` → `수정` 누르면 RP3로 이동
- [ ] `RECEIVED` → `수정` 누르면 `접수 완료` / `접수 완료된 접수는 수정할 수 없습니다` 모달
- [ ] `IMPOSSIBLE` → `처리 불가` / **`처리 불가된 접수는 수정할 수 없습니다`** (`RP-Q6`)
- [ ] 접수 내용 6필드, 값 없으면 `-`
- [ ] 첨부 이미지가 112×112 썸네일, **탭해도 확대되지 않는다**
- [ ] `WAITING` → `접수 취소하기` 버튼 → 2버튼 모달 → 목록으로 + `취소되었습니다`
- [ ] `RECEIVED` → 회색 안내 박스, 취소 버튼 없음
- [ ] `COMPLETED`/`IMPOSSIBLE` → 취소 버튼도 안내도 없다
- [ ] `IMPOSSIBLE` → **`방문일자` 행이 사라지고** `전달사항`이 `처리불가 사유`로 바뀐다

---

## 타깃 슬라이스 구조 (제안)

```
src/features/repair/
├── api/
│   └── repair.ts                        # #131~#136
├── queries/
│   ├── repairQueries.ts                  # statusCount · list · detail
│   ├── useCreateRepair.ts                # #135 (진행률 포함)
│   ├── useUpdateRepair.ts                # #136 (진행률 포함)
│   └── useCancelRepair.ts                # #134
├── schemas/
│   └── repairForm.ts
├── components/
│   ├── RepairStatusSummary.tsx           # 접수 현황 4카드
│   ├── RepairCard.tsx
│   ├── RepairStatusChip.tsx
│   ├── RepairForm.tsx                    # RHF FormProvider (스토어 제거)
│   ├── RepairFormFields.tsx
│   ├── RepairImageUploader.tsx
│   ├── RepairDetailContent.tsx
│   └── RepairDetailAnswer.tsx
├── pages/
│   ├── RepairListPage.tsx                # RP1
│   ├── RepairWritePage.tsx               # RP2
│   ├── RepairEditPage.tsx                # RP3
│   └── RepairDetailPage.tsx              # RP4
├── constants/
│   └── repair.ts
├── types/
│   └── repair.ts
└── index.ts
```

### `shared`로 올릴 것

| 항목                                           | 이유                                                       |
| ---------------------------------------------- | ---------------------------------------------------------- |
| `useUploadProgress`                            | Board도 쓴다 → `shared/hooks/`                             |
| `convertFormDataFile`                          | Board도 쓴다. **`fileList[N].file`/`.fileUuid` 규약 유지** |
| `validImage` → `validateImages`                | **스토어 결합을 끊고 순수 함수로.** Board도 쓴다           |
| `ImageUploader`                                | Board 글쓰기와 규격이 거의 같다 — 공용 후보                |
| `WRITE_BACK_MODAL_DATA`·`EDIT_BACK_MODAL_DATA` | 🔴 현재 board 상수 직접 참조 → `shared/constants/`         |
| `TabCategory` → `TabChips`                     | MovingHouse와 동일 이슈 (선택 상태를 부모가 제어)          |
| `TextError`                                    | RHF 에러 표시                                              |
| `formatPhone`·`formatHtmlText`                 | 이미 공용                                                  |

### 폼 재작성 방침

```
Pinia useForm 싱글턴
  → RHF useForm(컴포넌트 로컬) + FormProvider
  → submitHandler 주입 제거: RP2/RP3 페이지가 각자 mutation을 호출
  → progressPercent: mutation 훅 → 컨테이너 직접 구독 (스토어 왕복 제거)
```

**단, `RP-Q5`(초안 잔존 동작) 결정이 이 구조를 바꿀 수 있다.**
초안 유지가 요구사항이면 Zustand `persist` 또는 상위 스코프 스토어가 필요하다.

---

## 이관 순서 — 2개 PR

| PR       | 범위      | 선행                                                                |
| -------- | --------- | ------------------------------------------------------------------- |
| **RP-1** | RP1 · RP4 | Phase 4 (`Chip`·`Modal`·`TabChips`·토스트·`useInfiniteList`)        |
| **RP-2** | RP2 · RP3 | RP-1 · **`ImageUploader` + `useUploadProgress` + RHF 폼 규격 확정** |

> **RP-2는 Board 글쓰기와 규격을 공유한다.** Board가 Phase 6에서 먼저 이관되므로
> `ImageUploader`·`useUploadProgress`·`convertFormDataFile`은 그때 확정된 것을 물려받는다.
> **Board보다 먼저 이관하지 않는다.**

---

## 반드시 지켜야 할 것

1. **경로에 `aptUuid`와 `aptResidentUuid`를 둘 다 넣는다.** 이 도메인만 그렇다.
2. **`FormData` 키 형식 `fileList[N].file` / `fileList[N].fileUuid` / `fileList[N].orderNum`을 유지한다.**
3. **신규 파일은 `.file`, 기존 파일은 `.fileUuid`로 보낸다.** 수정 시 기존 이미지 유지 방식이다.
4. **`emergencyPhone`은 하이픈을 제거해서 전송하고, 표시할 때 다시 붙인다.**
5. **`emergencyPhone`·`requirement`는 값이 있을 때만 키를 만든다.**
6. **`dong`·`ho`·`phone`은 전송하지 않는다.** 표시 전용이다.
7. **제출 버튼이 AppBar 우측 슬롯에 있다.** 하단 고정 버튼으로 옮기지 않는다.
8. **`완료` 버튼은 검증 실패 상태에서도 눌린다** (색만 회색).
9. **이미지 제약: 최대 5장 · jpg/jpeg/png/gif · 10,000,000 바이트.**
   형식·크기 위반 시 **그 전까지 통과한 파일도 추가하지 않는다.**
10. **5장이 되면 추가 버튼이 사라진다.**
11. **목록 카드의 내용은 개행을 제거해 한 줄로 보여주고, 텍스트 보간이다** (HTML 렌더 아님).
12. **목록은 `state`, 상세는 `repairState`** 로 상태 필드명이 다르다.
13. **`IMPOSSIBLE`이면 `방문일자`가 사라지고 `전달사항`이 `처리불가 사유`가 된다.**
14. **`RECEIVED`에만 회색 안내 박스가 있다.** `COMPLETED`/`IMPOSSIBLE`에는 아무것도 없다.
15. **`수정` 버튼은 항상 보이고, `WAITING`이 아니면 안내 모달을 띄운다.**
16. **취소 모달을 닫은 뒤 삭제를 시작한다.**
17. **취소·등록·수정 성공은 모두 `navigateBack()` + 토스트다.**
18. **수정 화면의 `content`/`requirement`는 `<br/>` ↔ `\n` 왕복 변환을 거친다.**
19. **업로드 0%는 화면에 표시되지 않는다.**
20. **접수 현황 건수는 상태값을 소문자로 바꿔 응답 객체에서 조회한다.**

---

## 정리해도 되는 것 (등가 영향 없음)

| 항목                                                              | 근거                               |
| ----------------------------------------------------------------- | ---------------------------------- |
| `defaultInfo = ref({})`                                           | 아무도 할당하지 않는다 — 죽은 ref  |
| `repairUuid = ref('')`                                            | 할당만 되고 쓰이지 않는다          |
| `renderFieldValue`의 `desiredVisitDate` 분기                      | 필드 목록에 없는 키                |
| `isRepairStatusCountLoading`                                      | 반환되지만 쓰이지 않는다           |
| `RepairView`가 `TabCategory`에 넘기는 `color="deepBlue"`          | `color` prop이 없다                |
| `content`/`requirement`의 두 번째 `replaceAll('\n','<br/>')`      | `formatHtmlText`가 이미 처리       |
| `formatHtmlText('-')`                                             | 결과가 같다                        |
| 입력 필드의 `disabled:bg-*` (비활성이 안 되는 필드)               | 죽은 클래스                        |
| `modalType`의 `''` ↔ `null` 타입 혼용                             | 무해                               |
| `toLocaleLowerCase()` → `toLowerCase()`                           | ASCII만 다루므로 결과 동일         |
| `<div for="imageUpload">` (라벨이 아닌 요소의 `for`)              | 무의미한 속성                      |
| RP3·RP4 meta의 `hasBackButton: false`                             | `showAppBar: false`라 효과 없음    |
| `WRITE_BACK_MODAL_DATA`·`EDIT_BACK_MODAL_DATA`를 board에서 import | `shared/constants/`로              |
| `validImage`가 스토어를 직접 받는 구조                            | 순수 함수로 분리                   |
| 진행률의 뷰 → 스토어 → 뷰 왕복                                    | mutation 훅을 컨테이너가 직접 구독 |

---

## 스타일

| 항목                                | 상태                                                                                        |
| ----------------------------------- | ------------------------------------------------------------------------------------------- |
| `border-bg-gray` (textarea 2곳)     | ✅ **`border-defaults-tertiary-border-tertiary`(`#F3F4F6`)로 확정** (`broken-styles.md` §5) |
| `phone`의 `disabled:bg-*-secondary` | dong/ho와 다른 회색 → `RP-Q9`                                                               |
| `outfit-20SemiBold`                 | Outfit 폰트. config에 존재 ✅ (`tailwind.config.js:740`)                                    |
| `grid-cols-3 sm:flex sm:flex-wrap`  | `sm = 392px`이므로 **대부분 flex가 적용**된다                                               |
| 그 외 클래스                        | ✅ 이 도메인 고유의 깨진 클래스는 `border-bg-gray` 하나뿐                                   |

---

## 확인 필요 (`RP-Q*`)

| #          | 질문                                                                                                                                                                      | 관련    |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| RP-Q1      | `isWritingPage`가 `'write'`를 찾는데 라우트는 `/repair/create`다 → **등록 화면 제목이 `하자보수 수정`, 뒤로가기 모달이 `수정 그만두기`.** 고치는가 (고치면 화면이 바뀐다) | §1      |
| RP-Q2      | RP2에 **AppBar가 2개 겹친다** (라우트 meta + 뷰). `showAppBar: false`로 바꾸는가 (Vote `VT-Q1`·Survey `SV-Q1`과 함께)                                                     | §2      |
| RP-Q3      | RP3(수정) **콘텐츠 상단 48px가 AppBar에 가린다** (`pt-12` 누락). 붙이는가                                                                                                 | §3      |
| RP-Q4      | 🔴 **무한 스크롤 관측 타깃이 템플릿에 없어 2페이지가 로드되지 않는다.** 11건 이상이면 10건만 보인다. 고치는가                                                             | §4      |
| RP-Q5      | 폼이 Pinia 싱글턴이라 **레이아웃 back·하드웨어 back으로 나가면 초안이 남는다.** RHF로 옮기면 이 동작이 사라진다. 유지가 필요한가                                          | §5      |
| RP-Q6      | `처리 불가된 접수는 수정할 수 없습니다` 문법이 어색하다. 문구를 따로 두는가                                                                                               | §6      |
| RP-Q7      | 등록·수정·취소 후 **`invalidateQueries`가 없다.** 추가하는가                                                                                                              | §7      |
| RP-Q8      | 상태 필드명이 **목록 `state` / 상세 `repairState`** 로 다르다. 서버 계약인가                                                                                              | RP1     |
| RP-Q9      | `연락처`의 비활성 배경만 `-secondary`(dong/ho는 `-mono`)다. 통일하는가                                                                                                    | RP2·RP3 |
| ~~RP-Q10~~ | ~~`border-bg-gray` 토큰 결정~~ → ✅ **2026-07-30 확정: `border-defaults-tertiary-border-tertiary`(`#F3F4F6`).** 같은 폼의 `<input>`들과 통일 (`broken-styles.md` §5)      | RP2·RP3 |
| RP-Q11     | `URL.createObjectURL`이 재계산마다 새 URL을 만들고 revoke하지 않는다. cleanup을 넣는가 (**등가에 영향 없음**)                                                             | RP2·RP3 |
| RP-Q12     | 첨부 이미지에 **확대(라이트박스)가 없다.** 의도인가                                                                                                                       | RP4     |

---

## 등가 대조 (레거시 :3000 ↔ 신규 :5173, 392px)

| 대조 지점                                                               |
| ----------------------------------------------------------------------- |
| RP1 접수 현황 4카드 `shadow-md` 강도 · `rounded-xl` · 카드 폭 균등 분배 |
| RP1 건수 폰트 (`outfit-20SemiBold` — Outfit 폰트가 실제로 적용되는지)   |
| RP1 `접수하기` 버튼 위치(섹션 안, 고정 아님)                            |
| RP1 탭 칩과 MovingHouse 탭 칩이 동일한지                                |
| RP1 카드 내용의 한 줄 축약 + `text-ellipsis`                            |
| **RP2 AppBar 제목** (`RP-Q1`) · **겹친 AppBar 2개** (`RP-Q2`)           |
| RP2·RP3 AppBar 우측 `완료` 버튼 색 전환 (`meta.valid`)                  |
| **RP3 상단 콘텐츠가 가리는지** (`RP-Q3`)                                |
| RP2·RP3 `동`/`호수` 2열 배치 + `mb-[25px]` 간격                         |
| **`연락처`와 `동`/`호수`의 비활성 배경 차이** (`RP-Q9`)                 |
| textarea 테두리가 **위 입력칸들과 같은 색**인가 (`#F3F4F6`, 수정 확정)  |
| `TextError`의 `min-h-[13px]` 자리 확보 (에러 없어도 공간이 있는지)      |
| 이미지 썸네일 80×80 · 삭제 아이콘 위치 · 점선 추가 버튼                 |
| 제출 중 전체 화면 스피너 + 퍼센트 표시 위치                             |
| RP4 이미지 112×112 · 392px 기준에서 `flex-wrap` 배치                    |
| RP4 `RECEIVED` 회색 안내 박스 배경·패딩                                 |
| 폰트 배율 5단계에서 RP1 현황 4카드가 깨지지 않는지                      |

---

## 회귀 위험 지점

| 지점                                | 위험                                                                                   |
| ----------------------------------- | -------------------------------------------------------------------------------------- |
| **Pinia `useForm` → RHF**           | 폼 생명주기가 바뀐다. 초안 잔존·RP2↔RP3 공유 동작이 사라진다 (`RP-Q5`)                 |
| **`submitHandler` 주입 제거**       | 제출 중 폼이 언마운트되는 구조(`v-else`)와 얽혀 있다. RHF에서는 값이 훅 안에 있어 안전 |
| **`FormData` 키 규약**              | `fileList[N].file` vs `.fileUuid`. 잘못 보내면 **수정 시 기존 이미지가 사라진다**      |
| **`validImage` 순수화**             | "위반 시 즉시 중단, 통과한 파일도 버림" 동작을 유지해야 한다                           |
| **`URL.createObjectURL` cleanup**   | revoke를 추가하면 **이미 렌더된 blob URL이 무효화**될 수 있다. 타이밍 주의             |
| **`<br/>` ↔ `\n` 왕복**             | 단순화하면 수정 화면의 줄바꿈이 달라진다                                               |
| **무한 스크롤 타깃 추가** (`RP-Q4`) | 고치면 **지금까지 안 보였던 항목이 보이기 시작한다.** 등가 이관 위반이지만 버그        |
| **AppBar 이중 노출** (`RP-Q2`)      | 한쪽만 제거하면 back 동작(모달 vs 평범한 back)이 바뀐다                                |
| **`pt-12` 추가** (`RP-Q3`)          | RP2는 이미 레이아웃이 밀어주므로 **둘 다 추가하면 RP2에서 96px이 된다**                |
| **진행률 경로 단축**                | 스토어 왕복을 없애면 리렌더 타이밍이 바뀐다. 퍼센트 표시가 튀지 않는지 확인            |
