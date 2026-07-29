# 라우트 인벤토리 — 레거시 `apt-resident-fe`

> 기준 SHA `6d5bf22` (2026-07-27) · 추출원 `src/router/*.js` 20개
> 전체 계획: `~/.claude/plans/working-smcom-apt-resident-fe-tranquil-charm.md`

## 집계

| 구분                            |      수 |
| ------------------------------- | ------: |
| `path:` 항목 총계 (grep 기준)   |     127 |
| ─ 레이아웃 컨테이너 (화면 없음) |      -4 |
| ─ 리다이렉트                    |      -1 |
| ─ 주석 처리 (비활성)            |      -1 |
| **실제 화면 라우트**            | **121** |
| ├ 메인 앱                       |      99 |
| └ opinion 앱                    |      18 |
| + 리다이렉트                    |       1 |
| + 비활성(주석)                  |       1 |

> **계획서의 "라우트 127개"는 `path:` 항목 수였다. 재구현 대상 화면은 121개다.**

메인 앱 99개 = 인덱스 4 + SignUp 5 + Login 5 + TermsOfUse 1 + Main 1 + MyPage 9 + Board 20 +
Parking 15 + Apass 1 + Repair 4 + MovingHouse 4 + Vote 6 + Survey 6 + Visit 13 + AptMall 3 +
ManagementFee 2 + FireInspection 4

---

## 1. 앱 분기

`src/main.js`가 `import.meta.env.MODE.includes('opinion')`으로 두 앱을 가른다.

|        | 메인 앱                              | opinion 앱                    |
| ------ | ------------------------------------ | ----------------------------- |
| 진입   | `src/MainApp.vue`                    | `src/OpinionApp.vue`          |
| 라우터 | `src/router/index.js`                | `src/router/index-opinion.js` |
| 빌드   | `dist/main`                          | `dist/opinion`                |
| 용도   | 입주민 앱 (네이티브 웹뷰, 인증 필수) | 외부 링크용 비회원 투표·설문  |
| 인증   | localStorage 토큰 + 라우터 가드      | **없음** (본인인증만)         |

---

## 2. 메인 앱 — 레이아웃 트리

```
/  LayoutBase                            ← 컨테이너. ToastContainer·앱종료모달·네이티브 백버튼·폰트크기·QueryDevtools
├── ''   redirect → { name: '인트로' }
│
├── ''   LayoutPublic                    ← 컨테이너. AppBar + RouterView (바텀네비 없음)
│         · 하위 전체에 requiresAuth: false 강제
│
└── ''   LayoutAuth   meta.requiresAuth: true    ← 컨테이너. AppBar + RouterView + BottomNavigation
```

### meta 키 (전 라우트 공통 어휘)

| 키                      | 의미                                      | React 이관 시                                  |
| ----------------------- | ----------------------------------------- | ---------------------------------------------- |
| `requiresAuth`          | 인증 필요 여부                            | `ProtectedRoute`                               |
| `authOptional`          | 가드 전체를 건너뜀 (인증 무관)            | 가드 밖 라우트로 배치                          |
| `showAppBar`            | 상단 AppBar 표시                          | 레이아웃 설정 — **Phase 5에서 표현 방식 확정** |
| `appBarTitle`           | AppBar 제목                               | 〃                                             |
| `hasBackButton`         | 뒤로가기 버튼                             | 〃                                             |
| `backPath`              | 뒤로가기 목적지 (없으면 `history.back()`) | 〃                                             |
| `appBarBackgroundColor` | AppBar 배경색 (hex/rgba 직접 지정)        | 〃                                             |
| `showBottomNav`         | 하단 네비 표시                            | 〃                                             |
| `fromNotice`            | 공지 상세 진입 경로 표시                  | 공지 상세 전용 플래그                          |

`useLayoutConfig`(`src/lib/composables/useLayoutConfig.js`)가 route meta를 기본값 위에 병합해 AppBar/BottomNav를 구성한다.

---

## 3. 메인 앱 — 라우트 전수

### 3-1. 인덱스 직속 (`src/router/index.js`)

|   # | path              | name         | 컴포넌트                         | 레이아웃   | meta                                                                                | 로딩      |
| --: | ----------------- | ------------ | -------------------------------- | ---------- | ----------------------------------------------------------------------------------- | --------- |
|   — | `/`               | —            | `LayoutBase`                     | —          | (컨테이너)                                                                          | eager     |
|   — | ``                | —            | → redirect `인트로`              | LayoutBase | (리다이렉트)                                                                        | —         |
|   — | ``                | —            | `LayoutPublic`                   | LayoutBase | (컨테이너)                                                                          | eager     |
|   1 | `/intro`          | 인트로       | `IntroView/IntroView.vue`        | Public     | requiresAuth:false, showAppBar:false, showBottomNav:false                           | **eager** |
|   2 | `/error`          | 에러         | `ExceptionView/ErrorView.vue`    | Public     | requiresAuth:false, authOptional:true, showAppBar:false, showBottomNav:false        | **eager** |
|   — | ``                | —            | `LayoutAuth`                     | LayoutBase | requiresAuth:true (컨테이너)                                                        | eager     |
|   3 | `/error-auth`     | 에러(로그인) | `ExceptionView/ErrorView.vue`    | Auth       | requiresAuth:**false**, authOptional:true, showAppBar:false, showBottomNav:**true** | eager     |
|   4 | `:pathMatch(.*)*` | 404페이지    | `ExceptionView/NotFoundView.vue` | Auth       | requiresAuth:false, showAppBar:false                                                | eager     |

> ⚠️ 3·4는 `LayoutAuth`(requiresAuth:true) 하위에 있지만 자신의 meta로 `requiresAuth:false`를 덮어쓴다.
> 자식 meta가 부모를 이긴다 — React 이관 시 가드 밖에 두어야 한다.

### 3-2. SignUp (`SignUpIndex.js`) — 5개

부모에서 `requiresAuth: false` 강제 주입. 개별 `authOptional`은 유지.

|   # | path                             | name                        | 컴포넌트 (`@views/SignUpView/`)    | meta                                                                 |
| --: | -------------------------------- | --------------------------- | ---------------------------------- | -------------------------------------------------------------------- |
|   5 | `/signup/terms`                  | 이용약관 동의               | `SignUpTermsAndConditionsView.vue` | authOptional:true, showAppBar:true, hasBackButton:true, backPath:`/` |
|   6 | `/signup/certification/response` | 회원가입 본인인증 결과 수신 | `SignUpCertResponseView.vue`       | showAppBar:false                                                     |
|   7 | `/signup/info/user`              | 내 정보 입력                | `SignUpUserInfoView.vue`           | showAppBar:true                                                      |
|   8 | `/signup/info/apt`               | 아파트 설정                 | `SignUpAptInfoView.vue`            | showAppBar:false                                                     |
|   9 | `/signup/completed`              | 회원가입 완료               | `SignUpCompletedView.vue`          | showAppBar:false                                                     |

전부 lazy. `showBottomNav:false` 공통.

### 3-3. Login (`LoginIndex.js`) — 5개

부모에서 `requiresAuth: route.meta?.requiresAuth ?? false` — **개별 meta가 우선**.

|   # | path                         | name                            | 컴포넌트 (`@views/LoginView/`)   | meta                                                                                          |
| --: | ---------------------------- | ------------------------------- | -------------------------------- | --------------------------------------------------------------------------------------------- |
|  10 | `/password/cert`             | 비밀번호 휴대폰 인증            | `PasswordPhoneCertView.vue`      | showAppBar:true, appBarTitle:`''`                                                             |
|  11 | `/password/reset`            | 비밀번호 재설정                 | `PasswordResetView.vue`          | showAppBar:true, appBarTitle:`새 비밀번호 설정`                                               |
|  12 | `/login/pending`             | 로그인 미승인 상태              | `LoginPendingCheckView.vue`      | showAppBar:false                                                                              |
|  13 | `/versionOne/terms`          | 버전1 이용약관 동의             | `VersionOneTermsView.vue`        | requiresAuth:false(명시), showAppBar:true, appBarTitle:`''`, hasBackButton:true, backPath:`/` |
|  14 | `/versionOne/terms/response` | 버전1 로그인 본인인증 결과 수신 | `VersionOneCertResponseView.vue` | requiresAuth:false(명시), showAppBar:false                                                    |

전부 lazy. `#10`만 `@/views/...` 절대경로(나머지는 `@views/...`) — 별칭 불일치.

> 로그인 화면 자체(`/`)는 `IntroView`가 겸한다. 별도 `/login` 경로 없음.
> `versionOne`은 구버전 입주민(`oldResidentFlag`) 마이그레이션 플로우.

### 3-4. TermsOfUse (`TermsOfUseIndex.js`) — 1개

부모에서 `requiresAuth:false` + `authOptional:true` 강제.

|   # | path                   | name      | 컴포넌트                                  | meta                                                                            |
| --: | ---------------------- | --------- | ----------------------------------------- | ------------------------------------------------------------------------------- |
|  15 | `/termsOfUse/:termsId` | 약관 상세 | `TermsOfUseView/TermsOfUseDetailView.vue` | authOptional:true, showAppBar:true, appBarTitle:`약관 상세`, hasBackButton:true |

### 3-5. Main (`MainIndex.js`) — 1개

|   # | path    | name | 컴포넌트                | meta                                     | 로딩      |
| --: | ------- | ---- | ----------------------- | ---------------------------------------- | --------- |
|  16 | `/main` | 메인 | `MainView/MainView.vue` | showAppBar:false, showBottomNav:**true** | **eager** |

> 메인 카드 레이아웃은 `useMainCardLayout`(242 LOC)이 1~5장 프리셋으로 동적 구성한다.
> 뒤로가기 차단 대상(가드에서 `popstate` 막음).

### 3-6. MyPage (`MyPageIndex.js`) — 9개

|   # | path                      | name           | 컴포넌트 (`@views/MyPageView/`)     | meta                                                              | 로딩      |
| --: | ------------------------- | -------------- | ----------------------------------- | ----------------------------------------------------------------- | --------- |
|  17 | `/mypage`                 | 나의페이지     | `MyPageView.vue`                    | showAppBar:false, showBottomNav:**true**                          | **eager** |
|  18 | `/mypage/profile`         | 내 프로필      | `MyProfile/MyProfileView.vue`       | showAppBar:false                                                  | lazy      |
|  19 | `/mypage/profile/edit`    | 내 프로필 수정 | `MyProfile/MyProfileEditView.vue`   | showAppBar:false                                                  | lazy      |
|  20 | `/mypage/alarmSetting`    | 알림 설정      | `AlarmSetting/AlarmSettingView.vue` | showAppBar:true, appBarTitle:`알림 설정`, hasBackButton:true      | lazy      |
|  21 | `/mypage/aptInfo`         | 관리사무소     | `Office/OfficeInfoView.vue`         | showAppBar:true, appBarTitle:`관리사무소`, hasBackButton:true     | lazy      |
|  22 | `/mypage/termsOfUse`      | 약관 및 정책   | `TermsOfUse/TermsOfUseView.vue`     | showAppBar:true, appBarTitle:`약관 및 정책`, hasBackButton:true   | lazy      |
|  23 | `/mypage/fontSizeSetting` | 글자 크기 설정 | `MyPageFontSizeView.vue`            | showAppBar:true, appBarTitle:`글자 크기 설정`, hasBackButton:true | lazy      |
|  24 | `/mypage/accountDeletion` | 회원 탈퇴      | `MyPageAccountDeletionView.vue`     | showAppBar:true, appBarTitle:`회원 탈퇴`, hasBackButton:true      | lazy      |
|  25 | `/logout`                 | 로그아웃       | `MypageLogoutView.vue`              | showAppBar:false                                                  | lazy      |

> `/logout`이 MyPage 소속인 점에 유의 — React에서는 auth feature로 옮기는 게 자연스럽다(Phase 5에서 판단).
> `/mypage`도 뒤로가기 차단 대상.

### 3-7. Board (`BoardIndex.js`) — 20개

4개 하위 도메인: 공지 · 아파트먼트 공지 · 소통공간 · 민원공간 + 설정/신고.

|   # | path                                                                  | name                      | 컴포넌트 (`@views/BoardView/`)                   | meta                                                              | 로딩      |
| --: | --------------------------------------------------------------------- | ------------------------- | ------------------------------------------------ | ----------------------------------------------------------------- | --------- |
|  26 | `/board/notice`                                                       | 공지사항                  | `NoticeBoard/NoticeBoardView.vue`                | showAppBar:true, appBarTitle:`공지사항`                           | **eager** |
|  27 | `/board/notice/detail/:noticeUuid`                                    | 공지사항 상세             | `NoticeBoard/NoticeDetailView.vue`               | **fromNotice:true**, showAppBar:true, appBarTitle:`공지사항 상세` | lazy      |
|  28 | `/board/global-notice`                                                | 아파트먼트 공지사항       | `GlobalNoticeBoard/GlobalNoticeBoardView.vue`    | showAppBar:true, appBarTitle:`아파트먼트 공지사항`                | lazy      |
|  29 | `/board/global-notice/detail/:globalNoticeUuid`                       | 아파트먼트 공지사항 상세  | `GlobalNoticeBoard/GlobalNoticeDetailView.vue`   | showAppBar:true, appBarTitle:`아파트먼트 공지사항 상세`           | lazy      |
|  30 | `/board/community`                                                    | 소통공간 게시판           | `Community/CommunityBoardView.vue`               | showAppBar:**false**                                              | **eager** |
|  31 | `/board/community/detail/:postUuid`                                   | 소통공간 상세             | `Community/CommunityDetailView.vue`              | showAppBar:false                                                  | lazy      |
|  32 | `/post/community/comment/reply/:postUuid/:commentUuid/:commentIndex`  | 소통공간 답글 작성        | `Community/CommunityCommentReplyWriteView.vue`   | showAppBar:true, appBarTitle:`소통공간 답글 작성`                 | lazy      |
|  33 | `/post/community/comment/edit/:postUuid/:commentUuid`                 | 소통공간 댓글 수정        | `Community/CommunityCommentEditView.vue`         | showAppBar:false                                                  | lazy      |
|  34 | `/board/community/write`                                              | 소통공간 글 등록          | `Community/CommunityWriteView.vue`               | showAppBar:false                                                  | lazy      |
|  35 | `/board/community/edit/:postUuid`                                     | 소통공간 글 수정          | `Community/CommunityEditView.vue`                | showAppBar:false                                                  | lazy      |
|  36 | `/board/community/activities`                                         | 소통공간 내 활동          | `Community/CommunityMyActivitiesView.vue`        | showAppBar:true, appBarTitle:`소통공간 내 활동`                   | lazy      |
|  37 | `/board/complaints`                                                   | 민원공간 게시판           | `Complaints/ComplaintsBoardView.vue`             | showAppBar:false                                                  | **eager** |
|  38 | `/board/complaints/detail/:postUuid`                                  | 민원공간 상세             | `Complaints/ComplaintsDetailView.vue`            | showAppBar:false                                                  | lazy      |
|  39 | `/post/complaints/comment/reply/:postUuid/:commentUuid/:commentIndex` | 민원공간 답글 작성        | `Complaints/ComplaintsCommentReplyWriteView.vue` | showAppBar:true, appBarTitle:`민원공간 답글 작성`                 | lazy      |
|  40 | `/post/complaints/comment/edit/:postUuid/:commentUuid`                | 민원공간 댓글 수정        | `Complaints/ComplaintsCommentEditView.vue`       | showAppBar:false                                                  | lazy      |
|  41 | `/board/complaints/write`                                             | 민원공간 글 등록          | `Complaints/ComplaintsWriteView.vue`             | showAppBar:false                                                  | lazy      |
|  42 | `/board/complaints/edit/:postUuid`                                    | 민원공간 글 수정          | `Complaints/ComplaintsEditView.vue`              | showAppBar:false                                                  | lazy      |
|  43 | `/board/complaints/activities`                                        | 민원공간 내 활동          | `Complaints/ComplaintsMyActivitiesView.vue`      | showAppBar:true, appBarTitle:`민원공간 내 활동`                   | lazy      |
|  44 | `/board/setting/userBlock`                                            | 게시글 미노출 사용자 관리 | `Setting/SettingUserBlockView.vue`               | showAppBar:true, appBarTitle:`게시글 미노출 사용자 관리`          | lazy      |
|  45 | `/post/report/:postUuid`                                              | 게시글 신고               | `Report/ReportView.vue`                          | showAppBar:true, appBarTitle:`게시글 신고`                        | lazy      |

전부 `showBottomNav:false`. 댓글 관련 4개만 `/post/...` 접두사(나머지는 `/board/...`) — **경로 규칙 불일치**.
소통공간/민원공간은 라우트 구조가 완전 대칭(각 7개).

### 3-8. ParkingManagement (`ParkingManagementIndex.js`) — 15개 (+주석 1)

|   # | path                                         | name               | 컴포넌트 (`@views/ParkingManagementView/`)    | meta                             | 로딩      |
| --: | -------------------------------------------- | ------------------ | --------------------------------------------- | -------------------------------- | --------- |
|  46 | `/parking`                                   | 주차 관리          | `ParkingManagement/ParkingManagementView.vue` | appBarTitle:`주차 관리`          | **eager** |
|  47 | `/parking/mileage/history`                   | 마일리지 내역      | `Mileage/MileageHistoryListView.vue`          | appBarTitle:`마일리지 내역`      | lazy      |
|  48 | `/parking/carManagement/bookmark/list`       | 즐겨찾기 차량      | `CarManagement/CarManagementListView.vue`     | appBarTitle:`즐겨찾기 차량`      | lazy      |
|  49 | `/parking/carManagement/alwaysAllow/list`    | 항상허용 차량      | `CarManagement/CarManagementListView.vue`     | appBarTitle:`항상허용 차량`      | lazy      |
|  50 | `/parking/carManagement/bookmark/add`        | 즐겨찾기 차량 등록 | `CarManagement/CarManagementAddView.vue`      | appBarTitle:`즐겨찾기 차량 등록` | lazy      |
|  51 | `/parking/carManagement/alwaysAllow/add`     | 항상허용 차량 등록 | `CarManagement/CarManagementAddView.vue`      | appBarTitle:`항상허용 차량 등록` | lazy      |
|  52 | `/parking/carManagement/bookmark/edit/:uuid` | 즐겨찾기 차량 수정 | `CarManagement/CarManagementEditView.vue`     | appBarTitle:`즐겨찾기 차량 수정` | lazy      |
|  53 | `/parking/inoutHistory`                      | 입출차 내역        | `InOutHistory/InOutCarHistoryListView.vue`    | appBarTitle:`입출차 내역`        | lazy      |
|  54 | `/parking/inoutHistory/detail/:uuid`         | 입출차 차량 상세   | `InOutHistory/InOutCarHistoryDetailView.vue`  | appBarTitle:`입출차 차량 상세`   | lazy      |
|  55 | `/parking/reject/:uuid`                      | 차량 거부          | `RejectCar/RejectReasonView.vue`              | appBarTitle:`차량 거부`          | lazy      |
|  56 | `/parking/reservation`                       | 방문예약 관리      | `ReservationCar/ReservationCarListView.vue`   | appBarTitle:`방문예약 관리`      | lazy      |
|  57 | `/parking/reservation/add`                   | 방문예약 등록      | `ReservationCar/ReservationCarAddView.vue`    | appBarTitle:`방문예약 등록`      | lazy      |
|  58 | `/parking/reservation/add/:uuid`             | 방문예약 재등록    | `ReservationCar/ReservationCarAddView.vue`    | appBarTitle:`방문예약 재등록`    | lazy      |
|  59 | `/parking/reservation/detail/:uuid`          | 방문예약 상세      | `ReservationCar/ReservationCarDetailView.vue` | showAppBar:**false**             | lazy      |
|  60 | `/parking/regular-car`                       | 정기권 차량        | `RegularCar/RegularCarListView.vue`           | appBarTitle:`정기권 차량`        | **eager** |

`#59` 제외 전부 `showAppBar:true, showBottomNav:false, hasBackButton:true`.

**`#48`/`#49`는 같은 컴포넌트, `#50`/`#51`도 같은 컴포넌트, `#57`/`#58`도 같은 컴포넌트.**
`useCarManagementType`(`src/lib/composables/useCarManagementType.js`)이 **현재 경로 문자열로**
`bookmark`(즐겨찾기) / `alwaysAllow`(항상허용)를 판별한다. React 이관 시 경로 파싱 대신
라우트별 prop 주입으로 바꾸는 게 자연스럽지만, **동작은 동일해야 한다.**

#### `[확인 필요]` — 라우트 누락 의심

| 항목                               | 내용                                                                                                                                                                                                                     |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **항상허용 차량 수정 라우트 없음** | `bookmark/edit/:uuid`(#52)는 있으나 `alwaysAllow/edit/:uuid`가 없다. 의도된 제약인지, 누락인지 확인 필요                                                                                                                 |
| **미출차 내역 비활성**             | `/parking/notoutHistory` 라우트가 통째로 주석 처리됨. 그런데 컴포넌트 `NotOutHistory/NotOutCarHistoryListView.vue`와 쿼리 훅(`notOutCarList`, `notOutHistorySummary`)은 살아 있다. 이관 대상인지 폐기 대상인지 확인 필요 |

### 3-9. Apass (`ApassIndex.js`) — 1개

|   # | path     | name   | 컴포넌트                  | meta                                                                                |
| --: | -------- | ------ | ------------------------- | ----------------------------------------------------------------------------------- |
|  61 | `/apass` | A-PASS | `ApassView/ApassView.vue` | showAppBar:**false**, showBottomNav:false, appBarTitle:`A-PASS`, hasBackButton:true |

> `showAppBar:false`인데 `appBarTitle`·`hasBackButton`이 설정돼 있다 — 무시되는 값. 이관 시 그대로 두거나 정리(동작 영향 없음).

### 3-10. Repair (`RepairIndex.js`) — 4개

|   # | path                         | name            | 컴포넌트 (`@views/RepairView/`) | meta                                                             |
| --: | ---------------------------- | --------------- | ------------------------------- | ---------------------------------------------------------------- |
|  62 | `/repair/list`               | 하자보수 리스트 | `RepairView.vue`                | showAppBar:true, appBarTitle:`하자보수`, hasBackButton:true      |
|  63 | `/repair/create`             | 하자보수 작성   | `RepairWriteView.vue`           | showAppBar:true, appBarTitle:`하자보수 접수`, hasBackButton:true |
|  64 | `/repair/edit/:repairUuid`   | 하자보수 수정   | `RepairEditView.vue`            | showAppBar:false, hasBackButton:false                            |
|  65 | `/repair/detail/:repairUuid` | 하자접수 상세   | `RepairDetailView.vue`          | showAppBar:false, hasBackButton:false                            |

> `#64`/`#65`는 `showBottomNav`가 **미지정** — `useLayoutConfig`의 기본값이 적용된다. 이관 시 기본값 확인 필요.

### 3-11. MovingHouse (`MovingHouseIndex.js`) — 4개

|   # | path                              | name               | 컴포넌트 (`@views/MovingHouseView/`) | meta                                                                  |
| --: | --------------------------------- | ------------------ | ------------------------------------ | --------------------------------------------------------------------- |
|  66 | `/movingHouse/list`               | 이사예약 리스트    | `MovingHouseView.vue`                | showAppBar:true, appBarTitle:`이사예약`, hasBackButton:true           |
|  67 | `/movingHouse/detail/:movingUuid` | 이사예약 상세      | `MovingHouseDetailView.vue`          | showAppBar:true, appBarTitle:`이사예약 상세`, hasBackButton:true      |
|  68 | `/movingHouse/write`              | 이사예약 등록      | `MovingHouseWriteView.vue`           | showAppBar:false                                                      |
|  69 | `/movingHouse/write/confirm`      | 이사예약 등록 확인 | `MovingHouseWriteConfirmView.vue`    | showAppBar:true, appBarTitle:`이사예약 등록 확인`, hasBackButton:true |

### 3-12. Vote (`VoteIndex.js`) — 6개

|   # | path                                | name                        | 컴포넌트 (`@views/VoteView/`)       | meta                                                                   | 로딩      |
| --: | ----------------------------------- | --------------------------- | ----------------------------------- | ---------------------------------------------------------------------- | --------- |
|  70 | `/vote/list`                        | 전자투표 리스트             | `VoteView.vue`                      | appBarTitle:`전자투표`, hasBackButton:true, backPath:`/main`           | **eager** |
|  71 | `/vote/detail/:voteUuid/:voterUuid` | 전자투표 개요               | `Detail/VoteDetailView.vue`         | appBarTitle:`전자투표 개요`, hasBackButton:true, backPath:`/vote/list` | lazy      |
|  72 | `/vote/form/:voterUuid`             | 전자투표 참여               | `Form/VoteFormView.vue`             | appBarTitle:`전자투표 참여`, hasBackButton:true, backPath:`/vote/list` | lazy      |
|  73 | `/vote/completed`                   | 전자투표 완료               | `VoteCompletedView.vue`             | showAppBar:false                                                       | lazy      |
|  74 | `/vote/certification/pass/response` | 전자투표 본인인증 결과 수신 | `Auth/VoteAuthPassResponseView.vue` | showAppBar:false                                                       | lazy      |
|  75 | `/vote/certification/namePhone`     | 전자투표 이름 휴대전화 인증 | `Auth/VoteAuthNamePhoneView.vue`    | showAppBar:true, appBarTitle:`본인인증`, hasBackButton:true            | lazy      |

### 3-13. Survey (`SurveyIndex.js`) — 6개

Vote와 완전 대칭.

|   # | path                                          | name                        | 컴포넌트 (`@views/SurveyView/`)       | meta                                                                     | 로딩      |
| --: | --------------------------------------------- | --------------------------- | ------------------------------------- | ------------------------------------------------------------------------ | --------- |
|  76 | `/survey/list`                                | 설문 리스트                 | `SurveyView.vue`                      | appBarTitle:`설문조사`, hasBackButton:true, backPath:`/main`             | **eager** |
|  77 | `/survey/detail/:surveyUuid/:participantUuid` | 설문 상세                   | `Detail/SurveyDetailView.vue`         | appBarTitle:`설문조사 개요`, hasBackButton:true, backPath:`/survey/list` | lazy      |
|  78 | `/survey/form/:participantUuid`               | 설문 참여                   | `Form/SurveyFormView.vue`             | appBarTitle:`설문조사 참여`, hasBackButton:true, backPath:`/survey/list` | lazy      |
|  79 | `/survey/completed`                           | 설문 완료                   | `SurveyCompletedView.vue`             | showAppBar:false                                                         | lazy      |
|  80 | `/survey/certification/pass/response`         | 설문조사 본인인증 결과 수신 | `Auth/SurveyAuthPassResponseView.vue` | showAppBar:false                                                         | lazy      |
|  81 | `/survey/certification/namePhone`             | 설문조사 이름 휴대전화 인증 | `Auth/SurveyAuthNamePhoneView.vue`    | showAppBar:true, appBarTitle:`본인인증`, hasBackButton:true              | lazy      |

### 3-14. Visit (`VisitIndex.js`) — 13개

|   # | path                                        | name                    | 컴포넌트 (`@views/VisitView/`)                         | meta                                                                                                     |
| --: | ------------------------------------------- | ----------------------- | ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------- |
|  82 | `/visit`                                    | 방문자 출입관리         | `VisitListView.vue`                                    | appBarTitle:`방문자 출입관리`, hasBackButton:true, backPath:`/main`, **appBarBackgroundColor:`#f9fafb`** |
|  83 | `/visit/kiosk/password`                     | 방문증 키오스크 설정    | `VisitKioskView.vue`                                   | appBarTitle:`방문증 키오스크 설정`, hasBackButton:true                                                   |
|  84 | `/visit/lobbyPhone`                         | 로비폰 세대호출         | `VisitLobbyPhoneView.vue`                              | showAppBar:**false**                                                                                     |
|  85 | `/visit/lobbyPhone/tempPassword/list`       | 임시비밀번호 리스트     | `LobbyPhone/VisitLobbyPhoneTempPasswordListView.vue`   | appBarTitle:`임시 비밀번호`, hasBackButton:true, **appBarBackgroundColor:`#f9fafb`**                     |
|  86 | `/visit/lobbyPhone/tempPassword/create`     | 임시비밀번호 생성       | `LobbyPhone/VisitLobbyPhoneTempPasswordCreateView.vue` | appBarTitle:`임시 비밀번호 생성`, hasBackButton:true                                                     |
|  87 | `/visit/lobbyPhone/qr`                      | 로비 QR 코드            | `LobbyPhone/VisitLobbyPhoneQrView.vue`                 | appBarTitle:`로비 QR 코드`, hasBackButton:true, **appBarBackgroundColor:`#f9fafb`**                      |
|  88 | `/visit/lobbyPhone/faceRegisterManagement`  | 안면인식 얼굴 등록 관리 | `FaceRegister/FaceRegisterManagementView.vue`          | appBarTitle:`안면인식 얼굴 등록`, hasBackButton:true, backPath:`/visit/lobbyPhone`                       |
|  89 | `/visit/lobbyPhone/faceRegister/detail/:id` | 안면인식 정보 상세      | `FaceRegister/FaceRegisterDetailView.vue`              | appBarTitle:`등록정보 상세`, hasBackButton:true, backPath:`/visit/lobbyPhone/faceRegisterManagement`     |
|  90 | `/visit/lobbyPhone/faceRegister/edit/:id`   | 안면인식 정보 수정      | `FaceRegister/FaceRegisterEditView.vue`                | appBarTitle:`등록정보 수정`, hasBackButton:true                                                          |
|  91 | `/visit/lobbyPhone/faceRegister/form`       | 안면인식 얼굴 신규 등록 | `FaceRegister/FaceRegisterFormView.vue`                | appBarTitle:`얼굴 신규 등록`, hasBackButton:true                                                         |
|  92 | `/visit/lobbyPhone/faceRegister/fail`       | 안면인식 얼굴 등록 실패 | `FaceRegister/FaceRegisterFailView.vue`                | appBarTitle:`얼굴 신규 등록`, **hasBackButton:false**                                                    |
|  93 | `/visit/lobbyPhone/faceRegister/complete`   | 안면인식 얼굴 등록 완료 | `FaceRegister/FaceRegisterCompleteView.vue`            | appBarTitle:`얼굴 신규 등록`, **hasBackButton:false**                                                    |
|  94 | `/visit/lobbyPhone/faceRegister/guide`      | 안면인식 촬영 가이드    | `FaceRegister/FaceRegisterGuideView.vue`               | appBarTitle:`얼굴 신규 등록`, hasBackButton:true                                                         |

전부 lazy, `showBottomNav:false`. `#84` 제외 전부 `showAppBar:true`.
`appBarBackgroundColor` hex 직접 지정이 3곳 — 디자인 토큰 이식 시 대응 필요.

### 3-15. AptMall (`AptMallIndex.js`) — 3개

|   # | path                                        | name                    | 컴포넌트 (`@views/AptMallView/`) | meta                                                                                      |
| --: | ------------------------------------------- | ----------------------- | -------------------------------- | ----------------------------------------------------------------------------------------- |
|  95 | `/aptMall/list`                             | 아파트몰 리스트         | `AptMallListView.vue`            | appBarTitle:`아파트몰`, hasBackButton:true, **appBarBackgroundColor:`rgba(248,248,248)`** |
|  96 | `/aptMall/myOrder`                          | 아파트몰 나의 예약      | `AptMallMyOrderView.vue`         | appBarTitle:`주말조식 예약`, hasBackButton:true, **appBarBackgroundColor:`#f3f4f6`**      |
|  97 | `/aptMall/myOrder/detail/:aptMallOrderUuid` | 아파트몰 나의 예약 상세 | `AptMallMyOrderDetailView.vue`   | appBarTitle:`주말조식 예약 상세`, hasBackButton:true                                      |

> 라우트명은 "아파트몰"인데 AppBar 제목은 "주말조식 예약" — 실제 서비스는 주말조식 예약. `[확인 필요]`

### 3-16. ManagementFee (`ManagementFeeIndex.js`) — 2개

|   # | path                    | name        | 컴포넌트 (`@views/ManagementFeeView/`) | meta                                          |
| --: | ----------------------- | ----------- | -------------------------------------- | --------------------------------------------- |
|  98 | `/managementFee/info`   | 관리비 정보 | `ManagementFeeInfoView.vue`            | appBarTitle:`관리비 조회`, hasBackButton:true |
|  99 | `/managementFee/detail` | 관리비 상세 | `ManagementFeeDetailView.vue`          | appBarTitle:`관리비 상세`, hasBackButton:true |

> `#99`는 **경로 파라미터가 없다** — 조회 대상(연월 등)을 라우트 state나 스토어로 넘긴다. 이관 시 확인 필요.

### 3-17. FireInspection (`FireInspectionIndex.js`) — 4개

|   # | path                                                                       | name           | 컴포넌트 (`@views/FireInspectionView/`)       | meta                                                                                      |
| --: | -------------------------------------------------------------------------- | -------------- | --------------------------------------------- | ----------------------------------------------------------------------------------------- |
| 100 | `/fire-inspection`                                                         | 소방 자가 점검 | `FireInspectionView.vue`                      | showAppBar:true, showBottomNav:**true**, appBarTitle:`소방 자가 점검`, hasBackButton:true |
| 101 | `/fire-inspection/process/:householdFireInspectionUuid`                    | 자가점검 진행  | `Process/FireInspectionProcessView.vue`       | showAppBar:false                                                                          |
| 102 | `/fire-inspection/complete`                                                | 점검 완료      | `Complete/FireInspectionCompleteView.vue`     | showAppBar:false                                                                          |
| 103 | `/fire-inspection/detail/:fireInspectionUuid/:householdFireInspectionUuid` | 점검 상세      | `History/FireInspectionHistoryDetailView.vue` | showAppBar:false                                                                          |

> `#102`는 뒤로가기 차단 대상(`/main`·`/mypage`와 함께 가드에서 `popstate` 막음).
> 경로만 kebab-case(`fire-inspection`) — 나머지 도메인은 camelCase. **경로 규칙 불일치.**

---

## 4. opinion 앱 — 라우트 전수 (18개)

`src/router/index-opinion.js`. 레이아웃은 `LayoutOpinionBase`(AppBar + RouterView, 바텀네비 없음).
**인증 가드 없음** — `beforeEach`는 오프라인 체크만 한다.

### 4-1. 인덱스 직속 — 3개

|   # | path              | name       | 컴포넌트                                        | meta       | 로딩      |
| --: | ----------------- | ---------- | ----------------------------------------------- | ---------- | --------- |
|   — | `/`               | —          | `LayoutOpinionBase`                             | (컨테이너) | eager     |
| 104 | ``                | 의견 메인  | `ExceptionView/OpinionExternalNotFoundView.vue` | 없음       | **eager** |
| 105 | `error`           | 에러페이지 | `ExceptionView/OpinionExternalErrorView.vue`    | 없음       | **eager** |
| 106 | `:pathMatch(.*)*` | 404페이지  | `ExceptionView/OpinionExternalNotFoundView.vue` | 없음       | **eager** |

> 루트(`''`)가 NotFound 화면이다 — opinion 앱은 딥링크로만 진입한다.

### 4-2. VoteExternal (`VoteExternalIndex.js`) — 7개

|   # | path                                | name                        | 컴포넌트 (`@views/VoteView/`)       | meta                                                        |
| --: | ----------------------------------- | --------------------------- | ----------------------------------- | ----------------------------------------------------------- |
| 107 | `/vote/form/:voterUuid`             | 전자투표 참여               | `Form/VoteFormView.vue`             | showAppBar:false                                            |
| 108 | `/vote/completed`                   | 전자투표 완료               | `VoteCompletedView.vue`             | showAppBar:false                                            |
| 109 | `/vote/before`                      | 투표 시작전                 | `VoteExceptionView.vue`             | showAppBar:false                                            |
| 110 | `/vote/finish`                      | 투표 종료                   | `VoteExceptionView.vue`             | showAppBar:false                                            |
| 111 | `/vote/certification/pass/response` | 투표 본인인증 결과 수신     | `Auth/VoteAuthPassResponseView.vue` | showAppBar:false                                            |
| 112 | `/vote/certification/namePhone`     | 전자투표 이름 휴대전화 인증 | `Auth/VoteAuthNamePhoneView.vue`    | showAppBar:true, appBarTitle:`본인인증`, hasBackButton:true |
| 113 | `/vote/:voterUuid`                  | 전자투표 개요               | `Detail/VoteDetailView.vue`         | showAppBar:false                                            |

### 4-3. SurveyExternal (`SurveyExternalIndex.js`) — 8개

|   # | path                                  | name                    | 컴포넌트 (`@views/SurveyView/`)                     | meta                                                        | 로딩      |
| --: | ------------------------------------- | ----------------------- | --------------------------------------------------- | ----------------------------------------------------------- | --------- |
| 114 | `/survey/list`                        | 설문 리스트 (외부)      | **`ExceptionView/OpinionExternalNotFoundView.vue`** | showAppBar:true, appBarTitle:`설문조사`, hasBackButton:true | **eager** |
| 115 | `/survey/form/:participantUuid`       | 설문 참여               | `Form/SurveyFormView.vue`                           | showAppBar:false                                            | lazy      |
| 116 | `/survey/completed`                   | 설문 완료               | `SurveyCompletedView.vue`                           | showAppBar:false                                            | lazy      |
| 117 | `/survey/before`                      | 설문 시작전             | `SurveyExceptionView.vue`                           | showAppBar:false                                            | lazy      |
| 118 | `/survey/finish`                      | 설문 종료               | `SurveyExceptionView.vue`                           | showAppBar:false                                            | lazy      |
| 119 | `/survey/certification/pass/response` | 설문 본인인증 결과 수신 | `Auth/SurveyAuthPassResponseView.vue`               | showAppBar:false                                            | lazy      |
| 120 | `/survey/certification/namePhone`     | 설문 이름 휴대전화 인증 | `Auth/SurveyAuthNamePhoneView.vue`                  | showAppBar:true, appBarTitle:`본인인증`, hasBackButton:true | lazy      |
| 121 | `/survey/:participantUuid`            | 설문 상세               | `Detail/SurveyDetailView.vue`                       | showAppBar:false                                            | lazy      |

> `#114`는 라우트명이 "설문 리스트 (외부)"인데 **NotFound 화면을 렌더한다.** 의도된 차단으로 보임. `[확인 필요]`
> `#120` name에 공백 2칸(`설문  이름...`) — 오타. 동작 영향 없음.
> `#121`은 주석대로 동적 경로라 배열 맨 뒤에 배치 — react-router는 순위 기반 매칭이라 순서 의존이 사라진다.

---

## 5. 메인 앱 ↔ opinion 앱 경로 충돌

동일 path가 두 앱에 **다른 컴포넌트·다른 meta**로 존재한다. 단일 앱으로 합칠 경우(Phase 0-6) 반드시 분리해야 한다.

| path                                  | 메인 앱                                           | opinion 앱                                           |
| ------------------------------------- | ------------------------------------------------- | ---------------------------------------------------- |
| `/vote/form/:voterUuid`               | #72 AppBar 있음, backPath `/vote/list`            | #107 AppBar 없음                                     |
| `/vote/completed`                     | #73                                               | #108 (동일)                                          |
| `/vote/certification/pass/response`   | #74                                               | #111 (동일)                                          |
| `/vote/certification/namePhone`       | #75                                               | #112 (동일)                                          |
| `/survey/form/:participantUuid`       | #78 AppBar 있음, backPath `/survey/list`          | #115 AppBar 없음                                     |
| `/survey/completed`                   | #79                                               | #116 (동일)                                          |
| `/survey/certification/pass/response` | #80                                               | #119 (동일)                                          |
| `/survey/certification/namePhone`     | #81                                               | #120 (동일)                                          |
| `/survey/list`                        | #76 실제 리스트                                   | #114 **NotFound 화면**                               |
| 투표 개요                             | #71 `/vote/detail/:voteUuid/:voterUuid`           | #113 `/vote/:voterUuid` (**경로 구조 다름**)         |
| 설문 상세                             | #77 `/survey/detail/:surveyUuid/:participantUuid` | #121 `/survey/:participantUuid` (**경로 구조 다름**) |

> **Phase 0-6 결정에 직결된다.** 단일 앱 흡수를 택하면 opinion 라우트에 접두사(`/opinion/...`)를
> 붙이거나 별도 라우트 트리로 격리해야 한다. 멀티 엔트리 유지가 이관 리스크는 더 낮다.

---

## 6. 네비게이션 가드 (`router.beforeEach`)

메인 앱 가드는 **순서대로** 다음을 수행한다. React 이관 시 이 순서가 곧 동작 명세다.

1. **오프라인 차단** — `!navigator.onLine`이면 토스트 `네트워크 상태를 확인해주세요` 띄우고 이동 취소(`return false`)
2. **`meta.authOptional`이면 즉시 통과** — 이하 전부 건너뜀
3. **인증 필요한데 미인증** — `meta.requiresAuth && (!hasAptInfo || !hasAccessToken)` → `인트로`로
   - `hasLocalStorageData()`가 localStorage의 `aptInfo`·`accessToken` 존재만 확인 (유효성 검증 아님)
4. **비인증 전용인데 이미 로그인** — `meta.requiresAuth === false && hasAptInfo && hasAccessToken`:
   - `getLoginInfo()` 호출
   - `contentList`에서 `name === 'A-PASS'` → `hasApass`
   - `contentList`에서 `name.trim() === '로비폰'` → `hasLobbyPhone`
   - `nativeSendInitialResidentInfo({ aptResidentUuid, hasAptApassService, hasResidentApassService, isDeviceApassActive, hasAptLobbyPhoneService, hasResidentLobbyPhoneService })` 전송
   - `메인`으로 이동
   - **실패 시** `authStore.clearAuth()` + `인트로`로 (무한 루프 방지)
5. **뒤로가기 차단** — `popstate`로 진입했고 출발지가 `/main` · `/mypage` · `/fire-inspection/complete`이면 이동 취소

`router.afterEach`: 이동이 실패(`failure`)하지 않았을 때만 `reloadIfNewVersion()` — `version.json`의
`buildId`를 `VITE_BUILD_ID`와 비교해 새 배포면 리로드.

`setupChunkReloadOnError(router)`: lazy 청크 로드 실패 시 목적지 저장 → 리로드 → SPA 이동.

opinion 앱 가드는 **1번(오프라인 차단)만** 수행한다.

---

## 7. 이관 시 판단 필요 항목

| #   | 항목                       | 내용                                                                                                                                                                                                                                                                                                                                                                                                       |
| --- | -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A   | AppBar/BottomNav meta 표현 | react-router `handle` vs 페이지별 렌더. **Phase 5에서 확정**                                                                                                                                                                                                                                                                                                                                               |
| B   | eager/lazy 구분            | 레거시 eager는 **메인 앱 13개**(#1 인트로, #2 에러, #3 에러(로그인), #4 404, #16 메인, #17 나의페이지, #26 공지사항, #30 소통공간, #37 민원공간, #46 주차 관리, #60 정기권 차량, #70 전자투표 리스트, #76 설문 리스트) + **opinion 4개**(#104, #105, #106, #114). 나머지 104개는 lazy. 타깃 컨벤션은 `/login` 외 전부 lazy — **초기 로딩 성능이 달라지므로 레거시 eager 목록을 유지할지 Phase 5에서 판단** |
| C   | 뒤로가기 차단 3곳          | `/main`·`/mypage`·`/fire-inspection/complete`. `popstate` 감지 방식을 react-router에서 재현                                                                                                                                                                                                                                                                                                                |
| D   | `authOptional` 라우트      | `/error`·`/error-auth`·`/termsOfUse/:termsId`·`/signup/terms` — 가드 완전 우회. `ProtectedRoute` 밖에 배치                                                                                                                                                                                                                                                                                                 |
| E   | 경로 규칙 불일치           | 댓글 4개만 `/post/...`, FireInspection만 kebab-case. **등가 이관 원칙상 경로를 바꾸지 않는다**                                                                                                                                                                                                                                                                                                             |
| F   | 차량관리 경로 파싱         | `useCarManagementType`이 경로 문자열로 타입 판별. 라우트별 prop 주입으로 대체하되 동작 동일                                                                                                                                                                                                                                                                                                                |
| G   | opinion 앱 경로 충돌       | §5. Phase 0-6 결정에 종속                                                                                                                                                                                                                                                                                                                                                                                  |

## 8. `[확인 필요]` 목록

| #   | 질문                                                                 | 근거                                        |
| --- | -------------------------------------------------------------------- | ------------------------------------------- |
| R-1 | 항상허용 차량 **수정** 화면이 없는 게 맞는가?                        | `bookmark/edit/:uuid`만 존재 (#52)          |
| R-2 | 미출차 내역(`/parking/notoutHistory`)은 폐기인가, 복구 예정인가?     | 라우트만 주석 처리, 컴포넌트·쿼리 훅은 생존 |
| R-3 | opinion `/survey/list`(#114)가 NotFound를 렌더하는 것은 의도인가?    | 라우트명은 "설문 리스트 (외부)"             |
| R-4 | 아파트몰(`/aptMall/*`)의 실제 서비스명은 "주말조식 예약"인가?        | 라우트명과 AppBar 제목 불일치               |
| R-5 | 관리비 상세(#99)에 파라미터가 없는데, 조회 대상은 어떻게 전달되는가? | 라우트 state/스토어 추정                    |
| R-6 | Repair `#64`·`#65`의 `showBottomNav` 기본값은?                       | meta 미지정 → `useLayoutConfig` 기본값 적용 |

---

**다음 산출물**: `endpoints.md` (API 150개)
