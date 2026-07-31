import type {
  GlobalNoticeDetail,
  GlobalNoticeListItem,
  NoticeCategory,
  NoticeDetail,
  NoticeListItem,
  NoticePopupThumbnail,
} from '@/features/board/types/notice'
import { API_PREFIX } from '@/shared/constants/api'
import { api } from '@/shared/lib/apiClient'
import type { ServerSuccessBody } from '@/shared/types/api'
import type { InfiniteListFetchParams, PageResponse } from '@/shared/types/infiniteList'

/**
 * 공지 계보 API. 레거시 `api/board.js`의 공지사항·전체 공지사항 구획 이식.
 *
 * ⚠️ **공지사항은 `aptUuid`(단지), 아파트먼트 공지는 `aptResidentUuid`(입주민) 기준이다.**
 * 같은 게시판 접두사를 쓰지만 식별자가 다르다 — 서버 계약이라 그대로 옮긴다.
 */

/** 공지 카테고리 목록. B1 탭이 쓴다 */
export const getNoticeCategoryList = async ({
  aptUuid,
}: {
  aptUuid: string
}): Promise<NoticeCategory[]> => {
  const response = await api.get<ServerSuccessBody<NoticeCategory[]>>(
    `${API_PREFIX.BOARD}/notice/${aptUuid}/category`,
  )

  return response.data.success ?? []
}

/**
 * 공지 목록 (B1). `useInfiniteList`가 부른다.
 * `aptUuid`는 팩토리가 `defaultStoreKey`로 주입한다.
 */
export const getNoticeList = async ({
  aptUuid,
  page,
  size,
  keyword,
  categoryUuid,
}: InfiniteListFetchParams): Promise<PageResponse<NoticeListItem>> => {
  const response = await api.get<ServerSuccessBody<PageResponse<NoticeListItem>>>(
    `${API_PREFIX.BOARD}/notice/${String(aptUuid)}`,
    { params: { page, size, keyword, categoryUuid } },
  )

  return response.data.success as PageResponse<NoticeListItem>
}

/** 공지 상세 (B2) */
export const getNoticeDetail = async ({
  aptUuid,
  noticeUuid,
}: {
  aptUuid: string
  noticeUuid: string
}): Promise<NoticeDetail | undefined> => {
  const response = await api.get<ServerSuccessBody<NoticeDetail>>(
    `${API_PREFIX.BOARD}/notice/${aptUuid}/${noticeUuid}`,
  )

  return response.data.success
}

/**
 * 팝업 공지 (B21) — 썸네일이 있고 생성 7일 이내인 최신 1건.
 * ⚠️ **대상이 없으면 `{}`가 온다.** `uuid`가 있어야 팝업을 띄운다.
 */
export const getNoticePopupThumbnail = async ({
  aptUuid,
}: {
  aptUuid: string
}): Promise<NoticePopupThumbnail | undefined> => {
  const response = await api.get<ServerSuccessBody<NoticePopupThumbnail>>(
    `${API_PREFIX.BOARD}/notice/${aptUuid}/top1-thumbnail`,
  )

  return response.data.success
}

/** 아파트먼트 공지 목록 (B3). 카테고리 필터가 없어 `keyword`만 받는다 */
export const getGlobalNoticeList = async ({
  aptResidentUuid,
  page,
  size,
  keyword,
}: InfiniteListFetchParams): Promise<PageResponse<GlobalNoticeListItem>> => {
  const response = await api.get<ServerSuccessBody<PageResponse<GlobalNoticeListItem>>>(
    `${API_PREFIX.BOARD}/${String(aptResidentUuid)}/apartmant-notice`,
    { params: { page, size, keyword } },
  )

  return response.data.success as PageResponse<GlobalNoticeListItem>
}

/** 아파트먼트 공지 상세 (B4). 경로의 `apartmant` 철자는 서버 계약이다 */
export const getGlobalNoticeDetail = async ({
  aptResidentUuid,
  apartmantNoticeUuid,
}: {
  aptResidentUuid: string
  apartmantNoticeUuid: string
}): Promise<GlobalNoticeDetail | undefined> => {
  const response = await api.get<ServerSuccessBody<GlobalNoticeDetail>>(
    `${API_PREFIX.BOARD}/${aptResidentUuid}/apartmant-notice/${apartmantNoticeUuid}`,
  )

  return response.data.success
}
