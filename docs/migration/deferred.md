# 이관 후로 미룬 개선 항목

> **등가 이관 원칙**: 이관 중에는 UI·동작을 바꾸지 않는다.
> 이관하면서 발견한 개선 아이디어는 여기에 적어두고, 전환 완료 후 별도 작업으로 처리한다.
>
> 여기 적힌 것을 이관 중에 고치면 "동작이 달라졌는지 내가 바꿔서인지"를 구분할 수 없게 된다.

## 사용법

- 발견 즉시 기록. 고치지 않는다
- 근거 파일·라인을 남긴다 (레거시 기준 SHA `6d5bf22`)
- 전환 완료(Phase 7) 후 우선순위를 매겨 처리한다

---

## 죽은 코드

| #    | 항목                                                            | 근거                                                                                                                             | 비고                                                                                                  |
| ---- | --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| D-1  | `useDeleteAptMallMyOrder`의 폴백이 항상 `undefined`             | `lib/queries/aptMall/useDeleteAptMallMyOrder.js:20` — `getParams()?.mealUuid`를 읽지만 실제 라우트 파라미터는 `aptMallOrderUuid` | 호출부가 값을 명시적으로 넘겨 동작에는 영향 없음. 이관 시 폴백 제거 가능                              |
| D-2  | `getNotOutCarHistorySummary`가 `getNotOutCarList`와 완전히 동일 | `api/parking.js:307-330`                                                                                                         | 경로·파라미터·구현 전부 동일. R-2 결정에 종속                                                         |
| D-3  | `stores/resident.js` 전체 주석 처리                             | `src/stores/resident.js`                                                                                                         | 이관 대상 아님 (계획서 3-3에서 삭제로 확정)                                                           |
| D-18 | 브릿지 `GO_APP_PERMISSION`·`CLEAR_APP_CACHE` 호출부 없음        | `natives/apass.js:32`, `natives/common.js:25`                                                                                    | **래퍼는 이관한다.** 프로토콜 상수라 앱이 기대할 수 있고 비용이 0에 가깝다. N-Q2 확인 후 정리         |
| D-19 | `CALLBACK_PUSH_ALARM`의 emitter 폴백이 죽은 코드                | `natives/common.js:101`                                                                                                          | 알려진 타입 2종은 항상 `router.push` 후 `return`하고, `emitter.on(CALLBACK_PUSH_ALARM)` 구독부가 없다 |

## 구조 개선

| #   | 항목                                     | 근거                                                                               | 비고                                                                                                                 |
| --- | ---------------------------------------- | ---------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| D-4 | 관리비 상세의 연월 선택을 URL 쿼리로     | `ManagementFeeView/ManagementFeeDetailView.vue:12-13` — 로컬 `ref`                 | 타깃 `04-state.md`의 "공유 가능한 상태는 URL" 규칙에 맞음. 다만 새로고침·뒤로가기 동작이 달라지므로 이관 중에는 금지 |
| D-5 | 민원공간 리스트 경로만 `/complaint/list` | `api/board.js:400-414` (소통공간은 `/community`)                                   | 서버 계약이라 프론트 단독 변경 불가. 백엔드 정리 시 함께                                                             |
| D-6 | 게시판 댓글 라우트만 `/post/...` 접두사  | `router/BoardIndex.js` #32,33,39,40                                                | 나머지는 `/board/...`. 경로 일관성                                                                                   |
| D-7 | FireInspection만 kebab-case 경로         | `router/FireInspectionIndex.js` — `/fire-inspection`                               | 나머지 도메인은 camelCase                                                                                            |
| D-8 | `apass` 라우트의 무의미한 meta           | `router/ApassIndex.js` — `showAppBar:false`인데 `appBarTitle`·`hasBackButton` 지정 | 무시되는 값                                                                                                          |

## 서버 계약 정리 (백엔드 협의 필요)

| #    | 항목                                | 근거                                                                    | 비고                                                                    |
| ---- | ----------------------------------- | ----------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| D-9  | 관리비 조회 쿼리 파라미터 오타      | `api/managementFee.js:20-21` — `startDateTIme`/`endDateTIme` (대문자 I) | **이관 중 절대 수정 금지.** 고치면 조회가 깨진다. 서버와 동시 변경 필요 |
| D-10 | 정렬 파라미터 이름 불일치           | `desc`(`api/parking.js:288`) vs `isDesc`(`api/parking.js:360`)          |                                                                         |
| D-11 | 투표/설문 상태 파라미터 이름 불일치 | `voteStatus`(`api/vote.js:7`) vs `state`(`api/survey.js:7`)             | 같은 개념                                                               |
| D-12 | 안면인식 식별자만 `Guid`            | `api/faceRegister.js` — 나머지는 전부 `Uuid`                            | 외부 시스템 식별자로 추정                                               |

## 오타·표기

| #    | 항목                                    | 근거                                                                                                 |
| ---- | --------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| D-13 | opinion 라우트명에 공백 2칸             | `router/SurveyExternalIndex.js:65` — `설문  이름 휴대전화 인증`                                      |
| D-14 | `LoginIndex`의 별칭 불일치              | `router/LoginIndex.js:5` — `@/views/...` (나머지는 `@views/...`)                                     |
| D-20 | 버전1 약관 화면의 죽은 `<style scoped>` | `LoginView/VersionOneTermsView.vue:22-26` — `.fixed-width`가 템플릿에서 안 쓰임. **이관하지 않는다** |

## 동작 의심 (등가 이관으로 그대로 옮기되 확인 필요)

| #    | 항목                                                       | 근거                                                                                                            | 비고                                                              |
| ---- | ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| D-21 | 비밀번호 인증 "재요청" 버튼이 1회만 동작                   | `LoginView/PasswordPhoneCertView.vue:128-136` — `resendCodeValue`가 `false`가 된 뒤 복원되지 않음               | `features/auth.md` A-Q1. 의도인지 확인                            |
| D-22 | 인증 성공 시 화면이 잠깐 빈 상태가 됨                      | `LoginView/PasswordPhoneCertView.vue:159` — 루트 `v-if="!isSuccess"`                                            | `features/auth.md` A-Q2. 깜빡임 실기기 확인                       |
| D-23 | opinion 에러 화면에 `ERROR : undefined` 노출 가능          | `ExceptionView/OpinionExternalErrorView.vue:30` — `ref(undefined)` + 조건 렌더 없음. 메인 앱 E1은 `v-if`로 가림 | `features/exception.md` X-Q1                                      |
| D-24 | `loginDataHandler` 실패를 조용히 삼킴                      | `lib/composables/useLoginData.js:47-49` — `console.error`만. 부트스트랩 실패인데 로그인은 성공 처리             | `features/auth.md` A-Q3                                           |
| D-25 | `setSignUpInfo({})`가 초기화되지 않음 (병합만 함)          | `stores/auth.js:6-12` — `{...prev, ...{}}`는 no-op. S1·A2 마운트의 "초기화" 의도가 동작하지 않는다              | `features/signup.md` S-Q2. 이전 가입 시도 데이터가 남는다         |
| D-26 | `selectedAptUuid` 초기값이 `'aaaa'` 하드코딩               | `SignUpView/SignUpAptInfoView.vue:54`                                                                           | `aptName` 필수 검증이 막고 있어 실제 전송은 안 되지만 명백한 지뢰 |
| D-27 | 회원가입 완료로 넘기는 `state.pageFrom`을 아무도 읽지 않음 | `usePostUserInfo.js:59` → `SignUpCompletedView.vue`                                                             | 죽은 state                                                        |
| D-28 | 알 수 없는 `termsId`면 빈 화면                             | `TermsOfUseView/TermsOfUseDetailView.vue:19` — `v-if="termsItem"`, 폴백 없음                                    | 에러 처리 없음                                                    |
| D-29 | 아파트 검색 모달이 열릴 때 빈 키워드로 API 1회 호출        | `lib/queries/auth/useGetAptList.js:10-14` — `enabled` 가드 없음                                                 | 불필요한 요청. `features/signup.md` S-Q6                          |
| D-30 | `useGetAptList`의 `watch` 무효화가 불필요                  | `lib/queries/auth/useGetAptList.js:20-22` — 키에 `keyword`가 이미 있어 자동 refetch됨                           | **이관 시 옮기지 않아도 동작 동일**                               |

## 고치면 안 되는 오타 (등가 이관 필수 보존)

> 아래는 명백한 오타지만 **바로잡으면 화면이나 동작이 달라진다.** 절대 수정 금지.

| #    | 항목                                                   | 근거                                                                                          | 고치면 생기는 일                       |
| ---- | ------------------------------------------------------ | --------------------------------------------------------------------------------------------- | -------------------------------------- |
| D-31 | `border-defaults-tertiary-border-tertiary0` (끝에 `0`) | `TermsOfUseAgreeView.vue:36`, `TermsCheckboxList.vue:32` — `tailwind.config.js`에 없는 클래스 | 테두리 색이 기본값 → 지정색으로 바뀐다 |
| D-32 | `text-defaults-primary-text-primary0` (끝에 `0`)       | `TermsOfUseAgreeView.vue:45` — 〃                                                             | 글자 색이 기본값 → 지정색으로 바뀐다   |

## 보안 (Phase 0-3과 함께 검토)

> **2026-07-29 방침 변경**: 인증/로그인은 레거시 구현을 **그대로 이관**하기로 확정됐다
> (→ `decisions/auth-strategy.md`). 아래 3건은 전부 **전환 완료 후** 별도 작업이다.
> 이관 중에는 손대지 않는다.

| #    | 항목                                                | 근거                                                         | 비고                                                                                                                          |
| ---- | --------------------------------------------------- | ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| D-15 | 아이디·비밀번호 평문 localStorage 저장              | `lib/composables/storage/useAuthStorage.js` — `userAuthInfo` | 자동 로그인이 이 값에 의존. D-17과 함께 처리해야 제거 가능                                                                    |
| D-16 | 미승인 입주민 조회가 비밀번호를 쿼리스트링으로 전송 | `api/auth.js:103-108`                                        | **E-Q2 확정: 그대로 유지.** POST body 전환은 백엔드 협의 필요                                                                 |
| D-17 | **쿠키 기반 refresh 전환**                          | 타깃 템플릿 `shared/lib/apiClient.ts`가 원래 이 방식         | 최초 계획이었으나 등가 이관 우선으로 보류. 전환 시 D-15·D-16이 함께 해소된다. 백엔드 협의 + 웹뷰 쿠키 실기기 검증이 선행 조건 |
