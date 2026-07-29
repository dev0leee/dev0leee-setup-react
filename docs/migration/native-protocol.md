# 네이티브 브릿지 프로토콜 인벤토리 — 레거시 `apt-resident-fe`

> 기준 SHA `6d5bf22` (2026-07-27)
> 추출원 `src/constants/nativeKeys.js`, `src/natives/**` 6개, 호출부 전수 grep
> 전체 계획: `~/.claude/plans/working-smcom-apt-resident-fe-tranquil-charm.md`

## 집계

| 방향                         |   종류 |               래퍼 함수 |                  사용 중 |
| ---------------------------- | -----: | ----------------------: | -----------------------: |
| Web → App (`toNativeKeys`)   |     17 |                      17 | **15** (2건 호출부 없음) |
| App → Web (`fromNativeKeys`) |      7 | 7 (`window.CALLBACK_*`) |  **6** (1건 구독부 없음) |
| **합계**                     | **24** |                         |                          |

---

## 0. 결론 먼저 — Phase 0-4는 답이 정해져 있다

계획서에서 **유일하게 남은 외부 블로커**가 0-4(네이티브 브릿지 핸들러명 정합)였다.
양쪽 코드를 대조한 결과, **선택의 여지가 없다.**

### 전제

이번 마이그레이션은 **웹 레이어만 React로 교체**한다. 네이티브 앱은 이미 빌드되어
사용자 기기에 설치돼 있고, 이번 작업 범위가 아니다.

→ **앱이 기대하는 프로토콜에 웹이 맞춰야 한다. 반대는 불가능하다.**
앱을 바꾸면 스토어 심사 + 업데이트 보급률 문제가 생기고, 구버전 앱 사용자는 전부 깨진다.

### 따라서

> **레거시 프로토콜을 100% 그대로 유지한다.**
> 타깃 템플릿의 `src/shared/lib/native/**`를 **레거시 방식으로 재작성**한다.

**0-4는 블로커가 아니다.** 앱 팀 확인 없이 진행 가능하다.
(다만 앱 팀에 "브릿지 프로토콜 변경 계획이 있는지"만 통보 겸 확인해두면 좋다.)

### 양쪽 차이 — 핸들러명만 다른 게 아니다

| 항목              | 레거시 (**따라야 함**)                                         | 타깃 템플릿 (폐기)                             |
| ----------------- | -------------------------------------------------------------- | ---------------------------------------------- |
| iOS 핸들러명      | `JsInterface`                                                  | `appBridge`                                    |
| Android 객체명    | `window.JsInterface`                                           | `window.AndroidBridge`                         |
| 메시지 필드       | `{ type, data }`                                               | `{ type, payload }`                            |
| iOS 전송 타입     | **객체 그대로** `postMessage(message)`                         | 문자열 `postMessage(JSON.stringify(...))`      |
| Android 전송 타입 | 문자열 `postMessage(JSON.stringify(message))`                  | 문자열                                         |
| `data` 미지정 시  | **`''` (빈 문자열)**                                           | `undefined` (필드 자체가 빠짐)                 |
| **수신 방식**     | **네이티브가 `window.CALLBACK_*(json)` 전역 함수를 직접 호출** | `window.postMessage` → `message` 이벤트 리스너 |
| 수신 파싱         | 각 콜백이 개별적으로 `JSON.parse(data)`                        | bridge가 봉투를 파싱 후 분배                   |
| 타입 명명         | `SCREAMING_SNAKE_CASE`                                         | `camelCase`                                    |
| 페이로드 검증     | 없음                                                           | zod                                            |

**수신 방식이 근본적으로 다르다.** 타깃은 `message` 이벤트를 듣지만,
레거시 앱은 `window.CALLBACK_APP_VERSION(...)` 같은 **전역 함수를 직접 호출**한다.
타깃 구조로는 앱이 보내는 메시지를 **하나도 받지 못한다.**

### 타깃에서 살릴 수 있는 것

프로토콜은 레거시를 따르되, 타깃의 좋은 설계는 유지한다:

| 타깃 설계                                                        | 유지 여부                                                                                                                          |
| ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `window`에 손대는 곳을 `bridge.ts` 한 파일로 국한                | ✅ 유지                                                                                                                            |
| 도메인별 파일 분리 (`common`/`auth`/`apass`/`face`/`lobbyPhone`) | ✅ 유지 (레거시도 동일 구조)                                                                                                       |
| zod로 수신 페이로드 검증                                         | ✅ **추가 유지** — 레거시엔 없지만 런타임 동작을 바꾸지 않으므로 등가 이관에 위배되지 않는다. 검증 실패 시 `console.error` 후 무시 |
| 구독 해제 함수 반환                                              | ✅ 유지 (mitt `off` 래핑)                                                                                                          |
| `getDeviceOs` / `isWebBrowser`                                   | ✅ 유지하되 `isNativeApp` 판정을 `JsInterface` 기준으로 수정                                                                       |

---

## 1. 전송 계층 (`src/natives/native.js`)

### 환경 감지

```js
export const checkDeviceOs = () => {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream
  const isAndroid = /Android/.test(navigator.userAgent)
  return { isIOS, isAndroid }
}

export const isNativeApp = () =>
  !!(window?.webkit?.messageHandlers?.JsInterface || window?.JsInterface)

export const isWebBrowser = () => !isNativeApp()
```

> 타깃 `device.ts`는 `isIos`/`isAndroid`(소문자 o), 레거시는 `isIOS`/`isAndroid`.
> 타깃 `regex.ts`의 `IOS_UA_PATTERN`에 `window.MSStream` 체크가 있는지 확인 필요.

### 발신

```js
export const sendToMobile = (type, data) => {
  const { isIOS, isAndroid } = checkDeviceOs()
  const message = { type, data: data || '' } // ← data 없으면 빈 문자열

  if (import.meta.env.MODE === 'development') console.log(message)

  if (isIOS)
    window?.webkit?.messageHandlers?.JsInterface?.postMessage(message) // 객체
  else if (isAndroid) window?.JsInterface?.postMessage(JSON.stringify(message)) // 문자열
}
```

**이관 시 반드시 보존할 3가지**

1. **`data`의 기본값은 `''`** — `undefined`나 필드 생략이 아니다. 앱 파싱이 깨질 수 있다
2. **iOS에는 객체를, Android에는 문자열을 보낸다** — 비대칭이 의도적이다
3. **분기 기준이 `window` 객체 존재가 아니라 UA다** — 타깃 `bridge.ts`는 `AndroidBridge` 존재로 분기하는데, 레거시는 `checkDeviceOs()`(UA)로 분기한다. **동작이 다르다**

> `import.meta.env.MODE === 'development'`일 때 모든 발신 메시지를 `console.log`한다.
> 타깃은 `import.meta.env` 직접 접근이 ESLint로 금지되어 있으므로 `env.VITE_ENV`로 대체한다
> (개발 편의 기능이라 동작 등가성에 영향 없음).

### 수신

```js
export const callbackMobileEmitter = (type, data) => emitter.emit(type, data)
```

`mitt` 싱글턴(`src/lib/emitter/emitter.js`, 5 LOC)에 그대로 흘린다.
각 `window.CALLBACK_*` 전역 함수가 JSON을 파싱해 이 함수를 호출한다.

**중요**: `src/main.js`가 `natives/apass.js`·`auth.js`·`face.js`·`lobbyPhone.js`를
**side-effect import**한다. 이 import가 있어야 `window.CALLBACK_*`가 설치된다.
React에서도 앱 부팅 시점에 동일하게 등록해야 한다.

---

## 2. Web → App (17종)

|   # | 타입                         | 래퍼 함수                                                   | 페이로드                  | 호출부                                                                                                                   |
| --: | ---------------------------- | ----------------------------------------------------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
|  N1 | `GET_APP_VERSION`            | `nativeGetAppVersion()`                                     | 없음                      | `MyPageView/MyPageVersion.vue`                                                                                           |
|  N2 | `GO_APP_PERMISSION`          | `nativeGoAppPermission()`                                   | 없음                      | ⚠️ **없음**                                                                                                              |
|  N3 | `GET_PERMISSION_INFO`        | `nativeGetPermissionInfo()`                                 | 없음                      | `MainView.vue`, `MainCardMenu/MainCardApassBadge.vue`, `ApassView/ApassView.vue`, `queries/apass/usePatchAPassActive.js` |
|  N4 | `EXIT_APP`                   | `nativeExitApp()`                                           | 없음                      | `layouts/LayoutBase.vue`, `composables/useNativeBackButton.js`                                                           |
|  N5 | `LOGOUT_APP`                 | `nativeLogoutApp()`                                         | 없음                      | `composables/useLogoutFlow.js`                                                                                           |
|  N6 | `CLEAR_APP_CACHE`            | `nativeClearAppCache()`                                     | 없음                      | ⚠️ **없음**                                                                                                              |
|  N7 | `OPEN_SYSTEM_BROWSER`        | `nativeOpenSystemBrowser({ targetUrl })`                    | `{ targetUrl }`           | `BoardView/NoticeBoard/NoticeDetailView.vue`                                                                             |
|  N8 | `OPEN_NEW_WEBVIEW`           | `nativeOpenNewWebView({ type, title, url, hasBackButton })` | 4필드                     | `composables/useShoppingNavigation.js`                                                                                   |
|  N9 | `END_SPLASH`                 | `nativeEndSplash()`                                         | 없음                      | `MainApp.vue`, `composables/useWaitingMemberFcmToken.js`                                                                 |
| N10 | `SEND_INITIAL_RESIDENT_INFO` | `nativeSendInitialResidentInfo({...})`                      | 6필드 (아래)              | `composables/useLoginData.js`, `composables/useWaitingMemberFcmToken.js`, **`router/index.js` 가드**                     |
| N11 | `SEND_CHANGED_RESIDENT_INFO` | `nativeSendChangedResidentInfo({...})`                      | 6필드 (N10과 동일)        | `composables/useChangeApt.js`, `MainView.vue`                                                                            |
| N12 | `SAVE_FILE`                  | `nativeSaveFile({ fileName, fileUrl, type })`               | 3필드                     | `components/common/ModalImageViewer.vue`, `components/common/FileAttachment.vue`                                         |
| N13 | `SET_APASS_STATE`            | `nativeSetApassState(isApassActive)`                        | `{ isDeviceApassActive }` | `ApassView/ApassActivityButton.vue`                                                                                      |
| N14 | `GET_LOBBYPHONE_SIP_STATE`   | `nativeGetLobbyPhoneSipState()`                             | 없음                      | `VisitView/LobbyPhone/VisitLobbyPhoneListSipState.vue`                                                                   |
| N15 | `CALL_LOBBYPHONE_GUARD`      | `nativeCallLobbyPhoneGuard()`                               | 없음                      | `VisitView/LobbyPhone/VisitLobbyPhoneListGuardCall.vue`                                                                  |
| N16 | `SEND_LOBBYPHONE_QR_INFO`    | `nativeSendLobbyPhoneQrInfo({ qrInfo })`                    | `{ qrInfo }`              | `VisitView/LobbyPhone/VisitLobbyPhoneQrView.vue`                                                                         |
| N17 | `OPEN_FACE_CAMERA`           | `nativeOpenFaceCamera()`                                    | 없음                      | `VisitView/FaceRegister/FaceRegisterGuideView.vue`, `FaceRegisterFailView.vue`                                           |

### N10 · N11 페이로드 (동일 구조)

| 필드                           | 타입    | 의미                             |
| ------------------------------ | ------- | -------------------------------- |
| `aptResidentUuid`              | string  | 입주민 uuid                      |
| `hasAptApassService`           | boolean | 단지의 A-PASS 서비스 가입 여부   |
| `hasResidentApassService`      | boolean | 입주민의 A-PASS 서비스 가입 여부 |
| `isDeviceApassActive`          | boolean | 기기 A-PASS 기능 활성화 여부     |
| `hasAptLobbyPhoneService`      | boolean | 단지의 로비폰 서비스 가입 여부   |
| `hasResidentLobbyPhoneService` | boolean | 입주민의 로비폰 서비스 가입 여부 |

라우터 가드(`routes.md` §6-4)에서 `getLoginInfo()`의 `contentList`를 훑어
`name === 'A-PASS'`, `name.trim() === '로비폰'`으로 단지 서비스 보유를 판정한다.
**`'로비폰'`에 `.trim()`이 붙어 있다** — 서버 데이터에 공백이 섞여 있다는 뜻. 그대로 재현.

### ⚠️ N12 `SAVE_FILE` — URL에 빈 쿼리 파라미터를 붙인다

```js
export const nativeSaveFile = ({ fileName, fileUrl, type = 'file' }) => {
  sendToMobile(toNativeKeys.SAVE_FILE, {
    fileName,
    fileUrl: `${fileUrl}?filName=`, // ← 오타(filName) + 값 없는 쿼리
    type,
  })
}
```

`fileUrl` 뒤에 **`?filName=`**(오타, 값 없음)를 항상 덧붙인다.
S3 URL의 Content-Disposition 처리나 앱 측 파싱과 관련된 우회로 추정된다.

> **이관 중 절대 수정 금지.** 고치면 파일 저장이 깨질 수 있다.
> `type`의 기본값 `'file'`도 유지. 가능한 값은 `'file' | 'image'`.

### ⚠️ N13 `SET_APASS_STATE` — 유일하게 위치 인자

`nativeSetApassState(isApassActive)`만 객체가 아닌 스칼라 인자를 받고,
내부에서 `{ isDeviceApassActive: isApassActive }`로 이름을 바꿔 보낸다.
타깃 컨벤션(단일 객체 인자)에 맞추되 **전송되는 필드명은 `isDeviceApassActive` 그대로**.

### N9 `END_SPLASH` — Promise로 감싸져 있다

```js
export const nativeEndSplash = () =>
  new Promise((resolve) => {
    sendToMobile(toNativeKeys.END_SPLASH)
    resolve()
  })
```

앱 응답을 기다리지 않고 즉시 resolve한다. 실질적으로 동기 함수인데
호출부가 `await`할 수 있게 감싼 것. 이관 시 `Promise<void>` 시그니처 유지.

### ⚠️ 호출부가 없는 2건 (N2 · N6)

| #   | 타입                | 상태                                          |
| --- | ------------------- | --------------------------------------------- |
| N2  | `GO_APP_PERMISSION` | `natives/apass.js`에 정의만 있고 호출부 없음  |
| N6  | `CLEAR_APP_CACHE`   | `natives/common.js`에 정의만 있고 호출부 없음 |

**제외 판단 보류.** 앞선 `getNoticeTopThree` 사례처럼 "안 쓰는 것 같다"는 판단이 틀릴 수 있고,
이 둘은 **프로토콜 상수**라 앱 쪽이 기대하고 있을 수 있다.
래퍼 함수는 이관하되 호출부가 없는 상태 그대로 둔다 (비용이 거의 0).
`deferred.md`에 기록.

---

## 3. App → Web (7종)

네이티브가 `window.CALLBACK_*(jsonString)`을 **직접 호출**한다.
`CALLBACK_GO_BACK`만 인자가 없고, `CALLBACK_APP_VERSION`만 파싱 없이 원본을 그대로 흘린다.

|   # | 타입                            | 파싱                       | 페이로드                                                       | 구독부                                                                           |
| --: | ------------------------------- | -------------------------- | -------------------------------------------------------------- | -------------------------------------------------------------------------------- |
|  C1 | `CALLBACK_APP_VERSION`          | **없음** (raw 그대로 emit) | 설치된 앱 버전 문자열                                          | `MyPageView/MyPageVersion.vue`                                                   |
|  C2 | `CALLBACK_GO_BACK`              | — (인자 없음)              | 없음                                                           | `composables/useNativeBackButton.js`, **`OpinionApp.vue`**                       |
|  C3 | `CALLBACK_PERMISSION_INFO`      | `JSON.parse`               | 8필드 (아래)                                                   | `MainView.vue`, `MainCardMenu/MainCardApassBadge.vue`, `ApassView/ApassView.vue` |
|  C4 | `CALLBACK_PUSH_ALARM`           | `JSON.parse`               | `{ pushAlarmRequestType, dataUuid, aptUuid, aptResidentUuid }` | ⚠️ **emitter 구독부 없음** (아래)                                                |
|  C5 | `CALLBACK_APASS_STATE`          | `JSON.parse`               | `{ isDeviceApassActive }`                                      | `ApassView/ApassActivityButton.vue`                                              |
|  C6 | `CALLBACK_LOBBYPHONE_SIP_STATE` | `JSON.parse`               | `{ isSipActive }`                                              | `VisitView/LobbyPhone/VisitLobbyPhoneListSipState.vue`                           |
|  C7 | `CALLBACK_FACE_IMAGE`           | `JSON.parse`               | `{ image }` base64 JPEG/PNG                                    | `VisitView/FaceRegister/FaceRegisterGuideView.vue`, `FaceRegisterFailView.vue`   |

### C3 `CALLBACK_PERMISSION_INFO` 페이로드 (8필드, 전부 boolean)

| 필드                 | 의미                         |
| -------------------- | ---------------------------- |
| `btOn`               | 블루투스 활성화 상태         |
| `btTransmitt`        | 비컨 송신 가능 여부          |
| `dataSaverOff`       | 데이터 절약 모드 활성화 상태 |
| `gpsEnabled`         | GPS 활성화 상태              |
| `ignoringBatteryOpt` | 배터리 최적화 중지 허용 상태 |
| **`locAlawaysOn`**   | 위치 권한 항상허용 상태      |
| `lowerPowerEnabled`  | 절전모드 활성화 상태         |
| `pushAuthorized`     | 알림 권한 상태               |

> ⚠️ **`locAlawaysOn`은 오타지만 고치면 안 된다.**
> 레거시 주석에 `(앱팀과 협의된 철자 오류 있음)`이라고 명시돼 있다.
> 앱이 이 철자로 보내므로 **`locAlwaysOn`으로 고치면 값을 못 받는다.**
> `lowerPowerEnabled`도 의미상 `lowPower`가 맞아 보이나 동일하게 유지.

### ⚠️ C4 `CALLBACK_PUSH_ALARM` — 콜백 안에서 라우팅한다

```js
window.CALLBACK_PUSH_ALARM = (data) => {
  const { pushAlarmRequestType, dataUuid, aptUuid, aptResidentUuid } = JSON.parse(data);

  let targetPath = null;
  if (pushAlarmRequestType === 'NOTICE')            targetPath = `/board/notice/detail/${dataUuid}`;
  else if (pushAlarmRequestType === 'IN_OUT_PARKING') targetPath = `/parking/inoutHistory/detail/${dataUuid}`;

  if (targetPath) {
    try { router.push(targetPath); }
    catch { window.location.href = targetPath; }    // 라우터 미준비 시 폴백
    return;
  }
  return callbackMobileEmitter(fromNativeKeys.CALLBACK_PUSH_ALARM, {...});
};
```

**문제 2가지**

1. **라우터 싱글턴을 직접 import**한다 (`natives/common.js:3`) → 순환 의존.
   React 이관 시 **이벤트만 발행하고 앱 레벨에서 `useNavigate`로 처리**해야 한다
   (계획서 3-2에 이미 반영됨).
2. **emitter 폴백 경로는 죽은 코드다.** `NOTICE`/`IN_OUT_PARKING` 외의 타입일 때만
   emit하는데, `emitter.on(CALLBACK_PUSH_ALARM, ...)` 구독부가 **어디에도 없다.**
   알려진 두 타입은 항상 `return`으로 빠지므로 emit 자체가 실행되지 않는다.

**이관 시 동작 등가 조건**: 푸시 알림 딥링크 2종(`NOTICE` → 공지 상세,
`IN_OUT_PARKING` → 입출차 상세)이 **앱이 백그라운드/종료 상태에서 열렸을 때도** 동작해야 한다.
`try/catch` 폴백(`window.location.href`)은 라우터가 아직 준비되지 않은 시점을 위한 것이므로,
React에서도 **라우터 마운트 이전에 도착한 푸시를 버리지 않는** 구조가 필요하다
(예: 이벤트를 큐에 담아두고 라우터 준비 후 소비). **Phase 5에서 설계 확정.**

### C2 `CALLBACK_GO_BACK` — 양쪽 앱 모두 구독

메인 앱은 `useNativeBackButton.js`(105 LOC)가 라우트별 뒤로가기 로직을 처리하고,
**opinion 앱도 `OpinionApp.vue:19`에서 구독한다.** opinion 이관 시 빠뜨리기 쉬운 지점.

`useNativeBackButton`의 동작:

- 라우트별 뒤로가기 분기
- 더 갈 곳이 없을 때 **Android는 앱 종료 확인 모달**, **iOS는 `nativeExitApp()` 즉시 호출** — OS별 분기
- 이 모달은 `LayoutBase.vue`가 렌더

---

## 4. 이관 설계

### 4-1. 파일 구조 (타깃)

```
src/shared/lib/native/
├── bridge.ts        ← 재작성: JsInterface, {type,data}, window.CALLBACK_* 등록/해제
├── common.ts        ← N1,N4,N6,N7,N8,N9,N12 + C1,C2,C3,C4
├── auth.ts          ← N5,N10,N11
├── apass.ts         ← N2,N13 + C5
├── face.ts          ← N17 + C7
├── lobbyPhone.ts    ← N14,N15,N16 + C6
├── device.ts        ← checkDeviceOs, isNativeApp, isWebBrowser (판정 기준 수정)
└── types/           ← 페이로드 타입 (docs/conventions/05-types.md: 타입은 types/에)
```

`src/shared/constants/native.ts`에 `TO_NATIVE`·`FROM_NATIVE`를 `as const` 객체로
(레거시 `nativeKeys.js`와 키·값 동일). **`enum` 금지** — `erasableSyntaxOnly`.

### 4-2. `bridge.ts`가 해야 할 것

1. `sendToNative({ type, data })` — UA로 iOS/Android 분기, iOS는 객체·Android는 문자열,
   `data` 기본값 `''`
2. `registerNativeCallbacks()` — 앱 부팅 시 `window.CALLBACK_*` 7개를 설치.
   각 콜백이 `JSON.parse` 후 (zod 검증) 내부 이벤트 버스로 전달
3. `subscribeToNative({ type, schema, handler })` — 구독 + 해제 함수 반환.
   내부는 `mitt` 또는 동등한 경량 이벤트 버스
4. `window`에 손대는 곳은 이 파일 하나 (타깃 설계 유지)

> `mitt`을 그대로 쓸지(프레임워크 무관, 5 LOC) 자체 구현할지는 Phase 5에서.
> 타깃 CLAUDE.md의 "라이브러리 임의 추가 금지"에 걸리므로 자체 구현이 무난하다.

### 4-3. React 바인딩

타깃에 이미 `src/shared/hooks/useNativeBackButton.ts`가 있으나 `backButton` 타입을 구독한다.
**`CALLBACK_GO_BACK`으로 재작성**하고, 레거시 `useNativeBackButton.js`(105 LOC)의
라우트별 분기 + OS별 종료 처리를 이식한다.

콜백 7종에 대응하는 훅을 만들되, **`useEffect` cleanup에서 반드시 구독 해제**한다
(`docs/conventions/06-react.md`).

### 4-4. 반드시 보존할 목록

| #   | 항목                                                     | 사유                                                               |
| --- | -------------------------------------------------------- | ------------------------------------------------------------------ |
| P1  | iOS 핸들러명 `JsInterface`, Android `window.JsInterface` | 앱이 이 이름으로 주입                                              |
| P2  | 메시지 필드명 `data` (`payload` 아님)                    | 앱 파서 계약                                                       |
| P3  | iOS 객체 / Android 문자열 비대칭 전송                    | 〃                                                                 |
| P4  | `data` 기본값 `''`                                       | 〃                                                                 |
| P5  | 수신을 `window.CALLBACK_*` 전역 함수로 노출              | 앱이 직접 호출                                                     |
| P6  | 타입 문자열 24종 전부 대문자 스네이크 그대로             | 〃                                                                 |
| P7  | **`locAlawaysOn`** 철자                                  | 앱팀 합의된 오타                                                   |
| P8  | **`SAVE_FILE`의 `?filName=`** 접미                       | 파일 저장 동작 의존                                                |
| P9  | `SET_APASS_STATE` 필드명 `isDeviceApassActive`           | 〃                                                                 |
| P10 | 푸시 딥링크 2종의 경로 문자열                            | `/board/notice/detail/:uuid`, `/parking/inoutHistory/detail/:uuid` |
| P11 | UA 기반 OS 분기 (window 객체 존재 아님)                  | 타깃과 판정 기준이 다름                                            |

---

## 5. `[확인 필요]`

| #        | 질문                                                                                                                       | 비고                                                                               |
| -------- | -------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| ~~N-Q1~~ | ~~앱 팀에 브릿지 프로토콜 변경 계획이 있는가?~~ → **확정: 변경하지 않는다** (2026-07-29 사용자). 레거시 프로토콜 100% 유지 | 없다면 0-4는 종결. **통보 수준이면 충분**                                          |
| N-Q2     | `GO_APP_PERMISSION`·`CLEAR_APP_CACHE`(N2·N6)를 앱이 여전히 기대하는가?                                                     | 웹에 호출부가 없다. 래퍼는 이관하되 확인되면 정리                                  |
| N-Q3     | 푸시 알림이 앱 종료 상태에서 열릴 때 웹 라우터 준비 전에 `CALLBACK_PUSH_ALARM`이 도착하는가?                               | C4의 `window.location.href` 폴백이 그 상황을 위한 것으로 보임. Phase 5 설계에 필요 |
| N-Q4     | 푸시 타입이 `NOTICE`·`IN_OUT_PARKING` 2종뿐인가?                                                                           | 다른 타입이 있으면 현재는 조용히 버려진다(구독부 없음)                             |

---

**다음 산출물**: `query-keys.md` (쿼리 훅 142개)
