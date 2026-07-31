/**
 * 게시판 공개 API.
 *
 * ⚠️ 아직 **공지 계보(B1~B4·B21)와 목록 계열(B5·B12·B11·B18)만** 이관됐다.
 * 상세·댓글·글쓰기는 이어지는 단계에서 붙인다 (`progress.md`).
 */
export { NoticePopupModal } from '@/features/board/components/NoticePopupModal'
export { CommunityBoardPage, ComplaintsBoardPage } from '@/features/board/pages/BoardPostListPage'
export { GlobalNoticeBoardPage } from '@/features/board/pages/GlobalNoticeBoardPage'
export { GlobalNoticeDetailPage } from '@/features/board/pages/GlobalNoticeDetailPage'
export {
  CommunityMyActivitiesPage,
  ComplaintsMyActivitiesPage,
} from '@/features/board/pages/MyActivitiesPage'
export { NoticeBoardPage } from '@/features/board/pages/NoticeBoardPage'
export { NoticeDetailPage } from '@/features/board/pages/NoticeDetailPage'
