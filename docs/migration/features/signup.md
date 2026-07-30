# 도메인 명세 — 회원가입 (signup)

> 기준 SHA `6d5bf22` · 레거시 `views/SignUpView/`(8, 703 LOC) + `views/TermsOfUseView/`(3, 158 LOC)
> 타깃 슬라이스 `features/signup/` (약관 상세는 `features/terms/`)
> 관련: `features/auth.md`(A5·A6이 같은 약관 컴포넌트를 공유)

## 화면 목록

| #   | 경로                             | name                        | 컴포넌트                                  | 진입              | 인증           |
| --- | -------------------------------- | --------------------------- | ----------------------------------------- | ----------------- | -------------- |
| S1  | `/signup/terms`                  | 이용약관 동의               | `SignUpTermsAndConditionsView.vue`        | 인트로 "회원가입" | `authOptional` |
| S2  | `/signup/certification/response` | 회원가입 본인인증 결과 수신 | `SignUpCertResponseView.vue`              | KMC 콜백          | 불필요         |
| S3  | `/signup/info/user`              | 내 정보 입력                | `SignUpUserInfoView.vue`                  | S2 성공           | 불필요         |
| S4  | `/signup/info/apt`               | 아파트 설정                 | `SignUpAptInfoView.vue`                   | S3 제출           | 불필요         |
| S5  | `/signup/completed`              | 회원가입 완료               | `SignUpCompletedView.vue`                 | S4 성공           | 불필요         |
| T1  | `/termsOfUse/:termsId`           | 약관 상세                   | `TermsOfUseView/TermsOfUseDetailView.vue` | S1 약관 항목 클릭 | `authOptional` |

### 하위 컴포넌트 (라우트 없음)

| 파일                                     |  줄 | 역할                                      |
| ---------------------------------------- | --: | ----------------------------------------- |
| `SignUpAptInfoSearchModal.vue`           |  87 | 아파트 검색 모달                          |
| `SignUpAptInfoSearchItem.vue`            |  30 | 검색 결과 1행                             |
| `SignUpAptInfoRadio.vue`                 |  52 | 세대주/세대원 세그먼트 라디오             |
| `TermsOfUseView/TermsOfUseAgreeView.vue` |  71 | **약관 동의 폼** (S1 + `auth.md` A5 공유) |
| `TermsOfUseView/CertButton.vue`          |  62 | **KMC 본인인증 제출 버튼**                |

**공통 meta**: S1·S3은 `showAppBar:true`, S2·S4·S5는 `showAppBar:false`. 전부 `showBottomNav:false`.
S1은 `hasBackButton:true`, `backPath:'/'`. 상세는 `routes.md` §3-2.

> ⚠️ **S3·S4는 라우트 meta로 AppBar를 끄고 화면 안에서 `AppBar`를 직접 렌더한다.**
> 뒤로가기에 확인 모달을 붙이기 위해 `:navigate-fn`을 주입하기 때문이다 (§S3, §S4).

---

## 전체 플로우

```
/intro ──"회원가입"──▶ /signup/terms
                          │  약관 동의 (필수 2 + 선택 2)
                          │  선택 동의 여부를 쿼리스트링으로 인코딩
                          ▼
                  [KMC 외부 사이트로 POST]  ← 폼 서브밋, SPA 이탈
                          │  tr_url = {baseUrl}/signup/certification/response?consent...
                          ▼
                  /signup/certification/response
                          │  쿼리스트링 → signUpInfo 스토어에 저장
                          ▼
                    /signup/info/user     이름·닉네임·비밀번호
                          │  signUpInfo에 병합
                          ▼
                    /signup/info/apt      아파트·동·호수·세대주여부
                          │  postSignUp (signUpInfo + 폼값 조합)
                          ▼
                    /signup/completed     승인 대기 안내
                          │  "확인"
                          ▼
                        /intro
```

**4단계 위저드**이고, 단계 간 데이터는 `signUpInfo` Pinia 스토어가 나른다.
중간에 KMC 외부 사이트를 왕복하므로 **스토어가 아니라 URL 쿼리스트링으로 넘기는 구간**이 있다.

---

## S1. 이용약관 동의

경로 `/signup/terms`. AppBar 있음, 뒤로가기 `backPath: '/'`.

### 화면 구성

```
┌─────────────────────────────┐
│ 아파트먼트 서비스 이용약관에    │  TextTitle (span 2개)
│ 동의해주세요.                 │
│                             │  space-y-20
│ ☐ 모두 동의                  │  border-b, pb-7, mb-7
│ ─────────────────────────── │
│ ☐ 이용약관 동의        [>]   │  TermsCheckboxList
│ ☐ 개인정보 처리방침 동의 [>]  │  space-y-5
│ ☐ 마케팅 목적의 개인정보... [>]│
│ ☐ 광고성 정보 수신 동의  [>]  │
│                             │
│    [ 동의하고 가입하기 ]      │  fixed bottom-4 left-4
└─────────────────────────────┘
```

| 요소               | 클래스 (원문)                                                                                         |
| ------------------ | ----------------------------------------------------------------------------------------------------- |
| 루트               | `h-full w-full space-y-20 overflow-auto p-5 pb-24`                                                    |
| 모두 동의 라벨     | `border-defaults-tertiary-border-tertiary0 mb-7 flex cursor-pointer items-center gap-3 border-b pb-7` |
| 모두 동의 체크박스 | `h-5 w-5`                                                                                             |
| 모두 동의 문구     | `text-defaults-primary-text-primary0 pretendard-16SemiBold`                                           |
| 약관 목록          | `list-class="space-y-5"`, `text-class="pretendard-16Regular"`                                         |
| 인증 버튼          | `fixed-width fixed bottom-4 left-4` — `.fixed-width { width: calc(100% - 32px) }`                     |

> ⚠️ **`border-defaults-tertiary-border-tertiary0`·`text-defaults-primary-text-primary0`는
> 존재하지 않는 클래스다 (S-Q1 확인 완료).**
> `tailwind.config.js`에 있는 것은 `border-tertiary`이고 **`tertiary0`·`primary0`은 없다.**
> Tailwind가 무시하므로 색상이 적용되지 않고 **기본 border/text 색으로 렌더된다.**
>
> 🔵 **2026-07-30 정정 — 오타를 고쳐서 옮긴다.** 대상 토큰(`border-tertiary`·`text-primary`)이
> config에 그대로 있어 추측이 필요 없다 (`broken-styles.md` §0 A그룹, 사용자 결정).
> `text-defaults-primary-text-primary`(`#111927`)는 상속색과 같아 **화면이 바뀌지 않고**,
> 테두리만 기본 `#E5E7EB` → `#F3F4F6`로 미세하게 밝아진다.
> 사용처 3곳: `TermsOfUseAgreeView.vue:36,45`, `TermsCheckboxList.vue:32`.

### 고정 문구

| 위치      | 문구                                                |
| --------- | --------------------------------------------------- |
| 제목      | `아파트먼트 서비스 이용약관에` `\n` `동의해주세요.` |
| 전체 동의 | `모두 동의`                                         |
| 버튼      | `동의하고 가입하기`                                 |

약관 4개 항목 라벨은 `constants/domain/terms.js` `TERMS_ITEMS`:

| id                        | label                                      | required | title (약관 상세 화면 제목)           |
| ------------------------- | ------------------------------------------ | -------- | ------------------------------------- |
| `terms-and-conditions`    | `이용약관 동의`                            | ✅       | `서비스 약관`                         |
| `privacy-policy`          | `개인정보 처리방침 동의`                   | ✅       | `개인정보처리방침`                    |
| `marketing-data-consent`  | `마케팅 목적의 개인정보 수집 및 이용 동의` | ❌       | `마케팅 목적의 개인정보 수집 및 이용` |
| `receive-adverts-consent` | `광고성 정보 수신 동의`                    | ❌       | `광고성 정보 수신`                    |

### 동작

| 시점            | 동작                                                            |
| --------------- | --------------------------------------------------------------- |
| 마운트          | `setSignUpInfo({})` — ⚠️ **실제로는 초기화되지 않는다** (§S-Q2) |
| 항목 `[>]` 클릭 | `/termsOfUse/{item.id}`로 이동 (T1)                             |
| 버튼 활성 조건  | `isAllRequiredAgreed` — **필수 2개**가 모두 체크되어야 함       |
| 버튼 클릭       | KMC 외부 사이트로 폼 POST (§KMC)                                |

### 약관 체크박스 연동 규칙 — `useTermsAgreement`

**3가지 연동이 있다.** `watch` 3개로 구현돼 있어 React 변환 시 판단이 필요하다.

| #   | 규칙                                                             | 레거시 구현                                              | React 변환                                           |
| --- | ---------------------------------------------------------------- | -------------------------------------------------------- | ---------------------------------------------------- |
| 1   | 개별 항목이 **전부** 체크되면 "모두 동의"가 자동 체크된다        | `watch(개별 상태 배열)` → `isAllAgreed = isEveryChecked` | **파생 상태** — 렌더 중 계산. `useEffect` 쓰지 말 것 |
| 2   | **마케팅 동의를 해제**하면 광고성 정보 수신 동의도 함께 해제된다 | `watch(MARKETING)`                                       | **이벤트 핸들러** — 체크박스 변경 시 처리            |
| 3   | **광고성 정보 수신에 동의**하면 마케팅 동의가 함께 체크된다      | `watch(RECEIVE_ADVERTS)`                                 | **이벤트 핸들러**                                    |

> 2·3은 "마케팅 동의 없이는 광고 수신 불가"라는 도메인 규칙을 양방향으로 강제한다.
> `tech-mapping.md` §6-1의 `watch` 변환 기준을 적용하는 **첫 실전 사례**다.
> Phase 5 레시피에 이 예시를 넣는다.

"모두 동의" 클릭 시 `toggleAllAgreed()`가 **모든 항목을 `isAllAgreed` 값으로 일괄 설정**한다.

### 선택 동의 → 쿼리스트링

```js
consentQueryString = new URLSearchParams({
  marketingDataConsentFlag: agreedState[MARKETING_DATA_CONSENT_ID],
  receiveAdvertsConsentFlag: agreedState[RECEIVE_ADVERTS_CONSENT_ID],
}).toString()
```

**boolean이 문자열 `'true'`/`'false'`로 직렬화된다.** S2에서 다시 boolean으로 되돌린다.

---

## KMC 본인인증 — `CertButton` ⚠️ 이관 핵심

**외부 인증 사이트로 실제 폼 POST를 한다.** fetch/XHR로 대체할 수 없다.

```html
<form name="reqKMCISForm" method="post" action="https://www.kmcert.com/kmcis/web/kmcisReq.jsp">
  <input type="hidden" name="tr_cert" :value="certificationField.tr_cert" />
  <input type="hidden" name="tr_add" :value="certificationField.tr_add" />
  <input type="hidden" name="tr_ver" :value="certificationField.tr_ver" />
  <input type="hidden" name="tr_url" :value="responseUrl" />
  <ButtonBase type="submit">{{ text }}</ButtonBase>
</form>
```

| 항목            | 값                                                                                   |
| --------------- | ------------------------------------------------------------------------------------ |
| 인증 사이트     | `https://www.kmcert.com/kmcis/web/kmcisReq.jsp` (하드코딩)                           |
| 마운트 시       | `getCertificationField({ type })` 호출 → `tr_cert`·`tr_add`·`tr_ver`를 hidden에 채움 |
| `type` 값       | `KMC_TYPE_FOR_URL_CODE[props.type]` — `JOIN` \| `USER_VOTE` \| `NON_USER_VOTE`       |
| `tr_url` (콜백) | `` `${baseUrl}${certBtnResponseUrl}?${consentQueryString}` ``                        |
| 버튼 스타일     | `round-type="rounded"`, `color="brand"`, `size="xl"`, `:has-outline="disabled"`      |

### 사용처 3곳

| 화면               | `type`                        | `certBtnText`       | 콜백 URL                         |
| ------------------ | ----------------------------- | ------------------- | -------------------------------- |
| S1 회원가입        | `JOIN`                        | `동의하고 가입하기` | `/signup/certification/response` |
| `auth.md` A5 버전1 | `JOIN`                        | `동의하고 인증하기` | `/versionOne/terms/response`     |
| 투표·설문 본인인증 | `USER_VOTE` / `NON_USER_VOTE` | (Vote·Survey 명세)  | —                                |

### 이관 시 반드시 지킬 것

1. **`<form action>` + `method="post"` 그대로 유지.** React에서도 네이티브 폼 제출이다.
   `onSubmit` 핸들러에서 `preventDefault()` 하면 안 된다
2. **`tr_url`에 `baseUrl`(앱 자신의 절대 URL)이 들어간다** — `env.VITE_BASE_URL`
3. 선택 동의 flag가 **URL 쿼리스트링으로 왕복**한다. 스토어로 대체하면 KMC 왕복 중 소실된다
4. hidden 필드 이름(`tr_cert`·`tr_add`·`tr_ver`·`tr_url`)은 KMC 계약이다

> `[확인 필요]` S-Q3 — 네이티브 웹뷰에서 이 외부 POST가 어떻게 처리되는지
> (같은 웹뷰에서 열리는지, 시스템 브라우저로 나가는지). 실기기 확인 필요.

---

## S2. 본인인증 결과 수신

경로 `/signup/certification/response`. AppBar 없음. **화면 요소가 없다** — `CertResponse`만 렌더.

### 동작

`CertResponse` 공용 컴포넌트 (`auth.md` A6과 동일 구조):

```
마운트 → 쿼리스트링이 비어 있으면 → ACCESS_DENIED_MODAL_DATA 모달
                                    → 닫으면 errorFirstHandler() → '/'
       → 있으면 → handler() 실행
```

`handler` = `handleSignUpCertification`:

```js
const query = getQueryString()
setSignUpInfo({
  ...query,
  marketingDataConsentFlag: query.marketingDataConsentFlag === 'true',
  receiveAdvertsConsentFlag: query.receiveAdvertsConsentFlag === 'true',
})
navigateTo('/signup/info/user')
```

**쿼리스트링 전체를 스토어에 펼쳐 넣는다.** KMC가 붙여주는 필드가 그대로 들어간다:

| 필드                                                     | 출처                                          |
| -------------------------------------------------------- | --------------------------------------------- |
| `apiToken` · `certNum`                                   | KMC 인증 결과                                 |
| `name` · `birthDay` · `gender` · `nation`                | KMC 본인확인 정보                             |
| `marketingDataConsentFlag` · `receiveAdvertsConsentFlag` | S1에서 우리가 붙인 값 (문자열 → boolean 변환) |

> ⚠️ **KMC가 어떤 필드를 붙여주는지는 문서화돼 있지 않다.** 코드가 `...query`로 전부 받는다.
> S4의 `postSignUp` 호출부에서 역산하면 위 목록이다. → `[확인 필요]` S-Q4

---

## S3. 내 정보 입력

경로 `/signup/info/user`. **화면 안에서 `AppBar`를 직접 렌더**한다.

### 화면 구성

```
┌─────────────────────────────┐
│ [<]                         │  AppBar (navigate-fn 주입)
│ 내 정보 입력                  │  TextTitle
│                             │
│ 이름 *                       │  gap-7
│ [이름 입력          ]        │  maxlength 10
│                             │
│ 닉네임 *                     │
│ [닉네임 입력        ]        │  maxlength 10
│                             │
│ 비밀번호 *                    │
│ [비밀번호 입력      ]        │  maxlength 20
│                             │
│ 비밀번호 확인 *               │
│ [비밀번호를 한번 더...]       │  maxlength 20
│                             │
│ [        완료        ]       │  fixed bottom-0 left-0, size 2xl
└─────────────────────────────┘
```

| 요소      | 클래스 (원문)                                                                                                                |
| --------- | ---------------------------------------------------------------------------------------------------------------------------- |
| 루트      | `h-full`                                                                                                                     |
| 본문      | `h-full w-full overflow-auto p-5`                                                                                            |
| 폼        | `flex flex-col items-center gap-7 self-stretch pb-14`                                                                        |
| 필드 그룹 | `flex flex-col gap-3 self-stretch`                                                                                           |
| 라벨      | `flex items-center gap-1 text-center text-defaults-primary-text-primary pretendard-15SemiBold` + `Essential.svg`             |
| 버튼      | `round-type="square"`, `size="2xl"`, `class="fixed bottom-0 left-0"`, `:color="meta.valid ? 'brand' : 'defaults-secondary'"` |

### 고정 문구

| 위치        | 문구                                                                                 |
| ----------- | ------------------------------------------------------------------------------------ |
| 제목        | `내 정보 입력`                                                                       |
| 라벨        | `이름` / `닉네임` / `비밀번호` / `비밀번호 확인` (전부 필수 별표, alt `별표 아이콘`) |
| placeholder | `이름 입력` / `닉네임 입력` / `비밀번호 입력` / `비밀번호를 한번 더 입력해주세요`    |
| 버튼        | `완료`                                                                               |

### 폼

**인라인 스키마**다 (`SignUpUserInfoView.vue:25-39`). 타깃에서는 `features/signup/schemas/`로.

| 필드              | 검증                                                                                               | 출처        |
| ----------------- | -------------------------------------------------------------------------------------------------- | ----------- |
| `name`            | `NAME_REGEX` (한글·영문·공백), `.min(2)` — `2자 이상 입력해주세요` / `한글, 영문, 띄어쓰기만`      | `common.js` |
| `nickName`        | `NICKNAME_REGEX` (한글·영문·숫자 2~10), `.min(2)` — `2~10자로 입력해주세요` / `한글, 영문, 숫자만` | `common.js` |
| `password`        | `PASSWORD_REGEX` — `영문, 숫자, 특수문자(~!@#$%^&*()?) 3가지 포함 8자 이상`                        | `common.js` |
| `passwordConfirm` | `.min(1)` + `.refine(v => v === values.password)` — `비밀번호가 일치하지 않습니다`                 | 인라인      |

`initialValues`가 `signUpInfo`에서 온다 — `name`·`nickName`은 **KMC가 준 값으로 미리 채워진다**.
비밀번호 2개는 항상 빈 문자열.

> ⚠️ 회원가입 비밀번호는 `PASSWORD_REGEX`를 **적용한다.** 로그인(`auth.md` A1)은 적용하지 않는다.
> 신규 가입은 새 규칙, 로그인은 구버전 호환 — 의도된 비대칭이다.

### 동작

| 시점         | 동작                                                               |
| ------------ | ------------------------------------------------------------------ |
| 제출         | `setSignUpInfo({ name, nickName, password })` → `/signup/info/apt` |
| **뒤로가기** | AppBar `navigate-fn`이 확인 모달을 연다 (직접 이동하지 않음)       |
| 모달 확인    | `/`로 이동                                                         |
| 모달 취소    | 모달만 닫음                                                        |

**뒤로가기 확인 모달** — `USER_INFO_CLICK_BACK_MODAL_DATA`:

| 항목      | 값                                                 |
| --------- | -------------------------------------------------- |
| 설명      | `본인인증이 취소됩니다.` `\n` `뒤로 가시겠습니까?` |
| 첫 버튼   | `취소` → 모달만 닫기                               |
| 둘째 버튼 | `확인` → `/`로 이동                                |

### 죽은 코드 2건

1. `onMounted`의 접근 차단 검사가 **주석 처리**돼 있다 (`SignUpUserInfoView.vue:79-83`).
   `isForbiddenErrorModalOpen`은 항상 `false`라 **접근 거부 모달이 뜨지 않는다.**
   → S4는 같은 검사가 **활성**이다. 비대칭. → `[확인 필요]` S-Q5
2. `<style scoped>`의 `.custom-date-picker` (`:183-194`) — **템플릿에서 쓰이지 않는다.**
   날짜 선택기가 있었다가 제거된 흔적. **이관하지 않는다.**

---

## S4. 아파트 설정

경로 `/signup/info/apt`. **화면 안에서 `AppBar` 직접 렌더.** 이 도메인에서 가장 복잡한 화면이다.

### 화면 구성

```
┌─────────────────────────────┐
│ [<]                         │  AppBar (navigate-fn 주입)
│ 아파트 설정                   │  TextTitle
│                             │  mt-7, gap-7
│ 아파트명                      │  h-[92px] 고정
│ [            🔍]  ← readonly │  클릭 시 검색 모달
│                             │
│ 동/호수                      │
│ [동 입력   동] [호수 입력 호수] │  각 maxlength 5
│                             │
│ 세대주 여부                   │  mb-16
│ [ 세대주 | 세대원 ]           │  세그먼트 라디오
│                             │
│ [        완료        ]       │  fixed bottom-0, size 2xl
└─────────────────────────────┘
```

| 요소               | 클래스 (원문)                                                                                              |
| ------------------ | ---------------------------------------------------------------------------------------------------------- |
| 본문               | `h-full w-full overflow-y-auto px-5 pb-10 pt-16`                                                           |
| 폼                 | `mt-7 flex flex-col items-center gap-7 self-stretch`                                                       |
| 아파트명 그룹      | `flex h-[92px] flex-col gap-3 self-stretch`                                                                |
| 동/호수 행         | `flex gap-3`                                                                                               |
| 동 입력            | `class-custom="py-[10px] pr-[30px] pl-4 w-full"`                                                           |
| 호수 입력          | `class-custom="py-[10px] pr-[42px] pl-4 w-full"`                                                           |
| 단위 라벨(동/호수) | `absolute right-3 top-1/2 translate-y-[-50%] text-defaults-secondary-text-secondary pretendard-16SemiBold` |
| 세대주 그룹        | `mb-16 flex flex-col gap-3 self-stretch`                                                                   |
| 버튼 래퍼          | `fixed bottom-0 left-0 w-full space-y-4 text-defaults-secondary-text-secondary pretendard-14Regular`       |

### 고정 문구

| 위치        | 문구                                   |
| ----------- | -------------------------------------- |
| 제목        | `아파트 설정`                          |
| 라벨        | `아파트명` / `동/호수` / `세대주 여부` |
| placeholder | `동 입력` / `호수 입력`                |
| 단위        | `동` / `호수`                          |
| 라디오      | `세대주` / `세대원`                    |
| 버튼        | `완료`                                 |

### 폼

**인라인 스키마** (`SignUpAptInfoView.vue:23-44`).

| 필드              | 검증                                                                                          |
| ----------------- | --------------------------------------------------------------------------------------------- |
| `aptName`         | `z.string()` — `아파트명을 입력해주세요`. **읽기 전용**, 모달로만 설정                        |
| `dong`            | `z.union([z.string().min(1), z.number()])` — `동을 입력해주세요`. **문자열 또는 숫자 허용**   |
| `ho`              | `z.string()` + `.refine(val => val === val.toUpperCase())` — `호수는 대문자로만 입력해주세요` |
| `isHeadHousehold` | `z.string()` — `세대주 여부를 선택해주세요`                                                   |

> ⚠️ **`ho`의 대문자 검증**: `val === val.toUpperCase()`. 숫자만 입력하면 통과하고,
> 소문자 영문이 섞이면 막힌다 (`101a` ✗, `101A` ✓, `101` ✓). 그대로 이식.
> ⚠️ `aptName` 에러는 `v-if="values.aptName === undefined"` 조건부로만 표시된다 (`:135`).

### 아파트 검색 모달

`InputSearch`가 `is-readonly`라 직접 입력이 안 되고, 클릭하면 모달이 열린다.

| 요소      | 클래스 (원문)                                                                                                                                                    |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 오버레이  | `fixed left-0 top-0 z-[9999] flex h-screen w-screen items-center justify-center bg-black/50`                                                                     |
| 모달      | `flex w-[80vw] max-w-96 flex-col items-center rounded-xl bg-white`                                                                                               |
| 헤더      | `flex items-center justify-between gap-4 self-stretch py-3 pl-5 pr-[10px] text-defaults-primary-text-primary pretendard-18Bold`                                  |
| 닫기 버튼 | `h-7 w-7` + `Close.svg` (alt `닫기 아이콘`)                                                                                                                      |
| 안내 문구 | `whitespace-break-spaces break-keep text-neutral-b-gray-500 pretendard-12Regular`                                                                                |
| 결과 영역 | `border-primary-100 relative flex h-[132px] w-full flex-col items-center justify-center rounded-lg border bg-[#fafbfc]`                                          |
| 결과 목록 | `flex h-full w-full flex-col items-center justify-start gap-[6px] overflow-auto p-2`                                                                             |
| 결과 1행  | `flex items-center justify-between self-stretch px-2 py-[5px] text-defaults-primary-text-primary pretendard-16Regular`                                           |
| 선택 버튼 | `text-primary-500 flex h-5 w-12 items-center justify-center rounded-full border-none bg-defaults-tertiary-background-tertiary text-center pretendard-12SemiBold` |

**고정 문구**

| 위치      | 문구                                                                                                          |
| --------- | ------------------------------------------------------------------------------------------------------------- |
| 제목      | `아파트 검색`                                                                                                 |
| 안내      | `단지명이나 지역명으로 조회 가능합니다` `<br />` `(예 : '안양한양수자인에듀파크'는 '한양수자인' 또는 '안양')` |
| 빈 상태   | `검색 결과가 없습니다`                                                                                        |
| 선택 버튼 | `선택`                                                                                                        |

**동작**

| 시점                | 동작                                                                                |
| ------------------- | ----------------------------------------------------------------------------------- |
| 오버레이 클릭       | 모달 닫기 (값 없이 `close` emit)                                                    |
| 모달 내부 클릭      | `@click.stop` — 닫히지 않음                                                         |
| 검색 제출           | `event.preventDefault()` → `searchKeyword` 갱신 + `searchApt(keyword)`              |
| 결과 목록 표시 조건 | `v-if="searchKeyword"` — **검색 전에는 목록 자체가 없다**                           |
| 빈 상태 표시 조건   | `v-if="aptList?.length === 0"` — 검색 전에도 보인다 ⚠️                              |
| `선택` 클릭         | `close` emit + 아파트 객체 전달                                                     |
| 선택 후             | `setFieldValue('aptName', value.name)` + `selectedAptUuid = value.uuid` + 모달 닫기 |

**`useGetAptList`** — 쿼리 키 `['aptList', keyword]`, `keyword` 초기값 `''`.

> ⚠️ **`enabled` 가드가 없다.** 모달이 열리는 순간 **빈 키워드로 API가 즉시 호출된다.**
> 검색 전에 `검색 결과가 없습니다`가 보이는지는 **서버가 빈 키워드에 무엇을 주는지**에 달렸다
> (빈 배열 → 문구 노출, 전체 목록 → 목록이 있지만 `v-if="searchKeyword"` 때문에 안 보임).
> 어느 쪽이든 **불필요한 요청이 1회 발생한다.** → `[확인 필요]` S-Q6, `deferred.md` D-29

> ⚠️ `watch(keyword)`에서 `invalidateQueries(['aptList', keyword])`를 호출한다
> (**v4 시그니처**, `query-keys.md` §1). **키에 `keyword`가 이미 들어 있어 무효화가 불필요하다** —
> 키가 바뀌면 TanStack Query가 자동으로 새로 fetch한다. 이관 시 이 `watch`는 **옮기지 않아도
> 동작이 같다.** → `deferred.md` D-30

### 세대주 라디오 — 🔴 `SignUpAptInfoRadio.vue`는 **죽은 파일이다**

> **2026-07-30 실측 정정.** 전수 검색 결과 `SignUpAptInfoRadio.vue`를 import하는 곳이
> **0곳**이다. S4가 실제로 쓰는 것은 공용 **`InputRadioDual`**이고, 그 선택 상태는
> `bg-brand-default-background-brand`(`#0037BE`, **살아 있는 토큰**) + 흰 글자다 —
> **선택 표시가 처음부터 잘 보인다.**
>
> 따라서 아래 표와 `bg-primary-400`(B-Q1) 논의는 **화면에 영향이 없다.**
> 결정 자체는 유효하지만 적용할 자리가 없어 이 파일은 이관하지 않았다 (`deferred.md` D-213).
> 실제 이관본은 `InputRadioDual` + `HOUSEHOLD_HEAD_OPTIONS`다.

아래는 죽은 파일의 내용 기록이다.

| 상태          | 클래스                                                                                                       |
| ------------- | ------------------------------------------------------------------------------------------------------------ |
| 선택됨        | `bg-primary-400 text-white pretendard-16SemiBold` → ⚠️ **`bg-primary-pc-indigo-400`으로 옮긴다**             |
| 미선택        | `border-neutral-b-gray-300 bg-neutral-b-gray-100`                                                            |
| 공통 (왼쪽)   | `flex h-11 w-full items-center justify-center gap-[7px] rounded-l-lg border ... px-3 py-[14px]`              |
| 공통 (오른쪽) | 〃 `rounded-r-lg`                                                                                            |
| 컨테이너      | `flex h-11 items-start self-stretch text-left font-normal leading-[14px] text-defaults-primary-text-primary` |

> 🔴 **`bg-primary-400`은 config에 없어 아무 효과가 없다.** 그대로 옮기면 선택 시 배경이 사라지고
> `text-white`만 남아 **흰 글자가 흰 배경에 묻힌다** — 선택 표시가 보이지 않는다.
> ✅ **2026-07-30 확정: `bg-primary-pc-indigo-400`(`#7F98F9`)으로 복원한다** (사용자 결정).
> 죽은 클래스 26건 중 **렌더값이 아니라 의도된 색으로 옮기는 유일한 자리**다
> (`broken-styles.md` §0 예외).

값: `householdHead` \| `householdMember`. 상수는 화면 안에 인라인 정의돼 있다
(`SIGNUP_APT_INFO_IS_HOUSEHOLD_HEAD`) — 타깃에서는 `features/signup/constants/`로.

> ⚠️ **컨테이너가 `<form>` 태그다** (`SignUpAptInfoRadio.vue:12`). 부모 폼 안에 중첩 폼이 들어간다 —
> HTML 명세 위반이지만 브라우저가 관대하게 처리한다. React에서는 `<fieldset>`이나 `<div>`로 바꿔도
> **렌더 결과가 같다**. 등가 이관 범위 안이다.

### 제출

```js
postUserInfoMutation({
  apiToken, certNum, nickName, password, name, birthDay, gender, nation,  ← signUpInfo에서
  aptUuid: selectedAptUuid.value,                                          ← 모달 선택값
  dong: value.dong, ho: value.ho,                                          ← 폼
  householdHeadFlag: value.isHeadHousehold === 'householdHead',            ← 문자열 → boolean
  marketingDataConsentFlag, receiveAdvertsConsentFlag,                     ← signUpInfo에서
})
```

**성공 시**:

```js
const responseId = data.data.success.id
fetchWaitingMemberInfo({ id: responseId, password: variables.password })   ← FCM 토큰 등록
navigateTo({ path: '/signup/completed', state: { pageFrom: 'aptInfo' } })
```

**에러 시** (`auth.md` A6의 버전1 가입과 동일한 매핑):

| errorCode                       | 문구                                                              |
| ------------------------------- | ----------------------------------------------------------------- |
| `RESIDENT_ALREADY_EXISTS`       | `이미 등록된 입주민입니다.`                                       |
| `HOUSEHOLD_NOT_FOUND`           | `존재하지 않는 세대입니다.`                                       |
| `HOUSEHOLD_HEAD_ALREADY_EXISTS` | `이미 등록된 세대주가 존재합니다.`                                |
| `KMC_ERROR`                     | `인증 유효시간이 만료됐습니다. 다시 시도해주세요.` + 닫으면 `/`로 |
| 그 외                           | 서버 `message`                                                    |

> 버전1(`usePostUserVersionOneInfo`)과 달리 **에러 시 `deleteLocalInfo()`를 호출하지 않는다.**

### 뒤로가기 · 접근 차단

| 항목      | 동작                                                          |
| --------- | ------------------------------------------------------------- |
| 뒤로가기  | 확인 모달 → `APT_INFO_CLICK_BACK_MODAL_DATA`                  |
| 모달 확인 | **`/signup/info/user`로** (S3로 돌아감. S3의 모달은 `/`로 감) |
| 마운트 시 | `signUpInfo`가 **비어 있으면** 접근 거부 모달 → 닫으면 `/`로  |

**`APT_INFO_CLICK_BACK_MODAL_DATA`**:

| 항목      | 값                                                       |
| --------- | -------------------------------------------------------- |
| 설명      | `작성 내용이 모두 지워집니다.` `\n` `뒤로 가시겠습니까?` |
| 첫 버튼   | `취소`                                                   |
| 둘째 버튼 | `확인`                                                   |

### `selectedAptUuid` 초기값이 `'aaaa'`

```js
const selectedAptUuid = ref('aaaa') // SignUpAptInfoView.vue:54
```

**하드코딩된 플레이스홀더**다. `aptName`이 필수라 모달에서 선택하지 않으면 폼이 유효하지 않아
실제로는 전송되지 않지만, **명백한 지뢰**다. → `deferred.md` D-26

---

## S5. 회원가입 완료

경로 `/signup/completed`. AppBar 없음.

**`auth.md` A4(로그인 미승인)와 레이아웃이 거의 같다.** 차이는 제목과 아이콘뿐이다.

| 요소        | S5                                                                | A4 (미승인)                                             |
| ----------- | ----------------------------------------------------------------- | ------------------------------------------------------- |
| 제목        | `회원가입 완료`                                                   | `가입 승인 대기중`                                      |
| 아이콘      | `JoinCheck.svg` (alt `가입 승인 확인 이미지`)                     | `JoinSuccess.svg` (alt `가입 승인 상태 확인 중 이미지`) |
| 제목 클래스 | `... text-defaults-primary-text-primary pretendard-22Bold`        | `... pretendard-22Bold` (색상 지정 없음)                |
| 본문 래퍼   | `... text-defaults-secondary-text-secondary pretendard-16Regular` | `... pretendard-16Regular`                              |
| 설명        | **동일**                                                          | **동일**                                                |
| 버튼        | **동일** (`확인` → `/`)                                           | 〃                                                      |

| 요소   | 클래스 (원문)                                                                                                          |
| ------ | ---------------------------------------------------------------------------------------------------------------------- |
| 루트   | `h-full w-full pt-12`                                                                                                  |
| 본문   | `flex h-full w-full flex-col justify-start px-6 pt-[43px] text-defaults-secondary-text-secondary pretendard-16Regular` |
| 제목   | `flex flex-col items-start gap-2 text-defaults-primary-text-primary pretendard-22Bold`                                 |
| 설명   | `mt-[11px] text-defaults-secondary-text-secondary pretendard-16Regular`                                                |
| 아이콘 | `h-[138px] w-[138px]` · 래퍼 `fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2`                                |
| 버튼   | `fixed bottom-0 left-0`, `size="2xl"`, `color="brand"`, `round-type="square"`                                          |

**고정 문구**: `회원가입 완료` / `현재 회원 승인 검토중입니다.` / `빠른 시일 내에 승인 여부를 안내해 드리겠습니다.` / `확인`

> S4가 `state: { pageFrom: 'aptInfo' }`를 넘기지만 **이 화면은 읽지 않는다.** 죽은 state.
> → `deferred.md` D-27

---

## T1. 약관 상세

경로 `/termsOfUse/:termsId`. AppBar 제목 `약관 상세`, `authOptional`(로그인 여부 무관).

```js
const { termsId } = getParams()
const termsItem = TERMS_ITEMS.find((item) => item.id === termsId)
```

| 요소      | 값                                                                                |
| --------- | --------------------------------------------------------------------------------- |
| 루트      | `<section class="h-full w-full">`                                                 |
| 본문      | `IframeBase` — `:title="termsItem.title"`, `:src="`${termsUrl}/${termsItem.id}`"` |
| 렌더 조건 | `v-if="termsItem"` — **알 수 없는 `termsId`면 빈 화면**                           |

**약관 본문은 별도 앱(`apt-terms`)이 iframe으로 제공한다.** `env.VITE_TERMS_URL`.

> ⚠️ 잘못된 `termsId`로 진입하면 **AppBar만 있는 빈 화면**이 된다. 에러 처리가 없다.
> → `deferred.md` D-28. 이관 시 그대로 재현.
> ⚠️ 타깃 `docs/conventions/08-routing.md`는 `useParams` 결과를 **검증 후 사용**하라고 하지만,
> 여기서 검증을 추가하면 동작이 달라진다. 등가 이관 우선.

---

## 호출 API

| #   | 함수                        | METHOD | 경로                                     | 인스턴스    | 사용 화면             |
| --- | --------------------------- | ------ | ---------------------------------------- | ----------- | --------------------- |
| 1   | `getCertificationField`     | GET    | `/apartmant/resident/kmc`                | `publicApi` | `CertButton` (S1, A5) |
| 3   | `getAptList`                | GET    | `/apartmant/resident/apt`                | `publicApi` | S4 검색 모달          |
| 4   | `postSignUp`                | POST   | `/apartmant/resident/sign-up`            | `publicApi` | S4 제출               |
| 8   | `getWaitingMemberLoginInfo` | GET    | `/apartmant/resident/login/waiting-info` | `publicApi` | S4 성공 후            |

**외부**: `https://www.kmcert.com/kmcis/web/kmcisReq.jsp` (폼 POST, API 아님)

`postSignUp` 요청 본문 14필드:
`apiToken` · `certNum` · `nickName` · `password` · `aptUuid` · `dong` · `ho` ·
`householdHeadFlag` · `name` · `birthDay` · `gender` · `nation` ·
`marketingDataConsentFlag` · `receiveAdvertsConsentFlag`

---

## 상태

| 값                        | 종류                    | 위치                                                                                                                                                                      |
| ------------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `signUpInfo`              | **클라이언트 (메모리)** | 위저드 4단계를 관통. Zustand로 이관                                                                                                                                       |
| `agreedState` (약관 체크) | 로컬                    | S1 화면 안                                                                                                                                                                |
| `selectedAptUuid`         | 로컬                    | S4 화면 안                                                                                                                                                                |
| `searchKeyword`           | 로컬                    | 검색 모달 안                                                                                                                                                              |
| 모달 open 플래그 4종      | 로컬                    | ⚠️ 타깃 `11-overlay.md`는 **여러 오버레이를 `overlayType` 유니온 하나로** 묶으라고 한다. S3·S4가 각각 2개씩 boolean을 쓴다 — 이관 시 유니온으로 통합 가능(렌더 결과 동일) |
| `aptList`                 | **서버**                | `['aptList', keyword]`                                                                                                                                                    |

### `signUpInfo` 스토어

```js
const setSignUpInfo = (newSignUpInfo) => {
  signUpInfo.value = { ...signUpInfo.value, ...newSignUpInfo }
}
```

**병합만 한다. 초기화 기능이 없다.**

---

## 네이티브 연동

| 시점                                       | 메시지                                                 |
| ------------------------------------------ | ------------------------------------------------------ |
| S4 가입 성공 후 (`fetchWaitingMemberInfo`) | `SEND_INITIAL_RESIDENT_INFO` (N10) + `END_SPLASH` (N9) |

---

## 엣지케이스

| 상황                                  | 기대 동작                                                |
| ------------------------------------- | -------------------------------------------------------- |
| 필수 약관 미동의                      | 인증 버튼 `disabled` (아웃라인 스타일)                   |
| 마케팅 해제 → 광고 수신도 자동 해제   | 연동 규칙 2                                              |
| 광고 수신 체크 → 마케팅도 자동 체크   | 연동 규칙 3                                              |
| S2에 쿼리스트링 없이 진입             | 접근 거부 모달 → `/`                                     |
| S3에서 뒤로가기                       | 확인 모달 → 확인 시 `/`                                  |
| S4에서 뒤로가기                       | 확인 모달 → 확인 시 **`/signup/info/user`**              |
| S4 직접 진입 (`signUpInfo` 비어 있음) | 접근 거부 모달 → `/`                                     |
| **S3 직접 진입**                      | ⚠️ **차단되지 않는다** (검사 주석 처리). 빈 폼이 보인다  |
| 아파트 미선택 후 제출                 | `aptName` 필수라 폼이 유효하지 않음                      |
| 검색 결과 없음                        | `검색 결과가 없습니다`                                   |
| 가입 중복                             | `이미 등록된 입주민입니다.`                              |
| KMC 인증 만료                         | `인증 유효시간이 만료됐습니다. 다시 시도해주세요.` → `/` |
| 알 수 없는 `termsId`                  | 빈 화면 (AppBar만)                                       |

---

## QA 체크리스트

- [ ] 약관 4개 중 필수 2개만 체크해도 인증 버튼이 활성화되는가
- [ ] "모두 동의" 클릭 시 4개가 모두 체크되는가
- [ ] 개별 4개를 모두 체크하면 "모두 동의"가 자동 체크되는가
- [ ] 마케팅 동의를 해제하면 광고 수신도 함께 해제되는가
- [ ] 광고 수신을 체크하면 마케팅도 함께 체크되는가
- [ ] 약관 항목 `[>]` 클릭 → 약관 상세 iframe이 뜨는가
- [ ] **KMC 인증 사이트로 실제 이동하는가** (외부 폼 POST)
- [ ] KMC에서 돌아왔을 때 이름이 자동으로 채워지는가
- [ ] **선택 약관 동의 여부가 KMC 왕복 후에도 유지되는가** (쿼리스트링)
- [ ] 닉네임 2자 미만/11자 이상/특수문자 → 에러 문구 확인
- [ ] 비밀번호 규칙 미충족 → `영문, 숫자, 특수문자(~!@#$%^&*()?) 3가지 포함 8자 이상`
- [ ] 비밀번호 확인 불일치 → `비밀번호가 일치하지 않습니다`
- [ ] S3 뒤로가기 → `본인인증이 취소됩니다.` 모달 → 확인 시 `/`
- [ ] S4 뒤로가기 → `작성 내용이 모두 지워집니다.` 모달 → 확인 시 S3
- [ ] 아파트 검색: 지역명으로도 조회되는가
- [ ] 검색 모달 오버레이 클릭 시 닫히고, 내부 클릭은 안 닫히는가
- [ ] 호수에 소문자 영문 입력 → `호수는 대문자로만 입력해주세요`
- [ ] 세대주/세대원 선택 시 파란 배경으로 바뀌는가
- [ ] 가입 성공 → 완료 화면 → `확인` → `/`
- [ ] 실기기: KMC 외부 사이트가 웹뷰 안에서 열리는가 (S-Q3)

---

## 이관 시 주의

| #   | 항목                                                                           |
| --- | ------------------------------------------------------------------------------ |
| 1   | **KMC는 외부 폼 POST다.** `preventDefault()` 금지, hidden 필드명 유지          |
| 2   | 선택 동의 flag가 **URL 쿼리스트링으로 왕복**한다. 스토어로 대체 불가           |
| 3   | `tr_url`에 `env.VITE_BASE_URL` 절대 URL 필요                                   |
| 4   | 회원가입 비밀번호는 `PASSWORD_REGEX` **적용**, 로그인은 미적용 — 비대칭이 의도 |
| 5   | `ho` 대문자 검증 `val === val.toUpperCase()` 그대로                            |
| 6   | `dong`은 문자열·숫자 둘 다 허용                                                |
| 7   | `householdHeadFlag`는 문자열 비교로 boolean 생성                               |
| 8   | S3·S4가 AppBar를 화면 안에서 렌더한다 (뒤로가기 모달 때문)                     |
| 9   | `useTermsAgreement`의 `watch` 3개 — 1번은 파생 상태, 2·3번은 이벤트 핸들러     |
| 10  | S3의 죽은 `<style scoped>`(`.custom-date-picker`)는 옮기지 않는다              |
| 11  | zod: `required_error`/`invalid_type_error` → `error` (`zod-migration.md`)      |
| 12  | `useGetAptList`의 `invalidateQueries` v4 시그니처                              |

## `[확인 필요]`

| #        | 질문                                                                                             | 상태                                                           |
| -------- | ------------------------------------------------------------------------------------------------ | -------------------------------------------------------------- |
| ~~S-Q1~~ | ~~`tertiary0`·`primary0`이 오타인가~~                                                            | **확정 — 오타이고 존재하지 않는 클래스다. 고치지 말 것** (§S1) |
| S-Q2     | `setSignUpInfo({})`가 초기화되지 않는 것(병합만 함)이 의도인가? 이전 가입 시도의 데이터가 남는다 | 대기                                                           |
| S-Q3     | 네이티브 웹뷰에서 KMC 외부 POST가 같은 웹뷰에서 열리는가, 시스템 브라우저로 나가는가?            | 실기기 확인                                                    |
| S-Q4     | KMC 콜백이 붙여주는 쿼리 필드의 정확한 목록은? (코드가 `...query`로 전부 받는다)                 | 대기                                                           |
| S-Q5     | S3의 접근 차단 검사가 주석 처리된 것이 의도인가? S4는 활성이라 비대칭                            | 대기                                                           |
| S-Q6     | 빈 키워드 조회(`getAptList('')`)에 서버가 무엇을 주는가?                                         | 서버 응답 확인                                                 |
