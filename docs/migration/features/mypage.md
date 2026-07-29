# 도메인 명세 — 마이페이지 (mypage)

> 기준 SHA `6d5bf22` · 레거시 `views/MyPageView/` 19개 파일 1,149 LOC
> 타깃 슬라이스 `features/mypage/` (로그아웃은 `features/auth/` — `auth.md` A7)

## 화면 목록

| #   | 경로                      | name           | 컴포넌트                            | meta                                                    |
| --- | ------------------------- | -------------- | ----------------------------------- | ------------------------------------------------------- |
| P1  | `/mypage`                 | 나의페이지     | `MyPageView.vue`                    | `showAppBar:false`, **`showBottomNav:true`**, **eager** |
| P2  | `/mypage/profile`         | 내 프로필      | `MyProfile/MyProfileView.vue`       | `showAppBar:false`                                      |
| P3  | `/mypage/profile/edit`    | 내 프로필 수정 | `MyProfile/MyProfileEditView.vue`   | `showAppBar:false`                                      |
| P4  | `/mypage/alarmSetting`    | 알림 설정      | `AlarmSetting/AlarmSettingView.vue` | AppBar `알림 설정`                                      |
| P5  | `/mypage/aptInfo`         | 관리사무소     | `Office/OfficeInfoView.vue`         | AppBar `관리사무소`                                     |
| P6  | `/mypage/termsOfUse`      | 약관 및 정책   | `TermsOfUse/TermsOfUseView.vue`     | AppBar `약관 및 정책`                                   |
| P7  | `/mypage/fontSizeSetting` | 글자 크기 설정 | `MyPageFontSizeView.vue`            | AppBar `글자 크기 설정`                                 |
| P8  | `/mypage/accountDeletion` | 회원 탈퇴      | `MyPageAccountDeletionView.vue`     | AppBar `회원 탈퇴`                                      |
| —   | `/logout`                 | 로그아웃       | `MypageLogoutView.vue`              | → **`auth.md` A7**                                      |

> ⚠️ **P2·P3은 라우트 meta로 AppBar를 끄고 화면 안에서 직접 렌더한다** — 우측 액션 버튼
> (`수정`/`완료`)을 넣기 위해서다 (`signup.md` S3·S4와 같은 패턴).

### 하위 컴포넌트

| 파일                                         |  줄 | 역할                      |
| -------------------------------------------- | --: | ------------------------- |
| `MyPageProfile.vue`                          |  46 | P1 상단 프로필 카드       |
| `MyPageMenuList.vue`                         | 105 | P1 메뉴 그룹 목록         |
| `MyPageMenuGroupItem.vue`                    |  37 | 메뉴 그룹 1개             |
| `MyPageVersion.vue`                          |  74 | 앱 버전 표시              |
| `MyProfile/MyProfilePasswordEditModal.vue`   | 150 | 비밀번호 변경 모달        |
| `AlarmSetting/AlarmSettingMenuGroupItem.vue` |  48 | 알림 그룹 1개             |
| `Office/OfficeInfoContactList.vue`           |  50 | 부서별 연락처             |
| `Office/OfficeInfoBusinessHour.vue`          |  44 | 운영시간                  |
| `MyPageFontSizeSlider.vue`                   | 115 | 글자 크기 슬라이더        |
| `MyPageFontSizeItem.vue`                     |  40 | ⛔ **미사용 (죽은 파일)** |

---

## P1. 마이페이지

### 화면 구성

```
┌─────────────────────────────┐
│ 마이페이지                    │  h1, bg-white, px-5 py-3, pretendard-20Bold
├─────────────────────────────┤
│ ┌─────────────────────────┐ │
│ │ [👤] 홍길동              │ │  MyPageProfile (카드, shadow-md)
│ │      아파트먼트 아파트     │ │
│ │      101동 1001호      > │ │
│ └─────────────────────────┘ │
│ ─ 주차 ─────────────────── │  MyPageMenuList
│   주차관리                > │
│   잔여 주차 마일리지        > │
│   정기권 등록 차량          > │
│ ─ 출입 ─────────────────── │
│   ...                       │
│                             │
│ 최신 버전 1.2.3   개인정보처리방침│  하단
└─────────────────────────────┘
```

| 요소             | 클래스 (원문)                                                                                                                            |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| 루트             | `h-full bg-defaults-secondary-background-secondary`                                                                                      |
| 제목             | `bg-base-b-white px-5 py-3 pretendard-20Bold` → `마이페이지`                                                                             |
| 스크롤 영역      | `h-[calc(100%-52px)] overflow-auto` ← **제목 높이 52px 하드코딩**                                                                        |
| 하단 바          | `flex w-full items-center justify-between bg-defaults-secondary-background-secondary px-5 py-3`                                          |
| 개인정보처리방침 | `cursor-pointer text-defaults-secondary-text-secondary underline underline-offset-2 pretendard-12Regular` → `/termsOfUse/privacy-policy` |

`onMounted`의 `reloadIfNewVersion()`은 **주석 처리**돼 있다 (`main.md`와 동일).

### 프로필 카드 — `MyPageProfile`

| 요소   | 값 / 클래스                                                                                                                                                                              |
| ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 바깥   | `flex w-full items-center justify-between gap-4 p-5`                                                                                                                                     |
| 카드   | `flex w-full items-center justify-between gap-5 rounded-xl bg-white px-6 py-5 shadow-md` → `/mypage/profile`                                                                             |
| 아바타 | `Profile.svg` (alt **`프로필 이미지 `** ← 끝에 공백), `h-12 w-12`, 래퍼 `border-neutral-10 bg-neutral-10 flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border` |
| 이름   | `authStore.getAptInfo()?.residentName \|\| '-'` — `pretendard-16Bold`                                                                                                                    |
| 단지명 | `residentDetailInfo?.aptName` — `text-neutral-90 flex flex-col gap-1 pretendard-14SemiBold`                                                                                              |
| 동/호  | `{dong \|\| 0}동 {ho \|\| 0}호` — `residentDetailInfo`에서                                                                                                                               |
| 화살표 | `ArrowRight.svg`, alt **`아이콘`**, `h-6 w-6`                                                                                                                                            |

> ⚠️ **이름은 `authStore`(localStorage), 단지·동호수는 `residentDetailInfo`(서버)에서 읽는다.**
> 출처가 섞여 있다. 등가 이관 원칙상 그대로.
> ⚠️ alt에 오타성 값이 있다 — `프로필 이미지 `(공백), `아이콘`. 그대로 이식.

### 메뉴 그룹 — `MyPageMenuList`

**7개 그룹**을 콘텐츠 보유 여부로 필터링한다.

| 그룹                  | 항목                                                                                                                                                                 | 노출 조건              |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| `주차`                | `주차관리`(`/parking`) · `잔여 주차 마일리지`(`/parking/mileage/history`) · `정기권 등록 차량`(`/parking/regular-car`)                                               | `hasAptParkingContent` |
| `출입`                | `A-PASS`(`/apass`)                                                                                                                                                   | `hasAptApassContent`   |
| `게시판`              | `게시판 미노출 사용자 관리`(`/board/setting/userBlock`, **항상**) · `소통공간 활동`(`/board/community/activities`) · `민원공간 활동`(`/board/complaints/activities`) | 소통 \|\| 민원         |
| `알림`                | `알림 설정`(`/mypage/alarmSetting`)                                                                                                                                  | **항상**               |
| `아파트 생활`         | `관리사무소`(`/mypage/aptInfo`) · `공지사항`(`/board/notice`) · `소방 자가 점검`(`/fire-inspection`)                                                                 | **항상**               |
| `아파트먼트 공지사항` | `아파트먼트 공지사항`(`/board/global-notice`)                                                                                                                        | **항상**               |
| `기타`                | `약관 및 정책`(`/mypage/termsOfUse`) · `글자 크기 설정`(`/mypage/fontSizeSetting`) · `로그아웃`(`/logout`) · `회원탈퇴`(`/mypage/accountDeletion`)                   | **항상**               |

**2단계 필터**: 그룹의 `isActive`로 거르고, 그룹 안 항목의 `isActive`로 다시 거른다
(`isActive === undefined`면 통과).

> ⚠️ **`filterGroupList`가 `null`을 걸러내지 않는다** (`MyPageMenuList.vue:79-92`).
> 항목이 0개면 `null`을 반환하는데 `.filter(Boolean)`이 없어 `v-for`에 `null`이 들어갈 수 있다.
> 실제로는 `게시판` 그룹의 첫 항목이 무조건 통과하므로 발생하지 않는다. → `deferred.md` D-43
> ⚠️ **`소방 자가 점검`은 `아파트 생활` 그룹에서 항상 보인다** — 스와이퍼(`main.md` §8)에서는
> `contentName: '소방 자가 점검'`으로 게이팅되는데 여기선 조건이 없다. **비대칭.** → `[확인 필요]` P-Q1

### 그룹 렌더 — `MyPageMenuGroupItem`

| 요소      | 클래스                                                                                                                     |
| --------- | -------------------------------------------------------------------------------------------------------------------------- |
| 그룹      | `border-neutral-20 flex h-fit flex-col items-start gap-[3px] self-stretch border-b bg-base-b-white px-5 py-4`              |
| 그룹 제목 | `text-brand-primary-50 pretendard-13SemiBold`, 래퍼 `flex items-center justify-center gap-2.5 px-2.5 py-[7px]`             |
| 항목      | `flex w-full cursor-pointer items-center justify-between self-stretch px-2.5 py-2 text-base-b-black pretendard-15SemiBold` |
| 화살표    | `ArrowRight.svg` (alt `화살표 아이콘`, `h-6 w-6`)                                                                          |

### ⚠️ 앱 버전 — `MyPageVersion` (동작하지 않는다)

```js
const STORAGE_KEY = 'version'
serverAppVersion = isIos ? version?.appIosVersion : version?.appAndroidVersion
compareVersion = compareSemver(nativeAppVersion, serverAppVersion)
```

| `compareSemver` 결과            | 표시                   |
| ------------------------------- | ---------------------- |
| `'latest'`                      | `최신 버전 {native}`   |
| `'unknown'`                     | `버전 없음`            |
| `'outdated'` · `'ahead'` · 기타 | `현재 버전 : {native}` |

**동작**

- `onMounted`: `emitter.on(CALLBACK_APP_VERSION, handler)` **먼저 등록** → `nativeGetAppVersion()` (N1) → localStorage 읽기
- `onUnmounted`: `emitter.off(...)` ← **레거시에서 유일하게 해제까지 하는 곳**
- OS 판정: `checkDeviceOs().isIOS`

> ⚠️ **`localStorage['version']`을 쓰는 곳이 코드 전체에 없다.**
> `setItem` 전수 조사 결과 localStorage 쓰기는 주석 처리된 1곳뿐이고 나머지는 전부 `sessionStorage`다.
> VueUse `useStorage` 키 8종에도 `version`이 없다. `getApartmantVersion` API도 **호출부가 없다.**
>
> → `serverAppVersion`이 항상 `undefined` → `compareSemver(x, undefined)`가 `'unknown'` 반환
> → **화면에 항상 `버전 없음`이 표시된다.**
>
> 유일한 가능성은 **네이티브 앱이 웹뷰 localStorage에 직접 쓰는 것**이다.
> → `[확인 필요]` P-Q2, `deferred.md` D-44

### localStorage 키 — 8종 (정정)

`auth-strategy.md`에 6종으로 적었으나 **실측 8종**이다. R13(기존 사용자 세션 단절)에서
전부 보존해야 한다.

| 키                                | 용도                               |
| --------------------------------- | ---------------------------------- |
| `accessToken` · `refreshToken`    | 토큰                               |
| `authUser`                        | 사용자 정보                        |
| `userAuthInfo`                    | 아이디·비밀번호 평문 (자동 로그인) |
| `aptInfo`                         | 단지 컨텍스트                      |
| `fontSize`                        | 글자 크기                          |
| `surveyCertInfo` · `voteCertInfo` | 설문·투표 본인인증                 |

(+ `version`은 읽기 전용이며 쓰는 주체 불명)

---

## P2. 내 프로필

AppBar를 화면 안에서 렌더하고 우측에 `수정` 버튼을 넣는다 → `/mypage/profile/edit`.

| 요소    | 값 / 클래스                                                                                                                                               |
| ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 루트    | `h-full w-full overflow-auto`                                                                                                                             |
| AppBar  | `title="내 정보"` + 우측 슬롯 `수정`                                                                                                                      |
| 목록    | `h-full w-full space-y-8 px-5 pt-16`                                                                                                                      |
| 아바타  | `Profile.svg` (alt `프로필 이미지`), `h-20 w-20`, 래퍼 `border-neutral-10 flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border` |
| 정보 행 | `flex w-full items-start justify-between gap-2.5`                                                                                                         |
| 라벨    | `w-[140px] pretendard-15SemiBold`                                                                                                                         |

**표시 항목 3개** — 전부 `authStore.getAptInfo()`에서 읽는다:

| 라벨       | 값                 | 값 없을 때                  | 클래스                                                                                       |
| ---------- | ------------------ | --------------------------- | -------------------------------------------------------------------------------------------- |
| `닉네임`   | `residentNickName` | **`닉네임을 설정해주세요`** | 있으면 `text-neutral-90 pretendard-15Regular`, 없으면 `text-neutral-40 pretendard-15Regular` |
| `이름`     | `residentName`     | `-`                         | `text-neutral-90 pretendard-15Regular`                                                       |
| `아파트명` | `aptName`          | `-`                         | 〃                                                                                           |

> ⚠️ `userInfos`가 **`computed`가 아니라 일반 배열**이다 (`MyProfileView.vue:11`).
> 마운트 시점의 값으로 고정되고 이후 갱신되지 않는다. React에서는 렌더 중 계산하면
> 자동으로 최신값이 되는데 — **동작이 미묘하게 달라질 수 있다.** 이 화면은 진입 시
> 값이 이미 확정돼 있어 실질 차이가 없지만, 기록해둔다. → `deferred.md` D-45

---

## P3. 내 프로필 수정

AppBar 우측이 `완료`(제출 버튼)다.

| 요소             | 값 / 클래스                                                                      |
| ---------------- | -------------------------------------------------------------------------------- |
| AppBar 버튼      | `form="profileEditForm"`, `type="submit"`, `:disabled="isPatchMyProfilePending"` |
| 버튼 활성 스타일 | `meta.valid ? 'text-brand-default-text-brand' : ''`                              |
| 제출 중          | `SpinnerCircle color="blue"` (조건: `isSubmitting \|\| isPatchMyProfilePending`) |
| 본문             | `h-full w-full px-5 pt-16`                                                       |
| 아바타           | `mx-auto h-20 w-20`, 래퍼 `border-neutral-10 ... rounded-full border`            |
| 필드 영역        | `mt-8 space-y-6 pb-5`                                                            |
| 라벨             | `text-neutral-90 pretendard-15SemiBold`                                          |

### 필드

| 필드     | 값                                     | 편집                          |
| -------- | -------------------------------------- | ----------------------------- |
| `이름`   | `authStore.getAptInfo().residentName`  | **`is-disabled`** — 읽기 전용 |
| `닉네임` | `initialValues`에서 `residentNickName` | 편집 가능, `maxlength=10`     |

placeholder: `이름을 입력해주세요` / `닉네임을 설정해주세요`

> ⚠️ **이름 입력은 폼 밖에 있다.** `<form id="profileEditForm">`은 닉네임만 감싼다
> (`MyProfileEditView.vue:88-108`). 제출되는 값은 닉네임뿐이다.

스키마: `resident.js` `mypageProfileFormSchema` = `{ nickName, name }`

> **P-Q3 확인 완료 — 정상이다.** `InputBase`는 `useField(props.id, ...)`로 등록한다
> (`InputBase.vue:59`). 즉 **필드명은 `id` prop**이고, `<InputBase id="name">`는 `name` 필드를
> 폼 컨텍스트에 등록한다. vee-validate는 DOM이 아니라 컴포넌트 컨텍스트로 동작하므로
> **`<form>` 태그 밖에 있어도 폼에 포함된다.** 스키마의 `name`은 정상적으로 채워진다.
>
> ⚠️ **이관 시 중요**: 레거시 폼 필드명은 `name` prop이 아니라 **`id` prop**이다.
> `name` prop은 따로 존재하지만 `useField`에 전달되지 않는다(HTML 속성 용도).
> RHF로 옮길 때 `register('필드명')`의 필드명은 **레거시의 `id` 값**을 따라야 한다.

### 비밀번호 변경 모달 — `MyProfilePasswordEditModal`

`비밀번호 변경하기` 버튼(`round-type="rounded"`, `color="brand"`, `class="mt-2"`)으로 연다.

| 요소      | 클래스                                                                                   |
| --------- | ---------------------------------------------------------------------------------------- |
| 모달      | `flex w-[334px] max-w-[80vw] flex-col rounded-lg bg-base-b-white`                        |
| 헤더      | `mb-2 flex w-full items-center justify-between p-5 pb-2`                                 |
| 제목      | `비밀번호 변경하기` — `text-base-b-black pretendard-18Bold`                              |
| 닫기      | `×` (문자) — `flex h-7 w-7 items-center justify-center` + `pretendard-20Bold`            |
| 폼        | `p-5 pt-2`, `@submit.prevent`                                                            |
| 라벨      | `text-neutral-70 mb-1 block pretendard-14Medium` + `<span class="text-red-500">*</span>` |
| 에러      | `mt-1 pretendard-12Regular`                                                              |
| 제출 버튼 | `round-type="rounded"`, `color="brand"`, `custom-class="w-full flex justify-center"`     |

**필드 3개** (전부 `type="password"`, `is-required`):

| id                | 라벨              | placeholder                       |
| ----------------- | ----------------- | --------------------------------- |
| `currentPassword` | `현재 비밀번호`   | `현재 비밀번호를 입력해주세요`    |
| `newPassword`     | `변경할 비밀번호` | `변경할 비밀번호를 입력해주세요`  |
| `confirmPassword` | `비밀번호 확인`   | `비밀번호를 한번 더 입력해주세요` |

스키마: `resident.js` `passwordFormSchema` — `newPassword`·`confirmPassword`에 `PASSWORD_REGEX`,
스키마 레벨 `.refine`으로 일치 검사 (`path: ['confirmPassword']`, 메시지 `비밀번호가 일치하지 않습니다.`)

**제출**: `patchPasswordEditMutation({ oldPassword: currentPassword, password: newPassword })`
→ 필드명이 바뀐다.

**버튼 활성 조건** — `isFormValid`:

```js
values.currentPassword &&
  values.newPassword &&
  values.confirmPassword &&
  Object.keys(errors.value).length === 0
```

> ⚠️ 스키마 유효성(`meta.valid`)이 아니라 **값 존재 + 에러 없음**으로 판정한다. 그대로 재현.

**성공 시**: `watch(isPatchPasswordEditSuccess)` → `emit('close')` — 모달만 닫힌다.

---

## P4. 알림 설정

`useAlarmSetting`(272 LOC)이 **훅 8개를 조합**해 그룹 4개를 만든다.

### 화면

| 상태      | 표시                                                                                                                 |
| --------- | -------------------------------------------------------------------------------------------------------------------- |
| 로딩      | `SpinnerDots` (조건: `isResidentDetailInfoLoading \|\| isNotificationSettingLoading`)                                |
| 그룹 있음 | `AlarmSettingMenuGroupItem` 반복                                                                                     |
| 그룹 없음 | `알림 설정을 불러올 수 없습니다.` — `flex h-full items-center justify-center bg-defaults-primary-background-primary` |

루트: `h-full w-full space-y-2 overflow-auto bg-defaults-secondary-background-mono pb-10`

### 그룹 4종

| 그룹                            | 항목                                                                 | 노출 조건                                 |
| ------------------------------- | -------------------------------------------------------------------- | ----------------------------------------- |
| `주차`                          | `정기 차량 입출차 알림` / `외부 차량 입출차 알림`                    | `hasAptParkingContent`                    |
| `로비폰`                        | `로비폰 세대호출 알림`                                               | `hasLobbyPhone`                           |
| `세대 월패드`                   | `우리집 월패드 입출차 알림`                                          | `hasWallPadAlarmUI` (`useWallPadContent`) |
| `혜택·이벤트 및 기타 푸시 알림` | `마케팅 목적의 개인정보 수집 및 이용 동의` / `광고성 정보 수신 동의` | **항상**                                  |

**부가 설명(`info`)**

| 항목      | info                                     |
| --------- | ---------------------------------------- |
| 정기 차량 | `입주민 차량, 정기 차량 알림`            |
| 외부 차량 | `방문예약, 항상허용, 일반방문 차량 알림` |
| 나머지    | `''` (빈 문자열)                         |

### 값 우선순위 — `getFlag`

```js
getFlag(key, mutationData) =
  mutationData?.value?.data?.success?.[key] ?? notificationSetting?.value?.[key]
```

**mutation 응답값이 있으면 그것을, 없으면 통합 조회값을 쓴다.**
낙관적 업데이트 없이 응답으로 즉시 반영하는 패턴이다. React에서도 동일하게.

### 마케팅 ↔ 광고성 양방향 연동 — `changeTermsState`

`signup.md`의 `useTermsAgreement`와 **같은 규칙, 다른 구현**이다.

| 토글   | 값      | 결과                                                 |
| ------ | ------- | ---------------------------------------------------- |
| 마케팅 | `true`  | 마케팅 `true`, 광고성은 **기존값 유지** (`?? false`) |
| 마케팅 | `false` | **둘 다 `false`**                                    |
| 광고성 | `true`  | 광고성 `true`, **마케팅도 `true`**                   |
| 광고성 | `false` | 광고성 `false`, 마케팅은 **기존값 유지**             |

마지막에 `if (!marketingFlag)`면 **둘 다 `false`로** 보낸다.

### 동의 토스트

```js
showToast(`${label} <br/> 동의 ${flag ? '일시' : '해제 일시'} ${date.slice(0, 16)}`)
```

| label                                 | 날짜 키                                     |
| ------------------------------------- | ------------------------------------------- |
| `마케팅 목적의 개인정보 수집 및 이용` | `marketingDataConsentLastModifiedDateTime`  |
| `광고성 정보 수신`                    | `receiveAdvertsConsentLastModifiedDateTime` |

> ⚠️ **토스트가 HTML을 렌더한다 (P-Q4 확인 완료).**
> `ToastContainer.vue:20`이 **`<div v-dompurify-html="toast" />`**로 렌더한다 —
> DOMPurify로 살균한 뒤 HTML로 삽입하므로 `<br/>`이 **실제 줄바꿈**으로 보인다.
>
> **sonner 이관 시 문자열을 그대로 넣으면 `<br/>`이 텍스트로 노출된다.**
> sonner는 `ReactNode`를 받으므로 `toast(<>{label}<br />{info}</>)` 형태로 넘기거나,
> 줄바꿈을 컴포넌트로 표현해야 한다. **토스트 API 설계 시 이 케이스를 반영할 것.**
> `v-dompurify-html`은 전체 25개 파일에서 쓰인다 (`tech-mapping.md` §3-2).

### 그룹 렌더 — `AlarmSettingMenuGroupItem`

| 요소     | 클래스                                                                                                                                       |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| 그룹     | `border-neutral-20 flex flex-col items-start gap-0.5 self-stretch border-b bg-base-b-white p-4`                                              |
| 제목     | `text-defaults-secondary-text-secondary pretendard-14SemiBold`, 래퍼 `flex items-center justify-center gap-2.5 px-2.5 py-1.5`                |
| 항목     | `flex w-full items-center justify-between gap-3 px-2.5 py-4` + **마지막이 아니면** `border-b border-defaults-secondary-background-secondary` |
| 라벨     | `text-neutral-90 pretendard-15SemiBold`                                                                                                      |
| 부가설명 | `w-full text-defaults-secondary-text-secondary pretendard-12Regular`                                                                         |
| 토글     | `ToggleBase` — `:disabled="item?.isPending"`, `:toggle-state="item?.isActive"`                                                               |

**토글 변경**: `item.updateMutation({ [item.key]: state })`

> ⚠️ **`isDisabled`가 무시된다.** 광고성 항목에 `isDisabled: !marketingFlag`가 정의돼 있지만
> (`useAlarmSetting.js:238`), `AlarmSettingMenuGroupItem`은 **`item?.isPending`만** `disabled`로
> 넘긴다 (`:44`). 즉 마케팅 미동의 상태에서도 광고성 토글이 활성화된다.
> 누르면 `changeTermsState`가 마케팅까지 켜준다. → `deferred.md` D-46

---

## P5. 관리사무소

| 요소   | 클래스                                                                                              |
| ------ | --------------------------------------------------------------------------------------------------- |
| 루트   | `h-full space-y-2 overflow-auto bg-defaults-secondary-background-secondary`                         |
| 헤더   | `border-b-neutral-20 flex w-full flex-col items-start gap-5 border-b bg-base-b-white px-5 py-6`     |
| 로고   | `flex h-14 w-14 items-center justify-center rounded-[36px] border border-[#ebebeb] bg-base-b-white` |
| 단지명 | `text-neutral-90 flex flex-col gap-2 pretendard-16Bold`                                             |

로고는 `authStore.getAptInfo()?.aptLogoFileUrl` 있으면 `${s3UrlFile}{경로}` (alt `{aptName} 로고`),
없으면 `aptmantLogoShort.png` (alt `아파트먼트 기본 로고`) — **`main.md` 헤더와 동일 규칙, 크기만 다름**(24px vs 56px).

### 연락처 — `OfficeInfoContactList`

| 요소      | 값 / 클래스                                                                                                                                                                                                     |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 섹션      | `border-b-neutral-20 flex flex-col items-start gap-1 self-stretch border-b bg-base-b-white px-5 py-4`                                                                                                           |
| 제목      | `Phone.svg`(alt `전화기 아이콘`, `h-4 w-4`) + `연락처` — `text-brand-primary-50 flex items-center justify-center gap-1 px-2.5 py-[7px] pretendard-13SemiBold`                                                   |
| 행        | `flex w-full items-center justify-between px-2.5 py-3`                                                                                                                                                          |
| 부서명    | `item.name` — `text-neutral-90 pretendard-15SemiBold`                                                                                                                                                           |
| 전화 링크 | **`<a href="tel:{phone}">`** + `PhoneRing.svg`(alt `전화기 아이콘`) + `formatPhone(phone)` — `text-brand-primary-100 flex items-center justify-end gap-[2px] underline underline-offset-4 pretendard-15Regular` |
| 빈 상태   | `등록된 연락처가 없습니다.` — `text-neutral-90 flex h-[100px] w-full items-center justify-center pretendard-15Regular`                                                                                          |

> `tel:` 링크는 **네이티브 전화 앱을 연다.** 웹뷰에서 동작 확인 필요.

### 운영시간 — `OfficeInfoBusinessHour`

| 요소    | 값                                                                                                                                    |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| 제목    | `Clock.svg`(alt `시간 아이콘`) + `운영시간`                                                                                           |
| 요일    | `formatDay(item.dayType)` — `text-neutral-90 pretendard-15SemiBold`                                                                   |
| 시간    | `{startTime.slice(0,5)}~{endTime.slice(0,5)}` — `text-brand-primary-100 flex items-center justify-end gap-[2px] pretendard-15Regular` |
| 빈 상태 | `등록된 내용이 없습니다.`                                                                                                             |

> `slice(0, 5)`로 `HH:mm:ss` → `HH:mm`. 그대로 이식.
> 섹션에 `border-b`가 **없다** (연락처와 다름).

---

## P6. 약관 및 정책

`TERMS_ITEMS` 4개를 나열하고 각각 `/termsOfUse/{id}`로 이동한다 (`signup.md` T1).

| 요소 | 클래스                                                                                                                   |
| ---- | ------------------------------------------------------------------------------------------------------------------------ |
| 목록 | `flex w-full flex-col items-start self-stretch bg-base-b-white`                                                          |
| 항목 | `flex w-full cursor-pointer items-center justify-between self-stretch px-5 py-4 text-base-b-black pretendard-15SemiBold` |

**표시되는 것은 `item.title`이다** (`item.label` 아님):
`서비스 약관` · `개인정보처리방침` · `마케팅 목적의 개인정보 수집 및 이용` · `광고성 정보 수신`

> ⚠️ 항목에 화살표 아이콘이 **없다** (다른 메뉴 목록과 다름).

---

## P7. 글자 크기 설정

### 화면

| 요소          | 값 / 클래스                                                                                                                                                                                |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 루트          | `h-full bg-defaults-secondary-background-secondary`                                                                                                                                        |
| 미리보기      | `flex h-[160px] items-center justify-center space-y-3 border-b bg-defaults-primary-background-mono p-4 px-3 py-2 text-center transition-all duration-300 ease-in-out pretendard-15Regular` |
| 미리보기 문구 | `글자가 이 크기로 표시됩니다.` `<br />` `Text will be displayed at this size.`                                                                                                             |
| 설정 카드     | `space-y-4 border-t-8 border-defaults-tertiary-border-tertiary bg-defaults-primary-background-mono p-4`                                                                                    |
| 현재 라벨     | `fontSizeStore.fontSizeLabel`                                                                                                                                                              |

### 슬라이더 — `MyPageFontSizeSlider`

`<progress>`(진행률 표시, `pointer-events-none`) + `<input type="range">`(실제 입력)를
**겹쳐 놓는** 구조다.

| 요소        | 클래스                                                                                                                                                           |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 컨테이너    | `flex gap-3`                                                                                                                                                     |
| 좌/우 라벨  | `가-` / `가+` — `text-sm text-defaults-secondary-text-secondary`                                                                                                 |
| progress    | `progress-bar pointer-events-none absolute top-3 z-[5] h-2 w-full appearance-none rounded-md border-0 transition-all duration-300 ease-in-out`                   |
| range       | `range-input relative z-10 h-7 w-full appearance-none bg-transparent`                                                                                            |
| 점 표시     | `h-2 w-2 rounded-full transition-all duration-300 ease-in-out` — 선택 시 `scale-125 bg-brand-default-background-brand`, 아니면 `scale-100 bg-neutral-b-gray-300` |
| 점 컨테이너 | `mt-3 flex justify-between px-1`                                                                                                                                 |

**`<style scoped>` 의사요소 스타일** — Tailwind `@apply`와 원시 CSS가 섞여 있다:

| 선택자                                        | 내용                                                                                                                                                                                                                                       |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `.progress-bar::-webkit-progress-bar`         | `@apply rounded-md bg-neutral-b-gray-200`                                                                                                                                                                                                  |
| `.progress-bar::-webkit-progress-value`       | `@apply rounded-md transition-[width] duration-300 ease-in-out` + `background-color: #0037be`                                                                                                                                              |
| `.progress-bar::-moz-progress-bar`            | 〃                                                                                                                                                                                                                                         |
| `.range-input::-webkit-slider-runnable-track` | `@apply h-[6px] rounded-md bg-transparent`                                                                                                                                                                                                 |
| `.range-input::-moz-range-track`              | 〃                                                                                                                                                                                                                                         |
| `.range-input::-webkit-slider-thumb`          | `@apply h-[22px] w-[22px] rounded-full border-[3px] border-brand-default-border-brand bg-base-b-white transition-all duration-200 ease-in-out` + `-webkit-appearance: none` + `margin-top: -8px` + `box-shadow: 0 1px 3px rgba(0,0,0,0.2)` |
| `:hover`                                      | `@apply scale-110` + `box-shadow: 0 2px 6px rgba(0,0,0,0.3)`                                                                                                                                                                               |
| `:active`                                     | `@apply scale-105`                                                                                                                                                                                                                         |
| `.range-input::-moz-range-thumb`              | webkit과 동일                                                                                                                                                                                                                              |

> ⚠️ **의사요소는 Tailwind 유틸리티로 표현할 수 없다.** 타깃에서도 CSS 파일이 필요하다
> (`docs/conventions/14-styling.md`의 "Tailwind만" 규칙 예외). `@apply`는 Tailwind 4에서도
> 동작하지만, **CSS Module 또는 전역 CSS로 옮기고 `@apply` 대신 원시 CSS로 푸는 것이 안전**하다.

### 스케일 5단계 — `constants/mypage.js`

| 값           | 라벨            | `--font-scale` (`styles/fontSize.css`) |
| ------------ | --------------- | -------------------------------------- |
| `very-small` | `매우 작게`     | `0.8`                                  |
| `small`      | `작게`          | `0.9`                                  |
| `medium`     | `보통` (기본값) | `1.0`                                  |
| `large`      | `크게`          | `1.1`                                  |
| `very-large` | `매우 크게`     | `1.2`                                  |

**적용 지점**: `LayoutBase.vue:30`의 `:data-font-size="fontSizeStore.fontSizeValue"`
→ CSS `[data-font-size='...']`가 `--font-scale`을 바꾼다. **앱 전역에 영향.**

**저장**: `useStorage('fontSize', 'medium')` — localStorage 자동 동기화.

> ⚠️ **`fontSizeLabel`의 폴백에 버그가 있다** (`useFontSizeStorage.js:17-20`):
> `LABELS[value] || LABELS.ETC_FONT_SIZE_SCALES.MEDIUM`
> — `LABELS.ETC_FONT_SIZE_SCALES`가 `undefined`라 `.MEDIUM` 접근 시 **TypeError**.
> localStorage에 유효한 값이 있으면 왼쪽이 truthy라 실행되지 않지만, 값이 오염되면 크래시한다.
> **이관 시 폴백을 `LABELS[MEDIUM]`으로 고쳐도 정상 경로 동작은 같다** → 고쳐도 등가.
> → `deferred.md` D-47

### ⛔ `MyPageFontSizeItem.vue` — 미사용

라디오 목록 형태의 선택 UI인데 **어디에서도 import되지 않는다.** 슬라이더로 대체된 흔적.
**이관하지 않는다.** → `deferred.md` D-48

---

## P8. 회원 탈퇴

| 요소        | 값 / 클래스                                                                                                               |
| ----------- | ------------------------------------------------------------------------------------------------------------------------- |
| 루트        | `h-full w-full`                                                                                                           |
| 상단        | `flex w-full flex-col items-start gap-4 p-5`                                                                              |
| 아이콘      | `InfoCircle.svg` (alt `알림 아이콘`), `h-7 w-7`                                                                           |
| 문구        | `정말 아파트먼트를 탈퇴하시겠어요?` — `text-base-b-black pretendard-18Bold`                                               |
| 체크 영역   | **`fixed bottom-20`** `flex w-full gap-2.5 px-5 py-0`                                                                     |
| 체크박스    | `InputCheckbox` id `membershipDraw`, `h-5 w-5`                                                                            |
| 동의 문구   | `탈퇴 시 모든 포인트 및 개인정보가 즉시 삭제되고, 절대 복구되지 않습니다.` — `text-neutral-90 pretendard-15Regular`       |
| 버튼        | `탈퇴하기` — `fixed bottom-0 left-0 flex justify-center`, `size="2xl"`, `round-type="square"`, **`color="alerts-error"`** |
| 버튼 비활성 | `!isAgreed \|\| isDeleteAccountPending`                                                                                   |
| 제출 중     | `SpinnerCircle`                                                                                                           |

**동작**: 체크 → `탈퇴하기` → `deleteAccountMutation()` (API `#20` `DELETE /apartmant/resident`)

> 중복 클릭 가드: `if (isDeleteAccountPending.value) return`

---

## 호출 API

| #   | 함수                          | 경로                                         | 화면                    |
| --- | ----------------------------- | -------------------------------------------- | ----------------------- |
| 11  | `getResidentDetailInfo`       | `.../apt-resident/{uuid}`                    | P1 프로필·메뉴 게이트   |
| 19  | `patchMyProfile`              | `.../apt-resident/{uuid}/info`               | P3 닉네임 수정          |
| 10  | `patchPasswordEdit`           | `/apartmant/resident/password`               | P3 비밀번호 변경        |
| 20  | `deleteAccount`               | `DELETE /apartmant/resident`                 | P8                      |
| 17  | `getNotificationSetting`      | `.../notification-setting`                   | P4 통합 조회            |
| 64  | `putRegularPush`              | `.../notification-setting/regular-push`      | P4                      |
| 65  | `putExternalPush`             | `.../notification-setting/external-push`     | P4                      |
| 66  | `patchWallPadNotification`    | `.../notification-setting/wall-pad`          | P4                      |
| 18  | `putMarketingConsent`         | `.../notification-setting/marketing-consent` | P4                      |
| 112 | `getLobbyPhonePushAlarmState` | `.../lobby-phone/push`                       | P4                      |
| 113 | `putLobbyPhonePushAlarmState` | `.../lobby-phone/push`                       | P4 (본문 없음, 토글)    |
| 142 | `getOfficeBusinessHours`      | `.../office/{aptUuid}`                       | P5                      |
| 143 | `getOfficeContactList`        | `.../department/{aptUuid}`                   | P5                      |
| 9   | `deleteLogout`                | `.../logout`                                 | `/logout` (→ `auth.md`) |
| 114 | `putLobbyPhoneResidentLogout` | `.../lobby-phone/logout`                     | 〃 (조건부)             |
| —   | ~~`getApartmantVersion`~~     | `/apartmant/app/version`                     | ⛔ **호출부 없음**      |

---

## 상태

| 값                                                 | 종류                  | 비고                                     |
| -------------------------------------------------- | --------------------- | ---------------------------------------- |
| `residentDetailInfo`                               | 서버                  | P1 프로필·메뉴 게이트                    |
| `notificationSetting` + mutation 응답 6종          | 서버                  | P4 — mutation 응답 우선                  |
| `officeBusinessHours` · `officeContactList`        | 서버                  | P5                                       |
| `fontSizeValue`                                    | **클라이언트 (영속)** | `useStorage('fontSize')`. 앱 전역 영향   |
| `aptInfo`                                          | **클라이언트 (영속)** | P2·P3이 여기서 이름·닉네임·단지명을 읽음 |
| `nativeAppVersion` · `serverAppVersion`            | 로컬                  | P1 버전 표시                             |
| `isPasswordModalOpen` · `isModalOpen` · `isAgreed` | 로컬                  | 오버레이·동의                            |

---

## 네이티브 연동

| 시점         | 메시지                                                           |
| ------------ | ---------------------------------------------------------------- |
| P1 마운트    | `GET_APP_VERSION` (N1)                                           |
| 앱 버전 수신 | `CALLBACK_APP_VERSION` (C1) — **유일하게 `off`로 해제하는 구독** |
| 로그아웃     | `LOGOUT_APP` (N5) → `auth.md` A7                                 |

---

## 엣지케이스

| 상황                   | 기대 동작                                      |
| ---------------------- | ---------------------------------------------- |
| 주차 미구독            | `주차` 그룹 숨김                               |
| A-PASS 미구독          | `출입` 그룹 숨김                               |
| 소통·민원 둘 다 미구독 | `게시판` 그룹 숨김 (미노출 관리 항목까지 함께) |
| 소통만 구독            | `게시판` 그룹에 `민원공간 활동`만 빠짐         |
| 닉네임 미설정          | P1·P2에 `닉네임을 설정해주세요` (회색)         |
| 앱 버전                | **항상 `버전 없음`** (P-Q2)                    |
| 알림 그룹 0개          | `알림 설정을 불러올 수 없습니다.`              |
| 마케팅 동의 해제       | 광고성도 함께 해제                             |
| 광고성 동의            | 마케팅도 함께 동의                             |
| 연락처 없음            | `등록된 연락처가 없습니다.`                    |
| 운영시간 없음          | `등록된 내용이 없습니다.`                      |
| 탈퇴 미동의            | `탈퇴하기` 비활성                              |
| 로비폰 세대 로그아웃   | 추가 API 호출 (`auth.md` A7)                   |

---

## QA 체크리스트

- [ ] 구독 콘텐츠에 따라 메뉴 그룹이 숨겨지는가 (주차·출입·게시판)
- [ ] 소통만 구독한 단지에서 `민원공간 활동`만 빠지는가
- [ ] 닉네임 미설정 시 `닉네임을 설정해주세요`가 회색으로 뜨는가
- [ ] 프로필 카드 클릭 → `/mypage/profile`
- [ ] P2 우측 `수정` → P3
- [ ] P3에서 이름이 비활성(읽기 전용)인가
- [ ] 닉네임 2자 미만/11자 이상/특수문자 → 에러
- [ ] P3 `완료` 후 P1 프로필에 반영되는가
- [ ] 비밀번호 변경 모달: 3필드 모두 입력해야 버튼 활성
- [ ] 비밀번호 불일치 → `비밀번호가 일치하지 않습니다.`
- [ ] 비밀번호 변경 성공 → 모달만 닫힘
- [ ] 알림 토글 조작 시 즉시 반영되는가 (mutation 응답 우선)
- [ ] 마케팅 해제 → 광고성도 해제
- [ ] 광고성 동의 → 마케팅도 동의
- [ ] 동의 토스트에 일시가 표시되는가 (**`<br/>` 렌더 확인** — P-Q4)
- [ ] 월패드 알림이 해당 단지에만 보이는가
- [ ] 관리사무소 전화번호 탭 → 전화 앱이 열리는가
- [ ] 운영시간이 `HH:mm~HH:mm`로 표시되는가
- [ ] 글자 크기 슬라이더 5단계, 미리보기가 즉시 바뀌는가
- [ ] 글자 크기가 **앱 전역**에 적용되는가
- [ ] 글자 크기가 앱 재시작 후에도 유지되는가
- [ ] 탈퇴 체크 → 버튼 활성 → 탈퇴 진행
- [ ] **앱 버전 표시** (P-Q2 — 현재는 `버전 없음`이 정상)

---

## 이관 시 주의

| #   | 항목                                                                    |
| --- | ----------------------------------------------------------------------- |
| 1   | P2·P3이 AppBar를 화면 안에서 렌더 (우측 액션 버튼)                      |
| 2   | P2의 `userInfos`가 `computed`가 아님 — React에서는 자동으로 반응형이 됨 |
| 3   | P3의 이름 입력이 폼 밖에 있음                                           |
| 4   | 비밀번호 모달 버튼 활성 조건이 `meta.valid`가 아님                      |
| 5   | 알림 `getFlag`의 mutation 응답 우선 패턴                                |
| 6   | 마케팅↔광고성 양방향 연동 (`signup.md`와 같은 규칙, 다른 구현)          |
| 7   | 토스트에 `<br/>` HTML                                                   |
| 8   | 슬라이더 의사요소 CSS는 Tailwind로 표현 불가 → CSS 파일 필요            |
| 9   | `--font-scale`이 앱 전역에 영향 — `LayoutBase`의 `data-font-size`       |
| 10  | localStorage 키 **8종** 전부 보존 (R13)                                 |
| 11  | `MyPageFontSizeItem.vue`는 이관하지 않음                                |
| 12  | `CALLBACK_APP_VERSION`은 구독 해제까지 구현                             |

## `[확인 필요]`

| #        | 질문                                                                                                                                                |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| P-Q1     | `소방 자가 점검`이 마이페이지에서는 조건 없이 보이고 메인 스와이퍼에서는 `contentName`으로 게이팅되는 것이 의도인가?                                |
| P-Q2     | `localStorage['version']`을 네이티브 앱이 직접 쓰는가? 아니면 앱 버전 표시가 죽은 기능인가?                                                         |
| ~~P-Q3~~ | ~~스키마의 `name`이 검증에 걸리지 않는가~~ → **확정: 정상.** `InputBase`가 `id`로 필드를 등록하고 vee-validate는 DOM이 아닌 컨텍스트 기반이다 (§P3) |
| ~~P-Q4~~ | ~~토스트가 `<br/>`을 렌더하는가~~ → **확정: 렌더한다.** `v-dompurify-html` 사용 (§P4)                                                               |
