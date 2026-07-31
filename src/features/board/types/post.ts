/**
 * 소통공간(community)과 민원공간(complaints)은 거의 대칭이지만 **17군데가 다르다**
 * (`board.md` §4). 그 차이를 타입과 상수로 붙잡아 둔다.
 */

/** 게시판 종류. 경로·API·라벨이 이 값으로 갈린다 */
export const BOARD_TYPE = {
  COMMUNITY: 'community',
  COMPLAINTS: 'complaints',
} as const

export type BoardType = (typeof BOARD_TYPE)[keyof typeof BOARD_TYPE]

/**
 * 민원 처리 상태. `RECEIVED`가 아니면 수정·삭제가 막힌다 (§4 #8).
 * 소통공간 응답에는 이 필드가 없다.
 */
export const COMPLAINT_STATUS = {
  RECEIVED: 'RECEIVED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
} as const

export type ComplaintStatus = (typeof COMPLAINT_STATUS)[keyof typeof COMPLAINT_STATUS]

/** 게시판 카테고리 한 건. `TabCategory`가 `category`를 라벨로 쓴다 */
export interface BoardCategory {
  uuid?: string
  category: string
}

/**
 * 목록 아이템 한 건.
 *
 * ⚠️ **글 식별자 필드 이름이 게시판마다 다르다** — 소통은 `communityUuid`,
 * 민원은 `complaintUuid`(**단수**)다 (§4 #2). 둘 다 optional로 두고 읽을 때 고른다.
 */
export interface BoardPostListItemData {
  communityUuid?: string
  complaintUuid?: string
  title?: string
  categoryName?: string
  createdDate?: string
  viewCount?: number
  likeCount?: number
  commentCount?: number
  /** 비밀글. 목록에 자물쇠가 붙는다. **소통공간 응답에는 오지 않는다** */
  privateFlag?: boolean
  /** 민원 전용. 있으면 상태 칩이 붙는다 */
  status?: string
  /** S3 접두사가 없는 상대 경로 */
  thumbnailFileUrl?: string
}
