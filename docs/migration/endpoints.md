# API 엔드포인트 인벤토리 — 레거시 `apt-resident-fe`

> 기준 SHA `6d5bf22` (2026-07-27) · 추출원 `src/api/*.js` 17개 모듈 + `axios.js`
> 전체 계획: `~/.claude/plans/working-smcom-apt-resident-fe-tranquil-charm.md`

## 집계

| 모듈                |    함수 | 도메인                                                       |
| ------------------- | ------: | ------------------------------------------------------------ |
| `board.js`          |      42 | 게시판(공지·전체공지·소통공간·민원공간·차단·신고)            |
| `parking.js`        |      25 | 주차(방문예약·항상허용·즐겨찾기·거부·정기권·입출차·마일리지) |
| `auth.js`           |      10 | 인증·회원가입                                                |
| `resident.js`       |      10 | 입주민 정보·비밀번호·알림설정·탈퇴                           |
| `lobbyPhone.js`     |       9 | 로비폰                                                       |
| `aptMall.js`        |       8 | 아파트몰(주말조식)                                           |
| `vote.js`           |       8 | 전자투표                                                     |
| `movingHouse.js`    |       7 | 이사예약                                                     |
| `repair.js`         |       6 | 하자보수                                                     |
| `survey.js`         |       6 | 설문조사                                                     |
| `faceRegister.js`   |       5 | 안면인식                                                     |
| `fireInspection.js` |       3 | 소방 자가점검                                                |
| `apass.js`          |       2 | A-PASS                                                       |
| `apt.js`            |       2 | 관리사무소                                                   |
| `kiosk.js`          |       2 | 방문증 키오스크                                              |
| `managementFee.js`  |       2 | 관리비                                                       |
| `shopping.js`       |       1 | 쇼핑 SSO                                                     |
| **합계**            | **148** |                                                              |

> **계획서의 "엔드포인트 150개"는 `axios.js`가 export하는 인스턴스 2개(`client`·`auth`)가 섞인 수치였다.
> 실제 엔드포인트 함수는 148개다.**

`src/api/mocks/` 디렉터리는 **비어 있다**.

---

## 1. axios 인스턴스 → 타깃 매핑

`src/api/axios.js`가 두 인스턴스를 export한다. 각 API 함수가 어느 것을 쓰는지가
타깃의 `api` / `publicApi` 선택을 그대로 결정한다.

| 레거시                             | 용도                                                        | 타깃 (`@/shared/lib/apiClient`) |
| ---------------------------------- | ----------------------------------------------------------- | ------------------------------- |
| `client`                           | 인증 불필요 (로그인·회원가입·비회원 투표/설문)              | **`publicApi`**                 |
| `auth`                             | 인증 필요 (`Authorization: Bearer` 자동 부착 + 401 refresh) | **`api`**                       |
| `customAxios` (`resident.js` 내부) | 비밀번호 재설정 전용. 별도 `axios.create()`                 | ⚠️ §5 참조                      |

### 베이스 경로 상수 (`src/constants/api.js`)

```js
apiApartmant = '/apartmant/resident'
apiParking = '/parking/resident'
apiBoard = '/board/resident'
```

비상수 경로도 존재한다 — `/board/non-resident/...`(비회원 투표·설문), `/apartmant/app/version`,
`/apartmant/sms/password-reset/...`. 타깃에서는 **엔드포인트 문자열을 각 feature의 `api/`가 소유**한다
(`docs/conventions/03-api.md`).

---

## 2. `auth.js` — 10개

|   # | 함수                           | METHOD | 경로                                     | 인스턴스   | 파라미터                                                                                                                                                                 |
| --: | ------------------------------ | ------ | ---------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
|   1 | `getCertificationField`        | GET    | `/apartmant/resident/kmc`                | `client`   | query: `type`                                                                                                                                                            |
|   2 | `postAccessTokenReissue`       | POST   | `/apartmant/resident/token-refresh`      | `client`   | **header** `refresh-token`, body `{}`                                                                                                                                    |
|   3 | `getAptList`                   | GET    | `/apartmant/resident/apt`                | `client`   | query: `keyword`                                                                                                                                                         |
|   4 | `postSignUp`                   | POST   | `/apartmant/resident/sign-up`            | `client`   | body: `apiToken, certNum, nickName, password, aptUuid, dong, ho, householdHeadFlag, name, birthDay, gender, nation, marketingDataConsentFlag, receiveAdvertsConsentFlag` |
|   5 | `postVersionOneResidentSignUp` | POST   | `/apartmant/resident/old/sign-up`        | **`auth`** | body: `apiToken, certNum`                                                                                                                                                |
|   6 | `postLogin`                    | POST   | `/apartmant/resident/login`              | `client`   | body: `id, password`                                                                                                                                                     |
|   7 | `getLoginInfo`                 | GET    | `/apartmant/resident/login/info`         | `auth`     | —                                                                                                                                                                        |
|   8 | `getWaitingMemberLoginInfo`    | GET    | `/apartmant/resident/login/waiting-info` | `client`   | **query: `id`, `password`**                                                                                                                                              |
|   9 | `deleteLogout`                 | DELETE | `/apartmant/resident/logout`             | `auth`     | **header** `refresh-token`                                                                                                                                               |
|  10 | `patchPasswordEdit`            | PATCH  | `/apartmant/resident/password`           | `auth`     | body: `oldPassword, password`                                                                                                                                            |

### 인증 계약 관련 (Phase 0-1 직결)

- **`#6` 로그인**: 토큰이 **응답 헤더**로 온다 — `authorization`, `refresh-token`.
  타깃 `features/auth/api/auth.ts`는 응답 **본문**의 `{ accessToken }`을 가정한다. **계약 변경 대상.**
- **`#2` 토큰 재발급**: refresh token을 **요청 헤더**로 보내고, 새 토큰을 **응답 헤더**에서 읽는다.
  타깃 `apiClient.ts`는 `withCredentials` 쿠키 + `REFRESH_ENDPOINT='/token-refresh'`를 가정. **계약 변경 대상.**
- **`#9` 로그아웃**: refresh token을 헤더로 전달. 쿠키 전환 시 헤더 불필요해진다.
- ⚠️ **`#8` `getWaitingMemberLoginInfo`가 아이디·비밀번호를 쿼리스트링으로 보낸다.**
  URL·로그·리퍼러에 평문 비밀번호가 남는다. 등가 이관 원칙상 동작은 유지하되,
  **0-3(자동 로그인 대체 설계)에서 함께 다뤄야 할 보안 항목.** `[확인 필요]`
- **`#5`만 `auth` 인스턴스**를 쓴다. 나머지 회원가입 계열은 `client`. 버전1 입주민은
  이미 토큰을 가진 상태에서 가입을 마치기 때문으로 보임. `[확인 필요]`

---

## 3. `resident.js` — 10개

|   # | 함수                          | METHOD | 경로                                                                                        | 인스턴스             | 파라미터                                                     |
| --: | ----------------------------- | ------ | ------------------------------------------------------------------------------------------- | -------------------- | ------------------------------------------------------------ |
|  11 | `getResidentDetailInfo`       | GET    | `/apartmant/resident/apt-resident/{aptResidentUuid}`                                        | `auth`               | path                                                         |
|  12 | `getApartmantVersion`         | GET    | `/apartmant/app/version`                                                                    | `client`             | —                                                            |
|  13 | `getResidentAptList`          | GET    | `/apartmant/resident/apt-resident/apt`                                                      | `auth`               | —                                                            |
|  14 | `patchPasswordReset`          | PATCH  | `/apartmant/resident/re-set-password`                                                       | ⚠️ **`customAxios`** | body: `password`, **header** `Authorization: Bearer {token}` |
|  15 | `postPasswordResetSendCode`   | POST   | `/apartmant/sms/password-reset/send-code`                                                   | `client`             | body: `request` (전체 객체 그대로)                           |
|  16 | `postPasswordResetCodeVerify` | POST   | `/apartmant/sms/password-reset/code-verify`                                                 | `client`             | body: `request` (전체 객체 그대로)                           |
|  17 | `getNotificationSetting`      | GET    | `/apartmant/resident/apt-resident/{aptResidentUuid}/notification-setting`                   | `auth`               | path                                                         |
|  18 | `putMarketingConsent`         | PUT    | `/apartmant/resident/apt-resident/{aptResidentUuid}/notification-setting/marketing-consent` | `auth`               | body: `marketingDataConsentFlag, receiveAdvertsConsentFlag`  |
|  19 | `patchMyProfile`              | PATCH  | `/apartmant/resident/apt-resident/{aptResidentUuid}/info`                                   | `auth`               | body: `nickName`                                             |
|  20 | `deleteAccount`               | DELETE | `/apartmant/resident`                                                                       | `auth`               | — (베이스 경로 자체를 DELETE)                                |

> **`#14`가 세 번째 axios 인스턴스를 만든다** (`axios.create({ baseURL: serverRequestUrl })`).
> 비밀번호 재설정 토큰을 `Authorization` 헤더로 직접 넣기 때문에 `auth` 인스턴스(로그인 토큰 자동 부착)를
> 쓸 수 없어서다. 타깃에서는 `publicApi`에 `headers` 옵션을 직접 주면 되므로 **인스턴스 추가 불필요**.
> 타깃 CLAUDE.md의 "axios 직접 import 금지" 규칙에도 맞는다.

---

## 4. `board.js` — 42개

### 4-1. 게시판 공통 — 차단 (3)

|   # | 함수                      | METHOD | 경로                                                | 파라미터               |
| --: | ------------------------- | ------ | --------------------------------------------------- | ---------------------- |
|  21 | `getBoardBlockedUserList` | GET    | `/board/resident/{residentUuid}/block`              | path                   |
|  22 | `postBoardBlockUser`      | POST   | `/board/resident/{residentUuid}/block/{authorUuid}` | body: `authorTextName` |
|  23 | `deleteBoardBlockUser`    | DELETE | `/board/resident/{residentUuid}/block/{authorUuid}` | path                   |

### 4-2. 공지사항 (5)

|   # | 함수                      | METHOD | 경로                                              | 파라미터                                    |
| --: | ------------------------- | ------ | ------------------------------------------------- | ------------------------------------------- |
|  24 | `getNoticeTopThree`       | GET    | `/board/resident/notice/{aptUuid}/top-three`      | path · **주석: 미사용중**                   |
|  25 | `getNoticeCategoryList`   | GET    | `/board/resident/notice/{aptUuid}/category`       | path                                        |
|  26 | `getNoticeList`           | GET    | `/board/resident/notice/{aptUuid}`                | query: `page, size, keyword, categoryUuid`  |
|  27 | `getNoticeDetail`         | GET    | `/board/resident/notice/{aptUuid}/{noticeUuid}`   | path                                        |
|  28 | `getNoticePopupThumbnail` | GET    | `/board/resident/notice/{aptUuid}/top1-thumbnail` | path (썸네일 보유 + 생성 7일 이내 최신 1건) |

### 4-3. 전체(아파트먼트) 공지사항 (2)

|   # | 함수                    | METHOD | 경로                                                                       | 파라미터                     |
| --: | ----------------------- | ------ | -------------------------------------------------------------------------- | ---------------------------- |
|  29 | `getGlobalNoticeList`   | GET    | `/board/resident/{aptResidentUuid}/apartmant-notice`                       | query: `page, size, keyword` |
|  30 | `getGlobalNoticeDetail` | GET    | `/board/resident/{aptResidentUuid}/apartmant-notice/{apartmantNoticeUuid}` | path                         |

### 4-4. 소통공간 (16)

접두사 `/board/resident/{residentUuid}/community`

|   # | 함수                                | METHOD | 경로 (접두사 이후)                       | 파라미터                                                   |
| --: | ----------------------------------- | ------ | ---------------------------------------- | ---------------------------------------------------------- |
|  31 | `postCommunityPost`                 | POST   | ``                                       | **multipart/form-data** + `onUploadProgress`               |
|  32 | `patchCommunityPost`                | PATCH  | `/{communityUuid}`                       | **multipart** + `onUploadProgress`                         |
|  33 | `getCommunityCategoryList`          | GET    | `/category`                              | —                                                          |
|  34 | `getCommunityPostList`              | GET    | ``                                       | query: `page, size, keyword, categoryUuid`                 |
|  35 | `getCommunityPostDetail`            | GET    | `/{communityUuid}`                       | path                                                       |
|  36 | `patchCommunityPostLike`            | PATCH  | `/{communityUuid}/like`                  | 본문 없음 (토글)                                           |
|  37 | `deleteCommunityPost`               | DELETE | `/{communityUuid}`                       | path                                                       |
|  38 | `getCommunityCommentList`           | GET    | `/{communityUuid}/comment`               | path                                                       |
|  39 | `getCommunityCommentDetail`         | GET    | `/{communityUuid}/comment/{commentUuid}` | 댓글·대댓글 공통                                           |
|  40 | `postCommunityComment`              | POST   | `/{communityUuid}/comment`               | **multipart** + `onUploadProgress`                         |
|  41 | `deleteCommunityComment`            | DELETE | `/{communityUuid}/comment/{commentUuid}` | path                                                       |
|  42 | `patchCommunityComment`             | PATCH  | `/{communityUuid}/comment/{commentUuid}` | **multipart** + `onUploadProgress`                         |
|  43 | `postCommunityReply`                | POST   | `/{communityUuid}/comment/{commentUuid}` | **multipart** + `onUploadProgress` (답글 = 댓글 하위 POST) |
|  44 | `postCommunityPostReport`           | POST   | `/{communityUuid}/report`                | body: `content`                                            |
|  45 | `getCommunityMyActivityPostList`    | GET    | `/my`                                    | query: `page, size`                                        |
|  46 | `getCommunityMyActivityCommentList` | GET    | `/my/comment`                            | query: `page, size`                                        |

> `#39`와 `#43`은 같은 경로에 GET/POST로 갈린다 — 댓글 상세 조회 vs 답글 등록.

### 4-5. 민원공간 (16)

접두사 `/board/resident/{residentUuid}/complaint`. **소통공간과 완전 대칭**이지만 두 가지가 다르다:

|   # | 함수                                 | METHOD | 경로 (접두사 이후)                        | 파라미터                                   |
| --: | ------------------------------------ | ------ | ----------------------------------------- | ------------------------------------------ |
|  47 | `postComplaintsPost`                 | POST   | ``                                        | **multipart** + `onUploadProgress`         |
|  48 | `patchComplaintsPost`                | PATCH  | `/{complaintsUuid}`                       | **multipart** + `onUploadProgress`         |
|  49 | `getComplaintsCategoryList`          | GET    | `/category`                               | —                                          |
|  50 | `getComplaintsPostList`              | GET    | **`/list`** ⚠️                            | query: `page, size, keyword, categoryUuid` |
|  51 | `getComplaintsPostDetail`            | GET    | `/{complaintsUuid}`                       | path                                       |
|  52 | `patchComplaintsPostLike`            | PATCH  | `/{complaintsUuid}/like`                  | 본문 없음                                  |
|  53 | `deleteComplaintsPost`               | DELETE | `/{complaintsUuid}`                       | path                                       |
|  54 | `getComplaintsCommentList`           | GET    | `/{complaintsUuid}/comment`               | path                                       |
|  55 | `getComplaintsCommentDetail`         | GET    | `/{complaintsUuid}/comment/{commentUuid}` | 댓글·대댓글 공통                           |
|  56 | `postComplaintsComment`              | POST   | `/{complaintsUuid}/comment`               | **multipart** + `onUploadProgress`         |
|  57 | `deleteComplaintsComment`            | DELETE | `/{complaintsUuid}/comment/{commentUuid}` | path                                       |
|  58 | `patchComplaintsComment`             | PATCH  | `/{complaintsUuid}/comment/{commentUuid}` | **multipart** + `onUploadProgress`         |
|  59 | `postComplaintsReply`                | POST   | `/{complaintsUuid}/comment/{commentUuid}` | **multipart** + `onUploadProgress`         |
|  60 | `postComplaintsPostReport`           | POST   | `/{complaintsUuid}/report`                | body: `content`                            |
|  61 | `getComplaintsMyActivityPostList`    | GET    | `/my`                                     | query: `page, size`                        |
|  62 | `getComplaintsMyActivityCommentList` | GET    | `/my/comment`                             | query: `page, size`                        |

> ⚠️ **비대칭 2건**
>
> 1. 리스트 조회(`#50`)만 `/complaint/list` — 소통공간(`#34`)은 `/community`. **경로 규칙 불일치.**
> 2. 단수/복수 혼용: 경로는 `complaint`(단수), 함수명은 `Complaints`(복수).
>
> 이 대칭성 덕분에 React 이관 시 **소통공간/민원공간을 한 세트의 제네릭 API로 묶고 싶어지지만,
> 등가 이관 원칙상 경로가 실제로 다르므로 무리한 추상화는 금지.** `docs/conventions/01`의
> "불필요한 추상화를 만들지 않는다"에도 맞다.

---

## 5. `parking.js` — 25개

### 5-1. 주차 공통 (5)

|   # | 함수                       | METHOD | 경로                                                                                    | 파라미터                               |
| --: | -------------------------- | ------ | --------------------------------------------------------------------------------------- | -------------------------------------- |
|  63 | `getVisitPurposeList`      | GET    | `/parking/resident/visit-purpose/{aptUuid}`                                             | path                                   |
|  64 | `putRegularPush`           | PUT    | `/apartmant/resident/apt-resident/{aptResidentUuid}/notification-setting/regular-push`  | body: `regularPushFlag`                |
|  65 | `putExternalPush`          | PUT    | `/apartmant/resident/apt-resident/{aptResidentUuid}/notification-setting/external-push` | body: `externalPushFlag`               |
|  66 | `patchWallPadNotification` | PATCH  | `/apartmant/resident/apt-resident/{aptResidentUuid}/notification-setting/wall-pad`      | body: `wallPadParkingNotificationFlag` |
|  67 | `getParkingPolicy`         | GET    | `/parking/resident/{aptResidentUuid}/parking-policy`                                    | query: `yearMonthDate`                 |

> `#64`~`#66`은 주차 모듈에 있지만 **`apartmant` 베이스 경로**를 쓰는 알림 설정 API다.
> 타깃 이관 시 `features/mypage`(알림 설정)와 `features/parking` 중 어디에 둘지 판단 필요.
> `useAlarmSetting` 컴포저블(272 LOC)이 이 3개를 알림설정 화면에서 함께 쓴다 → **알림 설정 쪽이 자연스럽다.**

### 5-2. 방문예약 (4)

|   # | 함수                      | METHOD | 경로                                                             | 파라미터                                                                                                         |
| --: | ------------------------- | ------ | ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
|  68 | `getReservationCarList`   | GET    | `/parking/resident/reservation/{aptResidentUuid}/list`           | query: `page, size, startDate, endDate`                                                                          |
|  69 | `getReservationCarDetail` | GET    | `/parking/resident/reservation/{residentUuid}/{parkingUuid}`     | path                                                                                                             |
|  70 | `postReservationCar`      | POST   | `/parking/resident/reservation/{residentUuid}`                   | body: `carNum, inParkingScheduledDate, outParkingScheduledDate, phone, visitPurposeUuid, memo, notificationFlag` |
|  71 | `deleteReservedCar`       | DELETE | `/parking/resident/reservation/{residentUuid}/{reservationUuid}` | path                                                                                                             |

### 5-3. 항상허용 (3)

|   # | 함수                     | METHOD | 경로                                                    | 파라미터                                                                  |
| --: | ------------------------ | ------ | ------------------------------------------------------- | ------------------------------------------------------------------------- |
|  72 | `getAlwaysAllowCarList`  | GET    | `/parking/resident/always-allow/list/{aptResidentUuid}` | query: `page, size`                                                       |
|  73 | `postAlwaysAllowCar`     | POST   | `/parking/resident/always-allow/{residentUuid}`         | body: `carNum, nickName, phone, visitPurposeUuid, memo, notificationFlag` |
|  74 | `deleteAlwaysAllowedCar` | DELETE | `/parking/resident/always-allow/{alwaysAllowUuid}`      | **path 인자 1개 (객체 아님)**                                             |

> **수정(PATCH) API가 없다.** 라우트에도 `alwaysAllow/edit`이 없다(routes.md R-1)
> → **API·라우트 양쪽에서 일관되게 부재하므로 의도된 제약으로 보인다.** R-1 답변에 반영할 근거.

### 5-4. 즐겨찾기 (4)

|   # | 함수                  | METHOD | 경로                                                       | 파라미터                        |
| --: | --------------------- | ------ | ---------------------------------------------------------- | ------------------------------- |
|  75 | `getBookmarkCarList`  | GET    | `/parking/resident/{aptResidentUuid}/bookmark`             | query: `page, size`             |
|  76 | `postBookmarkCar`     | POST   | `/parking/resident/{residentUuid}/bookmark`                | body: `carNum, nickName, phone` |
|  77 | `patchBookmarkCar`    | PATCH  | `/parking/resident/{residentUuid}/bookmark/{bookmarkUuid}` | body: `nickName, carNum, phone` |
|  78 | `deleteBookmarkedCar` | DELETE | `/parking/resident/{residentUuid}/bookmark/{bookmarkUuid}` | path                            |

> 즐겨찾기는 `visitPurposeUuid`·`memo`·`notificationFlag`가 없고, 항상허용은 있다.
> **같은 화면 컴포넌트(`CarManagementAddView`)를 쓰지만 필드가 다르다** — 이관 시 주의.

### 5-5. 거부차량 (2)

|   # | 함수                   | METHOD | 경로                                                      | 파라미터                                    |
| --: | ---------------------- | ------ | --------------------------------------------------------- | ------------------------------------------- |
|  79 | `postRejectCar`        | POST   | `/parking/resident/reject/{residentUuid}`                 | body: `carNum, reason`                      |
|  80 | `postRejectCarRelease` | POST   | `/parking/resident/reject/release-request/{residentUuid}` | body: `carNum, reason` · **주석: 미사용중** |

### 5-6. 정기권 (1)

|   # | 함수                | METHOD | 경로                                                    | 파라미터            |
| --: | ------------------- | ------ | ------------------------------------------------------- | ------------------- |
|  81 | `getRegularCarList` | GET    | `/parking/resident/{aptResidentUuid}/regular/household` | query: `page, size` |

### 5-7. 입출차·미출차 (4)

|   # | 함수                         | METHOD | 경로                                                           | 파라미터                                               |
| --: | ---------------------------- | ------ | -------------------------------------------------------------- | ------------------------------------------------------ |
|  82 | `getInOutCarList`            | GET    | `/parking/resident/inout-parking/{aptResidentUuid}`            | query: `page, size, startDate, endDate, desc, carType` |
|  83 | `getInOutCarDetail`          | GET    | `/parking/resident/inout-parking/{residentUuid}/{parkingUuid}` | path                                                   |
|  84 | `getNotOutCarList`           | GET    | `/parking/resident/inout-parking/{aptResidentUuid}`            | query: `page, size`                                    |
|  85 | `getNotOutCarHistorySummary` | GET    | `/parking/resident/inout-parking/{aptResidentUuid}`            | query: `page, size`                                    |

> ⚠️ **`#82`·`#84`·`#85`가 완전히 같은 엔드포인트를 호출한다.** `#84`와 `#85`는 구현도 동일하다
> (파라미터·경로·본문 전부 같음). 미출차 전용 API가 따로 없고, 미출차 라우트도 주석 처리되어 있다.
> → **routes.md R-2("미출차 내역은 폐기인가")의 답에 가까운 근거: 미출차 기능은 미완성 상태로 방치된 것으로 보인다.** `[확인 필요]`

### 5-8. 마일리지 (2)

|   # | 함수                         | METHOD | 경로                                                        | 파라미터                                        |
| --: | ---------------------------- | ------ | ----------------------------------------------------------- | ----------------------------------------------- |
|  86 | `getParkingRemainingMileage` | GET    | `/parking/resident/{residentUuid}/mileage`                  | query: `startDate, endDate`                     |
|  87 | `getParkingMileageList`      | GET    | `/parking/resident/inout-parking/{aptResidentUuid}/mileage` | query: `page, size, startDate, endDate, isDesc` |

> `#82`는 `desc`, `#87`은 `isDesc` — **정렬 파라미터 이름이 다르다.** 서버 계약이므로 그대로 유지.

---

## 6. `vote.js` — 8개

**비회원(`/board/non-resident`) 경로가 핵심이다** — opinion 앱이 인증 없이 쓰는 API.

|   # | 함수                     | METHOD | 경로                                                    | 인스턴스     | 파라미터                  |
| --: | ------------------------ | ------ | ------------------------------------------------------- | ------------ | ------------------------- |
|  88 | `getVoteList`            | GET    | `/board/resident/vote/{aptResidentUuid}/list`           | `auth`       | query: `page, voteStatus` |
|  89 | `getVoteDetailInfo`      | GET    | `/board/non-resident/voter/{voterUuid}`                 | **`client`** | path                      |
|  90 | `getVoteDetailStatus`    | GET    | `/board/resident/vote/{residentUuid}/{voteUuid}/result` | `auth`       | path                      |
|  91 | `getVoteForm`            | GET    | `/board/non-resident/voter/{voterUuid}/select`          | **`client`** | path                      |
|  92 | `postVoteForm`           | POST   | `/board/non-resident/voter/{voterUuid}`                 | **`client`** | body: `formData`          |
|  93 | `getVoteHasVoterPending` | GET    | `/board/resident/vote/{residentUuid}/progress-vote`     | `auth`       | path                      |
|  94 | `patchVoteCertPass`      | PATCH  | `/board/non-resident/voter/{voterUuid}/auth/pass`       | **`client`** | body: `apiToken, certNum` |
|  95 | `patchVoteCertNamePhone` | PATCH  | `/board/non-resident/voter/{voterUuid}/auth/name-phone` | **`client`** | body: `name, phone`       |

> `#89`와 `#92`가 같은 경로에 GET/POST — 투표 정보 조회 vs 투표 제출.
> `#88`·`#90`·`#93`(회원 전용, `auth`)은 **메인 앱에서만** 쓰이고, 나머지 5개(`client`)는 **양쪽 앱 공용**이다.

---

## 7. `survey.js` — 6개

Vote와 대칭. 다만 회원 전용 API가 리스트 1개뿐이다(투표는 3개).

|   # | 함수                       | METHOD | 경로                                                                      | 인스턴스     | 파라미터                  |
| --: | -------------------------- | ------ | ------------------------------------------------------------------------- | ------------ | ------------------------- |
|  96 | `getSurveyList`            | GET    | `/board/resident/{aptResidentUuid}/survey`                                | `auth`       | query: `page, state`      |
|  97 | `getSurveyDetail`          | GET    | `/board/non-resident/survey/respondent/{participantUuid}/survey-info`     | **`client`** | path                      |
|  98 | `getSurveyForm`            | GET    | `/board/non-resident/survey/respondent/{participantUuid}/question`        | **`client`** | path                      |
|  99 | `postSurveyForm`           | POST   | `/board/non-resident/survey/respondent/{participantUuid}/answer`          | **`client`** | body: `formData`          |
| 100 | `patchSurveyCertPass`      | PATCH  | `/board/non-resident/survey/respondent/{participantUuid}/auth/pass`       | **`client`** | body: `apiToken, certNum` |
| 101 | `patchSurveyCertNamePhone` | PATCH  | `/board/non-resident/survey/respondent/{participantUuid}/auth/name-phone` | **`client`** | body: `name, phone`       |

> 투표는 `voteStatus`, 설문은 `state` — **동일 개념의 쿼리 파라미터 이름이 다르다.** 서버 계약이므로 유지.
> 설문에는 투표의 `getVoteDetailStatus`(현황/결과)·`getVoteHasVoterPending`에 해당하는 API가 없다.

---

## 8. `aptMall.js` — 8개

접두사 `/apartmant/resident/{aptResidentUuid}/apt-mall`. 전부 `auth`.

|   # | 함수                              | METHOD | 경로 (접두사 이후)          | 파라미터                                                                                                |
| --: | --------------------------------- | ------ | --------------------------- | ------------------------------------------------------------------------------------------------------- |
| 102 | `getAptMallList`                  | GET    | ``                          | path                                                                                                    |
| 103 | `getAptMallDetail`                | GET    | `/{aptMallUuid}`            | path                                                                                                    |
| 104 | `getAptMallMyOrderList`           | GET    | `/order`                    | query: `page, size`                                                                                     |
| 105 | `getAptMallMyOrderDetail`         | GET    | `/order/{mealUuid}`         | path                                                                                                    |
| 106 | `deleteAptMallMyOrder`            | DELETE | `/order/{mealUuid}`         | path                                                                                                    |
| 107 | `getAptMallOrderCalendarTimeList` | GET    | `/{aptMallUuid}/order/time` | query: `orderDate`                                                                                      |
| 108 | `getAptMallOrderMenuList`         | GET    | `/{aptMallUuid}/menu`       | path                                                                                                    |
| 109 | `postAptMallOrderForm`            | POST   | `/{aptMallUuid}/order`      | body: `aptMallOrderMenuList, aptMallOrderTimeUuid, orderDate, aptMallOrderType, personCount, orderNote` |

> 파라미터 이름이 `mealUuid`(식사)와 `aptMallOrderUuid`(라우트 #97) 사이에서 갈린다 —
> **라우트는 `:aptMallOrderUuid`, API는 `mealUuid`.** 같은 값을 가리키는 것으로 보임. `[확인 필요]`

---

## 9. `lobbyPhone.js` — 9개

전부 `auth`.

|   # | 함수                               | METHOD | 경로                                                                     | 파라미터                                    |
| --: | ---------------------------------- | ------ | ------------------------------------------------------------------------ | ------------------------------------------- |
| 110 | `putLobbyPhonePassword`            | PUT    | `/apartmant/resident/{aptResidentUuid}/lobby-phone/password`             | body: `password`                            |
| 111 | `getLobbyPhoneEncryptedQrData`     | GET    | `/apartmant/resident/{aptResidentUuid}/lobby-phone/qr`                   | path                                        |
| 112 | `getLobbyPhonePushAlarmState`      | GET    | `/apartmant/resident/{aptResidentUuid}/lobby-phone/push`                 | path                                        |
| 113 | `putLobbyPhonePushAlarmState`      | PUT    | `/apartmant/resident/{aptResidentUuid}/lobby-phone/push`                 | **본문 없음 (토글)**                        |
| 114 | `putLobbyPhoneResidentLogout`      | PUT    | `/apartmant/resident/{aptResidentUuid}/lobby-phone/logout`               | 본문 없음                                   |
| 115 | `deleteLobbyPhoneResidentDeletion` | DELETE | `/apartmant/resident/{aptResidentUuid}/lobby-phone/resident`             | path                                        |
| 116 | `getLobbyPhoneTempPasswordList`    | GET    | `/apartmant/resident/{aptResidentUuid}/lobby-phone/temp-password`        | **path 인자 1개 (객체 아님)**               |
| 117 | `postCreateLobbyPhoneTempPassword` | POST   | `/apartmant/resident/{aptResidentUuid}/lobby-phone/temp-password`        | **위치 인자 2개** `(data, aptResidentUuid)` |
| 118 | `deleteLobbyPhoneTempPassword`     | DELETE | `/apartmant/resident/{aptResidentUuid}/lobby-phone/temp-password/{uuid}` | **위치 인자 2개** `(aptResidentUuid, uuid)` |

> `#116`~`#118`은 `apiApartmant` 상수 대신 경로를 **하드코딩**했다(값은 동일).
> 또한 이 3개만 객체 인자 컨벤션을 어긴다 — 타깃은 `docs/conventions/07`에 따라 **전부 단일 객체 인자로 통일**한다.
> `#117`은 인자 순서까지 뒤바뀌어 있어(`data`가 앞) 이관 시 실수하기 쉬운 지점.
> `#114`는 로그아웃 플로우(`useLogoutFlow`)에서 **로비폰 컨텐츠 보유 세대만** 호출한다.

---

## 10. `faceRegister.js` — 5개

접두사 `/apartmant/resident/{aptResidentUuid}/lobby-phone/face-recog`. 전부 `auth`.

|   # | 함수                           | METHOD | 경로 (접두사 이후) | 파라미터                                                                               |
| --: | ------------------------------ | ------ | ------------------ | -------------------------------------------------------------------------------------- |
| 119 | `getLobbyPhoneFaceRecogList`   | GET    | ``                 | path                                                                                   |
| 120 | `getLobbyPhoneFaceRecogDetail` | GET    | `/{faceRecogGuid}` | path                                                                                   |
| 121 | `postLobbyPhoneFaceRecog`      | POST   | ``                 | **FormData 직접 조립**: `faceRecogName`, `faceRecogDescription`(옵션), `faceRecogFile` |
| 122 | `putLobbyPhoneFaceRecog`       | PUT    | ``                 | body: `faceRecogGuid, faceRecogName, faceRecogDescription` (**경로에 guid 없음**)      |
| 123 | `deleteLobbyPhoneFaceRecog`    | DELETE | ``                 | ⚠️ **DELETE with body**: `{ data: { faceRecogGuid } }`                                 |

> ⚠️ **`#123`은 DELETE 요청에 본문을 싣는다.** axios `config.data`로 전달. 타깃 이관 시
> `api.delete(url, { data: {...} })` 형태를 그대로 유지해야 한다 — 흔히 빠뜨리는 지점.
> `#121`만 API 함수 안에서 `FormData`를 조립한다(다른 multipart 함수들은 호출부에서 만들어 넘김).
> 식별자가 `Uuid`가 아니라 **`Guid`**다 — 외부 안면인식 시스템 식별자로 보임.

---

## 11. 소형 모듈 — 25개

### `movingHouse.js` (7) — 접두사 `/board/resident/{aptResidentUuid}/move`

|   # | 함수                                | METHOD | 경로 (접두사 이후)          | 파라미터                                                                                 |
| --: | ----------------------------------- | ------ | --------------------------- | ---------------------------------------------------------------------------------------- |
| 124 | `getMovingHouseList`                | GET    | `/reservation`              | query: `moveReservationStatus` (**페이징 없음**)                                         |
| 125 | `getMovingHouseDetail`              | GET    | `/reservation/{movingUuid}` | path                                                                                     |
| 126 | `deleteMovingHouseReceipt`          | DELETE | `/reservation/{movingUuid}` | path                                                                                     |
| 127 | `getMovingHouseSetting`             | GET    | `/setting`                  | path                                                                                     |
| 128 | `getMovingHouseReservationTimeList` | GET    | `/reservation-time`         | query: `moveDate`                                                                        |
| 129 | `getMovingHouseHolidayList`         | GET    | `/setting/move-holiday`     | path                                                                                     |
| 130 | `postMovingHouse`                   | POST   | `/reservation`              | body: `moveType, moveDate, moveReservationTimeUuid, depositorName, emergencyPhone, memo` |

### `repair.js` (6) — 접두사 `/board/resident/repair/{aptUuid}/{aptResidentUuid}`

|   # | 함수                    | METHOD | 경로 (접두사 이후) | 파라미터                           |
| --: | ----------------------- | ------ | ------------------ | ---------------------------------- |
| 131 | `getRepairStatusCount`  | GET    | `/state-list`      | path                               |
| 132 | `getRepairList`         | GET    | `/list`            | query: `page, size, state`         |
| 133 | `getRepairDetail`       | GET    | `/{repairUuid}`    | path                               |
| 134 | `deleteRepairReceipt`   | DELETE | `/{repairUuid}`    | path                               |
| 135 | `postRepairSubmission`  | POST   | ``                 | **multipart** + `onUploadProgress` |
| 136 | `patchRepairSubmission` | PATCH  | `/{repairUuid}`    | **multipart** + `onUploadProgress` |

> 하자보수만 **경로에 `aptUuid`와 `aptResidentUuid`를 둘 다** 요구한다.

### `fireInspection.js` (3) — 접두사 `/board/resident/{aptResidentUuid}/fire-inspection`

|   # | 함수                       | METHOD | 경로 (접두사 이후)                                              | 파라미터                                                                                                             |
| --: | -------------------------- | ------ | --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| 137 | `getFireInspectionStatus`  | GET    | ``                                                              | path                                                                                                                 |
| 138 | `postFireInspectionSubmit` | POST   | `/{householdFireInspectionUuid}`                                | **multipart, FormData 직접 조립**: `signatureFile` + `questionAnswerList[{i}].{sectionId,groupId,questionId,answer}` |
| 139 | `getFireInspectionDetail`  | GET    | `/{fireInspectionUuid}/household/{householdFireInspectionUuid}` | path                                                                                                                 |

> `#138`의 **인덱스 표기 FormData 키**(`questionAnswerList[0].sectionId`)는 Spring 바인딩 형식이다.
> 이관 시 이 문자열 조립 규칙을 그대로 재현해야 한다 — 서명 이미지(`CanvasSign` → base64 → File)와 함께 전송.

### `apass.js` (2) — 접두사 `/apartmant/resident/a-pass/{residentUuid}`

|   # | 함수               | METHOD | 경로 (접두사 이후)   | 파라미터                            |
| --: | ------------------ | ------ | -------------------- | ----------------------------------- |
| 140 | `getIsAPassActive` | GET    | `/apass-on-off-flag` | **path 인자 1개 (객체 아님)**       |
| 141 | `patchAPassActive` | PATCH  | `/apass-on-off-flag` | **본문 없음 (토글)**, path 인자 1개 |

### `apt.js` (2)

|   # | 함수                     | METHOD | 경로                                       | 파라미터      |
| --: | ------------------------ | ------ | ------------------------------------------ | ------------- |
| 142 | `getOfficeBusinessHours` | GET    | `/apartmant/resident/office/{aptUuid}`     | path 인자 1개 |
| 143 | `getOfficeContactList`   | GET    | `/apartmant/resident/department/{aptUuid}` | path 인자 1개 |

### `kiosk.js` (2)

|   # | 함수                     | METHOD | 경로                                                                           | 파라미터         |
| --: | ------------------------ | ------ | ------------------------------------------------------------------------------ | ---------------- |
| 144 | `getVisitorPassPassword` | GET    | `/apartmant/resident/{aptUuid}/apt/household/kiosk/password/{aptResidentUuid}` | path             |
| 145 | `putVisitorPassPassword` | PUT    | `/apartmant/resident/{aptUuid}/apt/household/kiosk/password/{aptResidentUuid}` | body: `password` |

### `managementFee.js` (2)

|   # | 함수                   | METHOD | 경로                                                           | 파라미터                                     |
| --: | ---------------------- | ------ | -------------------------------------------------------------- | -------------------------------------------- |
| 146 | `getImposeYearMonths`  | GET    | `/apartmant/resident/{aptResidentUuid}/bill/impose-yearmonths` | path                                         |
| 147 | `getManagementFeeBill` | GET    | `/apartmant/resident/{aptResidentUuid}/bill`                   | ⚠️ query: **`startDateTIme`, `endDateTIme`** |

> ⚠️ **`#147`의 쿼리 파라미터에 오타가 있다** — `startDateTIme`(대문자 I). 함수 인자는 정상(`startDateTime`)이고
> 전송 시에만 오타 키로 매핑한다. **서버가 이 키를 기대하고 있으므로 그대로 유지해야 한다.**
> 고치면 관리비 조회가 깨진다. 이관 시 반드시 보존.

### `shopping.js` (1)

|   # | 함수               | METHOD | 경로                                 | 파라미터 |
| --: | ------------------ | ------ | ------------------------------------ | -------- |
| 148 | `getShoppingToken` | GET    | `/apartmant/resident/commerce/token` | —        |

---

## 12. 이관 시 주의 항목

| #    | 항목                     | 내용                                                                                                                                                                                                                         |
| ---- | ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| E-1  | **에러 형태**            | 모든 함수가 `error.response` **원본 객체**를 throw한다(`Error` 아님). 소비자는 `error.data.error.errorCode` / `.message`를 읽는다. 타깃은 `ApiError { status, code, message }`. **에러코드 매핑표가 Phase 3의 필수 산출물.** |
| E-2  | **응답 언랩**            | 레거시는 `response` 전체를 반환하고 호출부가 `response.data.success.*`를 꺼낸다. 타깃 컨벤션(`03-api.md`)은 **`data`만 반환**. 응답 봉투(`{ success: ... }`) 처리 위치를 Phase 5에서 확정                                    |
| E-3  | **인자 컨벤션**          | 8개 함수가 위치 인자 또는 단일 스칼라 인자(`#74, #116, #117, #118, #140, #141, #142, #143` 등). 타깃은 **전부 단일 객체 인자**(`07-javascript.md`)                                                                           |
| E-4  | **multipart 12개**       | 게시판 8 + 하자보수 2 + 소방점검 1 + 안면인식 1. `onUploadProgress` 연동은 `useUploadProgress` 컴포저블이 담당 → React 훅으로                                                                                                |
| E-5  | **DELETE with body**     | `#123` 안면인식 삭제. 빠뜨리기 쉬움                                                                                                                                                                                          |
| E-6  | **서버 오타 키 보존**    | `#147` `startDateTIme`/`endDateTIme`                                                                                                                                                                                         |
| E-7  | **파라미터 이름 불일치** | `desc`(#82) vs `isDesc`(#87), `voteStatus`(#88) vs `state`(#96), `mealUuid`(API) vs `aptMallOrderUuid`(라우트)                                                                                                               |
| E-8  | **중복 엔드포인트**      | `#82`/`#84`/`#85`가 동일 URL. `#84`·`#85`는 구현까지 동일                                                                                                                                                                    |
| E-9  | **미사용 표시 2건**      | `#24` `getNoticeTopThree`, `#80` `postRejectCarRelease`. 이관 대상에서 제외할지 확인 필요                                                                                                                                    |
| E-10 | **비회원 API 10개**      | `/board/non-resident/**` — opinion 앱 전용 경로. `publicApi` 사용. Phase 0-6 결정에 직결                                                                                                                                     |
| E-11 | **쿼리스트링 비밀번호**  | `#8` `getWaitingMemberLoginInfo`. 보안 항목, 0-3에서 함께 처리                                                                                                                                                               |

## 13. `[확인 필요]` 목록

| #    | 질문                                                                                                | 근거                                   |
| ---- | --------------------------------------------------------------------------------------------------- | -------------------------------------- |
| E-Q1 | 로그인·토큰재발급의 **헤더 기반 토큰 전달**을 쿠키로 바꿀 수 있는가?                                | `#2`, `#6`, `#9` — Phase 0-1 핵심      |
| E-Q2 | `getWaitingMemberLoginInfo`가 비밀번호를 쿼리로 보내는 것은 의도인가? 서버가 body를 받을 수 있는가? | `#8`                                   |
| E-Q3 | `postVersionOneResidentSignUp`만 `auth` 인스턴스를 쓰는 이유는?                                     | `#5`                                   |
| E-Q4 | 미출차 관련 함수 2개(`#84`,`#85`)는 폐기 대상인가?                                                  | 동일 URL·동일 구현, 라우트도 주석 처리 |
| E-Q5 | "미사용중" 주석 2건(`#24`,`#80`)은 이관 제외인가?                                                   | 코드 주석                              |
| E-Q6 | `mealUuid`(API)와 `aptMallOrderUuid`(라우트)는 같은 값인가?                                         | §8                                     |
| E-Q7 | 응답 봉투 `{ success, error }` 구조가 전 API 공통인가?                                              | `response.data.success` 패턴이 전역적  |

---

**다음 산출물**: `query-keys.md` (쿼리 훅 142개)
