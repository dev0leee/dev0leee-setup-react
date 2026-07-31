/**
 * 게시판 공개 API.
 *
 * ⚠️ 글 등록·수정(B9·B10·B16·B17) · 신고(B20) · 미노출 사용자(B19)는 아직이다
 * (`progress.md` board 4/4).
 */
export { NoticePopupModal } from '@/features/board/components/NoticePopupModal'
export {
  CommunityCommentEditPage,
  ComplaintsCommentEditPage,
} from '@/features/board/pages/CommentEditPage'
export {
  CommunityCommentReplyWritePage,
  ComplaintsCommentReplyWritePage,
} from '@/features/board/pages/CommentReplyWritePage'
export {
  CommunityDetailPage,
  ComplaintsDetailPage,
} from '@/features/board/pages/BoardPostDetailPage'
export { CommunityBoardPage, ComplaintsBoardPage } from '@/features/board/pages/BoardPostListPage'
export { GlobalNoticeBoardPage } from '@/features/board/pages/GlobalNoticeBoardPage'
export { GlobalNoticeDetailPage } from '@/features/board/pages/GlobalNoticeDetailPage'
export {
  CommunityMyActivitiesPage,
  ComplaintsMyActivitiesPage,
} from '@/features/board/pages/MyActivitiesPage'
export { NoticeBoardPage } from '@/features/board/pages/NoticeBoardPage'
export { NoticeDetailPage } from '@/features/board/pages/NoticeDetailPage'
