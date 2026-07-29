# 도메인 명세 — 전자투표 (vote)

> 기준 SHA `6d5bf22` · 레거시 `views/VoteView/` 23개 파일 1,673 LOC
> 타깃 슬라이스 `features/vote/`
> API 8개 (`endpoints.md` #88~#95) · 쿼리 훅 8개 · Pinia 스토어 2개 · 라우트 **13개**(메인 6 + opinion 7)

**opinion(비회원) 앱과 코드를 공유하는 첫 도메인이다.** 같은 컴포넌트가 두 라우터에
서로 다른 경로·meta로 등록되며, `import.meta.env.MODE.includes('opinion')`으로 런타임 분기한다.

이 도메인에만 있는 것 3가지:

| 항목                   | 내용                                                                    |
| ---------------------- | ----------------------------------------------------------------------- |
| **KMC 본인인증**       | 외부 사이트로 실제 `<form>` POST — fetch로 대체 불가 (`signup.md` 참조) |
| **`provide`/`inject`** | 폼 트리 2단계 컨텍스트 (`voteFormContext` · `voteQuestionContext`)      |
| **서명 캔버스**        | `CanvasSign` — 제출 전 서명 필수                                        |

> ⚠️ **화면 ID는 `VT*`, 확인 항목은 `VT-Q*`를 쓴다.** `visit.md`가 `V*`·`V-Q*`를 점유했다.

---

## 화면 목록

### 메인 앱 (`router/VoteIndex.js` — 6개)

| #   | 경로                                | name                        | 컴포넌트                        | meta                                                |
| --- | ----------------------------------- | --------------------------- | ------------------------------- | --------------------------------------------------- |
| VT1 | `/vote/list`                        | 전자투표 리스트             | `VoteView`                      | AppBar `전자투표` · `backPath:'/main'` · **eager**  |
| VT2 | `/vote/detail/:voteUuid/:voterUuid` | 전자투표 개요               | `Detail/VoteDetailView`         | AppBar `전자투표 개요` · `backPath:'/vote/list'`    |
| VT3 | `/vote/form/:voterUuid`             | 전자투표 참여               | `Form/VoteFormView`             | AppBar `전자투표 참여` · `backPath:'/vote/list'` 🔴 |
| VT4 | `/vote/completed`                   | 전자투표 완료               | `VoteCompletedView`             | `showAppBar:false`                                  |
| VT5 | `/vote/certification/pass/response` | 전자투표 본인인증 결과 수신 | `Auth/VoteAuthPassResponseView` | `showAppBar:false`                                  |
| VT6 | `/vote/certification/namePhone`     | 전자투표 이름 휴대전화 인증 | `Auth/VoteAuthNamePhoneView`    | AppBar `본인인증`                                   |

### opinion 앱 (`router/VoteExternalIndex.js` — 7개)

| #    | 경로                                | name                        | 컴포넌트                        | meta                   |
| ---- | ----------------------------------- | --------------------------- | ------------------------------- | ---------------------- |
| VT3′ | `/vote/form/:voterUuid`             | 전자투표 참여               | `Form/VoteFormView`             | **`showAppBar:false`** |
| VT4′ | `/vote/completed`                   | 전자투표 완료               | `VoteCompletedView`             | `showAppBar:false`     |
| VT7  | `/vote/:voterUuid`                  | 전자투표 개요               | `Detail/VoteDetailView`         | **`showAppBar:false`** |
| VT8  | `/vote/before`                      | 투표 시작전                 | `VoteExceptionView`             | `showAppBar:false`     |
| VT9  | `/vote/finish`                      | 투표 종료                   | `VoteExceptionView`             | `showAppBar:false`     |
| VT5′ | `/vote/certification/pass/response` | 투표 본인인증 결과 수신     | `Auth/VoteAuthPassResponseView` | `showAppBar:false`     |
| VT6′ | `/vote/certification/namePhone`     | 전자투표 이름 휴대전화 인증 | `Auth/VoteAuthNamePhoneView`    | AppBar `본인인증`      |

**전 화면 `showBottomNav: false`.** VT1만 eager.

> ⚠️ **경로 충돌 4쌍이 `routes.md`의 "opinion 멀티 엔트리 유지" 근거다** (`decisions/tech-choices.md` 0-6):
> `/vote/form/:voterUuid` · `/vote/completed` · `/vote/certification/pass/response` ·
> `/vote/certification/namePhone`. **같은 경로가 두 앱에서 meta가 다르다.**
> 단일 라우터로 합치면 `showAppBar` 분기를 런타임으로 처리해야 하는데,
> 그러면 **외부 딥링크(`/vote/{voterUuid}`)와 메인 상세(`/vote/detail/{voteUuid}/{voterUuid}`)가
> 충돌한다** — `/vote/detail`이 `/vote/:voterUuid`에 먼저 잡힌다.
>
> 🔴 **VT3(메인)은 `showAppBar:true`인데 `VoteFormView`가 자체 `<AppBar>`도 렌더한다.**
> `LayoutAuth`가 meta 기준으로 AppBar를 그리고(`pt-12` 패딩까지 추가), 그 위에 같은 제목의
> AppBar가 하나 더 얹힌다. **둘 다 `fixed top-0 z-[100]`이라 정확히 겹친다.**
> 제목이 같아 시각적으로는 티가 안 나지만 **뒤로가기 동작이 다르다**
> (meta `backPath:'/vote/list'` vs `navigate-fn: moveToDetail`). 어느 쪽이 클릭되는지 확인 필요.
> → `[확인 필요]` VT-Q1

### 진입 경로

| 화면 | 진입 출처                                                  |
| ---- | ---------------------------------------------------------- |
| VT1  | 메인 메뉴 · **VT10 미완료 투표 모달** `투표하기`           |
| VT2  | VT1 목록 클릭                                              |
| VT3  | VT2 `투표하기`(인증 완료) · VT5 인증 성공 · VT6 인증 성공  |
| VT4  | VT3 제출 성공 (`navigateReplace`)                          |
| VT5  | **KMC 외부 사이트가 `tr_url`로 POST 리다이렉트**           |
| VT6  | VT2 `투표하기`(`NAME_PHONE` 인증 타입)                     |
| VT7  | **외부 딥링크** (문자·알림톡의 `/vote/{voterUuid}`)        |
| VT8  | VT7에서 `voteStatus === PENDING`이고 비회원일 때 자동 이동 |
| VT9  | VT7에서 `voteStatus === CLOSE`이고 비회원일 때 자동 이동   |
| —    | VT10(모달)은 **메인 화면**에서 렌더 (`main.md` 참조)       |

---

## 1. 회원 / 비회원 분기 규칙

**이 도메인을 이해하는 핵심축이다.** 세 가지 판정이 조합된다.

```js
const isOpinionExternal = import.meta.env.MODE.includes('opinion') // 빌드 타임
const isUser = !!authStore.getAptInfo()?.aptResidentUuid // 런타임(localStorage)
```

| 조건                           | 의미                                       |
| ------------------------------ | ------------------------------------------ |
| `!isOpinionExternal && isUser` | **회원 투표** — 메인 앱 + 로그인 상태      |
| 그 외                          | **비회원 투표** — opinion 앱 또는 비로그인 |

**상세 경로 생성** (5곳에 같은 로직이 중복돼 있다):

```js
!isOpinionExternal && isUser
  ? `/vote/detail/${voteUuid}/${voterUuid}` // 회원
  : `/vote/${voterUuid}` // 비회원
```

| 중복 위치                                    |
| -------------------------------------------- |
| `useVoteForm.getVoteDetailPath()`            |
| `VoteAuthPassResponseView.moveToDetail()`    |
| `usePatchVoteCertPass.moveToDetail()`        |
| `usePatchVoteCertNamePhone.moveToDetail()`   |
| `useGetVoteForm`의 에러 콜백 (변수명만 다름) |

> **타깃에서는 `getVoteDetailPath()` 하나로 합친다.** 결과가 동일하므로 등가 이관에 어긋나지 않는다.
> `features/vote/lib/voteRoute.ts` 정도가 적당하다.

### 회원 전용 기능

| 기능               | 근거                                                     |
| ------------------ | -------------------------------------------------------- |
| VT1 목록           | `getVoteList`가 `auth` 인스턴스 · `aptResidentUuid` 필요 |
| VT2 투표 현황 탭   | `getVoteDetailStatus`가 `auth` 인스턴스                  |
| VT4 닫기·확인 버튼 | `v-if="isUser"`                                          |
| VT10 미완료 모달   | 메인 화면 = 회원 전용                                    |

**비회원이 쓰는 API는 전부 `client`(비인증) 인스턴스다** — `getVoteDetailInfo` · `getVoteForm` ·
`postVoteForm` · `patchVoteCertPass` · `patchVoteCertNamePhone`.

---

## 2. 하위 컴포넌트 전수 (23개)

| 파일                                |  줄 | 역할                             | 사용 화면     |
| ----------------------------------- | --: | -------------------------------- | ------------- |
| `VoteView.vue`                      |  28 | VT1 셸 (필터 탭 + 목록)          | VT1           |
| `List/VoteList.vue`                 |  80 | 무한스크롤 목록                  | VT1           |
| `List/VoteListItem.vue`             |  96 | 투표 카드 1개                    | VT1           |
| `Detail/VoteDetailView.vue`         |  93 | VT2·VT7 셸                       | VT2 · VT7     |
| `Detail/VoteDetailTitle.vue`        |  50 | 상태 칩 + 그룹명 + 제목 + D-day  | 〃            |
| `Detail/VoteDetailInfo.vue`         |  88 | `투표 정보` 탭                   | 〃            |
| `Detail/VoteDetailStatus.vue`       |  15 | `투표 현황` 탭 셸                | 〃            |
| `Detail/VoteDetailStatusCount.vue`  |  42 | 집계 4칸                         | 〃            |
| `Detail/VoteDetailStatusResult.vue` | 152 | 질문별 결과 + 프로그레스         | 〃 (CLOSE만)  |
| `Detail/VoteDetailButton.vue`       |  70 | 하단 버튼 상태머신               | 〃            |
| `Detail/VoteDetailAuthButton.vue`   |  44 | 인증 타입 분기                   | 〃            |
| `Detail/VoteDetailPassButton.vue`   |  64 | **KMC 폼 POST**                  | 〃            |
| `Detail/VoteDetailMoveButton.vue`   |  29 | 인증 완료 시 폼으로              | 〃            |
| `Form/VoteFormView.vue`             |  67 | VT3 셸 (`provide`)               | VT3 · VT3′    |
| `Form/VoteFormQuestion.vue`         |  85 | 질문 1개 (`provide`)             | 〃            |
| `Form/VoteFormOptionItem.vue`       |  86 | 선택지 1개 (`inject`)            | 〃            |
| `Form/VoteFormSubmitButton.vue`     |  58 | 제출 버튼 + 서명 모달 (`inject`) | 〃            |
| `Form/VoteFormSignModal.vue`        |  51 | 서명 모달 (`inject`)             | 〃            |
| `Auth/VoteAuthNamePhoneView.vue`    | 154 | VT6 이름+휴대폰 인증             | VT6 · VT6′    |
| `Auth/VoteAuthPassResponseView.vue` |  56 | VT5 KMC 응답 수신                | VT5 · VT5′    |
| `VoteCompletedView.vue`             |  94 | VT4 완료                         | VT4 · VT4′    |
| `VoteExceptionView.vue`             |  46 | VT8·VT9 시작전/종료              | VT8 · VT9     |
| `VoteVoterHasPendingModal.vue`      | 125 | VT10 미완료 투표 팝업            | **메인 화면** |

**죽은 파일 없음.**

---

## 3. `provide` / `inject` 폼 트리 🔴

이 도메인의 **가장 큰 이관 난제**다. 2단계 컨텍스트를 쓴다.

```
VoteFormView
  provide('voteFormContext', { questionList, isCreateVoteFormPending,
                               handleSubmit, validate, submitWithSign })
  │
  ├─ VoteFormQuestion (질문마다)
  │    provide('voteQuestionContext', { question, questionIndex })
  │    │
  │    └─ VoteFormOptionItem (선택지마다)
  │         useVoteFormOptionItem() → inject 둘 다
  │
  └─ VoteFormSubmitButton
       inject('voteFormContext')
       │
       └─ VoteFormSignModal
            inject('voteFormContext')
```

> 🔴 **`VoteFormQuestion`의 `provide`는 반응형이 아니다.**
>
> ```js
> provide('voteQuestionContext', { question: props.question, questionIndex: props.questionIndex })
> ```
>
> props를 **값으로 펼쳐서** 넘긴다. props가 바뀌어도 자식은 옛 값을 본다.
> 질문 목록이 한 번 로드되면 바뀌지 않으므로 실제 문제는 없다.
> **React Context로 옮기면 자연히 반응형이 되어 더 정확해진다.**

### 🔴 `isCreateVoteFormPending`이 항상 `undefined`다

```js
// useVoteForm.js — 반환
return { voteDetailForm, isVoteFormLoading, isPostVoteFormPending, questionList, errors,
         handleSubmit, moveToDetail, submitWithSign, validate };

// VoteFormView.vue — 구조분해
const { voteDetailForm, isVoteFormLoading, isCreateVoteFormPending, ... } = useVoteForm();
//                                          ^^^^^^^^^^^^^^^^^^^^^^^^ 반환되지 않는 키
provide('voteFormContext', { questionList, isCreateVoteFormPending, ... });
```

**`isPostVoteFormPending`을 반환하는데 `isCreateVoteFormPending`으로 받는다.**
`undefined`가 컨텍스트를 타고 3곳으로 퍼진다:

| 소비처                  | 코드                                             | 결과                             |
| ----------------------- | ------------------------------------------------ | -------------------------------- |
| `VoteFormSubmitButton`  | `:disabled="isCreateVoteFormPending"`            | **제출 중에도 버튼이 안 잠긴다** |
| 〃                      | `<SpinnerCircle v-if="isCreateVoteFormPending">` | **로딩 스피너가 안 뜬다**        |
| `VoteFormSignModal`     | 닫기 버튼 `:disabled`                            | 제출 중에도 닫힌다               |
| 〃                      | `<CanvasSign :is-pending="…">`                   | 서명 캔버스가 잠기지 않는다      |
| `useVoteFormOptionItem` | 반환만 하고 미사용                               | 영향 없음                        |

> **결과: 서명 후 제출 중에 버튼을 다시 눌러 중복 제출이 가능하다.**
> 서명 모달은 `saveSign` 직후 닫히지 않고 열린 채로 남으며, 사용자는 로딩을 볼 수 없다.
>
> **이것을 고칠지가 이 도메인 최대 결정 사항이다.** 고치면:
>
> - 제출 중 버튼이 잠기고 스피너가 뜬다 → **화면이 달라진다** (등가 이관 위반)
> - 중복 제출이 막힌다 → **동작이 달라진다**
>
> 안 고치면 타깃에서도 중복 제출이 가능하다. **투표는 재제출이 서버에서 거부될 가능성이 높지만
> 확인이 필요하다.** → `[확인 필요]` VT-Q2 🔴

---

## 4. 폼 스키마 — 동적 생성

```js
voteFormSchema = (questionList) =>
  toTypedSchema(
    z
      .object({
        questionList: z.array(
          z.object({
            questionType: z.string(),
            questionUuid: z.string(),
            optionList: z.union([
              z.string({
                invalid_type_error: '옵션을 선택해주세요',
                required_error: '옵션을 선택해주세요',
              }),
              z.array(z.string()),
            ]),
          }),
        ),
      })
      .superRefine(({ questionList: formQuestionList }, context) => {
        formQuestionList.forEach((question, index) => {
          const optionsLength = Array.isArray(question.optionList) ? question.optionList.length : 1
          const questionData = questionList.find((item) => item.uuid === question.questionUuid)
          if (question.questionType === 'MULTIPLE_CHOICE' && questionData) {
            if (optionsLength < questionData.minChoice)
              context.addIssue({
                message: `최소 ${minChoice}개를 선택해주세요`,
                path: ['questionList', index, 'optionList'],
              })
            if (optionsLength > questionData.maxChoice)
              context.addIssue({
                message: `최대 ${maxChoice}개까지만 선택 가능합니다`,
                path: ['questionList', index, 'optionList'],
              })
          }
        })
      }),
  )
```

**서버가 준 `questionList`(`minChoice`/`maxChoice`)를 클로저로 받아 스키마를 만든다.**
`useVoteForm`에서 `computed`로 감싸 데이터가 도착하면 스키마가 재생성된다.

| 검증                    | 메시지                                     |
| ----------------------- | ------------------------------------------ |
| 미선택 (단일/복수 공통) | `옵션을 선택해주세요`                      |
| 복수 최소 미달          | `최소 {minChoice}개를 선택해주세요`        |
| 복수 최대 초과          | `최대 {maxChoice}개까지만 선택 가능합니다` |

**에러 경로**: `questionList[{index}].optionList` — `VoteFormView`가
`errors[\`questionList[${questionIndex}].optionList\`]`로 꺼내 `VoteFormQuestion`에 넘긴다.

> ⚠️ **`SINGLE_CHOICE`에는 `superRefine` 검증이 없다.** `z.union`의 `z.string()`이
> `undefined`를 거부해 `옵션을 선택해주세요`가 나온다. 의도대로 동작.
>
> ⚠️ **`minChoice`/`maxChoice`가 `questionData`에 없으면 검증이 통째로 건너뛴다**
> (`&& questionData` 가드). 서버가 안 주면 무제한 선택 가능.
>
> **zod 4 이관**: `invalid_type_error` + `required_error` 각 1건 → `error`.
> **동적 스키마 팩토리 패턴은 RHF `zodResolver`에서도 그대로 쓸 수 있다** —
> `useMemo`로 감싸 `questionList` 변경 시 재생성.

### 에러 포커스 — `formErrorFocus.js`

```js
focusFirstError(errors) {
  const firstErrorField = Object.keys(errors)[0];
  const element = document.querySelector(`[name="${firstErrorField}"]`);
  element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
}
```

**vee-validate `<Field>`가 붙인 `name` 속성으로 DOM을 찾는다.**
`VoteFormOptionItem`의 `fieldName = questionList[{i}].optionList`가 그 `name`이다.

> ⚠️ **`document.querySelector`로 특수문자가 든 속성 선택자를 쓴다** — `[name="questionList[0].optionList"]`.
> 대괄호·점이 값 안에 있어 따옴표로 감싸져 있으므로 유효하다.
> **React에서는 `ref` 맵으로 바꾸는 것이 안전하다.** 동작 동일.

---

## 5. 상태 저장 — Pinia 2개

### `useVoteCertStore` (persist)

```js
useVoteStorage() → useStorage('voteCertInfo', {}, localStorage, { serializer: JSON })
setVoteCertInfo(partial) → 기존 값과 얕은 병합
initVoteCertInfo() → {} 로 초기화
```

| 키                    | 설정 시점                       | 소비처                             |
| --------------------- | ------------------------------- | ---------------------------------- |
| `voterUuid`           | VT2/VT7 `onMounted`             | VT5·VT6 인증 · 에러 콜백 경로 생성 |
| `voteUuid`            | 〃                              | 회원 상세 경로 생성                |
| `isTriedVerification` | 〃 `undefined` → VT5에서 `true` | VT5 중복 인증 방지                 |

> **localStorage에 저장하는 이유**: KMC 외부 사이트를 다녀오면 **SPA 상태가 전부 날아간다.**
> `tr_url`로 돌아올 때 `voterUuid`를 복원할 방법이 이것뿐이다.
> `signup.md`의 KMC 흐름과 같은 구조.
>
> ⚠️ **`initVoteCertInfo`는 어디서도 호출되지 않는다.** 값이 계속 남는다.
> 다른 투표에 들어가면 `setVoteCertInfo`가 덮어쓰므로 실제 문제는 없다.
> → `deferred.md` 「죽은 코드」

### `useVoteDetailStore` (메모리)

```js
voteDetail = ref()
setVoteDetail(newValue)
```

**`VoteDetailView`가 `voteDetailInfo`(서버 데이터)를 통째로 복사**해 넣는다.
`VoteDetailButton`·`VoteDetailAuthButton`·`VoteDetailPassButton`·`VoteDetailMoveButton`이 읽는다.

> 🔴 **서버 데이터를 클라이언트 스토어에 복사한다** — 타깃 규칙(`04-state.md`) 위반.
> 4개 컴포넌트가 전부 `VoteDetailView`의 자손이므로 **props 또는 Context로 충분하다.**
> `tech-mapping.md` 3-3의 "`voteDetail`을 TanStack Query로" 결정대로
> **`useGetVoteDetailInfo()`를 각 컴포넌트가 직접 호출**하면 된다
> (같은 쿼리 키라 캐시 히트 — `VoteDetailInfo`·`VoteDetailTitle`이 이미 그렇게 한다).
> **렌더 결과 동일.**

---

## 6. 공통 인프라

### 6-1. 상수 — `constants/domain/vote.js` 전문

| 심볼                            | 내용                                                                                                                                         |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `VOTE_STATE`                    | `PENDING` · `PROGRESS` · `CLOSE`                                                                                                             |
| `VOTER_STATE`                   | `PENDING` · `VOTED` · `UN_VOTED`                                                                                                             |
| `STATE_LIST`                    | `PENDING`→`시작전`(gray) · `PROGRESS`→`진행중`(blue) · `CLOSE`→`종료`(darkGray)                                                              |
| `LIST_PAGE_FILTER_LIST`         | `{uuid: PENDING, category:'시작전'}` · `PROGRESS/진행중` · `CLOSE/종료`                                                                      |
| `VOTER_STATUS`                  | `PENDING`→`미완료` · `VOTED`→`투표완료` · `UN_VOTED`→`투표불참`                                                                              |
| `AUTH_TYPE`                     | `PASS` · `NAME_PHONE`                                                                                                                        |
| `VOTE_TYPE`                     | `REPRESENT`→`선거투표` · `NORMAL`→`일반투표` · `AGAINST`→`찬반투표` · `SURVEY`→`설문조사`                                                    |
| `QUESTION_TYPE`                 | `SINGLE_CHOICE` · `MULTIPLE_CHOICE`                                                                                                          |
| `LIST_ITEM_FIELD`               | `voteType`(유형) · `voterStatus`(참여상태) · `openVoteDateTime`(**`투표 시작 일시 `** ← 끝 공백) · `closeVoteDateTime`(투표 종료 일시)       |
| `DETAIL_PAGE_TAB_LIST`          | `info`→`투표 정보` · `result`→`투표 현황`                                                                                                    |
| `DETAIL_PAGE_INFO_FIELD`        | `period`(투표 기간/`CalendarDate`) · `joinState`(참여 상태/`User`) · `voteType`(투표 유형/`List`) · `content`(상세내용/`InfoCircleDarkGray`) |
| `DETAIL_PAGE_INFO_STATUS_COUNT` | `fullVoterCount`(투표 대상) · `voteRate`(참여율) · `votedCount`(참여 인원) · `notVotedCount`(미참여 인원)                                    |

> ⚠️ **`LIST_ITEM_FIELD`의 `투표 시작 일시 `에 끝 공백이 있다.** 표시 문구이므로 그대로.
> → `deferred.md` 「오타·표기」
>
> ⚠️ **`LIST_PAGE_FILTER_LIST`가 `{uuid, category}` 형태다.** `TabCategory`가 그 키를 기대한다
> (`category.category`를 라벨로, `value.uuid`를 emit). 게시판 카테고리와 같은 계약을 재사용한 것.

### 6-2. 목록 조회 — `useGetVoteList`

`useInfiniteList` 사용 · `queryKey: 'voteList'` · `defaultStoreKey: ['aptResidentUuid']`
`additionalParams: { voteStatus }`

**API**: `getVoteList` — `GET /board/resident/vote/{aptResidentUuid}/list?page&voteStatus` (`auth`)

> 🔴 **`enable`을 넘긴다** — `useInfiniteList`는 `enabled`도 `enable`도 받지 않는다
> (`additionalOptions`만 받는다). **완전히 무시되는 인자.**
>
> ```js
> enable: additionalParamsRef.value?.voteStatus !== undefined,
> ```
>
> → `deferred.md` 「죽은 코드」. 이관 시 제거.
>
> ⚠️ **`size` 파라미터를 API가 안 받는다.** `useInfiniteList`가 `size: 10`을 항상 넘기는데
> `getVoteList`는 `{ page, voteStatus }`만 `params`에 담는다. **페이지 크기는 서버 기본값.**
> → `[확인 필요]` VT-Q3
>
> ⚠️ **`watch(error, ...)`가 `newError.data.error`를 방어 없이 읽는다.**
> 에러가 해소되어 `null`이 되면 TypeError. **이 도메인 쿼리 훅 4개가 같은 패턴이다**
> (`useGetVoteList` · `useGetVoteDetailInfo` · `useGetVoteDetailStatus` · `useGetVoteForm`).
> `retry: 0`이고 재조회가 드물어 실측 문제는 없다. → `deferred.md`

### 6-3. KMC 본인인증 — `VoteDetailPassButton`

```html
<form
  id="reqKMCISForm"
  name="reqKMCISForm"
  method="post"
  action="https://www.kmcert.com/kmcis/web/kmcisReq.jsp"
>
  <input type="hidden" name="tr_cert" :value="certificationField?.tr_cert" />
  <input type="hidden" name="tr_add" :value="certificationField?.tr_add" />
  <input type="hidden" name="tr_ver" :value="certificationField?.tr_ver" />
  <input type="hidden" name="tr_url" :value="`${baseUrl}/vote/certification/pass/response`" />
</form>
<ButtonBase form="reqKMCISForm" type="submit" …>투표하기</ButtonBase>
```

**`onMounted`에서 `getCertificationField({ type })`으로 서명값을 받아 채운다.**

| 빌드       | `type`                                |
| ---------- | ------------------------------------- |
| 메인 앱    | `KMC_TYPE_FOR_URL_CODE.USER_VOTE`     |
| opinion 앱 | `KMC_TYPE_FOR_URL_CODE.NON_USER_VOTE` |

> 🔴 **실제 cross-site `<form>` POST다. `fetch`로 대체할 수 없다.**
> KMC가 `tr_url`로 **POST 리다이렉트**하며 돌아온다. `signup.md`의 KMC 흐름과 동일한 제약.
> React에서도 **진짜 `<form action>`을 유지해야 한다.**
>
> ⚠️ **`tr_url`이 `baseUrl`(`VITE_BASE_URL`) 기준이다.** opinion 빌드의 `VITE_BASE_URL`이
> 메인 앱과 다르면 인증 후 다른 도메인으로 돌아온다. `env-vars.md`의 env 스키마 분리와 연동.
> → `[확인 필요]` VT-Q4
>
> ⚠️ **`certificationField`가 아직 안 왔는데 버튼을 누르면 빈 값으로 POST된다.**
> `disabled`는 `isVoted`만 본다. 로딩 가드 없음. → `deferred.md` 「동작 의심」

### 6-4. 접근 가드 — `history.state.auth`

**4개 화면이 같은 패턴으로 직접 진입을 막는다.**

| 화면                        | 구현                           | 모달 닫기 후 이동                      |
| --------------------------- | ------------------------------ | -------------------------------------- |
| VT3 `VoteFormView`          | `useForbiddenError()` 컴포저블 | `authStore.isLoggedIn ? '/main' : '/'` |
| VT4 `VoteCompletedView`     | 자체 `onMounted` 체크          | `isOpinionExternal ? '/' : '/main'`    |
| VT6 `VoteAuthNamePhoneView` | 자체 `onMounted` 체크          | **`/vote/list`**                       |

```js
onMounted(() => {
  if (!window.history?.state?.auth) openForbiddenErrorModal()
})
```

**모달**: `ACCESS_DENIED_MODAL_DATA` = 본문 `잘못된 접근입니다` / `확인` (단일 버튼, `title` 없음)

**`state: { auth: true }`를 넘기는 곳**:
`VoteDetailMoveButton` · `VoteDetailAuthButton` · `usePatchVoteCertPass` ·
`usePatchVoteCertNamePhone` · `usePostVoteForm`

> ⚠️ **닫기 후 이동 경로가 3곳 모두 다르다.** VT6만 `/vote/list`로 가는데,
> **비회원(opinion)에게는 존재하지 않는 경로다.** opinion 앱에서 VT6′에 직접 진입하면
> 모달을 닫고 `/vote/list`로 가려다 매칭되는 라우트가 없다.
> → `[확인 필요]` VT-Q5
>
> ⚠️ **`useForbiddenError`는 VT3만 쓴다.** 나머지 2곳은 같은 로직을 인라인으로 복사했다.
> **타깃에서는 훅 하나로 통일하되 이동 경로 차이는 인자로 받는다.** 동작 동일.
>
> 🔴 **새로고침하면 `history.state`가 사라진다** — VT3·VT4·VT6에서 새로고침 시 접근 금지 모달이 뜬다.
> `board.md`·`parking.md`·`visit.md`와 같은 유형이지만 **여기서는 의도된 가드다.**

### 6-5. 쿠키 — VT10 미완료 투표 팝업

```js
cookieUtils.setCookie('hidePopup', 'true') // 자정 만료
cookieUtils.getCookie('hidePopup')
```

> **`board.md` B21(공지 팝업)의 `noticePopupHideToday`와 별개 키다.**
> 공지 팝업 소스 주석에 "투표 팝업과 충돌 방지 위해 전용 키"라고 적혀 있는 그 상대가 이것이다.
> **쿠키 유틸 구현이 두 파일에 그대로 복사돼 있다** → 타깃에서 `shared/utils/cookie.ts`로 통합.
> 동작 동일.
>
> ⚠️ **`isHideForToday`를 `JSON.parse(hidePopup)`으로 만든다.** 쿠키가 없으면 `JSON.parse(null)` = `null`.
> `!null` = `true`라 정상 동작한다. 우연.

---

## 7. 도메인 전역 결함

| #    | 항목                                                                                                                                                                                                                                       |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 7-1  | 🔴 `isCreateVoteFormPending`이 `undefined` — 제출 중 버튼 미잠금·스피너 미표시 (§3)                                                                                                                                                        |
| 7-2  | 🔴 `VoteListItem`의 D-day 조건이 `info?.state === 'BEFORE'` — **서버 필드는 `voteStatus`, 값은 `PENDING`**. 목록에서 D-day가 **한 번도 안 보인다**. 게다가 `calculateDday(info.openDate)`인데 필드명은 `openVoteDateTime`. **이중 불일치** |
| 7-3  | 🔴 `VoteAuthNamePhoneView`의 휴대폰 에러가 `errors.id`를 읽는다 — 스키마 필드는 `phone`. **휴대폰 검증 에러가 화면에 안 뜬다**                                                                                                             |
| 7-4  | 🔴 `VoteAuthPassResponseView.handleCertification`이 `if (isTriedVerification) moveToDetail();`에 **`return`이 없다** → 이동 후에도 mutation이 실행된다                                                                                     |
| 7-5  | `useGetVoteList`가 `enable`(오타)을 넘기는데 `useInfiniteList`가 받지 않는다 — 완전 무시 (§6-2)                                                                                                                                            |
| 7-6  | `VoteList`의 `watchEffect`가 `hasVoteListNextPage`(Ref)를 `.value` 없이 검사 — 항상 truthy (`board.md` §5-8과 동일)                                                                                                                        |
| 7-7  | `VoteDetailTitle`의 `<h2 v-dompurify-html>` 안에 `<span class="opacity-0">`이 있으나 **innerHTML이 덮어써 렌더되지 않는다** — 죽은 코드                                                                                                    |
| 7-8  | `VoteDetailStatusCount`의 `` return `${…}명`                                                                                                                                                                                               |     | '-' `` — 템플릿 리터럴은 항상 truthy라 ` |     | '-'`가 죽었다 |
| 7-9  | 쿼리 훅 4개의 `watch(error)`가 `newError.data.error`를 방어 없이 읽는다 (§6-2)                                                                                                                                                             |
| 7-10 | `initVoteCertInfo`가 호출되지 않는다 (§5)                                                                                                                                                                                                  |
| 7-11 | `useVoteFormOptionItem`이 `isCreateVoteFormPending`을 반환하지만 소비처가 없다                                                                                                                                                             |
| 7-12 | `VoteDetailStatusResult`·`VoteDetailTitle`의 `max-w-1/2` — **미생성 클래스** (`broken-styles.md` §3)                                                                                                                                       |

> **7-2·7-3은 사용자에게 보이는 기능이 빠진 것이다.** 고치면 화면이 달라지므로
> **등가 이관 원칙상 그대로 둔다.** → `deferred.md` 「동작 의심」

---

# VT1. 전자투표 리스트 — `/vote/list` (메인 전용)

`VoteView.vue` (28줄) + `List/VoteList.vue` (80줄) + `List/VoteListItem.vue` (96줄)

```
┌─────────────────────────────┐
│ ← 전자투표                   │
├─────────────────────────────┤
│ (전체)(시작전)(진행중)(종료)  │  TabCategory has-total-type pb-4
├─────────────────────────────┤
│ ┌─────────────────────────┐ │
│ │ [진행중] 1단지 입주자대표…│ │  상태칩 + 그룹명 (+ D-day)
│ │ 2026년 동대표 선출 투표   │ │
│ │ ─────────────────────── │ │
│ │ 유형            선거투표  │ │
│ │ 참여상태         미완료   │ │
│ │ 투표 시작 일시  2026-07-… │ │
│ │ 투표 종료 일시  2026-08-… │ │
│ └─────────────────────────┘ │
└─────────────────────────────┘
```

| 요소      | 클래스 (원문)                                                                                                                                   |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| 루트      | `h-full`                                                                                                                                        |
| 목록 래퍼 | `h-full w-full bg-defaults-primary-background-primary`                                                                                          |
| `<ul>`    | `h-full w-full space-y-3 overflow-auto px-5 py-6 pb-14` — `ref="scrollContainerRef"`                                                            |
| 센티널    | `w-full`                                                                                                                                        |
| 빈 상태   | `flex h-full items-center justify-center` + `TextEmpty` → `등록된 투표가 없습니다`                                                              |
| `<li>`    | `flex w-full flex-col gap-3 rounded-lg border border-defaults-tertiary-border-tertiary px-3 py-4 shadow-[0px_4px_8px_-2px_rgba(16,24,40,0.10)]` |
| 상단      | `flex flex-col justify-between gap-2 border-b border-b-defaults-tertiary-border-tertiary pb-3`                                                  |
| 칩 줄     | `flex items-center gap-3` > `flex min-w-0 items-center gap-1`                                                                                   |
| 그룹명    | `truncate text-defaults-secondary-text-secondary pretendard-13Regular` (`v-dompurify-html`)                                                     |
| D-day     | `shrink-0 text-defaults-tertiary-text-tertiary pretendard-13Regular` 🔴 **조건이 틀려 안 보인다**                                               |
| 제목      | `truncate text-[#364152] pretendard-16SemiBold` (`v-dompurify-html`)                                                                            |
| 필드 목록 | `flex flex-col gap-2`                                                                                                                           |
| 필드 행   | `flex justify-between gap-2 text-defaults-tertiary-text-tertiary`                                                                               |
| 라벨      | `whitespace-nowrap pretendard-13Medium`                                                                                                         |
| 값        | `overflow-hidden text-ellipsis whitespace-nowrap pretendard-13Regular`                                                                          |

**필터**: `TabCategory color="deepBlue" :categories="LIST_PAGE_FILTER_LIST" has-total-type class="pb-4"`
→ `전체`(uuid `undefined`) · `시작전` · `진행중` · `종료`

`changeFilter(filter)` → `setAdditionalParams({ voteStatus: filter.uuid })`

**필드 렌더** (`LIST_ITEM_FIELD`):

| 키                  | 렌더                                                |
| ------------------- | --------------------------------------------------- |
| `voteType`          | `VOTE_TYPE[값]` → `선거투표` 등                     |
| `voterStatus`       | `VOTER_STATUS[값]` → `미완료`/`투표완료`/`투표불참` |
| `openVoteDateTime`  | `formatIsoStringDate(값).dateTime()`                |
| `closeVoteDateTime` | 〃                                                  |

> 🔴 **D-day가 절대 안 보인다** (§7-2). `v-if="info?.state === 'BEFORE'"`인데
> 서버 응답 필드는 `voteStatus`이고 값은 `PENDING`이다. `VoteDetailTitle`(VT2)은
> `voteDetailInfo?.voteStatus === 'PENDING'`으로 **정확히** 검사한다. **목록만 틀렸다.**
> **이관 시 그대로** — 고치면 목록에 D-day가 새로 나타난다.
>
> ⚠️ **`statusInfo.label`에 옵셔널이 없다** (`{{ statusInfo.label }}`). `voteStatus`가
> `STATE_LIST`에 없는 값이면 TypeError. 바로 위 `:color="statusInfo?.color"`에는 옵셔널이 있다.
>
> ⚠️ **스크롤 복원**: `useInfiniteScrollPosition({ moveFrom: '/detail', moveTo: '/vote/list' })`.
> 저장 키 `scrollRestoration`을 게시판·주차와 공유한다 (`board.md` §3-2).

## QA 체크리스트

- [ ] 필터 4종 전환 시 목록 갱신
- [ ] 상태 칩 색 (시작전=gray, 진행중=blue, 종료=darkGray)
- [ ] **D-day가 안 보이는가** (레거시와 동일)
- [ ] 카드 클릭 → VT2
- [ ] 상세 → 뒤로 시 스크롤 복원
- [ ] 0건 시 `등록된 투표가 없습니다`

---

# VT2 · VT7. 전자투표 개요

`Detail/VoteDetailView.vue` (93줄) — **메인 `/vote/detail/:voteUuid/:voterUuid` · opinion `/vote/:voterUuid`**

```
┌─────────────────────────────┐
│ ← 전자투표 개요              │  메인만 (opinion은 AppBar 없음)
├─────────────────────────────┤
│    [진행중] 1단지 …          │  VoteDetailTitle (가운데 정렬)
│    2026년 동대표 선출 투표    │
├─────────────────────────────┤
│  투표 정보  │  투표 현황     │  TabBase (PENDING이면 1개만)
├─────────────────────────────┤
│ 투표 기본정보                │
│ 📅 투표 기간                 │
│    2026-07-29 09:00 ~ …     │
│ 👤 참여 상태     미완료      │
│ 📋 투표 유형     선거투표     │
│ ℹ️ 상세내용 (Quill)          │
├─────────────────────────────┤
│ [        투표하기        ]   │  VoteDetailButton (fixed)
└─────────────────────────────┘
```

| 요소 | 클래스 (원문)                 |
| ---- | ----------------------------- |
| 루트 | `h-full w-full overflow-auto` |

## 제목 — `VoteDetailTitle` (50줄)

| 요소   | 클래스 (원문)                                                                                     |
| ------ | ------------------------------------------------------------------------------------------------- |
| 루트   | `center flex flex-col items-center gap-3 px-6 py-5` ← **`center`는 정의 없는 클래스**             |
| 칩 줄  | `flex items-center gap-2` > `flex items-center justify-center gap-1`                              |
| 그룹명 | `max-w-1/2 text-center text-defaults-secondary-text-secondary pretendard-13Regular` ⚠️ **미생성** |
| D-day  | `shrink-0 text-defaults-tertiary-text-tertiary pretendard-13Regular` (`voteStatus === 'PENDING'`) |
| 제목   | `text-center text-[#364152] pretendard-18SemiBold` (`v-dompurify-html`)                           |

> ⚠️ **`.center`는 어디에도 정의가 없다** (Tailwind 유틸도 아니고 scoped CSS도 없다).
> `broken-styles.md` 2차 조사에서 미생성으로 확인됐다. **삭제해도 동일.**
>
> ⚠️ **`max-w-1/2`도 미생성** (`broken-styles.md` §3). `max-w-[50%]`로 고치면
> **그룹명이 화면 절반에서 줄바꿈된다** — 화면이 바뀐다.
>
> 🔴 **`<h2 v-dompurify-html="...">` 안에 `<span class="opacity-0">`이 있다.**
> `v-dompurify-html`이 innerHTML을 통째로 교체하므로 **이 span은 렌더되지 않는다.**
> 높이 확보용으로 넣었다가 무력화된 것으로 보인다. → **삭제**

## 탭 — `useVoteDetailTab`

```js
displayTabList = computed(
  () =>
    voteDetailInfo?.voteStatus === VOTE_STATE.PENDING
      ? [DETAIL_PAGE_TAB_LIST[0]] // 투표 정보만
      : DETAIL_PAGE_TAB_LIST, // 투표 정보 + 투표 현황
)
```

**시작 전에는 `투표 현황` 탭이 없다.**

> ⚠️ **`watch(displayTabList)` → `tabKey++`로 `TabBase`를 강제 재마운트한다.**
> `TabBase`가 내부 `ref(0)`로 선택 상태를 갖기 때문에 목록이 바뀌면 인디케이터가 어긋난다.
> **React에서는 `key` prop으로 같은 효과를 낼 수 있다.** 동작 동일.
>
> ⚠️ **탭 비교가 `currentTab.label === '투표 정보'`다** — `key`가 아니라 **한글 라벨**로 비교한다.
> `key: 'info'`/`'result'`가 있는데 안 쓴다. 타깃에서는 `key`로 바꿔도 결과가 같다.

## 비회원 자동 리다이렉트

```js
watch(
  voteDetailInfo,
  (newValue) => {
    if (!newValue) return
    setVoteDetail(newValue)
    if (!isOpinionExternal || isUser) return // 회원은 여기서 종료
    switch (newValue?.voteStatus) {
      case VOTE_STATE.PENDING:
        navigateTo('/vote/before')
        break // VT8
      case VOTE_STATE.CLOSE:
        navigateTo('/vote/finish')
        break // VT9
    }
  },
  { immediate: true },
)
```

**opinion 앱이면서 비로그인일 때만** 시작전/종료 전용 화면으로 보낸다.
**회원은 VT2에 머물며 `투표 시작 전` 버튼이나 `종료` 버튼을 본다.**

## 인증 정보 저장

```js
onMounted(() => {
  setVoteCertInfo({
    voterUuid: getParams().voterUuid,
    voteUuid: getParams().voteUuid,
    isTriedVerification: undefined,
  })
})
```

**opinion 경로(`/vote/:voterUuid`)에는 `voteUuid`가 없어 `undefined`로 저장된다.**
비회원은 회원 상세 경로를 만들 일이 없으므로 문제없다.

## 투표 정보 탭 — `VoteDetailInfo` (88줄)

| 요소      | 클래스 (원문)                                                                        |
| --------- | ------------------------------------------------------------------------------------ |
| 루트      | `space-y-4 p-5 pb-14`                                                                |
| 소제목    | `text-defaults-tertiary-text-tertiary pretendard-14SemiBold` → `투표 기본정보`       |
| 목록      | `space-y-4 pb-5` (`<ol>`)                                                            |
| 항목      | `flex gap-3`                                                                         |
| 아이콘 원 | `flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100`        |
| 아이콘    | `/assets/icons/{iconPath}.svg` alt `{label} 아이콘` `h-5 w-5`                        |
| 라벨      | `flex h-8 items-center text-defaults-secondary-text-secondary pretendard-14SemiBold` |
| 값        | `text-defaults-secondary-text-secondary pretendard-14Regular`                        |
| 상세내용  | 위 + `pr-8` (`v-dompurify-html`)                                                     |
| 로딩      | `SkeletonBase class="h-5 w-full rounded-lg"`                                         |

**필드 렌더**:

| 키          | 렌더                                                                  |
| ----------- | --------------------------------------------------------------------- |
| `period`    | `{voteOpenDateTime} ~ {voteCloseDateTime}` — 각각 `replace('T', ' ')` |
| `joinState` | `VOTER_STATUS[voterStatus]`                                           |
| `voteType`  | `VOTE_TYPE[voteType]`                                                 |
| `content`   | `convertDeltaToHtml(content)` — **Quill Delta**                       |
| 그 외       | 원본 `\|\| '-'`                                                       |

> ⚠️ **`bg-slate-100`은 Tailwind 기본 팔레트다.** 디자인 토큰을 안 쓴 지점.
> `broken-styles.md` 검증에서 정상 생성 확인됨.
>
> ⚠️ **`replace('T', ' ')`로 ISO 문자열을 가공한다.** `formatIsoStringDate`를 안 쓴다.
> `2026-07-29T09:00:00` → `2026-07-29 09:00:00` (초까지 노출).

## 투표 현황 탭

`VoteDetailStatus`(15줄)가 셸. `VoteDetailStatusCount`는 항상,
**`VoteDetailStatusResult`는 `voteStatus === 'CLOSE'`일 때만** 렌더한다.

### 집계 — `VoteDetailStatusCount` (42줄)

| 요소   | 클래스 (원문)                                                              |
| ------ | -------------------------------------------------------------------------- |
| 루트   | `space-y-6 px-5 py-6`                                                      |
| 소제목 | `text-defaults-tertiary-text-tertiary pretendard-14SemiBold` → `투표 집계` |
| 그리드 | `grid grid-cols-2 gap-4`                                                   |
| 라벨   | `text-defaults-secondary-text-secondary pretendard-14SemiBold`             |
| 값     | `text-defaults-secondary-text-secondary pretendard-14Regular`              |

**렌더**: `voteRate`면 `{n}%`, 그 외 `{n}명` (`toLocaleString()`, falsy면 `0`)

### 결과 — `VoteDetailStatusResult` (152줄, CLOSE 전용)

| 요소         | 클래스 (원문)                                                                                                                                                                                                                                       |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 루트         | `space-y-6 px-5 py-6 pb-20`                                                                                                                                                                                                                         |
| 소제목       | `text-defaults-tertiary-text-tertiary pretendard-14SemiBold` → `투표 결과`                                                                                                                                                                          |
| 질문 목록    | `space-y-12` (`<ol>`)                                                                                                                                                                                                                               |
| 질문         | `space-y-4`                                                                                                                                                                                                                                         |
| 질문 제목    | `pretendard-16SemiBold` — `{n}.` + 내용 + `(복수응답)`(MULTIPLE만)                                                                                                                                                                                  |
| 옵션 목록    | `space-y-4`                                                                                                                                                                                                                                         |
| 옵션         | `rounded-lg border border-defaults-tertiary-border-tertiary px-4 py-5`                                                                                                                                                                              |
| 번호·집계 행 | `mb-2 flex items-center justify-between gap-4`                                                                                                                                                                                                      |
| 번호         | `text-defaults-secondary-text-secondary pretendard-15SemiBold` → `{n}번`                                                                                                                                                                            |
| 집계 래퍼    | `flex gap-1` + **최다 득표면 `text-brand-default-text-brand`**, 아니면 `text-defaults-secondary-text-secondary`                                                                                                                                     |
| 표 수        | `border-r-2 border-r-neutral-b-gray-200 pr-1 pretendard-14SemiBold` → `{n}표`                                                                                                                                                                       |
| 비율         | `pretendard-14SemiBold` → `{n}%`                                                                                                                                                                                                                    |
| 내용 행      | `mb-4 flex items-center justify-between gap-4`                                                                                                                                                                                                      |
| 자세히 보기  | `flex items-center gap-1 rounded-[4px] bg-defaults-secondary-background-mono px-2 py-1 text-[#6C727E] pretendard-12Regular` + `ChevronDown.svg` `rotate-[270deg]`                                                                                   |
| 프로그레스   | `h-3 w-full [&::-webkit-progress-bar]:rounded-full [&::-webkit-progress-bar]:bg-[#EEF2F6] [&::-webkit-progress-value]:rounded-full` + 최다 득표면 `[&::-webkit-progress-value]:bg-blue-s-info-500`, 아니면 `bg-neutral-b-gray-400` (+ `-moz-` 동등) |

**최다 득표 판정** (`questionMaxCountMap`):

```js
질문마다 optionCount !== 0 인 것만 모아 Math.max(...)
counts.length <= 0 이면 그 질문은 맵에 없음 (전원 미투표)
```

**비율 계산**:

```js
calculateVotePercentage(optionVotes, totalVotes) {
  if (optionVotes === 0 || totalVotes === 0) return undefined;
  return Math.round((optionVotes / totalVotes) * 100);   // 소수점 제거
}
```

템플릿에서 `|| 0`으로 받아 `0%` 표시.

> ⚠️ **`questionFullCount`가 분모다.** 복수응답이면 총 표 수가 응답자 수보다 많아
> 비율 합이 100%를 넘을 수 있다. 서버 값에 달렸다. → `[확인 필요]` VT-Q6
>
> ⚠️ **`:key="optionIndex"`** — 옵션에 `uuid`가 있는데 인덱스를 쓴다. 정렬이 안 바뀌므로 무해.
>
> ⚠️ **`ChevronDown.svg`를 270도 회전해 오른쪽 화살표로 쓴다.** alt도 `오른쪽 화살표 아이콘`.
> `aria-hidden="true"`가 함께 있어 alt는 읽히지 않는다.

**자세히 보기** → `DrawerImages` (`:title="option.content"` · `:images="option.fileList"`)

## 하단 버튼 — `VoteDetailButton` 상태머신 (70줄)

**`fixed bottom-0 left-0 w-full`**

```
voteStatus === PENDING  → [비활성] "{voteOpenDateTime} 오픈"
voteStatus === CLOSE    → [비활성] "종료"
voteStatus === PROGRESS
  ├ voterStatus === VOTED           → [비활성] "투표완료"
  └ 미투표
     ├ authFlag === true            → VoteDetailMoveButton  → /vote/form/{voterUuid}
     └ authFlag === false           → VoteDetailAuthButton
          ├ voteAuthType === PASS   → VoteDetailPassButton (KMC 폼 POST)
          └ NAME_PHONE              → /vote/certification/namePhone
```

**전 버튼 공통**: `round-type="square"` `size="2xl"`.
비활성은 `color="defaults-secondary"` `:disabled="true"`, 활성은 `color="brand"`.

> ⚠️ **`voteOpenDateTime.replace('T', ' ')`에 옵셔널이 없다** (`VoteDetailButton`).
> `voteDetail`이 아직 없으면 TypeError — `voteDetailStore.voteDetail?.voteOpenDateTime`까지는
> 옵셔널인데 `.replace`에는 없다. `computed`라 템플릿이 `state`를 먼저 평가해 대개 안 터진다.
>
> **`VoteDetailAuthButton`은 `state: { auth: true, dong, ho }`를 VT6에 넘긴다.**
> VT6이 동/호수를 표시(읽기 전용)하는 데 쓴다.

## QA 체크리스트

- [ ] 메인/opinion 양쪽에서 진입되는가
- [ ] 시작 전이면 `투표 현황` 탭이 **없는가**
- [ ] 탭 목록이 바뀔 때 인디케이터가 어긋나지 않는가
- [ ] 비회원 + 시작전 → VT8 자동 이동 / 비회원 + 종료 → VT9
- [ ] **회원은 VT2에 머무는가**
- [ ] 상태별 하단 버튼 5가지 (오픈예정/종료/투표완료/투표하기(인증완료)/투표하기(인증필요))
- [ ] `PASS` 타입 → KMC 외부 사이트로 POST
- [ ] `NAME_PHONE` 타입 → VT6
- [ ] 종료된 투표에서 결과 그래프·최다 득표 강조
- [ ] 첨부 이미지가 있는 옵션에 `자세히 보기`

---

# VT3. 전자투표 참여 — `/vote/form/:voterUuid` (메인 · opinion 공용)

`Form/VoteFormView.vue` (67줄) + 하위 4개

```
┌─────────────────────────────┐
│ ←  전자투표 참여             │  화면 내 <AppBar> (메인은 meta AppBar와 중복 🔴)
├─────────────────────────────┤
│ 1. 동대표로 적합한 후보는?    │
│    1개 선택 가능             │
│ ┌─────────────────────────┐ │
│ │ ○ 1번  홍길동  [자세히 보기]│ │  선택 시 파란 테두리+배경
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
│ │ ○ 2번  김철수            │ │
│ └─────────────────────────┘ │
│ (에러 문구)                  │
│                             │
│ [   서명하고 투표제출    ]   │  fixed bottom-0
└─────────────────────────────┘
```

| 요소      | 클래스 (원문)                                                                                |
| --------- | -------------------------------------------------------------------------------------------- |
| 루트      | `h-full`                                                                                     |
| AppBar    | `<AppBar class="bg-base-b-white" title="전자투표 참여" :navigate-fn="() => moveToDetail()">` |
| 본문      | `h-full overflow-auto p-5 pb-20`                                                             |
| 질문 목록 | `space-y-6` (`<ol>`)                                                                         |

## 질문 — `VoteFormQuestion` (85줄)

| 요소      | 클래스 (원문)                                                 |
| --------- | ------------------------------------------------------------- |
| `<li>`    | `space-y-4`                                                   |
| 제목 블록 | `space-y-1`                                                   |
| 제목      | `pretendard-16SemiBold` — `{n}.` + 내용 + `(복수응답)`        |
| 안내      | `text-defaults-secondary-text-secondary pretendard-14Regular` |
| 옵션 목록 | `space-y-4` (`<ol>`)                                          |
| 에러      | `<TextError>{{ error }}</TextError>`                          |

**안내 문구** (`getQuestionTypeText`):

| 조건                     | 문구                                    |
| ------------------------ | --------------------------------------- |
| `voteType === 'AGAINST'` | `찬성/반대 의견 투표를 해주세요.`       |
| `SINGLE_CHOICE`          | `1개 선택 가능`                         |
| `MULTIPLE_CHOICE`        | `최소 {minChoice}개/최대 {maxChoice}개` |

> ⚠️ **`AGAINST` 분기가 `questionType`보다 먼저다.** 찬반투표는 질문 타입과 무관하게
> 같은 문구를 쓴다.

## 선택지 — `VoteFormOptionItem` (86줄)

| 요소        | 클래스 (원문)                                                                                                                                                                                |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `<label>`   | `flex cursor-pointer items-center justify-between gap-4 rounded-lg border px-4 py-5` + 선택 시 `border-blue-s-info-100 bg-blue-s-info-50`, 아니면 `border-defaults-tertiary-border-tertiary` |
| 좌측        | `flex items-center gap-2`                                                                                                                                                                    |
| 입력        | vee-validate `<Field :id :type :value :name>` — **스타일 클래스 없음**(브라우저 기본 라디오/체크박스)                                                                                        |
| 번호        | `whitespace-nowrap text-defaults-secondary-text-secondary pretendard-14SemiBold` → `{n}번`                                                                                                   |
| 내용        | `text-defaults-secondary-text-secondary pretendard-14Regular` (`v-dompurify-html`)                                                                                                           |
| 자세히 보기 | `flex min-w-[90px] items-center gap-1 whitespace-nowrap rounded-[4px] bg-defaults-secondary-background-mono px-2 py-1 text-[#6C727E] pretendard-12Regular`                                   |

**필드 바인딩** (`useVoteFormOptionItem`):

```js
inputId   = `question-${questionIndex}-option-${optionIndex}`
inputType = MULTIPLE_CHOICE ? 'checkbox' : 'radio'
fieldName = `questionList[${questionIndex}].optionList`
isSelected = 배열이면 includes(uuid), 아니면 === uuid
```

> ⚠️ **`<Field>`에 스타일이 없어 OS 기본 라디오/체크박스가 그대로 보인다.**
> iOS/Android 웹뷰에서 모양이 다르다. **의도된 것으로 보인다**(선택 상태는 label 배경으로 표현).
>
> ⚠️ **`@click.stop`이 `자세히 보기` 버튼에 있다** — `<label>` 안이라 클릭이 입력으로 전파되는 것을 막는다.

## 제출 — `VoteFormSubmitButton` (58줄) + `VoteFormSignModal` (51줄)

```js
openSignModal = handleSubmit(
  async () => {
    const { valid } = await validate()
    if (!valid) return
    modalType.value = 'sign' // 서명 모달 열기
  },
  ({ errors }) => {
    focusFirstError(errors)
  }, // 검증 실패 시 첫 에러로 스크롤
)
saveSign = (file) => submitWithSign(file)
```

> ⚠️ **`handleSubmit`의 성공 콜백 안에서 `validate()`를 또 부른다.**
> `handleSubmit`은 이미 검증을 통과했을 때만 성공 콜백을 호출하므로 **중복 검증**이다.
> 무해하지만 불필요. 타깃에서는 RHF `handleSubmit(onValid, onInvalid)` 한 겹으로 충분하다.

**서명 모달**:

| 요소     | 클래스 (원문)                                                                                                                                 |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 컨테이너 | `absolute left-1/2 top-1/2 flex h-[286px] w-4/5 min-w-[30px] -translate-x-1/2 -translate-y-1/2 flex-col gap-4 rounded-md bg-base-b-white p-5` |
| 헤더     | `flex items-center justify-between gap-4 py-2`                                                                                                |
| 제목     | `pretendard-18Bold` → `서명하기` (`<h1>`)                                                                                                     |
| 닫기     | `CloseBold.svg` alt `닫기 아이콘` `h-3 w-3`                                                                                                   |
| 서명     | `<CanvasSign :is-pending="isCreateVoteFormPending" @save="saveSignature" />`                                                                  |

**`ModalBase` 안에 `absolute`로 다시 중앙 정렬한다** — `ModalBase`가 이미 flex 중앙 정렬인데
중복이다. `ModalBase`의 슬롯 래퍼(`@click.stop`) 기준으로 `absolute`가 걸려 동작한다.

> 🔴 **`isCreateVoteFormPending`이 `undefined`라 서명 캔버스와 닫기 버튼이 잠기지 않는다** (§3).
>
> ⚠️ **`onMounted`/`onUnmounted`에서 `document.body.style.overflow`를 직접 조작한다.**
> `ModalBase`도 같은 일을 한다 → **중복 실행.** 모달이 닫힐 때 `unset`이 두 번 나가지만 무해.

**제출 페이로드** (`usePostVoteForm`):

```
questionList[i].questionUuid
questionList[i].questionType
questionList[i].optionUuidList[j]     ← 요청 필드명이 optionList가 아니다
signFile                              ← CanvasSign이 만든 File
```

**`submitWithSign`이 단일 선택도 배열로 감싼다**:

```js
optionList: Array.isArray(question.optionList) ? question.optionList : [question.optionList]
```

**API**: `postVoteForm` — `POST /board/non-resident/voter/{voterUuid}` (**`client`**, multipart)
**성공**: `navigateReplace({ path: '/vote/completed', state: { auth: true } })`
**에러**: 전용 분기 없음 — `swalErrorModal({ text: message })`

> ⚠️ **`onUploadProgress`가 없다.** 서명 이미지 1장이라 진행률을 안 보여준다.
> **로딩 표시가 §3 버그로 아예 없다** — 사용자는 아무 피드백 없이 기다린다. 🔴

## 접근 가드

`useForbiddenError()` — `history.state.auth`가 없으면 `잘못된 접근입니다` 모달 →
`authStore.isLoggedIn ? '/main' : '/'`

## QA 체크리스트

- [ ] 단일 선택 질문에 라디오, 복수 선택에 체크박스
- [ ] 선택 시 파란 테두리 + 배경
- [ ] 미선택 제출 → `옵션을 선택해주세요` + 첫 에러로 스크롤
- [ ] 복수 최소/최대 위반 문구
- [ ] `서명하고 투표제출` → 서명 모달
- [ ] 서명 후 제출 → VT4 (뒤로가기로 폼에 못 돌아가는가)
- [ ] **제출 중 버튼이 안 잠기고 스피너도 안 뜨는가** (§3, 레거시와 동일)
- [ ] **연타로 중복 제출이 되는가** (VT-Q2)
- [ ] 직접 URL 진입 → 접근 금지 모달
- [ ] 메인 앱에서 **AppBar가 2개 겹치는가** (VT-Q1)

---

# VT5. 본인인증 결과 수신 — `/vote/certification/pass/response`

`Auth/VoteAuthPassResponseView.vue` (56줄) · `showAppBar:false`

**KMC가 `tr_url`로 POST 리다이렉트해 도착하는 화면.** 쿼리스트링에 `apiToken`·`certNum`이 실린다.

```js
handleCertification = async () => {
  if (voteCertStore.voteCertInfo.isTriedVerification) {
    moveToDetail() // 🔴 return이 없다
  }
  voteCertStore.setVoteCertInfo({ isTriedVerification: true })
  patchVoteCertPassMutation()
}
```

**렌더**: `<CertResponse :handler="handleCertification" :error-first-handler="errorModalFirstHandler" />`
— `v-if="!isTriedVerification"`

> 🔴 **`if` 블록에 `return`이 없다.** 이미 인증을 시도한 상태로 다시 들어오면
> **상세로 이동시킨 뒤에도 `patchVoteCertPassMutation()`이 실행된다.**
> 이동이 비동기라 mutation이 먼저 나갈 수 있다. 서버가 중복 인증을 어떻게 처리하는지에 달렸다.
> → `deferred.md` 「동작 의심」. **이관 시 그대로** · `[확인 필요]` VT-Q7
>
> ⚠️ **`v-if="!isTriedVerification"`이 `CertResponse` 자체를 막는다.**
> 위 `if` 블록은 `CertResponse`가 렌더된 뒤 `handler`를 호출할 때만 도달한다.
> `isTriedVerification`이 이미 `true`면 컴포넌트가 안 뜨므로 **`handler`도 안 불린다.**
> 즉 `if` 블록은 **실질적으로 도달 불가능한 죽은 코드**다.

**API**: `patchVoteCertPass` — `PATCH /board/non-resident/voter/{voterUuid}/auth/pass`
body `{ apiToken, certNum }` (**`client`**)

**성공**: `navigateTo({ path: '/vote/form/{voterUuid}', state: { auth: true } })` → VT3
**에러**: `swalErrorModal({ text: message, callback: () => moveToDetail() })`

---

# VT6. 이름·휴대폰 인증 — `/vote/certification/namePhone`

`Auth/VoteAuthNamePhoneView.vue` (154줄) · AppBar `본인인증`

```
┌─────────────────────────────┐
│ ← 본인인증                   │
├─────────────────────────────┤
│ 투표자 정보                  │
│ 동/호수                      │
│ [101      동] [1001    호수] │  둘 다 disabled
│ 이름                        │
│ [이름 입력]                  │
│ 휴대폰 번호                  │
│ [휴대폰 번호(- 없이 숫자만 입력)]│
│ [         완료          ]   │  fixed bottom-0
└─────────────────────────────┘
```

| 요소      | 클래스 (원문)                                                                                                                             |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| 루트      | `h-full overflow-auto`                                                                                                                    |
| 폼        | `space-y-5 p-5 pb-14`                                                                                                                     |
| 소제목    | `font-bold` → `투표자 정보`                                                                                                               |
| 필드 그룹 | `space-y-3`                                                                                                                               |
| 라벨      | `flex items-center gap-1 text-center text-defaults-primary-text-primary pretendard-15SemiBold`                                            |
| 동/호 행  | `flex gap-3` > 각 `flex w-full flex-col gap-2` > `relative w-full`                                                                        |
| 동 입력   | `InputBase id="dong" type="text" :maxlength="5" class-custom="py-[10px] pr-[30px] pl-4 w-full" disabled`                                  |
| 호 입력   | `InputBase id="ho" type="number" :maxlength="5" class-custom="py-[10px] pr-[42px] pl-4 w-full" disabled`                                  |
| 단위 라벨 | `absolute right-3 top-1/2 translate-y-[-50%] text-defaults-secondary-text-secondary pretendard-16SemiBold` → `동` / `호수`                |
| 이름      | `InputBase id="name" type="text" :maxlength="10" placeholder="이름 입력"`                                                                 |
| 휴대폰    | `InputBase id="phone" type="tel" :maxlength="13" placeholder="휴대폰 번호(- 없이 숫자만 입력)" class-custom="mb-[6px]"`                   |
| 완료 버튼 | `round-type="square" size="2xl" custom-class="fixed bottom-0 left-0 flex justify-center"` + `meta.valid ? 'brand' : 'defaults-secondary'` |

**동/호수는 `history.state`에서 채운다** (`VoteDetailAuthButton`이 넘김):

```js
setFieldValue('dong', window.history?.state?.dong)
setFieldValue('ho', window.history?.state?.ho)
```

> 🔴 **휴대폰 에러가 `errors.id`를 읽는다** — 스키마 필드는 `phone`이다 (§7-3).
> **휴대폰 형식이 틀려도 에러 문구가 안 뜬다.** 버튼만 회색으로 남는다.
> `<TextError>{{ errors.name }}</TextError>`(이름)는 정상.
>
> ⚠️ **`dong`·`ho`는 스키마(`voteAuthNamePhoneSchema` = `{ name, phone }`)에 없다.**
> `setFieldValue`로 넣어도 검증 대상이 아니고 제출에도 안 쓰인다.
> `<TextError>{{ errors?.dong }}</TextError>`·`{{ errors.ho }}`도 항상 빈 값.
> **표시 전용이며 `disabled`다.** → `deferred.md` 「죽은 코드」
>
> ⚠️ **`history.state`가 없으면 동/호수가 빈 채로 보인다.** 새로고침 시 접근 금지 모달이
> 먼저 뜨므로 실제로는 도달하지 않는다.

**제출**: `patchVoteCertNamePhoneMutation({ name, phone })`
→ `PATCH /board/non-resident/voter/{voterUuid}/auth/name-phone` (**`client`**)
`phone`은 `replaceAll('-', '')`로 하이픈 제거 후 전송.

**성공**: `navigateTo({ path: '/vote/form/{voterUuid}', state: { auth: true } })` → VT3

### 에러 분기

| `errorCode`        | 동작                                                        |
| ------------------ | ----------------------------------------------------------- |
| `VOTER_MISS_MATCH` | `swalErrorModal({ text: message })` — **화면 유지**         |
| 그 외              | `swalErrorModal({ text: message, callback: moveToDetail })` |

> **`VOTER_MISS_MATCH`만 화면에 남아 재시도할 수 있다.** 나머지는 상세로 돌려보낸다.
> `domain-codes.md`의 `*_MISS_MATCH` 오타 계열 중 하나 — **서버 계약이라 그대로 유지.**

## QA 체크리스트

- [ ] 동/호수가 채워진 채 **비활성**인가
- [ ] 이름 검증 에러가 뜨는가
- [ ] **휴대폰 검증 에러가 안 뜨는가** (§7-3, 레거시와 동일)
- [ ] 인증 성공 → VT3
- [ ] `VOTER_MISS_MATCH` → 모달만 뜨고 화면 유지
- [ ] 그 외 에러 → 모달 후 상세로
- [ ] 직접 URL 진입 → 접근 금지 모달 → **`/vote/list`** (opinion에서도, VT-Q5)

---

# VT4. 전자투표 완료 · VT8·VT9. 시작전/종료

## VT4 `VoteCompletedView` (94줄)

| 요소        | 클래스 (원문)                                                                                              |
| ----------- | ---------------------------------------------------------------------------------------------------------- |
| 루트        | `h-full w-full bg-[#F6FAFF]`                                                                               |
| 상단 바     | `h-[52px]` — 회원만 닫기 버튼(`px-5 py-4` + `CloseBold.svg` `h-5 w-5`)                                     |
| 텍스트      | `space-y-3 px-5 pt-11`                                                                                     |
| 제목        | `pretendard-22Bold` → `투표가 완료되었습니다.`                                                             |
| 설명        | `text-defaults-secondary-text-secondary pretendard-16Regular` → `투표에 참여해주셔서 감사합니다.`          |
| 이미지 영역 | `relative h-[calc(100%-260px)] w-full`                                                                     |
| 이미지      | `OpinionCompleted.svg` alt `투표 이미지` — `absolute bottom-1/2 left-1/2 -translate-x-1/2 translate-y-1/2` |
| 확인 버튼   | 회원만 — `color="brand" round-type="square" size="2xl" custom-class="fixed bottom-0 left-0"`               |

**회원 판정**: `isUser = !!authStore.getAptInfo()?.aptResidentUuid`
→ 닫기·확인 버튼 둘 다 `navigateTo('/')`

> ⚠️ **`handleCloseButton`이 `if (isUser)`일 때만 `navigateTo('/')`한다.**
> 비회원에게는 버튼이 안 보이므로 도달 불가. 하지만 **`/`는 메인 앱의 인트로 경로다** —
> 회원이 확인을 누르면 `/main`이 아니라 `/`로 간다. 라우터 가드가 `/main`으로 보낸다.
> → `[확인 필요]` VT-Q8
>
> **접근 가드**는 §6-4 참조 (`isOpinionExternal ? '/' : '/main'`).

## VT8·VT9 `VoteExceptionView` (46줄, opinion 전용)

**경로로 문구를 분기한다.**

| 경로           | `title`        | `description`                      |
| -------------- | -------------- | ---------------------------------- |
| `/vote/before` | `투표 시작 전` | `투표가 아직 시작되지 않았습니다.` |
| `/vote/finish` | `투표 종료`    | `이미 종료된 투표입니다.`          |

| 요소   | 클래스 (원문)                                                 |
| ------ | ------------------------------------------------------------- |
| 루트   | `h-full w-full bg-[#F6FAFF] pt-[52px]`                        |
| 텍스트 | `space-y-3 px-5 pt-11`                                        |
| 제목   | `pretendard-22Bold`                                           |
| 설명   | `text-defaults-secondary-text-secondary pretendard-16Regular` |
| 이미지 | VT4와 동일 (`OpinionCompleted.svg`)                           |

> ⚠️ **`onMounted`의 `switch`에 `default`가 비어 있다.** 다른 경로로 렌더되면 빈 화면.
> 두 경로에서만 쓰이므로 문제없다.
>
> ⚠️ **완료 화면과 같은 이미지(`OpinionCompleted.svg`)를 쓴다.** 시작전/종료에도 완료 그림.
> → `deferred.md` 「동작 의심」

---

# VT10. 미완료 투표 팝업 (라우트 없음)

`VoteVoterHasPendingModal.vue` (125줄) · **메인 화면에서 렌더** (`main.md` 참조)

## 노출 조건 (셋 다 참)

1. `hasVote` — `residentDetailInfo.contentList`에 `'투표'`(trim 비교)
2. `isModalOpen` — `voteHasVoterPending.progressVoteFlag`가 참일 때 열림
3. `!isHideForToday` — 쿠키 `hidePopup !== 'true'`

**API**: `getVoteHasVoterPending` — `GET /board/resident/vote/{residentUuid}/progress-vote` (`auth`)
쿼리 키 `['voteHasVoterPending']` 🔴 **`residentUuid`가 키에 없다**

> 🔴 **쿼리 키에 식별자가 없다.** 단지를 전환해도 같은 캐시를 본다.
> `board.md` §5-1, `visit.md` §3-1과 같은 유형. `staleTime: 0`이 가려준다.
>
> ⚠️ **`enabled: hasVote.value`** — `.value`를 벗겨 setup 시점 값으로 고정한다.
> `residentDetailInfo`가 아직 없으면 `undefined`(falsy) → **쿼리가 영영 안 돈다.**
> 메인 화면에서 `residentDetailInfo`가 먼저 캐시돼 있으면 동작한다.
> **캐시 미스 시 팝업이 안 뜬다.** → `deferred.md` 「동작 의심」 · `[확인 필요]` VT-Q9

| 요소         | 클래스 (원문)                                                                                                                     |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| 컨테이너     | `relative flex w-[296px] max-w-[80vw] flex-col justify-center gap-5 rounded-md bg-base-b-white p-6 pb-16`                         |
| 제목         | `text-center text-defaults-primary-text-primary pretendard-16Bold` → `미완료 투표`                                                |
| 본문         | `space-y-2` + 각 `text-center pretendard-15Regular` → `진행중인 투표가 존재합니다.` / `전자투표에서 투표를 완료해주세요.`         |
| 버튼 행      | `absolute bottom-0 left-0 flex w-full`                                                                                            |
| 오늘 안 보기 | `h-12 w-3/5 rounded-bl-md bg-defaults-secondary-background-secondary px-4 pretendard-16SemiBold` → `오늘하루` `<br/>` `보지 않기` |
| 투표하기     | `h-12 w-full rounded-br-md bg-brand-default-background-brand px-4 text-base-b-white pretendard-16SemiBold` → `투표하기`           |

> ⚠️ **버튼 폭이 `w-3/5`와 `w-full`이다.** flex 안에서 `w-full`이 남은 공간을 밀어내
> 실제 비율은 3:5 정도가 된다. `board.md` B21은 둘 다 `flex-1`이다. **비대칭.**
>
> ⚠️ **`오늘하루`에 띄어쓰기가 없다** (`오늘 하루`가 맞다). B21은 `오늘 하루 보지 않기`.
> → `deferred.md` 「오타·표기」
>
> ⚠️ **`ModalBase`에 `@close`를 안 붙였다** — 딤 클릭으로 닫히지 않는다. B21과 동일.

## QA 체크리스트

- [ ] 진행중 + 미완료 투표가 있을 때만 노출
- [ ] `투표하기` → VT1
- [ ] `오늘하루 보지 않기` → 자정까지 미노출 (쿠키 `hidePopup`)
- [ ] **공지 팝업(B21)과 동시에 뜰 때 겹침 순서**
- [ ] 딤 클릭으로 안 닫히는가

---

# 이관 지침 요약

## 타깃 슬라이스 구조 (제안)

```
src/features/vote/
├── api/vote.ts               # 8개 (auth 3 · client 5)
├── queries/
├── components/
│   ├── list/    (VoteList · VoteListItem)
│   ├── detail/  (Title · Info · Status · StatusCount · StatusResult
│   │             Button · AuthButton · PassButton · MoveButton)
│   ├── form/    (Question · OptionItem · SubmitButton · SignModal)
│   └── VoterHasPendingModal.tsx
├── pages/       # 메인 6 + opinion 7 (컴포넌트는 공유)
├── hooks/
│   ├── useVoteForm.ts
│   ├── useVoteDetailTab.ts
│   └── useVoteFormOptionItem.ts
├── context/VoteFormContext.tsx      # provide/inject 대체
├── lib/voteRoute.ts                 # 회원/비회원 경로 생성 (§1 중복 제거)
├── constants/vote.ts
├── schemas/vote.ts
├── stores/voteCertStore.ts          # Zustand persist (localStorage 'voteCertInfo')
├── types/
└── index.ts
```

**`shared`로 올릴 것**: `focusFirstError` · 쿠키 유틸(`board.md` B21과 공용) · `calculateDday`
**`useVoteDetailStore`는 삭제** — TanStack Query로 대체 (§5)

## 이관 순서 — 3개 PR

| PR  | 범위                           | 선행 조건                                          |
| --- | ------------------------------ | -------------------------------------------------- |
| 1   | VT1 · VT2 (목록·상세)          | Phase 4 (`TabCategory`·`TabBase`·`DrawerImages`)   |
| 2   | VT5 · VT6 (인증) + VT4·VT8·VT9 | PR 1 + **KMC 폼 POST 검증** (`signup.md`와 공통)   |
| 3   | VT3 (참여 폼) + VT10           | PR 2 + **`CanvasSign` 재작성** (`tech-mapping.md`) |

**opinion 앱 엔트리(`main-opinion.tsx` · `routerOpinion.tsx`)는 PR 1에서 함께 만든다** —
VT7이 opinion의 첫 화면이다.

## 반드시 지켜야 할 것

| #   | 항목                                                                                             |
| --- | ------------------------------------------------------------------------------------------------ |
| 1   | **KMC `<form action>` POST를 유지** — `fetch`로 대체 불가 (§6-3)                                 |
| 2   | `voteCertInfo`를 **localStorage 키 `voteCertInfo`로 그대로** — KMC 왕복 시 유일한 복원 수단 (§5) |
| 3   | opinion **멀티 엔트리 유지** — 경로 충돌 4쌍 + `/vote/:voterUuid` vs `/vote/detail/…`            |
| 4   | 회원/비회원 경로 분기 결과를 그대로 (§1). 중복 5곳은 함수 하나로 합쳐도 됨                       |
| 5   | `history.state.auth` 접근 가드 3곳을 그대로 (§6-4). 이동 경로 차이도 유지                        |
| 6   | 동적 스키마 팩토리(`voteFormSchema(questionList)`) 패턴 유지 (§4)                                |
| 7   | 제출 페이로드 필드명 `questionList[i].optionUuidList[j]` (요청과 폼 필드명이 다름)               |
| 8   | VT1 D-day 미표시 · VT6 휴대폰 에러 미표시를 **고치지 않는다** (§7-2·7-3)                         |
| 9   | `isCreateVoteFormPending` 오타를 고칠지 **결정 필요** (§3, VT-Q2) 🔴                             |
| 10  | `zod` 3→4: `voteFormSchema`의 `invalid_type_error`·`required_error` → `error`                    |
| 11  | `useVoteDetailStore` 제거 시 **렌더 결과가 같아야 한다** (같은 쿼리 키 재사용)                   |

## 삭제할 것 (등가 영향 없음)

- `useGetVoteList`의 `enable` 인자 (§7-5)
- `VoteDetailTitle`의 `<span class="opacity-0">` (innerHTML에 덮여 렌더 안 됨)
- `VoteDetailTitle` 루트의 `center` 클래스 (정의 없음)
- `VoteDetailStatusCount`의 `|| '-'` (도달 불가)
- `VoteAuthPassResponseView.handleCertification`의 `if` 블록 (§VT5, 도달 불가)
- `useVoteFormOptionItem`의 `isCreateVoteFormPending` 반환
- `initVoteCertInfo` (호출부 없음) — 또는 로그아웃 시 호출하도록 배선
- `VoteAuthNamePhoneView`의 `errors?.dong`·`errors.ho` `TextError` (항상 빈 값)
- `VoteFormSignModal`의 `document.body.style.overflow` 조작 (`ModalBase`와 중복)

## 스타일 수정 (`broken-styles.md` 연동)

| 클래스      | 위치                     | 조치                                     |
| ----------- | ------------------------ | ---------------------------------------- |
| `max-w-1/2` | `VoteDetailTitle` 그룹명 | `max-w-[50%]` (§3 — **줄바꿈이 생긴다**) |
| `center`    | `VoteDetailTitle` 루트   | **삭제** (정의 없음)                     |

---

# 확인 필요 항목

| #     | 질문                                                                                            | 성격       | 진행 차단 |
| ----- | ----------------------------------------------------------------------------------------------- | ---------- | --------- |
| VT-Q1 | VT3(메인)에서 AppBar가 2개 겹친다. 어느 쪽 뒤로가기가 동작하는가 (§화면목록)                    | **실기기** | 아니오    |
| VT-Q2 | 🔴 `isCreateVoteFormPending` 오타를 고칠지 (§3) — 고치면 제출 중 버튼 잠김·스피너가 새로 생긴다 | **결정**   | 아니오    |
| VT-Q3 | `getVoteList`가 `size`를 안 받는다. 서버 기본 페이지 크기가 무엇인가 (§6-2)                     | 서버 확인  | 아니오    |
| VT-Q4 | opinion 빌드의 `VITE_BASE_URL`이 KMC `tr_url`로 올바른가 (§6-3)                                 | 확인       | 아니오    |
| VT-Q5 | VT6′(opinion)에서 접근 금지 모달을 닫으면 `/vote/list`로 가는데 그 라우트가 없다 (§6-4)         | **결정**   | 아니오    |
| VT-Q6 | 복수응답 시 `questionFullCount`가 응답자 수인가 총 표 수인가 — 비율 합이 100%를 넘는가 (§VT2)   | 서버 확인  | 아니오    |
| VT-Q7 | VT5에서 이미 인증한 상태로 재진입 시 중복 인증 요청이 나가는가 (§VT5)                           | 서버 확인  | 아니오    |
| VT-Q8 | VT4 `확인`이 `/`로 가는데 라우터 가드가 `/main`으로 보내는가 (§VT4)                             | 확인       | 아니오    |
| VT-Q9 | VT10의 `enabled: hasVote.value`가 setup 시점 고정이다. 캐시 미스 시 팝업이 안 뜨는가 (§VT10)    | 확인       | 아니오    |

**진행을 막는 항목은 없다.** `VT-Q2`만 이관 착수 전에 결정한다.

---

# 도메인 QA 체크리스트 (통합)

## 듀얼 앱

- [ ] 메인 앱: `/vote/list` → `/vote/detail/{voteUuid}/{voterUuid}` → `/vote/form/{voterUuid}`
- [ ] opinion 앱: 딥링크 `/vote/{voterUuid}` → `/vote/form/{voterUuid}`
- [ ] 같은 경로 4쌍이 앱별로 다른 meta로 동작하는가
- [ ] opinion에서 시작전/종료 투표 → VT8/VT9 자동 이동
- [ ] 메인에서 시작전/종료 투표 → VT2에 머물며 비활성 버튼

## KMC 본인인증 (실기기 권장)

- [ ] `PASS` 타입 → KMC 사이트로 POST
- [ ] 인증 후 `tr_url`로 복귀 → VT5 → VT3
- [ ] 메인/opinion의 `type`이 `USER_VOTE`/`NON_USER_VOTE`로 갈리는가
- [ ] KMC 왕복 후 `voterUuid`가 localStorage에서 복원되는가

## 크로스 도메인

- [ ] 메인 화면 VT10 팝업 ↔ 공지 팝업(`board.md` B21) 충돌 없음
- [ ] 두 팝업의 쿠키 키가 독립적인가 (`hidePopup` vs `noticePopupHideToday`)

## 등가 대조 (레거시 :3000 ↔ 신규 :5173, 392px)

- [ ] VT1 카드 그림자 `0px 4px 8px -2px rgba(16,24,40,0.10)`
- [ ] VT2 아이콘 원 `bg-slate-100` + 필드 간격
- [ ] VT2 결과 프로그레스 바 색 (최다 득표 파랑 / 나머지 회색)
- [ ] VT3 선택지 선택 상태 (파란 테두리 + `bg-blue-s-info-50`)
- [ ] VT3 라디오/체크박스가 OS 기본 모양인가
- [ ] 서명 모달 크기 `h-[286px] w-4/5`
- [ ] VT4·VT8·VT9 배경 `#F6FAFF` + 이미지 위치
- [ ] 폰트 배율 5단계

## 회귀 위험 지점

- [ ] `useVoteDetailStore` 제거 후 하단 버튼 5가지 상태가 동일한가
- [ ] `provide`/`inject` → Context 전환 후 선택 상태가 정확한가
- [ ] 동적 스키마가 `questionList` 도착 후 재생성되는가
- [ ] `staleTime` 변경 시 `voteHasVoterPending` 캐시가 단지 간 새는지 (**0 유지**)
