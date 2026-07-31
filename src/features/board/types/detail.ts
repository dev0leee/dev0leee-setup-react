/** 게시글·댓글에 붙는 이미지 한 건 */
export interface BoardAttachedImage {
  fileUuid?: string
  /** S3 접두사가 없는 상대 경로 */
  fileUrl?: string
  /** 정렬 기준. 상세 조회에서 이 값으로 다시 정렬한다 */
  orderNum?: number
  /**
   * ⚠️ **응답에 없을 가능성이 있다.** 게시글 이미지 `alt`가 `` `${title} 이미지` ``라
   * 값이 없으면 `undefined 이미지`가 된다 (`board.md` BD-Q10 — 서버 확인 대상).
   */
  title?: string
}

/**
 * 게시글 상세 (B6·B13).
 *
 * ⚠️ **식별자 필드가 게시판마다 다르다** — `communityUuid` / `complaintUuid`.
 * ⚠️ `status`는 민원에만 온다. 있으면 처리상태 칩이 붙고 `RECEIVED`가 아니면 수정·삭제가 막힌다.
 */
export interface BoardPostDetail {
  communityUuid?: string
  complaintUuid?: string
  title?: string
  /** ⚠️ **Quill Delta가 아니라 평문이다.** `formatHtmlText`로 줄바꿈만 바꾼다 */
  content?: string
  categoryName?: string
  createdDate?: string
  viewCount?: number
  likeCount?: number
  commentCount?: number
  /** 내가 이미 좋아요를 눌렀는지 */
  likeFlag?: boolean
  privateFlag?: boolean
  status?: string
  /** ⚠️ **쉼표로 이어붙인 문자열이다** (예: `홍길동,101동`). 화면마다 다르게 자른다 */
  authorText?: string
  authorAptResidentUuid?: string
  fileList?: BoardAttachedImage[]
}

/**
 * 댓글 표시 상태. **이름과 본문 노출이 상태마다 다르다** (`board.md` §CommentListItem).
 * 서버 값이므로 바꾸지 않는다.
 */
export const COMMENT_STATE = {
  SHOW: 'SHOW',
  /** 작성자가 탈퇴함. 본문은 계속 보인다 */
  RESIDENT_DELETE: 'RESIDENT_DELETE',
  /** 관리사무소 작성 */
  ADMIN: 'ADMIN',
  DELETE: 'DELETE',
  BLOCK: 'BLOCK',
} as const

/** `SHOW`가 아닐 때 이름 자리에 표시할 문구 */
export const COMMENT_AUTHOR_STATE_TEXT: Record<string, string> = {
  [COMMENT_STATE.DELETE]: '삭제된 댓글',
  [COMMENT_STATE.RESIDENT_DELETE]: '탈퇴된 회원의 댓글',
  [COMMENT_STATE.BLOCK]: '차단된 회원의 댓글',
  [COMMENT_STATE.ADMIN]: '관리사무소',
}

/** 댓글 한 건. 대댓글은 `childCommentList`에 1단계만 담긴다 */
export interface BoardComment {
  commentUuid: string
  content?: string
  createdDate?: string
  state?: string
  authorText?: string
  authorAptResidentUuid?: string
  fileList?: BoardAttachedImage[]
  childCommentList?: BoardComment[]
}

/** 댓글 등록·수정이 보내는 값. 신규 `File`과 기존 이미지가 섞여 있다 */
export interface CommentSubmitPayload {
  content: string
  fileList: (File | BoardAttachedImage)[]
}

/**
 * 차단한 사용자 한 건 (B19).
 *
 * ⚠️ **`residentBlockUuid`를 차단·해제 API의 `authorUuid`로 쓴다.** 상세 화면(B6)의
 * 차단은 `authorAptResidentUuid`를 쓴다 — 서버가 두 값을 같게 취급하는지 확인 대상이다
 * (`board.md` BD-Q14).
 */
export interface BlockedUser {
  residentBlockUuid: string
  /** 쉼표로 이어진 문자열. 표시할 때 쉼표를 지운다 */
  residentBlockName: string
}

/** 게시글 등록·수정이 보내는 값 */
export interface BoardPostSubmitPayload {
  title: string | null
  content: string | null
  categoryUuid: string | null
  fileList: (File | BoardAttachedImage)[]
  /** ⚠️ 민원공간에만 있다. 소통공간에서는 아예 넣지 않는다 */
  privateFlag?: boolean
}
