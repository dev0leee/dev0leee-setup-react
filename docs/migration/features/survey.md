# 도메인 명세 — 설문조사 (survey)

> 기준 SHA `6d5bf22` · 레거시 `views/SurveyView/` 19개 파일 1,324 LOC
> 타깃 슬라이스 `features/survey/`
> API 6개 (`endpoints.md` #96~#101) · 쿼리 훅 6개 · Pinia 스토어 2개 · 라우트 **14개**(메인 6 + opinion 8)

**Vote와 구조가 대칭이다.** 비회원 딥링크 · KMC 본인인증 · 동적 폼 스키마 · `provide`/`inject` ·
`history.state.auth` 가드 · localStorage 인증 정보 — 전부 같은 패턴이다.

**그러나 실제로는 9군데가 다르다** (§1). "Vote와 같다"로 뭉개면 이관 시 놓친다.

> ⚠️ **화면 ID는 `SV*`, 확인 항목은 `SV-Q*`를 쓴다.**
> `signup.md`가 `S*`·`S-Q*`를, `vote.md`가 `VT*`·`VT-Q*`를 점유했다.

---

## 화면 목록

### 메인 앱 (`router/SurveyIndex.js` — 6개)

| #   | 경로                                          | name                        | 컴포넌트                          | meta                                                  |
| --- | --------------------------------------------- | --------------------------- | --------------------------------- | ----------------------------------------------------- |
| SV1 | `/survey/list`                                | 설문 리스트                 | `SurveyView`                      | AppBar `설문조사` · `backPath:'/main'` · **eager**    |
| SV2 | `/survey/detail/:surveyUuid/:participantUuid` | 설문 상세                   | `Detail/SurveyDetailView`         | AppBar `설문조사 개요` · `backPath:'/survey/list'`    |
| SV3 | `/survey/form/:participantUuid`               | 설문 참여                   | `Form/SurveyFormView`             | AppBar `설문조사 참여` · `backPath:'/survey/list'` 🔴 |
| SV4 | `/survey/completed`                           | 설문 완료                   | `SurveyCompletedView`             | `showAppBar:false`                                    |
| SV5 | `/survey/certification/pass/response`         | 설문조사 본인인증 결과 수신 | `Auth/SurveyAuthPassResponseView` | `showAppBar:false`                                    |
| SV6 | `/survey/certification/namePhone`             | 설문조사 이름 휴대전화 인증 | `Auth/SurveyAuthNamePhoneView`    | AppBar `본인인증`                                     |

### opinion 앱 (`router/SurveyExternalIndex.js` — 8개)

| #    | 경로                                  | name                           | 컴포넌트                          | meta                   |
| ---- | ------------------------------------- | ------------------------------ | --------------------------------- | ---------------------- |
| SV1′ | `/survey/list`                        | 설문 리스트 (외부)             | **`OpinionExternalNotFoundView`** | AppBar `설문조사`      |
| SV3′ | `/survey/form/:participantUuid`       | 설문 참여                      | `Form/SurveyFormView`             | **`showAppBar:false`** |
| SV4′ | `/survey/completed`                   | 설문 완료                      | `SurveyCompletedView`             | `showAppBar:false`     |
| SV7  | `/survey/before`                      | 설문 시작전                    | `SurveyExceptionView`             | `showAppBar:false`     |
| SV8  | `/survey/finish`                      | 설문 종료                      | `SurveyExceptionView`             | `showAppBar:false`     |
| SV5′ | `/survey/certification/pass/response` | 설문 본인인증 결과 수신        | `Auth/SurveyAuthPassResponseView` | `showAppBar:false`     |
| SV6′ | `/survey/certification/namePhone`     | **`설문  이름 휴대전화 인증`** | `Auth/SurveyAuthNamePhoneView`    | AppBar `본인인증`      |
| SV9  | `/survey/:participantUuid`            | 설문 상세                      | `Detail/SurveyDetailView`         | **`showAppBar:false`** |

**전 화면 `showBottomNav: false`.** SV1만 eager.

> ⚠️ **SV1′는 `OpinionExternalNotFoundView`를 렌더한다.** 비회원에게 설문 목록을 줄 수 없어
> **NotFound 화면으로 막아둔 것**이다. `inventory-questions.md` **R-3**에서 "등가 이관"으로 확정.
> **Vote에는 이런 라우트가 없다** — opinion 라우터에 `/vote/list` 자체가 없다. **비대칭.**
>
> ⚠️ **SV6′의 라우트 name에 공백이 2개다** — `설문  이름 휴대전화 인증`.
> 표시되지 않는 name이라 영향 없다. → `deferred.md` 「오타·표기」
>
> ⚠️ **`SurveyExternalIndex.js`에 `// 동적 경로는 맨 뒤에 배치` 주석이 있다.**
> `/survey/:participantUuid`가 `/survey/list`·`/survey/before` 등을 먹지 않도록 순서를 지킨 것.
> **`VoteExternalIndex.js`에도 같은 배치이나 주석은 없다.** 타깃 react-router는 랭킹 기반
> 매칭이라 순서에 덜 민감하지만, **정적 경로를 먼저 선언하는 관례는 유지한다.**
>
> 🔴 **SV3(메인)도 AppBar가 2개 겹친다** — meta `showAppBar:true` + `SurveyFormView`의 자체 `<AppBar>`.
> `vote.md` VT-Q1과 **완전히 같은 문제**다. → `SV-Q1`

### 진입 경로

| 화면 | 진입 출처                                                           |
| ---- | ------------------------------------------------------------------- |
| SV1  | 메인 메뉴 (`constants/domain/common.js:76`)                         |
| SV2  | SV1 목록 클릭                                                       |
| SV3  | SV2 `참여하기`(인증 완료 또는 `AUTH_TYPE.NONE`) · SV5·SV6 인증 성공 |
| SV4  | SV3 제출 성공 (`navigateReplace`)                                   |
| SV5  | **KMC 외부 사이트가 `tr_url`로 POST 리다이렉트**                    |
| SV6  | SV2 `참여하기`(`NAME_PHONE` 인증 타입)                              |
| SV9  | **외부 딥링크** (문자·알림톡의 `/survey/{participantUuid}`)         |
| SV7  | SV9에서 `state === PENDING`이고 리다이렉트 조건 충족 시             |
| SV8  | SV9에서 `state === CLOSE`이고 리다이렉트 조건 충족 시               |

---

## 1. Vote와의 차이 전수 (9건)

**대칭이라 뭉뚱그리기 쉽지만 실제로 다음 9군데가 다르다.** 이관 시 이 표가 체크리스트다.

| #   | 항목             | Vote (전자투표)                           | Survey (설문조사)                                                           |
| --- | ---------------- | ----------------------------------------- | --------------------------------------------------------------------------- |
| 1   | **질문 유형**    | 2종 — `SINGLE_CHOICE` · `MULTIPLE_CHOICE` | **3종** — 위 2개 + **`SUBJECTIVE`**(서술형)                                 |
| 2   | **기타 옵션**    | 없음                                      | **있음** — 옵션 `type === 'SUBJECTIVE'`이면 인라인 텍스트 입력              |
| 3   | **필수/선택**    | 전 질문 필수                              | **`requiredFlag`로 질문별 구분** · `*` 표시 · 비필수 미응답은 제출에서 제외 |
| 4   | **인증 타입**    | `PASS` · `NAME_PHONE`                     | 위 2개 + **`NONE`**(인증 불필요, 바로 참여)                                 |
| 5   | **서명**         | **필수** — `CanvasSign` 모달 후 제출      | **없음** — 버튼 누르면 바로 제출                                            |
| 6   | **상세 탭**      | 2개 (`투표 정보` · `투표 현황`)           | **탭 없음** — 정보만                                                        |
| 7   | **결과 화면**    | 종료 시 질문별 집계·프로그레스 바         | **없음**                                                                    |
| 8   | **제출 형식**    | `FormData` (multipart, 서명 파일 포함)    | **JSON**                                                                    |
| 9   | **opinion 목록** | 라우트 자체가 없음                        | `/survey/list` → **`OpinionExternalNotFoundView`** (R-3)                    |

### 🔴 추가로, 비회원 리다이렉트 조건이 반대다

```js
// VoteDetailView.vue
if (!isOpinionExternal || isUser) return // ← OR

// SurveyDetailView.vue
if (!isOpinionExternal && isUser) return // ← AND
```

| 상황                   | Vote                 | Survey               |
| ---------------------- | -------------------- | -------------------- |
| 메인 앱 + 로그인       | 리다이렉트 **안 함** | 리다이렉트 **안 함** |
| 메인 앱 + **비로그인** | 리다이렉트 **안 함** | **리다이렉트 함** 🔴 |
| opinion + 로그인       | 리다이렉트 **안 함** | **리다이렉트 함**    |
| opinion + 비로그인     | 리다이렉트 함        | 리다이렉트 함        |

> 🔴 **메인 앱에서 비로그인 상태로 SV2에 들어가면 `/survey/before`·`/survey/finish`로 보낸다.**
> **그런데 메인 라우터에는 그 두 경로가 없다** (opinion 전용). → **NotFound로 떨어진다.**
>
> 실제 도달 가능성: 메인 앱의 `/survey/detail/...`이 인증 필요 라우트라면 라우터 가드가
> 먼저 로그인으로 보낸다. **`routes.md`의 guard 5단계 확인이 필요하다.**
> → `[확인 필요]` SV-Q2 🔴
>
> **어느 쪽이 의도인지 불명확하다.** 등가 이관 원칙상 **Survey는 Survey대로, Vote는 Vote대로**
> 그대로 옮긴다. 통일하지 않는다.

---

## 2. 하위 컴포넌트 전수 (19개)

| 파일                                  |  줄 | 역할                            | 사용 화면  |
| ------------------------------------- | --: | ------------------------------- | ---------- |
| `SurveyView.vue`                      |  28 | SV1 셸 (필터 탭 + 목록)         | SV1        |
| `List/SurveyList.vue`                 |  80 | 무한스크롤 목록                 | SV1        |
| `List/SurveyListItem.vue`             |  95 | 설문 카드 1개                   | SV1        |
| `Detail/SurveyDetailView.vue`         |  87 | SV2·SV9 셸                      | SV2 · SV9  |
| `Detail/SurveyDetailTitle.vue`        |  48 | 상태 칩 + 그룹명 + 제목 + D-day | 〃         |
| `Detail/SurveyDetailInfo.vue`         |  84 | 기본정보 3필드                  | 〃         |
| `Detail/SurveyDetailButton.vue`       |  85 | 하단 버튼 상태머신              | 〃         |
| `Detail/SurveyDetailAuthButton.vue`   |  44 | 인증 타입 분기                  | 〃         |
| `Detail/SurveyDetailPassButton.vue`   |  66 | **KMC 폼 POST**                 | 〃         |
| `Detail/SurveyDetailMoveButton.vue`   |  26 | 인증 완료 시 폼으로             | 〃         |
| `Form/SurveyFormView.vue`             |  76 | SV3 셸 (`provide`)              | SV3 · SV3′ |
| `Form/SurveyFormQuestion.vue`         |  28 | 유형 분기 + `provide`           | 〃         |
| `Form/SurveyFormQuestionText.vue`     |  77 | **서술형 질문**                 | 〃         |
| `Form/SurveyFormQuestionChoice.vue`   |  67 | 선택형 질문                     | 〃         |
| `Form/SurveyFormOptionItem.vue`       |  82 | 선택지 1개 (+ **기타 입력**)    | 〃         |
| `Auth/SurveyAuthNamePhoneView.vue`    | 154 | SV6 이름+휴대폰 인증            | SV6 · SV6′ |
| `Auth/SurveyAuthPassResponseView.vue` |  57 | SV5 KMC 응답 수신               | SV5 · SV5′ |
| `SurveyCompletedView.vue`             |  94 | SV4 완료                        | SV4 · SV4′ |
| `SurveyExceptionView.vue`             |  46 | SV7·SV8 시작전/종료             | SV7 · SV8  |

**죽은 파일 없음.** `OpinionExternalNotFoundView`는 `exception.md` 소관.

---

## 3. `provide` / `inject` 폼 트리

**Vote와 같은 2단계 구조이나 컨텍스트 내용이 다르다.**

```
SurveyFormView
  provide('surveyFormContext', { questionList, setFieldValue,
                                 getQuestionError, isCreateSurveyFormPending })
  │
  └─ SurveyFormQuestion (질문마다)
       provide('surveyQuestionContext', { question, questionIndex })
       │
       ├─ SurveyFormQuestionText   (SUBJECTIVE)  → inject 둘 다
       └─ SurveyFormQuestionChoice (그 외)       → inject 둘 다
            │
            └─ SurveyFormOptionItem
                 useSurveyOptionItem() → inject 둘 다
```

**Vote와 달리 `handleSubmit`·`validate`·`submitWithSign`을 컨텍스트에 넣지 않는다** —
제출 버튼이 `SurveyFormView` 안에 직접 있기 때문(서명 모달이 없어 분리할 이유가 없다).

**대신 `setFieldValue`와 `getQuestionError`가 들어간다** — 기타 옵션 처리와 에러 조회용.

### 🔴 `isCreateSurveyFormPending`이 항상 `undefined`다 — Vote와 동일한 버그

```js
// useSurveyForm.js — 반환
return { surveyDetailForm, isSurveyFormLoading, isPostSurveyFormPending, questionList,
         setFieldValue, getQuestionError, moveToDetail, onSubmit };

// SurveyFormView.vue — 구조분해
const { surveyDetailForm, isSurveyFormLoading, isCreateSurveyFormPending, ... } = useSurveyForm();
//                                              ^^^^^^^^^^^^^^^^^^^^^^^^^^ 반환되지 않는 키
```

| 소비처                 | 코드                                               | 결과                           |
| ---------------------- | -------------------------------------------------- | ------------------------------ |
| `SurveyFormView` 버튼  | `:disabled="isCreateSurveyFormPending"`            | **제출 중에도 안 잠긴다**      |
| 〃                     | `<SpinnerCircle v-if="isCreateSurveyFormPending">` | **스피너가 안 뜬다**           |
| `SurveyFormOptionItem` | `<Field :disabled="isCreateSurveyFormPending">` ×2 | 제출 중에도 선택지가 조작 가능 |

> 🔴 **`vote.md` §3과 같은 오타가 두 도메인에 동일하게 존재한다.**
> `usePostXxxForm` → `isPostXxxFormPending` → 화면에서 `isCreateXxxFormPending`으로 받는 패턴.
> **한쪽을 베껴 만들면서 같이 옮겨간 것으로 보인다.**
>
> **결정은 `vote.md` VT-Q2와 묶어서 한 번에 한다.** 고치면 두 도메인 모두
> 제출 중 잠금·스피너가 새로 생긴다. → `SV-Q3`

---

## 4. 폼 스키마 — `discriminatedUnion` + 조건부 검증

**Vote보다 복잡하다.** 질문 유형 3종을 `z.discriminatedUnion('questionType', [...])`으로 가르고,
`superRefine`에서 `requiredFlag`·`minChoice`/`maxChoice`·기타 입력을 검증한다.

```js
surveyFormSchema = (serverQuestionList) => toTypedSchema(
  z.object({
    questionList: z.array(z.discriminatedUnion('questionType', [
      z.object({ questionType: z.literal(SUBJECTIVE),
                 questionUuid: z.string(), subjectiveAnswer: z.string().optional() }),
      z.object({ questionType: z.literal(SINGLE_CHOICE),   ...choiceQuestionSchema }),
      z.object({ questionType: z.literal(MULTIPLE_CHOICE), ...choiceQuestionSchema }),
    ])),
  }).superRefine(...)
);

// choiceQuestionSchema
{ questionUuid: z.string(),
  optionList: z.union([z.string(), z.array(z.string())]).optional(),
  etcFlag: z.boolean().optional(),
  etcContent: z.string().optional() }
```

### `superRefine` 검증 순서

**질문마다 순서대로 실행된다.** `serverQuestion`을 못 찾으면 통째로 건너뛴다.

| 순서 | 조건                                                                                            | 메시지                               | 경로                               |
| ---- | ----------------------------------------------------------------------------------------------- | ------------------------------------ | ---------------------------------- |
| 0    | 선택형 + `serverQuestion.etcFlag` + `question.etcFlag` + 기타 옵션 선택됨 + 기타 입력 비어 있음 | `기타 답변을 입력해주세요`           | `questionList[i].etcContent`       |
| 1    | `SUBJECTIVE` + `requiredFlag` + 답변 공백                                                       | `답변을 입력해주세요`                | `questionList[i].subjectiveAnswer` |
| 2a   | `MULTIPLE_CHOICE` + 비필수 + 미선택                                                             | **검증 통과** (스킵)                 | —                                  |
| 2b   | `MULTIPLE_CHOICE` + 필수 + 미선택                                                               | `최소 {min}개를 선택해주세요`        | `questionList[i].optionList`       |
| 2c   | `MULTIPLE_CHOICE` + `selectedCount < min`                                                       | `최소 {min}개를 선택해주세요`        | 〃                                 |
| 2d   | `MULTIPLE_CHOICE` + `selectedCount > max`                                                       | `최대 {max}개까지만 선택 가능합니다` | 〃                                 |
| 3    | `SINGLE_CHOICE` + `requiredFlag` + 미선택                                                       | `옵션을 선택해주세요`                | 〃                                 |

> **비필수 선택형은 선택을 했다면 필수/비필수와 무관하게 min/max를 검증한다.**
> 소스 주석에 명시돼 있다.
>
> ⚠️ **`min`·`max` 기본값이 `0`이다** (`serverQuestion.minChoice || 0`).
> 서버가 안 주면 `selectedCount > 0`인 순간 `최대 0개까지만 선택 가능합니다`가 뜬다. 🔴
> → `[확인 필요]` SV-Q4
>
> ⚠️ **`selectedCount = question.optionList?.length || 0`** — 단일 선택은 `optionList`가
> **문자열**이라 `.length`가 **글자 수**가 된다. `SINGLE_CHOICE`는 순서 3에서
> `question.optionList?.length > 0`으로만 보므로 무해하지만, **의미상 틀렸다.**
>
> **zod 4 이관**: `discriminatedUnion` API는 v4에서 유지된다. `required_error` 미사용.
> `z.ZodIssueCode.custom` → `'custom'` **6곳**(라인 89·113·133·143·152·175)은
> **`zod-migration.md` §2에 이미 정리돼 있다.** 별도 조사 불필요.

### 🔴 `getQuestionError`의 접두사 매칭이 잘못됐다

```js
const getQuestionError = ({ questionIndex }) => {
  const prefix = `questionList[${questionIndex}]`
  const errorKey = Object.keys(errors.value).find((key) => key.startsWith(prefix))
  return errorKey ? errors.value[errorKey] : undefined
}
```

**`questionList[1]`은 `questionList[10]`·`questionList[11]`…의 접두사이기도 하다.**

> 🔴 **질문이 11개 이상인 설문에서, 2번 질문(index 1)에 에러가 없어도
> 11번 질문(index 10)의 에러가 2번 질문 아래에 표시될 수 있다.**
> `Object.keys` 순서상 먼저 발견된 것이 반환된다.
>
> **접두사에 `.`을 붙이면(`questionList[1].`) 해결되지만 화면이 달라진다.**
> → `deferred.md` 「동작 의심」. **이관 시 그대로** · `[확인 필요]` SV-Q6

### 에러 포커스

`focusFirstError(errors)` — `vote.md` §4와 동일 (`shared`로 올릴 유틸).

---

## 5. 상태 저장 — Pinia 2개 (Vote와 동일 구조)

### `useSurveyCertStore` (persist)

`useStorage('surveyCertInfo', {}, localStorage)` — **키만 다르고 구현은 `useVoteStorage`와 동일.**

| 키                    | 설정 시점                       | 소비처                   |
| --------------------- | ------------------------------- | ------------------------ |
| `surveyUuid`          | SV2/SV9 `onMounted`             | 회원 상세 경로 생성      |
| `participantUuid`     | 〃                              | SV5·SV6 인증 · 경로 생성 |
| `isTriedVerification` | 〃 `undefined` → SV5에서 `true` | SV5 중복 인증 방지       |

**`SurveyDetailView`의 저장 조건이 Vote보다 정교하다**:

```js
const isParamsValidForUser =
  validateQueryEnabledParams(surveyUuid) && validateQueryEnabledParams(participantUuid)
const isParamsValidForNonResident =
  validateQueryEnabledParams(surveyUuid) || validateQueryEnabledParams(participantUuid)
const isParamsValid = isOpinionExternal ? isParamsValidForNonResident : isParamsValidForUser
if (isParamsValid)
  setSurveyCertInfo({ surveyUuid, participantUuid, isTriedVerification: undefined })
```

> **opinion 경로(`/survey/:participantUuid`)에는 `surveyUuid`가 없으므로 `OR`로 판정한다.**
> `VoteDetailView`는 이런 가드 없이 무조건 저장한다. **Survey가 더 방어적이다.**
>
> ⚠️ **`initSurveyCertInfo`도 호출부가 없다** (Vote와 동일). → `deferred.md` 「죽은 코드」

### `useSurveyDetailStore` (메모리)

`surveyDetail = ref()` — `SurveyDetailView`가 서버 데이터를 복사해 넣고,
`SurveyDetailButton`·`SurveyDetailAuthButton`·`SurveyDetailPassButton`이 읽는다.

> 🔴 **`SurveyDetailButton`이 두 소스를 섞어 쓴다.**
>
> ```js
> const { surveyDetailInfo } = useGetSurveyDetailInfo() // 쿼리
> const surveyDetailStore = useSurveyDetailStore() // 스토어(같은 데이터의 복사본)
> state = surveyDetailInfo.value?.state // 쿼리에서
> isNoneType = surveyDetailStore.surveyDetail?.authType // 스토어에서
> authFlag = surveyDetailStore.surveyDetail?.authFlag // 스토어에서
> respondentState = surveyDetailInfo?.respondentState // 쿼리에서
> ```
>
> **같은 응답의 필드를 절반씩 다른 곳에서 읽는다.** 스토어는 `watch`로 채워지므로
> 한 틱 늦다. → 타깃에서는 **쿼리 하나로 통일**한다 (`tech-mapping.md` 3-3). 렌더 결과 동일.
>
> ⚠️ **`surveyDetailInfo?.respondentState`** — `surveyDetailInfo`는 Ref다.
> 템플릿에서는 자동 언랩되지만 `.value` 없이 `?.respondentState`를 읽으면 **항상 `undefined`**다.
> 이 코드는 **템플릿 안**(`v-if`)에 있어 언랩되므로 정상 동작한다. 혼동하기 쉬운 지점.

---

## 6. 공통 인프라

### 6-1. 상수 — `constants/domain/survey.js` 전문

| 심볼                      | 내용                                                                                                          |
| ------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `AUTH_TYPE`               | **`NONE`** · `PASS` · `NAME_PHONE` ← Vote에는 `NONE`이 없다                                                   |
| `SURVEY_STATE`            | `PENDING` · `PROGRESS` · `CLOSE`                                                                              |
| `STATUS_LIST`             | `PENDING`→`시작전`(gray) · `PROGRESS`→`진행중`(blue) · `CLOSE`→`종료`(darkGray)                               |
| `PARTICIPANT_STATE`       | `PENDING` · `PARTICIPATED` · `NOT_PARTICIPATED`                                                               |
| `PARTICIPANT_STATE_LABEL` | `PENDING`→`미완료` · `PARTICIPATED`→`참여완료` · `NOT_PARTICIPATED`→`설문불참`                                |
| `QUESTION_TYPE`           | `SINGLE_CHOICE` · `MULTIPLE_CHOICE` · **`SUBJECTIVE`**                                                        |
| `LIST_PAGE_FILTER_LIST`   | `{uuid: PENDING, category:'시작전'}` · `PROGRESS/진행중` · `CLOSE/종료`                                       |
| `LIST_ITEM_FIELD`         | `participantStatus`(참여상태) · `openSurveyDateTime`(설문 시작 일시) · `closeSurveyDateTime`(설문 종료 일시)  |
| `DETAIL_PAGE_INFO_FIELD`  | `period`(설문 기간/`CalendarDate`) · `joinState`(참여 상태/`User`) · `content`(상세내용/`InfoCircleDarkGray`) |

> ⚠️ **`STATUS_LIST`의 키가 `state`다** (Vote의 `STATE_LIST`는 `status`).
> 서버 응답 필드도 Survey는 `state`, Vote는 `voteStatus`다.
>
> ⚠️ **Vote의 `LIST_ITEM_FIELD`에는 `voteType`(유형)이 있는데 Survey에는 없다.**
> 설문에는 유형 구분이 없기 때문. `DETAIL_PAGE_INFO_FIELD`도 3개(Vote는 4개).

### 6-2. 목록 조회 — `useGetSurveyList`

`useInfiniteList` · `queryKey: 'surveyList'` · `defaultStoreKey: ['aptResidentUuid']`
`additionalParams: { state }`

**API**: `getSurveyList` — `GET /board/resident/{aptResidentUuid}/survey?page&state` (`auth`)

> 🔴 **`enable`을 넘긴다** — `vote.md` §7-5와 **완전히 같은 오타**.
> `useInfiniteList`가 받지 않아 무시된다. 이관 시 제거.
>
> ⚠️ **`size` 파라미터를 API가 안 받는다** — Vote와 동일. → `SV-Q7`
>
> ✅ **`watch(error)`에 `if (!newError?.data?.error) return;` 가드가 있다.**
> **Vote의 4개 훅에는 없다.** Survey가 더 방어적이다 (`useGetSurveyDetailInfo`·
> `useGetSurveyForm`·`useGetSurveyList` 3곳 모두). `usePatchSurvey*`의 `onError`에는 없다.

### 6-3. KMC 본인인증 — `SurveyDetailPassButton`

**`vote.md` §6-3과 동일한 구조.** `tr_url`만 `/survey/certification/pass/response`.

```js
const kcmType = computed(() =>
  isOpinionExternal ? KMC_TYPE_FOR_URL_CODE.NON_USER_VOTE : KMC_TYPE_FOR_URL_CODE.USER_VOTE,
)
```

> 🔴 **설문인데 `USER_VOTE`/`NON_USER_VOTE` 코드를 쓴다.**
> `KMC_TYPE_FOR_URL_CODE`에는 `JOIN` · `USER_VOTE` · `NON_USER_VOTE` 3개뿐이고
> **설문 전용 코드가 없다.** 서버가 이 코드로 KMC 서명값을 만들어 준다.
>
> **서버 계약이므로 그대로 유지한다.** 설문 전용 코드를 새로 만들면 서버도 함께 바꿔야 한다.
> → `deferred.md` 「서버 계약 정리」 · `[확인 필요]` SV-Q8

```js
const isParticipated = computed(
  () => surveyDetailStore.surveyDetail?.respondentState === PARTICIPANT_STATE.NOT_PARTICIPATED,
)
```

> ⚠️ **변수명이 의미와 반대다.** `isParticipated`인데 `NOT_PARTICIPATED`(설문불참)를 검사한다.
> `:disabled="isParticipated"` → **설문불참으로 표시된 사람은 참여 버튼이 잠긴다.**
> 동작 자체는 의도로 보이나 이름이 틀렸다. → `deferred.md` 「오타·표기」
>
> **`PARTICIPATED`(참여완료)일 때는 `SurveyDetailButton`이 `참여완료` 비활성 버튼을 대신 렌더**하므로
> `PassButton`이 아예 안 나온다.

### 6-4. 접근 가드 — `history.state.auth`

**`vote.md` §6-4와 동일.** 3곳(SV3·SV4·SV6)에서 같은 패턴.

| 화면                      | 모달 닫기 후 이동                      |
| ------------------------- | -------------------------------------- |
| SV3 (`useForbiddenError`) | `authStore.isLoggedIn ? '/main' : '/'` |
| SV4 (인라인)              | `isOpinionExternal ? '/' : '/main'`    |
| SV6 (인라인)              | **`/survey/list`**                     |

> ⚠️ **SV6′(opinion)에서 닫으면 `/survey/list`로 가는데, opinion에는 그 라우트가
> `OpinionExternalNotFoundView`로 존재한다.** → **NotFound 화면이 뜬다.**
> **Vote(VT6′)는 `/vote/list` 라우트가 아예 없어 매칭 실패**였다.
> **같은 문제의 결과가 다르다** — Survey는 NotFound 화면, Vote는 라우트 미매칭.
> → `vote.md` VT-Q5와 묶어서 결정.

### 6-5. 네이티브 뒤로가기 분기

| 앱      | 경로                                   | 이동 대상                                       |
| ------- | -------------------------------------- | ----------------------------------------------- |
| 메인    | `/survey/list`                         | `/main`                                         |
| 메인    | `/survey/form*`                        | `/survey/detail/{surveyUuid}/{participantUuid}` |
| 메인    | `/survey/detail*`                      | `/survey/list`                                  |
| opinion | `/survey/form*` · `/survey/completed*` | `/survey/{participantUuid}`                     |

**메인은 `useNativeBackButton`, opinion은 `OpinionApp.vue`가 각각 처리한다.**
둘 다 `surveyCertStore`에서 uuid를 읽는다.

> ⚠️ **`OpinionApp.vue`가 `emitter.on`을 setup에서 등록하고 `off`하지 않는다.**
> 앱 루트라 언마운트되지 않으므로 실질 문제는 없다. (`visit.md` §4-1과 같은 패턴이지만 위치가 다르다)

---

## 7. 도메인 전역 결함

| #    | 항목                                                                                                                                                                                     |
| ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 7-1  | 🔴 `isCreateSurveyFormPending`이 `undefined` — 제출 중 버튼·선택지 미잠금, 스피너 미표시 (§3)                                                                                            |
| 7-2  | 🔴 `getQuestionError`의 접두사 매칭 — 11번째 이후 질문의 에러가 앞 질문에 표시될 수 있다 (§4)                                                                                            |
| 7-3  | 🔴 비회원 리다이렉트 조건이 Vote와 반대 — 메인 앱 비로그인 시 없는 경로로 보낸다 (§1)                                                                                                    |
| 7-4  | `useGetSurveyList`가 `enable`(오타)을 넘긴다 (§6-2) — Vote와 동일                                                                                                                        |
| 7-5  | `SurveyList`의 `watchEffect`가 `hasSurveyListNextPage`(Ref)를 `.value` 없이 검사 — 항상 truthy                                                                                           |
| 7-6  | `SurveyListItem`에서 `statusInfo.color`는 옵셔널 **없고** `statusInfo?.label`은 **있다.** Vote는 정반대(`statusInfo?.color` / `statusInfo.label`). **두 파일이 서로 다른 쪽을 빠뜨렸다** |
| 7-7  | `SurveyDetailTitle`의 `<h2 v-dompurify-html>` 안 `<span class="opacity-0">` — innerHTML에 덮여 렌더 안 됨                                                                                |
| 7-8  | `SurveyDetailTitle` 루트의 `center` 클래스 — **정의 없음** (`broken-styles.md` §4)                                                                                                       |
| 7-9  | `SurveyDetailTitle` 그룹명의 `max-w-1/2` — **미생성** (`broken-styles.md` §3)                                                                                                            |
| 7-10 | `SurveyAuthPassResponseView.handleCertification`의 조기 이동 분기에 **`return` 누락** — Vote와 동일                                                                                      |
| 7-11 | `SurveyAuthNamePhoneView`의 소제목이 **`투표자 정보`** — 설문인데 투표 문구                                                                                                              |
| 7-12 | `usePatchSurveyCert*`의 주석이 `// 회원 투표` · `// 비회원 투표` — Vote에서 복사한 흔적                                                                                                  |
| 7-13 | `SurveyExceptionView`의 문구 `설문가 아직 시작되지 않았습니다.` — 조사 오류(`설문이`)                                                                                                    |
| 7-14 | `SurveyFormView`가 로딩 중에도 `<form>`을 렌더한다 (`SpinnerDots`와 형제). Vote는 `v-else`로 감싼다                                                                                      |
| 7-15 | `SurveyDetailButton`이 쿼리와 스토어에서 필드를 절반씩 읽는다 (§5)                                                                                                                       |

> **7-6은 흥미롭다.** 같은 코드를 복사하면서 **서로 다른 쪽에 옵셔널을 빠뜨렸다.**
> `statusInfo`가 `undefined`가 되는 경우(서버가 모르는 상태값을 주는 경우) **두 화면이 다르게 깨진다.**
>
> **7-11·7-12·7-13은 표시 문구/주석이라 등가 이관 원칙에 따라 그대로 둔다.**
> → `deferred.md` 「오타·표기」

---

# SV1. 설문 리스트 — `/survey/list` (메인 전용)

`SurveyView.vue` (28줄) + `List/SurveyList.vue` (80줄) + `List/SurveyListItem.vue` (95줄)

```
┌─────────────────────────────┐
│ ← 설문조사                   │
├─────────────────────────────┤
│ (전체)(시작전)(진행중)(종료)  │  TabCategory has-total-type pb-4
├─────────────────────────────┤
│ ┌─────────────────────────┐ │
│ │ [진행중] 1단지 …   D-3   │ │
│ │ 주차장 이용 만족도 조사   │ │
│ │ ─────────────────────── │ │
│ │ 참여상태         미완료   │ │
│ │ 설문 시작 일시  2026-07-… │ │
│ │ 설문 종료 일시  2026-08-… │ │
│ └─────────────────────────┘ │
└─────────────────────────────┘
```

**클래스는 `vote.md` VT1과 완전히 동일하다** — 루트 `h-full`, `<ul>` `h-full w-full space-y-3
overflow-auto px-5 py-6 pb-14`, `<li>` `flex w-full flex-col gap-3 rounded-lg border
border-defaults-tertiary-border-tertiary px-3 py-4 shadow-[0px_4px_8px_-2px_rgba(16,24,40,0.10)]`,
그룹명 `truncate … pretendard-13Regular`, 제목 `truncate text-[#364152] pretendard-16SemiBold`.

**빈 상태 문구만 다르다**: `등록된 설문이 없습니다`

**필드 렌더** (`LIST_ITEM_FIELD` — 3개, Vote는 4개):

| 키                    | 렌더                                                 |
| --------------------- | ---------------------------------------------------- |
| `participantStatus`   | `PARTICIPANT_STATE_LABEL[info.respondentState]`      |
| `openSurveyDateTime`  | `formatIsoStringDate(info.startDateTime).dateTime()` |
| `closeSurveyDateTime` | `formatIsoStringDate(info.endDateTime).dateTime()`   |

> ✅ **D-day 조건이 정확하다** — `info?.state === SURVEY_STATE.PENDING` + `calculateDday(info.startDateTime)`.
> **`vote.md` §7-2의 `info?.state === 'BEFORE'` 버그가 여기엔 없다.**
> **Survey 목록에는 D-day가 정상 표시된다.** 등가 이관 시 두 도메인의 동작이 다르다는 점에 주의.
>
> ⚠️ **필드 키와 실제 읽는 서버 필드가 다르다.** `LIST_ITEM_FIELD`의 `key`는
> `openSurveyDateTime`인데 `renderFieldValue`는 `value.startDateTime`을 읽는다.
> **상수의 `key`는 라벨 매핑용일 뿐 데이터 접근에 안 쓰인다.** 혼동하기 쉽다.
>
> 🔴 **`statusInfo.color`에 옵셔널이 없다** (§7-6). `state`가 `STATUS_LIST`에 없으면 TypeError.
>
> ⚠️ **상세 이동**: `navigateTo('/survey/detail/{item.surveyUuid}/{item.respondentUuid}')`
> — **`respondentUuid`**가 URL의 `participantUuid` 자리에 들어간다. 서버 필드명과 라우트 파라미터명이 다르다.

**스크롤 복원**: `useInfiniteScrollPosition({ moveFrom: '/detail', moveTo: '/survey/list' })`

## QA 체크리스트

- [ ] 필터 4종 전환
- [ ] 상태 칩 색 3종
- [ ] **D-day가 보이는가** (Vote 목록과 달리 정상)
- [ ] 카드 클릭 → SV2
- [ ] 상세 → 뒤로 시 스크롤 복원
- [ ] 0건 시 `등록된 설문이 없습니다`

---

# SV2 · SV9. 설문 상세

`Detail/SurveyDetailView.vue` (87줄) — **메인 `/survey/detail/:surveyUuid/:participantUuid` ·
opinion `/survey/:participantUuid`**

```
┌─────────────────────────────┐
│ ← 설문조사 개요              │  메인만
├─────────────────────────────┤
│    [진행중] 1단지 …          │  SurveyDetailTitle
│    주차장 이용 만족도 조사    │
├─────────────────────────────┤
│ 설문 기본정보                │  SurveyDetailInfo (탭 없음)
│ 📅 설문 기간                 │
│    2026-07-29 09:00 ~ …     │
│ 👤 참여 상태     미완료      │
│ ℹ️ 상세내용 (Quill)          │
├─────────────────────────────┤
│ [        참여하기        ]   │  SurveyDetailButton (fixed)
└─────────────────────────────┘
```

**`vote.md` VT2와 달리 `TabBase`가 없다.** `<section>` 안에 `SurveyDetailInfo` 하나뿐.

| 요소 | 클래스 (원문)                 |
| ---- | ----------------------------- |
| 루트 | `h-full w-full overflow-auto` |

## 제목 — `SurveyDetailTitle` (48줄)

**`vote.md`의 `VoteDetailTitle`과 클래스가 완전히 동일하다** — 루트 `center flex flex-col
items-center gap-3 px-6 py-5`, 그룹명 `max-w-1/2 text-center …`, 제목 `text-center
text-[#364152] pretendard-18SemiBold`.

**차이**: 상태 판정이 `STATUS_LIST.find((item) => item.state === surveyDetailInfo?.state)`
(Vote는 `item.status === voteDetailInfo?.voteStatus`).

> ⚠️ **`center`(정의 없음) · `max-w-1/2`(미생성) · 죽은 `<span class="opacity-0">`
> 세 가지가 Vote와 동일하게 존재한다** (§7-7~7-9).
>
> ✅ **`statusInfo?.color`·`statusInfo?.label` 둘 다 옵셔널이다.** 목록(SV1)과 반대.

## 기본정보 — `SurveyDetailInfo` (84줄)

| 요소      | 클래스 (원문)                                                                        |
| --------- | ------------------------------------------------------------------------------------ |
| 루트      | `space-y-4 p-5 pb-14`                                                                |
| 소제목    | `text-defaults-tertiary-text-tertiary pretendard-14SemiBold` → `설문 기본정보`       |
| 목록      | **`flex flex-col gap-4 pb-5`** ← Vote는 `space-y-4 pb-5`                             |
| 항목      | `flex gap-3`                                                                         |
| 아이콘 원 | `flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100`        |
| 라벨      | `flex h-8 items-center text-defaults-secondary-text-secondary pretendard-14SemiBold` |
| 값        | `text-defaults-secondary-text-secondary pretendard-14Regular`                        |
| 상세내용  | 위 + `pr-8` (`v-dompurify-html`)                                                     |
| 로딩      | `SkeletonBase class="h-5 w-full rounded-lg"`                                         |

**필드 렌더** (3개):

| 키          | 렌더                                                                                            |
| ----------- | ----------------------------------------------------------------------------------------------- |
| `period`    | `formatIsoStringDate(startDateTime).dateTime()` ~ `formatIsoStringDate(endDateTime).dateTime()` |
| `joinState` | `PARTICIPANT_STATE_LABEL[respondentState]`                                                      |
| `content`   | `convertDeltaToHtml(content)` — **Quill Delta**                                                 |

> ⚠️ **`period` 가공 방식이 Vote와 다르다.** Vote는 `replace('T', ' ')`(초까지 노출),
> Survey는 `formatIsoStringDate(...).dateTime()`. **표시 형식이 다르다.**
> → `[확인 필요]` SV-Q9

## 비회원 리다이렉트 (§1 참조)

```js
watch(
  surveyDetailInfo,
  (newValue) => {
    if (!newValue) return
    setSurveyDetail(newValue)
    if (!isOpinionExternal && isUser) return // 🔴 Vote는 ||
    switch (newValue?.state) {
      case SURVEY_STATE.PENDING:
        navigateTo('/survey/before')
        break
      case SURVEY_STATE.CLOSE:
        navigateTo('/survey/finish')
        break
    }
  },
  { immediate: true },
)
```

## 하단 버튼 — `SurveyDetailButton` 상태머신 (85줄)

```
state === PENDING  → [비활성] "{startDateTime} 오픈"
state === CLOSE    → [비활성] "종료"
state === PROGRESS
  ├ respondentState === PARTICIPATED  → [비활성] "참여완료"
  └ 미참여
     ├ authFlag === true  또는  authType === NONE  → SurveyDetailMoveButton → /survey/form/{uuid}
     └ 그 외                                        → SurveyDetailAuthButton
          ├ authType === PASS       → SurveyDetailPassButton (KMC 폼 POST)
          └ NAME_PHONE              → /survey/certification/namePhone
```

**`AUTH_TYPE.NONE`이 Vote와의 핵심 차이다** — 인증 없이 바로 참여할 수 있는 설문이 있다.

> ⚠️ **`surveyOpenTime = surveyDetailInfo.value?.startDateTime.replace('T', ' ')`**
> — `?.`가 `startDateTime`까지만 걸려 `.replace`에는 없다. Vote와 동일한 패턴.
>
> ⚠️ **`SurveyDetailMoveButton`은 `getParams().participantUuid`를 직접 읽는다.**
> `VoteDetailMoveButton`은 스토어에서 읽는다. **Survey가 더 단순하다.**

## QA 체크리스트

- [ ] 메인/opinion 양쪽 진입
- [ ] **탭이 없는가** (Vote와 다름)
- [ ] 상태별 버튼 5가지 (오픈예정/종료/참여완료/참여하기(인증완료 또는 NONE)/참여하기(인증필요))
- [ ] `AUTH_TYPE.NONE` 설문에서 인증 없이 바로 SV3로 가는가
- [ ] `PASS` → KMC, `NAME_PHONE` → SV6
- [ ] **메인 앱 비로그인 상태에서 SV2 진입 시 어떻게 되는가** (§1, SV-Q2)
- [ ] 설문 기간 표시 형식 (Vote와 다름, SV-Q9)

---

# SV3. 설문 참여 — `/survey/form/:participantUuid` (메인 · opinion 공용)

`Form/SurveyFormView.vue` (76줄) + 하위 4개

```
┌─────────────────────────────┐
│ ←  설문조사 참여             │  화면 내 <AppBar> (메인은 중복 🔴)
├─────────────────────────────┤
│ * 표시는 필수 질문임          │  TextError (안내용으로 전용)
│                             │
│ 1. 주차장을 얼마나 이용하시나요? *│
│    1개 선택 가능             │
│ ┌─────────────────────────┐ │
│ │ ○ 매일                   │ │
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
│ │ ○ 기타 [___________]     │ │  기타 옵션 = 인라인 입력
│ └─────────────────────────┘ │
│                             │
│ 2. 개선점을 자유롭게 적어주세요 │
│    아래 영역에 답변을 작성해주세요(200자 제한)│
│ ┌─────────────────────────┐ │
│ │                    0/200 │ │  서술형 textarea
│ └─────────────────────────┘ │
│                             │
│ [        제출하기        ]   │  fixed bottom-0
└─────────────────────────────┘
```

| 요소      | 클래스 (원문)                                                                                                        |
| --------- | -------------------------------------------------------------------------------------------------------------------- |
| 루트      | `h-full`                                                                                                             |
| AppBar    | `<AppBar class="bg-base-b-white" title="설문조사 참여" :navigate-fn="() => moveToDetail()">`                         |
| 폼        | `h-full overflow-auto p-5 pb-20`                                                                                     |
| 필수 안내 | `<TextError class="mb-6">* 표시는 필수 질문임</TextError>`                                                           |
| 질문 목록 | `space-y-6` (`<ol>`)                                                                                                 |
| 제출 버튼 | `color="brand" round-type="square" size="2xl" custom-class="fixed bottom-0 left-0 flex justify-center"` → `제출하기` |

> ⚠️ **`TextError`를 안내 문구로 쓴다.** 에러가 아닌데 에러 스타일(빨강)로 표시된다.
> **의도로 보인다**(필수 표시 `*`도 빨강). 그대로.
>
> ⚠️ **로딩 중에도 `<form>`이 렌더된다** (§7-14). `SpinnerDots`가 형제 요소라
> **스피너 아래에 빈 폼이 함께 존재한다.** `SpinnerDots`가 `fixed z-[9999]` 전체 오버레이라
> 시각적으로는 가려진다. Vote는 `v-else`로 감싼다. **비대칭.**

## 질문 유형 분기 — `SurveyFormQuestion` (28줄)

```html
<SurveyFormQuestionText v-if="question.type === QUESTION_TYPE.SUBJECTIVE" />
<SurveyFormQuestionChoice v-else />
```

> ⚠️ **서버 필드는 `question.type`이고 폼 필드는 `questionType`이다.**
> `createInitialQuestion`이 `question.type` → `questionType`으로 옮겨 담는다. 혼동 주의.

## 선택형 질문 — `SurveyFormQuestionChoice` (67줄)

| 요소      | 클래스 (원문)                                                           |
| --------- | ----------------------------------------------------------------------- |
| `<li>`    | `space-y-4`                                                             |
| 제목 블록 | `space-y-1`                                                             |
| 제목      | `flex gap-1 pretendard-16SemiBold` — `{n}.` + 제목 + `(복수응답)` + `*` |
| 필수 표시 | `text-alerts-error-text-error pretendard-14Regular` → `*`               |
| 안내      | `text-defaults-secondary-text-secondary pretendard-14Regular`           |
| 옵션 목록 | `space-y-4` (`<ol>`)                                                    |
| 에러      | `<TextError>{{ error }}</TextError>`                                    |

**안내 문구**: `SINGLE_CHOICE` → `1개 선택 가능` / 그 외 → `최소 {minChoice}개/최대 {maxChoice}개`

> **Vote와 달리 `AGAINST`(찬반) 분기가 없다** — 설문에는 투표 유형 개념이 없다.

## 서술형 질문 — `SurveyFormQuestionText` (77줄)

| 요소        | 클래스 (원문)                                                                                                                                                                                                                                                                |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 제목        | `flex gap-1 pretendard-16SemiBold` — `{n}.` + 제목 + `*`(필수)                                                                                                                                                                                                               |
| 안내        | `text-defaults-secondary-text-secondary pretendard-14Regular` → `아래 영역에 답변을 작성해주세요(200자 제한)`                                                                                                                                                                |
| textarea    | `min-h-[120px] w-full resize-none rounded-lg border border-defaults-tertiary-border-tertiary px-4 py-3 text-defaults-primary-text-primary pretendard-14Regular placeholder:text-defaults-tertiary-text-tertiary focus:border-defaults-focus-border-focus focus:outline-none` |
| placeholder | `답변을 입력해주세요` · `maxlength="200"`                                                                                                                                                                                                                                    |
| 하단 행     | `flex justify-between` — 좌측 에러, 우측 글자 수                                                                                                                                                                                                                             |
| 글자 수     | `text-right text-defaults-tertiary-text-tertiary pretendard-12Regular` → `{n}/200`                                                                                                                                                                                           |

**자동 높이**: `useTextareaAutoResize({ minHeight: 0, debounceMs: 30 })` — `board.md` §3-5와 같은 훅.

**vee-validate `<Field v-slot="{ field }">` 스코프 슬롯**으로 `v-bind="field"`를 넘긴다.
`field.value?.length`로 글자 수를 센다.

> ⚠️ **`field.value`가 `undefined`면 `{{ undefined }}`가 되어 `/200`만 보인다.**
> 초기 상태에서 `0/200`이 아니라 `/200`으로 렌더된다. 🔴
> → `deferred.md` 「동작 의심」. **이관 시 그대로**
>
> ⚠️ **`handleFieldInput`이 `autoResizeInput()`만 호출한다.** 한 겹 감싼 이유가 없다.
> `v-bind="field"`가 이미 `onInput`을 붙이므로 **둘 다 실행된다.**

## 선택지 + 기타 입력 — `SurveyFormOptionItem` (82줄)

| 요소      | 클래스 (원문)                                                                                                                                                                             |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `<label>` | `flex min-h-[60px] cursor-pointer items-center gap-4 rounded-lg border px-4 py-5` + 선택 시 `border-blue-s-info-100 bg-blue-s-info-50`, 아니면 `border-defaults-tertiary-border-tertiary` |
| 내부      | `flex w-full items-center gap-3`                                                                                                                                                          |
| 입력      | `<Field :id :type :value :name :disabled>` — 스타일 없음(OS 기본)                                                                                                                         |
| 내용      | `text-defaults-secondary-text-secondary pretendard-14Regular` + 기타면 `whitespace-nowrap`, 아니면 `break-all`                                                                            |
| 기타 입력 | `<Field :name="etcFieldName" type="text" placeholder="답변을 입력해주세요" maxlength="50" class="etc-input ml-2 w-full py-1 …">`                                                          |

**`<style scoped>`**:

```css
.etc-input {
  border: none !important;
  outline: none !important;
  border-bottom: 1px solid #e5e7eb !important;
}
.etc-input.selected {
  border-bottom: 2px solid #a0ceff !important;
  background-color: #ecf5ff;
}
.etc-input:focus {
  border-bottom: 2px solid #a0ceff !important;
}
```

> ⚠️ **`.etc-input`·`.selected`는 scoped CSS다.** Tailwind 미생성 목록(`broken-styles.md`)에
> 후보로 올랐으나 **여기 정의가 있어 제외됐다.** 이관 시 CSS도 함께 옮긴다.
>
> ⚠️ **`:class="isSelected ? 'selected' : ''"`인데 이 필드는 `v-if="isSelected && isEtc"`로만 렌더된다.**
> → **항상 `selected`가 붙는다.** `.etc-input:not(.selected)` 스타일은 도달 불가.

**기타 옵션 판정**: `option.type === QUESTION_TYPE.SUBJECTIVE`
**필드명**: 본체 `questionList[{i}].optionList` · 기타 `questionList[{i}].etcContent`

**`etcFlag` 자동 동기화** (`useSurveyOptionItem`):

```js
watch(
  isSelected,
  (selected) => {
    if (isEtcOptionComputed.value) setFieldValue(`questionList[${questionIndex}].etcFlag`, selected)
  },
  { immediate: true },
)
```

→ 기타 옵션의 선택 여부를 `etcFlag`에 반영. 스키마의 `superRefine`이 이 값을 본다.

> ⚠️ **`immediate: true`라 마운트 시 모든 기타 옵션이 `etcFlag: false`로 초기화된다.**
> `createInitialQuestion`이 이미 `etcFlag: undefined`를 넣으므로 `false`로 덮인다. 무해.

## 제출 — `usePostSurveyForm`

**서명이 없다.** 버튼을 누르면 `handleSubmit`이 검증 후 바로 mutation.

### 페이로드 변환 — `transformQuestionList`

```js
// 1) 비필수이면서 답변하지 않은 질문 제외
answeredQuestions = questionList.filter((q) => q.requiredFlag || hasAnswer(q));

// 2) 유형별 변환
SUBJECTIVE   → { questionUuid, subjectiveAnswer: value || '' }
CHOICE       → { questionUuid, optionList: [{ uuid, subjectiveAnswer? }] }
               ↑ 서버 옵션 type이 'SUBJECTIVE'이고 etcContent가 있을 때만 subjectiveAnswer 추가
```

**`hasAnswer`**:

- `SUBJECTIVE` → `subjectiveAnswer`를 trim해 비어 있지 않으면 true
- 배열 `optionList` → `length > 0`
- 그 외 → `!!optionList`

**API**: `postSurveyForm` — `POST /board/non-resident/survey/respondent/{participantUuid}/answer`
(**`client`**, **JSON**)

> ⚠️ **인자 이름이 `formData`인데 실제로는 JSON 객체 배열이다.**
> `postSurveyForm({ participantUuid, formData: requestData })` → `client.post(url, formData)`.
> Vote는 진짜 `FormData`(multipart). **이름만 같고 내용이 다르다.** 혼동 주의.
>
> ⚠️ **`transformQuestionList`가 배열을 반환한다** — 최상위가 `{ questionList: [...] }`가 아니라
> 배열 그 자체다. 서버 계약. → `[확인 필요]` SV-Q10

**성공**: `navigateReplace({ path: '/survey/completed', state: { auth: true } })`
**에러**: 전용 분기 없음 — `swalErrorModal({ text: message })`

## 접근 가드

`useForbiddenError()` — `vote.md` §6-4와 동일.

## QA 체크리스트

- [ ] 필수 질문에 빨간 `*`, 상단에 `* 표시는 필수 질문임`
- [ ] 단일/복수/서술형 3종이 각각 라디오/체크박스/textarea로 렌더
- [ ] 기타 옵션 선택 시 인라인 입력이 나타나고 파란 밑줄이 생기는가
- [ ] 기타 선택 + 미입력 제출 → `기타 답변을 입력해주세요`
- [ ] 서술형 필수 미입력 → `답변을 입력해주세요`
- [ ] 복수 min/max 위반 문구
- [ ] 서술형 글자 수가 **초기에 `/200`으로 보이는가** (레거시와 동일)
- [ ] 비필수 미응답 질문이 **제출에서 빠지는가**
- [ ] **제출 중 버튼·선택지가 안 잠기는가** (§3, 레거시와 동일)
- [ ] **질문이 11개 이상일 때 에러가 엉뚱한 질문에 붙는가** (§4, SV-Q6)
- [ ] 직접 URL 진입 → 접근 금지 모달

---

# SV5 · SV6. 본인인증

## SV5 `SurveyAuthPassResponseView` (57줄)

**`vote.md` VT5와 구조가 완전히 동일하다.**

```js
handleCertification = async () => {
  if (surveyCertStore.surveyCertInfo.isTriedVerification) {
    moveToDetail() // 🔴 return 없음 (Vote와 동일)
  }
  surveyCertStore.setSurveyCertInfo({ isTriedVerification: true })
  patchSurveyCertPassMutation()
}
```

**API**: `patchSurveyCertPass` — `PATCH /board/non-resident/survey/respondent/{participantUuid}/auth/pass`
body `{ apiToken, certNum }` (**`client`**)

**성공**: `/survey/form/{participantUuid}` + `state: { auth: true }`
**에러**: `swalErrorModal({ text: message, callback: moveToDetail })`

> 소스 주석 `// 본인인증 후 뒤로가기 처리용` — `isTriedVerification`의 목적이 명시돼 있다.
> Vote에는 이 주석이 없다.

## SV6 `SurveyAuthNamePhoneView` (154줄)

**`vote.md` VT6과 클래스가 완전히 동일하다.** 두 가지만 다르다:

| 항목           | Vote (VT6)                           | Survey (SV6)                        |
| -------------- | ------------------------------------ | ----------------------------------- |
| 휴대폰 에러    | 🔴 `errors.id` — **표시 안 됨**      | ✅ **`errors.phone`** — 정상 표시   |
| 모달 닫기 이동 | `/vote/list` (opinion엔 라우트 없음) | `/survey/list` (opinion엔 NotFound) |

**나머지는 동일**: 소제목 `투표자 정보`(🔴 설문인데 투표 문구), 동/호수 `disabled`,
`errors?.dong`·`errors.ho`가 항상 빈 값, `history.state`에서 동/호수 주입.

**API**: `patchSurveyCertNamePhone` — `PATCH .../auth/name-phone` body `{ name, phone }` (**`client`**)
`phone`은 `replaceAll('-', '')`.

### 에러 분기

| `errorCode`                    | 동작                                            |
| ------------------------------ | ----------------------------------------------- |
| `SURVEY_RESPONDENT_MISS_MATCH` | `swalErrorModal({ text: message })` — 화면 유지 |
| 그 외                          | 모달 후 `moveToDetail()`                        |

> **`*_MISS_MATCH` 오타 계열** — `domain-codes.md` 참조. **서버 계약이라 그대로 유지.**

## QA 체크리스트

- [ ] SV6에서 **휴대폰 검증 에러가 뜨는가** (Vote와 달리 정상)
- [ ] 소제목이 `투표자 정보`인가 (레거시와 동일)
- [ ] `SURVEY_RESPONDENT_MISS_MATCH` → 모달만, 화면 유지
- [ ] SV6′(opinion) 접근 금지 모달 닫기 → **NotFound 화면**이 뜨는가
- [ ] KMC 왕복 후 `participantUuid`가 localStorage에서 복원되는가

---

# SV4 · SV7 · SV8. 완료 / 시작전 / 종료

## SV4 `SurveyCompletedView` (94줄)

**`vote.md` VT4와 클래스가 완전히 동일하다.** 문구만 다르다:

| 항목 | Vote                              | Survey                            |
| ---- | --------------------------------- | --------------------------------- |
| 제목 | `투표가 완료되었습니다.`          | `설문이 완료되었습니다.`          |
| 설명 | `투표에 참여해주셔서 감사합니다.` | `설문에 참여해주셔서 감사합니다.` |
| alt  | `투표 이미지`                     | `설문 이미지`                     |

**이미지는 둘 다 `OpinionCompleted.svg`** · 배경 `bg-[#F6FAFF]` · 회원만 닫기·확인 버튼.
접근 가드도 동일.

## SV7 · SV8 `SurveyExceptionView` (46줄, opinion 전용)

| 경로             | `title`        | `description`                             |
| ---------------- | -------------- | ----------------------------------------- |
| `/survey/before` | `설문 시작 전` | **`설문가 아직 시작되지 않았습니다.`** 🔴 |
| `/survey/finish` | `설문 종료`    | `이미 종료된 설문입니다.`                 |

> 🔴 **`설문가`는 조사 오류다** (`설문이`가 맞다). Vote는 `투표가 아직 시작되지 않았습니다.`로 정상.
> **표시 문구이므로 등가 이관 원칙에 따라 그대로 둔다.** → `deferred.md` 「오타·표기」

**클래스·이미지는 `vote.md` VT8·VT9와 동일.**

---

# 이관 지침 요약

## 타깃 슬라이스 구조 (제안)

```
src/features/survey/
├── api/survey.ts              # 6개 (auth 1 · client 5)
├── queries/
├── components/
│   ├── list/    (SurveyList · SurveyListItem)
│   ├── detail/  (Title · Info · Button · AuthButton · PassButton · MoveButton)
│   └── form/    (Question · QuestionText · QuestionChoice · OptionItem)
├── pages/       # 메인 6 + opinion 8 (컴포넌트 공유)
├── hooks/
│   ├── useSurveyForm.ts
│   └── useSurveyOptionItem.ts
├── context/SurveyFormContext.tsx
├── lib/surveyRoute.ts         # 회원/비회원 경로 생성
├── constants/survey.ts
├── schemas/survey.ts
├── stores/surveyCertStore.ts  # Zustand persist (localStorage 'surveyCertInfo')
├── types/
└── index.ts
```

**`useSurveyDetailStore`는 삭제** — 쿼리로 대체 (§5).

### Vote와 공유할 것

| 항목                | 위치                                           |
| ------------------- | ---------------------------------------------- |
| `focusFirstError`   | `shared/utils/`                                |
| `useForbiddenError` | `shared/hooks/` (이동 경로는 인자로)           |
| KMC 폼 컴포넌트     | `shared/components/CertForm` — `tr_url`만 다름 |
| `CertResponse`      | 이미 공용                                      |
| 인증 스토어 패턴    | 각자 유지 (localStorage 키가 다름)             |

> **Vote와 Survey를 하나로 합치려는 유혹이 크지만 합치지 않는다.**
> §1의 9가지 차이 + 리다이렉트 조건 반전 때문에 분기가 더 복잡해진다.
> **공용 유틸만 뽑고 도메인은 분리 유지한다.**

## 이관 순서 — 2개 PR

| PR  | 범위                        | 선행 조건                                              |
| --- | --------------------------- | ------------------------------------------------------ |
| 1   | SV1 · SV2 · SV9 (목록·상세) | **Vote PR 1 완료** (opinion 엔트리·`TabCategory` 공유) |
| 2   | SV3~SV8 (폼·인증·완료)      | PR 1 + **Vote PR 2 완료** (KMC 폼 검증 공유)           |

**Vote를 먼저 끝내고 시작한다** — opinion 엔트리와 KMC 인증 인프라를 그대로 재사용한다.
서명(`CanvasSign`)이 없어 **Vote보다 가볍다.**

## 반드시 지켜야 할 것

| #   | 항목                                                                                    |
| --- | --------------------------------------------------------------------------------------- |
| 1   | **Vote와 통일하지 않는다** — §1의 9가지 차이 + 리다이렉트 조건 반전을 그대로            |
| 2   | KMC `<form action>` POST 유지 · `KMC_TYPE_FOR_URL_CODE.*_VOTE` 코드를 **그대로** (§6-3) |
| 3   | `surveyCertInfo` localStorage 키를 그대로                                               |
| 4   | opinion `/survey/list` → NotFound 화면 유지 (R-3)                                       |
| 5   | 동적 스키마 팩토리 + `discriminatedUnion` 구조 유지 (§4)                                |
| 6   | 비필수 미응답 질문을 **제출에서 제외**하는 변환 유지 (§SV3)                             |
| 7   | 제출은 **JSON 배열** (Vote의 multipart와 다름)                                          |
| 8   | `getQuestionError` 접두사 버그를 **고칠지 결정** (§4, SV-Q6)                            |
| 9   | `isCreateSurveyFormPending` 오타를 **Vote와 묶어 결정** (§3, SV-Q3)                     |
| 10  | 서술형 글자 수가 초기에 `/200`으로 보이는 것을 그대로                                   |
| 11  | `zod` 3→4: `z.ZodIssueCode.custom` → `'custom'` **6곳** (`zod-migration.md` §2)         |

## 삭제할 것 (등가 영향 없음)

- `useGetSurveyList`의 `enable` 인자 (§7-4)
- `SurveyDetailTitle`의 `<span class="opacity-0">` · 루트 `center` 클래스
- `SurveyAuthPassResponseView.handleCertification`의 `if` 블록 (도달 불가, VT5와 동일)
- `SurveyAuthNamePhoneView`의 `errors?.dong`·`errors.ho` `TextError` (항상 빈 값)
- `SurveyFormQuestionText`의 `handleFieldInput` 래퍼
- `SurveyFormOptionItem`의 `:class="isSelected ? 'selected' : ''"` (항상 참)
- `initSurveyCertInfo` (호출부 없음) — 또는 로그아웃 시 호출하도록 배선
- `useSurveyOptionItem`의 미사용 반환값 `selectedOptionUuids`

## 스타일 수정 (`broken-styles.md` 연동)

| 클래스      | 위치                       | 조치                                     |
| ----------- | -------------------------- | ---------------------------------------- |
| `max-w-1/2` | `SurveyDetailTitle` 그룹명 | `max-w-[50%]` (§3 — **줄바꿈이 생긴다**) |
| `center`    | `SurveyDetailTitle` 루트   | **삭제** (§4 — 정의 없음)                |

**`.etc-input`·`.selected`는 scoped CSS이므로 함께 이식한다.**

---

# 확인 필요 항목

| #         | 질문                                                                                                      | 성격       | 진행 차단 |
| --------- | --------------------------------------------------------------------------------------------------------- | ---------- | --------- |
| SV-Q1     | SV3(메인)에서 AppBar가 2개 겹친다 — `vote.md` VT-Q1과 함께 확인                                           | **실기기** | 아니오    |
| SV-Q2     | 🔴 메인 앱 비로그인 시 SV2가 없는 경로(`/survey/before`)로 리다이렉트한다. 라우터 가드가 먼저 막는가 (§1) | **결정**   | 아니오    |
| SV-Q3     | 🔴 `isCreateSurveyFormPending` 오타를 고칠지 — `vote.md` VT-Q2와 **묶어서 결정** (§3)                     | **결정**   | 아니오    |
| SV-Q4     | `minChoice`/`maxChoice`가 없으면 `max=0`이 되어 선택이 불가능해진다. 서버가 항상 주는가 (§4)              | 서버 확인  | 아니오    |
| ~~SV-Q5~~ | ~~zod 4의 `z.ZodIssueCode.custom`~~ → **해소.** `zod-migration.md` §2에 이미 정리됨(설문 6곳)             | —          | —         |
| SV-Q6     | 🔴 `getQuestionError` 접두사 버그를 고칠지 (§4) — 질문 11개 이상 설문이 실제로 있는가                     | **결정**   | 아니오    |
| SV-Q7     | `getSurveyList`가 `size`를 안 받는다. 서버 기본 페이지 크기 (§6-2) — `vote.md` VT-Q3과 동일               | 서버 확인  | 아니오    |
| SV-Q8     | 설문 KMC 인증에 `USER_VOTE`/`NON_USER_VOTE` 코드를 쓴다. 서버가 설문도 이 코드로 처리하는가 (§6-3)        | 서버 확인  | 아니오    |
| SV-Q9     | 설문 기간 표시가 Vote와 형식이 다르다(`formatIsoStringDate` vs `replace('T',' ')`). 의도인가 (§SV2)       | 확인       | 아니오    |
| SV-Q10    | 제출 페이로드 최상위가 배열이다. 서버 계약이 맞는가 (§SV3)                                                | 서버 확인  | 아니오    |

**진행을 막는 항목은 없다.** `SV-Q3`은 `VT-Q2`와 함께 결정한다.

---

# 도메인 QA 체크리스트 (통합)

## 듀얼 앱

- [ ] 메인: `/survey/list` → `/survey/detail/{surveyUuid}/{participantUuid}` → `/survey/form/{participantUuid}`
- [ ] opinion: 딥링크 `/survey/{participantUuid}` → `/survey/form/{participantUuid}`
- [ ] opinion `/survey/list` → **NotFound 화면** (R-3)
- [ ] 시작전/종료 설문의 리다이렉트가 조건대로 동작하는가 (§1)

## KMC 본인인증

- [ ] `PASS` 타입 → KMC POST → SV5 → SV3
- [ ] `NAME_PHONE` 타입 → SV6 → SV3
- [ ] **`NONE` 타입 → 인증 없이 바로 SV3** (Vote에 없는 경로)

## 폼 (Vote와 가장 다른 지점)

- [ ] 서술형 질문 렌더·글자 수·자동 높이
- [ ] 기타 옵션 인라인 입력 + 파란 밑줄
- [ ] 필수/비필수 구분 (`*` 표시)
- [ ] 비필수 미응답 질문이 제출 페이로드에서 빠지는가
- [ ] **서명 모달이 없는가** (Vote와 다름)

## 등가 대조 (레거시 :3000 ↔ 신규 :5173, 392px)

- [ ] SV1 카드가 VT1과 동일한 그림자·간격인가
- [ ] SV2에 탭이 없고 정보만 있는가
- [ ] SV3 선택지 `min-h-[60px]` (Vote는 없음)
- [ ] 기타 입력 스타일 (`#e5e7eb` → `#a0ceff` + `#ecf5ff`)
- [ ] 서술형 textarea `min-h-[120px]`
- [ ] 폰트 배율 5단계

## 회귀 위험 지점

- [ ] `useSurveyDetailStore` 제거 후 하단 버튼 상태가 동일한가
- [ ] `provide`/`inject` → Context 전환 후 기타 옵션 `etcFlag` 동기화가 정확한가
- [ ] `discriminatedUnion` 스키마 + `addIssue({ code: 'custom' })`가 zod 4에서 동일하게 동작하는가
- [ ] 질문 11개 이상 설문에서 에러 매칭 (§4)
