# 도메인 명세 — 인증 (auth)

> 기준 SHA `6d5bf22` · 레거시 `views/IntroView/`(2) + `views/LoginView/`(5) + `views/MyPageView/MypageLogoutView.vue`
> 타깃 슬라이스 `features/auth/`
> 관련 결정: `decisions/auth-strategy.md` (레거시 인증 방식 그대로 유지)

## 화면 목록

| #   | 경로                         | name                     | 컴포넌트                                    | 진입 경로                            | 인증               |
| --- | ---------------------------- | ------------------------ | ------------------------------------------- | ------------------------------------ | ------------------ |
| A1  | `/intro`                     | 인트로                   | `IntroView/IntroView.vue` + `IntroForm.vue` | 앱 최초 진입, 로그아웃, 가드 실패    | 불필요             |
| A2  | `/password/cert`             | 비밀번호 휴대폰 인증     | `LoginView/PasswordPhoneCertView.vue`       | A1 "비밀번호를 잊어버리셨나요?"      | 불필요             |
| A3  | `/password/reset`            | 비밀번호 재설정          | `LoginView/PasswordResetView.vue`           | A2 인증 성공 (**state로 토큰 전달**) | 불필요             |
| A4  | `/login/pending`             | 로그인 미승인 상태       | `LoginView/LoginPendingCheckView.vue`       | 로그인 시 `RESIDENT_NOT_APPROVED`    | 불필요             |
| A5  | `/versionOne/terms`          | 버전1 이용약관 동의      | `LoginView/VersionOneTermsView.vue`         | 로그인 성공 + `oldResidentFlag`      | **토큰 보유 상태** |
| A6  | `/versionOne/terms/response` | 버전1 본인인증 결과 수신 | `LoginView/VersionOneCertResponseView.vue`  | A5 본인인증(KMC) 콜백                | 〃                 |
| A7  | `/logout`                    | 로그아웃                 | `MyPageView/MypageLogoutView.vue`           | 마이페이지                           | 필요               |

> A7은 레거시에서 `MyPageView/`에 있지만 **기능상 auth**다. 타깃에서는 `features/auth/`로 옮긴다.
> 라우트 경로 `/logout`은 그대로 유지한다.

**공통 meta**: A1·A4·A6은 `showAppBar:false`, A2·A3·A5는 `showAppBar:true`.
전부 `showBottomNav:false`. 상세는 `routes.md` §3-1, §3-3.

---

## A1. 인트로 (로그인 화면)

경로 `/intro`. **앱의 실질적 진입점이자 로그인 화면이다.** 별도 `/login` 경로는 없다.

### 화면 구성

```
┌─────────────────────────────┐
│  배경: aptmantIntro.svg      │  absolute, -z-10, object-cover, 전체
│  ┌───────────────────────┐  │
│  │   아파트먼트 로고       │  │  flex-1, min-h-[200px], 중앙 정렬
│  │   aptmantLogoLong.png │  │  w-60
│  └───────────────────────┘  │
│  ┌───────────────────────┐  │  flex-1, bg-base-b-white
│  │  [휴대폰 번호 입력]     │  │  IntroForm
│  │  [비밀번호 입력]        │  │
│  │  [   로그인   ]        │  │
│  │                       │  │
│  │  비밀번호를 잊어버리셨나요? │  gap-14, pb-10
│  │  아직 회원이 아니신가요? 회원가입 │
│  └───────────────────────┘  │
└─────────────────────────────┘
```

| 요소            | 클래스 (원문)                                                                         |
| --------------- | ------------------------------------------------------------------------------------- |
| 루트            | `relative flex h-full w-full flex-col overflow-y-auto`                                |
| 배경 이미지     | `absolute left-0 top-0 -z-10 h-full w-full object-cover`                              |
| 로고 영역       | `flex min-h-[200px] flex-1 items-center justify-center`                               |
| 로고            | `w-60`                                                                                |
| 하단 영역       | `flex flex-1 flex-col bg-base-b-white`                                                |
| 링크 영역       | `flex flex-1 flex-col items-center justify-between gap-14 pb-10`                      |
| 비밀번호 찾기   | `flex items-center text-navy-default-text-navy pretendard-16SemiBold`                 |
| 회원가입 안내   | `flex items-center gap-2 text-defaults-secondary-text-secondary pretendard-16Regular` |
| "회원가입" 강조 | `text-navy-default-text-navy pretendard-16SemiBold`                                   |

### 고정 문구 (원문 그대로)

| 위치                 | 문구                                   |
| -------------------- | -------------------------------------- |
| 배경 이미지 alt      | `아파트먼트 인트로 이미지`             |
| 로고 alt             | `아파트먼트 로고`                      |
| 아이디 placeholder   | `휴대폰 번호(- 없이 숫자만 입력)`      |
| 비밀번호 placeholder | `비밀번호`                             |
| 제출 버튼            | `로그인`                               |
| 링크 1               | `비밀번호를 잊어버리셨나요?`           |
| 링크 2               | `아직 회원이 아니신가요?` + `회원가입` |

### 동작

| 시점        | 동작                                                                |
| ----------- | ------------------------------------------------------------------- |
| **마운트**  | `authStore.clearAuth()` — **인트로 진입 시 인증 정보를 초기화한다** |
| 링크 1 클릭 | `/password/cert`로 이동                                             |
| 링크 2 클릭 | `/signup/terms`로 이동                                              |
| 제출        | `patchLoginMutation({ id, password })`                              |
| 제출 중     | 버튼 `disabled`, 라벨 자리에 `SpinnerCircle`                        |
| 폼 유효성   | 버튼 색상이 `meta.valid ? 'brand' : 'defaults-secondary'`로 바뀐다  |

> `deleteLocalInfo()` 호출이 **주석 처리**되어 있고 `clearAuth()`만 남아 있다 (`IntroView.vue:21-23`).
> 그대로 재현한다.

### 폼

`schemas/auth.js` `introLoginFormSchema`

| 필드     | id/name    | 타입                  | 검증                                                                                               |
| -------- | ---------- | --------------------- | -------------------------------------------------------------------------------------------------- |
| 아이디   | `id`       | `tel`, `maxlength=13` | `common.js`의 `id` = **`phone`** — `PHONE_REGEX` + `.max(13)`, 필수 메시지 `휴대폰을 입력해주세요` |
| 비밀번호 | `password` | password              | `.min(1)` — 메시지 `비밀번호를 입력해주세요`. **비밀번호 복잡도 검증 없음**                        |

> ⚠️ **로그인 아이디 = 휴대폰 번호**다 (`common.js:108` `export const id = phone`).
> 비밀번호에 `PASSWORD_REGEX`를 적용하지 않는 이유는 코드 주석에 명시돼 있다 —
> **"버전1 회원 로그인도 가능하도록"** (`schemas/auth.js:10`).
> 구버전 비밀번호 규칙을 쓰는 사용자가 로그인할 수 있어야 한다. **완화하면 안 되고 강화해서도 안 된다.**

에러는 각 입력 아래 `TextError`로 표시. 비밀번호 에러는 `mt-[6px]`.

---

## A1-2. 로그인 뮤테이션 — `usePatchLogin`

**이 도메인에서 가장 복잡한 로직이다.** 수동 로그인과 자동 로그인(토큰 만료 복구)이 같은 뮤테이션을 공유한다.

### 성공 경로

```
1. authStore.setUserAuthInfo({ id, password })      ← ⚠️ 평문 저장 (자동 로그인용)
2. postLogin({ id: cleanPhoneHyphen(id), password }) ← 하이픈 제거 후 전송
3. 수동 로그인이면 → setShouldRedirectAfterLogin(true)
4. 토큰 추출:
     accessToken  ← response.headers.authorization
     refreshToken ← response.headers['refresh-token']
   authStore.setAuth(accessToken, refreshToken)
5. 자동 로그인이면 → setAutoLoginInProgress(false)   ← 토큰 저장 후에 실행 (순서 중요)
6. response.data.success.oldResidentFlag && 수동 → /versionOne/terms 로 이동하고 종료
7. await loginDataHandler()
8. 수동 로그인 && shouldRedirectAfterLogin → /main
9. setShouldRedirectAfterLogin(true)                 ← 다음 로그인을 위해 항상 복원
```

> **5번의 순서가 코드에 주석으로 강조돼 있다** (`usePatchLogin.js:48` `중요!`).
> 토큰을 저장하기 전에 `isAutoLoginInProgress`를 내리면 `apiClient`의 대기 요청 큐가
> 토큰 없이 드레인된다. **이관 시 순서를 지켜야 한다.**

### 자동 로그인 판별

`authStore.isAutoLoginInProgress`가 `true`면 자동 로그인. 이 플래그는 `apiClient`의
토큰 재발급 실패 시 세워진다 (`tech-mapping.md` §2-1).

### 에러 경로

**자동 로그인 실패면** — 에러코드와 무관하게:

```
setAutoLoginInProgress(false)
console.log('자동로그인 실패, 로그아웃 처리:', errorCode)
onLogout('/')
```

**수동 로그인이면** 에러코드별 분기:

| errorCode                                                   | 동작                                                                  |
| ----------------------------------------------------------- | --------------------------------------------------------------------- |
| `RESIDENT_NOT_FOUND` · `INVALID_PASSWORD` · `APT_NOT_FOUND` | 모달 `아이디 또는 비밀번호가 일치하지 않습니다.`                      |
| `HOUSEHOLD_NOT_FOUND`                                       | 모달 `존재하지 않는 세대입니다.`                                      |
| `RESIDENT_NOT_APPROVED`                                     | `fetchWaitingMemberInfo(variables)` 호출 후 `/login/pending`으로 이동 |
| 그 외                                                       | 모달에 서버 `message` 그대로                                          |

> ⚠️ **세 가지 서로 다른 에러코드가 같은 문구로 합쳐진다.** 보안상 의도된 설계다(계정 존재 여부 노출 방지).
> 이관 시 분리하지 않는다.

### `loginDataHandler` (`useLoginData`)

로그인 후 부트스트랩. **A5(버전1)에서도 호출된다.**

```
Promise.all([ getLoginInfo(), getResidentAptList() ])
  ↓
residentAptList에서 aptResidentUuid === loginInfo.uuid 인 항목을 찾아 aptUuid 확보
  ↓
authStore.setAptInfo({
  aptResidentUuid, aptName, aptUuid, aptId,
  residentName, residentNickName, communityToken, aptLogoFileUrl
})
  ↓
contentList에서 name.trim() === 'A-PASS' / '로비폰' 판정
  ↓
nativeSendInitialResidentInfo({ ...6필드 })
```

| 매핑               | 출처                                            |
| ------------------ | ----------------------------------------------- |
| `aptResidentUuid`  | `loginInfo.data.success.uuid`                   |
| `aptName`          | `loginInfo.data.success.aptName`                |
| `aptUuid`          | **`residentAptList`에서 찾은 항목의 `aptUuid`** |
| `aptId`            | `loginInfo.data.success.aptId`                  |
| `residentName`     | `.name`                                         |
| `residentNickName` | `.nickName`                                     |
| `communityToken`   | **`.oldApartmantToken`** (이름 불일치)          |
| `aptLogoFileUrl`   | `.aptLogoFileUrl`                               |

> ⚠️ **`aptInfo`가 여기서 만들어진다.** 쿼리 키 56개 중 34개가 이 값에 의존한다
> (`query-keys.md` §4-1). Phase 4-2의 "아파트 컨텍스트 배치" 결정이 이 구조를 따라야 한다.
> ⚠️ 실패해도 **`console.error`만 하고 삼킨다.** 사용자에게 알리지 않는다. 그대로 재현.
> ⚠️ `'로비폰'` 판정에 `.trim()`이 붙어 있다 — 서버 데이터에 공백이 섞여 있다.

---

## A2. 비밀번호 휴대폰 인증

경로 `/password/cert`. AppBar 있음, **제목은 빈 문자열**(`appBarTitle: ''`).

### 화면 구성

2단 폼이다. 인증번호 전송 전후로 화면이 바뀐다.

```
[전송 전]                          [전송 후]
비밀번호 재설정을 위해              비밀번호 재설정을 위해
인증할게요                          인증할게요

휴대폰 번호                         휴대폰 번호
[숫자만 입력      ]                 [숫자만 입력      ] (disabled)
[  인증번호 전송  ]
                                   인증번호
                                   [인증번호 입력  02:59]  ← 타이머
                                   [    재요청    ]

                        [    완료    ]  ← 하단 고정
```

| 요소        | 클래스 (원문)                                                                      |
| ----------- | ---------------------------------------------------------------------------------- |
| 루트        | `flex h-full w-full flex-col justify-between gap-3 overflow-auto p-5`              |
| 라벨        | `text-defaults-primary-text-primary pretendard-15SemiBold`                         |
| 휴대폰 입력 | `class-custom="mt-4 mb-2"`                                                         |
| 타이머      | `absolute right-3 top-1/2 -translate-y-1/2 text-yellow-500 pretendard-15SemiBold`  |
| 재요청 버튼 | `custom-class="mt-2 mb-6"`, `has-outline`, `round-type="rounded"`, `color="brand"` |
| 완료 버튼   | `size="xl"`, `class="w-full"`, `:has-outline="!verificationMeta.valid"`            |

### 고정 문구

| 위치          | 문구                                                           |
| ------------- | -------------------------------------------------------------- |
| 제목          | `비밀번호 재설정을 위해` `\n` `인증할게요` (`<br />`로 줄바꿈) |
| 라벨 1        | `휴대폰 번호`                                                  |
| placeholder 1 | `숫자만 입력`                                                  |
| 버튼 1        | `인증번호 전송`                                                |
| 라벨 2        | `인증번호`                                                     |
| placeholder 2 | `인증번호 입력` (maxlength 6)                                  |
| 버튼 2        | `재요청`                                                       |
| 버튼 3        | `완료`                                                         |

### 동작

| 시점                | 동작                                                                           |
| ------------------- | ------------------------------------------------------------------------------ |
| 마운트              | `setSignUpInfo({})` — 가입 위저드 스토어 초기화                                |
| 인증번호 전송       | `postPasswordResetSendCodeMutation({ noHyphenPhone })`                         |
| 전송 성공 (`watch`) | `startTimer()` + `hasSentCode = true`                                          |
| 타이머              | **180초(3분)**부터 1초씩 감소. `MM:SS` 형식 (`padStart(2,'0')`)                |
| 타이머 만료         | `clearInterval` + `timerActive = false` + **`/`로 이동**                       |
| 언마운트            | `clearInterval`                                                                |
| 재요청 클릭         | `event.preventDefault()` 후 재전송, `resendCodeValue = false`                  |
| 완료                | `postPasswordResetCodeVerifyMutation({ verificationCode, noHyphenPhone })`     |
| 인증 성공 (`watch`) | 응답 헤더 `authorization`을 토큰으로 꺼내 `/password/reset`으로 **state 전달** |

state 전달 형태:

```js
navigateTo({
  path: '/password/reset',
  state: { verifiedToken: token, pageTitle: '비밀번호 재설정' },
})
```

### 폼 2개

| 폼                     | 스키마                                 | 필드                                                             |
| ---------------------- | -------------------------------------- | ---------------------------------------------------------------- |
| `passwordResetForm`    | `resident.js` `passwordResetSchema`    | `noHyphenPhone` — `PHONE_CUSTOM_REGEX`(하이픈 없음) + `.max(13)` |
| `verificationCodeForm` | `resident.js` `verificationCodeSchema` | `verificationCode` — `/^\d{6}$/` + `.min(6)` + `.max(6)`         |

두 폼이 **같은 휴대폰 값을 공유**하기 위해 `useField('noHyphenPhone')`로 값을 꺼내 쓴다.
React에서는 상위 상태 하나로 통일한다.

전송 시 `cleanPhoneHyphen()`으로 하이픈을 제거해 `{ phone }`으로 보낸다 (필드명이 바뀐다).

### `[확인 필요]` A-Q1 — 재요청은 1회만 가능하다

`resendCodeValue`는 `true`로 시작해 `handleReSend`에서 `false`가 되고 **다시 `true`로 돌아오지 않는다**
(`PasswordPhoneCertView.vue:128-136`). 즉 재요청 버튼은 한 번 누르면 영구 비활성화된다.

의도인지 버그인지 확인 필요. **등가 이관 원칙상 일단 그대로 재현**하고 `deferred.md`에 기록.

### `[확인 필요]` A-Q2 — 인증 성공 시 화면이 사라진다

루트 `div`에 `v-if="!isPostPasswordResetCodeVerifyIsSuccess"`가 걸려 있어
(`PasswordPhoneCertView.vue:159`), 인증 성공 순간 **화면이 빈 상태가 되고** 이어서 라우팅된다.
깜빡임이 보이는지 실기기 확인 필요.

---

## A3. 비밀번호 재설정

경로 `/password/reset`. AppBar 제목 `새 비밀번호 설정`.

### 화면 구성

| 요소      | 클래스 (원문)                                                                                                                                  |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| 루트      | `flex h-full w-full flex-col justify-between overflow-y-auto p-5`                                                                              |
| 폼        | `flex flex-col items-center gap-7 self-stretch`                                                                                                |
| 필드 그룹 | `flex flex-col gap-3 self-stretch`                                                                                                             |
| 라벨      | `flex items-center gap-1 text-center text-defaults-primary-text-primary pretendard-15SemiBold` + `Essential.svg` 아이콘                        |
| 완료 버튼 | `size="xl"`, `custom-class="flex w-full justify-center"`, `:has-outline="!meta.valid"`, `:color="meta.valid ? 'brand' : 'defaults-secondary'"` |

### 고정 문구

| 위치          | 문구                                                     |
| ------------- | -------------------------------------------------------- |
| 제목          | `비밀번호를` `\n` `재설정 해주세요`                      |
| 라벨 1        | `비밀번호` (+ 필수 별표 아이콘, alt `별표 아이콘`)       |
| placeholder 1 | `영문, 숫자, 특수문자(~!@#$%^&*()?) 3가지 포함 8자 이상` |
| 라벨 2        | `비밀번호 확인`                                          |
| placeholder 2 | `비밀번호를 한번 더 입력해주세요`                        |
| 버튼          | `완료`                                                   |
| 성공 토스트   | `재설정되었습니다`                                       |
| 실패 모달     | `패스워드 변경에 실패했습니다`                           |

### 동작

| 시점       | 동작                                                                                |
| ---------- | ----------------------------------------------------------------------------------- |
| **마운트** | `window.history.state`에서 `verifiedToken`·`pageTitle`을 읽는다                     |
| 토큰 없음  | **`/`로 즉시 이동** (직접 진입 차단)                                                |
| 토큰 있음  | `history.replaceState({}, '', pathname)` — **새로고침 시 state를 비운다**           |
| 제출       | `patchPasswordMutation({ token: verifiedToken, password: values.passwordConfirm })` |
| 성공       | `/`로 이동 + 토스트 `재설정되었습니다`                                              |
| 실패       | 모달 `패스워드 변경에 실패했습니다`                                                 |

> ⚠️ **제출 시 `password`가 아니라 `passwordConfirm` 값을 보낸다** (`PasswordResetView.vue:41`).
> 두 값이 같아야 통과하므로 결과는 같지만, 이관 시 그대로 둔다.
> ⚠️ 이 API만 별도 axios 인스턴스를 쓴다 (`endpoints.md` #14) — 토큰을 헤더에 직접 넣기 때문.
> 타깃에서는 `publicApi`에 `headers` 옵션으로 처리한다.

### 폼

**인라인 스키마**다 (`PasswordResetView.vue:20-32`). 타깃에서는 `features/auth/schemas/`로 옮긴다.

| 필드              | 검증                                                                                      |
| ----------------- | ----------------------------------------------------------------------------------------- |
| `password`        | `common.js`의 `password` — `PASSWORD_REGEX` (영문+숫자+특수문자 8자 이상), `maxlength=20` |
| `passwordConfirm` | `.min(1)` + `.refine(v => v === values.password)` — 메시지 `비밀번호가 일치하지 않습니다` |

> `refine`이 `values.password`를 클로저로 참조한다. RHF에서는 `zodResolver` + 스키마 레벨 `.refine`
> (`path: ['passwordConfirm']`)으로 옮긴다 — `resident.js`의 `passwordFormSchema`가 이미 그 형태다.

---

## A4. 로그인 미승인 상태

경로 `/login/pending`. AppBar 없음. 로그인 시 `RESIDENT_NOT_APPROVED`로 진입.

### 화면 구성 · 문구

| 요소   | 내용 / 클래스                                                                                                                                                   |
| ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 루트   | `h-full w-full pt-12`                                                                                                                                           |
| 본문   | `flex h-full w-full flex-col justify-start px-6 pt-[43px] pretendard-16Regular`                                                                                 |
| 제목   | `가입 승인 대기중` — `flex flex-col items-start gap-2 pretendard-22Bold`                                                                                        |
| 설명   | `현재 회원 승인 검토중입니다.` `\n` `빠른 시일 내에 승인 여부를 안내해 드리겠습니다.` — `mt-[11px] text-defaults-secondary-text-secondary pretendard-16Regular` |
| 이미지 | `JoinSuccess.svg`, alt `가입 승인 상태 확인 중 이미지`, `h-[138px] w-[138px]`, **화면 중앙 고정** (`fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2`)  |
| 버튼   | `확인` — `fixed bottom-0 left-0`, `size="2xl"`, `color="brand"`, `round-type="square"` → `/`로 이동                                                             |

### 진입 시 부수 효과 (A1-2의 에러 경로)

`fetchWaitingMemberInfo({ id, password })`가 **이 화면으로 오기 직전에** 실행된다:

```
getWaitingMemberLoginInfo({ id: cleanPhoneHyphen(id), password })   ← ⚠️ 쿼리스트링 전송
  ↓ success 없으면 null 반환하고 종료
contentList에서 A-PASS / 로비폰 판정
  ↓
nativeSendInitialResidentInfo({ ...6필드 })   ← 미승인 상태에서도 FCM 토큰 등록 목적
nativeEndSplash()
```

> 코드 주석에 목적이 적혀 있다 — **"미승인 회원 로그인 정보 조회로 미리 fcmToken 서버에 전송,
> 문자 대신 푸시알림 발송 가능하도록 변경"** (`usePatchLogin.js:96-97`).
> ⚠️ 이 API가 아이디·비밀번호를 쿼리스트링으로 보낸다 —
> **그대로 유지 확정** (`decisions/inventory-questions.md` E-Q2).

---

## A5 · A6. 버전1 입주민 전환

구버전(`oldResidentFlag`) 입주민이 v2 약관에 동의하고 본인인증을 거쳐 전환하는 플로우.

### A5 `/versionOne/terms`

AppBar 있음(제목 빈 문자열), 뒤로가기 `backPath: '/'`.

| 요소             | 내용                                                                                                                           |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| 루트             | `h-full w-full space-y-10 overflow-y-auto p-5`                                                                                 |
| 제목             | `아파트먼트 V2` `\n` `서비스 이용약관` (`TextTitle` 안에 `<span>` 2개)                                                         |
| 설명             | `버전2 서비스 이용약관 동의가 필요해요.`                                                                                       |
| 본문             | `TermsOfUseAgreeView` 재사용 — props `cert-btn-text="동의하고 인증하기"`, `cert-btn-response-url="/versionOne/terms/response"` |
| `<style scoped>` | `.fixed-width { width: calc(100% - 32px); }` — **템플릿에서 사용되지 않음(죽은 스타일)**                                       |

> `TermsOfUseAgreeView`는 SignUp 도메인과 공유하는 약관 동의 컴포넌트다.
> **SignUp 명세와 함께 정의**한다.

### A6 `/versionOne/terms/response`

AppBar 없음. KMC 본인인증 콜백 랜딩.

`CertResponse` 공용 컴포넌트에 핸들러 2개를 넘긴다:

```
마운트 → 쿼리스트링이 비어 있으면 → ACCESS_DENIED_MODAL_DATA 모달 → 닫으면 errorFirstHandler()
       → 있으면 → handler() 실행
```

| 핸들러              | 동작                                                                                                  |
| ------------------- | ----------------------------------------------------------------------------------------------------- |
| `handler`           | `isPostUserVersionOneInfoPending`이면 무시. 아니면 `postUserVersionOneInfoMutation(getQueryString())` |
| `errorFirstHandler` | `/`로 이동                                                                                            |

`usePostUserVersionOneInfo` 결과:

| 결과                            | 동작                                                                   |
| ------------------------------- | ---------------------------------------------------------------------- |
| 성공                            | `await loginDataHandler()` → `/main`                                   |
| `RESIDENT_ALREADY_EXISTS`       | 모달 `이미 등록된 입주민입니다.`                                       |
| `HOUSEHOLD_NOT_FOUND`           | 모달 `존재하지 않는 세대입니다.`                                       |
| `HOUSEHOLD_HEAD_ALREADY_EXISTS` | 모달 `이미 등록된 세대주가 존재합니다.`                                |
| `KMC_ERROR`                     | 모달 `인증 유효시간이 만료됐습니다. 다시 시도해주세요.` + 닫으면 `/`로 |
| 그 외                           | 모달에 서버 `message`                                                  |

**에러 시 공통으로** `deleteLocalInfo()` + `/`로 이동한다 (`usePostUserVersionOneInfo.js:50-51`).

> ⚠️ 이 API만 **인증 인스턴스**(`auth`)를 쓴다 — 이미 로그인된 상태이기 때문
> (`decisions/inventory-questions.md` E-Q3).

---

## A7. 로그아웃 — `useLogoutFlow`

경로 `/logout`. 화면 자체는 `MypageLogoutView.vue`(MyPage 명세에서 화면 구성 확인).

### `onLogout(path)` 동작 순서

```
1. queryClient.removeQueries({ queryKey: ['residentDetailInfo'] })
2. authStore.clearAuth()              ← 토큰·입주민 정보 localStorage 삭제
3. authStore.setShouldRedirectAfterLogin(true)
4. nativeLogoutApp()                  ← 네이티브에 LOGOUT_APP 발신
5. navigateTo(path)
```

> ⚠️ **로비폰 세대는 추가 단계가 있다.** `useDeleteLogout`이 `deleteLogout(refreshToken)` 후
> 아파트에 로비폰 컨텐츠가 있으면 `putLobbyPhoneResidentLogout`을 호출한다
> (`endpoints.md` #114). MyPage 명세에서 확정.
> ⚠️ `deleteLocalInfo()` import가 **주석 처리**돼 있다 (`useLogoutFlow.js:4`).

---

## 호출 API

`endpoints.md` 참조. 이 도메인이 쓰는 것:

| #   | 함수                           | METHOD | 경로                                        | 인스턴스                                |
| --- | ------------------------------ | ------ | ------------------------------------------- | --------------------------------------- |
| 6   | `postLogin`                    | POST   | `/apartmant/resident/login`                 | `publicApi`                             |
| 7   | `getLoginInfo`                 | GET    | `/apartmant/resident/login/info`            | `api`                                   |
| 8   | `getWaitingMemberLoginInfo`    | GET    | `/apartmant/resident/login/waiting-info`    | `publicApi` (⚠️ 쿼리스트링 비밀번호)    |
| 9   | `deleteLogout`                 | DELETE | `/apartmant/resident/logout`                | `api` (헤더 `refresh-token`)            |
| 5   | `postVersionOneResidentSignUp` | POST   | `/apartmant/resident/old/sign-up`           | **`api`**                               |
| 13  | `getResidentAptList`           | GET    | `/apartmant/resident/apt-resident/apt`      | `api`                                   |
| 14  | `patchPasswordReset`           | PATCH  | `/apartmant/resident/re-set-password`       | `publicApi` + `Authorization` 헤더 직접 |
| 15  | `postPasswordResetSendCode`    | POST   | `/apartmant/sms/password-reset/send-code`   | `publicApi`                             |
| 16  | `postPasswordResetCodeVerify`  | POST   | `/apartmant/sms/password-reset/code-verify` | `publicApi`                             |
| 114 | `putLobbyPhoneResidentLogout`  | PUT    | `.../lobby-phone/logout`                    | `api` (조건부)                          |
| 2   | `postAccessTokenReissue`       | POST   | `/apartmant/resident/token-refresh`         | `publicApi` (인터셉터가 호출)           |

---

## 상태

| 값                                                                  | 종류                | 위치                                                                           |
| ------------------------------------------------------------------- | ------------------- | ------------------------------------------------------------------------------ |
| `accessToken` · `refreshToken`                                      | 클라이언트 (영속)   | localStorage. **키 이름·직렬화 보존** (R13)                                    |
| `authUser` · `userAuthInfo`(id/pw 평문) · `aptInfo`                 | 클라이언트 (영속)   | 〃                                                                             |
| `isLoggedIn` · `isAutoLoginInProgress` · `shouldRedirectAfterLogin` | 클라이언트 (메모리) | Zustand                                                                        |
| `signUpInfo`                                                        | 클라이언트 (메모리) | 가입 위저드 스토어. A2 마운트 시 초기화                                        |
| 로그인/재설정 응답                                                  | 서버                | mutation. 캐시하지 않음                                                        |
| `getLoginInfo` 결과                                                 | 서버                | ⚠️ 캐시하지 않고 `aptInfo`로 **복사**한다 — `04-state.md` 위반이지만 등가 이관 |

---

## 네이티브 연동

| 시점                                | 메시지                                                 |
| ----------------------------------- | ------------------------------------------------------ |
| 로그인 성공 후 (`loginDataHandler`) | `SEND_INITIAL_RESIDENT_INFO` (N10)                     |
| 미승인 회원 조회 후                 | `SEND_INITIAL_RESIDENT_INFO` (N10) + `END_SPLASH` (N9) |
| 로그아웃                            | `LOGOUT_APP` (N5)                                      |

페이로드 6필드는 `native-protocol.md` §2.

---

## 엣지케이스

| 상황                                    | 기대 동작                                                                                    |
| --------------------------------------- | -------------------------------------------------------------------------------------------- |
| 오프라인                                | 라우터 가드가 토스트 `네트워크 상태를 확인해주세요` 후 이동 차단                             |
| 이미 로그인 상태로 `/intro` 진입        | 가드가 `getLoginInfo()` 호출 → 네이티브 전송 → `/main`으로. 실패 시 `clearAuth()` + `/intro` |
| `/password/reset` 직접 진입 (토큰 없음) | `/`로 즉시 이동                                                                              |
| `/password/reset` 새로고침              | `replaceState`로 state가 비어 있어 `/`로 이동                                                |
| A2 타이머 3분 만료                      | `/`로 이동                                                                                   |
| A6 쿼리스트링 없이 진입                 | 접근 거부 모달 → `/`로                                                                       |
| 토큰 만료 (`EXPIRED_TOKEN`)             | 재발급 → 실패 시 자동 로그인 → 실패 시 `onLogout('/')`                                       |
| 자동 로그인 중 로그인 실패              | 에러코드 무관하게 `onLogout('/')`                                                            |
| `loginDataHandler` 실패                 | **조용히 무시** (`console.error`만). 로그인은 성공 처리됨                                    |

---

## QA 체크리스트

- [ ] `/intro` 진입 시 기존 로그인 정보가 지워지는가
- [ ] 아이디에 하이픈 포함/미포함 입력 모두 로그인되는가 (전송 시 하이픈 제거)
- [ ] **구버전 비밀번호 규칙 계정이 로그인되는가** (복잡도 검증 없음)
- [ ] 폼 유효/무효에 따라 로그인 버튼 색이 바뀌는가
- [ ] 로그인 중 스피너가 뜨고 버튼이 비활성화되는가
- [ ] 아이디·비밀번호 오류 시 문구가 `아이디 또는 비밀번호가 일치하지 않습니다.`인가
- [ ] 미승인 계정 로그인 → `/login/pending` 이동 + 네이티브 정보 전송
- [ ] `oldResidentFlag` 계정 → `/versionOne/terms` 이동
- [ ] 비밀번호 찾기: 인증번호 전송 후 휴대폰 입력이 비활성화되는가
- [ ] 타이머가 `02:59`부터 1초씩 줄고 `00:00`에 `/`로 이동하는가
- [ ] 재요청 버튼 동작 (A-Q1 — 1회 제한이 맞는지)
- [ ] 인증 성공 → 비밀번호 재설정 화면 이동, 새로고침 시 `/`로
- [ ] 재설정 성공 → `/` 이동 + 토스트 `재설정되었습니다`
- [ ] 로그아웃 → 네이티브 `LOGOUT_APP` 발신 + localStorage 정리 + `/`로
- [ ] 로비폰 세대 로그아웃 시 추가 API 호출
- [ ] **기존 앱 사용자의 localStorage 세션이 이어지는가** (R13)

---

## 이관 시 주의

| #   | 항목                                                              |
| --- | ----------------------------------------------------------------- |
| 1   | 토큰이 **응답 헤더**로 온다 — `authorization`, `refresh-token`    |
| 2   | `setAutoLoginInProgress(false)`는 **토큰 저장 후에**              |
| 3   | `id = phone` — 로그인 아이디가 휴대폰 번호                        |
| 4   | 로그인 비밀번호는 복잡도 검증 **없음** (버전1 호환)               |
| 5   | 에러코드 3종이 같은 문구로 합쳐짐 — 분리 금지                     |
| 6   | `aptInfo`가 `loginDataHandler`에서 만들어짐 — 쿼리 키 34개가 의존 |
| 7   | `A3` 제출 시 `passwordConfirm` 값을 보냄                          |
| 8   | localStorage 키·직렬화 보존 (R13)                                 |
| 9   | zod: `required_error` → `error` (`zod-migration.md`)              |
| 10  | `A5`의 죽은 `<style scoped>`는 옮기지 않는다                      |

## `[확인 필요]`

| #    | 질문                                                                                            |
| ---- | ----------------------------------------------------------------------------------------------- |
| A-Q1 | A2 재요청 버튼이 1회만 동작하는 것은 의도인가?                                                  |
| A-Q2 | A2 인증 성공 시 화면이 잠깐 비는 깜빡임이 실기기에서 보이는가?                                  |
| A-Q3 | `loginDataHandler` 실패를 조용히 삼키는 것은 의도인가? (부트스트랩 실패인데 로그인은 성공 처리) |
