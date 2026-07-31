/**
 * 게시판 쿼리 키. 문자열은 레거시 그대로다 (`query-keys.md`).
 *
 * 무한목록 2종(`noticeList`·`globalNoticeList`)의 키는 `useInfiniteList` 팩토리가
 * 조립하므로 여기에는 **접두사 문자열만** 둔다.
 */

/** B1 공지 목록. 팩토리가 `[이 값, aptUuid, ...파라미터값]`으로 만든다 */
export const NOTICE_LIST_QUERY_KEY = 'noticeList'

/** B3 아파트먼트 공지 목록. 팩토리가 `[이 값, aptResidentUuid, keyword]`로 만든다 */
export const GLOBAL_NOTICE_LIST_QUERY_KEY = 'globalNoticeList'

export const noticeCategoryListQueryKey = ({ aptUuid }: { aptUuid: string | undefined }) => {
  return ['noticeCategoryList', aptUuid] as const
}

export const noticeDetailQueryKey = ({
  aptUuid,
  noticeUuid,
}: {
  aptUuid: string | undefined
  noticeUuid: string | undefined
}) => {
  return ['noticeDetail', aptUuid, noticeUuid] as const
}

export const noticePopupThumbnailQueryKey = ({ aptUuid }: { aptUuid: string | undefined }) => {
  return ['noticePopupThumbnail', aptUuid] as const
}

/** B5·B12 게시글 목록. 팩토리가 `[이 값, aptResidentUuid, ...파라미터값]`으로 만든다 */
export const BOARD_POST_LIST_QUERY_KEY = {
  community: 'communityPostList',
  complaints: 'complaintsPostList',
} as const

/** B11·B18 내 활동. 게시판 × 탭 = 4종 */
export const MY_ACTIVITY_QUERY_KEY = {
  community: {
    posts: 'communityMyActivityPostList',
    comments: 'communityMyActivityCommentList',
  },
  complaints: {
    posts: 'complaintsMyActivityPostList',
    comments: 'complaintsMyActivityCommentList',
  },
} as const

/**
 * 게시글 상세 (B6·B13).
 *
 * 🔴 **레거시 키에는 `postUuid`가 없어 모든 글이 한 캐시 슬롯을 공유했다.**
 * `staleTime: 0`이 유일한 방어막이라 값이 바뀌는 순간 다른 글이 보인다.
 * **넣어서 고쳤다** — 수정 화면 초기값 주입도 함께 고쳐야 동작한다
 * (2026-07-31 BD-Q11 확정 · `deferred.md` D-225·D-226).
 */
export const boardPostDetailQueryKey = ({
  boardType,
  aptResidentUuid,
  postUuid,
}: {
  boardType: 'community' | 'complaints'
  aptResidentUuid: string | undefined
  postUuid: string | undefined
}) => {
  return [`${boardType}PostDetail`, aptResidentUuid, postUuid] as const
}

/**
 * 댓글 목록.
 *
 * 🔴 **레거시 키의 세 번째 요소는 항상 `undefined`였다** — `getParams().uuid`를 읽는데
 * 그런 라우트 파라미터가 없다. 상세 키와 같은 이유로 `postUuid`를 넣어 고쳤다 (D-225).
 */
export const boardCommentListQueryKey = ({
  boardType,
  aptResidentUuid,
  postUuid,
}: {
  boardType: 'community' | 'complaints'
  aptResidentUuid: string | undefined
  postUuid: string | undefined
}) => {
  return [`${boardType}CommentList`, aptResidentUuid, postUuid] as const
}

/** 댓글 1건 상세 (B7 답글 작성 · B8 댓글 수정) */
export const boardCommentDetailQueryKey = ({
  boardType,
  aptResidentUuid,
  postUuid,
  commentUuid,
}: {
  boardType: 'community' | 'complaints'
  aptResidentUuid: string | undefined
  postUuid: string | undefined
  commentUuid: string | undefined
}) => {
  return [`${boardType}CommentDetail`, aptResidentUuid, postUuid, commentUuid] as const
}

/** B19 차단한 사용자 목록 */
export const boardBlockedUserListQueryKey = ({
  aptResidentUuid,
}: {
  aptResidentUuid: string | undefined
}) => {
  return ['boardBlockedUserList', aptResidentUuid] as const
}

export const boardCategoryListQueryKey = ({
  boardType,
  aptResidentUuid,
}: {
  boardType: 'community' | 'complaints'
  aptResidentUuid: string | undefined
}) => {
  return [`${boardType}CategoryList`, aptResidentUuid] as const
}

export const globalNoticeDetailQueryKey = ({
  aptResidentUuid,
  globalNoticeUuid,
}: {
  aptResidentUuid: string | undefined
  globalNoticeUuid: string | undefined
}) => {
  return ['globalNoticeDetail', aptResidentUuid, globalNoticeUuid] as const
}
