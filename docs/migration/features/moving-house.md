# 도메인 명세 — 이사예약 (movingHouse)

> 기준 SHA `6d5bf22` · 레거시 `views/MovingHouseView/` 10개 파일 1,071 LOC
> (상수 111 + 스키마 34 + 쿼리 300 + API 87 포함 **총 1,660 LOC**)
> 타깃 슬라이스 `features/movingHouse/`
> API 7개 (`endpoints.md` #124~#130) · 쿼리 훅 7개 · Pinia 스토어 1개 · zod 스키마 1개 · 라우트 4개

**이 도메인의 핵심은 "단지 설정(`chargeFlag`)에 따라 화면이 갈린다"는 것이다.**
사용료를 받는 단지는 입금자명 입력·총 사용료 표시·무통장 입금 정보·안내문 3단락이 추가되고,
받지 않는 단지는 전부 사라진다. **한 화면이 두 가지 모습을 가진다.**

두 번째 특징은 **신축 입주 기간(new occupancy)** 로직이다. 2026-05-19 백엔드 정책으로 추가됐고
날짜 선택 범위·안내 배너·에러코드 4종이 여기에 묶여 있다.

| 특징                                                                      | 의미                                                     |
| ------------------------------------------------------------------------- | -------------------------------------------------------- |
| **목록에 페이징이 없다** (#124)                                           | `useInfiniteList`를 쓰지 않는 유일한 목록 도메인 중 하나 |
| **상세 화면과 등록 확인 화면이 컴포넌트를 공유**한다                      | `MovingHouseDetailContainer`. 경로 문자열로 분기 🔴      |
| `VueDatePicker`에 **휴무일 표시**를 `<style scoped>` + `:deep()`로 그린다 | 살아있는 scoped CSS. 이관 필수                           |
| **`InputRadioList`가 vee-validate에 직접 결합**돼 있다                    | `useField(props.name)`. RHF `Controller`로 재작성 필요   |
| 네이티브 브릿지 연동 **0건**                                              | AptMall·FireInspection과 함께 브릿지 독립                |

> ⚠️ **화면 ID는 `MH*`, 확인 항목은 `MH-Q*`를 쓴다.**
> `main.md`가 `M*`, `mypage.md`가 `MY*`/`P-Q*`를 점유했다.

---

## 화면 목록

### 라우트 (`router/MovingHouseIndex.js` — 4개)

| #   | 경로                              | name               | 컴포넌트                      | meta                                          |
| --- | --------------------------------- | ------------------ | ----------------------------- | --------------------------------------------- |
| MH1 | `/movingHouse/list`               | 이사예약 리스트    | `MovingHouseView`             | AppBar `이사예약` · `hasBackButton`           |
| MH2 | `/movingHouse/detail/:movingUuid` | 이사예약 상세      | `MovingHouseDetailView`       | AppBar `이사예약 상세` · `hasBackButton`      |
| MH3 | `/movingHouse/write`              | 이사예약 등록      | `MovingHouseWriteView`        | **`showAppBar: false`** (뷰가 직접 렌더)      |
| MH4 | `/movingHouse/write/confirm`      | 이사예약 등록 확인 | `MovingHouseWriteConfirmView` | AppBar `이사예약 등록 확인` · `hasBackButton` |

**전 화면 `showBottomNav: false`.** eager 라우트 없음.

> ⚠️ **MH3만 `showAppBar: false`다.** 작성 중 뒤로가기에 "그만두시겠습니까?" 모달을 띄워야 해서
> 뷰가 `<AppBar is-modal-visible @open-modal>`을 직접 렌더한다. **FireInspection과 같은 올바른 패턴.**
>
> ⚠️ **MH4는 라우트 meta로 AppBar를 띄운다** — 즉 뒤로가기가 그냥 히스토리 back이다.
> 작성 내용은 Pinia에 남아 있어 MH3로 돌아가면 복원된다 (`onMounted` + `setValues`).

### 진입 경로

| 화면 | 진입 출처                                                |
| ---- | -------------------------------------------------------- |
| MH1  | 메인 메뉴 — `contentName: '이사예약'`, 표시명 `이사예약` |
| MH2  | MH1 목록 카드 클릭                                       |
| MH3  | MH1 하단 고정 `이사 예약하기` 버튼                       |
| MH4  | MH3 `다음` (폼 검증 통과 시)                             |

---

## 1. `chargeFlag`가 화면을 둘로 나눈다

`getMovingHouseSetting`(#127)의 `chargeFlag`에 따라 **6곳이 달라진다.**

|   # | 위치                       | `chargeFlag: true`                         | `chargeFlag: false`      |
| --: | -------------------------- | ------------------------------------------ | ------------------------ |
|   1 | MH3 입금자명 입력          | **표시 + 필수**                            | 없음 (검증에서도 제외)   |
|   2 | MH3 하단 `총 사용료` 영역  | **표시**                                   | 없음                     |
|   3 | MH2·MH4 `사용료` 필드      | **표시**                                   | 필드 자체 제거           |
|   4 | MH2·MH4 `무통장 입금 정보` | **은행·예금주·계좌번호 3필드 + 복사 버튼** | 섹션 전체 없음           |
|   5 | MH2·MH4 안내문             | **`USED_FEE` 3단락**                       | `NONE_FEE` 1단락         |
|   6 | MH4 완료 모달              | `CREATED_USED_FEE` (입금 안내 3줄)         | `CREATED_NONE_FEE` (2줄) |

**zod 스키마도 동적으로 만든다.**

```js
export const buildMovingHouseFormSchema = ({ chargeFlag = false } = {}) =>
  toTypedSchema(
    z.object({
      moveType: z.string({ required_error: '유형을 선택해주세요' }),
      moveDate: z
        .date({ required_error: '날짜를 선택해주세요' })
        .refine((date) => startOfDay(date) >= startOfDay(new Date()), {
          message: '오늘 이후 날짜를 선택해주세요',
        }),
      moveTime: z.string({ required_error: '시간대를 선택해주세요' }),
      depositorName: chargeFlag ? name : z.string().optional(), // ← 여기
      emergencyPhone,
      memo,
    }),
  )
```

```js
// MovingHouseWriteView.vue
const validationSchema = computed(() =>
  buildMovingHouseFormSchema({ chargeFlag: movingHouseSetting.value?.chargeFlag === true }),
);
const { ... } = useForm({ validationSchema });   // computed를 그대로 넘긴다
```

⚠️ **vee-validate는 `validationSchema`가 computed면 값이 바뀔 때 자동 재검증한다.**
설정이 늦게 도착해도 `depositorName` 필수 여부가 갱신된다.

🔴 **RHF `zodResolver`는 이 동작을 자동으로 주지 않는다.** 리졸버를 `useMemo`로 다시 만들고
`trigger()`를 걸거나, 스키마를 단일 형태로 두고 `superRefine`에서 `chargeFlag`를 참조해야 한다.
**"설정 로딩 완료 시 입금자명 필수 여부가 갱신된다"는 동작이 등가의 기준이다.** → 「반드시 지켜야 할 것」

### `emergencyPhone` · `memo`는 공용 스키마다

```js
// schemas/common.js
export const emergencyPhone = z.union([phone, z.literal(''), z.null()]).optional()
export const memo = z.string().optional()
export const name = z
  .string({ required_error: '이름을 입력해주세요' })
  .trim()
  .min(2, { message: '2자 이상 입력해주세요' })
  .regex(NAME_REGEX, '한글, 영문, 띄어쓰기만')
```

⚠️ **`depositorName`의 에러 문구가 `이름을 입력해주세요`다** — 공용 `name` 스키마를 그대로 쓰기 때문이다.
라벨은 `입금자명`인데 에러는 `이름`이라고 나온다. **그대로 옮긴다.** → `MH-Q1`

---

## 2. 신축 입주 기간 (new occupancy)

`movingHouseSetting`의 `newOccupancyStartDate` / `newOccupancyEndDate`로 판정한다.

```js
// 백엔드 정책(2026-05-19~): today ≤ newOccupancyEndDate 면 신축 입주 검증 진입
const isNewOccupancyActive = computed(() => {
  const endDateStr = movingHouseSetting.value?.newOccupancyEndDate
  if (!endDateStr) return false
  return startOfDay(new Date()) <= startOfDay(endDateStr)
})
```

**`startDate`는 판정에 쓰지 않는다** — `endDate`만 있으면 활성화된다.
`startDate`는 날짜 선택 하한에만 관여한다.

```js
const datePickerRange = computed(() => {
  const today = startOfDay(new Date())
  if (!isNewOccupancyActive.value) return { minDate: today, maxDate: undefined }

  const endDate = startOfDay(movingHouseSetting.value.newOccupancyEndDate)
  const startDateStr = movingHouseSetting.value?.newOccupancyStartDate
  const startDate = startDateStr ? startOfDay(startDateStr) : today
  return { minDate: startDate > today ? startDate : today, maxDate: endDate }
})
```

| 모드      | `min-date`                         | `max-date`            |
| --------- | ---------------------------------- | --------------------- |
| 일반      | 오늘                               | **없음** (무제한)     |
| 신축 입주 | `max(오늘, newOccupancyStartDate)` | `newOccupancyEndDate` |

### 안내 배너

```js
export const buildNewOccupancyNotice = (endDate) =>
  `신축 입주 기간(~ ${endDate})까지만 이사 예약을 신청할 수 있습니다. 세대당 1건만 가능하며, 같은 동·날짜·시간대는 1세대만 예약할 수 있습니다. 이미 지난 시간대는 선택할 수 없습니다.`
```

`rounded-md bg-primary-pc-indigo-50 px-4 py-3 text-primary-pc-indigo-700 pretendard-13SemiBold` · `role="note"`

⚠️ **`endDate`를 서버 문자열 그대로 문구에 넣는다.** 포맷 변환이 없다 (`2026-08-31` 형태로 보인다).

### 에러코드 4종

```js
export const MOVING_HOUSE_ERROR_MESSAGE = {
  MOVE_RESERVATION_HOUSEHOLD_LIMIT_EXCEEDED:
    '신축 입주 기간에는 세대당 1건만 이사 예약이 가능합니다.',
  MOVE_RESERVATION_DATE_OUT_OF_NEW_OCCUPANCY_PERIOD:
    '신축 입주 기간에는 신축 입주 종료일까지만 예약할 수 있습니다.',
  MOVE_RESERVATION_DONG_SLOT_TAKEN:
    '신축 입주 기간에는 같은 동에서 같은 날짜·시간을 1세대만 예약할 수 있습니다.',
  MOVE_RESERVATION_TIME_CLOSED: '이미 지난 시간대는 예약할 수 없습니다.',
}
```

```js
// usePostMovingHouse
swalErrorModal({ text: MOVING_HOUSE_ERROR_MESSAGE[errorCode] || message })
```

**맵 조회 방식이다** — `switch` 대신 객체 인덱싱. 다른 도메인보다 깔끔하다.
`MOVE_RESERVATION_TIME_CLOSED`는 프론트에서도 1차 방어한다(§4-3).

---

## 3. 상수 전문 — `constants/domain/movingHouse.js` (111줄)

```js
export const MOVING_HOUSE_TOAST_MESSAGE = {
  delete: '취소되었습니다', // 상세페이지
  copy: '복사 되었습니다', // 🔴 확인페이지 — 실제로 쓰이지 않는다
}

export const MOVING_HOUSE_STATUS_LIST = [
  { status: 'WAITING', label: '예약대기', color: 'gray' },
  { status: 'CONFIRMED', label: '확정', color: 'blue' },
  { status: 'CANCELED', label: '취소', color: 'red' },
]

export const MOVING_HOUSE_TYPE_LIST = [
  { key: 'MOVE_IN', label: '전입' },
  { key: 'MOVE_OUT', label: '전출' },
]

export const MOVING_HOUSE_LIST_ITEM_FIELD = [
  { key: 'receiptNum', label: '예약번호' },
  { key: 'moveType', label: '유형 ' }, // 🔴 라벨 끝에 공백
  { key: 'moveDate', label: '이사 예정일' },
  { key: 'moveTime', label: '이사 시간' },
]

export const MOVING_HOUSE_DETAIL_BASIC_CONTENT_FIELD = [
  { key: 'receiptNum', label: '예약번호' },
  { key: 'createdDate', label: '예약일시' },
  { key: 'moveReservationStatus', label: '예약상태' },
  { key: 'moveType', label: '유형' },
  { key: 'emergencyPhone', label: '비상연락처' },
  { key: 'moveDate', label: '이사 예정일' },
  { key: 'moveTime', label: '이사 시간' },
  { key: 'moveReservationPrice', label: '사용료' },
  { key: 'memo', label: '메모' },
]

export const MOVING_HOUSE_DETAIL_ADDITIONAL_CONTENT_FIELD = [
  { key: 'depositBank', label: '은행' },
  { key: 'depositAccountHolder', label: '예금주' },
  { key: 'depositAccount', label: '계좌번호' },
]
```

### 모달 데이터 5종 (원문 그대로)

| 키                 | title           | description                                                                                   | 버튼                |
| ------------------ | --------------- | --------------------------------------------------------------------------------------------- | ------------------- |
| `WAITING`          | `이사예약 취소` | `접수를 취소하시면  접수 내역이 사라집니다.` / `취소하시겠어요?` 🔴 **공백 2칸**              | `닫기` · `예약취소` |
| `CONFIRMED`        | `이사예약 취소` | `접수가 확정되어 예약내역에서` / `취소가 불가능합니다.` / `관리자 사무소로 연락해 주세요.`    | `확인`              |
| `COPIED`           | —               | `복사가 완료되었습니다`                                                                       | `확인`              |
| `CREATED_USED_FEE` | `예약접수 완료` | `이사예약이 완료 되었습니다.` / `사용료 입금완료시 순차적으로 확인 후` / `예약을 확정합니다.` | `확인`              |
| `CREATED_NONE_FEE` | `예약접수 완료` | `이사예약이 완료 되었습니다.` / `예약을 확정합니다.`                                          | `확인`              |

> 🔴 **`WAITING.description[0]`에 공백이 2칸이다** — `취소하시면  접수`.
> `ModalButton`이 `<p>`로 렌더하므로 HTML 공백 축약으로 **화면에는 1칸으로 보인다.** 무해.
>
> 🔴 **`CONFIRMED.description[2]`이 `관리자 사무소`다** — `관리사무소`가 맞다.
> **화면에 보이는 오탈자**다. → `MH-Q2`
>
> ⚠️ **`MOVING_HOUSE_TOAST_MESSAGE.copy`(`복사 되었습니다`)는 죽은 상수다.**
> 계좌 복사는 토스트가 아니라 `COPIED` 모달(`복사가 완료되었습니다`)을 띄운다.
> 같은 뜻의 문구가 두 벌 있고 한쪽만 쓰인다.

### 안내문 (`MOVING_HOUSE_DETAIL_INFO_DATA`)

| 키         | 내용                                                                           |
| ---------- | ------------------------------------------------------------------------------ |
| `NONE_FEE` | 1문단 — `이사 예정일로부터 14일 전까지 예약내역에서 취소가 가능합니다. 이후 …` |
| `USED_FEE` | **3문단 배열** — 입금 전 취소 / 확정 후 취소 불가 / 환불 2~3영업일             |
| `CANCELED` | 1문단 — `관리자에 의해 예약이 취소 되었습니다. …`                              |

⚠️ **`14일`이 문구에 하드코딩돼 있다.** 서버 설정값이 아니다. → `MH-Q3`

---

## 4. 쿼리 훅 7개

| 훅                                     | API  | 쿼리 키                                                               | `enabled`                                |
| -------------------------------------- | ---- | --------------------------------------------------------------------- | ---------------------------------------- |
| `useGetMovingHouseList`                | #124 | `['movingHouseList', aptResidentUuid, statusParam]`                   | (없음)                                   |
| `useGetMovingHouseDetail`              | #125 | `['movingHouseDetail', movingUuid]`                                   | `validateQueryEnabledParams(movingUuid)` |
| `useDeleteMovingHouseReceipt`          | #126 | (mutation)                                                            | —                                        |
| `useGetMovingHouseSetting`             | #127 | `['movingHouseSetting', aptResidentUuid]`                             | (없음)                                   |
| `useGetMovingHouseReservationTimeList` | #128 | `['movingHouseReservationTimeList', aptResidentUuid, formattedToday]` | (없음)                                   |
| `useGetMovingHouseHolidayList`         | #129 | `['movingHouseHolidayList', aptResidentUuid]`                         | (없음)                                   |
| `usePostMovingHouse`                   | #130 | (mutation)                                                            | —                                        |

> ✅ **이 도메인은 쿼리 키에 `aptResidentUuid`를 넣는다** (4/5). AptMall·FireInspection보다 낫다.
> **`movingHouseDetail`만 빠져 있다** — `movingUuid`가 전역 유일하면 문제없다. → `MH-Q4`
>
> 🔴 **`?.`가 훅마다 다르다.** `List`·`Setting`·`TimeList`·`HolidayList`는 `getAptInfo().aptResidentUuid`(옵셔널 없음),
> `Detail`·`Delete`·`Post`는 `getAptInfo()?.aptResidentUuid`. **일관성 없음.**
>
> 🔴 **어느 mutation도 `invalidateQueries`를 호출하지 않는다.**
> 등록(#130)·취소(#126) 후 목록·상세가 무효화되지 않는다. `staleTime: 0`이라 화면 이동 시
> 재조회되어 눈에 띄지 않는다. **타깃 `queryClient` 기본값을 레거시에 맞추므로 동작은 같다.** → `MH-Q5`

### 4-1. `useGetMovingHouseList` — 초기 필터 값이 빈 객체다

```js
const statusParam = ref({});                          // 🔴 초기값이 {} 다

queryKey: ['movingHouseList', authStore.getAptInfo().aptResidentUuid, statusParam],
queryFn: () => getMovingHouseList({ aptResidentUuid, moveReservationStatus: statusParam.value }),

const setStatusParam = (newValue) => { statusParam.value = newValue; };
```

`TabCategory`의 `전체` 탭이 `{ uuid: undefined, category: '전체' }`를 emit하고
`handleSelectCategory`가 `setStatusParam(value.status)` → **`undefined`** 를 넣는다.
즉 탭을 한 번이라도 누르면 정상이 되지만, **최초 진입에서는 `{}`가 전송된다.**

🔴 최초 요청의 실제 와이어 형태를 네트워크 탭에서 확인해야 한다 (axios가 객체를 어떻게
직렬화하는지에 달려 있다). **타깃에서는 `undefined`로 시작한다** — 전체 목록을 받는 것이 의도다.
→ `MH-Q6`

⚠️ **목록에 페이징이 없다** (#124). 예약이 많은 세대는 전부 한 번에 온다.
`useInfiniteList`를 쓰지 않으므로 무한 스크롤도 없다.

### 4-2. `useGetMovingHouseHolidayList`

응답은 `[{ startDate, endDate }, ...]` **범위 배열**이다 (단일 날짜가 아니다).

```js
const holidayRanges = computed(() =>
  (movingHouseHolidayList.value ?? []).map((range) => ({
    start: startOfDay(new Date(range.startDate)).getTime(),
    end: startOfDay(new Date(range.endDate)).getTime(),
  })),
)

const isHolidayDate = (date) => {
  const target = startOfDay(date).getTime()
  return holidayRanges.value.some(({ start, end }) => start <= target && target <= end)
}
```

**양끝 포함**(`<=`)이다.

### 4-3. 🔴 `useGetMovingHouseReservationTimeList`가 `select` 안에서 ref를 쓴다

```js
const timeSlotRadioList = ref({});     // ⚠️ 배열인데 초기값이 {}

select: (data) => {
  const fetchData = data.data.success;
  timeSlotRadioList.value = fetchData.map((item) => {      // 🔴 select 안에서 외부 ref 변경
    const isPast = isSlotTimePassedToday(item?.startTime, formattedToday.value);
    return {
      key: item?.uuid,
      label: `${item?.name} ${item?.startTime.slice(0, 5)}~${item?.endTime.slice(0, 5)}`,
      disabled: isPast || item?.reservableFlag === false,
    };
  });
  return fetchData;
},
```

**`select`는 순수 변환 함수여야 한다.** TanStack Query는 캐시 데이터가 바뀔 때마다(그리고
구독자마다) `select`를 실행하므로, 부수효과를 넣으면 실행 횟수가 보장되지 않는다.

**타깃에서는 파생 값으로 만든다** — `useMemo`로 `data`를 라디오 목록으로 변환.
**화면 결과는 동일하다.** → 「반드시 지켜야 할 것」

**슬롯 비활성 판정 2가지**

```js
const isSlotTimePassedToday = (startTimeStr, moveDateStr) => {
  const now = new Date()
  if (!startTimeStr || moveDateStr !== formatObjectDate(now, 'hyphen')) return false
  const [h, m] = startTimeStr.split(':').map(Number)
  return h * 60 + m < now.getHours() * 60 + now.getMinutes() // 분 단위 비교
}
```

| 판정                       | 근거                                                   |
| -------------------------- | ------------------------------------------------------ |
| `isPast`                   | **선택일이 오늘일 때만** 슬롯 시작시각이 현재보다 과거 |
| `reservableFlag === false` | 서버가 막은 슬롯 (본인 1건 초과 · 다른 세대 점유 등)   |

⚠️ **`!== false`가 아니라 `=== false`로 비교한다.** 필드가 없으면(`undefined`) **예약 가능**으로 본다.
⚠️ **라벨 형식**: `` `${name} ${startTime.slice(0,5)}~${endTime.slice(0,5)}` `` → `오전 09:00~12:00`.
`~` 앞뒤에 공백이 없다. **MH2의 상세 표기는 `-`(공백+하이픈+공백)를 쓴다** — 다르다.

⚠️ **변수명이 `formattedToday`인데 실제로는 "선택된 날짜"** 다. `setMoveDate`로 갱신된다.

### 4-4. `useDeleteMovingHouseReceipt`

```js
onSuccess: () => {
  navigateBack();
  showToast(MOVING_HOUSE_TOAST_MESSAGE.delete);   // '취소되었습니다'
},
```

**뒤로 간 다음 토스트를 띄운다** — 목록 화면에서 토스트가 보인다.
`mutate`(not `mutateAsync`)이므로 unhandled rejection이 없다.

### 4-5. `usePostMovingHouse`

```js
mutationFn: ({ moveType, moveTime, moveDate, depositorName, emergencyPhone, memo }) =>
  postMovingHouse({
    aptResidentUuid: authStore.getAptInfo()?.aptResidentUuid,
    moveType,
    moveDate: formatObjectDate(moveDate, 'hyphen'),       // Date → 'YYYY-MM-DD'
    moveReservationTimeUuid: moveTime,                     // 🔴 폼 필드명과 API 필드명이 다르다
    depositorName,
    emergencyPhone: cleanPhoneHyphen(emergencyPhone),      // 하이픈 제거
    memo,
  }),
onSuccess: () => { setMovingHouseFormData(undefined); },    // 스토어 정리
```

**폼의 `moveTime`(슬롯 uuid) → API `moveReservationTimeUuid`로 이름이 바뀐다.**
`depositorName`은 `chargeFlag: false`여도 **키가 전송된다** (값은 `undefined` → JSON에서 제거).

---

## MH1 — 예약 목록 (`MovingHouseView` 55줄 + `MovingHouseList` 45줄)

### 레이아웃

```
┌────────────────────────────┐
│ AppBar  이사예약            │
├────────────────────────────┤
│ [전체][예약대기][확정][취소]  │  ← TabCategory
│ ┌────────────────────────┐ │
│ │ [예약대기] ›   2026-07-30 14:00 │
│ │ ──────────────────────  │ │
│ │ 예약번호        MV-00123 │ │
│ │ 유형            전입     │ │
│ │ 이사 예정일     2026-08-01 │
│ │ 이사 시간   오전 09:00 - 12:00 │
│ └────────────────────────┘ │
├────────────────────────────┤
│      이사 예약하기          │  ← fixed bottom, size xl, square
└────────────────────────────┘
```

| 영역          | 클래스                                                                                            |
| ------------- | ------------------------------------------------------------------------------------------------- |
| 셸            | `h-full pb-24`                                                                                    |
| 섹션          | `h-full w-full space-y-3` · 탭 래퍼 `pt-3`                                                        |
| 목록 컨테이너 | `flex h-full w-full flex-col overflow-auto`                                                       |
| 목록          | `flex w-full flex-col items-start gap-3 p-6`                                                      |
| 빈 상태       | `TextEmpty class="flex-1"` → `이사 예약 이력이 없습니다`                                          |
| 하단 버튼     | `ButtonBase color="brand" round-type="square" size="xl"` + `custom-class="fixed bottom-0 left-0"` |

⚠️ **하단 버튼 `custom-class`가 `fixed bottom-0 left-0`뿐이다** (`right-0`이 없다).
`ButtonBase` 루트에 `w-full`이 있어 결과적으로 전체 폭이 된다. **MH3의 `다음` 버튼은 `right-0`까지 준다.**

⚠️ **셸 `pb-24`(96px)** vs 버튼 높이 `size="xl"`(`py-3` + 18px ≈ 52px). 여유가 있다.

### 탭 (`TabCategory` 공용)

```js
const convertedStatusList = MOVING_HOUSE_STATUS_LIST.map((item) => ({
  ...item,
  category: item.label,
}))
```

**`TabCategory`는 `category` 필드를 라벨로 쓰므로 `label`을 복사해 넣는다.**

| 탭 인덱스 | 라벨       | emit 값                                     | `statusParam` |
| --------: | ---------- | ------------------------------------------- | ------------- |
|         0 | `전체`     | `{ uuid: undefined, category: '전체' }`     | `undefined`   |
|         1 | `예약대기` | `{ status: 'WAITING', label: …, color: … }` | `'WAITING'`   |
|         2 | `확정`     | `{ status: 'CONFIRMED', … }`                | `'CONFIRMED'` |
|         3 | `취소`     | `{ status: 'CANCELED', … }`                 | `'CANCELED'`  |

| 요소   | 클래스                                                                                                                       |
| ------ | ---------------------------------------------------------------------------------------------------------------------------- |
| `<ul>` | `relative flex gap-2 overflow-x-auto px-6`                                                                                   |
| 칩     | `min-w-fit cursor-pointer rounded-[36px] px-3 py-2 text-center transition-all duration-300 ease-in-out pretendard-14Regular` |
| 선택   | `bg-brand-default-background-brand text-brand-default-text-brand-inverse`                                                    |
| 미선택 | `bg-defaults-secondary-background-mono text-defaults-secondary-text-secondary`                                               |

🔴 **`MovingHouseView`가 `color="deepBlue"`를 넘기는데 `TabCategory`에는 `color` prop이 없다.**
선언되지 않은 attr이라 `<ul>`에 `color="deepBlue"` 속성으로 떨어진다 (렌더에 영향 없음). 죽은 prop.

⚠️ **`TabCategory`의 선택 상태가 컴포넌트 내부 `ref(0)`이다.** URL·부모와 동기화되지 않는다.
상세를 보고 뒤로 오면 탭이 `전체`로 초기화된다 — **다만 스크롤 위치는 복원된다**(아래).

### 스크롤 위치 복원

```js
useInfiniteScrollPosition({ moveFrom: '/detail', moveTo: '/movingHouse' })
```

⚠️ **무한 목록이 아닌데도 이 훅을 쓴다** (스크롤 복원 기능만 사용).
`moveTo`가 `'/movingHouse'`로 **접두사만** 지정돼 있다 — 다른 도메인은 완전 경로를 준다.

### 카드 (`MovingHouseListItem` 103줄)

| 요소      | 값 / 클래스                                                                                                 |
| --------- | ----------------------------------------------------------------------------------------------------------- |
| `<li>`    | `flex w-full flex-col gap-3 rounded-lg border border-defaults-tertiary-border-tertiary px-3 py-4`           |
| 상단 행   | `flex items-center justify-between gap-4 border-b border-b-defaults-tertiary-border-tertiary pb-3`          |
| 상태 칩   | `ChipBase :color="statusInfo?.color" variant="fill"` + `ArrowRight.svg` `h-4 w-4`                           |
| 등록일시  | `formatIsoStringDate(createdDate).dateTime()` · `text-defaults-tertiary-text-tertiary pretendard-12Regular` |
| 필드 라벨 | `whitespace-nowrap text-defaults-tertiary-text-tertiary pretendard-14SemiBold`                              |
| 필드 값   | `overflow-hidden text-ellipsis whitespace-nowrap text-defaults-primary-text-primary pretendard-14Regular`   |

⚠️ **칩과 화살표가 왼쪽, 등록일시가 오른쪽이다.** 화살표가 오른쪽 끝이 아니라 칩 옆에 붙어 있다.

**`renderFieldValue` 전문**

```js
if (field.key === 'moveType')
  return { value: MOVING_HOUSE_TYPE_LIST.find((item) => item.key === info.moveType).label || '-' } // 🔴 ?. 없음
if (field.key === 'moveDate')
  return { value: formatIsoStringDate(info.moveStartDateTime).date() || '-' }
if (field.key === 'moveTime')
  return {
    value:
      `${info.moveReservationTimeName} \n        ${info.moveStartDateTime.slice(11, 16)} -\n        ${info.moveEndDateTime.slice(11, 16)}` ||
      '-',
  }
return { value: info[field.key] || '-' }
```

- 🔴 **`moveType`의 `.find(...).label`에 옵셔널 체이닝이 없다.** 서버가 `MOVE_IN`/`MOVE_OUT` 외의
  값을 주면 **카드가 크래시**한다. `MovingHouseDetailBasicContent`의 같은 코드에는 `?.`가 있다. **비대칭.** → `MH-Q7`
- 🔴 **`info.moveStartDateTime.slice(...)`에도 `?.`가 없다.** 상세판에는 있다.
- ⚠️ **`moveTime` 템플릿 리터럴에 줄바꿈과 들여쓰기 공백이 들어 있다.**
  `whitespace-nowrap`이라 공백이 축약돼 `오전 09:00 - 12:00`으로 보인다. **의도치 않은 서식**이지만 결과는 정상.
- ⚠️ **`|| '-'`가 템플릿 리터럴 뒤에 붙어 있어 절대 발동하지 않는다** (문자열은 항상 truthy).
  값이 없으면 `undefined - undefined` 같은 문자열이 보인다.

### QA 체크리스트 (MH1)

- [ ] 최초 진입 시 `전체` 탭 선택, 전체 목록 표시
- [ ] `예약대기`/`확정`/`취소` 탭 → 해당 상태만 필터링
- [ ] 예약 0건 → `이사 예약 이력이 없습니다`
- [ ] 카드 좌측에 상태 칩 + 화살표, 우측에 등록일시
- [ ] 칩 색: `예약대기` 회색 / `확정` 파랑 / `취소` 빨강
- [ ] `이사 시간`이 `오전 09:00 - 12:00` 형태로 한 줄
- [ ] 카드 → 상세 → 뒤로 → **스크롤 위치는 복원되지만 탭은 `전체`로 초기화**
- [ ] `이사 예약하기` 버튼이 하단 고정, 전체 폭

---

## MH2 — 예약 상세 (`MovingHouseDetailView` 80줄)

### 조립

```
MovingHouseDetailContainer            ← MH4와 공유
├── MovingHouseDetailBasicContent     ← 예약 내용 (9필드 중 필터링)
├── MovingHouseDetailAdditionalContent ← 취소 사유 | 무통장 입금 정보
└── MovingHouseDetailInfo             ← 안내문
[예약취소]                             ← CANCELED가 아닐 때만
```

- 셸: `h-full overflow-auto`
- 버튼 영역: `p-5` (**`fixed`가 아니다** — 문서 흐름 마지막)

### 🔴 컨테이너가 경로 문자열로 분기한다

```js
// MovingHouseDetailBasicContent.vue
const { getCurrentRoutePath } = useNavigate()
const isDetailPage = computed(() => getCurrentRoutePath().includes('detail'))
```

`/movingHouse/detail/:movingUuid`는 `'detail'`을 포함하고 `/movingHouse/write/confirm`은 포함하지 않는다.
**동작하지만 prop이어야 한다.** 타깃에서는 `mode="detail" | "confirm"` prop으로 바꾼다 (등가).

`isDetailPage`가 갈라놓는 것:

| 항목          | MH2 (`detail`)                                       | MH4 (`confirm`)                                             |
| ------------- | ---------------------------------------------------- | ----------------------------------------------------------- |
| 표시 필드     | 9개 전부 (`chargeFlag` 필터 후)                      | **`receiptNum`·`createdDate`·`moveReservationStatus` 제외** |
| `이사 예정일` | `formatIsoStringDate(moveStartDateTime).date()`      | `formatObjectDate(moveDate, 'hyphen')`                      |
| `이사 시간`   | `` `${moveReservationTimeName} ${시작} - ${종료}` `` | `selectedMoveTime.label` (`오전 09:00~12:00`)               |

### 필드 필터링

```js
const filteredFields = computed(() => {
  const excludeKeys = movingHouseSetting.value?.chargeFlag ? [] : ['moveReservationPrice']
  if (!isDetailPage.value) excludeKeys.push('receiptNum', 'createdDate', 'moveReservationStatus')
  return MOVING_HOUSE_DETAIL_BASIC_CONTENT_FIELD.filter((f) => !excludeKeys.includes(f.key))
})
```

| 조건                | MH2 필드 수 | MH4 필드 수 |
| ------------------- | ----------: | ----------: |
| `chargeFlag: true`  |           9 |           6 |
| `chargeFlag: false` |           8 |           5 |

### 표시

| 요소    | 클래스                                                                         |
| ------- | ------------------------------------------------------------------------------ |
| 섹션    | `flex flex-col gap-5 px-5 pb-[30px] pt-[18px]` (+ `bg-base-b-white`)           |
| `<h2>`  | `pretendard-16SemiBold` → `예약 내용`                                          |
| 행      | `flex min-h-5 justify-between gap-6`                                           |
| 라벨    | `whitespace-nowrap text-defaults-tertiary-text-tertiary pretendard-14SemiBold` |
| 값      | `text-defaults-primary-text-primary pretendard-14Regular`                      |
| 상태 값 | `ChipBase variant="fill"` (`isChip: true`)                                     |

🔴 **값이 전부 `v-dompurify-html`로 렌더된다** (칩 제외). 메모만 HTML이 필요한데
예약번호·유형·사용료까지 HTML로 들어간다. 서버 데이터에 태그가 있으면 그대로 렌더된다.
**`dompurify`가 살균하므로 XSS는 막히지만, 의도치 않은 서식이 나올 수 있다.** → `MH-Q8`

### 🔴 상세 화면이 무관한 쿼리를 기다린다

```js
const { timeSlotRadioList, isMovingHouseReservationTimeListLoading } =
  useGetMovingHouseReservationTimeList()
```

```html
<SpinnerDots v-if="isMovingHouseReservationTimeListLoading" />
<ol v-else>
  …
</ol>
```

`timeSlotRadioList`는 **MH4에서만** 필요하다(`selectedMoveTime`). 그런데 컴포넌트가 공유되므로
**MH2도 "오늘 날짜의 예약 시간대"를 조회하고 그 로딩이 끝날 때까지 예약 내용을 스피너로 가린다.**

즉 상세 화면에 **불필요한 API 1회 + 지연**이 있다. → `MH-Q9`

### 값 렌더링 세부

```js
// 사용료
if (field.key === 'moveReservationPrice')
  return { value: `${info[field.key]?.toLocaleString()}원` || '-' } // 🔴 값이 없으면 'undefined원'
// 메모
if (field.key === 'memo')
  return { isChip: false, value: formatHtmlText(info[field.key])?.replaceAll('\n', '<br/>') || '-' }
```

- 🔴 **사용료가 없으면 `undefined원`이 보인다.** `|| '-'`는 템플릿 리터럴이라 발동하지 않는다.
- ⚠️ **`formatHtmlText`가 이미 `\n` → `<br/>`를 한다.** 그 뒤에 또 `replaceAll('\n', ...)`을 호출한다 —
  남은 개행이 없어 **무해한 중복**이다.
- 비상연락처는 `formatPhone(...)`으로 하이픈을 붙여 표시한다 (저장은 하이픈 없이).

### 추가 정보 (`MovingHouseDetailAdditionalContent` 95줄)

**상태에 따라 세 갈래다.**

| 조건                                   | 표시                                                                          |
| -------------------------------------- | ----------------------------------------------------------------------------- |
| `moveReservationStatus === 'CANCELED'` | `취소 사유` 섹션 — `cancelReason \|\| '-'` (`leading-4 pretendard-14Regular`) |
| `chargeFlag: true`                     | `무통장 입금 정보` — 은행·예금주·**계좌번호 + 복사 버튼**                     |
| 그 외                                  | **아무것도 렌더하지 않는다** (빈 `<section>`)                                 |

**복사 흐름**

```js
const copyDepositAccount = async (value) => {
  if (!value) return
  const onCopySuccess = () => {
    isCopyModalOpen.value = true
  }
  copyValue(value, onCopySuccess)
}
```

`copyValue` 유틸: `navigator.clipboard` + `window.isSecureContext` → 실패 시
`document.execCommand('copy')` 폴백 (`<textarea>` 생성/제거). **폴백은 실패해도 `fn()`을 호출한다**
(즉 복사 실패해도 "복사 완료" 모달이 뜬다). 웹뷰 호환을 위한 의도적 관용. **그대로 이식.**

복사 버튼: `CopyClipboard.svg` + `복사` 텍스트 · `flex items-center gap-1`

### 안내문 (`MovingHouseDetailInfo` 31줄)

```html
<p
  class="flex flex-col gap-3 bg-defaults-secondary-background-secondary px-4 py-3 pretendard-14Regular text-defaults-secondary-text-secondary"
>
  <template v-if="movingHouseDetail?.moveReservationStatus === 'CANCELED'">{{ CANCELED }}</template>
  <template v-else>
    <div v-if="movingHouseSetting?.chargeFlag" class="flex flex-col gap-5">
      <div v-for="(paragraph, index) in USED_FEE" :key="index">{{ paragraph }}</div>
    </div>
    <template v-else>{{ NONE_FEE }}</template>
  </template>
</p>
```

🔴 **`<p>` 안에 `<div>`가 들어 있다.** HTML 파서가 `<div>` 시작에서 `<p>`를 강제로 닫으므로
**`chargeFlag: true`인 단지에서는 `<p>`의 클래스(배경·패딩·글자색·타이포)가 3단락에 적용되지 않는다.**

| `chargeFlag` | 실제 렌더                                                              |
| ------------ | ---------------------------------------------------------------------- |
| `false`      | `<p>` 안에 텍스트 → **회색 배경 카드로 정상 표시**                     |
| `true`       | `<p>`가 즉시 닫히고 `<div>`가 형제로 → **배경·패딩·글자색이 사라진다** |

**등가 이관 원칙상 지금 이 렌더 결과를 재현해야 한다.** React/JSX는 `<p><div>`를 그대로 출력하고
브라우저 파서가 같은 교정을 하므로 **마크업을 그대로 옮기면 동일하게 깨진다.**
다만 React 개발 모드가 콘솔 경고를 낸다.

→ `MH-Q10` (**고쳐서 배경을 살리는가, 지금 모습을 유지하는가**)

⚠️ `MovingHouseDetailInfo`와 `MovingHouseDetailAdditionalContent`가 **각자 `useGetMovingHouseDetail()`·
`useGetMovingHouseSetting()`을 호출한다.** 키가 같아 캐시를 공유하므로 요청은 늘지 않는다.
MH4에서는 `movingUuid` 파라미터가 없어 상세 쿼리가 disabled → `movingHouseDetail`이 `undefined` →
`CANCELED` 분기를 타지 않는다. **의도된 동작이다.**

### 취소 버튼 + 모달

```js
const handleCancelButton = () => {
  modalType.value =
    movingHouseDetail?.value?.moveReservationStatus === 'WAITING'
      ? 'cancelWaiting'
      : 'cancelConfirmed'
}
```

| 상태        | 버튼          | 모달                                                    |
| ----------- | ------------- | ------------------------------------------------------- |
| `WAITING`   | `예약취소`    | `outline` 2버튼 — `닫기` / `예약취소`(빨강) → 실제 삭제 |
| `CONFIRMED` | `예약취소`    | `single` 1버튼 — `확인` (취소 불가 안내만)              |
| `CANCELED`  | **버튼 없음** | —                                                       |

**모달 데이터는 `MOVING_HOUSE_DETAIL_MODAL_DATA[moveReservationStatus]`로 조회**한다 —
`modalType`은 어떤 `ModalButton`을 렌더할지만 결정하고, 내용은 상태값이 결정한다.

버튼: `has-outline color="alerts-error"` · 진행 중 `SpinnerCircle color="black"`

```js
const handleMovingCancel = () => {
  handleModalClose()
  deleteMovingHouseReceiptMutation()
}
```

**모달을 먼저 닫고 삭제를 시작한다** — 실패해도 모달이 겹치지 않는다.
**AptMall(`AM-Q12`)·소방과 달리 이 순서가 올바르다.**

### QA 체크리스트 (MH2)

- [ ] `chargeFlag: true` → 9필드 + 무통장 입금 정보 + 안내문 3단락
- [ ] `chargeFlag: false` → 8필드(사용료 없음) + 입금 정보 섹션 없음 + 안내문 1단락
- [ ] 🔴 `chargeFlag: true`의 안내문 3단락에 **회색 배경이 없다** (`MH-Q10` 결정 반영)
- [ ] `CANCELED` → `취소 사유` 섹션 + `CANCELED` 안내문, **취소 버튼 없음**
- [ ] `WAITING` → `예약취소` → 2버튼 모달 → `예약취소` → 목록으로 이동 + `취소되었습니다` 토스트
- [ ] `CONFIRMED` → `예약취소` → 1버튼 안내 모달 (실제 취소되지 않음)
- [ ] 계좌번호 `복사` → `복사가 완료되었습니다` 모달
- [ ] 비상연락처가 하이픈 포함으로 표시
- [ ] 사용료가 `12,000원` 형태
- [ ] 진입 시 예약 내용이 **스피너를 한 번 거친다** (`MH-Q9`)

---

## MH3 — 예약 등록 (`MovingHouseWriteView` 379줄)

이 도메인에서 가장 큰 파일이다.

### 셸

```html
<div class="h-full overflow-auto">
  <AppBar title="이사예약 작성" is-modal-visible @open-modal="handleBackModalOpen" />
  <SpinnerDots v-if="isMovingHouseSettingLoading || isMovingHouseHolidayListLoading" />
  <div v-else class="space-y-2 bg-base-b-white pt-12 pb-28">
    <form
      id="movingHouseForm"
      class="flex w-full flex-col items-start gap-6 bg-base-b-white px-5 pb-5"
      @submit="onSubmit"
    >
      …
    </form>
    <div v-if="chargeFlag">총 사용료 …</div>
  </div>
  <ButtonBase
    form="movingHouseForm"
    type="submit"
    custom-class="fixed bottom-0 left-0 right-0"
    round-type="square"
    size="2xl"
    :color="meta.valid ? 'brand' : 'defaults-secondary'"
    >다음</ButtonBase
  >
  <ModalButton v-if="isBackModalOpen" … />
</div>
```

- **`<AppBar is-modal-visible>`** → 뒤로가기 클릭이 `navigateBack()` 대신 `@open-modal`을 emit한다
- **AppBar 제목이 `이사예약 작성`** (라우트 name은 `이사예약 등록`, MH4 AppBar는 `이사예약 등록 확인`) — 3개가 다르다
- 설정·휴무일 **둘 다** 로드될 때까지 스피너 (시간대 목록은 별도 스피너)
- `<form id>` + `ButtonBase form="movingHouseForm" type="submit"` → **폼 밖의 버튼이 폼을 제출**한다
- `pb-28`(112px)로 고정 버튼 자리 확보. `size="2xl"`(`py-4` + 18px ≈ 60px)

### 필드 전수 (위→아래)

|   # | 필드             | 라벨                         | 필수                    | 컨트롤                                          | 제약            |
| --: | ---------------- | ---------------------------- | ----------------------- | ----------------------------------------------- | --------------- |
|   1 | `moveType`       | `유형 선택` + 별표           | ✅                      | `InputRadioList` (`전입`/`전출`) `width="grid"` | —               |
|   2 | `moveDate`       | `날짜 및 시간대 선택` + 별표 | ✅                      | `VueDatePicker inline`                          | 휴무일·범위     |
|   3 | `moveTime`       | (라벨 없음)                  | ✅                      | `InputRadioList` (시간대 슬롯) `width="grid"`   | 슬롯 disabled   |
|   4 | `depositorName`  | `입금자명` + 별표            | **`chargeFlag`일 때만** | `<input type="text">`                           | `maxlength=10`  |
|   5 | `emergencyPhone` | `비상 연락처(선택)`          | ❌                      | `<input type="tel">` + 자동 하이픈              | `maxlength=13`  |
|   6 | `memo`           | `메모(선택)`                 | ❌                      | `<textarea rows="7">`                           | `maxlength=200` |

⚠️ **`moveTime`에는 라벨이 없다.** 2번 라벨(`날짜 및 시간대 선택`)이 두 필드를 함께 가리킨다.

⚠️ **필수 표시가 `/assets/icons/Essential.svg` 이미지다** (별표 아이콘). `alt="별표 아이콘"`.

⚠️ **`<label for>`가 3곳에서 실제 컨트롤 `id`와 연결되지 않는다** —
`for="moveType"`·`for="moveDate"`는 `InputRadioList`/`VueDatePicker` 내부 id와 맞지 않는다.
`depositorName`·`emergencyPhone`만 올바르게 연결된다. **무해하지만 a11y 결함.**

**입력 클래스 (텍스트/전화 공통)**

```
h-10 w-full rounded-[4px] border border-defaults-tertiary-border-tertiary px-4 py-2.5
text-defaults-primary-text-primary caret-primary-pc-indigo-700 pretendard-16Regular
placeholder:text-defaults-tertiary-text-tertiary
disabled:bg-defaults-secondary-background-mono disabled:text-defaults-primary-text-primary
```

**textarea 클래스**

```
border-bg-gray w-full overflow-auto rounded-[4px] border px-4 py-4
text-defaults-primary-text-primary pretendard-16Regular
placeholder:text-defaults-tertiary-text-tertiary focus:border-defaults-focus-border-focus
```

🔴 **`border-bg-gray`는 생성되지 않는 클래스다** (`broken-styles.md` §5).
`bg.gray` 색상군이 config에 없다. 현재 `border`의 기본 회색으로 렌더된다.

✅ **2026-07-30 확정 — `border-defaults-tertiary-border-tertiary`(`#F3F4F6`)로 바꾼다.**
같은 폼의 `<input>`들이 이미 이 토큰을 쓰므로 **입력칸 테두리가 통일된다.**
(Repair RP2·RP3의 textarea 2곳도 동일 처리)

### 전화번호 자동 하이픈

```js
const handlePhoneInputChange = (event) => {
  const value = event.target.value.replace(/\D/g, '')
  setFieldValue('emergencyPhone', formatPhone(value))
}
```

`formatPhone`은 길이별로 분기한다 — 8자리 `1234-5678`, 02 지역번호 `02-123-4567`,
9~11자리 `010-1234-5678`, 그 밖은 **원본 반환**.

⚠️ `v-model` + `@input`이 함께 걸려 있다. `v-model`이 먼저 raw 값을 쓰고 `setFieldValue`가 덮는다.

### 날짜 선택기 — AptMall과 설정이 다르다

```html
<VueDatePicker
  v-model="moveDate"
  inline
  auto-apply
  locale="ko"
  :min-date="datePickerRange.minDate"
  :max-date="datePickerRange.maxDate"
  :enable-time-picker="false"
  :disabled-dates="isHolidayDate"
  :day-class="getDayClass"
  :month-change-on-scroll="false"
/>
```

| prop                 | MH3                             | AptMall AM9                   |
| -------------------- | ------------------------------- | ----------------------------- |
| `no-today`           | ❌ **없음** (오늘 강조 표시됨)  | ✅ 있음                       |
| `week-start`         | ❌ **없음** → 라이브러리 기본값 | ✅ **`0`(일요일)**            |
| `disabled-week-days` | ❌                              | ✅ (운영 요일)                |
| `disabled-dates`     | ✅ **함수** (휴무일 범위)       | ❌                            |
| `day-class`          | ✅ **함수** (휴무일 빨간 표시)  | ❌                            |
| `max-date`           | 신축 기간에만                   | 항상 (`reservationLimitDays`) |

🔴 **`week-start`를 지정하지 않아 달력의 시작 요일이 도메인마다 다르다.**

`@vuepic/vue-datepicker@9.0.3`의 기본값을 dist에서 직접 확인했다 —
`weekStart: { type: [Number, String], default: 1 }` → **월요일 시작**.

**레거시 달력 5개 인스턴스 전수**

| 화면                                          | `week-start`         | `no-today` | 기타                         |
| --------------------------------------------- | -------------------- | ---------- | ---------------------------- |
| AptMall AM9                                   | **`0`(일)**          | ✅         | `disabled-week-days`         |
| 주차 `ReservationCarAddCalendarModal`         | **`0`(일)**          | ❌         | `range`                      |
| **이사예약 MH3**                              | **미지정 → `1`(월)** | ❌         | `disabled-dates`·`day-class` |
| 로비폰 `VisitLobbyPhoneTempPasswordCreate` #1 | **미지정 → `1`(월)** | ✅         | —                            |
| 로비폰 〃 #2                                  | **미지정 → `1`(월)** | ❌         | —                            |

**일요일 시작 2개, 월요일 시작 3개.** `no-today`도 2:3으로 갈린다.
같은 앱에서 달력 5개가 서로 다르게 생겼다.

**공용 래퍼를 만들 때 기본값을 정해야 하고, 그 결정이 5개 화면의 외형을 동시에 바꾼다.**
→ `MH-Q12` (**AptMall·주차·로비폰과 함께 결정**)

### 🔴 휴무일 표시는 살아있는 scoped CSS다

```html
<style scoped>
  :deep(.moving-house-holiday) {
    position: relative;
    color: #ef4444;
  }
  :deep(.moving-house-holiday)::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 4px;
    background-color: rgba(239, 68, 68, 0.15);
    pointer-events: none;
  }
</style>
```

```js
const getDayClass = (date) => (isHolidayDate(date) ? 'moving-house-holiday' : '')
```

**휴무일 셀에 빨간 글자 + 반투명 빨간 사각형 오버레이**를 그린다.
`disabled-dates`로 선택도 막지만, **"휴무일임을 알려주는" 시각 표시가 이것뿐**이다.

⚠️ **`deferred.md` D-20의 "죽은 `<style scoped>`"와 다르다** — 이건 실제로 쓰인다.
**반드시 이관한다.** 색은 `#ef4444`(red-500) 하드코딩.

react-day-picker에서는 `modifiers` + `modifiersClassNames`로 옮긴다.

### 폼 동작 3가지

**① 날짜 변경 → 시간대 재조회 + 선택 초기화**

```js
watch(moveDate, (newValue, oldValue) => {
  setMoveDate(newValue)
  if (oldValue && newValue?.getTime() !== oldValue?.getTime()) {
    resetField('moveTime') // 값 + 에러 + touched 전부 초기화
  }
})
```

⚠️ **`setFieldValue('moveTime', undefined)`가 아니라 `resetField`다.**
주석에 이유가 적혀 있다 — `setFieldValue(undefined)`는 touched를 유지해 required 에러를 즉시 띄운다.
**타깃에서도 "날짜를 바꾸면 시간대 에러가 뜨지 않아야" 한다.**

**② 선택 가능 시작일이 바뀌면 자동 선택**

```js
watch(
  () => datePickerRange.value.minDate?.getTime(),
  (minTime) => {
    if (movingHouseFormData !== undefined) return // 복원 진입이면 건드리지 않는다
    if (minTime) moveDate.value = new Date(minTime)
  },
  { immediate: true },
)
```

- 최초 진입: 오늘 → 설정 로드 후 신축 시작일이 미래면 그 날짜로 갱신
- `getTime()` 비교라 값이 같은 단순 refetch로는 사용자 선택을 덮지 않는다

**③ 복원**

```js
onMounted(() => {
  if (movingHouseFormData !== undefined) setValues(movingHouseFormData)
})
```

MH4에서 뒤로 오면 **폼이 전부 복원된다.** `handleQuit`(그만두기)에서만 스토어를 비운다.

🔴 **`movingHouseFormData`가 구조분해된 스냅샷이다** (`const { movingHouseFormData } = useMovingHouseFormStore()`).
`setup` 시점의 값을 보는 것이 오히려 의도에 맞다(복원 판정은 1회면 된다). **운 좋게 맞는 코드.**

### 제출

```js
const onSubmit = handleSubmit((submitValues) => {
  navigateTo('/movingHouse/write/confirm') // 🔴 먼저 이동
  setMovingHouseFormData({
    //    그 다음 저장
    ...submitValues,
    moveDate: submitValues.moveDate,
    moveReservationPrice: movingHouseSetting.value?.moveReservationPrice || 0,
  })
})
```

🔴 **이동 후 저장한다.** `navigateTo`는 Promise를 반환하지만 `await`하지 않으므로
`setMovingHouseFormData`가 동기적으로 먼저 완료되고, 그 다음 라우터가 MH4를 마운트한다.
**결과적으로 동작하지만 순서가 뒤바뀐 코드다.** 타깃에서는 저장 → 이동으로 바꾼다 (등가).

⚠️ `moveDate: submitValues.moveDate` — **이미 스프레드에 포함된 값을 다시 쓴다.** 무의미한 중복.
⚠️ `moveReservationPrice`를 **폼 데이터에 합쳐 저장**한다. MH4가 `사용료` 필드를 이 값으로 표시한다.

### 하단 `총 사용료` (chargeFlag만)

```html
<div
  class="flex justify-between border-t border-defaults-tertiary-border-tertiary bg-defaults-primary-background-primary px-5 py-6 pretendard-13SemiBold"
>
  <span>총 사용료</span>
  <span class="flex items-center">
    <span class="mr-0.5 pretendard-20Bold">{{ moveReservationPrice?.toLocaleString() || 0 }}</span>
    <span>원</span>
  </span>
</div>
```

`form` **밖**, `pb-28` 래퍼 안이다.

### `다음` 버튼

```html
:color="meta.valid ? 'brand' : 'defaults-secondary'"
```

🔴 **`disabled`가 없다.** 색만 회색이고 **누를 수 있다.**
누르면 `handleSubmit`이 검증 실패로 막고 각 필드에 에러 문구가 뜬다.

**AptMall·소방은 `disabled`를 걸었다. 이 화면만 다르다.** → `MH-Q13`

⚠️ `moveTime` 에러는 `errors.moveTime && isFieldTouched('moveTime')` 조건이라
**한 번도 만지지 않은 상태에서는 뜨지 않는다.** 다른 필드는 touched 조건이 없다.

### 뒤로가기 모달

```js
const handleQuit = () => {
  navigateBack()
  setMovingHouseFormData(undefined)
}
```

`WRITE_BACK_MODAL_DATA`(**`constants/domain/board.js`에서 import**) —
`작성 그만두기` / `작성을 그만두시겠습니까?` `변경된 내용은 저장되지 않습니다` / `취소` · `그만두기`

🔴 **board 도메인의 상수를 이사예약이 가져다 쓴다.** feature 간 직접 참조다.
타깃에서는 `shared/constants/`로 올린다 (`import/no-restricted-paths`가 막는다).

### QA 체크리스트 (MH3)

- [ ] 설정·휴무일 로딩 중 스피너, 시간대는 별도 스피너
- [ ] `chargeFlag: true` → 입금자명 입력 + 하단 `총 사용료` 표시
- [ ] `chargeFlag: false` → 둘 다 없고 **`다음`이 입금자명 없이 활성**
- [ ] 신축 입주 기간 → 파란 안내 배너, 달력이 `신축 시작일 ~ 종료일`로 제한
- [ ] 일반 모드 → 오늘부터, 상한 없음
- [ ] 휴무일 셀이 **빨간 글자 + 반투명 빨간 사각형**, 선택 불가
- [ ] 오늘 날짜 선택 시 지난 시간대 슬롯이 비활성
- [ ] `reservableFlag: false` 슬롯이 비활성
- [ ] 날짜를 바꾸면 **시간대 선택이 초기화되고 에러가 뜨지 않는다**
- [ ] 전화번호 입력 시 자동 하이픈 (`01012345678` → `010-1234-5678`)
- [ ] 미입력 상태에서 `다음`을 **누를 수 있고** 각 필드에 에러가 뜬다
- [ ] 입금자명 미입력 에러가 **`이름을 입력해주세요`** 로 나온다 (`MH-Q1`)
- [ ] AppBar 뒤로가기 → `작성 그만두기` 모달 → `그만두기` → 목록, 폼 초기화
- [ ] MH4에서 뒤로 → **폼이 전부 복원된다**

---

## MH4 — 예약 등록 확인 (`MovingHouseWriteConfirmView` 63줄)

MH2와 **같은 컨테이너**를 쓴다. 데이터 출처만 Pinia로 바뀐다.

```html
<div class="h-full overflow-auto">
  <MovingHouseDetailContainer :detail-info="movingHouseFormData" />
  <div class="p-5">
    <ButtonBase
      round-type="rounded"
      color="brand"
      :disabled="isPostMovingHousePending || isMovingHouseSettingLoading"
      custom-class="flex justify-center"
    >
      <SpinnerCircle v-if="isPostMovingHousePending" color="white" />
      <span v-else>예약확정</span>
    </ButtonBase>
  </div>
  <ModalButton
    v-if="isConfirmModalOpen"
    button-type="single"
    :modal-data="chargeFlag ? CREATED_USED_FEE : CREATED_NONE_FEE"
    …
  />
</div>
```

⚠️ **`isLoading` prop을 넘기지 않는다** → `MovingHouseDetailContainer`의 기본값 `false`.
MH2는 상세 로딩을 넘긴다.

⚠️ `SpinnerCircle color="white"` — MH2의 취소 버튼은 `color="black"`이다 (배경이 다르므로 맞다).

### 제출

```js
const handleConfirmButton = async () => {
  await postMovingHouseMutationAsync(movingHouseFormData)
  isConfirmModalOpen.value = true
}
```

🔴 **`mutateAsync`가 실패하면 던지고 아무도 잡지 않는다** → unhandled rejection.
화면상으로는 `onError`의 `swalErrorModal`이 뜨므로 정상처럼 보인다.
**AptMall `AM-Q20`과 같은 패턴.** → `MH-Q14`

### 완료 모달 → 목록으로

```js
const closeConfirmModal = () => {
  navigateBack(-2) // confirm → write → list
  isConfirmModalOpen.value = false
}
```

🔴 **히스토리 스택 깊이를 `-2`로 가정한다.** MH1 → MH3 → MH4 경로에서만 맞다.
MH4를 **직접 URL로 열거나** 새로고침하면 `-2`가 앱 밖으로 나간다.

게다가 새로고침 시 Pinia가 비어 `movingHouseFormData`가 `undefined`가 되고:

| 결과                                                                              |
| --------------------------------------------------------------------------------- |
| `MovingHouseDetailContainer :detail-info="undefined"` → 기본값 `{}` → 전 필드 `-` |
| `예약확정` 클릭 → `mutationFn`이 `undefined`를 구조분해 → **TypeError**           |

→ `MH-Q15`

### QA 체크리스트 (MH4)

- [ ] MH3에서 입력한 값이 전부 표시된다 (유형·이사 예정일·이사 시간·비상연락처·메모)
- [ ] `이사 시간`이 `오전 09:00~12:00` 형태 (**MH2는 `09:00 - 12:00`** — 다르다)
- [ ] 예약번호·예약일시·예약상태 행이 **없다**
- [ ] `chargeFlag: true` → 사용료 + 무통장 입금 정보 표시
- [ ] `예약확정` → 완료 모달 (`chargeFlag`에 따라 문구 2종)
- [ ] 모달 `확인` → **목록 화면으로 이동** (2단계 뒤로)
- [ ] 제출 실패 → 에러 모달 (신축 기간 에러 4종은 전용 문구)
- [ ] 뒤로가기 → MH3로 가고 폼이 복원된다

---

## 타깃 슬라이스 구조 (제안)

```
src/features/movingHouse/
├── api/
│   └── movingHouse.ts                  # #124~#130
├── queries/
│   ├── movingHouseQueries.ts            # list · detail · setting · timeList · holidayList
│   ├── useCreateMovingHouse.ts          # #130
│   └── useCancelMovingHouse.ts          # #126
├── stores/
│   └── movingHouseFormStore.ts           # Zustand — MH3↔MH4 폼 인수
├── schemas/
│   └── movingHouseForm.ts                # chargeFlag 동적 스키마
├── components/
│   ├── MovingHouseCard.tsx               # 목록 카드
│   ├── MovingHouseStatusChip.tsx
│   ├── MovingHouseSummary.tsx            # MH2·MH4 공유 (mode prop)
│   ├── MovingHouseDepositInfo.tsx        # 무통장 입금 정보 + 복사
│   ├── MovingHouseNotice.tsx             # 안내문 3분기
│   ├── MovingHouseDatePicker.tsx         # 휴무일 표시 포함
│   └── MovingHouseTimeSlots.tsx
├── pages/
│   ├── MovingHouseListPage.tsx           # MH1
│   ├── MovingHouseDetailPage.tsx         # MH2
│   ├── MovingHouseWritePage.tsx          # MH3
│   └── MovingHouseConfirmPage.tsx        # MH4
├── constants/
│   └── movingHouse.ts
├── types/
│   └── movingHouse.ts
└── index.ts
```

### `shared`로 올릴 것

| 항목                             | 이유                                                                 |
| -------------------------------- | -------------------------------------------------------------------- |
| **날짜 선택기 래퍼**             | AptMall·주차·로비폰과 공용. **휴무일 표시는 이 도메인 전용 확장**    |
| `WRITE_BACK_MODAL_DATA`          | 🔴 현재 board 상수를 참조 중. `shared/constants/`로                  |
| `RadioList`                      | `InputRadioList` — **vee-validate 결합 제거**하고 RHF `Controller`로 |
| `TabCategory` → `TabChips`       | 여러 도메인 사용. **선택 상태를 부모가 제어**하도록 바꿀 후보        |
| `copyValue`                      | 이미 공용 유틸                                                       |
| `formatPhone`·`cleanPhoneHyphen` | 이미 공용                                                            |
| `TextError`                      | RHF 에러 표시 컴포넌트로                                             |

### zod 4 변환

`schemas/movingHouse.js`의 `required_error` **3곳** → `error`
(`zod-migration.md`의 33곳에 포함돼 있다). `emergencyPhone`·`memo`·`name`은 공용 스키마 쪽에서 처리.

---

## 이관 순서 — 2개 PR

| PR       | 범위      | 선행                                                |
| -------- | --------- | --------------------------------------------------- |
| **MH-1** | MH1 · MH2 | Phase 4 (`Chip`·`Modal`·`TabChips`·토스트)          |
| **MH-2** | MH3 · MH4 | MH-1 · **날짜 선택기 래퍼 + `RadioList`(RHF) 확정** |

**MH-2가 날짜 선택기의 두 번째 검증처다** — AptMall AM9(`inline` + 요일 비활성)에 이어
**날짜 범위 비활성 + 셀 커스텀 클래스**를 요구한다. 두 요구를 합쳐 래퍼를 설계한다.

> ⚠️ **`MovingHouseSummary`(MH2·MH4 공유)를 MH-1에서 `mode` prop 구조로 먼저 만든다.**
> MH-2에서 `confirm` 모드만 추가하면 된다.

---

## 반드시 지켜야 할 것

1. **`chargeFlag`가 6곳을 동시에 바꾼다** (§1 표). 하나라도 빠뜨리면 등가가 아니다.
2. **설정이 늦게 도착하면 입금자명 필수 여부가 갱신된다.** RHF에서 리졸버 재생성으로 재현한다.
3. **입금자명 에러 문구는 `이름을 입력해주세요`** (공용 `name` 스키마) — `MH-Q1` 결정 전까지 유지.
4. **신축 입주 판정은 `endDate`만 본다.** `startDate`는 하한 계산에만 쓴다.
5. **휴무일은 범위 배열이고 양끝을 포함한다.**
6. **휴무일 셀에 빨간 글자 + 반투명 빨간 오버레이**를 그린다. `<style scoped>`를 반드시 옮긴다.
7. **날짜를 바꾸면 시간대 선택이 초기화되고 에러가 뜨지 않는다** (`resetField`).
8. **슬롯 비활성 조건 2가지** — 당일 지난 시각 · `reservableFlag === false`(`undefined`는 가능).
9. **슬롯 라벨은 `오전 09:00~12:00`(MH4), 상세는 `오전 09:00 - 12:00`(MH2).** 표기가 다르다.
10. **`다음` 버튼은 비활성이 아니다.** 회색이지만 눌리고, 누르면 에러가 뜬다 (`MH-Q13` 전까지).
11. **`moveTime` 에러는 touched일 때만 뜬다.** 다른 필드는 즉시 뜬다.
12. **MH3→MH4→뒤로 시 폼이 전부 복원된다.** `그만두기`에서만 비운다.
13. **완료 모달 `확인`은 2단계 뒤로 간다** (목록까지).
14. **취소 모달은 닫은 뒤 삭제를 시작한다** (에러 모달이 겹치지 않는다).
15. **취소 성공 시 뒤로 간 다음 토스트를 띄운다** — 목록 화면에서 보인다.
16. **`CONFIRMED` 상태는 취소 버튼이 보이지만 안내 모달만 뜬다.** 실제 취소되지 않는다.
17. **목록에 페이징이 없다.** 무한 스크롤을 추가하지 않는다.
18. **탭 선택 상태는 상세를 다녀오면 `전체`로 초기화된다** (스크롤 위치는 복원).
19. **안내문 `14일`은 하드코딩이다.** 서버 값으로 바꾸지 않는다.

---

## 정리해도 되는 것 (등가 영향 없음)

| 항목                                                           | 근거                                        |
| -------------------------------------------------------------- | ------------------------------------------- |
| `MOVING_HOUSE_TOAST_MESSAGE.copy`                              | 계좌 복사는 모달을 쓴다 — 죽은 상수         |
| `MovingHouseView`가 `TabCategory`에 넘기는 `color="deepBlue"`  | `TabCategory`에 `color` prop이 없다         |
| `MOVING_HOUSE_LIST_ITEM_FIELD`의 `label: '유형 '` 끝 공백      | 화면에서 축약된다                           |
| `WAITING.description[0]`의 공백 2칸                            | HTML 공백 축약                              |
| `onSubmit`의 `moveDate: submitValues.moveDate`                 | 스프레드에 이미 있다                        |
| `renderFieldValue`의 `\|\| '-'` (템플릿 리터럴 뒤)             | 항상 truthy라 발동하지 않는다               |
| `memo`의 두 번째 `replaceAll('\n', '<br/>')`                   | `formatHtmlText`가 이미 처리했다            |
| `getCurrentRoutePath().includes('detail')` 분기                | `mode` prop으로 (`MH-Q` 없음 — 명백한 개선) |
| `select` 안에서 `timeSlotRadioList` ref 변경                   | 파생 값으로                                 |
| `statusParam` 초기값 `{}` → `undefined`                        | 의도는 전체 조회 (`MH-Q6`)                  |
| `timeSlotRadioList` 초기값 `{}` → `[]`                         | 배열로 쓰인다                               |
| `useGetMovingHouseReservationTimeList`의 `formattedToday` 이름 | 실제로는 "선택된 날짜"                      |
| `WRITE_BACK_MODAL_DATA`를 board에서 import                     | `shared/constants/`로                       |
| 훅별로 다른 `getAptInfo()` 옵셔널 체이닝                       | 통일                                        |

---

## 스타일

| 항목                               | 상태                                                                                                                               |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `border-bg-gray` (MH3 textarea)    | ✅ **`border-defaults-tertiary-border-tertiary`(`#F3F4F6`)로 확정** (`broken-styles.md` §5). 같은 폼 입력칸과 동일한 테두리가 된다 |
| `#ef4444` · `rgba(239,68,68,0.15)` | 휴무일 표시 (`<style scoped>`). 하드코딩 hex → `deferred.md`                                                                       |
| `<p>` 안의 `<div>` (안내문)        | 🔴 파서가 `<p>`를 닫아 배경·패딩이 사라진다 → `MH-Q10`                                                                             |
| `rounded-[36px]` (`TabCategory`)   | `rounded-full`과 사실상 같다                                                                                                       |
| 그 외 클래스                       | ✅ `broken-styles.md` 26개 중 이 도메인 고유 항목은 `border-bg-gray` 하나뿐                                                        |

---

## 확인 필요 (`MH-Q*`)

| #          | 질문                                                                                                                                                                              | 관련     |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| MH-Q1      | 입금자명 에러가 **`이름을 입력해주세요`** 로 나온다(공용 `name` 스키마). `입금자명을 입력해주세요`로 바꾸는가                                                                     | §1 · MH3 |
| MH-Q2      | `CONFIRMED` 모달의 **`관리자 사무소`** 는 `관리사무소` 오타다. 화면에 보이는 문구인데 고치는가                                                                                    | §3       |
| MH-Q3      | 안내문의 **`14일`** 이 하드코딩이다. 서버 설정값이 있는가                                                                                                                         | §3       |
| MH-Q4      | `['movingHouseDetail', movingUuid]` 키에 `aptResidentUuid`가 없다. `movingUuid`가 전역 유일한가                                                                                   | §4       |
| MH-Q5      | 등록·취소 후 **`invalidateQueries`가 없다.** 추가하는가 (추가하면 레거시보다 갱신이 빨라진다)                                                                                     | §4       |
| MH-Q6      | 목록 필터 초기값이 `{}`(빈 객체)다. 최초 요청의 실제 쿼리스트링을 확인해야 한다. `undefined`로 바꾸는가                                                                           | §4-1     |
| MH-Q7      | 목록 카드의 `moveType` 조회에 `?.`가 없다 → 미지의 값이면 **카드 크래시**. 상세판에는 있다. 붙이는가                                                                              | MH1      |
| MH-Q8      | 상세 값이 **전부 `v-dompurify-html`** 이다(메모만 필요). 메모만 HTML로 제한하는가                                                                                                 | MH2      |
| MH-Q9      | 상세 화면이 **MH4용 시간대 쿼리를 기다려 스피너를 띄운다.** `mode`로 분리해 호출하지 않게 하는가                                                                                  | MH2      |
| MH-Q10     | 안내문이 `<p>` 안의 `<div>` 때문에 **`chargeFlag: true`일 때 배경·패딩이 사라진다.** 고쳐서 살리는가, 지금 모습을 유지하는가                                                      | MH2      |
| ~~MH-Q11~~ | ~~`border-bg-gray` 토큰 결정~~ → ✅ **2026-07-30 확정: `border-defaults-tertiary-border-tertiary`(`#F3F4F6`).** 같은 폼의 `<input>`들과 테두리가 통일된다 (`broken-styles.md` §5) | MH3      |
| MH-Q12     | 달력 5개의 **시작 요일이 일:월 = 2:3, `no-today`가 2:3으로 갈린다.** 공용 래퍼 기본값을 무엇으로 정하는가 (AptMall·주차·로비폰 동시 영향)                                         | MH3      |
| MH-Q13     | `다음` 버튼이 **회색이지만 눌린다** (AptMall·소방은 `disabled`). 통일하는가                                                                                                       | MH3      |
| MH-Q14     | `예약확정` 실패 시 **unhandled rejection**이 남는다. `mutate`로 바꾸는가                                                                                                          | MH4      |
| MH-Q15     | MH4를 **직접 URL/새로고침으로 열면** ① 전 필드가 `-` ② `예약확정`이 TypeError ③ 완료 후 `-2`가 앱 밖으로. 가드를 넣는가                                                           | MH4      |

---

## 등가 대조 (레거시 :3000 ↔ 신규 :5173, 392px)

| 대조 지점                                                                  |
| -------------------------------------------------------------------------- |
| MH1 탭 칩 `rounded-[36px]` · 선택/미선택 색 · 가로 스크롤                  |
| MH1 카드에서 칩·화살표가 **왼쪽**, 등록일시가 오른쪽                       |
| MH1 하단 버튼 높이(`xl`)와 `pb-24` 여백                                    |
| MH2 섹션 간 `gap-2` 회색 띠 · `pb-[30px] pt-[18px]`                        |
| **MH2 안내문 배경 유무** (`chargeFlag`별로 다르다 — `MH-Q10`)              |
| MH2 계좌번호 복사 버튼 아이콘 + `복사` 텍스트 간격                         |
| MH3 별표 아이콘(`Essential.svg`) 위치·크기                                 |
| **MH3 달력 시작 요일 · 오늘 강조 표시** (`MH-Q12`)                         |
| **MH3 휴무일 셀 빨간 글자 + 반투명 사각형** (`inset-0`, `rounded-4px`)     |
| MH3 신축 배너 `bg-primary-pc-indigo-50` / `text-primary-pc-indigo-700`     |
| MH3 시간대 라디오 `width="grid"`(3열) 배치                                 |
| MH3 textarea 테두리가 **위 입력칸들과 같은 색**인가 (`#F3F4F6`, 수정 확정) |
| MH3 하단 `총 사용료` 금액 `pretendard-20Bold`                              |
| MH3 `다음` 버튼 회색/파랑 전환 시점 (`meta.valid`)                         |
| MH4 `이사 시간` 표기 `09:00~12:00` (MH2는 `09:00 - 12:00`)                 |
| 폰트 배율 5단계에서 MH3 라디오 3열이 깨지지 않는지                         |

---

## 회귀 위험 지점

| 지점                                     | 위험                                                                               |
| ---------------------------------------- | ---------------------------------------------------------------------------------- |
| **동적 스키마 (`chargeFlag`)**           | vee-validate는 computed 스키마를 자동 재검증. RHF는 리졸버 재생성 + `trigger` 필요 |
| **`InputRadioList`의 vee-validate 결합** | `useField(props.name)`을 내부에서 호출. RHF `Controller`로 재작성 필요             |
| **`select` 안의 ref 변경**               | 파생 값으로 옮기면 실행 시점이 달라진다. 슬롯 disabled 판정이 최신인지 확인        |
| **휴무일 scoped CSS**                    | `:deep()` → react-day-picker `modifiersClassNames`. 오버레이 `::after` 재현 필요   |
| **달력 시작 요일**                       | `week-start` 미지정 = 라이브러리 기본. 래퍼 기본값을 잘못 잡으면 배치가 바뀐다     |
| **`resetField('moveTime')`**             | 값·에러·touched를 모두 지운다. RHF `resetField`도 같은지 확인                      |
| **경로 문자열 분기**                     | `mode` prop으로 바꿀 때 MH2/MH4 양쪽 필드 목록·날짜 포맷을 함께 확인               |
| **`navigateBack(-2)`**                   | 히스토리 깊이 가정. react-router `navigate(-2)`도 같은 가정                        |
| **`<p>` 안의 `<div>`**                   | React 개발 모드가 경고를 낸다. 경고를 없애려 마크업을 고치면 **화면이 바뀐다**     |
| **폼 복원(`setValues`)**                 | Pinia 스냅샷 판정 + `immediate` watch의 조기 return. 순서가 바뀌면 복원이 덮인다   |
