import type { AttachedFile } from '@/shared/types/file'

/**
 * 공지 유형. `IMPORTANT`면 목록에 빨간 `필독` 칩이 붙는다.
 * 서버 값이므로 바꾸지 않는다.
 */
export const NOTICE_TYPE = {
  IMPORTANT: 'IMPORTANT',
} as const

/** 공지 카테고리 한 건. `TabCategory`가 `category`를 라벨로 쓴다 */
export interface NoticeCategory {
  uuid?: string
  /** ⚠️ 탭 라벨은 `category`, 목록 아이템 칩은 `categoryName`이다 — 필드가 다르다 */
  category: string
}

/** 공지 목록 아이템 (B1) */
export interface NoticeListItem {
  uuid: string
  title?: string
  categoryName?: string
  noticeType?: string
  createdDate?: string
  viewCount?: number
}

/** 공지 상세 (B2). 제목도 Quill Delta다 */
export interface NoticeDetail {
  uuid?: string
  /** ⚠️ Delta JSON이다. `convertDeltaToHtml`을 거쳐야 한다 */
  title?: string
  content?: string
  categoryName?: string
  createdDate?: string
  viewCount?: number
  fileList?: AttachedFile[]
}

/** 팝업 공지 (B21). 대상이 없으면 서버가 `{}`를 준다 — `uuid` 유무로 판단한다 */
export interface NoticePopupThumbnail {
  uuid?: string
  title?: string
  /** S3 접두사가 없는 상대 경로 */
  thumbnailFilePath?: string
}

/** 아파트먼트 공지 목록 아이템 (B3) */
export interface GlobalNoticeListItem {
  uuid: string
  title?: string
  categoryName?: string
  createdDate?: string
}

/**
 * 아파트먼트 공지 상세 (B4).
 *
 * ⚠️ **B2와 필드 이름이 다르다.** 첨부는 `fileList`가 아니라 `uploadFileList`이고
 * 경로 필드가 `fileUrl`이 아니라 `filePath`다. 제목도 Delta가 아니라 **평문**이다.
 */
export interface GlobalNoticeDetail {
  uuid?: string
  /** 평문이다. B2와 달리 Delta 변환을 하지 않는다 */
  title?: string
  content?: string
  categoryName?: string
  createdDate?: string
  uploadFileList?: GlobalNoticeFile[]
}

/** B4 첨부. `FileAttachment`에 넘길 때 `filePath` → `fileUrl`로 바꿔 준다 */
export interface GlobalNoticeFile {
  uuid?: string
  fileName: string
  filePath: string
}
