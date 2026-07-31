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
