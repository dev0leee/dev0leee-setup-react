# 도메인 명세 — 게시판 (board)

> 기준 SHA `6d5bf22` · 레거시 `views/BoardView/` 48개 파일 3,642 LOC
> 타깃 슬라이스 `features/board/`
> API 42개 (`endpoints.md` #21~#62) · 쿼리 훅 42개 · Pinia 스토어 2개 · 라우트 20개

**레거시 최대 도메인이다.** 소통공간(community)과 민원공간(complaints)이 화면·API·훅 수준에서
거의 완전 대칭이며, 그 위에 공지사항·아파트먼트 공지가 별도 계보로 얹혀 있다.

> **명세 밀도 방침(2026-07-29)에 따라 대칭 구조도 전수로 풀어쓴다.**
> "민원공간은 소통공간과 같다"로 줄이지 않는다. 실제로 **17군데가 다르다**(§4).

> ⚠️ **확인 항목 ID는 `BD-Q*`를 쓴다.** `broken-styles.md`가 이미 `B-Q1`~`B-Q3`을 점유했다.

---

## 화면 목록

| #   | 경로                                                                  | name                      | 컴포넌트                                     | meta                                      |
| --- | --------------------------------------------------------------------- | ------------------------- | -------------------------------------------- | ----------------------------------------- |
| B1  | `/board/notice`                                                       | 공지사항                  | `NoticeBoard/NoticeBoardView.vue`            | AppBar `공지사항` · **eager**             |
| B2  | `/board/notice/detail/:noticeUuid`                                    | 공지사항 상세             | `NoticeBoard/NoticeDetailView.vue`           | AppBar `공지사항 상세` · **`fromNotice`** |
| B3  | `/board/global-notice`                                                | 아파트먼트 공지사항       | `GlobalNoticeBoard/GlobalNoticeBoardView`    | AppBar `아파트먼트 공지사항`              |
| B4  | `/board/global-notice/detail/:globalNoticeUuid`                       | 아파트먼트 공지사항 상세  | `GlobalNoticeBoard/GlobalNoticeDetailView`   | AppBar `아파트먼트 공지사항 상세`         |
| B5  | `/board/community`                                                    | 소통공간 게시판           | `Community/CommunityBoardView.vue`           | `showAppBar:false` · **eager**            |
| B6  | `/board/community/detail/:postUuid`                                   | 소통공간 상세             | `Community/CommunityDetailView.vue`          | `showAppBar:false`                        |
| B7  | `/post/community/comment/reply/:postUuid/:commentUuid/:commentIndex`  | 소통공간 답글 작성        | `Community/CommunityCommentReplyWriteView`   | AppBar `소통공간 답글 작성`               |
| B8  | `/post/community/comment/edit/:postUuid/:commentUuid`                 | 소통공간 댓글 수정        | `Community/CommunityCommentEditView.vue`     | `showAppBar:false`                        |
| B9  | `/board/community/write`                                              | 소통공간 글 등록          | `Community/CommunityWriteView.vue`           | `showAppBar:false`                        |
| B10 | `/board/community/edit/:postUuid`                                     | 소통공간 글 수정          | `Community/CommunityEditView.vue`            | `showAppBar:false`                        |
| B11 | `/board/community/activities`                                         | 소통공간 내 활동          | `Community/CommunityMyActivitiesView.vue`    | AppBar `소통공간 내 활동`                 |
| B12 | `/board/complaints`                                                   | 민원공간 게시판           | `Complaints/ComplaintsBoardView.vue`         | `showAppBar:false` · **eager**            |
| B13 | `/board/complaints/detail/:postUuid`                                  | 민원공간 상세             | `Complaints/ComplaintsDetailView.vue`        | `showAppBar:false`                        |
| B14 | `/post/complaints/comment/reply/:postUuid/:commentUuid/:commentIndex` | 민원공간 답글 작성        | `Complaints/ComplaintsCommentReplyWriteView` | AppBar `민원공간 답글 작성`               |
| B15 | `/post/complaints/comment/edit/:postUuid/:commentUuid`                | 민원공간 댓글 수정        | `Complaints/ComplaintsCommentEditView.vue`   | `showAppBar:false`                        |
| B16 | `/board/complaints/write`                                             | 민원공간 글 등록          | `Complaints/ComplaintsWriteView.vue`         | `showAppBar:false`                        |
| B17 | `/board/complaints/edit/:postUuid`                                    | 민원공간 글 수정          | `Complaints/ComplaintsEditView.vue`          | `showAppBar:false`                        |
| B18 | `/board/complaints/activities`                                        | 민원공간 내 활동          | `Complaints/ComplaintsMyActivitiesView.vue`  | AppBar `민원공간 내 활동`                 |
| B19 | `/board/setting/userBlock`                                            | 게시글 미노출 사용자 관리 | `Setting/SettingUserBlockView.vue`           | AppBar `게시글 미노출 사용자 관리`        |
| B20 | `/post/report/:postUuid`                                              | 게시글 신고               | `Report/ReportView.vue`                      | AppBar `게시글 신고`                      |
| —   | (라우트 없음)                                                         | 공지 팝업                 | `NoticeBoard/NoticePopupModal.vue`           | **MainView에서 렌더** → §B21              |

**전 화면 `showBottomNav: false`.** B1·B5·B12만 `BoardIndex.js` 상단에서 정적 import(eager)이고
나머지 17개는 `() => import(...)` 동적이다.

> ⚠️ **`showAppBar:false`인 6개 화면(B5·B6·B8·B9·B10, B12·B13·B15·B16·B17)은 AppBar를 끄고
> 화면 안에서 `<AppBar>`를 직접 렌더한다.** 우측 슬롯에 액션(더보기·완료 버튼)을 넣기 위해서다.
> `mypage.md` P2·P3, `signup.md` S3·S4와 같은 패턴.

> ⚠️ **B7·B8·B14·B15·B20은 경로 접두사가 `/post`다** (`/board`가 아니다). 라우트 파일은
> `BoardIndex.js` 하나인데 경로 네임스페이스가 둘로 갈린다. → `deferred.md` 대상, 이관 시 **그대로**

### 진입 경로

| 화면 | 진입 출처                                                                          |
| ---- | ---------------------------------------------------------------------------------- |
| B1   | `MainNoticeTopThree.vue:22` (메인 공지 카드 헤더) · `MyPageMenuList.vue:56`        |
| B2   | `MainNoticeTopThree.vue:71,78` · B1 목록 · **B21 팝업** · **네이티브 푸시 딥링크** |
| B3   | `MyPageMenuList.vue:63`                                                            |
| B4   | B3 목록                                                                            |
| B5   | `constants/domain/common.js:35` (메인 메뉴 `menuUrl`)                              |
| B12  | `constants/domain/common.js:41` (메인 메뉴 `menuUrl`)                              |
| B11  | B5 AppBar 우측 사람 아이콘 · `MyPageMenuList.vue:35`                               |
| B18  | B12 AppBar 우측 사람 아이콘 · `MyPageMenuList.vue:40`                              |
| B19  | `MyPageMenuList.vue:32`                                                            |
| B20  | B6·B13 더보기 드로어 → `게시글 신고하기`                                           |

**네이티브 푸시 딥링크**: `natives/common.js:86` — `targetPath = /board/notice/detail/${dataUuid}`.
공지사항 상세만 푸시 대상이다 (`native-protocol.md` 참조).

---

## 1. 하위 컴포넌트 전수 (48파일)

### 1-1. 루트 공용 (`views/BoardView/*.vue`) — 21개

| 파일                       |  줄 | 역할                                    | 사용 화면      |
| -------------------------- | --: | --------------------------------------- | -------------- |
| `BoardPostList.vue`        |  87 | 무한스크롤 게시글 목록                  | B5·B12·B11·B18 |
| `BoardPostListItem.vue`    | 139 | 게시글 카드 1개                         | 〃             |
| `BoardPostStatusChip.vue`  |  36 | 민원 처리상태 칩 (접수/처리중/처리완료) | 목록·상세      |
| `BoardSearchInput.vue`     |  30 | 검색 입력 (debounce 500ms)              | B1·B3·B5·B12   |
| `WriteButton.vue`          |   8 | 우하단 플로팅 작성 버튼                 | B5·B12         |
| `MyActivities.vue`         |  57 | 내 활동 탭 컨테이너                     | B11·B18        |
| `DetailPost.vue`           |  27 | 상세 게시글 래퍼                        | B6·B13         |
| `DetailPostInfo.vue`       |  62 | 카테고리·제목·작성자·조회수             | 〃             |
| `DetailPostContent.vue`    |  51 | 본문 + 첨부 이미지                      | 〃             |
| `DetailPostLikeButton.vue` |  80 | 좋아요/동의해요 버튼 (낙관적 카운트)    | 〃             |
| `DetailPostMoreButton.vue` | 199 | 더보기 드로어 + 삭제·차단·신고 모달     | 〃             |
| `DetailComment.vue`        |  40 | 댓글 헤더 + 목록 + 입력                 | 〃             |
| `CommentList.vue`          |  47 | 댓글/대댓글 평면 렌더                   | B6·B13·B7·B14  |
| `CommentListItem.vue`      | 258 | 댓글 1개 (작성자·상태·이미지·더보기)    | 〃             |
| `CommentInput.vue`         | 160 | 하단 고정 댓글 입력 (이미지 첨부)       | 〃             |
| `CommentReplyWrite.vue`    |  39 | 답글 작성 화면 본체                     | B7·B14         |
| `CommentEdit.vue`          | 206 | 댓글 수정 화면 본체                     | B8·B15         |
| `FormContainer.vue`        | 138 | 글 등록/수정 셸 (AppBar·모달)           | B9·B10·B16·B17 |
| `FormDetail.vue`           |  80 | 카테고리 + 제목 + 내용 입력             | 〃             |
| `FormCategory.vue`         |  83 | 카테고리 선택 버튼 + 드로어             | 〃             |
| `FormBottom.vue`           |  75 | 하단 바 (사진 첨부 + 비밀글)            | 〃             |
| `FormImageUpload.vue`      |  43 | 사진 첨부 라벨 (n/5)                    | 〃             |
| `FormImagesPreview.vue`    |  59 | 첨부 이미지 미리보기 스트립             | 〃             |

> 실제 루트 파일은 23개다(위 표). `WriteButton`·`BoardPostStatusChip` 포함.

### 1-2. 계보별 폴더

| 폴더                 | 파일 수 | 구성                                                                                                                  |
| -------------------- | ------: | --------------------------------------------------------------------------------------------------------------------- |
| `NoticeBoard/`       |       4 | `NoticeBoardView`(119) · `NoticeBoardItem`(81) · `NoticeDetailView`(144) · `NoticePopupModal`(112)                    |
| `GlobalNoticeBoard/` |       4 | `GlobalNoticeBoardView`(40) · `GlobalNoticeBoardItem`(69) · `GlobalNoticePostList`(76) · `GlobalNoticeDetailView`(81) |
| `Community/`         |       7 | Board(80) · Detail(91) · Write(42) · Edit(55) · CommentReplyWrite(37) · CommentEdit(30) · MyActivities(34)            |
| `Complaints/`        |       7 | Board(79) · Detail(91) · Write(42) · Edit(55) · CommentReplyWrite(37) · CommentEdit(30) · MyActivities(34)            |
| `Setting/`           |       2 | `SettingUserBlockView`(27) · `SettingUserBlockItem`(84)                                                               |
| `Report/`            |       1 | `ReportView`(68)                                                                                                      |

---

## 2. 공용 컴포넌트 의존 (`components/**`)

이관 시 **`tech-mapping.md` §공용 컴포넌트 재작성**의 결과물을 쓴다. 여기서는 **게시판이 넘기는
props만** 기록한다. 컴포넌트 자체 명세는 중복 작성하지 않는다.

| 컴포넌트           | 게시판에서 넘기는 props                                                                                  |
| ------------------ | -------------------------------------------------------------------------------------------------------- |
| `AppBar`           | `title` · `is-modal-visible`(B8·B9·B10·B15·B16·B17) · `@open-modal` · 기본 슬롯(우측 액션)               |
| `TabCategory`      | `color="deepBlue"` · `:categories` · `has-total-type` · `class="pb-6"` · `@select-category`              |
| `TabBase`          | `:tab-list="MY_ACTIVITY_TABS"` · `@select-tab`                                                           |
| `DrawerList`       | `:list` · `text-align`(`center`/`left`) · `title`(카테고리 드로어만) · `@close`                          |
| `ModalButton`      | `button-type`(`outline`/`single`) · `:modal-data` · `:first-handle` · `:second-handle` · `@close`        |
| `ModalBase`        | B21 팝업이 직접 사용                                                                                     |
| `ModalImageViewer` | `:image-url` · `@close`                                                                                  |
| `ChipBase`         | `color`(`red`/`deepPurple`/`lightPurple`/`darkPurple`/`gray`) · `variant`(`fill`/`outline`)              |
| `FileAttachment`   | `:file-info`                                                                                             |
| `SpinnerDots`      | `:progress-percent` · `background-color` · `text-color`                                                  |
| `TextEmpty`        | 슬롯 텍스트                                                                                              |
| `ButtonBase`       | `type` · `color`(`brand`/`alerts-error`/`defaults-secondary`) · `size="2xl"` · `round-type` · `disabled` |

> ⚠️ **`TabCategory`는 `color` prop을 받지 않는다.** `CommunityBoardView`·`ComplaintsBoardView`·
> `NoticeBoardView` 셋 다 `color="deepBlue"`를 넘기지만 `TabCategory.vue`의 `defineProps`에는
> `hasTotalType`·`categories`만 있다. **넘긴 값이 무시되고 fallthrough attr로 `<ul>`에 붙는다.**
> 화면상 영향 없음. 이관 시 **prop을 만들지 말고 그냥 제거**한다. → `deferred.md` 등록

### `TabCategory` 선택 동작 (등가 이관에 필요)

- `has-total-type`이면 index 0이 **`전체`** 탭이며 `{ uuid: undefined, category: '전체' }`를 emit
- 선택 상태: `bg-brand-default-background-brand text-brand-default-text-brand-inverse`
- 비선택: `bg-defaults-secondary-background-mono text-defaults-secondary-text-secondary`
- 공통: `min-w-fit cursor-pointer rounded-[36px] px-3 py-2 text-center transition-all duration-300 ease-in-out pretendard-14Regular`
- `<ul>`: `relative flex gap-2 overflow-x-auto px-6`
- **선택 상태는 `TabCategory` 내부 `ref(0)`이 소유한다.** 부모가 초기값을 정할 수 없다

---

## 3. 공용 훅·유틸·상수

### 3-1. `useInfiniteList` (`lib/queries/common/useInfiniteList.js`)

게시판 무한목록 7개가 전부 이 팩토리를 쓴다 (`query-keys.md` §2 참조).

| 사용처                       | `queryKey`                        | `defaultStoreKey`     | `additionalParams`        |
| ---------------------------- | --------------------------------- | --------------------- | ------------------------- |
| B1 공지 목록                 | `noticeList`                      | `['aptUuid']`         | `keyword`, `categoryUuid` |
| B3 아파트먼트 공지 목록      | `globalNoticeList`                | `['aptResidentUuid']` | `keyword`                 |
| B5 소통공간 목록             | `communityPostList`               | `['aptResidentUuid']` | `keyword`, `categoryUuid` |
| B12 민원공간 목록            | `complaintsPostList`              | `['aptResidentUuid']` | `keyword`, `categoryUuid` |
| B11 소통 내활동 — 작성한 글  | `communityMyActivityPostList`     | `['aptResidentUuid']` | 없음                      |
| B11 소통 내활동 — 댓글 쓴 글 | `communityMyActivityCommentList`  | `['aptResidentUuid']` | 없음                      |
| B18 민원 내활동 — 작성한 글  | `complaintsMyActivityPostList`    | `['aptResidentUuid']` | 없음                      |
| B18 민원 내활동 — 댓글 쓴 글 | `complaintsMyActivityCommentList` | `['aptResidentUuid']` | 없음                      |

**고정 규약** (전부 등가 이관 대상):

- `size: 10` **하드코딩**, `initialPageParam: 0`
- `getNextPageParam`: `!last && pages.length < totalPages` → `number + 1`, 아니면 `undefined`
- `select` 반환 형태:
  ```
  { pages: 전체 페이지의 content를 flatMap한 평면 배열,
    pageParams: 첫 페이지의 number,
    pageable: { totalPages, totalElements, empty, sort, numberOfElements } }
  ```
  ⚠️ **`pages`가 페이지 배열이 아니라 아이템 평면 배열이다.** 이름과 내용이 어긋난다.
  `pageable`은 **첫 페이지 기준**이므로 이후 페이지에서 총계가 바뀌어도 갱신되지 않는다
- **모듈 최상위에서 `useAuthStore()`를 호출한다** (`useInfiniteList.js:6`).
  Pinia 인스턴스가 활성화되기 전 import되면 터진다. 현재는 우연히 동작.
  → 타깃에선 훅 안으로 옮긴다 (`deferred.md`)

### 3-2. `useInfiniteScrollPosition` (스크롤 위치 복원)

`BoardPostList`·`GlobalNoticePostList`가 사용.

| 사용처                 | `routeRules`                                                                 |
| ---------------------- | ---------------------------------------------------------------------------- |
| `BoardPostList`        | `{ moveFrom: '/detail', moveTo: ['/board/community', '/board/complaints'] }` |
| `GlobalNoticePostList` | `{ moveFrom: '/detail', moveTo: '/board/global-notice' }`                    |

동작:

1. `onBeforeUnmount` → `sessionStorage.setItem('scrollRestoration', JSON.stringify({ position }))`
2. `scrollContainerRef`가 붙는 순간 `restoreScrollPosition()`
3. 복원 조건 `isValidPath()`: `router.options.history.state.forward`가 `moveFrom`을 포함하고
   현재 경로가 `moveTo`를 포함할 때만

> ⚠️ **저장 키가 `'scrollRestoration'` 하나뿐이다.** 소통공간·민원공간·아파트먼트 공지가
> 모두 같은 키를 덮어쓴다. 목록 A → 상세 → 뒤로 → 목록 B로 이동하면 B가 A의 위치로 복원될 수 있다.
> → `deferred.md` 등록. **이관 시 그대로**(등가)
>
> ⚠️ **`scrollInfo.position`에 `scrollY`(Ref 객체)를 그대로 넣는다.** `JSON.stringify`가
> Ref를 직렬화하면서 `.value`가 아닌 내부 표현이 들어갈 수 있다. 실제로는 vueuse `useScroll`의
> `y`가 `JSON.stringify` 시 `toJSON` 경로를 타 숫자로 떨어진다. **동작은 하지만 의도치 않은 의존.**
> → `[확인 필요]` BD-Q1

> ⚠️ **B1(공지사항)만 이 컴포저블을 쓰지 않고 자체 구현한다** (§B1 참조).

### 3-3. `useCommentImageList` (댓글 이미지 — B6·B7·B8·B13·B14·B15)

| 제약      | 값                                             |
| --------- | ---------------------------------------------- |
| 최대 장수 | `MAX_COUNT = 5`                                |
| 최대 크기 | `MAX_SIZE = 10 * 1024 * 1024` = **10,485,760** |
| 허용 타입 | `image/jpeg`, `image/jpg`, `image/png`         |

- 신규 `File`과 기존 이미지(`{ fileUuid, fileUrl, orderNum }`)를 **한 배열에 섞어** 보관
- `File` → `URL.createObjectURL` 캐시(`Map`), 미사용분은 `revokeObjectURL`,
  `onScopeDispose`에서 일괄 정리
- `previewImageList` 항목: `File`이면 `{ url, key: '${name}-${index}' }`,
  기존이면 `{ url: s3UrlFile+fileUrl, key: fileUuid }`
- 검증 실패 순서: `countLimit`(슬롯 0) → `fileTypeLimit` → `sizeLimit`
- 남은 슬롯보다 많이 고르면 **`take()`로 잘라 담고 `countLimit` 토스트를 추가로** 띄운다
- 매 처리 후 `event.target.value = ''` (같은 파일 재선택 허용)
- **`lodash`의 `every`·`take`를 쓴다** (`lodash-es` 아님) → 타깃 이관 시 순수 JS로 대체 가능

### 3-4. `validImage` (게시글 폼 이미지 — B9·B10·B16·B17)

**`useCommentImageList`와 규칙이 다르다.** 등가 이관을 위해 반드시 분리 유지한다.

| 항목      | `validImage` (게시글)                             | `useCommentImageList` (댓글)      |
| --------- | ------------------------------------------------- | --------------------------------- |
| 최대 장수 | 5                                                 | 5                                 |
| 최대 크기 | **`10000000`** (10,000,000 B)                     | **`10*1024*1024`** (10,485,760 B) |
| 허용 타입 | jpeg, jpg, png, **gif**                           | jpeg, jpg, png (**gif 없음**)     |
| 상태 보관 | Pinia `boardFormStore.setFieldValue('imageList')` | 컴포저블 로컬 `ref`               |
| 실패 시   | **첫 위반에서 즉시 return** (부분 추가 없음)      | 전체 검증 후 일괄 추가            |

> ⚠️ **10,000,000 B와 10,485,760 B 사이(약 10.0~10.49MB) 파일은 게시글엔 못 올리고 댓글엔 올라간다.**
> gif는 게시글엔 되고 댓글엔 안 된다. → `deferred.md` 등록. **이관 시 그대로**

### 3-5. `useUploadProgress`

```
onUploadProgress: (e) => e.total && (percent = Math.round(e.loaded*100/e.total))
onSuccess: () => percent = 100
onError:   () => percent = 0
```

`SpinnerDots`의 `:progress-percent`로 흘러간다. **`progressPercent`가 0이면 숫자를 렌더하지 않는다**
(`v-if="progressPercent"`).

### 3-6. `convertFormDataFile` (multipart 조립)

```
fileList  → fileList[i].file      (File일 때)
          → fileList[i].fileUuid  (기존 이미지일 때)
          → fileList[i].orderNum = i   (항상)
그 외 키  → formData.append(key, value)
```

> ⚠️ **`orderNum`은 배열 순서로 재계산된다.** 서버가 준 원래 `orderNum`은 버려진다.
> 상세 조회 시 `fileList.sort((a,b) => a.orderNum - b.orderNum)`로 다시 정렬하므로 왕복 일관.

### 3-7. `useKoreanTimeAgo`

vueuse `useTimeAgo` 결과를 문자열 치환으로 한국어화. `dateString`이 falsy면
**`{ koreanTimeAgo: '시간 없음' }`을 즉시 반환**한다 (computed 아님 — 반응성 없음).

치환 표: `just now`→`방금 전`, `N second(s)/minute(s)/hour(s)/day(s)/week(s)/month(s)/year(s) ago`
→ `N초/분/시간/일/주/개월/년 전`, `yesterday`→`1일 전`, `last week/month/year`→`1주/1개월/1년 전`.

> ⚠️ **`BoardPostListItem`은 `useKoreanTimeAgo(props.postItemData?.createdDate)`로 값을 넘긴다**
> (ref가 아니라 원시값). props가 바뀌어도 갱신 안 된다. 반면 `DetailPostInfo`는
> `computed(() => props.postData?.createdDate)`로 넘겨 반응한다. **비대칭.** 목록은 아이템이
> 교체되므로 실제 문제는 없다.

### 3-8. `formatHtmlText`

```js
formatHtmlText(text) = decodeUrl(text)?.replaceAll(/\n/g, '<br/>')
```

`decodeUrl`은 `he` 기반 HTML 엔티티 디코더. 게시판 전역에서 제목·본문·댓글에 적용된다.
역변환(`<br/>` → `\n`)은 수정 화면 진입 시 `replaceAll('<br/>', '\n')`으로 수동 처리한다.

### 3-9. `validateQueryEnabledParams`

`INVALID_VALUES = [0, false, undefined, null, '', ...]`에 포함되지 않으면 `true`.
`useGetCommunityPostDetail`·`useGetComplaintsPostDetail`의 `enabled`에 쓰인다.

### 3-10. 상수 — `constants/domain/board.js` 전문

| 심볼                                               | 내용                                                                                                                                   |
| -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `BOARD_TOAST_MESSAGE.create`                       | `등록되었습니다`                                                                                                                       |
| `BOARD_TOAST_MESSAGE.delete`                       | `삭제되었습니다`                                                                                                                       |
| `BOARD_TOAST_MESSAGE.reported`                     | `신고되었습니다`                                                                                                                       |
| `BOARD_TOAST_MESSAGE.edit`                         | `수정되었습니다`                                                                                                                       |
| `BOARD_TOAST_MESSAGE.blocked`                      | `차단되었습니다`                                                                                                                       |
| `BOARD_TOAST_MESSAGE.unblocked`                    | `차단 해제되었습니다`                                                                                                                  |
| `BOARD_TOAST_MESSAGE.image.countLimit`             | `이미지는 최대 5장까지만 첨부할 수 있습니다`                                                                                           |
| `BOARD_TOAST_MESSAGE.image.sizeLimit`              | `파일 사이즈는 10M 이하만 업로드 가능 합니다`                                                                                          |
| `BOARD_TOAST_MESSAGE.image.fileTypeLimit`          | `이미지만 첨부 가능합니다`                                                                                                             |
| `WRITE_BACK_MODAL_DATA`                            | 제목 `작성 그만두기` / 본문 `['작성을 그만두시겠습니까?', '변경된 내용은 저장되지 않습니다']` / `취소`·`그만두기`                      |
| `EDIT_BACK_MODAL_DATA`                             | 제목 `수정 그만두기` / 본문 `['수정을 그만두시겠습니까?', '변경된 내용은 저장되지 않습니다']` / `취소`·`그만두기`                      |
| `WRITE_PRIVATE_MODAL_DATA`                         | 제목 `비밀글 설정하기` / 본문 `['민원공간에서 타인에게 노출되지 않으며,', '관리사무소와 작성자만 확인할 수 있습니다']` / `취소`·`확인` |
| `DETAIL_DELETE_MODAL_DATA`                         | 제목 `삭제하기` / 본문 `'삭제하시겠습니까?'` (문자열) / `취소`·`삭제`                                                                  |
| `DETAIL_BLOCK_MODAL_DATA(authorName)`              | 제목 `이 사용자의 글 보지 않기` / 본문 `['{authorName}님의 모든 게시글을', '보지 않으시겠어요?']` / `취소`·`안보기`                    |
| `COMPLAINTS_DETAIL_NONEDITABLE_MODAL_DATA(status)` | 제목 `처리중`\|`처리완료` / 본문 `{처리중인\|처리완료된} 민원은 수정 및 삭제할 수 없습니다` / `확인` (단일)                            |
| `DETAIL_COMMENT_AUTHOR_STATE`                      | `DELETE:'삭제된 댓글'` · `RESIDENT_DELETE:'탈퇴된 회원의 댓글'` · `BLOCK:'차단된 회원의 댓글'` · `ADMIN:'관리사무소'`                  |
| `DETAIL_MORE_DRAWER_AUTHOR_DATA.EDIT`              | `{ label:'수정', key:'edit', color:'text-defaults-secondary-text-secondary' }`                                                         |
| `DETAIL_MORE_DRAWER_AUTHOR_DATA.DELETE`            | `{ label:'삭제', key:'delete', color:'text-alerts-error-text-error' }`                                                                 |
| `DETAIL_MORE_DRAWER_VIEWER_DATA.BLOCK`             | `{ label:'이 사용자의 글 보지 않기', key:'userBlock', color:'text-defaults-secondary-text-secondary' }`                                |
| `DETAIL_MORE_DRAWER_VIEWER_DATA.REPORT`            | `{ label:'게시글 신고하기', key:'postReport', color:'text-alerts-error-text-error' }`                                                  |
| `MY_ACTIVITY_TABS`                                 | `[{label:'작성한 글',key:'posts'}, {label:'댓글 쓴 글',key:'comments'}]`                                                               |

> ⚠️ `DETAIL_DELETE_MODAL_DATA.description`만 **문자열**이고 나머지는 **배열**이다.
> `ModalButton`이 `typeof description === 'object'`로 분기하므로 렌더 경로가 다르다. 그대로 유지.

### 3-11. 스키마 — `schemas/board.js` + `schemas/common.js`

```js
boardFormSchema = toTypedSchema(z.object({ category, title, content }))
```

| 필드       | 규칙 (zod 3 원문)                                                                                                                                     |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `category` | `z.object({ category: z.string({required_error:'카테고리를 선택해주세요'}), uuid: z.string({required_error:'카테고리를 선택해주세요'}) }).nullable()` |
| `title`    | `z.string({required_error:'제목을 입력해주세요'}).trim().min(1,{message:'제목을 한 글자 이상 입력해주세요'})`                                         |
| `content`  | `z.string({required_error:'내용을 입력해주세요'}).min(1,{message:'내용을 한 글자 이상 입력해주세요'})`                                                |

> ⚠️ **`imageList`·`privateFlag`는 스키마에 없다.** 그런데 스토어는 `defineField('imageList')`·
> `defineField('privateFlag')`로 필드를 만든다. vee-validate는 스키마 밖 필드를 검증하지 않고
> `values`에는 포함시킨다. **의도된 동작이며 그대로 이관.**
>
> ⚠️ **`category`가 `.nullable()`이라 `null`이 스키마를 통과한다.** 그래서 `meta.valid`가
> 카테고리 없이도 `true`가 될 수 있고, `FormDetail`이 **수동 검증**으로 이를 막는다 (§B9).
>
> **zod 4 이관**: `required_error` 5건 → `error`. `zod-migration.md` 규칙 적용.
> `category`·`title`·`content`는 다른 도메인(Repair 등)도 공유하므로 `shared`에 남긴다.

---

## 4. 소통공간 ↔ 민원공간 차이 전수 (17건)

대칭이라 뭉뚱그리기 쉽지만, **실제로 다음 17군데가 다르다.** 이관 시 이 표가 체크리스트다.

| #   | 항목                              | 소통공간 (community)                         | 민원공간 (complaints)                                                 |
| --- | --------------------------------- | -------------------------------------------- | --------------------------------------------------------------------- |
| 1   | 목록 API 경로                     | `/community`                                 | **`/complaint/list`** (`/list` 접미사)                                |
| 2   | 상세 uuid 필드명                  | `communityUuid`                              | `complaintUuid` (**단수**)                                            |
| 3   | 목록 AppBar 제목                  | `소통공간`                                   | **`민원 공간`** (공백 있음)                                           |
| 4   | 상세 AppBar 제목                  | `소통공간 상세`                              | **`민원 공간`** (`상세` 없음 + 공백)                                  |
| 5   | 좋아요 버튼 라벨                  | `좋아요`                                     | `동의해요`                                                            |
| 6   | 처리상태 칩                       | 없음                                         | `BoardPostStatusChip` (접수/처리중/처리완료)                          |
| 7   | 비밀글 체크박스                   | 없음 (`v-if="!isCommunityBoard"`)            | 있음                                                                  |
| 8   | 수정·삭제 제한                    | 없음                                         | `status !== 'RECEIVED'`면 차단 모달                                   |
| 9   | 상세 본문 래퍼 클래스             | `h-full w-full space-y-2 overflow-auto`      | `h-full w-full overflow-auto` (**`space-y-2` 없음**)                  |
| 10  | 글 등록 에러 `BOARD_BLACK_LIST`   | 처리함                                       | **처리 안 함** (`usePostComplaintsPost`)                              |
| 11  | 글 수정 에러 `BOARD_BLACK_LIST`   | 처리함                                       | **처리 안 함** (`usePatchComplaintsPost`)                             |
| 12  | 댓글 삭제 에러 `BOARD_BLACK_LIST` | 처리함                                       | **처리 안 함** (`useDeleteComplaintsComment`)                         |
| 13  | 글 삭제 에러 `BOARD_BLACK_LIST`   | 처리함                                       | **처리 안 함** (`useDeleteComplaintsPost`)                            |
| 14  | 삭제 훅 `isPending` 노출          | `isPending: isDeleteCommunityPostPending` ✅ | **`isDeleteComplaintsPostPending`** (키 이름 오타 → 항상 `undefined`) |
| 15  | 폼 AppBar 제목                    | `소통공간 글 등록`/`소통공간 글 수정`        | `민원공간 글 등록`/`민원공간 글 수정` (공백 없음)                     |
| 16  | 신고 후 이동                      | `/board/community`                           | `/board/complaints`                                                   |
| 17  | 내 활동 AppBar                    | `소통공간 내 활동`                           | `민원공간 내 활동`                                                    |

> ⚠️ **#3·#4·#15 — `민원 공간`(공백)과 `민원공간`(붙임)이 한 도메인에서 섞여 쓰인다.**
> AppBar만 공백이 있고 라우트 name·폼 제목은 붙어 있다. **CSS 오타가 아니라 표시 문구이므로
> 등가 이관 원칙에 따라 그대로 둔다.** → `deferred.md` 「오타·표기」에 등록, 이관 후 협의
>
> ⚠️ **#10~#13 — `BOARD_BLACK_LIST` 처리 누락 4건.** 민원공간에서 블랙리스트 사용자는
> `swalErrorModal({text: message})`로 **서버 원문 메시지**를 보게 된다(소통공간은 전용 안내문).
> 서버 메시지가 무엇인지 확인 안 됨. → `[확인 필요]` BD-Q2
>
> ⚠️ **#14는 명백한 버그다.** `useMutation`은 `isPending`을 반환하는데
> `useDeleteComplaintsPost`는 `{ mutate: ..., isDeleteComplaintsPostPending }`로 구조분해한다.
> 존재하지 않는 키라 항상 `undefined`. 다만 **B13이 이 값을 쓰지 않아** 화면 영향은 없다.
> → `deferred.md`. **이관 시 타깃에선 자연히 사라진다**(반환값을 안 쓰므로 노출하지 않음)

---

## 5. 도메인 전역 결함 (이관 시 반드시 인지)

이관 후 "왜 이렇게 동작하지?"로 되돌아오지 않도록 여기 모은다.
**전부 등가 이관 대상이다. 고치지 않는다.** 개선은 `deferred.md`로 간다.

### 5-1. 게시글 상세 쿼리 키에 `postUuid`가 없다 🔴

```js
// useGetCommunityPostDetail.js:446
queryKey: ['communityPostDetail', authStore.getAptInfo().aptResidentUuid]
//         ↑ postUuid가 빠져 있다
queryFn: () => getCommunityPostDetail({ ..., communityUuid: getParams().postUuid })
```

`useGetComplaintsPostDetail`도 동일. **모든 게시글이 같은 캐시 슬롯을 공유한다.**
현재는 `staleTime: 0`(레거시 QueryClient 기본값)이라 매번 refetch돼 증상이 드러나지 않는다.

> ⚠️ **타깃의 `queryClient.ts` 기본값을 레거시에 맞추지 않으면(`staleTime: 60s`) 이 버그가
> 즉시 발현된다** — 다른 글을 열었는데 이전 글이 보인다. `tech-choices.md`의
> "QueryClient 기본값을 레거시에 맞춘다" 결정이 **이 도메인에서 필수 조건**이다.

### 5-2. 댓글 목록 쿼리 키가 `getParams().uuid`를 읽는다 🔴

```js
// useGetCommunityCommentList.js:368
queryKey: ['communityCommentList', aptResidentUuid, getParams().uuid]
//                                                            ↑ 라우트 파라미터는 postUuid다
```

`uuid`라는 파라미터는 어느 라우트에도 없다 → 항상 `undefined`.
**5-1과 같은 캐시 충돌**이며, `useDeleteCommunityComment`의 무효화도 같은 잘못된 키를 쓴다
(우연히 일치해서 동작). 민원공간도 동일.

### 5-3. `invalidateQueries` v4 위치인자 — 게시판에서 6곳

v5에서 **조용히 no-op**이 된다 (`query-keys.md` §1의 28곳 중 게시판 몫).

| 파일                            |   줄 | 호출                                                                             |
| ------------------------------- | ---: | -------------------------------------------------------------------------------- |
| `useDeleteCommunityComment.js`  |   71 | `invalidateQueries(['communityCommentList', aptResidentUuid, undefined])`        |
| `useDeleteComplaintsComment.js` |  181 | `invalidateQueries(['complaintsCommentList', aptResidentUuid, undefined])`       |
| `usePostCommunityComment.js`    | 1400 | `invalidateQueries(['communityCommentList'])`                                    |
| `usePostComplaintsComment.js`   | 1646 | `invalidateQueries(['complaintsCommentList'])`                                   |
| `usePostCommunityReply.js`      | 1582 | `invalidateQueries(['communityCommentList'])` + `(['communityCommentDetail'])`   |
| `usePostComplaintsReply.js`     | 1824 | `invalidateQueries(['complaintsCommentList'])` + `(['complaintsCommentDetail'])` |

추가로 **목록 훅 4개의 `watch` 내부 무효화**도 같은 형태다:
`useGetNoticeList`·`useGetGlobalNoticeList`·`useGetCommunityPostList`·`useGetComplaintsPostList`.

> **이관 규칙**: 전부 `invalidateQueries({ queryKey: [...] })`로 바꾼다.
> 단 **키 내용은 레거시 그대로 유지**한다(5-2의 `undefined` 포함). 키를 고치면 무효화 범위가
> 달라져 화면 갱신 타이밍이 바뀐다 — 등가 이관 위반.

### 5-4. 검색어 하이라이트가 제목을 소문자화한다

```js
const title = formatHtmlText(props.boardInfo?.title?.toLowerCase())
```

`NoticeBoardItem`·`GlobalNoticeBoardItem`·`BoardPostListItem` **3곳 모두** 동일.
**목록에 표시되는 제목은 항상 소문자다.** 한글은 영향 없지만 영문 제목은
`Notice` → `notice`로 보인다. 상세 화면은 원본을 쓰므로 목록↔상세 제목이 달라진다.

→ `deferred.md` 「동작 의심」. **이관 시 그대로.**

### 5-5. 하이라이트 결과가 문자열일 때 `v-for`가 문자 단위로 돈다

```js
if (!keyword) convertedTitle = title // ← 문자열
if (keyword && title.includes(keyword))
  convertedTitle = title.split(new RegExp(`(${keyword})`, 'gi')) // ← 배열
```

```html
<template v-for="(title, index) in highlightedTitle" :key="index"></template>
```

Vue의 `v-for`는 **문자열을 문자 배열로 순회한다.** 검색어가 없는 평상시에는
제목의 **글자 하나하나가 각각 `<span>`으로 렌더된다.**

> ⚠️ **React로 옮길 때 가장 쉽게 어긋나는 지점이다.** `{highlightedTitle.map(...)}`는
> 문자열에서 터진다. 등가를 지키려면 `Array.from(highlightedTitle)`로 명시 변환해야 하고,
> 그래야 DOM 구조(글자별 span)까지 같아진다.
> **DOM 구조까지 맞출지**는 판단이 필요하다 → `[확인 필요]` BD-Q3

### 5-6. 키워드 불일치 시 아이템이 통째로 사라진다

`keyword`가 있고 제목에 없으면 `convertedTitle`은 `undefined` → `<li v-if="highlightedTitle">`가
거짓 → 아이템 미렌더. **서버가 이미 `keyword`로 필터링하므로 정상 경로에선 발생하지 않지만,**
서버가 본문 매칭까지 포함해 반환하면 목록에 빈 자리가 생긴다(높이 0의 빈 항목이 아니라 완전 제거).

### 5-7. `boardFormStore`가 전역 싱글턴이다 🔴

```js
export const useBoardFormStore = defineStore('boardForm', () => {
  const { defineField, values, meta, isSubmitting, handleSubmit, ... } =
    useForm({ validationSchema: boardFormSchema });
  ...
});
```

**Pinia 스토어 안에서 vee-validate `useForm`을 호출한다.** 결과:

- 소통공간 글 작성 → 뒤로가기(모달 `그만두기`) → `resetForm()` 호출됨 ✅
- 소통공간 글 작성 → **브라우저 뒤로가기/앱바 이외 경로 이탈** → `resetForm()` **안 됨**
  → 민원공간 글 작성에 들어가면 **이전 입력이 남아 있다** 🔴
- `submitForm` 성공 시에만 `resetForm()`

또한 `setSubmitHandler`가 스토어에 함수를 저장하므로, **Write/Edit 뷰가 `onMounted`에서
핸들러를 갈아끼우는 순서에 의존**한다.

→ 타깃에선 `FormProvider` + RHF로 분해한다 (`tech-mapping.md` 3-3). **단 화면 동작은 동일해야
하므로 "이탈 시 값 유지" 동작까지 재현할지 결정이 필요하다** → `[확인 필요]` BD-Q4

### 5-8. `NoticeBoardView`의 `hasNextPage` 검사가 항상 참이다

```js
const { hasNoticeListNextPage, ... } = useGetNoticeList();   // Ref<boolean>
watchEffect(() => {
  if (hasNoticeListNextPage && targetIsVisible.value) {      // ← .value 누락
    fetchNoticeListNextPage();
  }
});
```

`hasNoticeListNextPage`는 Ref 객체라 **항상 truthy**. 센티널이 보이면 다음 페이지가 없어도
`fetchNextPage()`를 호출한다. TanStack Query가 `hasNextPage=false`면 무시하므로 실질 피해는 없다.

**`BoardPostList`·`GlobalNoticePostList`는 props로 받아 자동 언랩되므로 정상이다.** B1만 다르다.

### 5-9. 상세 페이지 훅에 인자를 넘기는데 훅이 안 받는다

```js
// CommunityEditView.vue
const { patchCommunityPostMutationAsync } = usePatchCommunityPost(postDetailUuid.value)
const { communityPostDetail } = useGetCommunityPostDetail(postDetailUuid.value)
```

두 훅 모두 **매개변수가 없다.** 게다가 `postDetailUuid`는 `onMounted`에서 채워지므로
setup 시점에는 `''`이다. 훅 내부는 `getParams().postUuid`를 직접 읽어 정상 동작한다.
**죽은 인자.** 민원공간도 동일. → `deferred.md` 「죽은 코드」

### 5-10. `MyActivities` 뷰의 `watch`가 무의미하다

```js
const fetchMyActivityPostList = useGetCommunityMyActivityPostList() // 일반 객체
watch(
  () => fetchMyActivityPostList,
  (newValue) => {
    myPostList.value = newValue
  },
  { immediate: true },
)
```

훅 반환값은 **객체 참조가 고정**이라 `immediate` 1회 외에는 절대 발화하지 않는다.
객체 안에 Ref들이 들어 있어 결과적으로 동작한다.
→ 타깃에선 `const myPostList = useCommunityMyActivityPostList()` 한 줄이면 된다.
**렌더 결과가 같으므로 이 단순화는 등가 이관 위반이 아니다.**

### 5-11. 게시글 폼은 검증이 이중이다

`FormDetail.handleFormSubmit`이 **수동 검증**(swalErrorModal)을 먼저 하고, 통과하면
`boardFormStore.submitForm(e)`(vee-validate + zod)를 호출한다.
`category`가 `.nullable()`이라 zod만으로는 카테고리 미선택을 못 잡기 때문이다.

**사용자가 보는 것은 수동 검증의 `swalErrorModal`뿐이다.** vee-validate 에러 메시지는
어디에도 렌더되지 않는다(에러 표시 컴포넌트 없음).

> 이관 시: RHF `zodResolver`로 바꾸되 **에러 표시는 여전히 모달**이어야 한다.
> 필드 하단 인라인 에러를 새로 넣으면 등가 위반이다.

### 5-12. 완료 버튼의 색과 활성화 조건이 다르다

```html
<button
  type="submit"
  form="boardForm"
  :disabled="boardFormStore.isSubmitting"
  :class="boardFormStore.meta?.valid ? 'text-brand-default-text-brand'
                                           : 'text-defaults-tertiary-text-tertiary'"
></button>
```

`disabled`는 **제출 중일 때만** 참. 색은 `meta.valid` 기준.
→ **회색인데 눌리는 버튼**이 정상 동작이다. 눌리면 5-11의 모달이 뜬다. 그대로 이관.

`CommentEdit`의 완료 버튼은 다르다 — `:disabled="!isFilled || isSubmitting"`로 **실제로 잠근다.**

### 5-13. `ReportView`는 새로고침하면 오동작한다

```js
onMounted(() => { boardType.value = window.history?.state?.boardType; });
...
if (boardType.value === 'community') { 소통공간 신고 } else { 민원공간 신고 }
```

`boardType`은 `DetailPostMoreButton`이 `navigateTo({ path, state })`로 넘긴 history state에서
읽는다. **B20에서 새로고침하면 state가 사라져 `undefined` → `else` 분기 → 민원공간 API 호출.**
소통공간 글을 신고하려다 민원공간 엔드포인트를 때린다.

> 웹뷰 환경이라 사용자 새로고침은 드물지만, **딥링크·앱 복귀 시 재진입 경로가 있으면 발현한다.**
> → `deferred.md` 「동작 의심」. **이관 시 그대로**(등가). 타깃에서도 `location.state`로 옮긴다.

### 5-14. 그 외 소소한 것들

| 항목                                                                                                 | 조치     |
| ---------------------------------------------------------------------------------------------------- | -------- |
| `BoardPostList` 빈 문구 `게시글이 존재하지 않습니다` — **마침표 없음**                               | 그대로   |
| `NoticeBoardView` 빈 문구 `공지사항이 존재하지 않습니다.` — 마침표 있음                              | 그대로   |
| `GlobalNoticePostList` 빈 문구 `전체 공지사항이 존재하지 않습니다.` — 화면명은 `아파트먼트 공지사항` | 그대로   |
| `NoticeBoardView` 템플릿에 `<!-- 자동 배포 테스트 코드 #2-->` 주석 잔존                              | **삭제** |
| `NoticeDetailView` `<style scoped>`에 주석 처리된 `:deep(a)` 규칙                                    | **삭제** |
| `CommentEdit` textarea에 `placeholder` 없음 (클래스엔 `placeholder:` 유틸 있음)                      | 그대로   |
| `WriteButton`이 `@click`을 선언하지 않고 fallthrough로 받음                                          | 그대로   |
| `FormDetail` `onMounted`에서 `textareaRef.style.height = '100vh'` 직접 대입                          | 그대로   |
| `DetailPostInfo` `alt="프로필 이미지 "` — 끝에 공백                                                  | 그대로   |
| `ReportView` 제출 버튼 `absolute bottom-0 left-0` — 위치 기준 조상이 없음                            | 그대로   |

---

# B1. 공지사항 목록 — `/board/notice`

`NoticeBoard/NoticeBoardView.vue` (119줄) · **eager import**

## 화면 구성

```
┌─────────────────────────────┐
│ ← 공지사항                    │  라우트 meta AppBar
├─────────────────────────────┤
│ ┌─────────────────────────┐ │
│ │ 🔍 검색                  │ │  BoardSearchInput   p-5
│ └─────────────────────────┘ │
│ (전체)(공지)(행사)(점검) …    │  TabCategory  has-total-type  pb-6
├─────────────────────────────┤
│ [필독][공지]  2026.07.29     │  NoticeBoardItem
│ 여름철 단수 안내              │
│ 👁 128                       │
│ ─────────────────────────── │  border-b (마지막 항목 제외)
│ [점검]  2026.07.28           │
│ …                            │
│ ▮ 무한스크롤 센티널           │
└─────────────────────────────┘
```

| 요소            | 클래스 (원문)                                           |
| --------------- | ------------------------------------------------------- |
| 루트            | `h-[calc(100%-124px)] w-full`                           |
| 검색 영역       | `flex w-full flex-col gap-6 p-5`                        |
| 탭 영역         | `w-full`, `TabCategory`에 `class="pb-6"`                |
| 스크롤 컨테이너 | `h-full w-full overflow-auto` — `ref="noticeContainer"` |
| 목록 `<ul>`     | `flex w-full flex-col items-start`                      |
| 센티널          | `w-full pt-4` — `ref="target"`                          |
| 빈 상태         | `flex h-full items-center justify-center` + `TextEmpty` |

> ⚠️ **`h-[calc(100%-124px)]`는 AppBar(48) + 하단 여백을 뺀 하드코딩이다.** 124px의 근거가
> 코드에 없다. B5·B12도 같은 값을 쓰지만 그쪽은 `pt-12`가 추가로 붙는다. 그대로 이관.
>
> ⚠️ **스크롤 컨테이너가 `h-full`인데 부모가 이미 `calc(100%-124px)`다.** 검색·탭 영역 높이만큼
> 넘쳐서 실제 스크롤 영역이 뷰포트를 벗어난다. 레거시 화면 그대로 재현할 것.

## 데이터

| 항목     | 훅                         | 쿼리 키                                                       |
| -------- | -------------------------- | ------------------------------------------------------------- |
| 카테고리 | `useGetNoticeCategoryList` | `['noticeCategoryList', aptUuid]`                             |
| 목록     | `useGetNoticeList`         | `['noticeList', aptUuid, ...Object.values(additionalParams)]` |

**API**: `endpoints.md` #25 `getNoticeCategoryList`, #26 `getNoticeList`

`getNoticeList` 쿼리 파라미터: `page`, `size`(=10), `keyword`, `categoryUuid`

> ⚠️ **`additionalParams`가 `Object.values()`로 키에 들어간다.** 삽입 순서에 의존한다 —
> 카테고리를 먼저 고르고 검색하면 `[categoryUuid, keyword]`, 반대면 `[keyword, categoryUuid]`.
> **같은 조건인데 캐시 키가 달라진다.** `useInfiniteList` 전역 특성(`query-keys.md` §2).
> 이관 시 그대로 재현할지 → `[확인 필요]` BD-Q5

## 목록 아이템 — `NoticeBoardItem` (81줄)

| 요소        | 클래스 / 값                                                                                                                                                                                               |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `<li>`      | `flex flex-col items-start gap-3 self-stretch p-5 pb-6` + 부모가 `border-b border-defaults-tertiary-border-tertiary` 주입                                                                                 |
| 칩 줄       | `flex gap-3` > `flex gap-1`                                                                                                                                                                               |
| 필독 칩     | `noticeType === 'IMPORTANT'`일 때 `<ChipBase color="red" variant="fill">필독</ChipBase>`                                                                                                                  |
| 카테고리 칩 | `<ChipBase color="deepPurple" variant="fill">{categoryName}</ChipBase>`                                                                                                                                   |
| 날짜        | `leading-3.5 text-defaults-tertiary-text-tertiary pretendard-14Regular` — `formatIsoStringDate(createdDate).date()` ⚠️ **`leading-3.5`는 미생성** → `leading-[14px]`로 수정 (`broken-styles.md` §3, B-Q4) |
| 제목        | `h-[150%] w-full overflow-hidden text-ellipsis whitespace-nowrap text-defaults-primary-text-primary pretendard-16SemiBold`                                                                                |
| 하이라이트  | 일치 조각에 `text-brand-default-text-brand`                                                                                                                                                               |
| 조회 영역   | `mt-2 flex items-center gap-1.5 self-stretch`                                                                                                                                                             |
| 조회 아이콘 | `/assets/icons/Eye.svg` alt `조회 아이콘` `h-[13px] w-[13px]`                                                                                                                                             |
| 조회수      | `flex items-center gap-[3px] text-defaults-tertiary-text-tertiary pretendard-12Regular`                                                                                                                   |

**구분선 조건**: `noticeList?.pageable?.totalElements - 1 === index`면 선 없음.
⚠️ `index`는 **전체 평면 배열의 인덱스**이고 `totalElements`는 **첫 페이지 응답 기준 총 개수**다.
무한스크롤로 로드된 개수와 총 개수가 같아지는 마지막 항목에서만 선이 빠진다. 의도대로 동작.

## 검색 — `BoardSearchInput` (30줄)

```html
<div class="relative h-9 w-full">
  <input
    type="search"
    class="border-defaults-tertiary-border-tertiary bg-defaults-secondary-background-secondary text-defaults-primary-text-primary pretendard-16Regular placeholder:text-defaults-tertiary-text-tertiary h-9 w-full rounded-[4px] border py-2.5 pr-3 pl-[38px] outline-none"
    placeholder="검색"
    @input="handleInput"
  />
  <img
    class="absolute top-1/2 left-3 h-4 w-4 translate-y-[-50%]"
    src="/assets/icons/SearchGray.svg"
    alt="검색 아이콘"
  />
</div>
```

- **debounce 500ms** (`useDebounceFn`), `@input` 기준 (Enter 불필요)
- `type="search"`라 브라우저 기본 X 버튼이 붙는다 (웹뷰에서 노출)
- emit: `inputKeyword(value)`

## 무한스크롤

`useIntersectionObserver(target, ([{ isIntersecting }]) => targetIsVisible.value = isIntersecting)`

- `watchEffect` → §5-8의 `.value` 누락 버그 있음.

## 스크롤 위치 복원 — **B1만의 독자 구현** 🔴

다른 목록은 `useInfiniteScrollPosition`을 쓰는데 B1은 자체 구현한다.

```js
const SCROLL_STORAGE_KEY = 'notice_board_scroll';

handleNoticeBoardItem(uuid):
  sessionStorage.setItem(SCROLL_STORAGE_KEY, noticeContainer.value.scrollTop);
  navigateTo(`/board/notice/detail/${uuid}`);

onBeforeRouteLeave(to):
  if (to.meta.fromNotice)  scrollStorageKey.value = SCROLL_STORAGE_KEY;
  else { sessionStorage.removeItem(scrollStorageKey.value);
         scrollStorageKey.value = SCROLL_STORAGE_KEY; }

onUpdated():
  const saved = sessionStorage.getItem(SCROLL_STORAGE_KEY);
  if (saved) noticeContainer.value.scrollTop = parseInt(saved, 10);
```

> ⚠️ **`scrollStorageKey` ref는 죽은 코드다.** 두 분기 모두 같은 값을 대입하므로
> 값이 바뀌지 않는다. `sessionStorage.removeItem(scrollStorageKey.value)`는 항상
> `notice_board_scroll`을 지운다. → `deferred.md` 「죽은 코드」
>
> ⚠️ **`to.meta.fromNotice`가 존재 이유다.** B2 라우트에만 `fromNotice: true`가 있고
> (`routes.md` meta 어휘 참조) **다른 어떤 라우트에도 없다.** 즉 "상세로 나가면 위치 보존,
> 그 외로 나가면 삭제".
>
> ⚠️ **`onUpdated`에서 복원한다.** 마운트가 아니라 **매 갱신마다** `scrollTop`을 덮어쓴다.
> 무한스크롤로 다음 페이지가 로드될 때마다 저장된 위치로 튄다.
> `sessionStorage`에 값이 남아 있는 동안 계속 발생한다. → `deferred.md` 「동작 의심」.
> **이관 시 그대로 재현** — React에선 `useEffect`(deps 없음)가 대응된다.

> **타깃 이관 판단**: B1의 자체 구현과 나머지의 `useInfiniteScrollPosition`을 **통합하지 않는다.**
> 동작이 실제로 다르다(§5-2 저장 키 공유 vs 전용 키, `onUpdated` vs 마운트 1회).
> Phase 5 레시피에서 두 패턴을 각각 정의한다.

## 상태·엣지케이스

| 상황                 | 동작                                                                          |
| -------------------- | ----------------------------------------------------------------------------- |
| 카테고리 로딩 중     | `TabCategory` 미렌더 (`v-if="!isNoticeCategoryListLoading"`)                  |
| 목록 로딩 중         | `SpinnerDots` (전체 화면 오버레이, `fixed z-[9999]`)                          |
| 목록 0건             | `TextEmpty` — **`공지사항이 존재하지 않습니다.`**                             |
| 검색 결과 0건        | 동일 (별도 문구 없음)                                                         |
| 카테고리 `전체` 선택 | `setAdditionalParams({ categoryUuid: undefined })`                            |
| 언마운트             | `additionalParams = {}` + `removeQueries(['noticeList'])` ← **B1만 정리한다** |

## QA 체크리스트

- [ ] 검색어 입력 후 500ms 뒤 목록 갱신
- [ ] 카테고리 → 검색 순서와 검색 → 카테고리 순서가 같은 결과를 내는가 (BD-Q5)
- [ ] `IMPORTANT` 공지에 빨간 `필독` 칩
- [ ] 마지막 항목에만 구분선 없음
- [ ] 상세 진입 → 뒤로가기 시 스크롤 위치 복원
- [ ] **마이페이지 → 공지사항 → 상세 → 뒤로 → 마이페이지 → 공지사항** 시 위치가 **초기화**되는가
- [ ] 무한스크롤 중 화면이 저장 위치로 튀는지 (레거시와 동일해야 함)
- [ ] 영문 제목이 소문자로 보이는가 (§5-4, 레거시와 동일해야 함)

---

# B2. 공지사항 상세 — `/board/notice/detail/:noticeUuid`

`NoticeBoard/NoticeDetailView.vue` (144줄) · meta `fromNotice: true`

## 화면 구성

```
┌─────────────────────────────┐
│ ← 공지사항 상세               │
├─────────────────────────────┤
│ [공지]  조회 128   2026.07.29│  header, border-b
│ 여름철 단수 안내              │  h2, pretendard-18Bold
├─────────────────────────────┤
│ 📎 첨부파일                   │  FileAttachment (fileList 반복)
│    안내문.pdf            ⤓   │
│                             │
│ (Quill Delta → HTML 본문)    │  ql-snow > ql-editor
│                             │
└─────────────────────────────┘
```

| 요소       | 클래스 (원문)                                                                                                         |
| ---------- | --------------------------------------------------------------------------------------------------------------------- |
| 루트       | `h-full`                                                                                                              |
| 스크롤     | `h-full w-full space-y-5 overflow-auto p-5`                                                                           |
| header     | `flex w-full flex-col items-start gap-3 self-stretch border-b border-b-defaults-tertiary-border-tertiary pb-5`        |
| 상단 줄    | `flex items-center justify-between self-stretch`                                                                      |
| 카테고리   | `<ChipBase color="deepPurple" variant="fill">{categoryName}</ChipBase>`                                               |
| 조회       | `flex items-center gap-1.5 text-defaults-secondary-text-secondary pretendard-13Regular` → `조회` `{viewCount \|\| 0}` |
| 날짜       | `text-defaults-tertiary-text-tertiary pretendard-14Regular`                                                           |
| 제목       | `<h2 v-dompurify-html="htmlTitle" class="text-defaults-primary-text-primary pretendard-18Bold">`                      |
| 본문 래퍼  | `<div class="ql-snow">` > `<div class="content ql-editor w-full text-left pretendard-15Regular">`                     |
| `.content` | `<style scoped>` — `padding: 0 !important`                                                                            |

**API**: `endpoints.md` #27 `getNoticeDetail` — `['noticeDetail', aptUuid, noticeUuid]`
`enabled: computed(() => !!noticeUuid.value)`

## 본문·제목 변환

```js
watch(
  noticeDetail,
  (d) => {
    if (d) {
      htmlContent.value = convertDeltaToHtml(d?.content) || '정보없음'
      htmlTitle.value = convertDeltaToHtml(d?.title) || '정보없음'
    }
  },
  { immediate: true },
)
```

**제목도 Quill Delta다.** (B4는 제목이 평문 — §B4 참조)
`convertDeltaToHtml`은 `quill-delta-to-html` 기반 (`tech-mapping.md` 3-1).
`@/styles/vue-quill.snow.css`(937줄)를 컴포넌트에서 직접 import한다.

> ⚠️ 값이 없으면 **`정보없음`** (띄어쓰기 없음). 그대로.

## 본문 클릭 위임 — 이미지 뷰어 & 외부 링크

```js
handleContentClick(e):
  if (e.target.tagName === 'IMG') { selectedImageUrl = e.target.src; open viewer; return; }
  const anchor = e.target.closest('a');
  if (anchor?.href) {
    e.preventDefault();
    isNativeApp() ? nativeOpenSystemBrowser({ targetUrl: anchor.href })
                  : window.open(anchor.href, '_blank');
  }
```

- `watch(htmlContent)` → `await nextTick()` → `contentRef.addEventListener('click', ...)`
- `onUnmounted` → `removeEventListener`

> 🔴 **`htmlContent`가 바뀔 때마다 리스너를 중복 등록한다.** 제거 없이 매번 `addEventListener`.
> 같은 함수 참조라 브라우저가 중복 등록을 무시하므로 실제 피해는 없다. 그대로 이관.
>
> **네이티브 연동**: `nativeOpenSystemBrowser` — `native-protocol.md` Web→App 참조.
> 웹뷰에서 외부 링크를 시스템 브라우저로 연다. **이 도메인의 유일한 브릿지 호출이다.**

## 첨부파일

```html
<FileAttachment v-for="file in noticeDetail?.fileList" :key="file.fileUuid" :file-info="file" />
```

`FileAttachment`는 `nativeSaveFile({ fileName: decodeUrl(fileName), fileUrl: s3UrlFile+fileUrl })`을
호출한다 → `native-protocol.md`의 `SAVE_FILE`(`?filName=` 오타 포함, 앱 계약이라 유지).

**필드**: `fileUuid`, `fileName`, `fileUrl`

## 상태·엣지케이스

| 상황              | 동작                                                           |
| ----------------- | -------------------------------------------------------------- |
| 로딩 중           | header는 먼저 렌더(빈 값), `<article>` 자리에 `SpinnerDots`    |
| `noticeUuid` 없음 | 쿼리 `enabled: false` — 무한 로딩 아님, 빈 화면                |
| 본문 내 이미지    | 클릭 시 `ModalImageViewer` (원본 `src` 그대로, s3 접두사 없음) |
| 본문 내 링크      | 네이티브면 시스템 브라우저, 웹이면 새 탭                       |
| 첨부 0건          | `v-for`가 0회 — 영역 자체가 없음                               |

> ⚠️ **`onMounted`에서 `noticeUuid.value = getParams().noticeUuid`를 채운다.**
> 초기 렌더는 쿼리가 disabled 상태로 시작한다. React에선 `useParams()`가 즉시 값을 주므로
> **첫 렌더부터 쿼리가 켜진다** — 로딩 스피너 노출 타이밍이 미세하게 달라진다.
> 등가 이관 관점에서 허용 범위로 본다(더 빨라질 뿐). → Phase 5 레시피에 명문화

## QA 체크리스트

- [ ] Quill 본문 서식(볼드·리스트·이미지·표)이 레거시와 동일하게 렌더
- [ ] `vue-quill.snow.css` 이식 후 여백/폰트 동일 (`.content { padding: 0 !important }` 포함)
- [ ] 본문 이미지 클릭 → 이미지 뷰어
- [ ] 본문 링크 클릭 → **실기기에서** 시스템 브라우저 (웹뷰 내 이동 아님)
- [ ] 첨부파일 클릭 → 앱 저장 동작
- [ ] 제목·본문이 비었을 때 `정보없음`

---

# B3. 아파트먼트 공지사항 목록 — `/board/global-notice`

`GlobalNoticeBoard/GlobalNoticeBoardView.vue` (40줄) + `GlobalNoticePostList.vue` (76줄)

**B1과 달리 카테고리 탭이 없다.** 검색만 있다.

## 화면 구성

```
┌─────────────────────────────┐
│ ← 아파트먼트 공지사항          │
├─────────────────────────────┤
│ ┌─────────────────────────┐ │
│ │ 🔍 검색                  │ │  p-5
│ └─────────────────────────┘ │
├─────────────────────────────┤
│ ┌─────────────────────────┐ │  카드형 (B1은 리스트형)
│ │ [공지] 2026.07.29        │ │  GlobalNoticeBoardItem
│ │ 서비스 점검 안내          │ │  rounded-xl shadow
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │  space-y-2.5
│ │ …                        │ │
└─────────────────────────────┘
```

| 요소      | 클래스 (원문)                                                                                |
| --------- | -------------------------------------------------------------------------------------------- |
| 루트      | `h-full w-full pb-16`                                                                        |
| 검색 영역 | `p-5`                                                                                        |
| 목록 래퍼 | `h-full w-full`                                                                              |
| `<ul>`    | `h-full w-full items-start space-y-2.5 overflow-auto px-5 pb-5` — `ref="scrollContainerRef"` |
| 센티널    | `w-full pt-4`                                                                                |
| 빈 상태   | `flex h-full items-center justify-center` + `TextEmpty`                                      |

## 목록 아이템 — `GlobalNoticeBoardItem` (69줄)

| 요소        | 클래스 / 값                                                                                                                                        |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `<li>`      | `flex h-fit items-center justify-center gap-5 self-stretch rounded-xl bg-base-b-white px-4 py-[14px] shadow-[2px_2px_8px_0px_rgba(19,30,59,0.12)]` |
| 내부        | `flex h-full w-full flex-col justify-center gap-3 self-stretch overflow-hidden whitespace-nowrap`                                                  |
| 칩 줄       | `flex w-full items-center gap-1 self-stretch` > `flex h-full w-full items-center gap-2.5`                                                          |
| 카테고리 칩 | `<ChipBase color="deepPurple" variant="fill">{categoryName}</ChipBase>`                                                                            |
| 날짜        | `text-defaults-tertiary-text-tertiary pretendard-13Regular`                                                                                        |
| 제목        | `h-[150%] overflow-hidden text-ellipsis text-defaults-primary-text-primary pretendard-16SemiBold`                                                  |
| 하이라이트  | `text-brand-default-text-brand`                                                                                                                    |

> ⚠️ **주석에 `<!-- 필독 칩 & 생성날짜 -->`라고 적혀 있지만 필독 칩은 없다.**
> `NoticeBoardItem`에서 복사하며 남은 주석. → 이관 시 주석 정리(표시 영향 없음)
>
> ⚠️ **`BoardPostListItem`과 카드 스타일이 완전히 동일하다**(`rounded-xl` · 같은 shadow).
> 차이는 조회수/좋아요/댓글 줄과 썸네일이 없다는 것.
>
> ⚠️ B1과 달리 **조회수가 없다.** 서버 응답에 `viewCount`가 있어도 표시하지 않는다.

## 데이터

**API**: `endpoints.md` #29 `getGlobalNoticeList` — 쿼리 `page`, `size`(=10), `keyword`
쿼리 키 `['globalNoticeList', aptResidentUuid, ...Object.values({keyword})]`

카테고리 필터가 없으므로 `additionalParams`는 `keyword` 하나뿐 → §BD-Q5 순서 문제 해당 없음.

## 스크롤 복원

`useInfiniteScrollPosition({ moveFrom: '/detail', moveTo: '/board/global-notice' })`
→ §3-2. **`scrollRestoration` 키를 B5·B12와 공유한다.**

## 상태·엣지케이스

| 상황     | 동작                                                                                                   |
| -------- | ------------------------------------------------------------------------------------------------------ |
| 로딩 중  | `GlobalNoticePostList` 자체가 미렌더 (`v-if="!isGlobalNoticeListLoading"`) → **화면이 빈 상태로 보임** |
| 목록 0건 | `TextEmpty` — **`전체 공지사항이 존재하지 않습니다.`**                                                 |

> ⚠️ **로딩 중 스피너가 안 보인다.** `GlobalNoticePostList` 내부에 `SpinnerDots v-if="isLoading"`가
> 있지만, 부모가 로딩 중엔 컴포넌트 자체를 렌더하지 않는다. **중첩 조건이 서로를 무효화한다.**
> 결과: 로딩 중 검색창만 있는 빈 화면. → `deferred.md` 「동작 의심」. **이관 시 그대로**

## QA 체크리스트

- [ ] 로딩 중 스피너가 **안 보이는지** (레거시와 동일해야 함)
- [ ] 검색 debounce 500ms
- [ ] 카드 그림자·모서리가 B5 게시글 카드와 동일
- [ ] 상세 → 뒤로 시 스크롤 복원
- [ ] **B5 목록 → 상세 → 뒤로 → B3 진입** 시 위치가 섞이는지 (§3-2 키 공유, 레거시와 동일해야 함)

---

# B4. 아파트먼트 공지사항 상세 — `/board/global-notice/detail/:globalNoticeUuid`

`GlobalNoticeBoard/GlobalNoticeDetailView.vue` (81줄)

**B2와 유사하나 4가지가 다르다.**

| 항목           | B2 (공지사항 상세)                               | B4 (아파트먼트 공지 상세)                            |
| -------------- | ------------------------------------------------ | ---------------------------------------------------- |
| 제목 변환      | `convertDeltaToHtml(title)` + `v-dompurify-html` | **평문** — `{{ htmlTitle }}` 보간                    |
| 첨부 필드      | `fileList` / `file.fileUuid` / `file.fileUrl`    | **`uploadFileList`** / `file.uuid` / `file.filePath` |
| 첨부 전달      | `:file-info="file"`                              | `:file-info="{ ...file, fileUrl: file.filePath }"`   |
| 본문 클릭 위임 | 있음 (이미지 뷰어 + 외부 링크)                   | **없음**                                             |
| `ql-snow` 래퍼 | 있음                                             | **없음** (`ql-editor`만)                             |
| 조회수 표시    | 있음                                             | **없음**                                             |

## 화면 구성

| 요소       | 클래스 (원문)                                                                                                  |
| ---------- | -------------------------------------------------------------------------------------------------------------- |
| 루트       | `h-full w-full space-y-5 overflow-auto p-5` (B2는 바깥에 `h-full` 한 겹 더)                                    |
| header     | `flex w-full flex-col items-start gap-3 self-stretch border-b border-b-defaults-tertiary-border-tertiary pb-5` |
| 상단 줄    | `flex items-center justify-between self-stretch` — 좌측 `flex gap-2`(칩만), 우측 날짜                          |
| 카테고리   | `<ChipBase color="deepPurple" variant="fill">{categoryName}</ChipBase>`                                        |
| 날짜       | `text-defaults-tertiary-text-tertiary pretendard-14Regular`                                                    |
| 제목       | `<h2 class="text-defaults-primary-text-primary pretendard-18Bold">{{ htmlTitle }}</h2>`                        |
| 본문       | `<div v-dompurify-html="htmlContent" class="content ql-editor w-full text-left pretendard-15Regular">`         |
| `.content` | `<style scoped>` — `padding: 0 !important`                                                                     |

**API**: `endpoints.md` #30 `getGlobalNoticeDetail`
쿼리 키 `['globalNoticeDetail', aptResidentUuid, globalNoticeUuid]` · `enabled: !!globalNoticeUuid.value`

## 변환

```js
htmlContent.value = convertDeltaToHtml(d?.content) || '정보없음'
htmlTitle.value = d?.title || '정보없음' // ← Delta 변환 없음
```

> ⚠️ **본문에 `ql-snow` 래퍼가 없다.** `vue-quill.snow.css`의 규칙 상당수가
> `.ql-snow .ql-editor ...` 형태라면 **B4 본문에는 적용되지 않는다.**
> B2와 본문 서식이 달라 보일 수 있다. → `[확인 필요]` BD-Q6 (실제 CSS 셀렉터 확인 필요)
>
> ⚠️ **본문 이미지·링크 클릭이 동작하지 않는다.** B2에만 위임 핸들러가 있다.
> 아파트먼트 공지 본문의 이미지는 확대되지 않고 링크는 웹뷰 안에서 열린다(또는 막힌다).
> → `deferred.md` 「동작 의심」. **이관 시 그대로**

## 상태·엣지케이스

| 상황                  | 동작                                               |
| --------------------- | -------------------------------------------------- |
| 로딩 중               | header 먼저 렌더, `<article>` 자리에 `SpinnerDots` |
| 첨부 0건              | 영역 없음                                          |
| `uploadFileList` 부재 | `v-for`가 `undefined` 순회 → 0회. 에러 없음        |

## QA 체크리스트

- [ ] 제목에 HTML 태그가 들어오면 **그대로 문자로 보이는지** (평문 보간이므로)
- [ ] 첨부파일 다운로드 (`filePath` → `fileUrl` 매핑 확인)
- [ ] 본문 이미지 클릭이 **동작하지 않는지** (레거시와 동일해야 함)
- [ ] B2와 본문 서식 차이 (BD-Q6)

---

# B21. 공지 팝업 — `NoticePopupModal` (라우트 없음)

`NoticeBoard/NoticePopupModal.vue` (112줄) · **`MainView.vue:100`에서 렌더**

메인 화면 진입 시 조건이 맞으면 자동으로 뜨는 4:5 이미지 팝업.
`main.md`에서 참조만 하고 상세는 여기에 둔다.

## 노출 조건 (셋 다 참일 때)

1. `isModalOpen` — `noticePopupThumbnail?.uuid`가 도착하면 `watch`가 `true`로
2. `noticePopupThumbnail?.uuid` 존재
3. `!isHideForToday` — 쿠키 `noticePopupHideToday !== 'true'`

**API**: `endpoints.md` #28 `getNoticePopupThumbnail`
— `/board/resident/notice/{aptUuid}/top1-thumbnail`
**썸네일을 보유하고 생성 7일 이내인 최신 공지 1건.** 대상이 없으면 빈 객체 `{}` 반환 → `uuid` 부재 → 미노출.

쿼리 키 `['noticePopupThumbnail', aptUuid]` (aptUuid는 `computed`)

## 화면 구성

```
      ┌───────────────────┐
      │                   │
      │   4:5 썸네일       │  ← 클릭 시 공지 상세로
      │   object-fill      │
      │                   │
      ├─────────┬─────────┤
      │오늘 하루 │  닫기    │  h-12, 각 flex-1
      │보지 않기 │          │
      └─────────┴─────────┘
```

| 요소                | 클래스 (원문)                                                                                                                |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| 컨테이너            | `flex w-[80vw] max-w-[320px] flex-col` (`ModalBase` 안)                                                                      |
| 이미지 버튼         | `aspect-[4/5] w-full overflow-hidden rounded-t-md`                                                                           |
| 이미지              | `h-full w-full object-fill` — `src = ${s3UrlFile}${thumbnailFilePath}`, `alt = title`                                        |
| 하단 바             | `flex w-full`                                                                                                                |
| 오늘 하루 보지 않기 | `h-12 flex-1 whitespace-nowrap rounded-bl-md bg-defaults-secondary-background-secondary px-2 pretendard-14SemiBold`          |
| 닫기                | `h-12 flex-1 whitespace-nowrap rounded-br-md bg-brand-default-background-brand px-2 text-base-b-white pretendard-14SemiBold` |

> ⚠️ **`object-fill`이다** (`object-cover`가 아니다). 원본 비율이 4:5가 아니면 **이미지가 왜곡된다.**
> 소스 주석에도 명시돼 있다: "잘림은 없지만 원본 비율이 다르면 왜곡된다". **의도적. 그대로 이관.**

## 쿠키 처리

```js
setCookie(name, value):
  const date = new Date();
  const endOfDay = new Date(y, m, d, 23, 59, 59, 999);
  document.cookie = `${name}=${value};expires=${endOfDay.toUTCString()};path=/`;

getCookie(name):
  document.cookie.match(`(^|;) ?${name}=([^;]*)(;|$)`)?.[2] ?? null;
```

- 쿠키명 **`noticePopupHideToday`** — 소스 주석: "투표 팝업과 충돌 방지 위해 전용 키"
- 만료: **로컬 시각 기준 자정** (`toUTCString()`으로 변환)
- `handleHideForToday`는 쿠키 저장 + `isHideForToday.value = true` (같은 세션 즉시 반영) + 닫기

> ⚠️ **`isHideForToday`는 setup 시점에 1회만 읽는다.** 다른 탭/화면에서 쿠키가 바뀌어도 반영 안 됨.
> 웹뷰 단일 화면이라 문제없음.
>
> ⚠️ **웹뷰에서 쿠키를 쓰는 유일한 지점이다.** `auth-strategy.md`에서 "쿠키 안 씀"으로
> 결론냈지만 그것은 **인증 토큰** 얘기다. 이 팝업 억제 플래그는 쿠키를 쓴다.
> **웹뷰가 쿠키를 유지하지 못하면 팝업이 매번 뜬다.** 실기기 확인 항목.
> → `[확인 필요]` BD-Q7

## 동작

| 액션                  | 결과                                                                                  |
| --------------------- | ------------------------------------------------------------------------------------- |
| 썸네일 클릭           | `navigateTo('/board/notice/detail/{uuid}')` + `closeModal()`                          |
| `오늘 하루 보지 않기` | 쿠키 저장(자정 만료) + 닫기                                                           |
| `닫기`                | `isModalOpen = false` (쿠키 안 씀 → 다음 메인 진입 시 다시 뜸)                        |
| `ModalBase` 배경 클릭 | `ModalBase`의 `@close` — **이 컴포넌트는 `@close`를 바인딩하지 않는다** → 닫히지 않음 |

> ⚠️ **배경(딤) 클릭으로 닫을 수 없다.** `ModalBase`에 `@close` 핸들러를 안 붙였다.
> 다른 모달(`ModalButton` 등)은 붙인다. **비대칭이지만 의도일 수 있다**(팝업 강제 노출).
> → `deferred.md` 「동작 의심」. **이관 시 그대로**

## QA 체크리스트

- [ ] 썸네일 있는 7일 이내 공지가 있을 때만 노출
- [ ] `오늘 하루 보지 않기` → 앱 재실행해도 자정까지 미노출 (**실기기 웹뷰**, BD-Q7)
- [ ] `닫기` → 메인 재진입 시 다시 노출
- [ ] 배경 클릭으로 **안 닫히는지**
- [ ] 4:5가 아닌 원본 이미지가 **왜곡되어 보이는지** (레거시와 동일해야 함)
- [ ] 투표 팝업(`vote.md`)과 동시 노출 시 겹침 순서

---

# B5. 소통공간 게시판 — `/board/community`

`Community/CommunityBoardView.vue` (80줄) · `showAppBar:false` · **eager import**

## 화면 구성

```
┌─────────────────────────────┐
│ ←        소통공간        👤 │  화면 내 <AppBar>, 우측 슬롯 = 내 활동
├─────────────────────────────┤
│ ┌─────────────────────────┐ │
│ │ 🔍 검색                  │ │  p-5
│ └─────────────────────────┘ │
│ (전체)(자유)(정보)(나눔) …    │  TabCategory  has-total-type  pb-6
├─────────────────────────────┤
│ ┌─────────────────────────┐ │
│ │ 자유    3시간 전    [🖼] │ │  BoardPostListItem
│ │ 🔒 오늘 날씨 좋네요       │ │  (카드, space-y-2.5)
│ │ 👁12  👍3  💬5          │ │
│ └─────────────────────────┘ │
│                        ✏️   │  WriteButton (fixed bottom-20 right-7)
└─────────────────────────────┘
```

| 요소             | 클래스 (원문)                                               |
| ---------------- | ----------------------------------------------------------- |
| 루트             | `h-full w-full`                                             |
| 본문 래퍼        | `h-[calc(100%-124px)] w-full pt-12` ← AppBar 높이 48px 보정 |
| 검색 영역        | `w-full p-5`                                                |
| 탭 영역          | `w-full`, `TabCategory class="pb-6"`                        |
| AppBar 우측 버튼 | `h-6 w-6` > `/assets/icons/Human.svg` alt `사람 아이콘`     |

**AppBar**: `<AppBar title="소통공간">` — 우측 슬롯에 사람 아이콘, 클릭 시
`navigateTo('/board/community/activities')`

## 데이터

| 항목     | 훅                            | 쿼리 키                                                            |
| -------- | ----------------------------- | ------------------------------------------------------------------ |
| 카테고리 | `useGetCommunityCategoryList` | `['communityCategoryList', aptResidentUuid]`                       |
| 목록     | `useGetCommunityPostList`     | `['communityPostList', aptResidentUuid, ...Object.values(params)]` |

**API**: `endpoints.md` #33 `getCommunityCategoryList`(`/category`), #34 `getCommunityPostList`
쿼리 파라미터 `page`, `size`(=10), `keyword`, `categoryUuid`

`setAdditionalParams`가 바뀌면 `watch` → `invalidateQueries(['communityPostList'])` (**v4 시그니처**, §5-3)

> ⚠️ **B1과 달리 `onBeforeUnmount` 정리가 없다.** 화면을 떠나도 `additionalParams`와 캐시가
> 남는다. 다시 들어오면 **직전 검색어/카테고리가 적용된 상태로 시작**한다... 처럼 보이지만
> `additionalParamsRef`는 훅 인스턴스 로컬 `ref`라 재마운트 시 `{}`로 초기화된다.
> **캐시만 남고 필터는 초기화된다** → 첫 프레임에 이전 결과가 잠깐 보일 수 있다.
> `staleTime: 0`이라 즉시 refetch. 그대로 이관.

## 게시글 카드 — `BoardPostListItem` (139줄)

`boardType`: `'community' | 'complaints' | 'topThree'` (validator로 강제)
**`topThree`는 메인 화면(`main.md`)에서 쓴다.** 게시판에서는 앞의 둘만.

| 요소           | 클래스 (원문)                                                                                                                                                                     |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `<li>`         | `flex h-fit items-center justify-center gap-5 self-stretch rounded-xl bg-base-b-white px-4 py-[14px] shadow-[2px_2px_8px_0px_rgba(19,30,59,0.12)]`                                |
| 좌측 컬럼      | `flex h-full w-full flex-col justify-center gap-3 self-stretch overflow-hidden whitespace-nowrap`                                                                                 |
| 1행 (카테고리) | `flex w-full items-center gap-1 self-stretch`                                                                                                                                     |
| 상태 칩        | `boardType === 'complaints' && postItemData.status`일 때만 → **B5에선 안 보임**                                                                                                   |
| 카테고리명     | `text-defaults-secondary-text-secondary pretendard-14SemiBold`                                                                                                                    |
| 시간           | `text-defaults-tertiary-text-tertiary pretendard-13Regular` — `useKoreanTimeAgo(createdDate)`                                                                                     |
| 2행 (제목)     | `flex h-full w-full justify-between` > `flex gap-1`                                                                                                                               |
| 자물쇠         | `privateFlag`일 때 `/assets/icons/Lock.svg` alt `자물쇠 아이콘` `h-[20px] w-[20px]` — **B5에선 서버가 안 내려줌**                                                                 |
| 제목           | `h-[150%] overflow-hidden text-ellipsis text-defaults-primary-text-primary pretendard-16SemiBold` + `privateFlag`면 `pt-0.5` 추가                                                 |
| 하이라이트     | `text-brand-default-text-brand`                                                                                                                                                   |
| 3행 (지표)     | `flex items-center gap-1.5 self-stretch` — `boardType !== 'topThree'`일 때만                                                                                                      |
| 조회           | `Eye.svg` alt `조회 아이콘` + `{viewCount}` — `flex items-center gap-[3px] text-defaults-tertiary-text-tertiary pretendard-12Regular`                                             |
| 좋아요         | `ThumbsUpGray.svg` alt `좋아요 아이콘` + `{likeCount}`                                                                                                                            |
| 댓글           | `MessageSquare.svg` alt `댓글 아이콘` + `{commentCount}`                                                                                                                          |
| 썸네일         | `thumbnailFileUrl` 있을 때 `bg-bg-deep-blue flex h-16 min-h-16 w-16 min-w-16 items-center justify-center rounded-md border border-defaults-tertiary-border-tertiary object-cover` |
| 썸네일 alt     | `` `${title} 썸네일 이미지` ``                                                                                                                                                    |

**아이콘 크기 전부 `h-[13px] w-[13px]`**

> ⚠️ **`bg-bg-deep-blue`는 CSS를 생성하지 않는다** (2차 스타일 조사에서 확정 —
> `broken-styles.md` §4). `<img>`에 붙은 배경색이라 이미지가 로드되면 보이지도 않는다.
> **이관 시 삭제한다.** 렌더 결과는 동일하다.
>
> ⚠️ **썸네일에 `object-cover`와 `items-center justify-center`가 함께 있다.** `<img>`에
> flex 정렬은 의미 없다. 무해. 그대로.

## 목록 컨테이너 — `BoardPostList` (87줄)

| 요소    | 클래스 (원문)                                                                           |
| ------- | --------------------------------------------------------------------------------------- |
| 루트    | `h-full w-full`                                                                         |
| `<ul>`  | `h-[calc(100%-36px)] w-full space-y-2.5 overflow-auto p-5` — `ref="scrollContainerRef"` |
| 센티널  | `w-full` (B1·B3의 `pt-4` 없음)                                                          |
| 빈 상태 | `flex h-full items-center justify-center` + `TextEmpty`                                 |

**아이템 key**: `boardType === 'community' ? post.communityUuid : post.complaintUuid`
**클릭**: `navigateTo('/board/{boardType}/detail/{uuid}')`

**스크롤 복원**: `useInfiniteScrollPosition({ moveFrom:'/detail', moveTo:['/board/community','/board/complaints'] })`

> ⚠️ **`h-[calc(100%-36px)]`의 36px 근거가 코드에 없다.** B11·B18(내 활동)에서는 위에
> `TabBase`(h-12=48px)가 있어 값이 안 맞는다. 그대로 이관.

## 작성 버튼 — `WriteButton` (8줄)

```html
<button
  type="button"
  class="fixed right-7 bottom-20 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-t from-[#3763d1] to-[#0037BE] p-3 shadow-md"
>
  <img src="/assets/icons/Pencil.svg" alt="작성 아이콘" />
</button>
```

`@click`은 부모(`CommunityBoardView`)가 fallthrough로 붙인다 → `/board/community/write`
`bg-gradient-to-t`는 **Tailwind 내장 유틸이며 정상 생성된다** (`broken-styles.md` 검증 완료).

## 상태·엣지케이스

| 상황               | 동작                                                               |
| ------------------ | ------------------------------------------------------------------ |
| 카테고리 로딩 중   | `TabCategory` 미렌더                                               |
| 목록 로딩 중       | `BoardPostList` 자체 미렌더 → **스피너 안 보임** (§B3와 동일 구조) |
| 목록 0건           | `TextEmpty` — **`게시글이 존재하지 않습니다`** (마침표 없음)       |
| 차단한 사용자의 글 | 서버가 목록에서 제외 (B19 참조)                                    |

## QA 체크리스트

- [ ] AppBar 우측 사람 아이콘 → 내 활동
- [ ] 카테고리 `전체` 선택 시 전체 목록
- [ ] 검색 debounce 500ms
- [ ] 썸네일 있는 글에만 우측 이미지
- [ ] 로딩 중 스피너가 **안 보이는지**
- [ ] 상세 → 뒤로 시 스크롤 복원
- [ ] 작성 버튼이 하단 네비 위(`bottom-20`)에 뜨는지

---

# B6. 소통공간 상세 — `/board/community/detail/:postUuid`

`Community/CommunityDetailView.vue` (91줄) · `showAppBar:false`

## 화면 구성

```
┌─────────────────────────────┐
│ ←     소통공간 상세      ⋮  │  화면 내 <AppBar>, 우측 = DetailPostMoreButton
├─────────────────────────────┤
│ 자유                        │  DetailPostInfo
│ 오늘 날씨 좋네요             │
│ ─────────────────────────── │
│ 👤 홍길동                    │
│    3시간 전 │ 조회 12       │
│ ─────────────────────────── │
│ 본문 텍스트…                 │  DetailPostContent
│ [첨부 이미지]                │
│ [👍 좋아요 3]                │  DetailPostLikeButton
╞═════════════════════════════╡  border-b-8
│ 💬 댓글 5                    │  DetailComment
│ 👤 김철수                    │  CommentListItem
│    댓글 내용                 │
│    1시간 전 │ 답글      ⋯   │
│   ↳ 👤 이영희               │  대댓글 (is-reply-comment)
├─────────────────────────────┤
│ [🖼] [댓글을 입력해 주세요] [입력] │  CommentInput (fixed bottom-0)
└─────────────────────────────┘
```

| 요소   | 클래스 (원문)                                     |
| ------ | ------------------------------------------------- |
| 루트   | `h-full`                                          |
| 내부   | `h-full` (`v-if="!isCommunityPostDetailLoading"`) |
| 스크롤 | **`h-full w-full space-y-2 overflow-auto`**       |

> ⚠️ **`space-y-2`는 소통공간에만 있다.** 민원공간(B13)에는 없다 → §4 #9

## 데이터

| 항목   | 훅                           | 쿼리 키                                                                |
| ------ | ---------------------------- | ---------------------------------------------------------------------- |
| 게시글 | `useGetCommunityPostDetail`  | `['communityPostDetail', aptResidentUuid]` 🔴 **postUuid 없음** (§5-1) |
| 댓글   | `useGetCommunityCommentList` | `['communityCommentList', aptResidentUuid, undefined]` 🔴 (§5-2)       |

**API**: #35 `getCommunityPostDetail`, #38 `getCommunityCommentList`,
#36 `patchCommunityPostLike`, #37 `deleteCommunityPost`, #40 `postCommunityComment`

**`select`에서 `fileList.sort((a,b) => a.orderNum - b.orderNum)`** — 첨부 순서 보장.
**`enabled: validateQueryEnabledParams(getParams().postUuid)`**

## 게시글 정보 — `DetailPostInfo` (62줄)

| 요소        | 클래스 / 값                                                                                                                                                  |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 루트        | `flex flex-col items-start gap-[13px] self-stretch`                                                                                                          |
| 상단        | `flex flex-col items-start justify-center gap-2 self-stretch`                                                                                                |
| 카테고리 줄 | `flex h-5 items-center gap-2 text-defaults-secondary-text-secondary pretendard-14SemiBold`                                                                   |
| 카테고리    | `{{ postData?.categoryName \|\| '카테고리 없음' }}`                                                                                                          |
| 상태 칩     | `v-if="postData.status"` → `BoardPostStatusChip` — **소통공간은 `status`가 없어 안 보임**                                                                    |
| 제목        | `<span v-dompurify-html="formatHtmlText(postData?.title \|\| '제목 없음')" class="w-full break-words text-defaults-primary-text-primary pretendard-18Bold">` |
| 작성자 영역 | `flex w-full items-center gap-1.5 border-b border-b-defaults-tertiary-border-tertiary pb-[18px]`                                                             |
| 아바타 래퍼 | `flex h-[30px] w-[30px] items-center justify-center overflow-hidden rounded-full border border-defaults-tertiary-border-tertiary`                            |
| 아바타      | `/assets/images/Profile.svg` alt **`프로필 이미지 `** (끝 공백) `h-[30px] w-[30px]`                                                                          |
| 이름        | `formatHtmlText(authorText?.replaceAll(',', '')) \|\| '이름 없음'` — `font-semibold text-defaults-primary-text-primary`                                      |
| 메타 줄     | `flex items-center gap-1.5 font-normal text-defaults-secondary-text-secondary`                                                                               |
| 시간        | `border-r border-r-defaults-tertiary-border-tertiary pr-1.5` — `koreanTimeAgo \|\| '시간 없음'`                                                              |
| 조회        | `조회` + `{{ postData?.viewCount \|\| 0 }}`                                                                                                                  |
| 메타 폰트   | 래퍼에 `pretendard-13Regular`                                                                                                                                |

> ⚠️ **`authorText`는 쉼표 구분 문자열이다.** `replaceAll(',', '')`로 **모든 쉼표를 제거**해 표시한다.
> `DetailPostMoreButton`은 같은 값에 `.split(',')[0]`을 써 **첫 조각만** 쓴다.
> 예: `홍길동,101동` → 표시 `홍길동101동`, 차단 모달 제목 `홍길동`. **표시가 붙어 나온다.**
> → `[확인 필요]` BD-Q9 (`authorText` 실제 형식 확인 필요)

## 본문·첨부 — `DetailPostContent` (51줄)

| 요소        | 클래스 (원문)                                                                                                                                         |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| 본문        | `<div v-dompurify-html="formatHtmlText(postData?.content \|\| '')" class="mb-3 break-words text-defaults-primary-text-primary pretendard-15Regular">` |
| 이미지 목록 | `flex flex-col gap-2`                                                                                                                                 |
| 버튼        | `block w-full`                                                                                                                                        |
| 이미지      | `w-full rounded-md border border-defaults-secondary-border-secondary`                                                                                 |
| alt         | `` `${file?.title} 이미지` `` ← ⚠️ `file.title`은 응답에 없을 가능성                                                                                  |

**클릭** → `ModalImageViewer` (`imageUrl = ${s3UrlFile}${file.fileUrl}`)

> ⚠️ **본문은 Quill Delta가 아니라 평문이다.** `formatHtmlText`로 `\n` → `<br/>`만 한다.
> B2·B4(공지)와 렌더 경로가 완전히 다르다.
>
> ⚠️ **`file?.title`이 `undefined`면 alt가 `undefined 이미지`가 된다.** → `[확인 필요]` BD-Q10

## 좋아요 버튼 — `DetailPostLikeButton` (80줄)

```html
<button
  type="button"
  class="border-defaults-secondary-border-secondary text-defaults-primary-text-primary pretendard-14Regular flex w-fit items-center gap-[3px] rounded-[5px] border px-2.5 py-2"
  @click="postLikeFn"
>
  <img class="h-4 w-4" :src="thumbsUpIcon" alt="엄지 아이콘" />
  <span>{{ label }}</span>
  <!-- 소통공간: 좋아요 / 민원공간: 동의해요 -->
  <span>{{ likeState.count }}</span>
</button>
```

**아이콘**: `` `/assets/icons/ThumbsUp${isLiked ? 'Accent' : ''}.svg` ``
→ `ThumbsUpAccent.svg` / `ThumbsUp.svg`

**낙관적 카운트 로직** (소스 주석: "상세조회 api call 하지 않고, UI만 변경하려는 로직"):

```js
likeState = { count, isLiked, isInitialLiked }

// props.postData가 도착하면 (immediate watch)
likeState = { count: likeCount, isLiked: likeFlag, isInitialLiked: likeFlag }

// isSuccessPostLiked가 true가 되면
isLiked = !isLiked;
updateLikeCount():
  base = postData.likeCount
  if (isInitialLiked)  count = isLiked ? base : base - 1
  if (!isInitialLiked) count = isLiked ? base + 1 : base
```

> 🔴 **`watch(isSuccessPostLiked)`는 `false → true` 전이에서만 발화한다.**
> `useMutation`의 `isSuccess`는 **한 번 `true`가 되면 계속 `true`**다.
> **두 번째 클릭부터는 watch가 발화하지 않는다** → 아이콘도 카운트도 안 바뀐다.
> 서버에는 토글이 정상 전달되므로 **화면을 나갔다 오면 반영돼 있다.**
>
> **레거시의 실제 사용자 경험**: 좋아요는 화면당 1회만 시각적으로 반응한다.
> → `deferred.md` 「동작 의심」. **이관 시 그대로 재현해야 한다.**
> React에서 `isSuccess`를 그대로 쓰면 자연히 같은 동작이 된다(effect deps가 `true`로 고정).
> **단, `useEffect` 대신 `mutate`의 `onSuccess` 콜백으로 옮기면 매번 발화해 동작이 달라진다.**
> → Phase 5 레시피에 "성공 신호를 `isSuccess` watch로 받는 패턴" 항목으로 명문화

## 더보기 버튼 — `DetailPostMoreButton` (199줄)

`<AppBar>` 우측 슬롯. `/assets/icons/More.svg` alt `더보기 아이콘`.
**`v-if="!isPostBoardUserBlockSuccess"`** — 차단에 성공하면 버튼이 사라진다.

### 작성자 판별

```js
isPostAuthor = authStore.getAptInfo().aptResidentUuid === postData?.authorAptResidentUuid
authorName = postData?.authorText.split(',')[0] || '이름없음'
isAnonymousAuthor = authorName === '익명'
```

> ⚠️ **`postData?.authorText.split(...)`** — `?.`가 `authorText`까지만 걸려 있다.
> `authorText`가 `undefined`면 **TypeError**. `postData`가 있고 `authorText`가 없는 응답이 오면
> 화면이 깨진다. → `deferred.md` 「동작 의심」

### 드로어 — 작성자 (`isPostAuthor`)

| 항목 | 라벨   | 색                                       | 동작                                                            |
| ---- | ------ | ---------------------------------------- | --------------------------------------------------------------- |
| 수정 | `수정` | `text-defaults-secondary-text-secondary` | 소통공간: `navigateTo('/board/community/edit/{communityUuid}')` |
| 삭제 | `삭제` | `text-alerts-error-text-error`           | `DETAIL_DELETE_MODAL_DATA` 모달                                 |

`isComplaintsNonModified`(민원 전용, §B13)가 참이면 둘 다 `complaintsNonEditable` 모달로 분기.
**소통공간은 `status`가 없어 항상 거짓** → 정상 동작.

### 드로어 — 열람자 (`!isPostAuthor`)

| 항목 | 라벨                       | 색                                       | 동작                                                                |
| ---- | -------------------------- | ---------------------------------------- | ------------------------------------------------------------------- |
| 차단 | `이 사용자의 글 보지 않기` | `text-defaults-secondary-text-secondary` | `DETAIL_BLOCK_MODAL_DATA(authorName)` 모달                          |
| 신고 | `게시글 신고하기`          | `text-alerts-error-text-error`           | `navigateTo({ path: '/post/report/{uuid}', state: { boardType } })` |

**`enabled: !isAnonymousAuthor`** — 작성자명이 `익명`이면 차단 항목이 **렌더되지 않는다**
(`DrawerList`의 `v-if="item.enabled ? item.enabled : true"`).

> ⚠️ **`enabled: false`면 `item.enabled ? ... : true` → `true`가 되어 렌더된다.**
> falsy를 넘기면 오히려 보인다. **익명 작성자의 차단 항목이 숨겨지지 않는다.** 🔴
> → `deferred.md` 「동작 의심」. **이관 시 그대로**

**신고 `state.boardType`**: `getCurrentRoutePath().includes('community') ? 'community' : 'complaints'`

### 차단

```js
postBoardUserBlockMutation({
  authorUuid: postData?.authorAptResidentUuid,
  authorTextName: postData?.authorText,
})
// 훅 내부에서 authorTextName.split(',')[0] 로 잘라 전송
```

**API**: #22 `postBoardBlockUser` → 성공 시 토스트 `차단되었습니다`
`watch(isPostBoardUserBlockSuccess)` → 모달 닫기. 더보기 버튼도 사라짐.

> ⚠️ **차단해도 목록·상세가 갱신되지 않는다.** `invalidateQueries` 없음.
> 현재 보고 있는 글은 그대로 보인다. 목록으로 돌아가면 `staleTime: 0`이라 refetch되어 사라진다.

### 삭제

`deleteCommunityPostMutation()` → **API** #37 → `navigateBack()` + 토스트 `삭제되었습니다`

## 댓글 영역 — `DetailComment` (40줄)

| 요소   | 클래스 (원문)                                                                         |
| ------ | ------------------------------------------------------------------------------------- |
| 루트   | `space-y-5 bg-base-b-white p-5 pb-16`                                                 |
| 헤더   | `flex items-center gap-[3px] text-defaults-primary-text-primary pretendard-14Regular` |
| 아이콘 | `MessageSquareLine.svg` alt `말풍선 아이콘` `h-4 w-4`                                 |
| 라벨   | `댓글`                                                                                |
| 카운트 | `<span class="font-semibold">{{ commentCount \|\| 0 }}</span>`                        |

`DetailPost`(27줄)는 `article` 래퍼:
`w-full space-y-[18px] border-b-8 border-b-defaults-tertiary-border-tertiary bg-base-b-white p-5 pt-14`
→ **`border-b-8`이 게시글/댓글 구분선이다. `pt-14`는 AppBar 보정.**

## 댓글 목록 — `CommentList` (47줄) + `CommentListItem` (258줄)

```html
<template v-for="(comment, commentIndex) in commentList" :key="comment.commentUuid">
  <CommentListItem :comment="comment" :comment-index="commentIndex" />
  <CommentListItem
    v-for="reply in comment?.childCommentList"
    :key="reply?.commentUuid"
    :comment="reply"
    is-reply-comment
  />
</template>
```

**대댓글은 1단계만.** `childCommentList`를 평면으로 이어 붙인다.

| 요소    | 클래스 (원문)                                                   |
| ------- | --------------------------------------------------------------- |
| 래퍼    | `h-full w-full` + 답글 페이지면 `overflow-auto px-5 pb-16` 추가 |
| 빈 상태 | `<TextEmpty class="py-20">댓글이 없습니다.</TextEmpty>`         |

### `CommentListItem` 구조

| 요소          | 클래스 / 값                                                                                                                                                                |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `<li>`        | `flex items-start gap-1.5 self-stretch`                                                                                                                                    |
| 대댓글 화살표 | `is-reply-comment`일 때 `flex h-6 w-6 items-center justify-center pt-1.5` > `DownRightArrow.svg` alt `화살표 아이콘` `h-[18px] w-[18px]`                                   |
| 본체          | `flex w-full flex-col items-start gap-[3px] self-stretch px-0 pb-4 pt-1.5`                                                                                                 |
| 프로필 줄     | `flex items-center gap-1.5 self-stretch`                                                                                                                                   |
| 아바타        | `/assets/images/Profile.svg` alt `프로필 이미지` — `flex h-6 w-6 items-center justify-center overflow-hidden rounded-full border border-defaults-tertiary-border-tertiary` |
| 이름          | `text-defaults-primary-text-primary pretendard-14SemiBold`                                                                                                                 |
| 내용 영역     | `flex flex-col items-start gap-2 self-stretch pl-[30px]`                                                                                                                   |
| 본문          | `<p v-dompurify-html="formatHtmlText(comment?.content)" class="w-full break-words text-defaults-primary-text-primary pretendard-13Regular">`                               |
| 이미지 목록   | `flex flex-wrap items-start gap-1.5`                                                                                                                                       |
| 이미지        | `h-20 w-20 cursor-pointer rounded-lg border border-defaults-tertiary-border-tertiary object-contain` alt `댓글 이미지`                                                     |
| 시간·답글 줄  | `flex items-center gap-1.5`                                                                                                                                                |
| 시간          | `pr-1.5 text-defaults-tertiary-text-tertiary pretendard-13Regular` (+ 조건부 `border-r border-r-defaults-tertiary-border-tertiary`)                                        |
| 답글 버튼     | `text-defaults-tertiary-text-tertiary pretendard-13SemiBold` → `답글`                                                                                                      |
| 더보기 버튼   | `MoreGray.svg` alt `더보기 아이콘` `h-4 w-4`                                                                                                                               |

### 작성자 이름 표시

```js
comment?.state === 'SHOW'
  ? comment?.authorText?.replaceAll(',', '')
  : DETAIL_COMMENT_AUTHOR_STATE[comment?.state]
```

| `state`           | 표시 이름               | 본문 표시 |
| ----------------- | ----------------------- | --------- |
| `SHOW`            | `authorText`(쉼표 제거) | ✅        |
| `RESIDENT_DELETE` | `탈퇴된 회원의 댓글`    | ✅        |
| `ADMIN`           | `관리사무소`            | ✅        |
| `DELETE`          | `삭제된 댓글`           | ❌        |
| `BLOCK`           | `차단된 회원의 댓글`    | ❌        |

**본문 조건**: `(isCommentShowed || isCommentAuthorWithdrew || isCommentAdmin) && comment?.content?.trim()`
**이미지는 `state`와 무관하게** `comment?.fileList?.length`만 보고 렌더한다. 🔴
→ 삭제/차단된 댓글의 **이미지는 계속 보인다.** → `deferred.md` 「동작 의심」

### 답글 버튼 노출 조건

```
!isReplyComment && !getCurrentRoutePath().includes('comment') && !isCommentDeleted
```

- 대댓글에는 답글 버튼 없음 (1단계 제한)
- `/post/community/comment/...` 경로(B7·B8)에서는 없음
- `state === 'DELETE'`면 없음 (⚠️ `BLOCK`은 조건에 없어 **차단 댓글에는 답글 버튼이 보인다**)

**시간 우측 구분선**은 답글 버튼이 보일 때만 붙는다 (같은 조건의 역).

**이동**: `/post/{boardType}/comment/reply/{postUuid}/{commentUuid}/{commentIndex}`
`boardType = getCurrentRoutePath().split('/')[2]`

- `/board/community/detail/x` → `['', 'board', 'community', ...]` → `community` ✅
- `/post/community/comment/reply/...` → `['', 'post', 'community', ...]` → `community` ✅

### 댓글 더보기 (작성자 본인)

**조건**: `isCommentAuthor && isCommentShowed`
`isCommentAuthor = authStore.getAptInfo()?.aptResidentUuid === comment?.authorAptResidentUuid`

| 항목 | 동작                                                                                           |
| ---- | ---------------------------------------------------------------------------------------------- |
| 수정 | `/post/{boardType}/comment/edit/{postUuid}/{commentUuid}`                                      |
| 삭제 | `DETAIL_DELETE_MODAL_DATA` → `deleteCommunityCommentMutation({ commentUuid, isReplyComment })` |

**API** #41 `deleteCommunityComment`
`onSuccess`: `invalidateQueries([...])`(v4) + **답글 페이지에서 원댓글이 삭제되면**
`navigateTo('/board/community/detail/{postUuid}')`

> `postUuid`는 `onMounted`에서 `getParams().postUuid`로 채운다.

## 댓글 입력 — `CommentInput` (160줄)

**`fixed bottom-0 flex w-full flex-col border-t border-t-[#f6f6f6] bg-base-b-white`**

| 요소            | 클래스 (원문)                                                                                                                                                                                                                                                             |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 미리보기 `<ul>` | `flex w-full gap-2 overflow-x-auto overflow-y-hidden px-5 pb-2 pt-3` (이미지 있을 때만)                                                                                                                                                                                   |
| 미리보기 `<li>` | `relative h-[70px] w-[72.5px] shrink-0`                                                                                                                                                                                                                                   |
| 썸네일 래퍼     | `flex h-[70px] w-[70px] shrink-0 justify-center overflow-hidden rounded-md border border-defaults-tertiary-border-tertiary`                                                                                                                                               |
| 썸네일          | `h-[70px] w-[70px] shrink-0 object-cover` alt `댓글 이미지`                                                                                                                                                                                                               |
| 삭제 버튼       | `Xcircle.svg` alt `이미지 삭제` — `absolute right-[-2px] top-[-2px] h-5 w-5`                                                                                                                                                                                              |
| 입력 줄         | `flex min-h-16 w-full items-center gap-1.5 px-5 py-3` + `:style="{ height: textAreaHeight + 24 + 'px' }"`                                                                                                                                                                 |
| 사진 버튼       | `flex h-10 w-10 shrink-0 items-center justify-center`, `:disabled="imageList.length >= 5"`                                                                                                                                                                                |
| 사진 아이콘     | `PhotoAdd.svg` alt `사진 첨부` `h-[22px] w-[22px]` + 5장이면 `opacity-40`                                                                                                                                                                                                 |
| textarea        | `min-h-10 w-full rounded-[4px] border border-defaults-secondary-border-secondary bg-[#f8f8f8] px-3 py-2.5 text-defaults-primary-text-primary pretendard-16Regular placeholder:text-defaults-tertiary-text-tertiary focus:border focus:border-defaults-focus-border-focus` |
| placeholder     | `` `${isReplyPage ? '답글' : '댓글'}을 입력해 주세요` ``                                                                                                                                                                                                                  |
| 버튼 래퍼       | `w-14`                                                                                                                                                                                                                                                                    |
| 입력 버튼       | `<ButtonBase type="submit" class="text-base-b-white pretendard-14SemiBold" round-type="rounded" color="brand" :disabled="!isInputValid">입력</ButtonBase>`                                                                                                                |

**자동 높이**: `useTextareaAutoResize({ minHeight: 0, debounceMs: 30 })`
→ `scrollHeight` 기반. 내용이 비면 `minHeight`(0)로.

**활성화**: `commentContent.trim().length >= 1 || imageList.length > 0`

**붙여넣기 제한**:

```js
handlePaste(e):
  const items = Array.from(e.clipboardData?.items ?? []);
  if (items.some(i => i.type === 'text/plain')) return;   // 통과
  e.preventDefault();
  showToast('텍스트 이외에는 붙여넣을 수 없습니다.');
```

**이미지 붙여넣기 불가.** 파일 선택만 허용.

**제출 후**: `commentContent = ''`, `clearImages()`, `resetHeight()`

**이미지 첨부**: `useCommentImageList` (§3-3) — 5장/10,485,760B/jpg·jpeg·png
에러 토스트는 `BOARD_TOAST_MESSAGE.image[errorType]`

## 댓글 등록

`usePostCommunityComment` → **API** #40 (multipart + `onUploadProgress`)
`onSuccess`: `uploadHandler.onSuccess()` + `invalidateQueries(['communityCommentList'])` (**v4**)

**진행률 표시**: `CommunityDetailView`의 `SpinnerDots`가
`isPostCommunityCommentPending`일 때 `bg-black/50` + `text-base-b-white` + `progressPercent`

```html
<SpinnerDots
  v-if="isCommunityPostDetailLoading || isPostCommunityCommentPending"
  :progress-percent="isPostCommunityCommentPending ? postCommentProgressPercent : 0"
  :background-color="isPostCommunityCommentPending ? 'bg-black/50' : ''"
  :text-color="isPostCommunityCommentPending ? 'text-base-b-white' : 'text-base-b-black'"
/>
```

## 에러 처리 (게시판 공통 패턴)

모든 mutation의 `onError`:

```js
const { errorCode, message } = error.data.error
switch (errorCode) {
  case 'BOARD_FILE_UPLOAD_FAIL':
    swalErrorModal({ text: '파일 업로드에 실패하였습니다.' })
    break
  case 'BOARD_BLACK_LIST':
    swalErrorModal({ html: '게시판 사용이 제한된 사용자입니다.<br/>관리사무소로 문의해 주세요.' })
    break
  default:
    swalErrorModal({ text: message })
}
```

> **`error.data.error`** — 레거시 axios가 `throw error.response`를 하므로 `response.data.error`.
> 타깃 `ApiError { status, code }` 매핑 필요 (`tech-mapping.md` 3-2).
> **`swalErrorModal({ html })`은 HTML을 렌더한다** — 타깃 에러 모달도 줄바꿈 지원 필요
> (`tech-choices.md` Q-Q3의 Base UI Dialog 재현 대상).

## QA 체크리스트

- [ ] 좋아요를 **연속 두 번** 눌렀을 때 두 번째는 UI가 안 바뀌는지 (§DetailPostLikeButton, 레거시와 동일)
- [ ] 좋아요 후 화면 재진입 시 서버 값 반영
- [ ] 본인 글이면 `수정/삭제`, 남의 글이면 `보지 않기/신고`
- [ ] 익명 작성자 글에서 `이 사용자의 글 보지 않기`가 **보이는지** (레거시와 동일)
- [ ] 차단 성공 후 더보기 버튼이 사라지는지
- [ ] 삭제 → 뒤로가기 + 토스트 `삭제되었습니다`
- [ ] 댓글 등록 중 진행률 오버레이(검은 배경 + 흰 %)
- [ ] 이미지 붙여넣기 시 토스트 `텍스트 이외에는 붙여넣을 수 없습니다.`
- [ ] 6장째 첨부 시 토스트 `이미지는 최대 5장까지만 첨부할 수 있습니다`
- [ ] 삭제/차단된 댓글의 **이미지가 계속 보이는지** (레거시와 동일)
- [ ] 차단된 댓글에 **답글 버튼이 보이는지** (레거시와 동일)

---

# B7. 소통공간 답글 작성 — `/post/community/comment/reply/:postUuid/:commentUuid/:commentIndex`

`Community/CommunityCommentReplyWriteView.vue` (37줄) + `CommentReplyWrite.vue` (39줄)

## 화면 구성

```
┌─────────────────────────────┐
│ ←   소통공간 답글 작성        │  라우트 meta AppBar
├─────────────────────────────┤
│ 👤 김철수                    │  부모 댓글 (CommentListItem)
│    원 댓글 내용              │
│    1시간 전                  │  (답글 버튼 없음 — 경로에 'comment' 포함)
│   ↳ 👤 이영희               │  기존 답글들 (childCommentList)
│   ↳ 👤 박민수               │
├─────────────────────────────┤
│ [🖼] [답글을 입력해 주세요] [입력] │  CommentInput (fixed)
└─────────────────────────────┘
```

**구조**: 부모 댓글 상세를 조회해 **1개짜리 배열로 감싸** `CommentList`에 넘긴다.

```js
const parentCommentAsList = computed(() => (props.commentDetail ? [props.commentDetail] : []))
```

`childCommentList`가 함께 내려오므로 기존 답글도 같이 보인다.

| 요소 | 클래스 (원문)                                            |
| ---- | -------------------------------------------------------- |
| 루트 | `h-full`                                                 |
| 목록 | `CommentList` — 답글 페이지라 `overflow-auto px-5 pb-16` |

## 데이터

**API**: #39 `getCommunityCommentDetail` — `/{communityUuid}/comment/{commentUuid}`
쿼리 키 `['communityCommentDetail', aptResidentUuid, postUuid, commentUuid]` ← **키가 온전하다**

**답글 등록**: #43 `postCommunityReply` — `POST /{communityUuid}/comment/{commentUuid}`
(댓글 하위 POST가 곧 답글)

`onSuccess`: `invalidateQueries(['communityCommentList'])` + `(['communityCommentDetail'])` (**v4 둘 다**)

## 진행률

```html
<SpinnerDots
  v-if="isPostCommunityReplyPending"
  :progress-percent="postReplyProgressPercent"
  background-color="bg-black/50"
  text-color="text-base-b-white"
/>
```

**B6과 달리 조건이 단순하다** (상세 로딩과 합치지 않음).

## 엣지케이스

| 상황                      | 동작                                                      |
| ------------------------- | --------------------------------------------------------- |
| 부모 댓글 로딩 중         | `CommentList`가 `SpinnerDots` 렌더                        |
| 부모 댓글이 삭제된 상태   | `state`에 따라 `삭제된 댓글`로 표시, 답글 입력은 **가능** |
| 다른 화면에서 원댓글 삭제 | `useDeleteCommunityComment`가 상세로 리다이렉트 (B6 참조) |
| `:commentIndex` 파라미터  | **어디서도 읽지 않는다** 🔴                               |

> ⚠️ **`:commentIndex`는 완전한 죽은 파라미터다.** `CommentListItem`이 URL을 만들 때 넣지만
> 이 화면의 어느 코드도 `getParams().commentIndex`를 읽지 않는다.
> → `deferred.md` 「죽은 코드」. **경로 형태는 그대로 유지**(딥링크·뒤로가기 히스토리 호환)

## QA 체크리스트

- [ ] 부모 댓글 + 기존 답글이 함께 보이는지
- [ ] 부모 댓글에 `답글` 버튼이 **없는지**
- [ ] placeholder가 `답글을 입력해 주세요`
- [ ] 답글 등록 후 목록에 즉시 추가되는지 (v5 무효화 수정 후)
- [ ] 진행률 오버레이

---

# B8. 소통공간 댓글 수정 — `/post/community/comment/edit/:postUuid/:commentUuid`

`Community/CommunityCommentEditView.vue` (30줄) + `CommentEdit.vue` (206줄) · `showAppBar:false`

## 화면 구성

```
┌─────────────────────────────┐
│ ←      댓글 수정      완료   │  화면 내 <AppBar> is-modal-visible
├─────────────────────────────┤
│                             │
│ 기존 댓글 내용이 들어있는      │  textarea rows=10, flex-1
│ 편집 가능한 영역             │
│                             │
├─────────────────────────────┤
│ [🖼][🖼]                    │  기존 이미지 미리보기
│ 📷 사진 2/5                  │  하단 바
└─────────────────────────────┘
```

| 요소            | 클래스 (원문)                                                                                                                                                                                     |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 루트            | `flex h-full flex-col overflow-hidden`                                                                                                                                                            |
| 폼              | `flex flex-1 flex-col overflow-hidden px-5 py-4 pt-12`                                                                                                                                            |
| textarea        | `flex h-full w-full flex-1 items-start gap-2.5 self-stretch overflow-auto text-defaults-primary-text-primary pretendard-15Regular placeholder:text-defaults-tertiary-text-tertiary` (`rows="10"`) |
| 하단 영역       | `w-full bg-base-b-white`                                                                                                                                                                          |
| 미리보기 `<ul>` | `flex w-full gap-2 overflow-x-auto overflow-y-hidden px-5 pb-2 pt-3`                                                                                                                              |
| 미리보기 `<li>` | `relative h-[70px] w-[72.5px] shrink-0`                                                                                                                                                           |
| 하단 바         | `flex h-16 w-full items-center justify-between gap-[14px] overflow-hidden border-t border-t-[#f6f6f6] bg-defaults-primary-background-primary px-5 py-[14px]`                                      |
| 사진 라벨       | `flex items-center gap-1 text-center text-defaults-secondary-text-secondary pretendard-14SemiBold`                                                                                                |
| 사진 아이콘     | `PhotoAdd.svg` alt `포토 아이콘` `h-[18px] w-[18px]`                                                                                                                                              |
| 카운트          | `{n}/5` — n>0이면 `text-orange-s-warning-500`                                                                                                                                                     |

**AppBar**: `title="댓글 수정"` · `is-modal-visible` · `@open-modal` → `EDIT_BACK_MODAL_DATA`

**완료 버튼**:

```html
<button
  type="submit"
  form="editForm"
  :disabled="!isFilled || isSubmitting"
  :class="isFilled && !isSubmitting ? 'text-brand-default-text-brand'
                                    : 'text-defaults-tertiary-text-tertiary'"
>
  {{ isSubmitting ? '처리중' : '완료' }}
</button>
```

**B9/B10의 완료 버튼과 달리 실제로 `disabled` 처리된다** (§5-12).

## 초기값 주입

```js
watch(
  () => props.commentDetail,
  (detail) => {
    if (!detail) return
    commentContent.value = formatHtmlText(detail.content)?.replaceAll('<br/>', '\n') ?? ''
    setImageList(detail.fileList ?? [])
  },
  { immediate: true },
)
```

**`\n` → `<br/>` → `\n` 왕복.** `formatHtmlText`가 엔티티를 디코드하고 `\n`을 `<br/>`로 바꾼 뒤
다시 `\n`으로 되돌린다. **엔티티 디코딩만 남기려는 우회.** 그대로 이관.

## 데이터

**조회**: #39 `getCommunityCommentDetail` (B7과 동일 훅 — **댓글/대댓글 공통**)
**수정**: #42 `patchCommunityComment` (multipart + `onUploadProgress`)
`onSuccess`: `uploadHandler.onSuccess()` + **`navigateBack()`** — **무효화 없음**

> ⚠️ **수정 후 댓글 목록 무효화가 없다.** `staleTime: 0`이라 상세로 돌아가면 refetch되어
> 반영된다. **토스트도 없다** (게시글 수정은 `수정되었습니다` 토스트가 있는데 댓글은 없음).
> → `deferred.md` 「동작 의심」. **이관 시 그대로**

## 활성 조건

`isFilled = commentContent?.trim() !== '' || imageList.length > 0`

## 스피너

```html
<SpinnerDots
  v-if="isLoading || isSubmitting"
  :progress-percent="progressPercent"
  :background-color="isSubmitting ? 'bg-black/50' : ''"
  :text-color="isSubmitting ? 'text-base-b-white' : 'text-base-b-black'"
/>
```

## 엣지케이스

| 상황                    | 동작                                                         |
| ----------------------- | ------------------------------------------------------------ |
| 뒤로가기(AppBar)        | `EDIT_BACK_MODAL_DATA` 모달 → `그만두기` 시 `navigateBack()` |
| 내용·이미지 모두 삭제   | 완료 버튼 비활성                                             |
| 기존 이미지 + 신규 혼합 | `convertFormDataFile`이 `fileUuid`/`file`로 구분 전송        |
| 대댓글 수정             | **같은 화면·같은 API** (`commentUuid` 기준)                  |

## QA 체크리스트

- [ ] 기존 내용·이미지가 채워진 상태로 진입
- [ ] 줄바꿈이 보존되는지 (`<br/>` ↔ `\n` 왕복)
- [ ] 완료 버튼이 내용 없을 때 **회색 + 비활성**
- [ ] 제출 중 `처리중` 표시
- [ ] 뒤로가기 시 `수정 그만두기` 모달
- [ ] 수정 후 **토스트가 없는지** (레거시와 동일)
- [ ] 대댓글 수정도 동일 화면으로 동작

---

# B9. 소통공간 글 등록 — `/board/community/write`

`Community/CommunityWriteView.vue` (42줄) + `FormContainer`(138) + `FormDetail`(80) +
`FormCategory`(83) + `FormBottom`(75) + `FormImageUpload`(43) + `FormImagesPreview`(59)

## 화면 구성

```
┌─────────────────────────────┐
│ ←   소통공간 글 등록   완료   │  FormContainer <AppBar> is-modal-visible
├─────────────────────────────┤
│ ┌─────────────────────────┐ │
│ │ 게시글의 주제를 선택해주세요 >│ │  FormCategory (진입 시 드로어 자동 열림)
│ └─────────────────────────┘ │
│ ─────────────────────────── │
│ 제목을 입력해주세요           │  input, border-b
│                             │
│ 선택한 주제의 게시글 내용을     │  textarea (height: 100vh)
│ 작성해주세요                  │
├─────────────────────────────┤
│ [🖼][🖼]                    │  FormImagesPreview
│ 📷 사진 2/5                  │  FormBottom (소통공간은 비밀글 없음)
└─────────────────────────────┘
```

## 컴포넌트 트리

```
CommunityWriteView
└ FormContainer (isLoading)
  ├ AppBar (title, is-modal-visible, 완료 버튼)
  ├ SpinnerDots (isLoading || isSubmitting)
  ├ FormDetail (isWritingPage)
  │ ├ FormCategory (isWritingPage)  → DrawerList
  │ └ form#boardForm (title input + content textarea)
  ├ FormBottom
  │ ├ FormImagesPreview
  │ ├ FormImageUpload
  │ └ 비밀글 체크박스 (민원공간만)
  └ ModalButton (WRITE_BACK_MODAL_DATA)
```

## 데이터 흐름 — 스토어 배선

```js
// CommunityWriteView.vue
const { setCategoryList } = useBoardWriteCategoryStore()
const boardFormStore = useBoardFormStore()

watch(communityCategoryList, (v) => setCategoryList(v), { immediate: true })
watch(createdPostProgressPercent, (v) => boardFormStore.setSubmitProgressPercent(v))
onMounted(() => boardFormStore.setSubmitHandler(postCommunityPostMutationAsync))
```

**두 개의 Pinia 스토어**(`stores/board.js`):

| 스토어                       | 상태                                                               |
| ---------------------------- | ------------------------------------------------------------------ |
| `useBoardWriteCategoryStore` | `categoryList` + `setCategoryList`                                 |
| `useBoardFormStore`          | vee-validate `useForm` + `submitHandler` + `submitProgressPercent` |

`useBoardFormStore` 노출:
`category` · `title` · `content` · `imageList` · `privateFlag` · `values` · `meta` ·
`isSubmitting` · `setFieldValue` · `submitForm` · `resetForm` · `setSubmitHandler` ·
`submitProgressPercent` · `setSubmitProgressPercent`

**제출 페이로드 조립** (`stores/board.js:50`):

```js
submitForm = handleSubmit(async (value) => {
  if (!submitHandler.value) return
  const formData = {
    title: value.title || null,
    content: value.content || null,
    categoryUuid: value.category.uuid || null,
    fileList: values.imageList || [],
  }
  if (values.privateFlag !== undefined) formData.privateFlag = values.privateFlag
  await submitHandler.value(formData)
  resetForm()
})
```

> ⚠️ **`value.category.uuid`에 옵셔널 체이닝이 없다.** `category`가 `null`이면 TypeError.
> `FormDetail`의 수동 검증이 이를 막는다(§5-11). 검증을 제거하면 즉시 터진다.
>
> ⚠️ **`value.title`/`value.content`(검증 통과값)와 `values.imageList`/`values.privateFlag`
> (스토어 raw)를 섞어 쓴다.** 결과는 같지만 출처가 다르다. 그대로.
>
> ⚠️ **`privateFlag !== undefined`일 때만 payload에 넣는다.** 소통공간은 체크박스가 없어
> 값이 `undefined`로 남는 것이 정상 — **단 이전에 민원공간 폼을 쓴 적이 있으면
> 스토어에 값이 남아 소통공간 등록에도 `privateFlag`가 실려 나간다** (§5-7). 🔴
> → `deferred.md` 「동작 의심」. **이관 시 그대로**

## 카테고리 선택 — `FormCategory`

```html
<button
  type="button"
  class="border-defaults-tertiary-border-tertiary text-defaults-primary-text-primary pretendard-16Regular flex w-full items-center justify-between self-stretch rounded-md border p-2.5"
>
  <span v-if="boardFormStore.category">{{ boardFormStore.category.category }}</span>
  <p v-else class="text-defaults-tertiary-text-tertiary">게시글의 주제를 선택해주세요</p>
  <img class="h-5 w-5" src="/assets/icons/ArrowRight.svg" alt="화살표 아이콘" />
</button>
```

**드로어**: `<DrawerList :list="categoryDrawerData" text-align="left" title="게시글의 주제를 선택해주세요">`

```js
categoryDrawerData = categoryList?.map((c) => ({
  label: c.category,
  key: c.uuid,
  color: 'text-defaults-primary-text-primary',
  handler: () => {
    setFieldValue('category', c)
    isCategoryDrawerOpened = false
  },
}))
```

**자동 열기**: `onMounted` — `isWritingPage && !boardFormStore.category`일 때만
→ **등록 화면 진입 시 카테고리 드로어가 자동으로 뜬다.** 수정 화면(B10)은 안 뜬다.

> ⚠️ **`const { categoryList } = useBoardWriteCategoryStore();`** — `storeToRefs` 없이
> 구조분해해 **반응성이 끊긴다.** `onMounted` 시점 값으로 고정된다.
> `CommunityWriteView`의 `watch(..., { immediate: true })`가 마운트 **전에** 실행되므로
> 대개 값이 채워져 있지만, **카테고리 API가 느리면 드로어가 빈 목록으로 뜬다.** 🔴
> (`FormContainer`는 `storeToRefs`를 제대로 쓴다 — 비대칭)
> → `deferred.md` 「동작 의심」. **이관 시 그대로**

## 제목·내용 — `FormDetail`

| 요소    | 클래스 (원문)                                                                                                                                                                                            |
| ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 래퍼    | `w-full flex-1 overflow-auto px-5 pt-12`                                                                                                                                                                 |
| 폼      | `mt-2 w-full space-y-3` (`id="boardForm"`)                                                                                                                                                               |
| 제목    | `community-write-input w-full border-b border-b-defaults-tertiary-border-tertiary px-2.5 py-2 text-defaults-primary-text-primary pretendard-16SemiBold placeholder:text-defaults-tertiary-text-tertiary` |
| 제목 ph | `제목을 입력해주세요`                                                                                                                                                                                    |
| 내용    | `w-full px-2.5 pt-2 text-defaults-primary-text-primary pretendard-16Regular placeholder:text-defaults-tertiary-text-tertiary`                                                                            |
| 내용 ph | `선택한 주제의 게시글 내용을 작성해주세요`                                                                                                                                                               |

**scoped style**:

```css
.community-write-input:focus {
  border: none !important;
  border-bottom: 1px solid #f3f4f6 !important;
}
```

> ⚠️ **포커스 시 밑줄 색이 `#f3f4f6`(연한 회색)로 바뀐다** — 기본 상태의
> `border-b-defaults-tertiary-border-tertiary`와 다르다. 전역 `input.css`의
> focus 테두리(`#2563eb`)를 덮기 위한 것. **하드코딩 hex이며 그대로 이식**
> (`14-styling.md`의 "hex 금지" 규칙을 이 프로젝트에 맞게 완화하기로 한 사례).

**`onMounted`**: `textareaRef.value.style.height = '100vh'` — DOM 직접 조작.
`overflow-auto` 래퍼 안에서 100vh 고정이라 **내용과 무관하게 항상 스크롤이 생긴다.**

## 수동 검증 (§5-11)

```js
handleFormSubmit(e):
  e.preventDefault();
  if (!category)                    → swalErrorModal({text:'게시글의 주제를 선택해주세요.'}); return;
  if (!title  || !title.trim())     → swalErrorModal({text:'제목을 입력해주세요.'});        return;
  if (!content|| !content.trim())   → swalErrorModal({text:'내용을 입력해주세요.'});        return;
  boardFormStore.submitForm(e);
```

> **문구 끝에 마침표가 있다** — zod 스키마의 메시지(`제목을 한 글자 이상 입력해주세요`, 마침표 없음)와
> **다른 문구**다. 사용자가 보는 것은 이쪽이다.

## 하단 바 — `FormBottom` + `FormImageUpload` + `FormImagesPreview`

| 요소            | 클래스 (원문)                                                                                                                                                |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 하단 바         | `flex h-16 w-full items-center justify-between gap-[14px] overflow-hidden border-t border-t-[#f6f6f6] bg-defaults-primary-background-primary px-5 py-[14px]` |
| 사진 라벨       | `flex items-center gap-1 text-center text-defaults-secondary-text-secondary pretendard-14SemiBold`                                                           |
| 사진 아이콘     | `PhotoAdd.svg` alt `포토 아이콘` `h-[18px] w-[18px]`                                                                                                         |
| 카운트          | `{n}/5`, n>0이면 `text-orange-s-warning-500`                                                                                                                 |
| 미리보기 `<ul>` | `flex w-full gap-2 overflow-y-hidden overflow-x-scroll px-4 pb-4` ← **`px-4 pb-4`** (댓글은 `px-5 pb-2 pt-3`)                                                |
| 미리보기 `<li>` | `relative h-[70px] w-[72.5px]` ← **`shrink-0` 없음** (댓글에는 있음)                                                                                         |
| 썸네일          | `h-[70px] w-[70px] shrink-0` ← **`object-cover` 없음** (댓글에는 있음) alt `이미지 파일`                                                                     |
| 삭제 아이콘     | `Xcircle.svg` alt **`닫기 아이콘`** (댓글은 `이미지 삭제`) `absolute right-[-2px] top-[-2px] h-5 w-5`                                                        |

> ⚠️ **게시글 미리보기와 댓글 미리보기는 클래스·alt가 미묘하게 다르다.** 위 4가지.
> 공용 컴포넌트로 묶고 싶어지지만 **묶으면 화면이 달라진다.** 별도 유지.

**미리보기 URL**:

```js
image instanceof File ? URL.createObjectURL(image) : `${s3UrlFile}${image.fileUrl}`
```

> ⚠️ **`revokeObjectURL`이 없다.** `computed` 안에서 매 재계산마다 새 ObjectURL을 만든다.
> 메모리 누수. (댓글 쪽 `useCommentImageList`는 캐시+revoke를 제대로 한다)
> ⚠️ **`:key="preview.name"`** — 기존 이미지는 `name`이 `undefined`라 키 중복 가능.
> → `deferred.md`. **이관 시 그대로**

**이미지 첨부**: `validImage(event, boardFormStore, handler)` (§3-4) — 5장/10,000,000B/jpg·jpeg·png·**gif**

## 비밀글 — 소통공간에는 없음

`v-if="!isCommunityBoard"` — `isCommunityBoard = getCurrentRoutePath().includes('community')`
**B9·B10에서는 렌더되지 않는다.** 동작은 §B16에서 기술.

## 제출

`usePostCommunityPost` → **API** #31 `postCommunityPost` (multipart + `onUploadProgress`)
`onSuccess`: `uploadHandler.onSuccess()` → `navigateBack()` → 토스트 `등록되었습니다`
`onError`: `BOARD_FILE_UPLOAD_FAIL` / `BOARD_BLACK_LIST` / default

**진행률**: `createdPostProgressPercent` → `boardFormStore.setSubmitProgressPercent` →
`FormContainer`의 `<SpinnerDots :progress-percent="boardFormStore.submitProgressPercent">`
(배경·글자색 지정 없음 → 투명 배경 + `text-base-b-black`)

## 뒤로가기 모달

`isWritingPage ? WRITE_BACK_MODAL_DATA : EDIT_BACK_MODAL_DATA`
`그만두기` → `navigateBack()` + `boardFormStore.resetForm()`

## QA 체크리스트

- [ ] 진입 시 카테고리 드로어 **자동 열림**
- [ ] 카테고리 없이 완료 → 모달 `게시글의 주제를 선택해주세요.`
- [ ] 제목 없이 완료 → `제목을 입력해주세요.`
- [ ] 내용 없이 완료 → `내용을 입력해주세요.`
- [ ] 완료 버튼이 회색이어도 **눌리는지** (§5-12)
- [ ] gif 첨부가 **되는지** (댓글에선 안 됨)
- [ ] 10MB 초과 시 토스트 `파일 사이즈는 10M 이하만 업로드 가능 합니다`
- [ ] 등록 중 진행률 % 표시
- [ ] 등록 성공 → 뒤로가기 + 토스트 `등록되었습니다`
- [ ] 뒤로가기 → `작성 그만두기` 모달
- [ ] **민원공간 폼 작성 중 이탈 → 소통공간 등록 진입 시 값이 남아 있는지** (§5-7, 레거시와 동일)
- [ ] 소통공간에 비밀글 체크박스가 **없는지**

---

# B10. 소통공간 글 수정 — `/board/community/edit/:postUuid`

`Community/CommunityEditView.vue` (55줄) — B9와 같은 `FormContainer`를 재사용

## B9와의 차이

| 항목             | B9 등록                          | B10 수정                          |
| ---------------- | -------------------------------- | --------------------------------- |
| AppBar 제목      | `소통공간 글 등록`               | `소통공간 글 수정`                |
| 카테고리 드로어  | 진입 시 **자동 열림**            | 안 열림                           |
| 초기값           | 없음                             | `postDetailData`에서 주입         |
| 뒤로가기 모달    | `WRITE_BACK_MODAL_DATA`          | `EDIT_BACK_MODAL_DATA`            |
| 제출 핸들러      | `postCommunityPostMutationAsync` | `patchCommunityPostMutationAsync` |
| 성공 토스트      | `등록되었습니다`                 | `수정되었습니다`                  |
| API              | #31 POST                         | #32 PATCH `/{communityUuid}`      |
| `isLoading` 소스 | `isCommunityCategoryListLoading` | `isCommunityPostDetailLoading`    |

## 초기값 주입 — 2단계

**1) 제목·내용·이미지·비밀글** — `FormContainer.onMounted`:

```js
if (!isWritingPage.value) {
  setFieldValue('title', formatHtmlText(postDetailData?.title)?.replaceAll('<br/>', '\n'))
  setFieldValue('content', formatHtmlText(postDetailData?.content)?.replaceAll('<br/>', '\n'))
  setFieldValue('imageList', postDetailData?.fileList || [])
  setFieldValue('privateFlag', postDetailData?.privateFlag)
}
```

> 🔴 **`onMounted` 시점에 `postDetailData`가 아직 `null`일 수 있다.**
> `FormContainer`는 `isLoading`이 참일 때 `FormDetail`을 렌더하지 않지만 **자신은 마운트된다.**
> 상세 조회가 늦게 오면 **빈 폼으로 남는다.** 재시도 로직 없음.
> 실측상 `isCommunityPostDetailLoading`이 `false`가 될 때까지 `FormContainer`의
> `onMounted`는 이미 지나가 있다 → **상세가 캐시에 없으면 폼이 빈다.** 🔴
>
> 다만 B6(상세)에서 수정으로 들어오는 것이 유일한 경로이고, 쿼리 키가 §5-1처럼
> `postUuid` 없이 공유되므로 **직전 상세 조회 캐시가 그대로 히트해** 값이 채워진다.
> **§5-1의 버그가 §B10의 버그를 가리고 있다.** 🔴🔴
>
> ⚠️ **타깃에서 쿼리 키를 고치면(권장) B10이 즉시 깨진다.**
> 따라서 **쿼리 키를 레거시 그대로 유지**하거나, 초기값 주입을 `watch`로 바꿔야 한다.
> 후자는 동작이 개선되는 방향이라 등가 이관과 충돌하지 않는다(빈 폼 → 정상 폼).
> → `[확인 필요]` BD-Q11 — **이관 시 결정 필요. 가장 위험한 항목이다.**

**2) 카테고리** — `FormContainer`의 `watch`:

```js
watch(
  [categoryList, () => props.postDetailData],
  ([list, detail]) => {
    if (isWritingPage.value) return
    if (isEditCategoryInitialized) return // 최초 1회만
    if (!list?.length || !detail?.categoryName) return
    const matched = list.find((item) => item.category === detail.categoryName)
    if (matched) {
      setFieldValue('category', matched)
      isEditCategoryInitialized = true
    }
  },
  { immediate: true },
)
```

**`categoryName`(문자열) → `{ uuid, category }` 역매칭.** 상세 응답에 `categoryUuid`가 없어서다.
`isEditCategoryInitialized`는 **`let` 지역 변수**(ref 아님) — 사용자가 카테고리를 바꿔도 덮어쓰지 않기 위함.

> ⚠️ **카테고리명이 바뀌거나 중복되면 잘못 매칭된다.** 서버가 `categoryUuid`를 주면 해결.
> → `deferred.md` 「서버 계약 정리」

## 죽은 인자 (§5-9)

```js
usePatchCommunityPost(postDetailUuid.value) // 훅은 인자를 안 받음, 값은 ''
useGetCommunityPostDetail(postDetailUuid.value) // 동일
```

## QA 체크리스트

- [ ] 진입 시 카테고리·제목·내용·이미지가 채워져 있는지
- [ ] 카테고리 드로어가 **자동으로 안 열리는지**
- [ ] 카테고리를 바꾼 뒤에도 덮어써지지 않는지
- [ ] 기존 이미지 삭제 + 신규 추가 혼합 저장
- [ ] 수정 성공 → 뒤로가기 + 토스트 `수정되었습니다`
- [ ] 뒤로가기 → `수정 그만두기` 모달
- [ ] **상세를 거치지 않고 URL 직접 진입 시 폼이 비는지** (BD-Q11, 레거시 동작 확인)

---

# B11. 소통공간 내 활동 — `/board/community/activities`

`Community/CommunityMyActivitiesView.vue` (34줄) + `MyActivities.vue` (57줄)

## 화면 구성

```
┌─────────────────────────────┐
│ ←   소통공간 내 활동          │  라우트 meta AppBar
├─────────────────────────────┤
│  작성한 글   │  댓글 쓴 글    │  TabBase (인디케이터 애니메이션)
│ ▔▔▔▔▔▔▔▔                    │
├─────────────────────────────┤
│ ┌─────────────────────────┐ │
│ │ 자유   3시간 전    [🖼]  │ │  BoardPostList (B5와 동일 카드)
│ │ 오늘 날씨 좋네요          │ │
│ │ 👁12  👍3  💬5          │ │
│ └─────────────────────────┘ │
└─────────────────────────────┘
```

| 요소 | 클래스 (원문)                                                                                                                    |
| ---- | -------------------------------------------------------------------------------------------------------------------------------- |
| 루트 | `h-full w-full`                                                                                                                  |
| 탭   | `TabBase` — `relative flex h-12 w-full overflow-auto border-b border-b-defaults-secondary-border-secondary bg-base-b-white py-0` |
| 목록 | `BoardPostList` (§B5)                                                                                                            |

**탭**: `MY_ACTIVITY_TABS = [{label:'작성한 글', key:'posts'}, {label:'댓글 쓴 글', key:'comments'}]`
기본 `currentTab = 'posts'`

**`TabBase` 선택 스타일**: 선택 `text-brand-default-text-brand pretendard-16Bold`,
비선택 `text-defaults-secondary-text-secondary pretendard-16Regular`.
인디케이터 `absolute bottom-0 h-0.5 bg-brand-default-background-brand transition-all duration-300 ease-in-out`
— `offsetLeft`/`offsetWidth` 측정 기반 (`tech-mapping.md`: 자체 구현 대상)

## 데이터

| 탭         | 훅                                     | API                                                               |
| ---------- | -------------------------------------- | ----------------------------------------------------------------- |
| 작성한 글  | `useGetCommunityMyActivityPostList`    | #45 `getCommunityMyActivityPostList` — `/community/my`            |
| 댓글 쓴 글 | `useGetCommunityMyActivityCommentList` | #46 `getCommunityMyActivityCommentList` — `/community/my/comment` |

둘 다 `useInfiniteList` · `defaultStoreKey: ['aptResidentUuid']` · `additionalParams` 없음
쿼리 키 `['communityMyActivityPostList', aptResidentUuid]` / `['communityMyActivityCommentList', aptResidentUuid]`

**두 쿼리 모두 화면 진입 즉시 실행된다** (탭 전환과 무관). `enabled` 조건 없음.

**`board-type`**: `isCommunityBoard ? 'community' : 'complaints'`
→ `getCurrentRoutePath().includes('community')`

## 무의미한 `watch` (§5-10)

```js
const fetchMyActivityPostList = useGetCommunityMyActivityPostList() // 고정 참조
watch(
  () => fetchMyActivityPostList,
  (v) => {
    myPostList.value = v
  },
  { immediate: true },
)
```

→ 타깃에선 훅 반환값을 그대로 쓴다. **렌더 결과 동일.**

## 엣지케이스

| 상황                     | 동작                                                                                                                                    |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| 탭 전환                  | `v-if`로 `BoardPostList`를 **교체**(`:key`로 강제 재생성) → 스크롤 위치 초기화                                                          |
| 목록 0건                 | `TextEmpty` — `게시글이 존재하지 않습니다`                                                                                              |
| `댓글 쓴 글` 아이템 클릭 | 게시글 상세로 이동 (댓글 위치로 스크롤하지 않음)                                                                                        |
| 스크롤 복원              | `BoardPostList`의 `useInfiniteScrollPosition` — `moveTo`가 `/board/community`를 포함하므로 **`/board/community/activities`도 매칭된다** |

> ⚠️ **`moveTo: ['/board/community', ...]`는 `includes` 매칭이라 `activities` 경로도 걸린다.**
> 내 활동 → 상세 → 뒤로 시 스크롤이 복원되지만, **B5 목록과 같은 저장 키를 공유**한다(§3-2).
> 그대로 이관.

## QA 체크리스트

- [ ] 탭 인디케이터 애니메이션(300ms)
- [ ] 탭 전환 시 목록 교체
- [ ] `작성한 글`/`댓글 쓴 글` 각각 무한스크롤
- [ ] 아이템 클릭 → 소통공간 상세
- [ ] 상세 → 뒤로 시 스크롤 복원
- [ ] 0건일 때 `게시글이 존재하지 않습니다`

---

# B12. 민원공간 게시판 — `/board/complaints`

`Complaints/ComplaintsBoardView.vue` (79줄) · `showAppBar:false` · **eager import**

## 화면 구성

```
┌─────────────────────────────┐
│ ←        민원 공간       👤 │  ← AppBar 제목에 공백 (§4 #3)
├─────────────────────────────┤
│ ┌─────────────────────────┐ │
│ │ 🔍 검색                  │ │  p-5
│ └─────────────────────────┘ │
│ (전체)(시설)(소음)(주차) …    │  TabCategory has-total-type pb-6
├─────────────────────────────┤
│ ┌─────────────────────────┐ │
│ │[접수] 시설  3시간 전 [🖼] │ │  BoardPostListItem (상태 칩 있음)
│ │ 🔒 복도 등이 안 켜져요     │ │  자물쇠 = privateFlag
│ │ 👁12  👍3  💬5          │ │
│ └─────────────────────────┘ │
│                        ✏️   │  WriteButton
└─────────────────────────────┘
```

| 요소        | 클래스 (원문)                             |
| ----------- | ----------------------------------------- |
| 루트        | `h-full w-full`                           |
| 본문 래퍼   | `h-[calc(100%-124px)] w-full pt-12`       |
| 검색 영역   | `w-full p-5`                              |
| 탭 영역     | `w-full`, `TabCategory class="pb-6"`      |
| AppBar 우측 | `h-6 w-6` > `Human.svg` alt `사람 아이콘` |

**AppBar**: `<AppBar title="민원 공간">` → 우측 아이콘 클릭 시 `/board/complaints/activities`

## 데이터

| 항목     | 훅                             | 쿼리 키                                                             |
| -------- | ------------------------------ | ------------------------------------------------------------------- |
| 카테고리 | `useGetComplaintsCategoryList` | `['complaintsCategoryList', aptResidentUuid]`                       |
| 목록     | `useGetComplaintsPostList`     | `['complaintsPostList', aptResidentUuid, ...Object.values(params)]` |

**API**: #49 `getComplaintsCategoryList`(`/complaint/category`),
**#50 `getComplaintsPostList` — `/complaint/list`** ⚠️ **`/list` 접미사** (§4 #1)

쿼리 파라미터 `page`, `size`(=10), `keyword`, `categoryUuid`
`watch(additionalParamsRef)` → `invalidateQueries(['complaintsPostList'])` (**v4**)

## 처리상태 칩 — `BoardPostStatusChip` (36줄)

**민원공간에만 나타난다** (`boardType === 'complaints' && postItemData.status`).

| `status`      | 렌더                                                                              |
| ------------- | --------------------------------------------------------------------------------- |
| `RECEIVED`    | `<ChipBase key="received" color="lightPurple" variant="outline">접수</ChipBase>`  |
| `IN_PROGRESS` | `<ChipBase key="inProgress" color="gray" variant="fill">처리중</ChipBase>`        |
| `COMPLETED`   | `<ChipBase key="completed" color="darkPurple" variant="fill">처리완료</ChipBase>` |

래퍼: `<div class="whitespace-nowrap">`
**그 외 값이면 아무것도 렌더하지 않는다** (v-else 없음).

## 비밀글 자물쇠

`postItemData?.privateFlag`일 때 `/assets/icons/Lock.svg` alt `자물쇠 아이콘` `h-[20px] w-[20px]`

- 제목에 `pt-0.5` 추가. **민원공간에서만 실제로 나타난다.**

## 상태·엣지케이스

| 상황             | 동작                                                 |
| ---------------- | ---------------------------------------------------- |
| 카테고리 로딩 중 | `TabCategory` 미렌더                                 |
| 목록 로딩 중     | `BoardPostList` 미렌더 → 스피너 안 보임              |
| 목록 0건         | `TextEmpty` — `게시글이 존재하지 않습니다`           |
| 타인의 비밀글    | 서버가 목록에서 제외 (관리사무소·작성자만 조회 가능) |

## QA 체크리스트

- [ ] AppBar 제목이 **`민원 공간`**(공백 포함)인지
- [ ] 상태 칩 3종 색상 (접수=연보라 아웃라인 / 처리중=회색 / 처리완료=진보라)
- [ ] 비밀글에 자물쇠 아이콘
- [ ] 검색·카테고리 필터
- [ ] 상세 → 뒤로 시 스크롤 복원

---

# B13. 민원공간 상세 — `/board/complaints/detail/:postUuid`

`Complaints/ComplaintsDetailView.vue` (91줄) · `showAppBar:false`

## 화면 구성

```
┌─────────────────────────────┐
│ ←       민원 공간        ⋮  │  ← `상세` 없음 + 공백 (§4 #4)
├─────────────────────────────┤
│ 시설  [접수]                 │  DetailPostInfo + 상태 칩
│ 복도 등이 안 켜져요           │
│ ─────────────────────────── │
│ 👤 홍길동                    │
│    3시간 전 │ 조회 12       │
│ ─────────────────────────── │
│ 본문 텍스트…                 │
│ [첨부 이미지]                │
│ [👍 동의해요 3]              │  ← 라벨이 `동의해요` (§4 #5)
╞═════════════════════════════╡
│ 💬 댓글 5                    │
│ 👤 관리사무소                │  state='ADMIN'
│    처리 예정입니다            │
├─────────────────────────────┤
│ [🖼] [댓글을 입력해 주세요] [입력] │
└─────────────────────────────┘
```

| 요소   | 클래스 (원문)                                                    |
| ------ | ---------------------------------------------------------------- |
| 루트   | `h-full`                                                         |
| 내부   | `h-full` (`v-if="!isComplaintsPostDetailLoading"`)               |
| 스크롤 | **`h-full w-full overflow-auto`** — `space-y-2` **없음** (§4 #9) |

## 데이터

| 항목   | 훅                            | 쿼리 키                                                           |
| ------ | ----------------------------- | ----------------------------------------------------------------- |
| 게시글 | `useGetComplaintsPostDetail`  | `['complaintsPostDetail', aptResidentUuid]` 🔴 (§5-1)             |
| 댓글   | `useGetComplaintsCommentList` | `['complaintsCommentList', aptResidentUuid, undefined]` 🔴 (§5-2) |

**API**: #51 `getComplaintsPostDetail`, #54 `getComplaintsCommentList`,
#52 `patchComplaintsPostLike`, #53 `deleteComplaintsPost`, #56 `postComplaintsComment`

`select`에서 `fileList.sort((a,b) => a.orderNum - b.orderNum)` · `enabled: validateQueryEnabledParams(postUuid)`

## 게시글 정보 — `DetailPostInfo`

B6과 **완전히 같은 컴포넌트**. 차이는 데이터:

- `postData.status`가 존재하므로 **`BoardPostStatusChip`이 카테고리 옆에 렌더된다**
- 나머지 클래스·문구는 §B6과 동일

## 좋아요 → 동의해요

`<DetailPost post-like-label="동의해요">` — 그 외 로직·클래스는 §B6의 `DetailPostLikeButton`과 동일.
**§B6의 "두 번째 클릭부터 UI 미반응" 문제도 동일하게 발생한다.**

## 더보기 — 민원 전용 수정·삭제 제한 🔴

```js
watchEffect(() => {
  isComplaintsNonModified.value = props.postData?.status && props.postData?.status !== 'RECEIVED'
})
```

| `status`      | `수정`·`삭제` 동작                                             |
| ------------- | -------------------------------------------------------------- |
| `RECEIVED`    | 정상 (수정 페이지 이동 / 삭제 모달)                            |
| `IN_PROGRESS` | `COMPLAINTS_DETAIL_NONEDITABLE_MODAL_DATA('IN_PROGRESS')` 모달 |
| `COMPLETED`   | `COMPLAINTS_DETAIL_NONEDITABLE_MODAL_DATA('COMPLETED')` 모달   |

**모달 내용**:

- 제목: `처리중` 또는 `처리완료`
- 본문: `처리중인 민원은 수정 및 삭제할 수 없습니다` / `처리완료된 민원은 수정 및 삭제할 수 없습니다`
- 버튼: `확인` 단일 (`button-type="single"`)

> ⚠️ **`COMPLETED`가 아닌 미지정 상태도 "처리완료"로 표시된다.**
> `isInProgressing = status === 'IN_PROGRESS'`의 else이므로 `RECEIVED` 외 모든 값이 `처리완료`.
>
> ⚠️ **`ModalButton`의 `key="block"`이 `complaintsNonEditable` 블록에도 붙어 있다** (복붙 잔재).
> `v-if`로 배타 렌더라 충돌 없음. 그대로.

**열람자 드로어**(차단·신고)는 §B6과 동일.
`state.boardType`은 `getCurrentRoutePath().includes('community') ? 'community' : 'complaints'`
→ **`complaints`**

**수정 경로**: `/board/complaints/edit/{complaintsPostDetail?.complaintUuid}` ← **`complaintUuid` 단수**
**신고 경로**: `/post/report/{complaintUuid}`

## 삭제

`deleteComplaintsPostMutation()` → **API** #53 → `navigateBack()` + 토스트 `삭제되었습니다`
`onError`: **`BOARD_BLACK_LIST` 분기 없음** (§4 #13) → `swalErrorModal({ text: message })`

## 댓글

§B6과 동일 컴포넌트(`DetailComment` → `CommentList` → `CommentListItem` → `CommentInput`).
차이:

- 댓글 삭제 훅 `useDeleteComplaintsComment` — **`BOARD_BLACK_LIST` 분기 없음** (§4 #12)
- 댓글 등록 훅 `usePostComplaintsComment` — `BOARD_BLACK_LIST` 분기 **있음**
- `boardType = getCurrentRoutePath().split('/')[2]` → `complaints`
- 관리사무소 답변은 `state === 'ADMIN'` → 이름이 **`관리사무소`**로 표시, 본문 노출

**진행률 오버레이**: §B6과 동일 구조 (`isPostComplaintsCommentPending`)

## QA 체크리스트

- [ ] AppBar 제목이 **`민원 공간`**(`상세` 없음)인지
- [ ] 좋아요 버튼 라벨이 **`동의해요`**
- [ ] 카테고리 옆에 상태 칩
- [ ] `접수` 상태에서 수정·삭제 정상
- [ ] `처리중` 상태에서 수정 → 모달 `처리중인 민원은 수정 및 삭제할 수 없습니다`
- [ ] `처리완료` 상태에서 삭제 → 모달 `처리완료된 민원은 수정 및 삭제할 수 없습니다`
- [ ] 관리사무소 댓글이 `관리사무소`로 표시
- [ ] 본문 래퍼에 `space-y-2`가 **없어** 소통공간과 간격이 다른지 (레거시와 동일)

---

# B14. 민원공간 답글 작성 — `/post/complaints/comment/reply/:postUuid/:commentUuid/:commentIndex`

`Complaints/ComplaintsCommentReplyWriteView.vue` (37줄) — §B7과 **완전 대칭**

| 항목            | 값                                                                                |
| --------------- | --------------------------------------------------------------------------------- |
| AppBar          | `민원공간 답글 작성` (라우트 meta, **공백 없음**)                                 |
| 조회 API        | #55 `getComplaintsCommentDetail` — `/{complaintsUuid}/comment/{commentUuid}`      |
| 조회 키         | `['complaintsCommentDetail', aptResidentUuid, postUuid, commentUuid]`             |
| 등록 API        | #59 `postComplaintsReply` — `POST /{complaintsUuid}/comment/{commentUuid}`        |
| 무효화          | `(['complaintsCommentList'])` + `(['complaintsCommentDetail'])` (**v4**)          |
| 에러 분기       | `BOARD_FILE_UPLOAD_FAIL` + **`BOARD_BLACK_LIST` 있음**                            |
| 진행률          | `<SpinnerDots v-if="isPostComplaintsReplyPending" bg-black/50 text-base-b-white>` |
| `:commentIndex` | **읽지 않음** (§B7과 동일한 죽은 파라미터)                                        |

**화면 구성·클래스는 §B7과 동일** (`CommentReplyWrite` 공용).

## QA 체크리스트

- [ ] AppBar 제목이 `민원공간 답글 작성`(공백 없음)
- [ ] 부모 댓글 + 기존 답글 표시
- [ ] placeholder `답글을 입력해 주세요`
- [ ] 진행률 오버레이

---

# B15. 민원공간 댓글 수정 — `/post/complaints/comment/edit/:postUuid/:commentUuid`

`Complaints/ComplaintsCommentEditView.vue` (30줄) — §B8과 **완전 대칭**

| 항목        | 값                                                                      |
| ----------- | ----------------------------------------------------------------------- |
| AppBar      | `댓글 수정` (화면 내 `<AppBar>`, `showAppBar:false`)                    |
| 조회 API    | #55 `getComplaintsCommentDetail`                                        |
| 수정 API    | #58 `patchComplaintsComment` (multipart + `onUploadProgress`)           |
| `onSuccess` | `uploadHandler.onSuccess()` + `navigateBack()` — **무효화·토스트 없음** |
| 에러 분기   | `BOARD_FILE_UPLOAD_FAIL` + **`BOARD_BLACK_LIST` 있음**                  |

**화면 구성·클래스는 §B8과 동일** (`CommentEdit` 공용).
초기값 주입(`<br/>` ↔ `\n` 왕복), 완료 버튼 `disabled` 처리, `EDIT_BACK_MODAL_DATA` 전부 동일.

## QA 체크리스트

- [ ] 기존 내용·이미지 채워짐
- [ ] 완료 버튼 비활성 조건
- [ ] 뒤로가기 → `수정 그만두기` 모달
- [ ] 수정 후 토스트 **없음**
- [ ] 대댓글 수정도 동일 화면

---

# B16. 민원공간 글 등록 — `/board/complaints/write`

`Complaints/ComplaintsWriteView.vue` (42줄) — §B9와 대칭 + **비밀글 기능 추가**

## 화면 구성

```
┌─────────────────────────────┐
│ ←   민원공간 글 등록   완료   │  ← 공백 없음
├─────────────────────────────┤
│ ┌─────────────────────────┐ │
│ │ 게시글의 주제를 선택해주세요 >│ │  자동 드로어
│ └─────────────────────────┘ │
│ ─────────────────────────── │
│ 제목을 입력해주세요           │
│ 선택한 주제의 게시글 내용을     │
│ 작성해주세요                  │
├─────────────────────────────┤
│ [🖼]                        │
│ 📷 사진 1/5      ☐ 비밀글 설정 │  ← 민원공간만
└─────────────────────────────┘
```

## 배선

```js
watch(complaintsCategoryList, (v) => setCategoryList(v), { immediate: true })
watch(createdPostProgressPercent, (v) => boardFormStore.setSubmitProgressPercent(v))
onMounted(() => boardFormStore.setSubmitHandler(postComplaintsPostMutationAsync))
```

**API**: #49 카테고리, **#47 `postComplaintsPost`** (multipart + `onUploadProgress`)
`onSuccess`: `navigateBack()` + 토스트 `등록되었습니다`
`onError`: `BOARD_FILE_UPLOAD_FAIL` / default — **`BOARD_BLACK_LIST` 없음** (§4 #10)

## 비밀글 설정 — `FormBottom` (민원공간 전용)

```html
<button v-if="!isCommunityBoard" type="button" class="py-4 pl-4" @click="handlePrivateModalOpen">
  <label
    class="flex items-center gap-2"
    @click="boardFormStore.privateFlag ? null : $event.preventDefault()"
  >
    <input v-model="boardFormStore.privateFlag" type="checkbox" class="h-4 w-4" />
    <span class="pretendard-14Regular">비밀글 설정</span>
  </label>
</button>
```

**동작 (비대칭)**:

| 현재 상태          | 클릭 결과                                                                                                                           |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| `privateFlag` 거짓 | label의 `preventDefault()`로 **체크박스는 안 바뀌고**, 버튼이 `WRITE_PRIVATE_MODAL_DATA` 모달을 연다                                |
| `privateFlag` 참   | label 핸들러가 `null` → **체크박스가 그대로 해제된다**. 버튼의 `handlePrivateModalOpen`은 `if (!privateFlag)` 가드로 모달을 안 연다 |

**모달**:

- 제목 `비밀글 설정하기`
- 본문 `민원공간에서 타인에게 노출되지 않으며,` / `관리사무소와 작성자만 확인할 수 있습니다`
- `취소` → `handleModalClose()`: **`setFieldValue('privateFlag', false)`** + 모달 닫기
- `확인` → `handlePrivateSetting()`: `setFieldValue('privateFlag', true)` + 모달 닫기

> ⚠️ **`<button>` 안에 `<label>`, 그 안에 `<input>`.** 중첩 인터랙티브 요소로 HTML 규격 위반이며
> 접근성 도구에서 문제가 된다. **동작은 위 표대로이며 등가 이관 대상.**
> React에서 재현하려면 `onClick` 전파 순서(label → button)를 정확히 맞춰야 한다.
> → Phase 5 레시피 항목. `[확인 필요]` BD-Q12
>
> ⚠️ **모달 `v-if="isPrivateModalOpen && !boardFormStore.privateFlag"`** — 이중 가드.

## 제출 페이로드

`values.privateFlag !== undefined`이므로 **`formData.privateFlag`가 포함된다.**

## QA 체크리스트

- [ ] AppBar 제목 `민원공간 글 등록`
- [ ] 진입 시 카테고리 드로어 자동 열림
- [ ] 비밀글 체크박스가 **보이는지**
- [ ] 미체크 상태에서 클릭 → 체크 안 되고 모달만 열림
- [ ] 모달 `확인` → 체크됨 / `취소` → 미체크 유지
- [ ] 체크 상태에서 클릭 → 모달 없이 바로 해제
- [ ] 비밀글로 등록한 글이 목록에서 자물쇠로 표시
- [ ] 블랙리스트 사용자 등록 시 **서버 원문 메시지**가 보이는지 (§4 #10, BD-Q2)

---

# B17. 민원공간 글 수정 — `/board/complaints/edit/:postUuid`

`Complaints/ComplaintsEditView.vue` (55줄) — §B10과 대칭

| 항목          | 값                                                                                                         |
| ------------- | ---------------------------------------------------------------------------------------------------------- |
| AppBar 제목   | `민원공간 글 수정`                                                                                         |
| 초기값        | `FormContainer.onMounted` + 카테고리 `watch` (§B10과 동일)                                                 |
| `privateFlag` | `postDetailData?.privateFlag` 주입 → 체크박스 초기 상태                                                    |
| 수정 API      | **#48 `patchComplaintsPost`** — `PATCH /{complaintsUuid}`                                                  |
| 성공          | `navigateBack()` + 토스트 `수정되었습니다`                                                                 |
| 에러 분기     | `BOARD_FILE_UPLOAD_FAIL` / default — **`BOARD_BLACK_LIST` 없음** (§4 #11)                                  |
| 뒤로가기 모달 | `EDIT_BACK_MODAL_DATA`                                                                                     |
| 죽은 인자     | `usePatchComplaintsPost(postDetailUuid.value)` · `useGetComplaintsPostDetail(postDetailUuid.value)` (§5-9) |

**진입 제한**: B13의 더보기에서 `status === 'RECEIVED'`일 때만 도달 가능.
**단 URL 직접 진입은 막히지 않는다** — 라우트 가드 없음. 서버가 거부해야 한다.
→ `[확인 필요]` BD-Q13

**§B10의 초기값 주입 타이밍 문제(BD-Q11)가 여기에도 동일하게 적용된다.**

## QA 체크리스트

- [ ] 진입 시 카테고리·제목·내용·이미지·비밀글이 채워져 있는지
- [ ] 비밀글이었던 글의 체크박스가 켜져 있는지
- [ ] 체크 해제 → 저장 시 공개로 전환되는지
- [ ] 수정 성공 → 토스트 `수정되었습니다`
- [ ] `처리중` 상태 글의 수정 URL 직접 진입 시 서버가 거부하는지 (BD-Q13)

---

# B18. 민원공간 내 활동 — `/board/complaints/activities`

`Complaints/ComplaintsMyActivitiesView.vue` (34줄) — §B11과 완전 대칭

| 항목         | 값                                                                                                           |
| ------------ | ------------------------------------------------------------------------------------------------------------ |
| AppBar       | `민원공간 내 활동` (라우트 meta)                                                                             |
| 작성한 글    | #61 `getComplaintsMyActivityPostList` — `/complaint/my`                                                      |
| 댓글 쓴 글   | #62 `getComplaintsMyActivityCommentList` — `/complaint/my/comment`                                           |
| 쿼리 키      | `['complaintsMyActivityPostList', aptResidentUuid]` / `['complaintsMyActivityCommentList', aptResidentUuid]` |
| `board-type` | `isCommunityBoard ? 'community' : 'complaints'` → **`complaints`**                                           |
| 탭           | `MY_ACTIVITY_TABS` — `작성한 글` / `댓글 쓴 글`                                                              |

**화면 구성·클래스는 §B11과 동일** (`MyActivities` 공용).
`BoardPostListItem`이 `boardType === 'complaints'`이므로 **상태 칩이 표시된다.**
§5-10의 무의미한 `watch`도 동일.

## QA 체크리스트

- [ ] AppBar 제목 `민원공간 내 활동`
- [ ] 목록 아이템에 **상태 칩이 보이는지** (소통공간 내 활동에는 없음)
- [ ] 비밀글 자물쇠 표시
- [ ] 탭 전환·무한스크롤
- [ ] 아이템 클릭 → 민원공간 상세

---

# B19. 게시글 미노출 사용자 관리 — `/board/setting/userBlock`

`Setting/SettingUserBlockView.vue` (27줄) + `SettingUserBlockItem.vue` (84줄)

**진입**: 마이페이지 → `게시판` 그룹 → `게시글 미노출 사용자 관리` (`MyPageMenuList.vue:32`)
이 항목은 **콘텐츠 보유 여부와 무관하게 항상 노출**된다 (`mypage.md` 참조).

## 화면 구성

```
┌─────────────────────────────┐
│ ← 게시글 미노출 사용자 관리    │  라우트 meta AppBar
├─────────────────────────────┤
│ 👤 홍길동      [👁 게시글 안보기]│  차단 해제 상태
│ ─────────────────────────── │
│ 👤 김철수   [🚫 게시글 안보는 중]│  차단 상태
│ ─────────────────────────── │
└─────────────────────────────┘
```

| 요소    | 클래스 (원문)                                                     |
| ------- | ----------------------------------------------------------------- |
| 루트    | `flex h-full w-full flex-col overflow-auto`                       |
| `<ul>`  | `flex w-full flex-col px-0 py-4`                                  |
| 빈 상태 | `<TextEmpty class="flex-1">차단된 사용자가 없습니다.</TextEmpty>` |

## 목록 아이템 — `SettingUserBlockItem`

| 요소        | 클래스 / 값                                                                                                                       |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `<li>`      | `flex w-full items-center justify-between border-b border-b-defaults-tertiary-border-tertiary px-5 py-[15px]`                     |
| 좌측        | `flex items-center gap-[6px]`                                                                                                     |
| 아바타 래퍼 | `flex h-[30px] w-[30px] items-center justify-center overflow-hidden rounded-full border border-defaults-tertiary-border-tertiary` |
| 아바타      | `/assets/images/Profile.svg` alt `프로필 아이콘` `h-[30px] w-[30px]`                                                              |
| 이름        | `text-defaults-secondary-text-secondary pretendard-16SemiBold` — `residentBlockName.replaceAll(',', '') \|\| '이름 없음'`         |

### 버튼 2종

**차단 중** (`isAuthorBlocked === true`):

```html
<button
  type="button"
  class="border-navy-default-border-navy text-navy-default-text-navy pretendard-13SemiBold flex items-center justify-center gap-[5px] rounded-lg border bg-white py-2 pr-4 pl-3 text-center"
  @click="handleUnblockButton"
>
  <img src="/assets/icons/EyeOff.svg" alt="안보기 아이콘" />
  <span>게시글 안보는 중</span>
</button>
```

**해제됨** (`isAuthorBlocked === false`):

```html
<button
  type="button"
  class="bg-navy-default-background-navy pretendard-13SemiBold flex items-center justify-center gap-[5px] rounded-lg py-2 pr-4 pl-3 text-center text-white"
  @click="handleBlockButton"
>
  <img src="/assets/icons/Eye.svg" alt="안보기 아이콘" />
  <span>게시글 안보기</span>
</button>
```

> ⚠️ **두 버튼의 `alt`가 둘 다 `안보기 아이콘`이다.** 아이콘은 `EyeOff`/`Eye`로 다르다.
> → `deferred.md` 「오타·표기」. **이관 시 그대로**
>
> ⚠️ **`text-white`·`bg-white`는 Tailwind 기본 팔레트다.** 디자인 토큰(`text-base-b-white`)을
> 안 쓴 유일한 지점 중 하나. `broken-styles.md`에서 정상 생성 확인됨. 그대로.

## 데이터

**목록**: #21 `getBoardBlockedUserList` — `GET /board/resident/{residentUuid}/block`
쿼리 키 `['boardBlockedUserList', aptResidentUuid]`

**응답 필드**: `residentBlockUuid`, `residentBlockName`

**차단**: #22 `postBoardBlockUser` — `POST /{residentUuid}/block/{authorUuid}`, body `{ authorTextName }`
**해제**: #23 `deleteBoardBlockUser` — `DELETE /{residentUuid}/block/{authorUuid}`

```js
handleUnblockButton: deleteBoardUserUnblockMutation({
  authorUuid: blockedUserInfo?.residentBlockUuid,
})
handleBlockButton: postBoardUserBlockMutation({
  authorUuid: blockedUserInfo?.residentBlockUuid,
  authorTextName: blockedUserInfo?.residentBlockName,
})
```

> ⚠️ **`residentBlockUuid`를 `authorUuid`로 쓴다.** B6의 차단은 `authorAptResidentUuid`를 쓴다.
> 서버가 두 값을 동일하게 취급하는지 확인 필요. → `[확인 필요]` BD-Q14
>
> **`usePostBoardUserBlock`이 `authorTextName.split(',')[0]`으로 잘라 전송한다.**
> B19의 `residentBlockName`은 이미 서버가 저장한 값이라 다시 잘려 나간다.

## 로컬 상태 토글 🔴

```js
const isAuthorBlocked = ref(!!props.blockedUserInfo) // 항상 true (객체가 있으므로)

watch(isDeleteBoardUserUnblockSuccess, (v) => {
  if (v) isAuthorBlocked.value = false
})
watch(isPostBoardUserBlockSuccess, (v) => {
  if (v) isAuthorBlocked.value = true
})
```

> ⚠️ **`useMutation`의 `isSuccess`는 한 번 `true`가 되면 유지된다** (§B6의 좋아요와 같은 문제).
> **각 아이템이 자기 훅 인스턴스를 갖는다**(`v-for` 안에서 컴포넌트가 훅 호출)는 점이
> 그나마 격리를 만든다. 그래도 **같은 아이템에서 해제 → 재차단 → 재해제**를 하면
> 세 번째부터 `watch`가 발화하지 않아 버튼이 안 바뀐다.
> 화면을 나갔다 오면 서버 상태로 복구된다.
> → `deferred.md` 「동작 의심」. **이관 시 그대로 재현**
>
> ⚠️ **목록 무효화가 없다.** 해제해도 목록에서 사라지지 않고 버튼만 바뀐다. **의도된 UX**로 보인다
> (실수로 해제했을 때 바로 되돌릴 수 있게). 그대로.

**토스트**: 차단 `차단되었습니다` / 해제 `차단 해제되었습니다`
**에러**: 둘 다 `default → swalErrorModal({ text: message })` (전용 분기 없음)

## 엣지케이스

| 상황           | 동작                                      |
| -------------- | ----------------------------------------- |
| 로딩 중        | `SpinnerDots` (전체 화면 오버레이)        |
| 0건            | `TextEmpty` — `차단된 사용자가 없습니다.` |
| 해제 후        | 항목 유지, 버튼만 `게시글 안보기`로       |
| 해제 후 재차단 | 버튼이 다시 `게시글 안보는 중`으로        |
| 3회째 토글     | **버튼이 안 바뀜** (위 🔴)                |

## QA 체크리스트

- [ ] 차단 목록이 이름과 함께 표시
- [ ] `게시글 안보는 중` 클릭 → 해제 + 토스트 `차단 해제되었습니다`
- [ ] `게시글 안보기` 클릭 → 차단 + 토스트 `차단되었습니다`
- [ ] **같은 항목을 3회 이상 토글하면 버튼이 멈추는지** (레거시와 동일)
- [ ] 해제해도 목록에서 안 사라지는지
- [ ] 차단된 사용자의 글이 B5·B12 목록에서 빠지는지
- [ ] 0건일 때 `차단된 사용자가 없습니다.`

---

# B20. 게시글 신고 — `/post/report/:postUuid`

`Report/ReportView.vue` (68줄)

**진입**: B6·B13 더보기 드로어 → `게시글 신고하기`
`navigateTo({ path: '/post/report/{uuid}', state: { boardType: 'community' | 'complaints' } })`

## 화면 구성

```
┌─────────────────────────────┐
│ ←      게시글 신고           │  라우트 meta AppBar
├─────────────────────────────┤
│ 신고하는 이유를 알려주세요     │  h2, pretendard-18Bold
│ ┌─────────────────────────┐ │
│ │ 신고 내용을 입력해주세요.  │ │  textarea h-[216px]
│ │                         │ │
│ └─────────────────────────┘ │
│          글자 수 제한 0/300 │
│                             │
│ [        신고하기        ]  │  ButtonBase size=2xl absolute bottom-0
└─────────────────────────────┘
```

| 요소        | 클래스 (원문)                                                                                                                                                                                                                                                             |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 루트        | `flex h-full w-full flex-col items-start gap-[17px] p-5`                                                                                                                                                                                                                  |
| 제목        | `text-defaults-primary-text-primary pretendard-18Bold` → `신고하는 이유를 알려주세요`                                                                                                                                                                                     |
| 폼          | `flex flex-col items-end justify-end gap-[5px] self-stretch`                                                                                                                                                                                                              |
| textarea    | `flex h-[216px] w-full flex-col items-start gap-[10px] self-stretch rounded border border-defaults-tertiary-border-tertiary bg-defaults-secondary-background-mono px-3 py-[10px] font-[Pretendard] pretendard-16Regular placeholder:text-defaults-tertiary-text-tertiary` |
| placeholder | `신고 내용을 입력해주세요.`                                                                                                                                                                                                                                               |
| 카운터 줄   | `flex w-full justify-end gap-1 text-defaults-tertiary-text-tertiary pretendard-13SemiBold`                                                                                                                                                                                |
| 카운터 라벨 | `<span class="font-semibold">글자 수 제한</span>` + `<div>{{ reportText.length }}/300</div>`                                                                                                                                                                              |
| 제출 버튼   | `<ButtonBase type="submit" class="absolute bottom-0 left-0" :color="buttonColor" size="2xl" round-type="square">신고하기</ButtonBase>`                                                                                                                                    |

> ⚠️ **`font-[Pretendard]`가 `pretendard-16Regular`와 중복이다.** 무해. 그대로.
> ⚠️ **`absolute bottom-0 left-0`의 위치 기준 조상이 없다** — 부모 어디에도 `relative`가 없어
> 뷰포트(또는 가장 가까운 positioned 조상)에 붙는다. **레거시 렌더 결과를 실기기에서 확인해
> 그대로 재현할 것.** → `[확인 필요]` BD-Q15

## 글자 수 제한

```js
checkReportTextLimit():
  if (reportText.value.length > 300) reportText.value = reportText.value.substring(0, 300);
```

`@input`마다 실행. **`maxlength` 속성이 아니라 JS 절단**이라 붙여넣기 시 잘린다.

## 버튼 색

```js
buttonColor = reportText.length >= 1 ? 'alerts-error' : 'defaults-secondary'
```

**1글자 이상이면 빨강, 아니면 회색.** `disabled`는 없다 → **빈 내용으로도 제출된다.**

## 제출

```js
handleSubmitForm():
  if (boardType.value === 'community') postCommunityPostReportMutation({ content: reportText.value });
  else                                 postComplaintsPostReportMutation({ content: reportText.value });
```

| 분기        | API                                                         | 성공 시 이동        |
| ----------- | ----------------------------------------------------------- | ------------------- |
| `community` | #44 `postCommunityPostReport` — `/{communityUuid}/report`   | `/board/community`  |
| 그 외       | #60 `postComplaintsPostReport` — `/{complaintsUuid}/report` | `/board/complaints` |

**토스트**: `신고되었습니다`
**에러**: 둘 다 `default → swalErrorModal({ text: message })`

> 🔴 **`boardType`은 `window.history.state`에서 읽는다** (§5-13).
> 새로고침·딥링크 재진입 시 `undefined` → **`else` 분기 → 민원공간 API 호출.**
> 소통공간 글을 신고하려다 민원공간 엔드포인트를 때리고, 성공하면 `/board/complaints`로 이동한다.
>
> **타깃 이관**: react-router `useLocation().state`로 옮긴다. **동작(새로고침 시 오작동)은 동일.**

## 엣지케이스

| 상황                | 동작                                   |
| ------------------- | -------------------------------------- |
| 빈 내용으로 제출    | **제출된다** (버튼만 회색)             |
| 300자 초과 붙여넣기 | 300자로 절단                           |
| 새로고침 후 제출    | 민원공간 API 호출 (🔴 §5-13)           |
| 신고 성공           | 게시판 목록으로 이동 + 토스트          |
| 중복 신고           | 서버 응답에 따름 (전용 에러 분기 없음) |

## QA 체크리스트

- [ ] 1글자 입력 시 버튼이 빨강으로
- [ ] 빈 내용으로도 **제출되는지** (레거시와 동일)
- [ ] 300자 초과 입력이 잘리는지
- [ ] 소통공간 글 신고 → `/board/community`로 이동
- [ ] 민원공간 글 신고 → `/board/complaints`로 이동
- [ ] 토스트 `신고되었습니다`
- [ ] **새로고침 후 제출 시 잘못된 API를 때리는지** (레거시와 동일)
- [ ] 제출 버튼 위치 (BD-Q15)

---

# 이관 지침 요약

## 타깃 슬라이스 구조 (제안)

```
src/features/board/
├── api/
│   ├── notice.ts            # #24~#28
│   ├── globalNotice.ts      # #29~#30
│   ├── community.ts         # #31~#46
│   ├── complaints.ts        # #47~#62
│   └── block.ts             # #21~#23
├── queries/                  # 위 api별 queryOptions / mutation 훅
├── components/
│   ├── BoardPostList.tsx · BoardPostListItem.tsx · BoardPostStatusChip.tsx
│   ├── BoardSearchInput.tsx · WriteButton.tsx
│   ├── detail/   (DetailPost · Info · Content · LikeButton · MoreButton · Comment)
│   ├── comment/  (CommentList · CommentListItem · CommentInput · CommentEdit · CommentReplyWrite)
│   └── form/     (FormContainer · FormDetail · FormCategory · FormBottom · FormImageUpload · FormImagesPreview)
├── pages/                    # 20개 화면
├── hooks/
│   ├── useCommentImageList.ts
│   └── useBoardForm.ts       # RHF FormProvider (구 boardFormStore)
├── constants/board.ts
├── schemas/board.ts
├── types/
└── index.ts                  # 공개 API
```

**`useInfiniteList`·`useInfiniteScrollPosition`·`useKoreanTimeAgo`·`useTextareaAutoResize`·
`useUploadProgress`·`convertFormDataFile`·`formatHtmlText`·`validateQueryEnabledParams`는
`shared/`로 올린다** — 다른 도메인도 쓴다 (`tech-mapping.md`).

**`validImage`는 게시판 전용**이므로 `features/board/`에 둔다.

## 이관 순서 (도메인 내부)

Board는 단일 PR로 처리하기엔 너무 크다. **4개 PR로 쪼갠다.**

| PR  | 범위                             | 선행 조건                                      |
| --- | -------------------------------- | ---------------------------------------------- |
| 1   | 공지사항 B1·B2 + 팝업 B21        | Phase 4 완료 (`convertDeltaToHtml`, Quill CSS) |
| 2   | 아파트먼트 공지 B3·B4 + 설정 B19 | PR 1 (`useInfiniteScrollPosition` 확정)        |
| 3   | 소통공간 B5~B11 + 신고 B20       | PR 2 (`BoardPostList` 확정)                    |
| 4   | 민원공간 B12~B18                 | PR 3 (컴포넌트 100% 재사용)                    |

## 반드시 지켜야 할 것

| #   | 항목                                                                                                           |
| --- | -------------------------------------------------------------------------------------------------------------- |
| 1   | **`queryClient` 기본값을 레거시에 맞춘다** (`staleTime: 0`) — 안 그러면 §5-1이 즉시 발현                       |
| 2   | **쿼리 키 내용을 레거시 그대로 유지** (§5-1·5-2의 결함 포함). 형태만 v5로                                      |
| 3   | `invalidateQueries`를 **객체 시그니처로** 바꾸되 **키는 그대로** (§5-3, 6+4곳)                                 |
| 4   | 좋아요·차단 토글의 **`isSuccess` watch 패턴**을 그대로 (§B6·B19) — `onSuccess` 콜백으로 바꾸면 동작이 달라진다 |
| 5   | 제목 하이라이트의 **`.toLowerCase()`와 문자열 `v-for`** (§5-4·5-5) — `Array.from` 필요                         |
| 6   | 게시글 이미지(gif 허용, 10,000,000B)와 댓글 이미지(gif 불허, 10,485,760B) **분리 유지** (§3-4)                 |
| 7   | 게시글 미리보기와 댓글 미리보기의 **클래스·alt 차이 4가지** 유지 (§B9)                                         |
| 8   | `민원 공간`(공백)/`민원공간`(붙임) **표기 혼용** 유지 (§4 #3·#4·#15)                                           |
| 9   | 민원공간 `BOARD_BLACK_LIST` **미처리 4건** 유지 (§4 #10~#13)                                                   |
| 10  | 비밀글 체크박스의 **중첩 button>label>input 클릭 동작** 재현 (§B16)                                            |
| 11  | `swalErrorModal({ html })`의 **HTML 렌더** 지원 (Base UI Dialog 재현)                                          |
| 12  | 폼 검증 에러를 **모달로만** 표시 (인라인 에러 추가 금지) (§5-11)                                               |
| 13  | 완료 버튼이 **회색이어도 눌리는** 동작 (§5-12)                                                                 |
| 14  | B1의 **`onUpdated` 스크롤 복원**과 나머지의 `useInfiniteScrollPosition`을 **통합하지 않는다**                  |
| 15  | `zod` 3→4: `required_error` 5건 → `error` (§3-11, `zod-migration.md`)                                          |

## 삭제할 것 (등가 영향 없음)

- `NoticeBoardView` 템플릿의 `<!-- 자동 배포 테스트 코드 #2-->`
- `NoticeDetailView` `<style scoped>`의 주석 처리된 `:deep(a)`
- `GlobalNoticeBoardItem`의 `<!-- 필독 칩 & 생성날짜 -->` (필독 칩 없음)
- `TabCategory`에 넘기는 `color="deepBlue"` (3곳, prop 미정의)
- `usePatchCommunityPost(x)` · `useGetCommunityPostDetail(x)` 등 **죽은 인자 4곳** (§5-9)
- `MyActivities` 뷰의 무의미한 `watch` 4개 (§5-10)
- `NoticeBoardView`의 `scrollStorageKey` ref (§B1)
- `ModalButton`의 잘못된 `key="block"` (§B13, 중복)

## 스타일 수정 (`broken-styles.md` 연동)

2차 전수 조사에서 **게시판 영역 2건**이 미생성 클래스로 확정됐다.

| 클래스            | 위치                       | 조치                                            |
| ----------------- | -------------------------- | ----------------------------------------------- |
| `leading-3.5`     | `NoticeBoardItem` 날짜     | `leading-[14px]`로 수정 (`broken-styles.md` §3) |
| `bg-bg-deep-blue` | `BoardPostListItem` 썸네일 | **삭제** (`<img>` 배경이라 효과 없음, §4)       |

`leading-3.5` 수정은 **공지 목록 날짜의 행간이 좁아진다** — 화면이 바뀐다.
`bg-bg-deep-blue` 삭제는 렌더 결과가 동일하다.

---

# 확인 필요 항목

> `broken-styles.md`가 `B-Q1`~`B-Q3`을 쓰므로 게시판은 `BD-Q*`를 쓴다.

| #         | 질문                                                                                                              | 성격        | 진행 차단 |
| --------- | ----------------------------------------------------------------------------------------------------------------- | ----------- | --------- |
| BD-Q1     | `useInfiniteScrollPosition`이 `scrollY`(Ref)를 `JSON.stringify`에 넣는데 실제 저장값이 숫자인지                   | 확인        | 아니오    |
| BD-Q2     | 민원공간에서 `BOARD_BLACK_LIST` 시 서버가 내려주는 `message` 원문이 무엇인지 (§4 #10~#13)                         | 서버 확인   | 아니오    |
| BD-Q3     | 제목 하이라이트의 **글자별 `<span>` DOM 구조**까지 재현할지, 시각적 동일성만 맞출지 (§5-5)                        | **결정**    | 아니오    |
| BD-Q4     | `boardFormStore` 전역 잔존(이탈 후 값 유지)을 RHF로 옮길 때 재현할지 (§5-7)                                       | **결정**    | 아니오    |
| BD-Q5     | `Object.values(additionalParams)` 순서 의존 캐시 키를 그대로 재현할지 (§B1, `useInfiniteList` 전역)               | **결정**    | 아니오    |
| BD-Q6     | B4 본문에 `ql-snow` 래퍼가 없어 B2와 서식이 다른지 (`vue-quill.snow.css` 셀렉터 확인)                             | 확인        | 아니오    |
| BD-Q7     | 실기기 웹뷰에서 `document.cookie`가 유지되는지 — 유지 안 되면 공지 팝업이 매번 뜬다 (§B21)                        | **실기기**  | 아니오    |
| ~~BD-Q8~~ | ~~`bg-bg-deep-blue` 토큰 존재 여부~~ → **해소.** 미생성 확정, 효과 없어 삭제 (`broken-styles.md` §4)              | —           | —         |
| BD-Q9     | `authorText`의 실제 형식 — 쉼표 제거 시 `홍길동101동`처럼 붙어 보이는지 (§B6)                                     | 확인        | 아니오    |
| BD-Q10    | 게시글 `fileList` 응답에 `title` 필드가 있는지 — 없으면 alt가 `undefined 이미지` (§B6)                            | 서버 확인   | 아니오    |
| BD-Q11    | **B10·B17 초기값 주입이 `onMounted`라 상세 캐시가 없으면 폼이 빈다.** 쿼리 키를 레거시대로 둘지, `watch`로 바꿀지 | **결정 🔴** | 아니오    |
| BD-Q12    | 비밀글 `button > label > input` 중첩 클릭 동작을 React에서 어떻게 재현할지 (§B16)                                 | **결정**    | 아니오    |
| BD-Q13    | `처리중`/`처리완료` 민원의 수정 URL 직접 진입을 서버가 거부하는지 (§B17)                                          | 서버 확인   | 아니오    |
| BD-Q14    | B19의 `residentBlockUuid`와 B6의 `authorAptResidentUuid`를 서버가 동일하게 취급하는지                             | 서버 확인   | 아니오    |
| BD-Q15    | B20 제출 버튼 `absolute bottom-0 left-0`의 실제 렌더 위치 (§B20)                                                  | **실기기**  | 아니오    |

**진행을 막는 항목은 없다.** BD-Q11만 이관 착수 전에 결정하면 된다.

---

# 도메인 QA 체크리스트 (통합)

## 네이티브 연동

- [ ] B2 본문 링크 클릭 → `nativeOpenSystemBrowser` (실기기 iOS/Android)
- [ ] B2·B4 첨부파일 다운로드 → `nativeSaveFile` (`?filName=` 오타 포함)
- [ ] 푸시 딥링크 `/board/notice/detail/{uuid}` 진입

## 크로스 도메인

- [ ] 마이페이지 → 게시판 그룹 4개 메뉴 전부 도달
- [ ] 메인 공지 카드 → B1·B2
- [ ] 메인 메뉴 → B5·B12
- [ ] 메인 진입 시 B21 팝업 (투표 팝업과 충돌 없이)

## 등가 대조 (레거시 :3000 ↔ 신규 :5173, 392px 뷰포트)

- [ ] B1 목록 카드 간격·구분선
- [ ] B3·B5·B12 카드 그림자 `2px 2px 8px 0px rgba(19,30,59,0.12)`
- [ ] B2·B4 Quill 본문 서식
- [ ] 상태 칩 3종 색
- [ ] 댓글 대댓글 들여쓰기 `pl-[30px]` + 화살표
- [ ] 댓글 입력창 자동 높이 증가
- [ ] 진행률 오버레이 배경/글자색
- [ ] 폰트 배율 5단계에서 레이아웃 깨짐 없음

## 회귀 위험 지점

- [ ] `staleTime` 기본값 변경 시 §5-1이 발현되는지 (**반드시 0 유지**)
- [ ] `invalidateQueries` v5 전환 후 댓글 등록/삭제가 즉시 반영되는지
- [ ] 좋아요 2회 클릭 시 레거시와 동일하게 UI가 멈추는지
- [ ] B19 3회 토글 시 레거시와 동일하게 버튼이 멈추는지
- [ ] 민원공간 폼 이탈 후 소통공간 등록에 값이 남는지
