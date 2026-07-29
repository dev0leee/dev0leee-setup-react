# 쿼리 훅·키 인벤토리 — 레거시 `apt-resident-fe`

> 기준 SHA `6d5bf22` (2026-07-27) · 추출원 `src/lib/queries/**`
> 전체 계획: `~/.claude/plans/working-smcom-apt-resident-fe-tranquil-charm.md`

## 집계

| 구분                                                      |      수 |
| --------------------------------------------------------- | ------: |
| 훅 파일                                                   | **141** |
| ├ `useQuery`                                              |      56 |
| ├ `useMutation`                                           |      65 |
| ├ `useInfiniteList` 소비자                                |      19 |
| └ `useInfiniteQuery` 팩토리 (`common/useInfiniteList.js`) |       1 |
| **쿼리 키 총계**                                          |  **75** |
| ├ 배열 키 (`useQuery`)                                    |      56 |
| └ 무한목록 키 (문자열 → 팩토리가 배열로 조립)             |      19 |

> 계획서의 "훅 142개 / 키 42+19"는 개략치였다. 실측은 **훅 141개 / 키 75종**이다
> (배열 키를 단일행 grep으로 세어 멀티라인 21건이 누락됐었다).

### 도메인별 훅 수

| 도메인        |  훅 | 도메인           |      훅 |
| ------------- | --: | ---------------- | ------: |
| `board`       |  42 | `faceRegister`   |       5 |
| `parking`     |  24 | `fireInspection` |       3 |
| `resident`    |  10 | `apass`          |       2 |
| `aptMall`     |   8 | `apt`            |       2 |
| `vote`        |   8 | `kiosk`          |       2 |
| `lobbyPhone`  |   7 | `managementFee`  |       2 |
| `movingHouse` |   7 | `shopping`       |       1 |
| `repair`      |   6 | `common`         |       1 |
| `survey`      |   6 |                  |         |
| `auth`        |   5 | **합계**         | **141** |

---

## 1. ⚠️ 최대 이관 해저드 — v4 `invalidateQueries` 시그니처

TanStack Query **v4의 위치 인자 형태**가 **27곳**에서 쓰인다. v5에서는 이 형태가 제거됐다.

```js
queryClient.invalidateQueries(['communityCommentList']) // ← v4. v5에서 동작 안 함
queryClient.invalidateQueries({ queryKey: ['x'] }) // ← v5. 현재 2곳뿐
```

| 형태                                           | 호출부 |
| ---------------------------------------------- | -----: |
| `invalidateQueries([...])` — **v4, 변환 필요** | **27** |
| `invalidateQueries({ queryKey: [...] })` — v5  |      2 |
| `removeQueries([...])` — v4                    |      1 |
| **변환 대상 합계**                             | **28** |

**왜 위험한가**: TypeScript가 대부분 잡아주지만, 놓치면 **조용히 캐시가 무효화되지 않는다.**
증상은 "글을 쓰고 목록으로 돌아왔는데 새 글이 안 보임" 같은 형태로, 테스트 없이는 발견이 늦다.

### v4 형태 27곳 전수

| 파일                                             |   라인 | 무효화 대상                                        |
| ------------------------------------------------ | -----: | -------------------------------------------------- |
| `board/usePostCommunityComment.js`               |     34 | `communityCommentList`                             |
| `board/usePostCommunityReply.js`                 | 36, 37 | `communityCommentList`, `communityCommentDetail`   |
| `board/useDeleteCommunityComment.js`             |     28 | (멀티라인)                                         |
| `board/usePostComplaintsComment.js`              |     34 | `complaintsCommentList`                            |
| `board/usePostComplaintsReply.js`                | 36, 37 | `complaintsCommentList`, `complaintsCommentDetail` |
| `board/useDeleteComplaintsComment.js`            |     27 | (멀티라인)                                         |
| `board/useGetNoticeList.js`                      |     28 | `noticeList`                                       |
| `board/useGetCommunityPostList.js`               |     28 | `communityPostList`                                |
| `board/useGetComplaintsPostList.js`              |     28 | `complaintsPostList`                               |
| `board/useGetGlobalNoticeList.js`                |     28 | `globalNoticeList`                                 |
| `auth/useGetAptList.js`                          |     21 | `aptList`, `keyword`                               |
| `apass/usePatchAPassActive.js`                   |     20 | (멀티라인)                                         |
| `aptMall/usePostAptMallOrder.js`                 |     43 | `aptMallMyOrderList`                               |
| `aptMall/useDeleteAptMallMyOrder.js`             |     24 | `aptMallMyOrderDetail`                             |
| `faceRegister/usePostFaceRecog.js`               |     24 | (멀티라인)                                         |
| `faceRegister/useDeleteFaceRecog.js`             |     32 | (멀티라인)                                         |
| `lobbyPhone/useDeleteLobbyPhoneTempPassword.js`  |     24 | (멀티라인)                                         |
| `lobbyPhone/usePatchLobbyPhonePushAlarmState.js` |     21 | `lobbyPhonePushAlarmState`                         |
| `parking/usePostReservationCar.js`               |     59 | `reservationCarList`                               |
| `parking/usePostBookmarkCar.js`                  |     29 | `bookmarkCarList`                                  |
| `parking/usePatchBookmarkedCar.js`               |     30 | `bookmarkCarList`                                  |
| `parking/useDeleteBookmarkedCar.js`              |     24 | `bookmarkCarList`                                  |
| `parking/usePostAlwaysAllowedCar.js`             |     37 | `alwaysAllowCarList`                               |
| `parking/useDeleteAlwaysAllowedCar.js`           |     19 | `alwaysAllowCarList`                               |
| `parking/usePostRejectCar.js`                    |     24 | (멀티라인)                                         |

> ⚠️ **`useGetNoticeList`·`useGetCommunityPostList`·`useGetComplaintsPostList`·`useGetGlobalNoticeList`는
> 조회 훅(`useGet*`)인데 내부에서 `invalidateQueries`를 호출한다.** 검색어·카테고리 변경 시
> 목록을 강제로 갱신하려는 의도로 보이나, 조회 훅이 캐시를 무효화하는 것은 이례적이다.
> **동작을 그대로 재현하되** 이관 시 의도를 확인할 것. → `[확인 필요]` Q-Q1

---

## 2. `useInfiniteList` 팩토리 (`common/useInfiniteList.js`, 84 LOC)

무한 스크롤 목록 19종이 공유하는 유일한 쿼리 유틸. **`shared/hooks/`로 올릴 대상.**

```js
const authStore = useAuthStore();          // ← 모듈 스코프. axios.js와 같은 안티패턴

const useInfiniteList = ({ queryKey, defaultStoreKey, fetchFunction,
                           additionalParams = {}, additionalOptions = {} }) => {
  const computedQueryKey = computed(() => [
    queryKey,                                                        // 문자열 1개
    ...defaultStoreKey.map((item) => authStore.getAptInfo()?.[item]), // aptInfo에서 뽑은 값들
    ...Object.values(additionalParams.value || {}),                  // ⚠️ 값만, 키 이름 없이
  ]);
  ...
};
```

### 동작 명세

| 항목             | 값                                                                                                                               |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| 페이지 크기      | **10 고정** (`size: 10`)                                                                                                         |
| 첫 페이지        | `initialPageParam: 0`                                                                                                            |
| 다음 페이지 조건 | `!lastPage.data.success.last && pages.length < totalPages` → `number + 1`, 아니면 `undefined`                                    |
| `select` 반환    | `{ pages: 평탄화된 content 배열, pageParams: number, pageable: {...} }`                                                          |
| `pageable` 출처  | **`pages[0]`에서만** 추출 (`totalPages`, `totalElements`, `empty`, `sort`, `numberOfElements`)                                   |
| `resetCache()`   | `removeQueries({ queryKey: [queryKey] })` — 접두사 매칭                                                                          |
| 반환 이름        | `list`, `isListLoading`, `isListError`, `hasListNextPage`, `fetchListNextPage`, `error`, `resetCache` (소비자가 구조분해로 개명) |

### 이관 시 주의

1. **`Object.values(additionalParams)` — 키 이름이 캐시 키에 안 들어간다.**
   파라미터 객체의 **속성 순서가 바뀌면 캐시 키가 달라진다.** 타깃 컨벤션(`04-state.md`)은
   "params는 마지막에 객체 통째로"를 권하지만, **바꾸면 캐시 히트/미스 동작이 달라지므로
   등가 이관 원칙상 그대로 유지한다.** → `deferred.md`
2. `additionalParams`가 Vue `ref`(`.value`)를 전제한다. React에서는 일반 객체 + 렌더 중 계산
3. `computed` → React에서는 배열 리터럴을 렌더 중 계산 (`useMemo` 불필요)
4. 모듈 스코프 `useAuthStore()` → Zustand 스토어를 훅 안에서 selector로 구독

### 무한목록 키 19종

| 키                                                                                        | 도메인  |
| ----------------------------------------------------------------------------------------- | ------- |
| `noticeList` · `globalNoticeList`                                                         | Board   |
| `communityPostList` · `communityMyActivityPostList` · `communityMyActivityCommentList`    | Board   |
| `complaintsPostList` · `complaintsMyActivityPostList` · `complaintsMyActivityCommentList` | Board   |
| `reservationCarList` · `alwaysAllowCarList` · `bookmarkCarList` · `regularCarList`        | Parking |
| `inOutCarList` · `notOutCarList` · `parkingMileageList`                                   | Parking |
| `aptMallMyOrderList`                                                                      | AptMall |
| `repairList`                                                                              | Repair  |
| `voteList`                                                                                | Vote    |
| `surveyList`                                                                              | Survey  |

> `notOutCarList`는 **이관 제외** 확정 (`decisions/inventory-questions.md` R-2) → 실제 이관 대상 **18종**

---

## 3. `useQuery` 배열 키 56종

키 첫 요소는 문자열 식별자, 이후는 의존 값이다.
`aptResidentUuid`/`aptUuid`는 대부분 `authStore.getAptInfo()`에서 **훅 호출 시점에** 읽는다.

### 3-1. Board (14)

| 키                                                                  | 의존 값                         |
| ------------------------------------------------------------------- | ------------------------------- |
| `['noticeCategoryList', aptUuid]`                                   | aptInfo                         |
| `['noticeDetail', aptUuid, noticeUuid]`                             | aptInfo + 라우트                |
| `['noticePopupThumbnail', aptUuid]`                                 | 인자                            |
| `['noticeTopThree', aptUuid?]`                                      | aptInfo — **이관 필수** (E-Q5a) |
| `['globalNoticeDetail', aptResidentUuid, globalNoticeUuid]`         | aptInfo + 인자                  |
| `['communityCategoryList', aptResidentUuid]`                        | aptInfo                         |
| `['communityPostDetail', aptResidentUuid]`                          | aptInfo                         |
| `['communityCommentList', aptResidentUuid, params.uuid]`            | aptInfo + 라우트                |
| `['communityCommentDetail', aptResidentUuid?, params.postUuid, …]`  | aptInfo + 라우트                |
| `['complaintsCategoryList', aptResidentUuid]`                       | aptInfo                         |
| `['complaintsPostDetail', aptResidentUuid]`                         | aptInfo                         |
| `['complaintsCommentList', aptResidentUuid, params.uuid]`           | aptInfo + 라우트                |
| `['complaintsCommentDetail', aptResidentUuid?, params.postUuid, …]` | aptInfo + 라우트                |
| `['boardBlockedUserList', aptResidentUuid]`                         | aptInfo                         |

> ⚠️ `communityPostDetail`·`complaintsPostDetail`의 키에 **글 uuid가 없다.**
> `aptResidentUuid`만으로 식별하므로 **다른 글로 이동해도 같은 캐시 키**다.
> 실제로는 `getParams()`로 uuid를 읽어 조회하므로 캐시가 잘못 재사용될 수 있다. → `[확인 필요]` Q-Q2

### 3-2. Parking (7)

| 키                                                        | 의존 값                |
| --------------------------------------------------------- | ---------------------- |
| `['visitPurpose']`                                        | **없음**               |
| `['parkingPolicy', aptResidentUuid?]`                     | aptInfo                |
| `['parkingRemainingMileage', dateRange]`                  | 인자                   |
| `['inOutCarDetail', aptResidentUuid?, parkingUuid]`       | aptInfo + 라우트       |
| `['reservationCarDetail', aptResidentUuid?, parkingUuid]` | aptInfo + 라우트       |
| `['notOutHistorySummary', aptResidentUuid?]`              | **이관 제외** (R-2)    |
| `['isAPassActive', aptResidentUuid?]`                     | aptInfo (apass 도메인) |

### 3-3. Resident / MyPage (6)

| 키                                         | 의존 값                                          |
| ------------------------------------------ | ------------------------------------------------ |
| `['residentDetailInfo', aptResidentUuid]`  | aptInfo — **로그아웃 시 `removeQueries`로 제거** |
| `['residentAptList']`                      | **없음**                                         |
| `['notificationSetting', aptResidentUuid]` | 인자                                             |
| `['officeBusinessHours', aptUuid]`         | aptInfo                                          |
| `['officeContactList', aptUuid]`           | aptInfo                                          |
| `['shoppingToken', aptResidentUuid]`       | aptInfo                                          |

### 3-4. LobbyPhone / FaceRegister / Kiosk (7)

| 키                                                               | 의존 값        |
| ---------------------------------------------------------------- | -------------- |
| `['lobbyPhonePushAlarmState', aptResidentUuid?]`                 | aptInfo        |
| `['lobbyPhoneQrServiceCode', aptResidentUuid?]`                  | aptInfo        |
| `['lobbyPhoneTempPasswordList', aptResidentUuid?]`               | aptInfo        |
| `['lobbyPhoneFaceRecogList', aptResidentUuid?]`                  | aptInfo        |
| `['lobbyPhoneFaceRecogDetail', aptResidentUuid?, faceRecogGuid]` | aptInfo + 인자 |
| `['visitorPassPassword', aptUuid?, aptResidentUuid?]`            | aptInfo        |

> 키 이름이 `lobbyPhoneQrServiceCode`인데 훅·API는 `EncryptedQrData`다 — 이름 불일치. 동작 영향 없음.

### 3-5. AptMall (5)

| 키                                                     | 의존 값     |
| ------------------------------------------------------ | ----------- |
| `['aptMallList']`                                      | **없음**    |
| `['aptMallDetail']`                                    | **없음** ⚠️ |
| `['aptMallMyOrderDetail', params.aptMallOrderUuid]`    | 라우트      |
| `['aptMallOrderMenuList', aptMallUuid]`                | 인자        |
| `['aptMallOrderCalendarTimeList', formattedOrderDate]` | 인자        |

> ⚠️ `['aptMallDetail']`에 **`aptMallUuid`가 없다.** 몰이 여러 개면 캐시가 섞인다. → `[확인 필요]` Q-Q2

### 3-6. Vote / Survey (7)

| 키                                             | 의존 값  |
| ---------------------------------------------- | -------- |
| `['voteDetailInfo', voterUuid]`                | 인자     |
| `['voteDetailForm', params.voterUuid]`         | 라우트   |
| `['voteDetailStatus', params.voteUuid]`        | 라우트   |
| `['voteHasVoterPending']`                      | **없음** |
| `['surveyDetailInfo', participantUuid]`        | 인자     |
| `['surveyDetailForm', params.participantUuid]` | 라우트   |

### 3-7. MovingHouse / Repair / FireInspection / ManagementFee / 기타 (10)

| 키                                                                          | 의존 값             |
| --------------------------------------------------------------------------- | ------------------- |
| `['movingHouseList', aptResidentUuid, statusParam]`                         | aptInfo + 상태      |
| `['movingHouseDetail', params.movingUuid]`                                  | 라우트              |
| `['movingHouseSetting', aptResidentUuid]`                                   | aptInfo             |
| `['movingHouseHolidayList', aptResidentUuid]`                               | aptInfo             |
| `['movingHouseReservationTimeList', aptResidentUuid, formattedToday]`       | aptInfo + 날짜      |
| `['repairStatusCount', aptUuid?, aptResidentUuid?]`                         | aptInfo             |
| `['repairDetail', aptUuid?, aptResidentUuid?, …]`                           | aptInfo + 라우트    |
| `['fireInspectionStatus']`                                                  | **없음**            |
| `['fireInspectionDetail', fireInspectionUuid, householdFireInspectionUuid]` | 라우트              |
| `['imposeYearMonths', aptResidentUuid]`                                     | aptInfo             |
| `['managementFeeBill', aptResidentUuid, year, …]`                           | aptInfo + 선택 연월 |
| `['aptList', keyword]`                                                      | 인자 (auth)         |

---

## 4. 키 설계상의 문제 (이관 시 그대로 유지)

### 4-1. `aptInfo` 의존이 키에 직접 박혀 있다

56개 중 **34개**가 `authStore.getAptInfo()`를 키에 넣는다. 단지 전환(`useChangeApt`) 시
키가 바뀌면서 자연스럽게 캐시가 갈리는 구조다.

**React 이관**: 타깃 컨벤션(`04-state.md`)은 `queryOptions`로 키를 선언한다.
`aptInfo`를 어디에 둘지가 선행 결정이다(계획서 Phase 4-2). Zustand 스토어에 두고
**`queryOptions`를 인자 받는 함수로** 만드는 형태가 자연스럽다:

```ts
export const residentDetailQuery = ({ aptResidentUuid }: { aptResidentUuid: string }) =>
  queryOptions({ queryKey: ['residentDetailInfo', aptResidentUuid] as const, ... })
```

### 4-2. 옵셔널 체이닝이 일관되지 않다

`getAptInfo().aptResidentUuid`(직접)와 `getAptInfo()?.aptResidentUuid`(옵셔널)가 섞여 있다.
`aptInfo`가 `null`이면 **전자는 런타임 에러**, 후자는 키에 `undefined`가 들어간다.

TS로 옮기면 이 차이가 타입 레벨에서 드러난다. **동작 등가를 위해 옵셔널 체이닝 여부를
파일별로 그대로 따라가되**, `enabled` 가드(`validateQueryEnabledParams`)가 실제로 막고 있는지
Phase 6에서 도메인별로 확인한다. → `deferred.md`

### 4-3. 파라미터가 빠진 키 3건

`['aptMallDetail']`, `['communityPostDetail', aptResidentUuid]`, `['complaintsPostDetail', aptResidentUuid]`
— 대상 식별자가 키에 없다. 캐시 오염 가능성이 있으나 **등가 이관 원칙상 그대로 옮긴다.**
Q-Q2에서 실제 증상이 있는지 확인 후 `deferred.md`로.

---

## 5. 이관 매핑

| 레거시                                                  | 타깃                                                                        |
| ------------------------------------------------------- | --------------------------------------------------------------------------- |
| `lib/queries/<domain>/useGetXxx.js`                     | `features/<domain>/queries/xxxQuery.ts` — `queryOptions`                    |
| `lib/queries/<domain>/usePostXxx.js`                    | `features/<domain>/queries/usePostXxx.ts` — mutation 훅                     |
| `lib/queries/common/useInfiniteList.js`                 | `shared/hooks/useInfiniteList.ts` — **유일하게 shared로 올릴 쿼리 유틸**    |
| `invalidateQueries([...])` 27곳                         | `invalidateQueries({ queryKey: [...] })`                                    |
| 반환 `{ data: xxx, isLoading: isXxxLoading }` 개명 패턴 | 동일 (`02-naming.md`와 일치)                                                |
| `QueryClient` 기본값 `retry: 0` (쿼리·뮤테이션 모두)    | ⚠️ 타깃은 쿼리 `retry` 2회 + `throwOnError: true`. **동작이 다르다** — 아래 |

### ⚠️ QueryClient 기본값 차이

| 항목                   | 레거시 (`src/main.js`)         | 타깃 (`shared/lib/queryClient.ts`) |
| ---------------------- | ------------------------------ | ---------------------------------- |
| `queries.retry`        | **0**                          | 4xx면 0, 아니면 최대 2             |
| `queries.throwOnError` | 미설정 (false)                 | **true** — 에러 바운더리가 렌더    |
| `queries.staleTime`    | 미설정 (0)                     | **60_000**                         |
| `mutations.retry`      | 0                              | false (동일)                       |
| 전역 에러 토스트       | 없음 (훅마다 `swalErrorModal`) | `MutationCache.onError` → sonner   |

**이것은 사용자에게 보이는 동작 차이다.** `staleTime` 60초는 재조회 빈도를,
`throwOnError`는 에러 화면 표시 방식을, `retry`는 실패 체감 시간을 바꾼다.

**등가 이관 원칙상 레거시 값(`retry: 0`, `staleTime: 0`)을 따라야 한다.**
다만 에러 표시 방식(SweetAlert 모달 vs 에러 바운더리 + 토스트)은 화면 단위로 달라
**Phase 5 파일럿에서 확정한다.** → `[확인 필요]` Q-Q3

---

## 6. `[확인 필요]`

| #    | 질문                                                                                                                  | 근거                                        |
| ---- | --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| Q-Q1 | 조회 훅 4개(`useGetNoticeList` 등)가 내부에서 `invalidateQueries`를 호출하는 의도는?                                  | §1 — 검색어·카테고리 변경 시 강제 갱신 추정 |
| Q-Q2 | 파라미터가 빠진 키 3건(`aptMallDetail`, `communityPostDetail`, `complaintsPostDetail`)에서 캐시 오염 증상이 있었는가? | §4-3                                        |
| Q-Q3 | 에러 표시 방식 — 레거시는 훅마다 `swalErrorModal`, 타깃은 에러 바운더리 + 전역 토스트. 화면별로 어느 쪽을 따르는가?   | §5 — Phase 5에서 확정                       |

---

**다음 산출물**: `domain-codes.md` · `env-vars.md`
