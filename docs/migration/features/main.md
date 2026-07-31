# 도메인 명세 — 메인 (main)

> 기준 SHA `6d5bf22` · 레거시 `views/MainView/` 22개 파일 1,708 LOC
> 타깃 슬라이스 `features/main/`
> 관련: `useGetResidentDetailInfo`는 **앱 전역의 기능 게이트**다 (§2)

## 화면 목록

| #   | 경로    | name | 컴포넌트                | meta                                                         |
| --- | ------- | ---- | ----------------------- | ------------------------------------------------------------ |
| M1  | `/main` | 메인 | `MainView/MainView.vue` | `showAppBar:false`, **`showBottomNav:true`**, **eager 로드** |

**화면은 하나지만 구성요소가 22개다.** 뒤로가기 차단 대상(`routes.md` §6-5).

### 구성요소

| 파일                                           |  줄 | 역할                              |
| ---------------------------------------------- | --: | --------------------------------- |
| `MainView.vue`                                 | 107 | 조립 + 권한 요청 + 단지변경 알림  |
| `AptInfoHeader/AptInfoHeader.vue`              |  91 | 단지 로고·이름·동호수 헤더        |
| `AptInfoHeader/AptInfoHeaderAptName.vue`       |  29 | 아파트명 어절 단위 줄바꿈         |
| `AptInfoHeader/AptInfoHeaderDrawer.vue`        | 116 | 단지 전환 드로어                  |
| `AptInfoHeader/AptInfoHeaderItem.vue`          |  68 | 단지 목록 1행                     |
| `MainCardMenus.vue`                            |  75 | 카드 그리드 렌더                  |
| `MainCardMenu/MainCardAPass.vue`               |  43 | A-PASS 카드                       |
| `MainCardMenu/MainCardApassBadge.vue`          |  75 | A-PASS 상태 배지                  |
| `MainCardMenu/MainCardManagementFee.vue`       | 193 | 관리비 카드                       |
| `MainCardMenu/MainCardParkingMileage.vue`      | 103 | 주차 마일리지 카드                |
| `MainCardMenu/MainCardParkingMileageChart.vue` | 102 | 마일리지 도넛 차트 (ApexCharts)   |
| `MainCardMenu/MainCardReservation.vue`         |  65 | 주차 방문예약 카드                |
| `MainCardMenu/MainCardVisitorPass.vue`         |  41 | 방문 출입관리 카드                |
| `MainApayMenus.vue`                            |  19 | A-PAY 2카드 래퍼                  |
| `MainCardMenu/MainCardQR.vue`                  |  32 | A-PAY 결제 QR                     |
| `MainCardMenu/MainCardAPay.vue`                |  41 | A-PAY 결제금액                    |
| `MainNavigationSwiper.vue`                     | 149 | 메뉴 스와이퍼                     |
| `MainAdvertisementBanner.vue`                  |  79 | 광고 배너                         |
| `MainNoticeTopThree.vue`                       |  90 | 공지 Top3                         |
| `MainShoppingTermsBottomSheet.vue`             | 106 | 쇼핑 마케팅 동의 바텀시트         |
| `MainShoppingTermsModalPage.vue`               |  35 | 약관 상세 모달                    |
| `MainNotOutHistory.vue`                        |  49 | ⛔ **이관 제외** (주석 처리, R-2) |

### 다른 도메인 소속이지만 메인에서 렌더

| 컴포넌트                                     | 소속       |
| -------------------------------------------- | ---------- |
| `BoardView/NoticeBoard/NoticePopupModal.vue` | Board 명세 |
| `VoteView/VoteVoterHasPendingModal.vue`      | Vote 명세  |

---

## 1. 화면 조립 — `MainView.vue`

```
┌─────────────────────────────┐
│ AptInfoHeader               │  단지 로고 · 이름 · 동/호수 · 전환 토글
│ <!-- MainNotOutHistory -->  │  ⛔ 주석 처리됨
│ MainCardMenus               │  카드 1~5개 + A-PAY 2카드
│ MainAdvertisementBanner     │  광고 배너 (h-24)
│ MainNavigationSwiper        │  메뉴 스와이퍼 (h-[186px])
│ MainNoticeTopThree          │  공지 Top3
└─────────────────────────────┘
  + VoteVoterHasPendingModal
  + NoticePopupModal          ← 투표 팝업 뒤에 배치 (공지 우선)
  + MainShoppingTermsBottomSheet (조건부)
```

| 요소        | 클래스 (원문)                                                                                |
| ----------- | -------------------------------------------------------------------------------------------- |
| 루트        | `h-full w-full`                                                                              |
| 스크롤 영역 | `h-full w-full space-y-5 overflow-auto bg-defaults-secondary-background-secondary px-5 py-6` |

> ⚠️ **`NoticePopupModal`을 `VoteVoterHasPendingModal` 뒤에 두는 것은 의도적이다.**
> 코드 주석: `투표 팝업 뒤에 두어 동일 z-index에서 위에 렌더 (공지 우선)`.
> **DOM 순서로 우선순위를 만든다.** React에서도 렌더 순서를 지켜야 한다.

### 마운트 시

```js
onMounted(() => {
  nativeGetPermissionInfo() // 앱에 권한 정보 요청 (N3)
  // reloadIfNewVersion();          ← 주석 처리됨
})
```

### 권한 정보 수신

```js
emitter.on(CALLBACK_PERMISSION_INFO, (data) => {
  if (getCurrentRoutePath() === '/main') {
    pushAuthorized.value = data.pushAuthorized
  }
})
```

> ⚠️ **현재 경로가 `/main`일 때만 반영한다.** 다른 화면에서 온 콜백은 무시.
> `MainCardApassBadge`도 **동일한 패턴으로 별도 구독**한다 (중복 구독 2곳).
> ⚠️ `pushAuthorized`는 저장만 하고 **어디에도 쓰이지 않는다** → `deferred.md` D-33

### 단지 변경 알림 — 특정 단지 전용 우회 코드

```js
watch(residentDetailInfo, (newValue) => {
  if (!newValue) return;
  if (isDevelopment.value || authStore.getAptInfo().aptId === 'SMA0002') {
    // contentList에서 A-PASS / 로비폰 판정 후
    nativeSendChangedResidentInfo({ ...6필드 })
  }
}, { immediate: true, once: true })
```

레거시 주석에 사유가 상세히 적혀 있다:

> 문제 : 고산디에트르에듀파크 엘베코드(그 중 floorNum) 수정사항 미반영
> 원인 : 앱에서 beacon-list 하위인 floorNum만 수정할 경우, 새로 요청 안함. 그 상위 객체 중에 하나 변경되어야 요청함
> 해결 : 임시로 'DB 에서 radius 값 변경 + 메인 접속시 앱으로 값 전달' 하도록 함

| 항목   | 값                                                              |
| ------ | --------------------------------------------------------------- |
| 조건   | 개발 모드 **또는** `aptId === 'SMA0002'` (고산디에트르에듀파크) |
| 옵션   | `{ immediate: true, once: true }` — 최초 1회만                  |
| 메시지 | `SEND_CHANGED_RESIDENT_INFO` (N11)                              |

> ⚠️ **하드코딩된 단지 ID `'SMA0002'`.** 앱 측 비컨 갱신 이슈 우회용 임시 코드다.
> 등가 이관 원칙상 그대로 옮기되, **앱 이슈가 해결됐는지 확인**할 가치가 있다.
> → `[확인 필요]` M-Q1, `deferred.md` D-34
> ⚠️ `isDevelopment = import.meta.env.MODE === 'development'` — MODE 사용처.
> 타깃에서는 `env.VITE_ENV === 'development'` (`env-vars.md` §2-2).

---

## 2. ⚠️ `useGetResidentDetailInfo` — 앱 전역 기능 게이트

**Main만의 것이 아니다.** 아파트가 어떤 서비스를 구독했는지(`contentList`)로
**앱 전체의 기능 노출을 결정**하는 훅이다. Phase 4에서 우선 이관해야 한다.

### 쿼리

| 항목        | 값                                                                   |
| ----------- | -------------------------------------------------------------------- |
| 키          | `['residentDetailInfo', aptInfo.aptResidentUuid]`                    |
| `staleTime` | **5000** (5초) — 전역 기본값과 별개로 이 훅만 지정                   |
| `enabled`   | `Object.keys(aptInfo).length !== 0`                                  |
| `select`    | `data.data.success`                                                  |
| 로그아웃 시 | `removeQueries({ queryKey: ['residentDetailInfo'] })` (`auth.md` A7) |

### 콘텐츠 타입 14종 → 권한 플래그

`contentList[].name.trim()`과 비교한다. **전부 `.trim()`이 붙는다** (서버 데이터에 공백 있음).

| 상수               | 값               | 플래그                                |
| ------------------ | ---------------- | ------------------------------------- |
| `MANAGEMENT_FEE`   | `관리비`         | `hasAptManagementFeeContent`          |
| `PARKING`          | `주차`           | `hasAptParkingContent`                |
| `COMMUNITY`        | `커뮤니티`       | `hasAptCommunityContent`              |
| `APASS`            | `A-PASS`         | `hasAptApassContent`                  |
| `VISITOR_PASS`     | `방문증`         | `hasAptVisitorPassContent`            |
| `LOBBYPHONE`       | `로비폰`         | `hasLobbyPhone`                       |
| `FACE_RECOG`       | `안면인식`       | `hasFaceRecogContent`                 |
| `BOARD_COMMUNITY`  | `소통`           | `hasAptBoardCommunityContent`         |
| `BOARD_COMPLAINTS` | `민원`           | `hasAptBoardComplaintsContent`        |
| `APAY_QR`          | `A-PAY-QR`       | `hasAptAPayQrContent`                 |
| `APAY_PAYMENT`     | `A-PAY-결제금액` | `hasAptAPayPaymentContent`            |
| `MOVING_HOUSE`     | `이사예약`       | `hasAptMovingHouseContent`            |
| `VOTE`             | `전자투표`       | `hasAptVoteContent` ⛔ **미사용**     |
| `SHOPPING`         | `쇼핑몰`         | `hasAptShoppingContent` ⛔ **미사용** |

### ⚠️ 플래그 14개 중 4개는 죽은 코드 (M-Q3 확인 완료)

정의 훅 밖 사용처를 전수 조사한 결과:

| 플래그                       | 사용처 | 플래그                         | 사용처 |
| ---------------------------- | -----: | ------------------------------ | -----: |
| `hasLobbyPhone`              | **13** | `hasAptAPayPaymentContent`     |      2 |
| `hasAptParkingContent`       |      5 | `hasAptManagementFeeContent`   |      1 |
| `hasAptApassContent`         |      2 | `hasFaceRecogContent`          |      1 |
| `hasAptVisitorPassContent`   |      2 | `hasAptBoardCommunityContent`  |      1 |
| `hasAptAPayQrContent`        |      2 | `hasAptBoardComplaintsContent` |      1 |
| **`hasAptCommunityContent`** |  **0** | **`hasAptMovingHouseContent`** |  **0** |
| **`hasAptVoteContent`**      |  **0** | **`hasAptShoppingContent`**    |  **0** |

**커뮤니티·이사예약·전자투표·쇼핑몰 메뉴는 이 플래그가 아니라
`MAIN_SWIPER_MENU_LIST`의 `contentName`으로 게이팅된다** (§8).

따라서 `CONTENT_TYPES.VOTE = '전자투표'`는 **결과가 어디에도 쓰이지 않는 죽은 비교**이고,
실제로 동작하는 것은 스와이퍼의 `contentName: '투표'`다.
→ **서버 `contentList`에는 `'투표'`가 들어온다고 보는 것이 맞다.**

죽은 플래그 4개는 이관 시 **만들지 않아도 동작이 같다.** → `deferred.md` D-41

### ⚠️ 서버 데이터를 localStorage로 복사한다

```js
watch(
  residentDetailInfo,
  (newValue) => {
    if (newValue) {
      contentList.value = newValue.contentList || []
      authStore.setAptInfo({
        communityToken: newValue.oldApartmantToken,
        aptId,
        aptLogoFileUrl,
        dong,
        ho,
        residentId,
        contentList,
        apassOnOffFlag,
        apassUseFlag,
      })
    }
  },
  { immediate: true },
)
```

타깃 `docs/conventions/04-state.md`의 **"서버 데이터를 Zustand에 넣지 않는다"를 정면으로 위반**한다.
하지만 다른 곳(`useChangeApt`, `MainAdvertisementBanner` 등)이 `authStore.getAptInfo()`로
이 값을 읽으므로 **구조를 바꾸면 동작이 달라진다.** 등가 이관 우선.

> **Phase 4-2 "아파트 컨텍스트 배치" 결정이 이 구조를 그대로 재현해야 한다.**
> 개선안(Query를 단일 출처로)은 `deferred.md` D-35.

### 전출 처리 — `RESIDENT_NOT_FOUND`

에러 `watch`(`{ once: true }`)가 세대 전출을 처리한다.

```
error.errorCode === 'RESIDENT_NOT_FOUND'
  → refetchResidentAptList()
  → 모달 '세대에서 전출되었습니다.' (icon: 'info')
  → 남은 단지 없음 or 목록 조회 실패 → onLogout('/')
  → 승인(APPROVED) 단지 없음        → onLogout('/login/pending')
  → 있음                            → onChangeApt({ 첫 번째 승인 단지 })

그 외 errorCode
  → /error-auth 로 이동 (state: { errorCode, message })
```

> ⚠️ `/error-auth`는 하단 네비가 보이는 에러 화면이다 (`exception.md` E2).
> ⚠️ `swalErrorModal({ text, icon: 'info' })` — **`icon` 옵션을 쓰는 유일한 곳**.
> `showErrorModal` 래퍼가 `icon`을 지원해야 한다 (`decisions/tech-choices.md` Q-Q3).

### `useGetResidentAptList`

| 항목                 | 값                                                            |
| -------------------- | ------------------------------------------------------------- |
| 키                   | `['residentAptList']`                                         |
| **`enabled: false`** | **자동 조회하지 않는다.** `refetchResidentAptList()`로만 조회 |
| 호출 시점            | 단지 전환 드로어 마운트, 전출 처리                            |

---

## 3. 단지 헤더 — `AptInfoHeader`

### 화면 구성

```
┌──────────────────────────────────────┐
│ [로고] 아파트먼트 아파트   101동 1001호 ▼ │
└──────────────────────────────────────┘
```

| 요소            | 클래스 (원문)                                                                                     |
| --------------- | ------------------------------------------------------------------------------------------------- |
| 루트            | `relative flex flex-col items-start justify-center gap-3 self-stretch`                            |
| 본문            | `flex items-center justify-between gap-3 self-stretch`                                            |
| 좌측(로고+이름) | `flex items-center gap-[5px] text-[#404040] pretendard-14Bold`                                    |
| 로고            | `flex h-6 w-6 items-center justify-center rounded-[36px] border border-[#ebebeb] bg-base-b-white` |
| 우측(동호수)    | `flex items-center gap-[6px] text-[#1c1c1c]`                                                      |
| 동호수 숫자     | `outfit-20SemiBold` ← **Outfit 폰트**                                                             |
| 동/호 단위      | `flex w-3 flex-col justify-center pb-1 pretendard-14Bold`                                         |
| 토글 아이콘     | `h-[14px] w-[14px]` · `Toggle.svg` (alt `토글 아이콘`)                                            |

**로고**: `residentDetailInfo.aptLogoFileUrl`이 있으면 `${s3UrlFile}${aptLogoFileUrl}`,
없으면 `/assets/images/aptmantLogoShort.png` (alt `아파트먼트 기본 로고`).
있을 때 alt는 `` `${aptName} 로고` ``.

**동/호수**: `residentDetailInfo.dong || 0`, `.ho || 0` — **값이 없으면 `0`을 표시한다.**

### 스켈레톤

| 요소 | 클래스                                        |
| ---- | --------------------------------------------- |
| 좌측 | `h-6 w-6 rounded-[36px]` + `h-4 w-24 rounded` |
| 우측 | `h-7 w-12 rounded` × 2                        |

### 아파트명 어절 단위 줄바꿈 — `AptInfoHeaderAptName`

```js
aptNameWords = aptName.split(' ')
```

각 어절을 `<span class="inline-block">`으로 감싸고 **마지막이 아니면 `&nbsp;`를 붙인다.**
어절 중간에서 줄바꿈되지 않게 하려는 처리다. **그대로 재현** — `word-break` CSS로 바꾸면
줄바꿈 위치가 달라질 수 있다.

---

## 4. 단지 전환 드로어 — `AptInfoHeaderDrawer`

동호수 영역 클릭 시 열린다. `DrawerBase`(`is-button`) 위에 목록을 얹는다.

### 상태별 화면

| 상태 | 내용                                                                                                                                                                 |
| ---- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 로딩 | 스켈레톤 3행 — `h-[278px]` 컨테이너, 각 행 `flex w-full items-center gap-[7px] rounded-xl border border-defaults-tertiary-border-tertiary bg-base-b-white px-5 py-6` |
| 에러 | `단지 목록을 불러오지 못했습니다.` `<br />` `잠시 후 다시 시도해주세요.` — `flex h-[278px] w-full flex-col items-center justify-center gap-4 px-5 text-center`       |
| 정상 | `AptInfoHeaderItem` 반복 — `flex h-[278px] w-full flex-col gap-[10px] overflow-y-auto px-5 py-0`                                                                     |

하단 버튼: `닫기` — `round-type="rounded"`, `color="brand"`, `class="h-10"`

### 단지 항목 — `AptInfoHeaderItem`

**승인 상태에 따라 완전히 다른 마크업**을 낸다.

| `residentState` | 렌더                                 |
| --------------- | ------------------------------------ |
| `APPROVED`      | 선택 가능 항목                       |
| 그 외           | **승인대기중** 배지 항목 (클릭 불가) |

**승인 항목**

| 상태             | 클래스                                                                               |
| ---------------- | ------------------------------------------------------------------------------------ |
| 현재 선택된 단지 | `border-blue-s-info-100 bg-blue-s-info-50` + `CheckVerifiedSelect.svg`               |
| 그 외            | `border-defaults-tertiary-border-tertiary bg-base-b-white` + `CheckVerified.svg`     |
| 공통             | `flex w-full items-center gap-[7px] rounded-xl border px-5 py-6`                     |
| 아이콘           | alt `선택 아이콘`, `class="pt-1"`                                                    |
| 단지명           | `{aptName} {dong}동 {ho}호` — `text-defaults-primary-text-primary pretendard-16Bold` |
| 주소             | `aptAddress` — `text-defaults-secondary-text-secondary pretendard-14Regular`         |

선택 판정: `authStore.getAptInfo()?.aptResidentUuid === aptInfo?.aptResidentUuid`

**미승인 항목**

| 요소        | 값                                                                                                                                                  |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| 컨테이너    | `flex w-full flex-col gap-[7px] rounded-xl border border-defaults-tertiary-border-tertiary bg-defaults-secondary-background-mono px-5 py-6`         |
| 배지        | `ClockWaiting.svg` (alt `시계 아이콘`) + `승인대기중` — `mb-[2px] flex items-center gap-[2px] text-defaults-primary-text-primary pretendard-13Bold` |
| 단지명·주소 | 승인 항목과 동일                                                                                                                                    |

### 선택 동작

```js
selectApt(apt) {
  closeModal()
  if (apt.residentState === 'APPROVED') onChangeApt({ newAptInfo: apt })
  else isAccessDeniedModalOpen = true    // '승인되지 않은 단지입니다.' / '확인'
}
```

> ⚠️ **미승인 항목도 클릭 이벤트가 붙어 있다** (`AptInfoHeaderDrawer.vue:91`).
> 항목 자체는 승인/미승인 마크업이 다르지만 `@click`은 공통이라, 미승인을 눌러도
> 드로어가 닫히고 접근 거부 모달이 뜬다. **그대로 재현.**

---

## 5. ⚠️ `useChangeApt` — 경쟁 조건 주의

단지 전환의 핵심. **레거시에 잠재 버그가 있다.**

```js
const onChangeApt = async ({ newAptInfo }) => {
  authStore.setAptInfo({ aptResidentUuid, aptName, aptUuid, contentList: [] })  // ① 비움

  try {
    await queryClient.invalidateQueries(['residentDetailInfo', uuid])           // ② ⚠️ v4 시그니처

    // ③ useGetResidentDetailInfo의 watch가 setAptInfo를 다시 호출했다고 가정하고 읽는다
    const { aptResidentUuid, contentList, apassUseFlag, apassOnOffFlag } = authStore.getAptInfo()

    nativeSendChangedResidentInfo({ ... })                                       // ④
  } catch (error) { console.error(error) }
}
```

### 문제 2가지

**1. v4 시그니처** — `invalidateQueries([...])`는 v5에서 동작하지 않는다
(`query-keys.md` §1). 무효화가 안 되면 재조회도 없고 ③이 항상 빈 `contentList`를 읽는다.

**2. 순서 의존** — ①에서 `contentList: []`로 비운 뒤, ③은 **다른 훅(`useGetResidentDetailInfo`)의
`watch`가 이미 실행돼 새 값을 써넣었다고 가정**한다. 레거시 코드에 그 가정이 주석으로 적혀 있다:

> 입주민 상세정보 조회 무효화 한 이후, 새로운 값
> useGetResidentDetailInfo.js 에서 새로 조회한 뒤, 로컬스토리지에 반영하고 있음

`watch`가 아직 안 돌았으면 `contentList`가 빈 배열이라 `hasApass`·`hasLobbyPhone`이
**둘 다 `false`로 네이티브에 전송된다.**

### React 이관 방침

- `invalidateQueries({ queryKey: [...] })`로 변환 (필수)
- ③의 값을 **`authStore`에서 읽지 말고 `refetch()` 결과에서 직접 받는다.**
  이러면 순서 의존이 사라지고 **정상 동작 시 결과가 같다** — 등가 이관 위배 아님
- 실패 시 `console.error`만 하고 삼키는 것은 유지

> → `[확인 필요]` M-Q2, `deferred.md` D-36

---

## 6. 카드 그리드 — `useMainCardLayout` (242 LOC)

이 도메인에서 가장 복잡한 로직. **카드 5종을 아파트 구독 상태에 따라 1~5개 노출**하고,
개수별로 배치·크기·방향을 바꾼다.

### 카드 5종과 노출 조건

| id               | 컴포넌트                 | 노출 조건                                           |
| ---------------- | ------------------------ | --------------------------------------------------- |
| `apass`          | `MainCardAPass`          | `hasAptApassContent`                                |
| `parkingMileage` | `MainCardParkingMileage` | `hasAptParkingContent`                              |
| `managementFee`  | `MainCardManagementFee`  | `hasAptManagementFeeContent`                        |
| `visitorPass`    | `MainCardVisitorPass`    | `hasAptVisitorPassContent` **또는** `hasLobbyPhone` |
| `reservation`    | `MainCardReservation`    | `hasAptParkingContent`                              |

> `parkingMileage`와 `reservation`은 **같은 조건**(주차)이라 항상 함께 나온다.

### 순서 프리셋 (개수별)

```js
5: ['apass', 'parkingMileage', 'managementFee', 'visitorPass', 'reservation']
4: ['managementFee', 'parkingMileage', 'reservation', 'apass', 'visitorPass']
3: ['apass', 'managementFee', 'visitorPass', 'parkingMileage', 'reservation']
2: ['apass', 'reservation', 'visitorPass', 'managementFee', 'parkingMileage']
1: ['apass', 'managementFee', 'parkingMileage', 'visitorPass', 'reservation']
```

**특수 케이스**: 카드가 4개인데 관리비를 **미사용**이면 프리셋을 덮어쓴다:

```js
;['managementFee', 'apass', 'parkingMileage', 'reservation', 'visitorPass']
```

### 레이아웃 구조 (개수별)

```js
1: [[0]]                      // 1행 1카드 (100%)
2: [[0, 1]]                   // 1행 2카드 (1/3 + 2/3)
3: [[0, 1], [2]]              // 1행 2카드 + 2행 1카드 (100%)
4: [[0, 1], [2, 3]]           // 1행 2카드 + 2행 2카드 (1/2 + 1/2)
5: [[0, 1], [2, [3, 4]]]      // 1행 2카드 + 2행 [1카드 + 세로 2카드]
```

**5개일 때만 중첩 배열**이고, `mapCards`가 재귀로 처리한다.

### 너비 클래스 — `getCardWidthClass`

```
rowIndex === 0:
  totalCards === 1        → w-full
  colIndex === 0          → w-1/3
  else                    → w-2/3
rowIndex === 1:
  totalCards === 3        → w-full
  totalCards === 5 && colIndex >= 3 → w-full   (중첩 컨테이너 내부)
  else                    → w-1/2
```

### 카드 공통 클래스

```
rounded-lg border border-defaults-tertiary-border-tertiary
bg-defaults-primary-background-primary p-3
```

- 위 너비 클래스

### 레이아웃 타입 — `getCardLayoutType`

각 카드가 `layoutType` prop(`'vertical'` | `'horizontal'`)을 받아 내부 배치를 바꾼다.

| 카드             | 규칙                                                                 |
| ---------------- | -------------------------------------------------------------------- |
| `managementFee`  | **항상 `vertical`**                                                  |
| `parkingMileage` | 1개면 `vertical`, 아니면 **항상 `horizontal`**                       |
| `apass`          | 1개면 `horizontal` / 4개이고 2행이면 `horizontal` / 그 외 `vertical` |
| `visitorPass`    | 2개면 `vertical` / 3개이고 1행이면 `vertical` / 그 외 `horizontal`   |
| `reservation`    | 1행이면 `vertical` / 아니면 `horizontal`                             |
| 기본값           | `horizontal`                                                         |

### 렌더 — `MainCardMenus.vue`

| 항목               | 값                                                              |
| ------------------ | --------------------------------------------------------------- |
| 행 컨테이너        | `flex w-full gap-2` + **카드 2개 이상이고 1행이면 `h-[106px]`** |
| 전체 컨테이너      | `flex flex-col gap-3`                                           |
| 중첩(5개) 컨테이너 | `flex h-full w-1/2 flex-col gap-2`                              |
| 하단               | `MainApayMenus` (카드 그리드 밖)                                |

**로딩 스켈레톤** — 실제 카드 개수와 무관하게 **고정 레이아웃**이다:

```
1행: h-[106px], w-1/3 + w-2/3
2행: h-24, w-1/2 + w-1/2(세로 2개)
```

> React 이관 시 `<component :is>`는 **컴포넌트 맵 객체**로 바꾼다.
> `LAYOUT_STRUCTURE`·`CARD_ORDER_PRESETS`는 `features/main/constants/`로.

---

## 7. 카드별 상세

### 7-1. A-PASS 카드

| 항목         | 값                                                             |
| ------------ | -------------------------------------------------------------- |
| 제목         | `A-PASS` — `whitespace-nowrap text-left pretendard-14SemiBold` |
| 컨테이너     | `min-h-[54px] cursor-pointer justify-between` + layoutClass    |
| `horizontal` | `flex items-center max-h-[54px]`                               |
| `vertical`   | `flex flex-col`                                                |
| 클릭         | `apassUseFlag`가 **true일 때만** `/apass`로 이동               |
| 비활성 시    | `cursor-not-allowed` 클래스 추가, 클릭 무시                    |

**상태 배지** — `MainCardApassBadge`, 4단계 분기:

| 조건                                                              | 표시                                                                 |
| ----------------------------------------------------------------- | -------------------------------------------------------------------- |
| `!apassUseFlagStatus`                                             | `ChipBase color="gray" variant="fill"` → **`미가입`**                |
| `!apassStatus`                                                    | 〃 → **`미사용`**                                                    |
| `apassStatus && permissionInfo.btOn && permissionInfo.gpsEnabled` | **커스텀 배지** — `사용중` (초록 점 SVG + `bg-[rgba(0,187,64,0.1)]`) |
| 그 외                                                             | `ChipBase color="orange" variant="fill"` → **`권한없음`**            |

`사용중` 배지 상세:

- 컨테이너 `flex h-5 w-fit items-center gap-[2px] rounded-[31px] bg-[rgba(0,187,64,0.1)] px-1.5 py-[3px] text-base-b-black pretendard-12SemiBold`
- SVG `<circle cx="2.54663" cy="3" r="2.04663" fill="#00BB40" />` (5×6 viewBox)

> ⚠️ 배지도 `CALLBACK_PERMISSION_INFO`를 **자체 구독**하고 `onMounted`에서
> `nativeGetPermissionInfo()`를 **또 호출**한다 (`MainView`와 중복). 그대로 재현.

### 7-2. 관리비 카드 (193 LOC — 가장 복잡)

**연월 선택 로직**

```js
watch(aptResidentUuid, () => {
  selectedYear = null
  selectedMonth = null
}) // 단지 변경 시 초기화
watch(
  imposeYearMonths,
  (list) => {
    if (list?.length > 0) {
      const sorted = [...list].sort().reverse() // 최신 년월
      const [year, month] = sorted[0].split('-')
      selectedYear = Number(year)
      selectedMonth = Number(month)
    }
  },
  { immediate: true },
)
```

**상태 4단계**

| 상태            | 조건                                        | 표시                                              | 클릭              |
| --------------- | ------------------------------------------- | ------------------------------------------------- | ----------------- |
| 로딩            | 년월 로딩 \|\| 고지서 로딩 \|\| 년월 미설정 | 스켈레톤 (`h-5 w-24`, `h-6 w-32`, `h-4 w-24`)     | —                 |
| 년월 API 에러   | `isImposeYearMonthsError`                   | `관리비` + `관리비를 불러올 수 없습니다`          | **불가** (div)    |
| 고지서 API 에러 | `isManagementFeeBillError`                  | `관리비` + 화살표 + `관리비를 불러올 수 없습니다` | **가능** (button) |
| 정상            | —                                           | `{월}월분 관리비` + 금액 + 증감                   | 가능              |

> ⚠️ **두 에러 상태의 차이가 클릭 가능 여부다.** 년월 목록조차 못 가져오면 상세로 못 간다.

**정상 표시**

| 요소          | 값                                                                                                                                                                                 |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 제목          | `{currentMonth}월분 관리비` + `ArrowRight.svg` (`h-[18px] w-[18px]`) — `flex items-center gap-0.5 break-keep text-left text-defaults-secondary-text-secondary pretendard-13Medium` |
| 금액          | `{imposeAmount.toLocaleString('ko-KR')}원` — **`style="font-size: clamp(14px, 4vw, 18px)"`** ⚠️ 인라인 스타일                                                                      |
| 증감          | `▼ {금액}원` (감소) 또는 `▲ {금액}원` (증가) — `whitespace-nowrap text-left pretendard-10Medium`                                                                                   |
| 증감 색       | 감소 `text-alerts-informal-text-informal` / 증가 `text-alerts-error-text-error`                                                                                                    |
| 레이아웃 분기 | `layoutType === 'horizontal' ? '' : 'items-end'` (세로면 우측 정렬)                                                                                                                |

증감 판정: `previousMonthComparedAmount < 0` → 감소. 표시는 `Math.abs()`.

> ⚠️ `clamp(14px, 4vw, 18px)`는 **Tailwind 클래스가 아니라 인라인 스타일**이다.
> 긴 금액이 카드를 넘치지 않게 하는 처리. 그대로 이식.

### 7-3. 주차 마일리지 카드

| 상태 | 표시                                                                                  |
| ---- | ------------------------------------------------------------------------------------- |
| 로딩 | 제목 + 스켈레톤(`h-6 w-32`, `h-4 w-20`) + 원형 스켈레톤(`h-16 w-16 rounded-full`)     |
| 에러 | `잔여 주차 마일리지` + `주차 마일리지를 불러올 수 없습니다.` (버튼이지만 핸들러 없음) |
| 정상 | 잔여/전체 시간 + 도넛 차트                                                            |

**정상 표시**

| 요소              | 값                                                                                                            |
| ----------------- | ------------------------------------------------------------------------------------------------------------- |
| 제목              | `잔여 주차 마일리지` — `break-keep text-left text-defaults-secondary-text-secondary pretendard-13Medium`      |
| 잔여              | `{hours}시간 {minutes}분` — `flex flex-wrap items-baseline gap-x-1 text-left pretendard-18SemiBold`           |
| 전체              | `/ {hours}시간 {minutes}분` — `space-x-1 text-left text-defaults-tertiary-text-tertiary pretendard-12Regular` |
| 전체 분 표시 조건 | `formattedTotalMileageMinutes > 0`일 때만                                                                     |
| 클릭              | `/parking/mileage/history`                                                                                    |

`formatMinutes()` 유틸이 `{ hours, minutes }`를 반환한다. 값 없으면 `0`.

**도넛 차트** — `MainCardParkingMileageChart` (ApexCharts `radialBar`)

| 설정                | 값                                                                                               |
| ------------------- | ------------------------------------------------------------------------------------------------ |
| 크기                | `74` (width·height)                                                                              |
| 진행 색             | `#0037BE`                                                                                        |
| 트랙 색             | `#E5E7EB`                                                                                        |
| `sparkline.enabled` | `true`                                                                                           |
| 각도                | `startAngle: 0`, `endAngle: 360`                                                                 |
| `hollow.size`       | `'68%'`, `background: 'transparent'`                                                             |
| `track.strokeWidth` | `'100%'`, `margin: 0`                                                                            |
| 중앙 텍스트         | `Math.floor(percent)%` — `offsetY: 6`, `color: '#0037BE'`, `fontWeight: 800`, `fontSize: '15px'` |
| 이름 라벨           | `show: false`                                                                                    |
| percent 계산        | `total <= 0` 또는 비유한수면 `0`, 아니면 `(remaining / total) * 100`                             |
| 갱신                | `watch([total, remaining])` → `chart.updateSeries([percent])`                                    |
| 정리                | `onUnmounted` → `chart?.destroy()`                                                               |

> **recharts 변환 대상** (`decisions/tech-choices.md` 0-5b). `RadialBarChart` + `PolarAngleAxis`로
> 만들되 **위 수치를 그대로 재현**해야 한다. 특히 `hollow 68%`·`startAngle 0`·`endAngle 360`.

### 7-4. 방문 출입관리 카드

| 항목         | 값                                                                      |
| ------------ | ----------------------------------------------------------------------- |
| 제목         | `방문 출입관리` — `break-keep text-left pretendard-14SemiBold`          |
| 아이콘       | `icon-main-visit.svg` (alt `방문증 아이콘`, `h-8 w-8`), `flex self-end` |
| 클릭         | `/visit`                                                                |
| `vertical`   | `flex flex-col justify-between`                                         |
| `horizontal` | `flex items-center justify-between max-h-[54px]`                        |

### 7-5. 주차 방문예약 카드 — ⚠️ 흔들림 애니메이션

| 항목   | 값                                                                                        |
| ------ | ----------------------------------------------------------------------------------------- |
| 제목   | `주차 방문예약`                                                                           |
| 아이콘 | `icon-parking-reservation.svg` (alt `방문예약 아이콘`, `h-8 w-8`) + **`shake-animation`** |
| 클릭   | `/parking/reservation`                                                                    |

```css
@keyframes shake {
  0%,
  100% {
    transform: rotate(0deg);
  }
  25% {
    transform: rotate(10deg);
  }
  75% {
    transform: rotate(-10deg);
  }
}
.shake-animation {
  animation: shake 0.6s ease-in-out 2;
}
```

> ⚠️ `onMounted`에서 300ms 후 `shouldShake = true`로 바꾸지만 **`shouldShake`가 템플릿에서
> 사용되지 않는다.** 애니메이션은 클래스로 항상 실행된다. 죽은 코드 → `deferred.md` D-37
> ⚠️ 타깃 `docs/conventions/14-styling.md`는 `motion-reduce` 대응을 요구하지만,
> 레거시에 없으므로 추가하면 동작이 달라진다. 등가 이관 우선.

### 7-6. A-PAY 2카드 — `MainApayMenus`

`hasAptAPayQrContent || hasAptAPayPaymentContent`일 때만 렌더. `flex w-full gap-2`.

| 카드           | 제목                                                             | 클릭                                                | 조건                       |
| -------------- | ---------------------------------------------------------------- | --------------------------------------------------- | -------------------------- |
| `MainCardQR`   | `A-PAY 결제 QR` + `QR.svg`(`h-[24px] w-[24px]`, alt `QR 이미지`) | `${versionOneUrl}/apay/qrcode{쿼리}` 외부 링크      | `hasAptAPayQrContent`      |
| `MainCardAPay` | `A-PAY <br /> 결제금액` + `이용 내역`                            | `${versionOneUrl}/apay/use-history{쿼리}` 외부 링크 | `hasAptAPayPaymentContent` |

| 요소        | 클래스                                                                                                                                            |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| QR 카드     | `flex h-[54px] w-full cursor-pointer items-center justify-between gap-2 self-stretch rounded-lg bg-defaults-primary-background-primary px-4 py-3` |
| APay 카드   | `flex h-[54px] w-full cursor-pointer justify-between gap-2 rounded-lg bg-white px-4 py-3`                                                         |
| 제목        | `pretendard-14Bold`                                                                                                                               |
| `이용 내역` | `break-keep text-right text-defaults-tertiary-text-tertiary pretendard-12Regular`                                                                 |

`getCommunityQueryString()`이 붙는다. `useOpenExternalLink`로 이동(오프라인 가드 포함).

> ⚠️ QR 카드는 `bg-defaults-primary-background-primary`, APay 카드는 **`bg-white`** — 다르다.

---

## 8. 메뉴 스와이퍼 — `MainNavigationSwiper`

### 메뉴 목록 — `MAIN_SWIPER_MENU_LIST` (14종)

| contentName      | menuName       | iconName                     | menuUrl                                |
| ---------------- | -------------- | ---------------------------- | -------------------------------------- |
| `주차`           | 주차관리       | `icon-main-parking`          | `/parking`                             |
| `커뮤니티`       | 커뮤니티       | `icon-main-community`        | (외부)                                 |
| `커뮤니티V2`     | 커뮤니티V2     | `icon-main-community`        | (외부)                                 |
| `소통`           | 소통공간       | `icon-main-board-community`  | `/board/community`                     |
| `민원`           | 민원공간       | `icon-main-board-complaints` | `/board/complaints`                    |
| `하자보수`       | 하자보수       | `icon-main-repair`           | `/repair/list`                         |
| `이사예약`       | 이사예약       | `icon-main-moving`           | `/movingHouse/list`                    |
| `투표`           | 전자투표       | `icon-main-vote`             | `/vote/list`                           |
| `아파트몰`       | 조식예약       | `icon-main-aptmall`          | `/aptMall/myOrder`                     |
| —                | **관리사무소** | `icon-main-office`           | `/mypage/aptInfo`                      |
| `투표`           | 설문조사       | `icon-main-survey`           | `/survey/list`                         |
| `쇼핑몰`         | 쇼핑몰         | `icon-main-shopping`         | (외부)                                 |
| `로비폰`         | 공동 현관      | `icon-main-lobby`            | `/visit/lobbyPhone`                    |
| `소방 자가 점검` | 소방자가점검   | `icon-main-fire-inspection`  | `/fire-inspection` · **`isNew: true`** |

> ⚠️ **`contentName: '투표'`가 전자투표·설문조사 두 곳에 쓰인다.** 투표 콘텐츠가 있으면 둘 다 나온다.
> ⚠️ `useGetResidentDetailInfo`의 `CONTENT_TYPES.VOTE`는 **`'전자투표'`**인데
> 스와이퍼는 **`'투표'`**로 매칭한다. **서로 다른 문자열이다.** 서버 `contentList`에 어느 쪽이
> 들어오는지에 따라 카드/메뉴 노출이 갈린다. → `[확인 필요]` M-Q3
> ⚠️ `menuName`이 `이사예약`처럼 `contentName`과 같은 것도, `아파트몰 → 조식예약`처럼 다른 것도 있다.

### 필터링

```js
conditionalMenus = MAIN_SWIPER_MENU_LIST.filter(
  (menu) => menu.contentName && contentList.some((c) => c.name.trim() === menu.contentName),
)
fixedMenus = MAIN_SWIPER_MENU_LIST.filter((menu) => FIXED_MENUS.includes(menu.menuName))
return [...conditionalMenus, ...fixedMenus]
```

`FIXED_MENUS = ['관리사무소', '공지사항']`

> ⚠️ **`'공지사항'`은 `MAIN_SWIPER_MENU_LIST`에 없다.** 필터 결과에 잡히지 않아
> **죽은 항목**이다. 실제 고정 메뉴는 `관리사무소` 하나뿐. → `deferred.md` D-38
> ⚠️ **고정 메뉴가 항상 맨 뒤**에 온다 (조건부 메뉴 뒤에 concat).

### 슬라이드

| 항목            | 값                                                                                                                                                              |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 라이브러리      | `swiper/vue` + `Pagination` 모듈 → **`swiper/react`**                                                                                                           |
| 페이지당        | `ITEMS_PER_SLIDE = 8` (lodash `chunk`)                                                                                                                          |
| `slidesPerView` | 1, `spaceBetween` 50                                                                                                                                            |
| 슬라이드 높이   | `h-[186px]` (항목 8개면 `pb-5` 추가)                                                                                                                            |
| 그리드          | 4개 초과 → `grid grid-cols-4`, 1~4개 → `flex justify-center items-center`                                                                                       |
| 항목            | `flex flex-1 flex-col items-center justify-center gap-2`                                                                                                        |
| 아이콘          | `/assets/icons/mainMenu/{iconName}.svg`, `h-7 w-7`, alt `{menuName} 아이콘`                                                                                     |
| 라벨            | `w-full whitespace-nowrap text-center text-defaults-primary-text-primary pretendard-13Medium`                                                                   |
| New 배지        | `absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-alerts-error-background-error text-base-b-white pretendard-10SemiBold` → `N` |
| 로딩            | `flex h-[208px] w-full items-center justify-center rounded-xl bg-base-b-white` + `SpinnerCircle color="blue"`                                                   |

**페이지네이션 스타일** (`<style scoped>`, `:deep()`):

```css
:deep(.swiper-pagination-bullets) {
  top: 156px;
}
:deep(.swiper-pagination-bullet-active) {
  background: #0037be;
}
```

### 클릭 분기

| menuName     | 동작                                                                                 |
| ------------ | ------------------------------------------------------------------------------------ |
| `커뮤니티V2` | ⚠️ `${communityUrl}/login?residentUUID={uuid}&residentToken={accessToken}` 외부 링크 |
| `커뮤니티`   | `${versionOneUrl}/community/list{쿼리}` 외부 링크                                    |
| `쇼핑몰`     | 동의 플래그 있으면 `openShopping()`, 없으면 `openShoppingTerms` emit                 |
| 그 외        | `navigateTo(menu.menuUrl)`                                                           |

> ⚠️ **`커뮤니티V2`가 액세스 토큰을 URL 쿼리스트링으로 외부 사이트에 전달한다.**
> 브라우저 히스토리·리퍼러·서버 로그에 토큰이 남는다. **등가 이관으로 그대로 유지**하되
> 보안 항목으로 기록 → `deferred.md` D-39

동의 플래그 판정: `marketingDataConsentFlag != null && receiveAdvertsConsentFlag != null`
(**값이 아니라 `null` 여부**다 — 한 번이라도 선택했는지를 본다)

---

## 9. 광고 배너 — `MainAdvertisementBanner`

**단지 UUID로 3분기**한다.

| 조건                                                                 | 표시                                                                                 | 클릭                 |
| -------------------------------------------------------------------- | ------------------------------------------------------------------------------------ | -------------------- |
| `aptUuid === 'd7a74391-30c5-4e08-b4ac-429a861f4204'` (에테르노 청담) | `/assets/images/etc_banner.png` (alt `청담 에테르노 배너 이미지`)                    | 없음 (`<img>`)       |
| `aptUuid === 'e98d2646-e073-40e2-9a7c-0786c0ac7444'` (샘물정보통신)  | `${VITE_S3_BUCKET_URL_STATICS}/main_banner_advertising.png` (alt `배너 광고 이미지`) | 쇼핑몰 열기          |
| 그 외                                                                | **`/assets/mocks/BannerTemp.png`** (alt `배너 임시 이미지`)                          | 없음 (핸들러 미지정) |

| 요소      | 클래스                                                                                                                                                                                                           |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 컨테이너  | `relative flex h-24 w-full overflow-hidden rounded-md bg-defaults-tertiary-background-tertiary`                                                                                                                  |
| `Ad` 배지 | `absolute left-0 top-0 flex h-5 w-6 items-center justify-center gap-[10px] rounded-br-md bg-defaults-tertiary-icon-tertiary p-1 text-right text-defaults-secondary-text-secondary-inverse pretendard-10SemiBold` |
| 이미지    | `h-full w-full`                                                                                                                                                                                                  |

`Ad` 배지는 **에테르노 청담이 아닐 때만** 표시된다.

> ⚠️ **하드코딩된 단지 UUID 2개.** 에테르노 UUID는 상수(`HARDCODED_ETERNO_APT_UUID`)로도 정의돼 있는데
> 템플릿 `v-if`에서는 **문자열 리터럴을 다시 씀**(`MainAdvertisementBanner.vue:45-46`). 중복.
> ⚠️ **대부분의 단지가 `/assets/mocks/BannerTemp.png`를 본다** — `mocks` 폴더의 임시 이미지가
> 프로덕션에 나가고 있다. → `[확인 필요]` M-Q4, `deferred.md` D-40
> ⚠️ `import.meta.env.VITE_S3_BUCKET_URL_STATICS` **직접 참조** (`constants/api.js` 경유 안 함).

---

## 10. 공지 Top3 — `MainNoticeTopThree`

> **이관 필수.** API 주석의 `(미사용중)`은 낡은 것이다
> (`decisions/inventory-questions.md` E-Q5a).

| 요소             | 클래스                                                                                                                        |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| 컨테이너         | `space-y-[18px] rounded-xl bg-defaults-primary-background-primary p-4`                                                        |
| 헤더 버튼        | `flex w-full items-center justify-between` → `/board/notice`                                                                  |
| 제목             | `공지사항` — `pretendard-15Bold`                                                                                              |
| 더보기           | `더보기` + `ArrowRight.svg`(`h-3 w-3`) — `flex items-center text-defaults-secondary-text-secondary pretendard-12Medium`       |
| 더보기 표시 조건 | `!isLoading && noticeTopThree?.length > 0`                                                                                    |
| 목록             | `grid w-full grid-cols-[auto_1fr] items-start justify-center gap-x-[9px] gap-y-[9px] self-stretch`                            |
| 항목             | `<li class="contents">` — **grid 자식으로 펼침**                                                                              |
| 카테고리         | `max-w-16 overflow-hidden text-ellipsis whitespace-nowrap text-left text-defaults-tertiary-text-tertiary pretendard-13Medium` |
| 제목             | `overflow-hidden text-ellipsis whitespace-nowrap text-left text-defaults-primary-text-primary pretendard-14Regular`           |

| 상태    | 표시                                                                        |
| ------- | --------------------------------------------------------------------------- |
| 로딩    | 스켈레톤 3행 (`h-4 w-16` + `h-4 flex-1`), `gap-[9px]`                       |
| 에러    | `공지사항을 불러오는데 실패했습니다.` `<br />` `잠시 후 다시 시도해주세요.` |
| 빈 상태 | `공지사항이 없습니다.`                                                      |
| 정상    | 카테고리 + 제목 (각각 클릭 시 `/board/notice/detail/{uuid}`)                |

제목은 `formatHtmlText()`로 가공한다 (HTML 태그 제거 추정).

> ⚠️ `<li class="contents">`는 li 자체를 레이아웃에서 제거하고 자식을 grid 셀로 만든다.
> 카테고리·제목이 2열 그리드에 정렬되는 핵심이다. **그대로 재현.**

---

## 11. 쇼핑 마케팅 동의 — `MainShoppingTermsBottomSheet`

쇼핑몰 진입 시 동의 이력이 없으면(`marketingDataConsentFlag == null`) 뜬다.

| 요소        | 값                                                                                         |
| ----------- | ------------------------------------------------------------------------------------------ |
| 컨테이너    | `DrawerBase title="쇼핑 혜택 정보를 알려드릴게요"`                                         |
| 본문        | `max-h-[80vh] w-full overflow-y-auto px-5 pb-2 pt-4`                                       |
| 쿠폰 이미지 | `/assets/images/coupon.png` (alt `쿠폰 이미지`) — `mt-4 flex justify-center p-10`          |
| 약관 목록   | `TermsCheckboxList` — `MARKETING_TERMS_ITEMS` 2개, **초기값 `true`**                       |
| 안내        | `두 가지 항목을 모두 동의해야 소식을 받을 수 있어요.` — `text-center pretendard-14Regular` |
| 동의 버튼   | `동의하고 시작하기` — `color="brand"`, `size="xl"`, 로딩 시 `SpinnerCircle`                |
| 거절 버튼   | `괜찮아요` — `text-defaults-secondary-text-secondary`                                      |

**`useTermsAgreement(MARKETING_TERMS_ITEMS, { initialValue: true })`** — 기본 체크 상태로 시작한다
(`signup.md`의 약관 동의는 `false`로 시작). 연동 규칙 2·3은 동일하게 적용된다.

| 동작                | 흐름                                                                      |
| ------------------- | ------------------------------------------------------------------------- |
| `동의하고 시작하기` | `marketingConsentMutateAsync({체크값 2개})` → `openShopping()` → 닫기     |
| `괜찮아요`          | `declineTerms()` = 두 플래그 **`false`로 저장** → `openShopping()` → 닫기 |
| 약관 `[>]`          | `MainShoppingTermsModalPage` 열기 (`Transition name="fade"`)              |

> ⚠️ **거절해도 쇼핑몰은 열린다.** `declineTerms`가 `false`로 저장한 뒤 `openShopping()`을 호출한다.
> 동의 여부와 무관하게 진입 가능하고, 동의는 마케팅 수신용이다.

### 약관 상세 모달 — `MainShoppingTermsModalPage`

`ModalPage` + `IframeBase`. `TERMS_ITEMS`에서 `termsId`로 찾아
`${termsUrl}/${termsItem.id}`를 iframe으로 띄운다. (`signup.md` T1과 동일 구조)

### 쇼핑몰 열기 — `useShoppingNavigation`

```js
const shoppingToken = await refetchShoppingToken()
if (!shoppingToken.data) {
  showToast('현재 접속이 불가합니다. 잠시후 다시 시도해주세요')
  return
}

const url = `https://m-apartmant34.shopby.co.kr/?accessToken=${accessToken}&expiresIn=${expiresIn}&refreshToken=${refreshToken}&refreshTokenExpiresIn=${refreshTokenExpiresIn}`

isNativeApp()
  ? nativeOpenNewWebView({ url, type: 'SHOPPING', title: '쇼핑몰' }) // N8
  : window.open(url, '_blank')
```

> ⚠️ **쇼핑몰 URL이 하드코딩**(`m-apartmant34.shopby.co.kr`)이고
> **토큰 4개를 쿼리스트링으로 전달**한다. `커뮤니티V2`와 같은 유형 → `deferred.md` D-39

---

## 호출 API

| #   | 함수                         | 경로                                         | 사용처                                     |
| --- | ---------------------------- | -------------------------------------------- | ------------------------------------------ |
| 11  | `getResidentDetailInfo`      | `/apartmant/resident/apt-resident/{uuid}`    | 전역 게이트                                |
| 13  | `getResidentAptList`         | `/apartmant/resident/apt-resident/apt`       | 단지 전환 드로어 (`enabled: false`)        |
| 146 | `getImposeYearMonths`        | `.../bill/impose-yearmonths`                 | 관리비 카드                                |
| 147 | `getManagementFeeBill`       | `.../bill`                                   | 관리비 카드 (⚠️ `startDateTIme` 오타 보존) |
| 86  | `getParkingRemainingMileage` | `/parking/resident/{uuid}/mileage`           | 마일리지 카드                              |
| 24  | `getNoticeTopThree`          | `/board/resident/notice/{aptUuid}/top-three` | 공지 Top3                                  |
| 148 | `getShoppingToken`           | `/apartmant/resident/commerce/token`         | 쇼핑몰                                     |
| 18  | `putMarketingConsent`        | `.../notification-setting/marketing-consent` | 쇼핑 약관                                  |

**외부 링크 4종**: 커뮤니티V2, 커뮤니티(v1), A-PAY QR, A-PAY 이용내역, 쇼핑몰

---

## 상태

| 값                                                                               | 종류                  | 비고                         |
| -------------------------------------------------------------------------------- | --------------------- | ---------------------------- |
| `residentDetailInfo`                                                             | 서버                  | `staleTime: 5000`            |
| `residentAptList`                                                                | 서버                  | `enabled: false` — 수동 조회 |
| `imposeYearMonths`·`managementFeeBill`                                           | 서버                  | 관리비 카드                  |
| `parkingRemainingMileage`·`noticeTopThree`·`shoppingToken`                       | 서버                  |                              |
| `aptInfo`                                                                        | **클라이언트 (영속)** | ⚠️ 서버 데이터 복사본 (§2)   |
| `pushAuthorized`                                                                 | 로컬                  | ⚠️ 미사용                    |
| `permissionInfo`                                                                 | 로컬                  | A-PASS 배지                  |
| `isShoppingTermsOpen` · `isDrawerOpen` · `isAccessDeniedModalOpen` · `termsInfo` | 로컬                  | 오버레이                     |
| `selectedYear`·`selectedMonth`                                                   | 로컬                  | 관리비 카드                  |

---

## 네이티브 연동

| 시점                         | 메시지                                                                     |
| ---------------------------- | -------------------------------------------------------------------------- |
| 마운트                       | `GET_PERMISSION_INFO` (N3) — `MainView` + `MainCardApassBadge` **2곳에서** |
| 권한 정보 수신               | `CALLBACK_PERMISSION_INFO` (C3) — 2곳에서 구독                             |
| 단지 변경                    | `SEND_CHANGED_RESIDENT_INFO` (N11)                                         |
| `SMA0002`/개발모드 최초 진입 | `SEND_CHANGED_RESIDENT_INFO` (N11)                                         |
| 쇼핑몰 열기 (네이티브)       | `OPEN_NEW_WEBVIEW` (N8)                                                    |

---

## 엣지케이스

| 상황                             | 기대 동작                                                                                                                                     |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 아파트 구독 콘텐츠 0개           | 카드 프리셋 `1`로 폴백(`CARD_ORDER_PRESETS[count] \|\| [1]`), `LAYOUT_STRUCTURE[0]` 없으면 `[[0]]`. `enabledCards`가 비면 카드 영역이 빈 상태 |
| 카드 4개 + 관리비 미사용         | 순서 프리셋이 덮어써짐                                                                                                                        |
| A-PASS 미가입                    | 카드는 보이되 `미가입` 배지, 클릭 불가                                                                                                        |
| A-PASS 가입 + 블루투스/GPS 꺼짐  | `권한없음` 배지                                                                                                                               |
| 관리비 년월 목록 조회 실패       | 상세 이동 **불가**                                                                                                                            |
| 관리비 고지서만 실패             | 상세 이동 **가능**                                                                                                                            |
| 마일리지 `total = 0`             | 차트 퍼센트 `0%`                                                                                                                              |
| 세대 전출 (`RESIDENT_NOT_FOUND`) | 모달 → 남은 단지에 따라 로그아웃/전환                                                                                                         |
| 미승인 단지 선택                 | `승인되지 않은 단지입니다.` 모달                                                                                                              |
| 단지 전환                        | `contentList` 비웠다가 재조회 (⚠️ 경쟁 조건 §5)                                                                                               |
| 공지 없음                        | `공지사항이 없습니다.`                                                                                                                        |
| 쇼핑 토큰 발급 실패              | 토스트 `현재 접속이 불가합니다. 잠시후 다시 시도해주세요`                                                                                     |
| 오프라인에서 외부 링크           | `useOpenExternalLink`의 오프라인 가드                                                                                                         |

---

## QA 체크리스트

- [ ] 카드가 1·2·3·4·5개일 때 각각 배치가 프리셋대로인가
- [ ] 카드 4개 + 관리비 미사용일 때 순서가 바뀌는가
- [ ] 카드 5개일 때 2행 우측이 세로 2개로 쌓이는가
- [ ] 1행 높이가 `106px`로 고정되는가 (카드 2개 이상일 때)
- [ ] A-PASS 배지 4상태 (`미가입`/`미사용`/`사용중`/`권한없음`)
- [ ] 블루투스·GPS를 끄면 `권한없음`으로 바뀌는가
- [ ] 관리비 카드에 최신 년월이 자동 선택되는가
- [ ] 관리비 증감이 `▲`/`▼`와 색으로 구분되는가
- [ ] 긴 금액에서 폰트가 줄어드는가 (`clamp`)
- [ ] 마일리지 도넛 차트 퍼센트·색·중앙 텍스트
- [ ] 주차 방문예약 아이콘이 진입 시 2번 흔들리는가
- [ ] 스와이퍼가 8개 단위로 페이지 나뉘는가
- [ ] 소방자가점검에 `N` 배지가 뜨는가
- [ ] 관리사무소 메뉴가 **항상 맨 뒤**에 오는가
- [ ] 단지 전환 드로어: 현재 단지가 파란 테두리로 강조되는가
- [ ] 미승인 단지가 `승인대기중` 배지로 표시되는가
- [ ] 미승인 단지 클릭 → 접근 거부 모달
- [ ] **단지 전환 후 카드 구성이 새 단지에 맞게 바뀌는가** (§5 경쟁 조건)
- [ ] 단지 전환 후 네이티브에 올바른 A-PASS/로비폰 플래그가 전송되는가
- [ ] 공지 Top3 클릭 → 상세 이동
- [ ] 쇼핑몰 첫 진입 시 마케팅 동의 바텀시트
- [ ] `괜찮아요`를 눌러도 쇼핑몰이 열리는가
- [ ] 공지 팝업과 투표 팝업이 겹칠 때 **공지가 위**인가

---

## 이관 시 주의

| #   | 항목                                                                         |
| --- | ---------------------------------------------------------------------------- |
| 1   | `useGetResidentDetailInfo`는 **전역 게이트** — Phase 4에서 우선 이관         |
| 2   | 서버 데이터를 `aptInfo`(localStorage)로 복사하는 구조 유지                   |
| 3   | `useChangeApt`의 v4 `invalidateQueries` 변환 + 경쟁 조건 해소 (§5)           |
| 4   | 카드 레이아웃 프리셋·구조·layoutType 규칙 전부 이식                          |
| 5   | `<component :is>` → 컴포넌트 맵 객체                                         |
| 6   | ApexCharts radialBar → recharts (수치 그대로)                                |
| 7   | 하드코딩된 `aptId 'SMA0002'`, 단지 UUID 2개 유지                             |
| 8   | `NoticePopupModal`을 `VoteVoterHasPendingModal` **뒤에** 렌더                |
| 9   | 토큰을 URL로 넘기는 외부 링크 2곳 유지 (커뮤니티V2, 쇼핑몰)                  |
| 10  | `CALLBACK_PERMISSION_INFO` 구독 2곳 + `GET_PERMISSION_INFO` 호출 2곳 유지    |
| 11  | `import.meta.env.MODE`·`VITE_S3_BUCKET_URL_STATICS` 직접 참조 → `env` 객체로 |
| 12  | `<li class="contents">` grid 트릭 유지                                       |
| 13  | swiper `:deep()` 페이지네이션 스타일 이식                                    |

## `[확인 필요]`

> **2026-07-31 사용자 응답 — 전부 현행 유지.** 아래 표의 상태를 갱신했다.
> **이관 코드는 어느 것도 바뀌지 않는다.** M-Q1·M-Q5는 답이 오면 그때 정리한다.

| #        | 질문                                                                                                                                                         | 상태                                                                                    |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------- |
| M-Q1     | `aptId === 'SMA0002'` 우회 코드 — 앱 비컨 갱신 이슈가 해결됐는가? 아직 필요한가?                                                                             | 🟡 **확인 필요 · 현행 유지** — 앱 팀 확인 후 불필요하면 `useBeaconWorkaround` 통째 삭제 |
| M-Q2     | 단지 전환 후 네이티브에 잘못된 플래그(전부 false)가 가는 증상이 있었는가? (§5)                                                                               | ⚪ **참고용** — 이관본은 이미 고쳐져 있다(D-36). 답과 무관하게 코드 변경 없음           |
| ~~M-Q3~~ | ~~투표 콘텐츠 이름이 `'투표'`인가 `'전자투표'`인가~~ → **확정: `hasAptVoteContent`가 미사용이라 `'전자투표'` 비교는 죽은 코드. 실제 게이트는 `'투표'`** (§2) | ✅ 확정                                                                                 |
| M-Q4     | 대부분 단지가 보는 배너가 `mocks/BannerTemp.png`인 게 맞는가?                                                                                                | ✅ **확정: 맞다** (2026-07-31). 그대로 이관 — `deferred.md` D-40은 닫는다               |
| M-Q5     | `pushAuthorized`를 저장만 하고 안 쓰는 게 맞는가?                                                                                                            | 🟡 **확인 필요 · 현행 유지** — 이관본은 저장하지 않는다(D-33). 쓸 데가 생기면 되살린다  |
