# 도메인 명세 — 방문자 출입관리 (visit)

> 기준 SHA `6d5bf22` · 레거시 `views/VisitView/` 23개 파일 2,042 LOC
> 타깃 슬라이스 `features/visit/`
> API 18개 (`kiosk` 2 · `lobbyPhone` 9 · `faceRegister` 5 + 미사용 2) · 쿼리 훅 14개 · 라우트 13개

**네이티브 브릿지 의존도가 가장 높은 도메인이다.** Web→App 4종 · App→Web 2종을 쓰며,
그중 `OPEN_FACE_CAMERA` ↔ `CALLBACK_FACE_IMAGE` 왕복은 **이 도메인 없이는 검증할 수 없다.**

세 계보로 나뉜다:

| 계보         | 화면 | 성격                                                        |
| ------------ | ---: | ----------------------------------------------------------- |
| **키오스크** |    1 | 방문증 키오스크 비밀번호 확인·변경                          |
| **로비폰**   |    4 | 세대호출·경비호출·세대비밀번호·임시비밀번호·1회용 QR        |
| **안면인식** |    7 | 얼굴 등록 위저드(정보→가이드→촬영→완료/실패)·목록·상세·수정 |
| (목록 진입)  |    1 | `/visit` 허브                                               |

> ⚠️ **화면 ID는 `V*`, 확인 항목은 `V-Q*`를 쓴다.**

---

## 화면 목록

| #   | 경로                                        | name                    | 컴포넌트                                           | meta                                                               |
| --- | ------------------------------------------- | ----------------------- | -------------------------------------------------- | ------------------------------------------------------------------ |
| V1  | `/visit`                                    | 방문자 출입관리         | `VisitListView`                                    | AppBar `방문자 출입관리` · `backPath:'/main'` · **배경 `#f9fafb`** |
| V2  | `/visit/kiosk/password`                     | 방문증 키오스크 설정    | `VisitKioskView`                                   | AppBar `방문증 키오스크 설정`                                      |
| V3  | `/visit/lobbyPhone`                         | 로비폰 세대호출         | `VisitLobbyPhoneView`                              | **`showAppBar:false`**                                             |
| V4  | `/visit/lobbyPhone/tempPassword/list`       | 임시비밀번호 리스트     | `LobbyPhone/VisitLobbyPhoneTempPasswordListView`   | AppBar **`임시 비밀번호`** · 배경 `#f9fafb`                        |
| V5  | `/visit/lobbyPhone/tempPassword/create`     | 임시비밀번호 생성       | `LobbyPhone/VisitLobbyPhoneTempPasswordCreateView` | AppBar `임시 비밀번호 생성`                                        |
| V6  | `/visit/lobbyPhone/qr`                      | 로비 QR 코드            | `LobbyPhone/VisitLobbyPhoneQrView`                 | AppBar `로비 QR 코드` · 배경 `#f9fafb`                             |
| V7  | `/visit/lobbyPhone/faceRegisterManagement`  | 안면인식 얼굴 등록 관리 | `FaceRegister/FaceRegisterManagementView`          | AppBar **`안면인식 얼굴 등록`** · `backPath:'/visit/lobbyPhone'`   |
| V8  | `/visit/lobbyPhone/faceRegister/detail/:id` | 안면인식 정보 상세      | `FaceRegister/FaceRegisterDetailView`              | AppBar `등록정보 상세` · `backPath:'…/faceRegisterManagement'`     |
| V9  | `/visit/lobbyPhone/faceRegister/edit/:id`   | 안면인식 정보 수정      | `FaceRegister/FaceRegisterEditView`                | AppBar `등록정보 수정`                                             |
| V10 | `/visit/lobbyPhone/faceRegister/form`       | 안면인식 얼굴 신규 등록 | `FaceRegister/FaceRegisterFormView`                | AppBar `얼굴 신규 등록`                                            |
| V11 | `/visit/lobbyPhone/faceRegister/guide`      | 안면인식 촬영 가이드    | `FaceRegister/FaceRegisterGuideView`               | AppBar `얼굴 신규 등록`                                            |
| V12 | `/visit/lobbyPhone/faceRegister/fail`       | 안면인식 얼굴 등록 실패 | `FaceRegister/FaceRegisterFailView`                | AppBar `얼굴 신규 등록` · **`hasBackButton:false`**                |
| V13 | `/visit/lobbyPhone/faceRegister/complete`   | 안면인식 얼굴 등록 완료 | `FaceRegister/FaceRegisterCompleteView`            | AppBar `얼굴 신규 등록` · **`hasBackButton:false`**                |

**전 화면 `showBottomNav: false` · 전부 동적 import**(eager 없음).

> ⚠️ **라우트 name과 AppBar 제목이 다른 경우가 4건이다** — V4(`임시비밀번호 리스트` vs `임시 비밀번호`),
> V7(`안면인식 얼굴 등록 관리` vs `안면인식 얼굴 등록`), V12·V13(둘 다 `얼굴 신규 등록`).
> **표시되는 것은 AppBar 제목이다.**
>
> ⚠️ **`appBarBackgroundColor: '#f9fafb'`를 쓰는 3개 화면(V1·V4·V6)** — 다른 도메인엔 없는 meta다.
> `routes.md`의 meta 어휘 참조. 타깃 라우트 `handle`로 옮긴다.
>
> ⚠️ **V12·V13은 `hasBackButton:false`다.** 위저드 종료 화면이라 뒤로가기를 막는다.
> 단 **네이티브 뒤로가기 버튼은 막지 못한다** → §공통 3-5

### 진입 경로

| 화면 | 진입 출처                                                                      |
| ---- | ------------------------------------------------------------------------------ |
| V1   | 메인 카드 `MainCardVisitorPass.vue:16` — **유일한 진입점**                     |
| V2   | V1 `방문증 키오스크 비밀번호` 카드 (`hasAptVisitorPassContent`)                |
| V3   | V1 `로비폰` 카드 (`hasLobbyPhone`) · 메인 메뉴 `constants/domain/common.js:88` |
| V4   | V3 `임시 비밀번호` 메뉴                                                        |
| V5   | V4 우하단 `+` 플로팅 버튼                                                      |
| V6   | V3 `1회용 출입 QR코드` 메뉴                                                    |
| V7   | V3 `안면인식 얼굴 등록` 메뉴 (`'안면인식'` 콘텐츠 보유 단지만)                 |
| V8   | V7 카드 `상세` 버튼                                                            |
| V9   | V8 `수정` 버튼                                                                 |
| V10  | V7 `신규 등록` → 동의 바텀시트 `등록 진행하기`                                 |
| V11  | V10 `다음`                                                                     |
| V12  | `usePostFaceRecog` **onError** (V11·V12에서 촬영 실패 시)                      |
| V13  | `usePostFaceRecog` **onSuccess**                                               |

**V3에서 갈라지는 3개 메뉴가 이 도메인의 중심축이다.**

---

## 1. 하위 컴포넌트 전수 (23개)

| 파일                                                   |  줄 | 역할                                | 사용 화면 |
| ------------------------------------------------------ | --: | ----------------------------------- | --------- |
| `VisitListView.vue`                                    |  17 | V1 허브                             | V1        |
| `VisitListLobbyPhoneItem.vue`                          |  29 | 로비폰 카드                         | V1        |
| `VisitListKioskItem.vue`                               |  35 | 키오스크 카드                       | V1        |
| `VisitKioskView.vue`                                   |  59 | V2                                  | V2        |
| `Kiosk/VisitKioskPasswordCheckModal.vue`               |  49 | 현재 비밀번호 확인 모달             | V2        |
| `VisitPasswordChangeModal.vue`                         | 135 | **비밀번호 변경 모달 (V2·V3 공용)** | V2 · V3   |
| `VisitLobbyPhoneView.vue`                              |  71 | V3                                  | V3        |
| `LobbyPhone/VisitLobbyPhoneListSipState.vue`           |  54 | SIP 연결 상태 (네이티브)            | V3        |
| `LobbyPhone/VisitLobbyPhoneListGuardCall.vue`          |  32 | 경비 호출 (네이티브)                | V3        |
| `LobbyPhone/VisitLobbyPhoneListPassword.vue`           |  48 | 세대 비밀번호 카드                  | V3        |
| `LobbyPhone/VisitLobbyPhoneListNavItem.vue`            |  43 | 메뉴 항목 1개                       | V3        |
| `LobbyPhone/VisitLobbyPhoneTempPasswordListView.vue`   | 149 | V4                                  | V4        |
| `LobbyPhone/VisitLobbyPhoneTempPasswordCreateView.vue` | 278 | V5                                  | V5        |
| `LobbyPhone/VisitLobbyPhoneQrView.vue`                 |  37 | V6 셸                               | V6        |
| `LobbyPhone/VisitLobbyPhoneQrCode.vue`                 |  56 | QR 캔버스 + base64 캡처             | V6        |
| `FaceRegister/FaceRegisterManagementView.vue`          | 200 | V7                                  | V7        |
| `FaceRegister/FaceRegisterNoticeBottomSheet.vue`       |  96 | 사진 저장 동의 바텀시트             | V7        |
| `FaceRegister/FaceRegisterDetailView.vue`              | 231 | V8 (+ 자체 삭제 모달)               | V8        |
| `FaceRegister/FaceRegisterEditView.vue`                |  90 | V9                                  | V9        |
| `FaceRegister/FaceRegisterFormView.vue`                |  85 | V10                                 | V10       |
| `FaceRegister/FaceRegisterGuideView.vue`               | 112 | V11 (+ 네이티브 촬영)               | V11       |
| `FaceRegister/FaceRegisterFailView.vue`                |  89 | V12 (+ 재촬영)                      | V12       |
| `FaceRegister/FaceRegisterCompleteView.vue`            |  47 | V13                                 | V13       |

**모든 파일이 실사용된다** — 죽은 파일 없음.

---

## 2. 네이티브 브릿지 (이 도메인의 핵심)

`native-protocol.md`의 전체 24종 중 **6종을 이 도메인이 단독으로 쓴다.**

### Web → App (4종)

| 키                         | 페이로드            | 호출부                                    | 용도                  |
| -------------------------- | ------------------- | ----------------------------------------- | --------------------- |
| `GET_LOBBYPHONE_SIP_STATE` | 없음                | `VisitLobbyPhoneListSipState` `onMounted` | SIP 연결 상태 요청    |
| `CALL_LOBBYPHONE_GUARD`    | 없음                | `VisitLobbyPhoneListGuardCall` 클릭       | 경비원 호출           |
| `SEND_LOBBYPHONE_QR_INFO`  | `{ qrInfo }` base64 | `VisitLobbyPhoneQrView` 공유 클릭         | QR 이미지 앱으로 전달 |
| `OPEN_FACE_CAMERA`         | 없음                | V11 `다음` · V12 `재시도`                 | 얼굴 촬영 카메라 열기 |

### App → Web (2종)

| 키                              | 페이로드           | 수신부                        | 비고                                             |
| ------------------------------- | ------------------ | ----------------------------- | ------------------------------------------------ |
| `CALLBACK_LOBBYPHONE_SIP_STATE` | `{ isSipActive }`  | `VisitLobbyPhoneListSipState` | `window.CALLBACK_*` 전역 함수 → `emitter`        |
| `CALLBACK_FACE_IMAGE`           | `{ image }` base64 | V11 · V12                     | **성공 시에만 발사.** 취소 시 앱이 카메라만 닫음 |

**수신 경로** (`natives/native.js`):

```
앱 → window.CALLBACK_FACE_IMAGE(jsonString)
   → JSON.parse → callbackMobileEmitter(fromNativeKeys.CALLBACK_FACE_IMAGE, { image })
   → mitt emitter → 컴포넌트의 emitter.on 핸들러
```

> 🔴 **타깃 `shared/lib/native/**`는 `message` 이벤트를 듣는 구조라 이 방식으로는 한 건도 못 받는다.**
> `native-protocol.md` §0 결정대로 **웹이 레거시 프로토콜(`window.CALLBACK_*` 전역 함수)에 맞춘다.**
> Phase 4의 브릿지 재작성이 끝나야 이 도메인을 이관할 수 있다.
>
> ⚠️ **`CALLBACK_FACE_IMAGE`는 촬영 취소를 알려주지 않는다.** 사용자가 카메라에서 취소하면
> 웹은 아무 신호도 받지 못하고 화면이 그대로 남는다. **의도된 설계**(앱 주석에 명시).
> 로딩 스피너를 띄우면 안 되는 이유다 — 취소 시 영영 안 사라진다.

### 뒤로가기 특수 처리 — `useNativeBackButton`

`CALLBACK_GO_BACK` 수신 시 **경로별 분기**가 있고, 그중 3개가 Visit이다:

| 현재 경로                                  | 이동 대상           |
| ------------------------------------------ | ------------------- |
| `/visit/lobbyPhone/faceRegisterManagement` | `/visit/lobbyPhone` |
| `/visit/lobbyPhone`                        | `/visit`            |
| `/visit`                                   | `/main`             |
| 그 외                                      | `navigateBack()`    |

> ⚠️ **V12·V13(`hasBackButton:false`)은 이 분기에 없다.** 네이티브 뒤로가기를 누르면
> `navigateBack()`이 실행되어 **위저드 중간으로 되돌아간다.** AppBar 버튼만 막혀 있다.
> → `deferred.md` 「동작 의심」. **이관 시 그대로**

---

## 3. 공용 인프라

### 3-1. 콘텐츠 게이팅 — 3계층

| 계층    | 판정                                                    | 위치                         |
| ------- | ------------------------------------------------------- | ---------------------------- |
| V1 카드 | `hasAptVisitorPassContent` · `hasLobbyPhone`            | `useGetResidentDetailInfo`   |
| V3 메뉴 | `contentList.some((c) => c.name.trim() === '안면인식')` | `VisitLobbyPhoneView` 인라인 |
| 쿼리    | `contentList.some((item) => item.name === '로비폰')`    | QR·푸시 훅 인라인            |

> 🔴 **판정 방식이 3가지로 갈린다.** `useGetResidentDetailInfo`의 `CONTENT_TYPES` 상수,
> `.trim()` 있는 인라인, `.trim()` 없는 인라인.
> **`useGetLobbyPhoneEncryptedQrData`·`useGetLobbyPhonePushAlarmState`는 `.trim()`이 없어**
> 서버 값에 공백이 섞이면 QR·푸시가 비활성화된다. `parking.md` PK-Q1과 같은 유형.
> → `[확인 필요]` V-Q1
>
> 🔴 **`authStore.getAptInfo().contentList.some(...)`에 옵셔널 체이닝이 없다** (QR·푸시 훅 2곳).
> `contentList`가 없으면 TypeError. `getAptInfo()?`는 있는데 `.contentList`엔 없다.

### 3-2. 비밀번호 변경 모달 — `VisitPasswordChangeModal` (135줄, V2·V3 공용)

| prop        | V2 (키오스크)                       | V3 (로비폰)                        |
| ----------- | ----------------------------------- | ---------------------------------- |
| `title`     | `키오스크 비밀번호 변경`            | `세대 비밀번호 변경`               |
| `handler`   | `visitorPassPasswordMutationAsync`  | `lobbyPhonePasswordMutationAsync`  |
| `isPending` | `isPatchVisitorPassPasswordPending` | `isPatchLobbyPhonePasswordPending` |

| 요소      | 클래스 (원문)                                                                                                                                                                                                      |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 컨테이너  | `flex w-[334px] max-w-[80vw] flex-col items-center rounded-lg bg-base-b-white` (`ModalBase` 안)                                                                                                                    |
| 헤더      | `mb-5 flex w-full items-center justify-between p-5 pb-3`                                                                                                                                                           |
| 제목      | `leading-none tracking-tight text-base-b-black pretendard-18Bold`                                                                                                                                                  |
| 닫기      | `flex h-7 w-7 items-center justify-center` > `CloseBold.svg` alt `닫기 아이콘` `h-3 w-3`                                                                                                                           |
| 안내      | `text-center leading-tight text-defaults-primary-text-primary pretendard-14SemiBold` → `세대 비밀번호` / `숫자 4자리를 입력하세요`                                                                                 |
| 입력 영역 | `flex flex-col items-center justify-center gap-4 p-5`                                                                                                                                                              |
| 폼        | `flex items-center justify-center gap-3` (`id="passwordForm"`)                                                                                                                                                     |
| 입력 칸   | `h-[60px] w-[54px] rounded bg-defaults-secondary-background-mono text-center text-defaults-secondary-text-secondary pretendard-20SemiBold` (`InputBase`, `maxlength=1`, `inputmode="numeric"`, `pattern="[0-9]*"`) |
| 버튼      | `<ButtonBase form="passwordForm" type="submit" round-type="rounded" color="brand" custom-class="flex justify-center">` — 진행 중 `SpinnerCircle`, 아니면 `변경`                                                    |

**동작**:

```js
handleInput(event, index):
  const input = event.target.value.replace(/\D/g, '').slice(0, 1);
  passwords.value[index] = input;
  event.target.value = input;
  if (input && index < 3) document.getElementById(`passwordInput${index+1}`).focus();

isPasswordComplete = passwords.every((p) => p.length === 1)

handleSubmit:
  if (isPasswordComplete) {
    try { await handler({ password: passwords.join('') }); closeModal(); }
    catch (error) { console.error(error); }
    closeModal();          // ← 성공 경로에서 두 번 호출된다
  }
```

> ⚠️ **`closeModal()`이 성공 시 두 번 호출된다.** `emit('close')`가 두 번 나가지만
> 부모가 불리언을 `false`로 두 번 세팅할 뿐이라 무해.
>
> ⚠️ **실패해도 모달이 닫힌다.** `catch` 뒤의 `closeModal()`이 무조건 실행된다.
> 에러 모달은 mutation의 `onError`가 별도로 띄우므로 **모달이 닫히고 에러 모달이 뜬다.**
>
> ⚠️ **백스페이스 처리가 없다.** 지워도 이전 칸으로 포커스가 가지 않는다.
> ⚠️ **`document.getElementById`로 포커스를 옮긴다.** React에서는 `ref` 배열로 바꾼다 — 동작 동일.
> ⚠️ **붙여넣기 처리가 없다.** 4자리를 붙여넣으면 첫 칸에 1자리만 들어간다.

### 3-3. 얼굴인식 에러 매핑 — `constants/domain/faceRecog.js`

**`FACE_RECOG_ERROR_MESSAGE`** (API 공통 에러코드 → 사용자 문구, 9종):

| `errorCode`                      | 문구                                                               |
| -------------------------------- | ------------------------------------------------------------------ |
| `RESIDENT_NOT_FOUND`             | `입주민 정보를 찾을 수 없습니다. 다시 로그인 후 시도해주세요.`     |
| `LOBBY_PHONE_POLICY_NOT_FOUND`   | `로비폰 정책이 설정되어 있지 않습니다. 관리사무소에 문의해주세요.` |
| `FACE_RECOG_NOT_FOUND`           | `얼굴인식 정보가 존재하지 않습니다.`                               |
| `FACE_RECOG_APT_NOT_FOUND`       | `아파트 정보를 찾을 수 없습니다. 관리사무소에 문의해주세요.`       |
| `FACE_RECOG_HOUSEHOLD_NOT_FOUND` | `세대 정보를 찾을 수 없습니다. 관리사무소에 문의해주세요.`         |
| `FACE_RECOG_NOT_AVAILABLE`       | `얼굴인식을 사용할 수 없는 단지입니다. 관리사무소에 문의해주세요.` |
| `FACE_RECOG_FILE_REQUIRED`       | `얼굴 이미지가 첨부되지 않았습니다. 다시 촬영해주세요.`            |
| `FACE_RECOG_LIMIT_OVER`          | `등록 가능한 최대 개수(10개)를 초과했습니다.`                      |
| `LOBBY_PHONE_SERVER_ERROR`       | `로비폰 서버 점검중입니다.`                                        |

**`FACE_RECOG_REGIST_CAUSE_MESSAGE`** (등록 실패 `registCause` → 문구, 6종):

| `registCause`              | 문구                                                                                             |
| -------------------------- | ------------------------------------------------------------------------------------------------ |
| `ImageDownloadFailed`      | `얼굴 이미지 다운로드에 실패했습니다. 등록한 사진을 삭제 후 촬영 가이드에 맞게 재등록 해주세요.` |
| `SdkEngineRejectedFailed`  | `얼굴 인식 SDK 등록에 실패했습니다. …`                                                           |
| `TemplateExtractionFailed` | `얼굴 템플릿 추출에 실패했습니다. …`                                                             |
| `DuplicatedFace`           | `이미 중복 등록된 얼굴입니다. 등록한 이전 정보를 삭제 후 재등록 해주세요.`                       |
| `FaceGuidOrTemplateIsNull` | `얼굴 ID 또는 템플릿 데이터가 없습니다. …`                                                       |
| `ExceptionOccurred`        | `등록 중 오류가 발생했습니다. …` ← **미정의 코드의 fallback**                                    |

> **두 매핑의 쓰임이 다르다.** `FACE_RECOG_ERROR_MESSAGE`는 **API 호출 실패**(HTTP 에러) 시,
> `FACE_RECOG_REGIST_CAUSE_MESSAGE`는 **API는 성공했으나 로비폰 서버가 REJECT한 경우**
> (V8 상세에서 `faceRecogStatus === 'REJECT'`일 때) 쓴다.

### 3-4. 유틸

| 유틸                               | 동작                                                                                             |
| ---------------------------------- | ------------------------------------------------------------------------------------------------ |
| `base64ToFile(base64, filename)`   | data URL/순수 base64 → `File`. **magic bytes로 MIME 판별** (`/9j/`→jpeg, `iVBO`→png, 그 외 jpeg) |
| `copyValue(value, fn)`             | `navigator.clipboard` 우선, 실패 시 `<textarea>` + `execCommand` 폴백                            |
| `formatIsoStringDate(d).dotDate()` | `YYYY.MM.DD` 계열                                                                                |
| `formatObjectDate(d, 'hyphen')`    | `YYYY-MM-DD`                                                                                     |
| `formatHtmlText`                   | 엔티티 디코드 + `\n`→`<br/>`                                                                     |

> ⚠️ **`copyValue`의 폴백은 `try`/`catch` 양쪽에서 `fn()`을 호출한다.**
> `execCommand`가 실패해도 **`클립보드에 복사되었습니다.` 토스트가 뜬다.**
> → `deferred.md` 「동작 의심」. **이관 시 그대로**
>
> ⚠️ **`base64ToFile`은 `atob`를 쓴다.** 대용량 이미지에서 동기 블로킹이 발생할 수 있다.
> 얼굴 사진 1장이라 실측 문제는 없다.

### 3-5. Visit 도메인 밖에서 쓰는 로비폰 API 2개

| API                                | 호출부                                    | 시점                      |
| ---------------------------------- | ----------------------------------------- | ------------------------- |
| `putLobbyPhoneResidentLogout`      | `queries/auth/useDeleteLogout.js:38`      | 로그아웃 (`auth.md` A7)   |
| `deleteLobbyPhoneResidentDeletion` | `queries/resident/useDeleteAccount.js:26` | 회원탈퇴 (`mypage.md` P8) |

**이 2개는 Visit 화면에서 호출되지 않는다.** 타깃에서는 각 도메인이 쓰되
API 함수는 `features/visit/api/lobbyPhone.ts`에 두고 `index.ts`로 공개한다.
(또는 `shared`로 올린다 → `[확인 필요]` V-Q2)

**푸시 알림 훅 2개**(`useGetLobbyPhonePushAlarmState`·`usePatchLobbyPhonePushAlarmState`)도
`useAlarmSetting`(마이페이지 P4)에서만 쓴다 — `parking.md` §3-10과 같은 구조.

---

## 4. 도메인 전역 결함

### 4-1. SIP 상태 리스너를 해제하지 않는다 🔴

```js
// VisitLobbyPhoneListSipState.vue — setup 본문
emitter.on(fromNativeKeys.CALLBACK_LOBBYPHONE_SIP_STATE, (data) => {
  if (getCurrentRoutePath() === '/visit/lobbyPhone') {
    isSipOn.value = data.isSipActive
  }
})
```

**`emitter.off`가 없다.** V3에 들어갈 때마다 리스너가 하나씩 쌓인다.
익명 함수라 나중에 제거할 수도 없다.

> **핸들러 안의 경로 검사가 이 누수를 감추는 장치다.** 다른 화면에서 콜백이 와도 무시된다.
> 하지만 V3을 N번 방문하면 리스너가 N개 등록되어 **한 번의 콜백에 N번 실행**된다.
> 값이 같으므로 화면은 정상이지만 리스너는 계속 늘어난다.
>
> **V11·V12의 `CALLBACK_FACE_IMAGE`는 `onMounted`/`onUnmounted`로 제대로 관리한다.**
> **같은 도메인 안에서 비대칭.**
>
> → 타깃에서는 `useEffect` cleanup으로 자연히 해결된다. **경로 검사는 제거해도 동작이 같다**
> (리스너가 언마운트 시 사라지므로). 다만 등가 이관 원칙상 검사를 남겨도 무방.
> → `[확인 필요]` V-Q3

### 4-2. 임시비밀번호 스키마의 `superRefine`이 죽어 있다 🔴

```js
tabType: z.enum(['TEMPOTP', 'TEMPTERM']),
...
.superRefine((data, ctx) => {
  if (data.tabType === 'period' && !data.endDate) {   // ← 'period'는 enum에 없다
    ctx.addIssue({ ..., message: '기간을 선택해주세요', path: ['endDate'] });
  }
});
```

**`'period'`는 절대 매치되지 않는다.** 기간형에서 종료일이 없어도 검증을 통과한다.
실제로는 `initialValues`에 `endDate: new Date()`가 들어가고 `handleEndDate`가 항상 값을 채워
빈 상태가 되지 않는다. → `deferred.md` 「동작 의심」. **이관 시 그대로**

### 4-3. 얼굴등록 위저드의 상태 전달 방식이 2가지다 🔴

| 구간       | 방식                     | 코드                                                            |
| ---------- | ------------------------ | --------------------------------------------------------------- |
| V10 → V11  | **쿼리스트링**           | `navigateTo({ path: '…/guide', query: { name, memo } })`        |
| V11 → V12  | **history.state**        | `navigateTo({ path: '…/fail', state: { name, memo, reason } })` |
| V12 재시도 | `history.state`에서 읽음 | `window.history?.state?.name ?? ''`                             |

> **V10→V11은 새로고침해도 살아남지만 V11→V12는 사라진다.**
> V12에서 새로고침 후 `재시도`를 누르면 **이름이 빈 채로 등록 요청이 나간다.**
> `board.md` §5-13, `parking.md` §PK10과 같은 유형.
> → `deferred.md` 「동작 의심」. **이관 시 그대로**(react-router `location.state`로 이전)
>
> ⚠️ **쿼리스트링에 사용자 입력(이름·비고)이 노출된다.** URL에 한글이 인코딩되어 들어간다.
> 개인정보가 브라우저 히스토리·로그에 남는다. → `deferred.md` 「보안」

### 4-4. `invalidateQueries`/`removeQueries` v4 위치인자 — 5곳

| 파일                                  | 호출                                                       |
| ------------------------------------- | ---------------------------------------------------------- |
| `useDeleteFaceRecog.js`               | `removeQueries(['lobbyPhoneFaceRecogDetail', uuid, guid])` |
| 〃                                    | `invalidateQueries(['lobbyPhoneFaceRecogList', uuid])`     |
| `usePostFaceRecog.js`                 | `invalidateQueries(['lobbyPhoneFaceRecogList', uuid])`     |
| `useDeleteLobbyPhoneTempPassword.js`  | `invalidateQueries(['lobbyPhoneTempPasswordList', uuid])`  |
| `usePatchLobbyPhonePushAlarmState.js` | `invalidateQueries(['lobbyPhonePushAlarmState'])`          |

**전부 v5에서 no-op.** 객체 시그니처로 바꾸되 **키 내용은 그대로.**

> ⚠️ **`usePutFaceRecog`(수정)에는 무효화가 아예 없다.** 수정 후 V8로 이동하는데
> `staleTime: 0`이라 재조회되어 반영된다. 목록(V7)은 다녀와야 갱신된다.

### 4-5. 문자열을 `v-for`로 순회하는 곳 🔴

```html
<!-- VisitKioskPasswordCheckModal -->
<li v-for="digit in visitorPassPassword?.password" :key="digit">{{ digit }}</li>
```

`password`는 **4자리 문자열**이다. Vue의 `v-for`가 문자 단위로 순회해 4칸이 렌더된다.
`board.md` §5-5와 같은 패턴.

> 🔴 **`:key="digit"`이 값 자체다.** `1123` 같은 비밀번호는 **`1`이 중복 키**가 되어
> Vue가 경고를 내고 렌더가 어긋날 수 있다.
> → **React에서는 `Array.from(password).map((d, i) => ...)` + `key={i}`로 옮긴다.**
> 인덱스 키로 바꾸는 것은 **버그 수정이 아니라 동등 이상의 렌더 보장**이다.
> → `[확인 필요]` V-Q4

### 4-6. 그 외

| 항목                                                                                 | 조치                       |
| ------------------------------------------------------------------------------------ | -------------------------- |
| `VisitListView`가 `<div>` 안에 `<li>`를 직접 넣는다 (`<ul>` 없음)                    | 그대로                     |
| `VisitLobbyPhoneQrCode`의 빈 `onMounted(async () => {})`                             | **삭제**                   |
| `VisitListKioskItem`의 `bg-deep-blue` — **미생성 클래스** (`broken-styles.md` §4)    | **삭제**                   |
| `VisitListKioskItem`의 `w-4.75 h-4.75` — **미생성** (§3)                             | `w-[19px] h-[19px]`로 수정 |
| `VisitLobbyPhoneTempPasswordCreateView`의 `.custom-start/end-date-picker` scoped CSS | 그대로                     |
| `afterTwoSevenDays` 변수명 (실제로는 +13일)                                          | 그대로(내부)               |
| V4 삭제에 **확인 모달이 없다** — 휴지통 클릭 즉시 삭제                               | 그대로                     |
| V8 삭제 모달이 `ModalButton`이 아니라 **자체 구현**                                  | 그대로                     |
| V9 저장에 **검증이 없다** — 이름을 비워도 저장된다                                   | 그대로                     |

---

# V1. 방문자 출입관리 — `/visit`

`VisitListView.vue` (17줄)

```
┌─────────────────────────────┐
│ ← 방문자 출입관리            │  배경 #f9fafb
├─────────────────────────────┤
│ ┌─────────────────────────┐ │
│ │ 로비폰            [로비폰]│ │  #00063F 짙은 남색
│ │ 세대호출 통화 연결 및 문열기│ │
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
│ │ 방문증 키오스크 비밀번호   │ │  흰 배경
│ │ 패스워드 확인 및 변경 →   │ │
│ └─────────────────────────┘ │
└─────────────────────────────┘
```

| 요소 | 클래스 (원문)                                                       |
| ---- | ------------------------------------------------------------------- |
| 루트 | `h-full w-full space-y-3 bg-defaults-secondary-background-mono p-6` |

**노출 조건**: `hasLobbyPhone` → 로비폰 카드, `hasAptVisitorPassContent` → 키오스크 카드.
**둘 다 없으면 빈 화면이다** (안내 문구 없음). → `deferred.md` 「동작 의심」

## 로비폰 카드 — `VisitListLobbyPhoneItem` (29줄)

| 요소   | 클래스 (원문)                                                                                                                  |
| ------ | ------------------------------------------------------------------------------------------------------------------------------ |
| 버튼   | `relative flex h-[117px] w-full flex-col items-end justify-between overflow-hidden rounded-xl bg-[#00063F] p-[18px] shadow-md` |
| 내용   | `flex h-full flex-col items-start justify-between gap-[3px] self-stretch`                                                      |
| 제목   | `text-base-b-white pretendard-16Bold` → `로비폰` (**앞뒤 공백 포함 `로비폰`**)                                                 |
| 설명   | `text-base-b-white/80 pretendard-14SemiBold` → `세대호출 통화 연결 및 문열기`                                                  |
| 아이콘 | `LobbyPhone.svg` alt `로비폰 아이콘` — `absolute bottom-[0px] right-6 h-[85px] w-[85px]`                                       |

## 키오스크 카드 — `VisitListKioskItem` (35줄)

| 요소      | 클래스 (원문)                                                                                                                                                                                                         |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 버튼      | `bg-deep-blue relative flex h-[117px] w-full flex-col items-end justify-between overflow-hidden rounded-xl border border-defaults-tertiary-border-tertiary bg-defaults-primary-background-primary p-[18px] shadow-md` |
| 제목      | `pretendard-16Bold` → `방문증 키오스크 비밀번호`                                                                                                                                                                      |
| 배경 그림 | `BackgroundPassword.svg` alt `방문증 키오스크 비밀번호` — `absolute bottom-[-6.5px] right-6 h-[103px] w-[103px] opacity-[0.11]`                                                                                       |
| 하단      | `flex items-center gap-2 self-stretch`                                                                                                                                                                                |
| 하단 문구 | `text-defaults-secondary-text-secondary pretendard-14SemiBold` → `패스워드 확인 및 변경`                                                                                                                              |
| 화살표    | `ArrowNarrowRight.svg` alt `화살표 아이콘` — **`w-4.75 h-4.75`** ⚠️ 미생성                                                                                                                                            |

> ⚠️ **`bg-deep-blue`와 `bg-defaults-primary-background-primary`가 함께 있다.**
> 앞의 것은 CSS가 생성되지 않아 무효, 뒤의 흰 배경이 적용된다 → **삭제해도 동일**
> (`broken-styles.md` §4).
>
> ⚠️ **`w-4.75 h-4.75`도 미생성**이라 아이콘이 SVG 고유 크기로 렌더된다.
> `w-[19px] h-[19px]`로 고치면 **크기가 달라진다** (`broken-styles.md` §3).
>
> ⚠️ **배경 그림의 `alt`가 `방문증 키오스크 비밀번호`다** — 장식 이미지인데 제목과 중복된다.
> 스크린리더가 두 번 읽는다. 그대로.

## QA 체크리스트

- [ ] 로비폰 콘텐츠만 있는 단지 → 로비폰 카드만
- [ ] 키오스크 콘텐츠만 있는 단지 → 키오스크 카드만
- [ ] 둘 다 없는 단지 → **빈 화면** (레거시와 동일)
- [ ] 네이티브 뒤로가기 → `/main`
- [ ] AppBar 배경이 `#f9fafb`

---

# V2. 방문증 키오스크 설정 — `/visit/kiosk/password`

`VisitKioskView.vue` (59줄)

```
┌─────────────────────────────┐
│ ← 방문증 키오스크 설정        │
├─────────────────────────────┤
│ 현재 비밀번호 확인        >  │
│ 비밀번호 변경하기         >  │
└─────────────────────────────┘
```

| 요소   | 클래스 (원문)                                                                                           |
| ------ | ------------------------------------------------------------------------------------------------------- |
| 루트   | `h-full w-full px-5 py-4` (`<ul>`)                                                                      |
| 항목   | `flex w-full cursor-pointer items-center justify-between px-2.5 py-2 text-center pretendard-15SemiBold` |
| 화살표 | `ArrowRight.svg` alt `화살표 아이콘` `h-6 w-6`                                                          |

**메뉴** = `VISITOR_PASS_KIOSK_PASSWORD_MENU`:
`현재 비밀번호 확인`(`currentPassword`) · `비밀번호 변경하기`(`changePassword`)

> ⚠️ **`<li>`에 `@click`을 건다** (`<button>` 아님). 키보드 접근 불가. 그대로.

## 현재 비밀번호 확인 모달 — `VisitKioskPasswordCheckModal` (49줄)

**`ModalBase`를 쓰지 않고 자체 구현**한다.

| 요소      | 클래스 (원문)                                                                                                                                                   |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 딤        | `fixed inset-0 z-[110] flex items-center justify-center bg-base-b-black bg-opacity-50` (클릭 시 닫힘)                                                           |
| 컨테이너  | `flex w-[334px] flex-col items-center rounded-lg bg-base-b-white` (`@click.stop`)                                                                               |
| 헤더      | `flex w-full items-center justify-between p-5 pb-3`                                                                                                             |
| 제목      | `pretendard-18Bold` → `현재 비밀번호 확인`                                                                                                                      |
| 닫기      | `h-7 w-7` > `CloseBold.svg` alt `닫기 아이콘` `h-3 w-3`                                                                                                         |
| 로딩      | `SpinnerDots`                                                                                                                                                   |
| 숫자 목록 | `flex items-center justify-center gap-3 p-5`                                                                                                                    |
| 숫자 칸   | `flex h-[60px] w-[54px] items-center justify-center rounded bg-defaults-secondary-background-mono text-defaults-secondary-text-secondary pretendard-20SemiBold` |

> ⚠️ **`z-[110]`이다.** `ModalBase`는 `z-[9999]`, `SpinnerDots`도 `z-[9999]`.
> **모달 위에 스피너가 뜬다** — 로딩 중에는 스피너가 모달을 덮는다. 그대로.
>
> 🔴 **`v-for="digit in password"`가 문자열을 순회하고 `:key="digit"`이 값이다** (§4-5).
> 중복 숫자가 있는 비밀번호에서 키가 충돌한다.
>
> ⚠️ **`ModalBase`와 달리 `body.overflow`를 잠그지 않는다.** 모달 뒤 배경이 스크롤된다.

**API**: `getVisitorPassPassword` — `GET /apartmant/{aptUuid}/apt/household/kiosk/password/{aptResidentUuid}`
쿼리 키 `['visitorPassPassword', aptUuid, aptResidentUuid]`

## 비밀번호 변경

`VisitPasswordChangeModal` (§3-2) · `title="키오스크 비밀번호 변경"`

**API**: `putVisitorPassPassword` — `PUT` 같은 경로, body `{ password }`
**성공**: 토스트 `변경되었습니다`

### 에러 분기

| `errorCode`          | 문구                                   |
| -------------------- | -------------------------------------- |
| `NOT_HEAD_AUTHORITY` | `세대주만 비밀번호 변경이 가능합니다.` |
| 그 외                | 서버 `message`                         |

> **세대원은 변경할 수 없다.** UI로는 막지 않고 **서버가 거부한 뒤 모달로 알린다.**

## QA 체크리스트

- [ ] `현재 비밀번호 확인` → 4칸에 숫자 표시
- [ ] 같은 숫자가 반복되는 비밀번호(`1123`)에서 렌더가 정상인가
- [ ] 로딩 중 스피너가 모달을 덮는가 (레거시와 동일)
- [ ] 딤 클릭으로 닫히는가
- [ ] 세대원 계정으로 변경 시 `세대주만 비밀번호 변경이 가능합니다.`
- [ ] 변경 성공 → 토스트 `변경되었습니다`

---

# V3. 로비폰 세대호출 — `/visit/lobbyPhone`

`VisitLobbyPhoneView.vue` (71줄) · **`showAppBar:false`**

```
┌─────────────────────────────┐
│ ←  로비폰 세대호출      ⚙   │  화면 내 <AppBar>, navigateFn='/visit'
├─────────────────────────────┤
│ ┌─────────────────────────┐ │
│ │ 로비폰 통화 연결 상태 [정상]│ │  #00063F  SipState
│ └─────────────────────────┘ │
│ ┌──────────┐ ┌──────────┐  │
│ │ 경비 호출 │ │세대 비밀번호│  │  GuardCall / Password
│ │      →   │ │      →   │  │
│ └──────────┘ └──────────┘  │
│ ┌─────────────────────────┐ │
│ │ 임시 비밀번호        [🔑]│ │  NavItem × 1~3
│ │ 공동현관을 출입할 수 …    │ │
│ │ →                        │ │
│ └─────────────────────────┘ │
│ ┌ 1회용 출입 QR코드   [QR] ┐ │
│ ┌ 안면인식 얼굴 등록  [👤] ┐ │  '안면인식' 콘텐츠 보유 시만
└─────────────────────────────┘
```

| 요소      | 클래스 (원문)                                                                                                      |
| --------- | ------------------------------------------------------------------------------------------------------------------ |
| 루트      | `h-full w-full`                                                                                                    |
| AppBar    | `<AppBar title="로비폰 세대호출" class="bg-defaults-secondary-background-secondary" :navigate-fn="moveVisitList">` |
| 우측 슬롯 | `SettingsBlack.svg` alt `설정 아이콘` → `/mypage/alarmSetting`                                                     |
| 본문      | `flex h-full w-full flex-col items-start overflow-auto bg-defaults-secondary-background-secondary pt-12`           |
| 목록      | `flex w-full flex-col items-start gap-3 p-6` (`<ul>`)                                                              |
| 2단 행    | `flex w-full gap-3` (경비호출 + 세대비밀번호)                                                                      |

> ⚠️ **`navigate-fn`으로 뒤로가기를 `/visit`로 고정한다.** `navigateBack()`이 아니다.
> 메인 메뉴에서 직접 V3로 들어와도 뒤로가기는 V1로 간다. **의도된 동작.**

## SIP 연결 상태 — `VisitLobbyPhoneListSipState` (54줄)

| 요소   | 클래스 (원문)                                                          |
| ------ | ---------------------------------------------------------------------- |
| `<li>` | `flex w-full items-center justify-between rounded-xl bg-[#00063F] p-4` |
| 라벨   | `text-base-b-white pretendard-16Regular` → `로비폰 통화 연결 상태`     |

| `isSipOn`   | 칩                                                            |
| ----------- | ------------------------------------------------------------- |
| `undefined` | `<ChipBase color="orange" variant="fill">정보없음</ChipBase>` |
| `true`      | `<ChipBase color="deepGreen" variant="fill">정상</ChipBase>`  |
| `false`     | `<ChipBase color="deepRed" variant="fill">오류</ChipBase>`    |

**흐름**: `onMounted` → `nativeGetLobbyPhoneSipState()` → 앱 → `window.CALLBACK_LOBBYPHONE_SIP_STATE`
→ `emitter` → `isSipOn` 갱신

> **웹 브라우저(비네이티브)에서는 콜백이 오지 않아 항상 `정보없음`이다.**
> 개발 중 이 화면은 실기기에서만 정상 확인된다.
>
> 🔴 **리스너 해제가 없다** (§4-1).

## 경비 호출 — `VisitLobbyPhoneListGuardCall` (32줄)

| 요소      | 클래스 (원문)                                                                                                                             |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| 버튼      | `relative flex h-[88px] w-full flex-col items-start justify-between rounded-xl bg-defaults-primary-background-primary p-3 px-4 shadow-md` |
| 라벨      | `pretendard-14Bold` → `경비 호출`                                                                                                         |
| 화살표    | `ArrowNarrowRight.svg` alt `화살표 아이콘` `h-[18px] w-[18px]`                                                                            |
| 배경 그림 | `Guard.svg` alt `경비원 아이콘` — `absolute bottom-0 right-4 h-[67px] w-[67px]`                                                           |

**`useDebounceFn(nativeCallLobbyPhoneGuard, 300)`** — 300ms 디바운스로 연타 방지.

> **누른 뒤 웹에는 아무 피드백이 없다.** 앱이 통화를 시작한다. 토스트도 로딩도 없다.

## 세대 비밀번호 — `VisitLobbyPhoneListPassword` (48줄)

경비 호출과 같은 카드 스타일. 배경 그림만 `BackgroundPassword.svg`
(`absolute bottom-0 right-4 h-[74px] w-1/2 max-w-[100px] opacity-[0.11]`).

클릭 → `VisitPasswordChangeModal` (`title="세대 비밀번호 변경"`)
**API**: `putLobbyPhonePassword` — `PUT /apartmant/{aptResidentUuid}/lobby-phone/password`
**성공**: 토스트 `변경되었습니다` · **에러 전용 분기 없음** (서버 `message`)

> ⚠️ **V2 키오스크와 달리 `NOT_HEAD_AUTHORITY` 분기가 없다.** 세대원이 시도하면
> 서버 원문 메시지가 그대로 뜬다. **비대칭.** → `[확인 필요]` V-Q5

## 메뉴 항목 — `VisitLobbyPhoneListNavItem` (43줄)

| 요소   | 클래스 (원문)                                                                                                   |
| ------ | --------------------------------------------------------------------------------------------------------------- |
| 버튼   | `flex w-full items-center justify-between rounded-xl bg-defaults-primary-background-primary p-3 px-4 shadow-md` |
| 좌측   | `flex h-full flex-col justify-between gap-2`                                                                    |
| 텍스트 | `mr-3 flex flex-col items-start gap-1`                                                                          |
| 제목   | `pretendard-14Bold`                                                                                             |
| 설명   | `text-left text-defaults-secondary-text-secondary pretendard-12Regular`                                         |
| 화살표 | `ArrowNarrowRight.svg` `h-[18px] w-[18px]`                                                                      |
| 아이콘 | `item.iconClass` (항목별로 다름)                                                                                |

**`LOBBY_PHONE_NAV_LIST`** (3종):

| key            | 제목                 | 설명                                             | 아이콘 (크기)                    | 경로                                       |
| -------------- | -------------------- | ------------------------------------------------ | -------------------------------- | ------------------------------------------ |
| `tempPassword` | `임시 비밀번호`      | `공동현관을 출입할 수 있는 임시 비밀번호입니다.` | `TempPasswordIcon.svg` (`44×44`) | `/visit/lobbyPhone/tempPassword/list`      |
| `qr`           | `1회용 출입 QR코드`  | `공동현관을 출입할 수 있는 1회용 QR입니다.`      | `QR.svg` (`52×52`)               | `/visit/lobbyPhone/qr`                     |
| `faceRegister` | `안면인식 얼굴 등록` | `공동현관 출입용 얼굴을 등록합니다.`             | `Capa.svg` (`44×44`)             | `/visit/lobbyPhone/faceRegisterManagement` |

**`faceRegister`만 `hasFaceRecogContent`로 필터링된다.**
소스 주석: "이 페이지 진입 자체가 '로비폰' content로 게이트되므로 hasLobbyPhone 중복 체크 불필요"

## QA 체크리스트

- [ ] SIP 상태 칩 3종 (실기기: 정상/오류, 웹: 정보없음)
- [ ] **V3을 여러 번 드나든 뒤에도 SIP 상태가 정상 표시되는가** (§4-1 누수)
- [ ] 경비 호출 → 실기기에서 통화 연결
- [ ] 경비 호출 연타 시 300ms 디바운스
- [ ] 세대 비밀번호 변경 → 토스트
- [ ] `안면인식` 콘텐츠가 없는 단지에서 메뉴가 **2개만** 보이는가
- [ ] 우측 설정 아이콘 → 마이페이지 알림 설정
- [ ] 뒤로가기가 항상 `/visit`인가

---

# V4. 임시 비밀번호 리스트 — `/visit/lobbyPhone/tempPassword/list`

`LobbyPhone/VisitLobbyPhoneTempPasswordListView.vue` (149줄)

```
┌─────────────────────────────┐
│ ← 임시 비밀번호              │  배경 #f9fafb
├─────────────────────────────┤
│ 임시 비밀번호는 세대당 10개까지…│
│ ┌─────────────────────────┐ │
│ │[일회용] 123456 [복사]  🗑 │ │
│ │ ─────────────────────── │ │
│ │ 생성자          홍길동   │ │
│ │ 유효기간   ~2026-08-12   │ │
│ │ 메모            택배     │ │
│ └─────────────────────────┘ │
│                        (+)  │  fixed 우하단
└─────────────────────────────┘
```

| 요소      | 클래스 (원문)                                                                                                                                                                                               |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 루트      | `h-full overflow-auto bg-defaults-secondary-background-mono px-4`                                                                                                                                           |
| 안내 문구 | `ml-1 py-4 text-[#888] pretendard-14Regular` → `임시 비밀번호는 세대당 10개까지 생성할 수 있습니다.`                                                                                                        |
| 카드      | `mb-4 rounded-lg bg-base-b-white p-4 shadow-md`                                                                                                                                                             |
| 상단 행   | `flex items-start justify-between`                                                                                                                                                                          |
| 유형 배지 | `mr-2 rounded-full px-2 py-1 text-base-b-white pretendard-12Regular` + `TEMPOTP`면 `bg-neutral-b-gray-700`, 아니면 `bg-blue-s-info-500`                                                                     |
| 비밀번호  | `pretendard-20Bold` (`<h2>`)                                                                                                                                                                                |
| 복사 버튼 | `ml-2 flex items-center justify-between gap-0.5 rounded-md border border-defaults-secondary-border-secondary px-2 py-1 text-navy-default-text-navy pretendard-12Medium` + `icon_copy.svg` alt `복사 아이콘` |
| 삭제 버튼 | `text-red-500` > `icon_trash.svg` alt `삭제 아이콘`                                                                                                                                                         |
| 구분선    | `mb-3 border border-[#f3f3f3]`                                                                                                                                                                              |
| 정보 영역 | `w-full pretendard-14Regular`                                                                                                                                                                               |
| 정보 행   | `flex items-center justify-between` (유효기간 행은 `py-3`)                                                                                                                                                  |
| 라벨·값   | `text-defaults-tertiary-text-tertiary` (값은 `text-right`)                                                                                                                                                  |
| 메모 값   | `overflow-hidden break-words text-right text-defaults-tertiary-text-tertiary`                                                                                                                               |
| 빈 상태   | `flex h-[calc(100vh-10rem)] items-center justify-center` + `임시 비밀번호가 없습니다.`                                                                                                                      |
| 생성 버튼 | `fixed px-5` + inline `bottom: 1.5rem; right: 0; z-index: 10` > `flex h-14 w-14 items-center justify-center rounded-full …`                                                                                 |

**생성 버튼 배경**: 에러면 `bg-defaults-tertiary-border-tertiary`(회색),
아니면 `bg-gradient-to-t from-[#3763d1] to-[#0037BE]` — `board.md`의 `WriteButton`과 같은 그라데이션.

| 필드           | 표시                                                           |
| -------------- | -------------------------------------------------------------- |
| 유형           | `TEMPOTP` → `일회용` / 그 외 → `기간형`                        |
| `password`     | 그대로                                                         |
| `residentName` | `?? '관리자'` — **관리사무소가 만든 비밀번호는 생성자가 없다** |
| `endDate`      | `~{endDate}` (서버 문자열 그대로)                              |
| `description`  | `processDescription` — `formatHtmlText` 후 **한 줄로 압축**    |

`processDescription`은 `parking.md` §PK3의 `memo` 처리와 **동일한 로직**이다
(`<br>` 제거 → 개행/탭 → 공백 → 연속 공백 1개 → `trim`). 없으면 `-`.

## 동작

| 액션            | 결과                                                                           |
| --------------- | ------------------------------------------------------------------------------ |
| 복사            | `copyValue` → 토스트 `클립보드에 복사되었습니다.`                              |
| 삭제            | **확인 없이 즉시** `deleteTemPasswordMutation(uuid)` → 토스트 `삭제되었습니다` |
| `+` (10개 미만) | `/visit/lobbyPhone/tempPassword/create`                                        |
| `+` (10개)      | 토스트 `최대 10개까지 생성할 수 있습니다.`                                     |

> 🔴 **삭제에 확인 모달이 없다.** 휴지통을 누르면 바로 지워진다.
> 다른 도메인은 전부 확인 모달이 있다(`parking.md` `CAR_INFO_DELETE_MODAL_DATA`,
> `board.md` `DETAIL_DELETE_MODAL_DATA`). **이 도메인만 다르다.**
> → `deferred.md` 「동작 의심」. **이관 시 그대로**
>
> 🔴 **`createNewPassword`가 `lobbyPhoneTempPasswordList.value.length`를 옵셔널 없이 읽는다.**
> 조회 실패 시 `undefined.length` → TypeError. 버튼 색은 에러 상태를 반영하는데
> 클릭 가드는 없다. → `deferred.md` 「동작 의심」
>
> ⚠️ **에러 시 목록 훅이 `swalErrorModal` + `/main` 이동을 실행한다** (`useGetLobbyPhoneTempPasswordList`).
> 문구: `임시 비밀번호 리스트 조회에 실패하였습니다.`
> **에러 상태에서 이 화면에 머무를 수 없다** — 회색 버튼은 사실상 보이지 않는다.

**API**: `getLobbyPhoneTempPasswordList` — `GET /apartmant/resident/{aptResidentUuid}/lobby-phone/temp-password`
쿼리 키 `['lobbyPhoneTempPasswordList', aptResidentUuid]`
**삭제**: `deleteLobbyPhoneTempPassword` — `DELETE .../temp-password/{uuid}`

## QA 체크리스트

- [ ] 일회용/기간형 배지 색 구분
- [ ] 복사 → 토스트 (실기기 클립보드 확인)
- [ ] **삭제가 확인 없이 즉시 실행되는가** (레거시와 동일)
- [ ] 10개일 때 `+` 클릭 → 토스트
- [ ] 관리자 생성분의 생성자가 `관리자`
- [ ] 메모의 줄바꿈이 공백으로 눌리는가
- [ ] 0건 시 `임시 비밀번호가 없습니다.`
- [ ] 조회 실패 시 모달 후 `/main`으로 이동

---

# V5. 임시 비밀번호 생성 — `/visit/lobbyPhone/tempPassword/create`

`LobbyPhone/VisitLobbyPhoneTempPasswordCreateView.vue` (278줄)

```
┌─────────────────────────────┐
│ ← 임시 비밀번호 생성          │
├─────────────────────────────┤
│ ┌───────────┬───────────┐  │
│ │  일회용    │   기간형   │  │  탭
│ └───────────┴───────────┘  │
│                             │
│ 공동현관 출입을 위해          │  탭별 안내문
│ 한번만 사용할 수 있는 …       │
│                             │
│ [YYYY.MM.DD] ~ [YYYY.MM.DD] │  기간형만
│ (1일)(2일)(3일)(1주)(직접선택)│  기간형만
│                             │
│ 메모                        │
│ ┌─────────────────────────┐ │
│ └─────────────────────────┘ │
│ 유효기간:      ~2026-08-12  │
│ [        생성하기        ]   │  fixed bottom-0
└─────────────────────────────┘
```

| 요소         | 클래스 (원문)                                                                                                                        |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| 루트         | `h-full w-full overflow-auto px-5 pb-14`                                                                                             |
| 탭 래퍼      | `flex overflow-hidden bg-defaults-secondary-background-mono p-2 pretendard-16Regular` (부모 `mt-4`)                                  |
| 탭 (선택)    | `relative w-1/2 py-3 text-center bg-base-b-white font-medium text-brand-default-text-brand shadow-sm`                                |
| 탭 (비선택)  | `relative w-1/2 py-3 text-center text-defaults-tertiary-text-tertiary`                                                               |
| 안내문       | `mb-8 mt-6` + `pretendard-18Bold` (첫 줄만 `leading-relaxed`)                                                                        |
| 날짜 영역    | `mb-4 flex items-center` + 좌우 `flex w-full flex-col gap-3`, 가운데 `px-4` → `~`                                                    |
| 기간 버튼    | `mb-4 grid grid-cols-5 gap-2 pretendard-16Regular`                                                                                   |
| 버튼(선택)   | `rounded-md border py-2 text-center bg-brand-default-background-brand text-base-b-white`                                             |
| 버튼(비선택) | `rounded-md border py-2 text-center border-neutral-b-gray-300 bg-base-b-white text-neutral-b-gray-700`                               |
| 메모 라벨    | `mb-2 block text-neutral-b-gray-700 pretendard-16Regular` → `메모`                                                                   |
| 메모         | `h-[130px] w-full resize-none border border-[#F3F3F3] bg-[#F3F3F3] p-3 pretendard-16Regular focus:ring-0` (`rows=3`, `maxlength=50`) |
| 유효기간     | `mb-6 text-neutral-b-gray-700` + `flex justify-between pretendard-16Regular`                                                         |
| 생성 버튼    | `class="fixed bottom-0 left-0 h-14 w-full"` `size="2xl"` `round-type="square"` → `생성하기`                                          |

## 탭별 동작

| 항목           | `TEMPOTP` (일회용)                                                     | `TEMPTERM` (기간형)                                        |
| -------------- | ---------------------------------------------------------------------- | ---------------------------------------------------------- |
| 안내문         | `공동현관 출입을 위해` / `한번만 사용할 수 있는 임시 비밀번호 입니다.` | `기간 내에 여러번 사용할 수 있는` / `임시 비밀번호입니다.` |
| 날짜 선택기    | 숨김                                                                   | 노출 (시작일 **항상 disabled**)                            |
| 기간 버튼      | 숨김                                                                   | 노출 (1일·2일·3일·1주·직접 선택)                           |
| `periodType`   | `null`                                                                 | `'1'`                                                      |
| 전송 `endDate` | **오늘+13일 고정**                                                     | 선택한 종료일                                              |
| 유효기간 표시  | `~{오늘+13일} (14일)`                                                  | `~{종료일} ({요일})`                                       |

**탭 전환 시** (`watch(tabType)`): `memo` 초기화 · `endDate = new Date()` ·
`datePickerDisabledStatus = true` · `periodType` 재설정

## 날짜 선택

`@vuepic/vue-datepicker` 2개 (시작·종료). 공통 설정:
`locale="ko"` · `:enable-time-picker="false"` · `auto-apply` · `:min-date="new Date()"` ·
`:max-date="오늘+13일"` · `format="yyyy-MM-dd"` · `placeholder="YYYY.MM.DD"`

| 선택기 | 특이사항                                                      |
| ------ | ------------------------------------------------------------- |
| 시작일 | **`disabled` 하드코딩** · `no-today` — 항상 오늘, 변경 불가   |
| 종료일 | `:disabled="datePickerDisabledStatus"` · `:clearable="false"` |

**기간 버튼**:

```js
handleEndDate(periodDate):        // '1'|'2'|'3'|'7'
  periodType = periodDate;
  datePickerDisabledStatus = true;
  endDate = 오늘 + Number(periodDate);

handleDirectSelection():
  periodType = 'directSelection';
  datePickerDisabledStatus = false;   // 종료일 선택기 활성화
```

> ⚠️ **`1일`을 고르면 종료일이 `오늘 + 1일`(내일)이 된다.** "1일짜리"라면 오늘이어야 할 수도 있다.
> 서버가 `startDate`~`endDate`를 어떻게 해석하는지에 달렸다. → `[확인 필요]` V-Q6
>
> ⚠️ **시작일 선택기가 항상 비활성인데도 렌더된다.** 값은 항상 오늘.
> 타깃에서 shadcn `calendar`로 교체할 때 **비활성 상태 표시**를 재현해야 한다
> (`--dp-disabled-color: #f3f3f3` scoped 변수).

## 스키마

`tempPasswordFormSchema` — `memo`(≤200자, optional) · `tabType`(enum) ·
`periodType`(nullable optional) · `startDate`/`endDate`(date nullable)

> 🔴 **`superRefine`이 죽어 있다** (§4-2) — `'period'` 비교.
> ⚠️ **`memo`는 스키마상 200자, `<textarea maxlength="50">`은 50자.** UI가 더 엄격해 스키마 검증은 발동 안 함.

## 제출

```js
apiParams = {
  tempPasswordType: values.tabType,
  startDate: formatObjectDate(values.startDate, 'hyphen'),
  endDate: tabType === 'TEMPOTP' ? apiExpiryDateText : formatObjectDate(values.endDate, 'hyphen'),
  description: values.memo,
}
```

**API**: `postCreateLobbyPhoneTempPassword(data, aptResidentUuid)`
— `POST /apartmant/resident/{aptResidentUuid}/lobby-phone/temp-password`

> ⚠️ **인자 순서가 `(data, aptResidentUuid)`다.** 다른 API는 전부 객체 1개를 받는다. **비대칭.**

**성공** 🔴:

```js
window.history.go(-1)
setTimeout(() => {
  navigateReplace({ path: '/visit/lobbyPhone/tempPassword/list' })
}, 50)
showToast('생성되었습니다.')
```

> 🔴 **`history.go(-1)` 후 50ms 뒤 `navigateReplace`.** 뒤로 간 다음 목록으로 치환해
> "생성 화면을 히스토리에서 지우고 목록으로" 만들려는 의도로 보인다.
> **`setTimeout` 50ms에 의존하는 타이밍 해킹이다.** 느린 기기에서 순서가 뒤집힐 수 있다.
> **목록 무효화도 없다** — `navigateReplace`로 목록이 재마운트되며 `staleTime: 0`이라 재조회된다.
>
> → 타깃에서는 `navigate('/visit/lobbyPhone/tempPassword/list', { replace: true })` **한 줄이면 된다.**
> 결과(히스토리에 생성 화면이 남지 않고 목록으로 이동)가 동일하므로 등가 이관에 어긋나지 않는다.
> → `[확인 필요]` V-Q7 (레거시의 실제 히스토리 스택을 실기기에서 확인)

**에러**: 전용 분기 없음 — 서버 `message`

## QA 체크리스트

- [ ] 탭 전환 시 메모·기간이 초기화되는가
- [ ] 일회용 유효기간이 `~{오늘+13일} (14일)`
- [ ] 기간형에서 `1일` 선택 시 종료일이 내일인가 (V-Q6)
- [ ] `직접 선택`을 눌러야 종료일 선택기가 활성화되는가
- [ ] 시작일 선택기가 **항상 비활성**인가
- [ ] 종료일 요일 표기 (`(수)` 등)
- [ ] 생성 후 목록으로 이동하고 **뒤로가기가 생성 화면으로 돌아가지 않는가**
- [ ] 생성 후 목록에 즉시 반영

---

# V6. 로비 QR 코드 — `/visit/lobbyPhone/qr`

`LobbyPhone/VisitLobbyPhoneQrView.vue` (37줄) + `VisitLobbyPhoneQrCode.vue` (56줄)

```
┌─────────────────────────────┐
│ ← 로비 QR 코드               │  배경 #f9fafb
├─────────────────────────────┤
│ ┌─────────────────────────┐ │
│ │ 공동현관 출입 1회용 QR코드 │ │
│ │      ┌───────────┐      │ │
│ │      │  QR 246px  │      │ │  <canvas>
│ │      └───────────┘      │ │
│ │       101동 1001호       │ │
│ └─────────────────────────┘ │
│ [   QR코드 공유    ⬆  ]     │
└─────────────────────────────┘
```

| 요소        | 클래스 (원문)                                                                                                                                                                                 |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 루트        | `h-full w-full overflow-auto bg-defaults-secondary-background-mono px-5 py-6`                                                                                                                 |
| 내부        | `w-full space-y-4`                                                                                                                                                                            |
| QR 카드     | `qrContainer flex flex-col items-center justify-center gap-4 self-stretch rounded-xl border border-defaults-tertiary-border-tertiary bg-base-b-white pb-[23px] pl-5 pr-5 pt-[37px] shadow-sm` |
| 제목        | `text-navy-default-text-navy pretendard-20SemiBold` → `공동현관 출입 1회용 QR코드`                                                                                                            |
| 캔버스 래퍼 | `flex items-center justify-center rounded-md`                                                                                                                                                 |
| 동호수      | `text-base-b-black pretendard-18Bold` → `{dong}동 {ho}호`                                                                                                                                     |
| 공유 버튼   | `<ButtonBase round-type="rounded" color="brand" class="flex justify-center gap-2">QR코드 공유 <img UploadWhite.svg alt="업로드 아이콘"/></ButtonBase>`                                        |

## QR 생성

```js
watch(
  lobbyPhoneEncryptedQrData,
  (newValue) => {
    if (newValue)
      QRCode.toCanvas(qrCanvas.value, newValue, {
        type: 'image/png',
        width: 246,
        height: 246,
        errorCorrectionLevel: 'L',
      })
  },
  { immediate: true },
)
```

**`qrcode` 라이브러리**로 `<canvas>`에 직접 그린다. 서버가 준 암호화 문자열이 원본.

**API**: `getLobbyPhoneEncryptedQrData` — `GET /apartmant/{aptResidentUuid}/lobby-phone/qr`
쿼리 키 `['lobbyPhoneQrServiceCode', aptResidentUuid]` · `enabled: hasLobbyPhone`(인라인 판정, §3-1)

## 공유 — 네이티브 전송

```js
shareQr = useDebounceFn(async () => {
  const qrBase64Image = await qrCodeComponent.value.createBase64Image()
  nativeSendLobbyPhoneQrInfo({ qrInfo: qrBase64Image })
}, 300)

// VisitLobbyPhoneQrCode
createBase64Image = async () => {
  const el = document.querySelector('.qrContainer')
  const canvas = await html2canvas(el)
  return canvas.toDataURL('image/png')
}
```

**`html2canvas`로 카드 전체를 캡처**해 base64 PNG로 만든 뒤 앱에 넘긴다.
`defineExpose({ createBase64Image })`로 부모가 자식 메서드를 호출한다.

> ⚠️ **`document.querySelector('.qrContainer')`로 DOM을 직접 찾는다.** ref를 쓰지 않는다.
> 화면에 `.qrContainer`가 하나뿐이라 동작한다. **타깃에서는 `ref`로 바꾼다** — 결과 동일.
>
> ⚠️ **`defineExpose` + 부모 `ref` 호출**은 React에서 `useImperativeHandle` + `forwardRef`가 된다.
> 또는 캡처 로직을 부모로 올려도 된다. → Phase 5 레시피
>
> ⚠️ **빈 `onMounted(async () => {})`가 남아 있다.** → **삭제**
>
> ⚠️ **`html2canvas`는 무거운 의존성이다** (`tech-mapping.md` §12 승인 대상).
> QR 카드만 캡처하므로 **`canvas.toDataURL()`만으로 대체 가능**해 보이지만,
> 캡처 대상이 **QR 캔버스가 아니라 카드 전체**(제목·동호수 포함)라 대체할 수 없다.
> → `[확인 필요]` V-Q8 (앱이 카드 전체 이미지를 기대하는지)

## QA 체크리스트

- [ ] QR이 246×246으로 렌더되는가
- [ ] 동호수가 표시되는가
- [ ] `QR코드 공유` → 실기기에서 공유 시트가 뜨는가
- [ ] 공유 이미지에 **제목·QR·동호수가 모두 포함**되는가
- [ ] 연타 시 300ms 디바운스
- [ ] 로비폰 콘텐츠가 없으면 쿼리가 비활성인가

---

# V7. 안면인식 얼굴 등록 관리 — `/visit/lobbyPhone/faceRegisterManagement`

`FaceRegister/FaceRegisterManagementView.vue` (200줄)

```
┌─────────────────────────────┐
│ ← 안면인식 얼굴 등록          │
├─────────────────────────────┤
│ 안면인식을 위한        [얼굴]│
│ 얼굴을 등록해주세요.          │
│ 공동현관 및 커뮤니티 시설 …   │
╞═════════════════════════════╡  h-2 구분선
│ 등록된 얼굴 3/10  [+ 신규 등록]│
│ ┌─────────────────────────┐ │
│ │ 홍길동 [등록완료]   [상세]│ │
│ │ 아버지 | 등록일 2026.07.29│ │
│ └─────────────────────────┘ │
└─────────────────────────────┘
```

| 요소        | 클래스 (원문)                                                                                                                                                                                       |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 루트        | `flex h-full w-full flex-col overflow-auto bg-base-b-white`                                                                                                                                         |
| 상단 안내   | `relative px-5 pb-6 pt-8` > `flex flex-col gap-2.5`                                                                                                                                                 |
| 제목        | `text-defaults-primary-text-primary pretendard-20Bold` → `안면인식을 위한` / `얼굴을 등록해주세요.`                                                                                                 |
| 설명        | `text-defaults-secondary-text-secondary pretendard-14Medium` → `공동현관 및 커뮤니티 시설 출입시 사용됩니다.`                                                                                       |
| 장식 이미지 | `faceId-1.png` alt `안면인식 아이콘` — `absolute right-[14px] top-4 h-[88px] w-[88px]`                                                                                                              |
| 구분선      | `h-2 w-full bg-defaults-secondary-background-secondary`                                                                                                                                             |
| 본문        | `flex flex-1 flex-col gap-5 px-5 py-6`                                                                                                                                                              |
| 헤더 행     | `flex items-center justify-between`                                                                                                                                                                 |
| 카운트      | `flex items-center gap-1.5 pretendard-18SemiBold` — `등록된 얼굴` + `{n}`(브랜드색) + `/10`                                                                                                         |
| 신규 버튼   | `flex h-9 items-center gap-1 rounded-lg bg-brand-default-background-brand px-3 py-2 shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)]` + `icon-plus-white.svg` alt `추가 아이콘` `h-4 w-4` + `신규 등록` |
| 초과 안내   | `flex items-start gap-[7px] rounded-md bg-alerts-warning-background-warning-primary px-[13px] py-3`                                                                                                 |
| 초과 아이콘 | `mt-px flex h-[14px] w-[14px] shrink-0 items-center justify-center rounded-full bg-alerts-warning-background-warning` + `text-[10px] font-bold leading-none text-base-b-white` → `!`                |
| 초과 문구   | `flex-1 text-alerts-warning-text-warning pretendard-13Medium` → `등록 가능한 얼굴 수를 모두 사용했습니다. 새로운 얼굴을 등록하려면 기존 얼굴을 삭제해주세요.`                                       |
| 카드 목록   | `flex flex-col gap-3`                                                                                                                                                                               |
| 카드        | `flex items-center gap-3 rounded-xl border border-defaults-secondary-border-secondary px-4 py-5`                                                                                                    |
| 이름        | `text-defaults-primary-text-primary pretendard-18SemiBold`                                                                                                                                          |
| 비고        | `text-defaults-secondary-text-secondary pretendard-14Medium`                                                                                                                                        |
| 구분자      | `text-defaults-tertiary-text-tertiary pretendard-14Regular` → `                                                                                                                                     | ` (비고가 있을 때만) |
| 등록일      | `text-defaults-tertiary-text-tertiary pretendard-14Regular` → `등록일 {YYYY.MM.DD}`                                                                                                                 |
| 상세 버튼   | `flex h-9 shrink-0 items-center justify-center rounded-lg border border-defaults-secondary-border-secondary bg-base-b-white px-3 py-2 shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)]` → `상세`        |
| 빈 상태     | `flex flex-1 items-center justify-center py-40` + `text-defaults-tertiary-text-tertiary pretendard-16Medium` → `등록된 얼굴이 없습니다.`                                                            |

**`MAX_FACES = 10`** — 10개면 `신규 등록` 버튼이 사라지고 경고 배너가 뜬다.

## 상태 칩

```js
getStatusChipColor: COMPLETE→'success' · PENDING→'warning' · REJECT→'red' · 그 외 'gray'
getStatusLabel:     COMPLETE→'등록완료' · PENDING→'등록대기' · REJECT→'등록실패' · 그 외 ''
```

`<ChipBase :color="…">` — **`variant`를 넘기지 않아 기본값 `'fill'`**이 적용된다.

> ⚠️ **알 수 없는 상태는 `color='gray'` + 라벨 `''`이라 빈 칩이 렌더된다.** 그대로.

## 사진 저장 동의 바텀시트 — `FaceRegisterNoticeBottomSheet` (96줄)

`신규 등록` 클릭 → 바텀시트 → `등록 진행하기` → V10

| 요소     | 클래스 (원문)                                                                                                                                      |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| 딤       | `fixed left-0 top-0 z-[9999] flex h-full w-full items-end bg-black/50` (클릭 시 닫힘)                                                              |
| 시트     | `flex w-full flex-col items-center rounded-t-2xl bg-base-b-white` (`@click.stop`)                                                                  |
| 콘텐츠   | `flex w-full flex-col items-center gap-3 p-5`                                                                                                      |
| 아이콘   | `uim-exclamation-circle.svg` alt `알림 아이콘` `h-8 w-8`                                                                                           |
| 제목     | `text-defaults-primary-text-primary pretendard-20Bold` → `사진 정보 저장 알림`                                                                     |
| 설명     | `text-[#697586] pretendard-14Regular` → `출입 등록을 위해 사용자 사진을 서버에 저장하고` / `로비폰으로 전송합니다. 동의하시겠어요?`                |
| 체크박스 | `flex w-full items-center justify-center gap-[11px] py-2` + `CheckboxBaseOn/Off.svg` (alt `동의함`/`동의안함`) `h-5 w-5` + `위 내용에 동의합니다.` |
| 버튼     | `w-full rounded-lg bg-brand-default-background-brand py-4 shadow-[…] pretendard-18SemiBold` + 미동의 시 `opacity-40`                               |

**`defineModel`로 열림 상태를 양방향 바인딩**한다 (Vue 3.4+ 문법).
`watch(isOpen)` → 열릴 때마다 `isAgreed = false`로 초기화.

> ⚠️ **`defineModel`은 React에 대응이 없다.** `open` + `onOpenChange` props로 바꾼다. 동작 동일.
> ⚠️ **동의 체크 전에는 버튼이 `disabled` + `opacity-40`.**

**API**: `getLobbyPhoneFaceRecogList` — `GET /apartmant/{aptResidentUuid}/lobby-phone/face-recog`
쿼리 키 `['lobbyPhoneFaceRecogList', aptResidentUuid]`

**조회 실패 시**: `swalErrorModal({ text: 매핑문구 ?? '얼굴인식 목록 조회에 실패하였습니다.', callback: () => navigateTo('/main') })`

## QA 체크리스트

- [ ] 카운트 `{n}/10` 표시, n이 브랜드색
- [ ] 10개일 때 `신규 등록`이 사라지고 경고 배너
- [ ] 상태 칩 3종 색 (완료=success, 대기=warning, 실패=red)
- [ ] 비고가 없으면 `|` 구분자도 숨는가
- [ ] `신규 등록` → 동의 바텀시트, 미동의 시 버튼 비활성
- [ ] 시트를 닫았다 다시 열면 체크가 풀리는가
- [ ] 딤 클릭으로 닫히는가
- [ ] 0건 시 `등록된 얼굴이 없습니다.`
- [ ] 조회 실패 시 모달 → `/main`

---

# V8. 안면인식 정보 상세 — `/visit/lobbyPhone/faceRegister/detail/:id`

`FaceRegister/FaceRegisterDetailView.vue` (231줄)

```
┌─────────────────────────────┐
│ ← 등록정보 상세              │
├─────────────────────────────┤
│ ┌─────────────────────────┐ │
│ │ 홍길동 [등록완료] [수정][삭제]│ │
│ │ 아버지 | 등록일 2026.07.29│ │
│ └─────────────────────────┘ │
│ (REJECT면 빨간 실패사유 박스) │
│ (PENDING이면 주황 대기 안내)  │
│ • 등록된 사진은 개인정보 보호…│
│ • 수정 시 이름과 관계만 …     │
│ • 사진을 변경하려면 …         │
└─────────────────────────────┘
```

| 요소      | 클래스 (원문)                                                                                                                                                                                              |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 루트      | `flex h-full w-full flex-col bg-defaults-primary-background-primary`                                                                                                                                       |
| 본문      | `flex flex-col gap-3 px-5 pb-5 pt-6` (`v-if="!isLoading && face"`)                                                                                                                                         |
| 카드      | `flex items-center gap-3 rounded-xl border border-defaults-secondary-border-secondary px-4 py-5`                                                                                                           |
| 수정 버튼 | `flex h-9 items-center justify-center rounded-lg border border-defaults-secondary-border-secondary bg-defaults-primary-background-primary px-3 py-2 shadow-[…]` → `수정`                                   |
| 삭제 버튼 | `flex h-9 items-center justify-center rounded-lg border border-alerts-error-border-error bg-defaults-primary-background-primary px-3 py-2 shadow-[…]` → `삭제`(빨강)                                       |
| 실패 박스 | `rounded-lg bg-alerts-error-background-error-secondary px-4 py-3 text-alerts-error-text-error pretendard-14Medium`                                                                                         |
| 대기 박스 | `rounded-lg bg-alerts-warning-background-warning-primary px-4 py-3 text-alerts-warning-text-warning pretendard-14Medium` → `로비폰 서버로 등록 요청 중입니다. 최대 10분 소요됩니다. 잠시만 기다려 주세요.` |
| 안내 목록 | `flex flex-col gap-1 text-defaults-tertiary-text-tertiary pretendard-12Regular`                                                                                                                            |
| 안내 항목 | `flex items-start gap-1.5 pl-0.5` + 점 `mt-[6px] h-[3px] w-[3px] shrink-0 rounded-full bg-defaults-tertiary-text-tertiary`                                                                                 |

**안내 문구 3개** (고정):

1. `등록된 사진은 개인정보 보호를 위해 표시되지 않습니다.`
2. `수정 시 이름과 관계만 변경할 수 있습니다.`
3. `사진을 변경하려면 기존 사진을 삭제 후 다시 등록해주세요.`

> ⚠️ **안내 2번은 "이름과 관계"라고 하는데 V9의 라벨은 `이름 및 별칭`·`비고`다.**
> 용어가 3가지로 갈린다(관계/별칭/비고). → `deferred.md` 「오타·표기」

## 실패 사유

```js
registCauseMessage = computed(() => {
  if (face.faceRecogStatus !== 'REJECT') return ''
  return (
    FACE_RECOG_REGIST_CAUSE_MESSAGE[face.registCause] ??
    FACE_RECOG_REGIST_CAUSE_MESSAGE.ExceptionOccurred
  )
})
```

**REJECT일 때만 노출.** 미정의 코드는 `ExceptionOccurred` 문구로 fallback (§3-3).
**`v-else-if`로 PENDING 안내와 배타적**이다 — 실패 박스가 있으면 대기 안내는 안 뜬다.

## 삭제 모달 (자체 구현)

| 요소     | 클래스 (원문)                                                                                                                                                      |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 딤       | `fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 px-4`                                                                                         |
| 컨테이너 | `w-[320px] overflow-hidden rounded-xl bg-defaults-primary-background-primary shadow-[0px_20px_24px_-4px_rgba(16,24,40,0.08),0px_8px_8px_-4px_rgba(16,24,40,0.03)]` |
| 제목     | `text-defaults-primary-text-primary pretendard-18SemiBold` → `얼굴 등록 정보 삭제`                                                                                 |
| 본문     | `text-defaults-foreground-text-gray-600 pretendard-16Regular` → `{이름}님의 얼굴 등록정보를 삭제하시겠어요?` `<br/>` `삭제 후 복구가 불가능합니다.`                |
| 취소     | `flex flex-1 … rounded-lg border border-defaults-secondary-border-secondary bg-defaults-primary-background-primary px-[18px] py-3 shadow-[…]`                      |
| 삭제     | `flex flex-1 … rounded-lg bg-alerts-error-background-error px-[18px] py-3 shadow-[…] disabled:opacity-50`                                                          |
| 스페이서 | `<div class="h-5" />`                                                                                                                                              |

> ⚠️ **`ModalButton`을 쓰지 않고 직접 만들었다.** V4의 삭제(모달 없음)와도 다르다.
> **한 도메인에 삭제 확인 방식이 3가지**(V4 없음 · V8 자체 모달 · 다른 도메인 `ModalButton`).
> → `deferred.md` 「구조 개선」. **이관 시 그대로**(픽셀이 다르다)

**API**: `deleteLobbyPhoneFaceRecog` — `DELETE /apartmant/{aptResidentUuid}/lobby-phone/face-recog`
**body에 `{ faceRecogGuid }`를 담는다** (`auth.delete(url, { data: {...} })`).

> ⚠️ **DELETE에 body를 싣는다.** `endpoints.md`에 기록된 `#123`과 같은 패턴이다.
> axios `data` 옵션이 필요하다 — 타깃 `apiClient`도 지원해야 한다.

**성공**: `removeQueries([상세키])`(v4) + `invalidateQueries([목록키])`(v4)

- `navigateTo('/visit/lobbyPhone/faceRegisterManagement')` + 토스트 `삭제되었습니다`

**에러**: `FACE_RECOG_ERROR_MESSAGE[code] ?? '얼굴인식 정보 삭제에 실패하였습니다.'`

**조회 실패**: 모달 후 `callback: () => navigateTo('…/faceRegisterManagement')`

## QA 체크리스트

- [ ] `COMPLETE` — 칩만, 안내 박스 없음
- [ ] `PENDING` — 주황 대기 안내
- [ ] `REJECT` — 빨간 실패 사유 (`registCause`별 문구)
- [ ] 알 수 없는 `registCause` → `등록 중 오류가 발생했습니다. …`
- [ ] 삭제 모달에 이름이 들어가는가
- [ ] 삭제 → 목록으로 이동 + 토스트
- [ ] 조회 실패 → 모달 후 목록으로

---

# V9. 안면인식 정보 수정 — `/visit/lobbyPhone/faceRegister/edit/:id`

`FaceRegister/FaceRegisterEditView.vue` (90줄)

| 요소      | 클래스 (원문)                                                                                                                                                                                                                                                                                           |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 루트      | `flex h-full w-full flex-col bg-defaults-primary-background-primary`                                                                                                                                                                                                                                    |
| 콘텐츠    | `flex flex-1 flex-col gap-5 overflow-auto px-5 py-6`                                                                                                                                                                                                                                                    |
| 필드      | `flex flex-col gap-1.5`                                                                                                                                                                                                                                                                                 |
| 라벨      | `text-[#364152] pretendard-14Medium` → `이름 및 별칭` / `비고`                                                                                                                                                                                                                                          |
| 입력      | `w-full rounded-lg border border-defaults-secondary-border-secondary bg-defaults-primary-background-primary px-3.5 py-3 text-defaults-primary-text-primary shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] pretendard-16Regular placeholder:text-[#9aa4b2]` (`maxlength=10`, placeholder `10자 이내 입력`) |
| 버튼 영역 | `px-4 pb-3 pt-2`                                                                                                                                                                                                                                                                                        |
| 저장 버튼 | `flex h-14 w-full items-center justify-center rounded-lg bg-brand-default-background-brand shadow-[…] disabled:opacity-50` → `저장`                                                                                                                                                                     |

**초기값**: `watch(face, …, { immediate: true })` → `name = residentFaceName ?? ''`, `memo = faceRecogDescription ?? ''`

> 🔴 **검증이 없다.** 이름을 비워도 `저장`이 눌리고 요청이 나간다.
> V10(신규 등록)은 `isFormValid`로 막는데 **수정은 안 막는다.** **비대칭.**
> → `deferred.md` 「동작 의심」. **이관 시 그대로**
>
> ⚠️ **`disabled`는 `isFaceRecogPutPending`만 본다.**
> ⚠️ **`v-if="!isFaceRecogDetailLoading && face"`로 감싸 로딩 중에는 아무것도 안 보인다.**
> 스켈레톤도 스피너도 없다 — **빈 화면.**

**API**: `putLobbyPhoneFaceRecog` — `PUT /apartmant/{aptResidentUuid}/lobby-phone/face-recog`
body `{ faceRecogGuid, faceRecogName, faceRecogDescription }`

**성공**: `navigateTo('…/detail/{guid}')` + 토스트 `등록 정보가 변경되었습니다.`
**무효화 없음** — 상세는 `staleTime: 0`이라 재조회되지만 **목록(V7)은 다녀와야 갱신된다.**

**에러**: `FACE_RECOG_ERROR_MESSAGE[code] ?? '얼굴인식 정보 수정에 실패하였습니다.'`

## QA 체크리스트

- [ ] 기존 이름·비고가 채워지는가
- [ ] 로딩 중 **빈 화면**인가 (레거시와 동일)
- [ ] 이름을 비우고 저장이 **되는가** (레거시와 동일)
- [ ] 저장 후 상세로 이동 + 토스트
- [ ] 목록으로 돌아가면 변경이 반영되는가

---

# V10~V13. 얼굴 신규 등록 위저드

**V10(정보 입력) → V11(가이드 + 촬영) → V13(완료) / V12(실패)**

## V10. 정보 입력 — `/visit/lobbyPhone/faceRegister/form` (85줄)

| 요소      | 클래스 (원문)                                                                                                    |
| --------- | ---------------------------------------------------------------------------------------------------------------- |
| 루트      | `flex h-full w-full flex-col bg-defaults-primary-background-primary`                                             |
| 콘텐츠    | `flex flex-1 flex-col gap-8 overflow-auto px-5 py-6`                                                             |
| 상단 라벨 | `text-brand-default-text-brand pretendard-16SemiBold` → `얼굴 정보`                                              |
| 상단 제목 | `text-defaults-primary-text-primary pretendard-24Bold` → `등록할 얼굴의` / `정보를 입력해주세요.`                |
| 필드 그룹 | `flex flex-col gap-5`                                                                                            |
| 입력      | V9와 **동일 클래스** (`maxlength=10`, `10자 이내 입력`)                                                          |
| 다음 버튼 | `flex h-14 w-full … bg-brand-default-background-brand shadow-[…]` + `isFormValid ? 'opacity-100' : 'opacity-40'` |

**검증**: `isFormValid = name.trim().length > 0` — **이름만 필수**, 비고는 선택.

**이동**: `navigateTo({ path: '…/guide', query: { name, memo } })` — **쿼리스트링** (§4-3)

## V11. 촬영 가이드 — `/visit/lobbyPhone/faceRegister/guide` (112줄)

| 요소        | 클래스 (원문)                                                                                                 |
| ----------- | ------------------------------------------------------------------------------------------------------------- |
| 상단 라벨   | `text-brand-default-text-brand pretendard-16SemiBold` → `얼굴 촬영 안내`                                      |
| 상단 제목   | `text-defaults-primary-text-primary pretendard-24Bold` → `정확한 얼굴 촬영을 위해` / `가이드를 참고해주세요.` |
| 가이드 블록 | `flex flex-col gap-[7px]`                                                                                     |
| 가이드 제목 | `text-defaults-primary-text-primary pretendard-18SemiBold` → `{n}. {title}`                                   |
| 예시 행     | `flex gap-2` + 이미지 각 `min-w-0 flex-1`                                                                     |

**가이드 4개** (`guideItems`):

| #   | 제목                                             | 이미지                                          |
| --- | ------------------------------------------------ | ----------------------------------------------- |
| 1   | `정면을 바라봐주세요.`                           | `face-guide/guide1-good.svg` / `guide1-bad.svg` |
| 2   | `웃거나 찡그리지 마세요.`                        | `guide2-good/bad.svg`                           |
| 3   | `눈썹, 광대, 볼을 보여주세요.`                   | `guide3-good/bad.svg`                           |
| 4   | `모자, 마스크 등 얼굴을 가리는 것은 벗어주세요.` | `guide4-good/bad.svg`                           |

**alt**: `가이드 {n} 올바른 예시` / `가이드 {n} 잘못된 예시`

**촬영 흐름**:

```js
handleNext() → nativeOpenFaceCamera()        // Web→App OPEN_FACE_CAMERA
// 앱이 카메라 열고 촬영 → window.CALLBACK_FACE_IMAGE({ image })
handleFaceImage({ image }):
  const { name, memo } = getQueryString();                    // ← 쿼리스트링에서 복원
  const faceRecogFile = base64ToFile(image, `face_${Date.now()}`);
  postFaceRecogMutation({ faceRecogName: name, faceRecogDescription: memo, faceRecogFile });

onMounted:   emitter.on(CALLBACK_FACE_IMAGE, handleFaceImage);
onUnmounted: emitter.off(CALLBACK_FACE_IMAGE, handleFaceImage);   // ← 제대로 해제한다
```

> ✅ **V11·V12는 리스너를 제대로 해제한다.** §4-1의 SIP 상태와 대조적.
>
> ⚠️ **촬영 취소 시 아무 일도 일어나지 않는다** (§2). 버튼은 `isFaceRecogPostPending`만
> `disabled`로 보므로 **취소 후에도 다시 누를 수 있다.** 의도된 동작.

## V12. 등록 실패 — `/visit/lobbyPhone/faceRegister/fail` (89줄)

| 요소    | 클래스 (원문)                                                                                                                            |
| ------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| 콘텐츠  | `flex flex-1 flex-col items-center justify-center gap-4 p-5`                                                                             |
| 아이콘  | `uim-exclamation-circle.svg` alt `실패 아이콘` `h-12 w-12`                                                                               |
| 제목    | `text-defaults-primary-text-primary pretendard-20Bold` → `얼굴 등록 요청에 실패하였습니다.`                                              |
| 사유    | `whitespace-pre-line text-center text-defaults-tertiary-text-tertiary pretendard-14Regular`                                              |
| 버튼 행 | `flex gap-3 px-4 pb-3 pt-2`                                                                                                              |
| 홈으로  | `flex h-14 flex-1 … border border-defaults-secondary-border-secondary bg-defaults-primary-background-primary shadow-[…]` → `홈으로 이동` |
| 재시도  | `flex h-14 flex-1 … bg-brand-default-background-brand shadow-[…] disabled:opacity-50` → `재시도`                                         |

**상태 복원**: `window.history?.state?.{name, memo, reason}` (§4-3)
**재시도**: `nativeOpenFaceCamera()` → 같은 `CALLBACK_FACE_IMAGE` 핸들러로 재등록
**홈으로**: `navigateTo('/main')` — **목록(V7)이 아니라 메인으로 간다**

> ⚠️ **`hasBackButton:false`인데 `홈으로 이동`이 `/main`이다.** V13은 목록으로 간다. **비대칭.**
> → `[확인 필요]` V-Q9

## V13. 등록 완료 — `/visit/lobbyPhone/faceRegister/complete` (47줄)

| 요소   | 클래스 (원문)                                                                                                                                                               |
| ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 아이콘 | `UimCheckCircle.svg` alt `완료 아이콘` `h-12 w-12`                                                                                                                          |
| 제목   | `text-defaults-primary-text-primary pretendard-20Bold` → `안면인식 얼굴 등록 요청이 완료되었습니다.`                                                                        |
| 안내   | `whitespace-pre-line text-center text-defaults-tertiary-text-tertiary pretendard-14Regular` → `등록 승인 및 로비폰 배포까지는 최대 10분이 소요됩니다. 잠시만 기다려주세요.` |
| 버튼   | `flex h-14 w-full … bg-brand-default-background-brand shadow-[…]` → `얼굴 등록 내역 확인`                                                                                   |

**이동**: `navigateTo({ path: '/visit/lobbyPhone/faceRegisterManagement' })` → V7

## 등록 API

**`postLobbyPhoneFaceRecog`** — `POST /apartmant/{aptResidentUuid}/lobby-phone/face-recog`
**multipart/form-data**:

```
faceRecogName        (필수)
faceRecogDescription (있을 때만 append)
faceRecogFile        (필수, File)
```

> ⚠️ **`Content-Type` 헤더를 명시하지 않는다.** axios가 `FormData`를 보고 자동 설정한다.
> 게시판(`board.md`)은 명시한다. **비대칭이지만 결과는 같다.**
>
> ⚠️ **`onUploadProgress`가 없다.** 게시판·주차의 업로드는 진행률을 보여주는데
> 얼굴 사진은 안 보여준다. 버튼 `disabled`만 걸린다.

**성공**: `invalidateQueries([목록키])`(v4) + `navigateTo('…/complete')`
**실패**: `navigateTo({ path: '…/fail', state: { name, memo, reason: FACE_RECOG_ERROR_MESSAGE[code] ?? message } })`

> **에러 모달을 띄우지 않고 전용 실패 화면으로 보낸다.** 이 도메인만의 패턴.

## QA 체크리스트

- [ ] V10에서 이름 없이 `다음`이 **안 눌리는가** (`opacity-40`)
- [ ] V10 → V11 이동 시 **URL에 이름·비고가 노출되는가** (레거시와 동일)
- [ ] V11 `다음` → 실기기에서 카메라가 열리는가
- [ ] 카메라에서 **취소하면 화면이 그대로인가** (스피너가 남지 않는가)
- [ ] 촬영 성공 → V13 완료 화면
- [ ] 촬영 실패(서버 거부) → V12 + 사유 문구
- [ ] V12 `재시도` → 카메라 재오픈, 이름이 유지되는가
- [ ] **V12에서 새로고침 후 재시도 시 이름이 비는가** (레거시와 동일)
- [ ] V13 `얼굴 등록 내역 확인` → V7, 새 항목이 `등록대기`로 보이는가
- [ ] V12·V13에서 **네이티브 뒤로가기가 위저드 중간으로 돌아가는가** (레거시와 동일)
- [ ] 가이드 이미지 8장이 모두 로드되는가

---

# 이관 지침 요약

## 타깃 슬라이스 구조 (제안)

```
src/features/visit/
├── api/
│   ├── kiosk.ts          # 2개
│   ├── lobbyPhone.ts     # 9개 (로그아웃·탈퇴용 2개 포함)
│   └── faceRegister.ts   # 5개
├── queries/
├── components/
│   ├── PasswordChangeModal.tsx      # V2·V3 공용
│   ├── list/       (LobbyPhoneItem · KioskItem)
│   ├── kiosk/      (PasswordCheckModal)
│   ├── lobbyPhone/ (SipState · GuardCall · Password · NavItem · QrCode)
│   └── faceRegister/ (NoticeBottomSheet · StatusChip)
├── pages/            # 13개 화면
├── constants/  (kiosk.ts · lobbyPhone.ts · faceRecog.ts)
├── schemas/tempPassword.ts
├── types/
└── index.ts          # putLobbyPhoneResidentLogout · deleteLobbyPhoneResidentDeletion 공개
```

**`shared`로 올릴 것**: `base64ToFile` · `copyValue`
**Phase 4 브릿지에 포함**: `nativeGetLobbyPhoneSipState` · `nativeCallLobbyPhoneGuard` ·
`nativeSendLobbyPhoneQrInfo` · `nativeOpenFaceCamera` + 콜백 2종

**`features/mypage/`로 옮길 것**: `useGetLobbyPhonePushAlarmState` ·
`usePatchLobbyPhonePushAlarmState` (`useAlarmSetting`만 사용)

## 이관 순서 — 3개 PR

| PR  | 범위                                   | 선행 조건                                     |
| --- | -------------------------------------- | --------------------------------------------- |
| 1   | V1 · V2 · V3 (허브·키오스크·로비폰 셸) | **Phase 4 브릿지 재작성 완료** (SIP·경비호출) |
| 2   | V4 · V5 · V6 (임시비밀번호·QR)         | PR 1 + `qrcode`·`html2canvas` 승인            |
| 3   | V7~V13 (안면인식 위저드)               | PR 1 (`OPEN_FACE_CAMERA` 왕복 검증 필수)      |

**PR 3은 실기기 없이는 검증이 불가능하다** — 카메라 왕복이 전부다.

## 반드시 지켜야 할 것

| #   | 항목                                                                                          |
| --- | --------------------------------------------------------------------------------------------- |
| 1   | **`window.CALLBACK_*` 전역 함수 수신 방식**을 그대로 (`native-protocol.md` §0)                |
| 2   | 촬영 **취소 시 무신호**를 전제로 설계 — 로딩 오버레이를 띄우지 않는다                         |
| 3   | `invalidateQueries`/`removeQueries` **5곳**을 객체 시그니처로. 키 내용은 그대로               |
| 4   | 얼굴등록 위저드의 상태 전달 2가지(쿼리스트링·`location.state`)를 그대로                       |
| 5   | V4 삭제에 **확인 모달을 추가하지 않는다**                                                     |
| 6   | V8 삭제 모달을 `ModalButton`으로 **바꾸지 않는다** (픽셀이 다르다)                            |
| 7   | V9에 **검증을 추가하지 않는다**                                                               |
| 8   | V5 생성 후 이동은 `navigate(..., { replace: true })` — `setTimeout` 해킹은 재현 불필요 (V-Q7) |
| 9   | 비밀번호 4칸 입력의 **백스페이스·붙여넣기 미지원**을 그대로                                   |
| 10  | `ChipBase`의 `variant` 기본값이 `'fill'`임을 전제로 (V7·V8은 `variant` 미지정)                |
| 11  | DELETE에 body를 싣는 `deleteLobbyPhoneFaceRecog` 지원                                         |
| 12  | `zod` 3→4: `tempPasswordFormSchema`는 `required_error` 미사용 — **변환 불필요**               |

## 삭제할 것 (등가 영향 없음)

- `VisitLobbyPhoneQrCode`의 빈 `onMounted(async () => {})`
- `VisitListKioskItem`의 `bg-deep-blue` (미생성, 뒤 클래스가 이김)
- `useGetFaceRecogList`의 미사용 `refetchFaceRecogList` 반환

## 스타일 수정 (`broken-styles.md` 연동)

| 클래스          | 위치                 | 조치                                         |
| --------------- | -------------------- | -------------------------------------------- |
| `bg-deep-blue`  | `VisitListKioskItem` | **삭제** (§4 — 효과 없는 죽은 선언)          |
| `w-4.75 h-4.75` | `VisitListKioskItem` | `w-[19px] h-[19px]` (§3 — **크기가 바뀐다**) |

---

# 확인 필요 항목

| #    | 질문                                                                                              | 성격       | 진행 차단 |
| ---- | ------------------------------------------------------------------------------------------------- | ---------- | --------- |
| V-Q1 | QR·푸시 훅이 `'로비폰'`을 `.trim()` 없이 비교한다. 서버 값에 공백이 섞이는가 (§3-1)               | 서버 확인  | 아니오    |
| V-Q2 | `putLobbyPhoneResidentLogout`·`deleteLobbyPhoneResidentDeletion`을 `shared`로 올릴지 (§3-5)       | **결정**   | 아니오    |
| V-Q3 | SIP 리스너의 경로 검사를 타깃에서도 남길지 (§4-1) — `useEffect` cleanup이면 불필요                | **결정**   | 아니오    |
| V-Q4 | 비밀번호 4칸의 `:key`를 인덱스로 바꿔도 되는지 (§4-5) — 중복 숫자에서 레거시가 깨지는지 확인      | 확인       | 아니오    |
| V-Q5 | 로비폰 세대비밀번호 변경에 `NOT_HEAD_AUTHORITY` 분기가 없다. 서버가 세대원을 막는가 (§V3)         | 서버 확인  | 아니오    |
| V-Q6 | 임시비밀번호 `1일` 선택 시 종료일이 내일이다. 서버의 기간 해석이 맞는가 (§V5)                     | 서버 확인  | 아니오    |
| V-Q7 | V5 생성 후 `history.go(-1)` + `setTimeout` 이동의 **실제 히스토리 스택** (§V5)                    | **실기기** | 아니오    |
| V-Q8 | QR 공유 이미지가 **카드 전체**여야 하는가, QR만이어도 되는가 (§V6) — `html2canvas` 제거 가능 여부 | 앱 확인    | 아니오    |
| V-Q9 | V12 `홈으로 이동`이 `/main`, V13은 목록. 의도된 비대칭인가 (§V12)                                 | 확인       | 아니오    |

**진행을 막는 항목은 없다.** 단 **Phase 4의 네이티브 브릿지 재작성이 이 도메인의 선행 조건**이다.

---

# 도메인 QA 체크리스트 (통합)

## 네이티브 연동 (실기기 필수)

- [ ] `GET_LOBBYPHONE_SIP_STATE` → `CALLBACK_LOBBYPHONE_SIP_STATE` 왕복 (iOS/Android)
- [ ] `CALL_LOBBYPHONE_GUARD` → 경비 통화 연결
- [ ] `SEND_LOBBYPHONE_QR_INFO` → 공유 시트, 이미지 내용 확인
- [ ] `OPEN_FACE_CAMERA` → `CALLBACK_FACE_IMAGE` 왕복 (성공)
- [ ] `OPEN_FACE_CAMERA` → **취소** (콜백 없음, 화면 유지)
- [ ] `CALLBACK_GO_BACK`의 Visit 3개 경로 분기

## 크로스 도메인

- [ ] 메인 카드 → V1
- [ ] 메인 메뉴 → V3
- [ ] V3 설정 아이콘 → 마이페이지 알림 설정
- [ ] 로그아웃 시 `putLobbyPhoneResidentLogout` 호출 (`auth.md` A7)
- [ ] 회원탈퇴 시 `deleteLobbyPhoneResidentDeletion` 호출 (`mypage.md` P8)

## 등가 대조 (레거시 :3000 ↔ 신규 :5173, 392px)

- [ ] V1 카드 2종 (남색 `#00063F` / 흰색 + 배경 그림 `opacity-0.11`)
- [ ] V3 SIP 배너 색과 칩 3종
- [ ] V4 유형 배지 색 (일회용 회색 / 기간형 파랑)
- [ ] V5 탭 선택 상태 (흰 배경 + 그림자)
- [ ] V6 QR 246×246 + 카드 여백
- [ ] V7 상태 칩 3종 + 초과 경고 배너
- [ ] V8 실패/대기 박스 색
- [ ] 얼굴등록 위저드 4개 화면의 버튼 높이 `h-14`
- [ ] 폰트 배율 5단계

## 회귀 위험 지점

- [ ] 브릿지 재작성 후 콜백 2종이 정상 수신되는지
- [ ] V3 반복 진입 시 SIP 리스너가 쌓이지 않는지 (타깃에서는 해결됨)
- [ ] `invalidateQueries` v5 전환 후 얼굴 목록·임시비밀번호 목록이 즉시 갱신되는지
- [ ] `html2canvas` 캡처 결과가 레거시와 동일한지
