# 도메인 명세 — A-PASS (apass)

> 기준 SHA `6d5bf22` · 레거시 `views/ApassView/` 3개 파일 301 LOC
> (상수 7 + 스토어 11 + 브릿지 34 + 쿼리 61 + API 18 포함 **도메인 432 LOC**, 메인 카드 118 별도)
> 타깃 슬라이스 `features/apass/`
> API 2개 (`endpoints.md` #140~#141) · 쿼리 훅 2개 · Pinia 스토어 1개 · 라우트 **1개**

**A-PASS는 비컨 기반 자동 출입 기능이다.** 화면은 하나뿐이고 하는 일은 두 가지다 —
**토글 버튼으로 켜고 끄기**, 그리고 **디바이스 권한 4종의 상태를 보여주기**.

**이 도메인의 본질은 네이티브 브릿지 왕복이다.** 서버 상태 · 앱 상태 · 디바이스 권한
세 축이 얽혀 있고, 웹은 그 사이를 중개한다.

| 특징                                                          | 의미                                                                 |
| ------------------------------------------------------------- | -------------------------------------------------------------------- |
| **브릿지 4종 사용** (Web→App 3 · App→Web 2)                   | 라우트 1개인데 브릿지 의존도가 Visit 다음으로 높다                   |
| **토글이 서버·앱·디바이스 3단 왕복**을 거친다                 | 순서를 틀리면 상태가 뒤집힌다                                        |
| 권한 필드 2개가 **오타 상태로 앱과 합의**돼 있다              | `locAlawaysOn` · `btTransmitt` (D-49·D-50). **자산 파일명까지 오타** |
| `invalidateQueries`가 **v4 위치인자** — UI 갱신의 유일한 경로 | 🔴 v5에서 no-op이면 **토글이 화면에 반영되지 않는다**                |
| 전역 로딩 플래그가 **네이티브 뒤로가기를 막는다**             | `useNativeBackButton`이 `isApassLoading`을 읽는다                    |

> ⚠️ **화면 ID는 `AP*`, 확인 항목은 `AP-Q*`를 쓴다.**
> `auth.md`가 `A-Q*`를 점유했다.

---

## 화면 목록

### 라우트 (`router/ApassIndex.js` — 1개)

| #   | 경로     | name     | 컴포넌트    | meta                                                                                    |
| --- | -------- | -------- | ----------- | --------------------------------------------------------------------------------------- |
| AP1 | `/apass` | `A-PASS` | `ApassView` | `showAppBar: false` · `showBottomNav: false` (+ 무의미한 `appBarTitle`·`hasBackButton`) |

> ⚠️ **`showAppBar: false`인데 `appBarTitle: 'A-PASS'`와 `hasBackButton: true`가 함께 있다.**
> 레이아웃 AppBar가 렌더되지 않으므로 두 값은 **무시된다.**
> `deferred.md` **D-8**에 이미 기록됨. 뷰가 `<AppBar title="A-PASS" class="bg-transparent" />`를 직접 든다
> (헤더 그라데이션 위에 투명하게 얹어야 하므로 **올바른 선택**이다).

### 진입 경로

| 화면 | 진입 출처                                                                            |
| ---- | ------------------------------------------------------------------------------------ |
| AP1  | **메인 A-PASS 카드 클릭** (`MainCardAPass.vue`) — **`apassUseFlag`가 `true`일 때만** |

```html
<!-- MainCardAPass.vue -->
<button
  :class="`… ${residentDetailInfo?.apassUseFlag ? '' : 'cursor-not-allowed'} …`"
  @click="residentDetailInfo?.apassUseFlag ? moveToApass() : null"
></button>
```

**메인 메뉴(`MAIN_SWIPER_MENU_LIST`)에 A-PASS 항목이 없다.** 메인 카드가 유일한 입구다.
카드 자체는 `useMainCardLayout`의 `hasApass`(단지 콘텐츠)로 게이팅되고,
클릭 가능 여부는 `apassUseFlag`(입주민 가입 여부)가 결정한다. → `main.md` §7

🔴 **`apassUseFlag`가 `false`여도 `/apass`에 URL로 직접 들어갈 수 있다.** 라우트 가드가 없다.
그러면 미가입 상태로 토글을 누를 수 있게 된다. → `AP-Q1`

---

## 1. 네이티브 브릿지 4종

`native-protocol.md`의 24종 중 4종을 쓴다.

| 방향    | 키                         | 페이로드                           | 호출부                                                                                         |
| ------- | -------------------------- | ---------------------------------- | ---------------------------------------------------------------------------------------------- |
| Web→App | `SET_APASS_STATE`          | `{ isDeviceApassActive: boolean }` | `ApassActivityButton` (토글 클릭)                                                              |
| Web→App | `GET_PERMISSION_INFO`      | (없음)                             | `ApassView` `onMounted` · `MainCardApassBadge` `onMounted` · `usePatchAPassActive` `onSuccess` |
| Web→App | `GO_APP_PERMISSION`        | (없음)                             | 🔴 **호출부 0곳** (`deferred.md` D-18)                                                         |
| App→Web | `CALLBACK_APASS_STATE`     | `{ isDeviceApassActive: boolean }` | `ApassActivityButton`                                                                          |
| App→Web | `CALLBACK_PERMISSION_INFO` | **8필드** (아래)                   | `ApassView` · `MainCardApassBadge`                                                             |

> 🔴 **`nativeGoAppPermission`(`GO_APP_PERMISSION`)을 아무도 호출하지 않는다.**
> "권한 없음" 항목을 눌러 앱 설정으로 보내는 기능을 만들려다 만 것으로 보인다.
> `deferred.md` **D-18**에서 **"래퍼는 이관한다"** 로 확정됐다 (프로토콜 상수이고 비용 0).
>
> ⚠️ **권한 항목(`ApassPermissionItem`)에 클릭 핸들러가 없다.** 상태만 보여준다.
> 즉 사용자가 권한을 허용하려면 **직접 OS 설정으로 가야 한다.** → `AP-Q2`

### `CALLBACK_PERMISSION_INFO` 8필드 (전수)

```js
window.CALLBACK_PERMISSION_INFO = (data) => {
  const { btOn, btTransmitt, dataSaverOff, gpsEnabled,
          ignoringBatteryOpt, locAlawaysOn, lowerPowerEnabled, pushAuthorized } = JSON.parse(data);
  return callbackMobileEmitter(fromNativeKeys.CALLBACK_PERMISSION_INFO, { …8필드 });
};
```

| 필드                 | 의미                           | AP1에서 쓰는가       |
| -------------------- | ------------------------------ | -------------------- |
| `btOn`               | 블루투스 활성화                | ✅                   |
| `gpsEnabled`         | GPS 활성화                     | ✅                   |
| `locAlawaysOn`       | 위치 권한 항상 허용 (**오타**) | ✅                   |
| `btTransmitt`        | 비컨 송신 가능 (**오타**)      | ✅ **Android만**     |
| `dataSaverOff`       | 데이터 절약 모드 해제          | ❌                   |
| `ignoringBatteryOpt` | 배터리 최적화 제외             | ❌                   |
| `lowerPowerEnabled`  | 절전 모드                      | ❌                   |
| `pushAuthorized`     | 알림 권한                      | ❌ (마이페이지 소관) |

**8필드를 받아 4필드만 쓴다.** 나머지 4개는 `mypage.md`·`main.md` 쪽 소비자가 있을 수 있으므로
**브릿지 스키마는 8필드 전부 유지한다** (`native-protocol.md` 규격).

### 🔴 `CALLBACK_PERMISSION_INFO` 리스너가 두 곳에서 누수된다

```js
// ApassView.vue — setup 스코프, onUnmounted 없음
emitter.on(fromNativeKeys.CALLBACK_PERMISSION_INFO, (data) => {
  if (getCurrentRoutePath() === '/apass') permissionInfo.value = data
})
```

```js
// MainCardApassBadge.vue — 동일 패턴, onUnmounted 없음
emitter.on(fromNativeKeys.CALLBACK_PERMISSION_INFO, (data) => {
  if (getCurrentRoutePath() === '/main') permissionInfo.value = data
})
```

- **익명 핸들러 + `off` 없음** → 마운트마다 리스너가 누적된다
- **경로 문자열로 자기 것만 처리**한다 — 즉 **경로 가드가 누수를 전제로 한 설계**다
- 메인 ↔ A-PASS를 왕복하면 리스너가 계속 쌓이고, 매 콜백마다 전부 실행된 뒤 경로로 걸러진다

`visit.md`의 `VisitLobbyPhoneSipState` 리스너 누수와 **완전히 같은 패턴**이다.

**타깃에서는 `useEffect` cleanup으로 해제한다.** 그러면 경로 가드가 불필요해지지만,
**가드를 남겨도 동작은 같다.** → 「반드시 지켜야 할 것」

⚠️ **`ApassActivityButton`만 `off`를 호출한다.**

```js
onUnmounted(() => {
  if (loadingTimer.value) clearTimeout(loadingTimer.value)
  emitter.off(fromNativeKeys.CALLBACK_APASS_STATE) // 핸들러 인자 없음 = 전체 제거
})
```

`emitter.off(key)`는 그 키의 **모든** 리스너를 제거한다. 이 키의 리스너가 하나뿐이라 결과는 맞다.

---

## 2. 상수 — `constants/domain/apass.js` (7줄 전문)

```js
// A-PASS 권한 타입
export const APASS_PERMISSION_TYPES = {
  BLUETOOTH: 'bluetooth',
  GPS: 'gps',
  LOCATION_ALWAYS_ON: 'locAlawaysOn', // 네이티브와 함께 오타 정정 필요
  BT_TRANSMIT: 'btTransmitt', // 네이티브와 함께 오타 정정 필요
}
```

**주석이 레거시에 이미 있다** — `네이티브와 함께 오타 정정 필요`.
`deferred.md` **D-49**(`locAlawaysOn`) · **D-50**(`btTransmitt`)로 등록되어
**"그대로 유지 — 앱과 협의 후 함께 수정"** 으로 확정돼 있다.

🔴 **오타가 자산 파일명에도 퍼져 있다.**

```js
[APASS_PERMISSION_TYPES.LOCATION_ALWAYS_ON]: {
  on: '/assets/icons/aPass/locAlawaysOn.svg',
  off: '/assets/icons/aPass/locAlawaysOff.svg',
},
[APASS_PERMISSION_TYPES.BT_TRANSMIT]: {
  on: '/assets/icons/aPass/btTransmittOn.svg',
  off: '/assets/icons/aPass/btTransmittOff.svg',
},
```

**`public/assets/icons/aPass/`를 확인했다** — `locAlawaysOn.svg` · `locAlawaysOff.svg` ·
`btTransmittOn.svg` · `btTransmittOff.svg` 4개 모두 오타 표기 그대로 존재한다.

**파일을 그대로 복사하므로 이관에 영향은 없다.** 필드명을 정정할 때는 **자산 4개도 함께 리네이밍**해야 한다.

---

## 3. API 2개 — 토글이 본문 없는 PATCH다

접두사 `/apartmant/resident/a-pass/{residentUuid}`. 둘 다 `auth`.

|   # | 함수               | METHOD | 경로                 | 특징                          |
| --: | ------------------ | ------ | -------------------- | ----------------------------- |
| 140 | `getIsAPassActive` | GET    | `/apass-on-off-flag` | **path 인자 1개 (객체 아님)** |
| 141 | `patchAPassActive` | PATCH  | `/apass-on-off-flag` | **본문 없음 (서버가 토글)**   |

```js
export const getIsAPassActive = async (residentUuid) => { … };     // ⚠️ 구조분해가 아니다
export const patchAPassActive = async (residentUuid) => { … };     // ⚠️ 본문 없음
```

🔴 **레거시 148개 API 중 이 2개만 인자를 객체로 받지 않는다.** 나머지는 전부 `({ … })` 형태다.
타깃에서는 통일해도 등가다 (호출부가 2곳뿐).

🔴 **PATCH가 값을 보내지 않는다.** 서버가 현재 값을 뒤집는다.
**즉 "켜기/끄기"를 지정할 수 없고 "뒤집기"만 가능하다.** 이 사실이 §4의 가드 로직을 만든다.

### 응답 형태

`getIsAPassActive` → `{ apassOnOffFlag: boolean }` (`select: (data) => data.data.success`)

⚠️ **화면은 `isAPassActive?.apassOnOffFlag`로 두 단계를 파고든다.** 변수명이 이미 `isAPassActive`인데
그 안에 또 `apassOnOffFlag`가 있다.

---

## 4. 쿼리 훅 2개 — 토글 UI가 캐시 무효화에 매달려 있다

| 훅                    | API  | 쿼리 키                              | 비고                               |
| --------------------- | ---- | ------------------------------------ | ---------------------------------- |
| `useGetIsAPassActive` | #140 | `['isAPassActive', aptResidentUuid]` | `enabled: !!authStore.accessToken` |
| `usePatchAPassActive` | #141 | (mutation)                           | `mutate`                           |

### 4-1. 🔴 `enabled`가 반응형이 아니다

```js
enabled: !!authStore.accessToken,
```

**`ref`/`computed`가 아니라 평가된 boolean이다.** 훅 생성 시점의 값으로 고정된다.
토큰이 나중에 들어오면 **쿼리가 영원히 비활성으로 남는다.**

정상 경로에서는 로그인 후에만 이 화면에 도달하므로 문제되지 않는다.
**타깃에서는 자연스럽게 반응형이 된다** (렌더마다 재평가) — **동작이 개선되지만 화면은 같다.**

⚠️ 다른 도메인은 `computed(() => …)`로 감싸거나 `validateQueryEnabledParams`를 쓴다. 이 훅만 다르다.

### 4-2. 🔴 `invalidateQueries`가 v4 위치인자다 — 토글 UI의 유일한 갱신 경로

```js
onSuccess: () => {
  queryClient.invalidateQueries(['isAPassActive', authStore.getAptInfo()?.aptResidentUuid]);
  nativeGetPermissionInfo();
},
```

**v5에서 조용히 no-op이다** (`query-keys.md` 28곳 중 1곳).

이것이 치명적인 이유는 **UI 갱신 경로가 이것뿐**이기 때문이다.

```
토글 클릭
  → nativeSetApassState(!isButtonActive)          [Web→App]
  → CALLBACK_APASS_STATE                          [App→Web]
  → debouncedUpdateAPassActive(isDeviceApassActive)
  → patchAPassActiveMutation()                    [서버 토글]
  → onSuccess → invalidateQueries(['isAPassActive', …])   🔴 v5 no-op
  → useGetIsAPassActive 재조회
  → ApassActivityButton의 watch(isAPassActive) 발동
  → isButtonActive / currentX 갱신 + 헤더 그라데이션·아이콘·문구 변경
```

**무효화가 no-op이면 화면이 이전 상태에 머문다.**
`staleTime: 0`이지만 재마운트가 없으므로 재조회 트리거가 사라진다.

**반드시 `{ queryKey: [...] }`로 고친다.** → 「반드시 지켜야 할 것」

⚠️ `nativeGetPermissionInfo()`를 함께 호출해 **권한 상태도 갱신**한다. 이 순서를 유지한다.

### 4-3. 🔴 mutation 인자가 무시된다

```js
// 호출부
patchAPassActiveMutation(isActive);

// 훅
mutationFn: () => patchAPassActive(authStore.getAptInfo()?.aptResidentUuid),   // isActive를 안 쓴다
```

API가 본문 없는 토글이므로 **인자를 쓸 곳이 없다.** 죽은 인자다.

**그런데 호출 전 가드에서는 그 값을 쓴다.**

```js
const debouncedUpdateAPassActive = useDebounceFn((isActive) => {
  if (isAPassActive?.value?.apassOnOffFlag !== isActive) {
    patchAPassActiveMutation(isActive)
  }
}, 1000)
```

**"앱이 알려준 디바이스 상태(`isActive`)가 서버 상태와 다르면 서버를 뒤집는다"** 는 뜻이다.
토글 API가 값을 못 받으므로 **이 비교가 유일한 방향 제어 수단**이다.

🔴 **`isAPassActive?.value?.apassOnOffFlag`** — `isAPassActive`는 이미 `ref`이므로
`isAPassActive.value`가 맞다. `?.`가 앞에 붙어 있는 것은 무의미하지만 동작한다.

---

## AP1 — A-PASS (`ApassView` 111줄)

### 레이아웃

```
┌────────────────────────────┐
│ ← A-PASS        (투명 AppBar)│  ┐
│                            │  │ h-[276px]
│      A-PASS 활성화     ┌──┐│  │ 그라데이션 or 회색
│                        │🔵││  │
└────────────────────────┴──┴┘  ┘
        ┌──────┐                  ← 헤더에 26px 겹침
        │ 토글  │                    124×124 PNG
        └──────┘
                                  ← my-20 (80px)
┌────────────────────────────┐
│ 🔵 블루투스 접근 권한 허용됨  ✓ │
├────────────────────────────┤
│ 📍 GPS 접근 권한 허용됨      ✓ │
├────────────────────────────┤
│ 📍 위치 항상허용  활성화     ✓ │
├────────────────────────────┤
│ 📡 단말기 A-PASS 송수신 지원 ✓ │  ← Android만
└────────────────────────────┘
```

### 헤더 — 활성 상태로 배경이 갈린다

```html
<div
  :class="`flex h-[276px] w-full flex-col ${isAPassActive?.apassOnOffFlag
  ? 'bg-[linear-gradient(293deg,#2f85df_4.47%,#429eff_119.83%)]'
  : 'bg-defaults-secondary-background-secondary'}`"
>
  <AppBar title="A-PASS" class="bg-transparent" />
  <div
    class="relative flex h-full w-full content-center items-center justify-center overflow-hidden"
  >
    <span :class="`pretendard-24SemiBold ${isAPassActive?.apassOnOffFlag ? 'text-white' : ''}`">
      A-PASS {{ isAPassActive?.apassOnOffFlag ? '활성화' : '비활성화' }}
    </span>
    <img
      v-if="isAPassActive?.apassOnOffFlag"
      class="absolute -right-2 bottom-0 h-[145.306px] w-[148.313px]"
      src="/assets/icons/ApassEnable.svg"
      alt="수신 활성화 이미지"
    />
    <img
      v-else
      class="absolute -right-2 bottom-0 h-[101.122px] w-[148.312px]"
      src="/assets/icons/ApassDisable.svg"
      alt="수신 비활성화 이미지"
    />
  </div>
</div>
```

| 상태   | 배경                                                      | 문구 색      | 이미지             | 크기              |
| ------ | --------------------------------------------------------- | ------------ | ------------------ | ----------------- |
| 활성   | `linear-gradient(293deg, #2f85df 4.47%, #429eff 119.83%)` | `text-white` | `ApassEnable.svg`  | 148.313 × 145.306 |
| 비활성 | `bg-defaults-secondary-background-secondary`              | (기본)       | `ApassDisable.svg` | 148.312 × 101.122 |

> ⚠️ **소수점 픽셀 크기다** (`h-[145.306px]` 등). 디자인 도구에서 그대로 복사한 값이다. 유지한다.
> ⚠️ **이미지 폭이 1/1000px 차이난다** (`148.313` vs `148.312`). 무해.
> ⚠️ **`text-white`는 Tailwind 기본 색이다** — `text-base-b-white` 토큰이 아니다.
> ⚠️ **그라데이션이 하드코딩 hex 2개**다 (`#2f85df`·`#429eff`). 임의값 문법.
> ⚠️ **`AppBar class="bg-transparent"`** 로 AppBar 자체 `bg-base-b-white`를 덮는다.
> Vue가 부모의 class를 뒤에 병합하므로 `bg-transparent`가 이긴다.
> ⚠️ `content-center`는 `flex` 단일 행에서 효과가 없다 (죽은 클래스).

### 토글 버튼 (`ApassActivityButton` 109줄)

```html
<!-- ApassView -->
<div class="relative h-[26px]"><ActivityButton /></div>
```

```html
<!-- ApassActivityButton -->
<div class="relative bottom-[26px] left-1/2 flex translate-x-[-50%] items-center p-1.5">
  <div class="absolute bottom-[18px] left-1/2 translate-x-[-50%]"></div>
  <!-- 🔴 빈 div -->
  <button class="mt-6" type="button" @click="handleTouch">
    <img
      class="absolute top-1/2 left-1/2 h-[124px] w-[124px] translate-x-[-50%] translate-y-[-50%]"
      :src="isAPassActive?.apassOnOffFlag ? '/assets/icons/aPass/ApassOn.png' : '/assets/icons/aPass/ApassOff.png'"
      alt="화살표 아이콘"
    />
  </button>
</div>
<SpinnerDots v-if="isLoading" />
```

- **컨테이너 `h-[26px]` + 버튼 `bottom-[26px]`** → 헤더 하단에 절반쯤 걸쳐 뜬다
- 이미지는 **PNG 124×124** (`ApassOn.png` / `ApassOff.png`) — 이 도메인만 PNG를 쓴다
  ⚠️ **같은 폴더에 `ApassOn.svg`·`ApassOff.svg`도 있는데 코드는 PNG를 쓴다.**
  SVG로 교체하려다 만 흔적. **PNG를 그대로 쓴다** (모양이 다를 수 있다)
- 🔴 **`alt="화살표 아이콘"`** — 화살표가 아니라 A-PASS 토글이다. 복붙 잔재
- 🔴 **빈 `<div class="absolute bottom-[18px] left-1/2 translate-x-[-50%]"></div>`** — 자식도 내용도 없다
- 🔴 **`currentX` ref가 170/0으로 설정되지만 템플릿에서 쓰이지 않는다.**
  슬라이드 토글을 만들려다 탭 방식으로 바꾼 흔적으로 보인다

```js
watch(
  isAPassActive,
  (newValue) => {
    isButtonActive.value = newValue?.apassOnOffFlag
    if (newValue?.apassOnOffFlag) currentX.value = 170
    else currentX.value = 0 // 🔴 미사용
  },
  { immediate: true },
)
```

⚠️ **`isButtonActive`도 `handleTouch`에서만 읽힌다** (`nativeSetApassState(!isButtonActive.value)`).
템플릿은 `isAPassActive?.apassOnOffFlag`를 직접 본다. **두 출처가 병존한다.**

### 토글 시퀀스 (전수)

```js
const handleTouch = useDebounceFn(() => {
  handleLoadingChange(true) // 로컬 로딩 on + 7초 타이머
  setIsApassLoading(true) // 전역 로딩 on (뒤로가기 차단)
  nativeSetApassState(!isButtonActive.value) // [Web→App]
}, 300)

emitter.on(fromNativeKeys.CALLBACK_APASS_STATE, (data) => {
  handleLoadingChange(false)
  setIsApassLoading(false)
  if (getCurrentRoutePath() === '/apass') {
    if (data) debouncedUpdateAPassActive(data.isDeviceApassActive) // 1초 디바운스
  }
})
```

| 단계 | 동작                                             | 디바운스/타임아웃  |
| ---- | ------------------------------------------------ | ------------------ |
| 1    | 버튼 탭                                          | **300ms 디바운스** |
| 2    | 로딩 on (로컬 + 전역)                            | **7초 자동 해제**  |
| 3    | `SET_APASS_STATE` 전송                           | —                  |
| 4    | 앱이 BLE를 켜고/끄고 `CALLBACK_APASS_STATE` 응답 | —                  |
| 5    | 로딩 off                                         | —                  |
| 6    | 경로가 `/apass`이면 서버 반영 예약               | **1초 디바운스**   |
| 7    | 서버 값과 다르면 `PATCH`                         | —                  |
| 8    | `invalidateQueries` + `GET_PERMISSION_INFO`      | 🔴 v5 no-op        |
| 9    | 재조회 → `watch` → 헤더·아이콘·문구 갱신         | —                  |

**7초 폴백 타이머**

```js
const handleLoadingChange = (value) => {
  isLoading.value = value
  if (value) {
    if (loadingTimer.value) clearTimeout(loadingTimer.value)
    loadingTimer.value = setTimeout(() => {
      isLoading.value = false
    }, 7000)
  }
}
```

⚠️ **앱이 응답하지 않으면 7초 후 로딩만 풀린다.**
🔴 **그때 `setIsApassLoading(false)`는 호출되지 않는다** — 전역 플래그가 `true`로 남고
**네이티브 뒤로가기가 영구히 막힌다.** → `AP-Q3`

```js
// useNativeBackButton.js
const apassLoadingStore = useApassLoadingStore();
…
if (apassLoadingStore.isApassLoading === false) { … }   // 로딩 중이면 뒤로가기 무시
```

**로딩 중 뒤로가기를 막는 것은 의도된 동작이다** (BLE 전환 중 이탈 방지).
그러나 타임아웃 경로에서 전역 플래그를 못 내리는 것은 결함이다.

⚠️ **`SpinnerDots`가 `fixed inset-0 z-[9999]`** 전체 화면을 덮는다. 진행률은 넘기지 않는다.

### 권한 항목 목록

```js
const permissionMenus = computed(() => {
  const menus = [
    {
      title: `블루투스 접근 권한 ${permissionInfo.value?.btOn ? '허용됨' : '허용안됨'}`,
      info: permissionInfo.value?.btOn,
      type: BLUETOOTH,
    },
    {
      title: `GPS 접근 권한 ${permissionInfo.value?.gpsEnabled ? '허용됨' : '허용안됨'}`,
      info: permissionInfo.value?.gpsEnabled,
      type: GPS,
    },
    {
      title: `위치 항상허용  ${permissionInfo.value?.locAlawaysOn ? '활성화' : '비활성화'}`,
      info: permissionInfo.value?.locAlawaysOn,
      type: LOCATION_ALWAYS_ON,
    },
  ]
  if (isAndroid) {
    menus.push({
      title: `단말기 A-PASS 송수신 ${permissionInfo.value?.btTransmitt ? '지원' : '미지원'}`,
      info: permissionInfo.value?.btTransmitt,
      type: BT_TRANSMIT,
    })
  }
  return menus
})
```

**문구 전수 (원문 그대로)**

| 항목          | 참                          | 거짓                          |
| ------------- | --------------------------- | ----------------------------- |
| 블루투스      | `블루투스 접근 권한 허용됨` | `블루투스 접근 권한 허용안됨` |
| GPS           | `GPS 접근 권한 허용됨`      | `GPS 접근 권한 허용안됨`      |
| 위치 항상허용 | `위치 항상허용  활성화` 🔴  | `위치 항상허용  비활성화` 🔴  |
| 송수신        | `단말기 A-PASS 송수신 지원` | `단말기 A-PASS 송수신 미지원` |

🔴 **`위치 항상허용` 뒤에 공백이 2칸이다** (템플릿 리터럴 안). HTML 공백 축약으로 **화면에서는 1칸**이다.
⚠️ **`허용안됨`·`미지원`에 띄어쓰기가 없다.** `허용 안 됨`이 맞지만 그대로 옮긴다.
⚠️ **`isAndroid`는 `checkDeviceOs()`로 판정한다** (`native-protocol.md`).
iOS에는 송수신 항목이 없다 — 4번째 항목이 사라진다.

### 권한 항목 카드 (`ApassPermissionItem` 81줄)

```html
<div
  class="border-defaults-tertiary-border-tertiary bg-defaults-secondary-background-secondary flex h-[52px] w-full flex-col gap-3 self-stretch rounded-lg border p-4"
>
  <div class="flex items-center justify-between">
    <div class="flex items-center gap-3">
      <img v-if="currentIcon" class="h-5 w-5" :src="currentIcon.src" :alt="currentIcon.alt" />
      <p class="pretendard-15Medium">{{ menu.title }}</p>
    </div>
    <img class="h-5 w-5" :src="checkIcon.src" :alt="checkIcon.alt" />
  </div>
</div>
```

**아이콘 매핑 전수 (`ICON_MAP`)**

| type           | on                        | off                        | alt 접두        |
| -------------- | ------------------------- | -------------------------- | --------------- |
| `bluetooth`    | `aPass/bluetoothOn.svg`   | `aPass/bluetoothOff.svg`   | `블루투스`      |
| `gps`          | `aPass/markOn.svg`        | `aPass/markOff.svg`        | `GPS`           |
| `locAlawaysOn` | `aPass/locAlawaysOn.svg`  | `aPass/locAlawaysOff.svg`  | `위치 항상허용` |
| `btTransmitt`  | `aPass/btTransmittOn.svg` | `aPass/btTransmittOff.svg` | `단말기 지원`   |

`alt`는 `` `${alt} ${info ? '활성' : '비활성'} 아이콘` ``.

**체크 아이콘**

| `info` | 파일                                |
| ------ | ----------------------------------- |
| 참     | `/assets/icons/FillCheckCircle.svg` |
| 거짓   | `/assets/icons/CheckCircle.svg`     |

`alt`는 둘 다 **`선택 아이콘`** (상태를 구분하지 않는다) — a11y 결함이지만 그대로 옮긴다.

⚠️ **`h-[52px]` 고정 높이 + `p-4`(16px)** → 내용 높이 20px. 아이콘·체크가 `h-5`(20px)라 딱 맞는다.
**폰트 배율을 키우면 넘친다.** → 「등가 대조」
⚠️ **`flex flex-col gap-3`인데 자식이 하나뿐이다.** `gap-3`이 무효.
⚠️ `currentIcon`이 `null`이면 아이콘이 없고 제목만 보인다 (`ICON_MAP`에 없는 type — 현재 없음).

### 상태별 화면 (전수)

| 조건                                   | 헤더                      | 토글 이미지    | 권한 목록                              |
| -------------------------------------- | ------------------------- | -------------- | -------------------------------------- |
| 서버 `apassOnOffFlag: true`            | 파란 그라데이션 + 흰 글씨 | `ApassOn.png`  | 권한별 on/off 아이콘 + 체크            |
| 서버 `apassOnOffFlag: false`           | 회색                      | `ApassOff.png` | 〃                                     |
| 브릿지 응답 전 (`permissionInfo = {}`) | (서버 값 따름)            | (서버 값 따름) | **전부 `허용안됨`/`비활성화`** 로 표시 |
| 앱 없이 브라우저로 열면                | 〃                        | 〃             | **영구히 `허용안됨`**                  |

🔴 **로딩/미수신 상태와 "권한 없음" 상태를 구분하지 않는다.**
`permissionInfo`가 `ref({})`로 시작하므로 브릿지 응답이 오기 전에는 **전부 거부 상태로 보인다.**
웹뷰가 아닌 환경(개발용 브라우저)에서는 영구히 그렇다. → `AP-Q4`

### QA 체크리스트 (AP1)

- [ ] 메인 카드 `A-PASS`를 눌러 진입 (미가입이면 클릭 불가)
- [ ] 활성 상태 → 파란 그라데이션 헤더 + 흰 `A-PASS 활성화` + `ApassEnable.svg`
- [ ] 비활성 상태 → 회색 헤더 + `A-PASS 비활성화` + `ApassDisable.svg`
- [ ] 토글 이미지가 헤더 하단에 걸쳐 있다 (124×124 PNG)
- [ ] 토글 탭 → **전체 화면 스피너** → 앱 응답 후 스피너 해제
- [ ] 스피너 중 **네이티브 뒤로가기가 막힌다**
- [ ] 앱 응답 후 헤더 색·문구·토글 이미지가 **모두 바뀐다** (🔴 `invalidateQueries` 수정 필요)
- [ ] 토글을 빠르게 여러 번 눌러도 요청이 1회만 나간다 (300ms + 1000ms 디바운스)
- [ ] 앱이 응답하지 않으면 **7초 후 스피너가 사라진다**
- [ ] 🔴 그 경우 **뒤로가기가 계속 막혀 있는지** 확인 (`AP-Q3`)
- [ ] 블루투스를 끄면 권한 항목이 `허용안됨` + 회색 아이콘 + 빈 체크
- [ ] Android → 권한 항목 **4개**, iOS → **3개** (송수신 항목 없음)
- [ ] 권한 항목을 탭해도 **아무 일도 일어나지 않는다** (`AP-Q2`)
- [ ] 메인 ↔ A-PASS를 반복 왕복해도 권한 표시가 정상 (🔴 리스너 누수)

---

## 5. 메인 카드 배지 (`MainCardApassBadge` 75줄 — `main.md` 소관)

**이 도메인의 상태를 메인에서 4단계로 요약한다.** AP1과 판정 기준이 다르므로 기록해 둔다.

| 우선순위 | 조건                                | 표시                                       |
| -------- | ----------------------------------- | ------------------------------------------ |
| 1        | `!apassUseFlag`                     | `ChipBase color="gray"` → **`미가입`**     |
| 2        | `!apassStatus`(`apassOnOffFlag`)    | `ChipBase color="gray"` → **`미사용`**     |
| 3        | `apassStatus && btOn && gpsEnabled` | **자체 마크업** 초록 점 + `사용중`         |
| 4        | 그 외                               | `ChipBase color="orange"` → **`권한없음`** |

```html
<div
  class="text-base-b-black pretendard-12SemiBold flex h-5 w-fit items-center gap-[2px] rounded-[31px] bg-[rgba(0,187,64,0.1)] px-1.5 py-[3px]"
>
  <svg width="5" height="6" viewBox="0 0 5 6">
    <circle cx="2.54663" cy="3" r="2.04663" fill="#00BB40" />
  </svg>
  <span>사용중</span>
</div>
```

⚠️ **`사용중`만 `ChipBase`를 쓰지 않고 자체 마크업이다.** 초록 점(인라인 SVG)이 필요해서다.
`rounded-[31px]` · `bg-[rgba(0,187,64,0.1)]` · `#00BB40` 전부 하드코딩.
`ChipBase`의 `deepGreen`이 `bg-[#00BB40]`을 쓰므로 **색 계열은 같다.**

🔴 **`사용중` 판정이 `btOn && gpsEnabled` 2개만 본다.**
AP1은 `locAlawaysOn`·`btTransmitt`까지 4개를 보여주는데 **배지는 2개만 반영**한다.
즉 **위치 항상허용이 꺼져 있어도 메인에는 `사용중`으로 보인다.** → `AP-Q5`

⚠️ 이 컴포넌트도 `emitter.on(CALLBACK_PERMISSION_INFO)`를 `off` 없이 등록한다 (§1).
⚠️ **`onMounted`가 `async`인데 `await`가 없다.** 무해.

---

## 타깃 슬라이스 구조 (제안)

```
src/features/apass/
├── api/
│   └── apass.ts                     # #140 · #141
├── queries/
│   ├── apassQueries.ts               # isAPassActive queryOptions
│   └── useToggleApass.ts             # #141 + invalidate + GET_PERMISSION_INFO
├── stores/
│   └── apassLoadingStore.ts          # Zustand — 뒤로가기 차단용 전역 플래그
├── components/
│   ├── ApassHeader.tsx               # 그라데이션 + 문구 + 이미지
│   ├── ApassToggleButton.tsx         # 브릿지 왕복 + 로딩
│   ├── ApassPermissionList.tsx       # OS 분기
│   └── ApassPermissionItem.tsx
├── hooks/
│   └── usePermissionInfo.ts          # CALLBACK_PERMISSION_INFO 구독 (cleanup 포함)
├── pages/
│   └── ApassPage.tsx                 # AP1
├── constants/
│   └── apass.ts                      # APASS_PERMISSION_TYPES + ICON_MAP
└── index.ts
```

### `shared`로 올릴 것

| 항목                | 이유                                                             |
| ------------------- | ---------------------------------------------------------------- |
| `usePermissionInfo` | **`MainCardApassBadge`(main)와 공용.** 브릿지 구독 + cleanup     |
| `apassLoadingStore` | `useNativeBackButton`(shared)이 읽는다 → `shared/stores/`        |
| `native/apass.ts`   | `SET_APASS_STATE` · `CALLBACK_APASS_STATE` · `GO_APP_PERMISSION` |
| `checkDeviceOs`     | 이미 브릿지 공용                                                 |
| `Chip`              | `ChipBase`                                                       |
| `FullScreenSpinner` | `SpinnerDots`                                                    |

### `usePermissionInfo` 설계

```
현재: 두 컴포넌트가 각자 emitter.on + 경로 가드 + off 없음
타깃: shared 훅 하나 — useEffect로 on/off, 반환값은 permissionInfo
      경로 가드는 불필요해지지만 남겨도 동작 동일
```

---

## 이관 순서 — 1개 PR

| PR       | 범위 | 선행                                                                    |
| -------- | ---- | ----------------------------------------------------------------------- |
| **AP-1** | AP1  | **Phase 4 네이티브 브릿지 재작성**(필수) · `Chip` · `FullScreenSpinner` |

> 🔴 **브릿지 없이는 이 화면이 아무것도 못 한다.** 토글·권한 표시가 전부 브릿지 왕복이다.
> `visit.md`와 함께 **Phase 4 브릿지 완료 후에만** 착수한다.
>
> **`main.md`의 A-PASS 카드/배지와 같은 PR로 묶는 것을 권한다** — `usePermissionInfo`를
> 두 곳이 공유하고, 배지 판정(`AP-Q5`) 결정이 양쪽에 걸린다.

---

## 반드시 지켜야 할 것

1. 🔴 **`invalidateQueries`를 `{ queryKey: ['isAPassActive', aptResidentUuid] }`로 고친다.**
   **UI 갱신 경로가 이것뿐이다.** v4 위치인자를 그대로 옮기면 토글이 화면에 반영되지 않는다.
2. **`onSuccess`에서 무효화 직후 `GET_PERMISSION_INFO`를 보낸다.** 순서를 유지한다.
3. **PATCH는 본문이 없다.** 서버가 토글한다. "켜기/끄기"를 지정할 수 없다.
4. **`앱이 알려준 디바이스 상태 !== 서버 상태`일 때만 PATCH를 보낸다.**
   이 비교가 유일한 방향 제어 수단이다.
5. **디바운스 2단** — 탭 300ms, 서버 반영 1000ms.
6. **로딩 7초 폴백 타이머**가 있다.
7. **로딩 중 네이티브 뒤로가기를 막는다** (전역 `isApassLoading`).
8. **권한 필드 오타 `locAlawaysOn`·`btTransmitt`를 그대로 쓴다** (D-49·D-50, 앱 계약).
   **자산 파일명(`locAlawaysOn.svg`·`btTransmittOn.svg`)도 그대로 복사한다.**
9. **`CALLBACK_PERMISSION_INFO`는 8필드를 받는다.** 4개만 쓰더라도 스키마는 8필드 유지.
10. **송수신 항목은 Android에만 보인다** (`checkDeviceOs`).
11. **권한 항목에 클릭 동작이 없다.** 링크를 추가하지 않는다 (`AP-Q2` 전까지).
12. **브릿지 응답 전에는 모든 권한이 `허용안됨`/`비활성화`로 보인다.** 로딩 상태를 만들지 않는다.
13. **헤더 이미지 크기는 소수점 픽셀이다** (`145.306px` 등).
14. **토글은 PNG 124×124다** (SVG가 아니다).
15. **메인 배지 `사용중` 판정은 `btOn && gpsEnabled` 2개만 본다** (`AP-Q5` 전까지).
16. **문구 원문 유지** — `허용안됨` · `미지원` · `위치 항상허용`(공백 2칸) · `미가입` · `미사용` · `권한없음` · `사용중`.

---

## 정리해도 되는 것 (등가 영향 없음)

| 항목                                                                | 근거                                          |
| ------------------------------------------------------------------- | --------------------------------------------- |
| `currentX` ref (170/0)                                              | 템플릿에서 쓰이지 않는다 — 슬라이드 토글 잔재 |
| `ApassActivityButton`의 빈 `<div class="absolute bottom-[18px] …">` | 자식·내용 없음                                |
| `patchAPassActiveMutation(isActive)`의 인자                         | `mutationFn`이 무시한다                       |
| `content-center` (헤더 내부)                                        | 단일 행 flex에서 효과 없음                    |
| `ApassPermissionItem`의 `gap-3`                                     | 자식이 하나뿐                                 |
| `alt="화살표 아이콘"` (토글 이미지)                                 | 화살표가 아니다                               |
| 체크 아이콘 `alt="선택 아이콘"` (on/off 동일)                       | 상태를 구분하지 않는다                        |
| `enabled: !!authStore.accessToken` (비반응형)                       | 타깃에서는 자동으로 반응형이 된다             |
| `isAPassActive?.value?.apassOnOffFlag`의 첫 `?.`                    | `isAPassActive`는 항상 존재하는 ref           |
| API 인자가 객체가 아닌 것 (#140·#141)                               | 호출부 2곳뿐 — 통일 가능                      |
| AP1 meta의 `appBarTitle`·`hasBackButton`                            | `showAppBar: false`라 무시된다 (D-8)          |
| `MainCardApassBadge`의 `async onMounted` (await 없음)               | 무해                                          |
| 두 곳의 `emitter.on` 경로 가드                                      | cleanup을 넣으면 불필요 (남겨도 동작 동일)    |

---

## 스타일

| 항목                                                         | 상태                                                       |
| ------------------------------------------------------------ | ---------------------------------------------------------- |
| `bg-[linear-gradient(293deg,#2f85df_4.47%,#429eff_119.83%)]` | 임의값 + 하드코딩 hex 2개 → `deferred.md`                  |
| `text-white`                                                 | Tailwind 기본색 (토큰 `text-base-b-white`가 아니다)        |
| `h-[145.306px]` · `w-[148.313px]` 등                         | 소수점 픽셀 4개. 디자인 도구 값                            |
| `bg-[rgba(0,187,64,0.1)]` · `#00BB40` (메인 배지)            | 하드코딩. `ChipBase` `deepGreen`과 같은 계열               |
| `rounded-[31px]` (메인 배지)                                 | `rounded-full`과 사실상 같다                               |
| 그 외 클래스                                                 | ✅ `broken-styles.md` 26개 중 이 도메인 해당 항목 **없음** |

---

## 확인 필요 (`AP-Q*`)

| #     | 질문                                                                                                                                           | 관련 |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ---- |
| AP-Q1 | `apassUseFlag: false`(미가입)여도 **`/apass`에 URL로 직접 진입**할 수 있다. 라우트 가드를 넣는가                                               | 진입 |
| AP-Q2 | 권한 항목에 **클릭 동작이 없다.** `GO_APP_PERMISSION`(호출부 0) 브릿지를 배선해 앱 설정으로 보내는가                                           | §1   |
| AP-Q3 | 🔴 **7초 타임아웃 경로에서 `setIsApassLoading(false)`를 호출하지 않는다** → 전역 플래그가 `true`로 남아 **뒤로가기가 영구히 막힌다.** 고치는가 | AP1  |
| AP-Q4 | 브릿지 응답 전/웹 브라우저에서 **모든 권한이 `허용안됨`으로 보인다.** 로딩 상태를 구분하는가                                                   | AP1  |
| AP-Q5 | 메인 배지 `사용중` 판정이 `btOn && gpsEnabled` 2개만 본다 (AP1은 4개 표시). **위치 항상허용이 꺼져도 `사용중`** 이다. 맞추는가                 | §5   |
| AP-Q6 | 권한 필드/자산 파일명 오타(`locAlawaysOn`·`btTransmitt`)를 **앱과 함께 정정할 계획이 있는가** (D-49·D-50 협의 상태)                            | §2   |

---

## 등가 대조 (레거시 :3000 ↔ 신규 :5173, 392px)

| 대조 지점                                                                             |
| ------------------------------------------------------------------------------------- |
| 헤더 그라데이션 각도(293deg)와 색 정지점(4.47% / 119.83%)                             |
| 헤더 높이 276px · AppBar 투명도                                                       |
| `A-PASS 활성화` 문구 `pretendard-24SemiBold` 크기와 흰색                              |
| 헤더 우하단 이미지 위치 (`-right-2 bottom-0`)와 소수점 크기                           |
| 활성/비활성 이미지 **높이 차이** (145.306 vs 101.122)                                 |
| 토글 PNG 124×124가 헤더에 겹치는 정도 (`bottom-[26px]`)                               |
| 권한 목록 `my-20`(80px) 상하 여백                                                     |
| 권한 카드 `h-[52px]` 고정 높이 + `p-4`                                                |
| 권한 아이콘 20×20 on/off 4종 · 체크 아이콘 2종                                        |
| **폰트 배율 5단계에서 `h-[52px]` 카드가 넘치지 않는지** (고정 높이라 위험)            |
| 전체 화면 스피너 (`z-[9999]`) 배경 투명도                                             |
| iOS에서 권한 항목이 3개인지                                                           |
| 메인 배지 4종: `미가입`(회색) · `미사용`(회색) · `사용중`(초록 점) · `권한없음`(주황) |

---

## 회귀 위험 지점

| 지점                               | 위험                                                                                               |
| ---------------------------------- | -------------------------------------------------------------------------------------------------- |
| 🔴 **`invalidateQueries` v4 → v5** | **고치지 않으면 토글이 화면에 반영되지 않는다.** 이 도메인에서 가장 중요한 한 줄                   |
| **브릿지 재작성**                  | `window.CALLBACK_*` 전역 함수 방식. 타깃 `message` 이벤트 구조로는 하나도 못 받는다                |
| **`emitter.on` cleanup 추가**      | 경로 가드와 함께 있어서, 가드를 지우고 cleanup만 넣으면 **양쪽 컴포넌트가 서로의 데이터를 받는다** |
| **디바운스 2단**                   | 300ms/1000ms를 놓치면 중복 요청 또는 반응 지연                                                     |
| **7초 폴백 타이머**                | `useEffect` cleanup에서 `clearTimeout`을 빠뜨리면 언마운트 후 setState 경고                        |
| **전역 로딩 플래그**               | `useNativeBackButton`이 읽는다. Zustand로 옮길 때 참조를 놓치면 뒤로가기 차단이 사라진다           |
| **`enabled` 반응형화**             | 타깃에서 자동으로 반응형이 되어 **레거시보다 조회가 더 일어날 수 있다**                            |
| **권한 필드 오타**                 | 정정하면 **앱에서 오는 값을 못 읽는다** (D-49·D-50). 자산 파일명까지 얽혀 있다                     |
| **고정 높이 `h-[52px]`**           | 폰트 배율 확대 시 내용이 잘린다. 레거시도 같으므로 **동일하게 잘려야 한다**                        |
