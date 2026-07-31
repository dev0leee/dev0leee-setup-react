import type { AlwaysAllowCar, BookmarkCar } from '@/features/parking/types/parking'
import { API_PREFIX } from '@/shared/constants/api'
import { api } from '@/shared/lib/apiClient'
import type { ServerSuccessBody } from '@/shared/types/api'
import type { InfiniteListFetchParams, PageResponse } from '@/shared/types/infiniteList'

/**
 * 즐겨찾기·항상허용 차량 API. 레거시 `api/parking.js`의 두 구획.
 *
 * ⚠️ **경로가 대칭이 아니다.** 즐겨찾기는 `/{입주민}/bookmark`로 입주민이 앞에 오는데
 * 항상허용은 `/always-allow/list/{입주민}`으로 뒤에 온다. 삭제도 마찬가지로 항상허용은
 * **입주민 uuid를 아예 쓰지 않는다**(`/always-allow/{항상허용uuid}`). 서버 계약이라 그대로다.
 *
 * ⚠️ **항상허용 수정 엔드포인트는 없다.** 화면도 라우트도 없다 (R-1). 만들지 않는다.
 */

/** 즐겨찾기 목록 (PK3 · 불러오기 드로어) */
export const getBookmarkCarList = async ({
  aptResidentUuid,
  page,
  size,
}: InfiniteListFetchParams): Promise<PageResponse<BookmarkCar>> => {
  const response = await api.get<ServerSuccessBody<PageResponse<BookmarkCar>>>(
    `${API_PREFIX.PARKING}/${String(aptResidentUuid)}/bookmark`,
    { params: { page, size } },
  )

  return response.data.success as PageResponse<BookmarkCar>
}

/** 항상허용 목록 (PK4) */
export const getAlwaysAllowCarList = async ({
  aptResidentUuid,
  page,
  size,
}: InfiniteListFetchParams): Promise<PageResponse<AlwaysAllowCar>> => {
  const response = await api.get<ServerSuccessBody<PageResponse<AlwaysAllowCar>>>(
    `${API_PREFIX.PARKING}/always-allow/list/${String(aptResidentUuid)}`,
    { params: { page, size } },
  )

  return response.data.success as PageResponse<AlwaysAllowCar>
}

/** 즐겨찾기 등록 (PK5) */
export const postBookmarkCar = async ({
  aptResidentUuid,
  carNum,
  nickName,
  phone,
}: {
  aptResidentUuid: string
  carNum: string
  nickName: string
  phone: string
}): Promise<void> => {
  await api.post(`${API_PREFIX.PARKING}/${aptResidentUuid}/bookmark`, {
    carNum,
    nickName,
    phone,
  })
}

/** 즐겨찾기 수정 (PK7) */
export const patchBookmarkCar = async ({
  aptResidentUuid,
  bookmarkUuid,
  carNum,
  nickName,
  phone,
}: {
  aptResidentUuid: string
  bookmarkUuid: string
  carNum: string
  nickName: string
  phone: string
}): Promise<void> => {
  await api.patch(`${API_PREFIX.PARKING}/${aptResidentUuid}/bookmark/${bookmarkUuid}`, {
    nickName,
    carNum,
    phone,
  })
}

export const deleteBookmarkCar = async ({
  aptResidentUuid,
  bookmarkUuid,
}: {
  aptResidentUuid: string
  bookmarkUuid: string
}): Promise<void> => {
  await api.delete(`${API_PREFIX.PARKING}/${aptResidentUuid}/bookmark/${bookmarkUuid}`)
}

/**
 * 항상허용 등록 (PK6).
 *
 * ⚠️ **`nickName`을 body에 넣는 자리가 있지만 화면이 채우지 않는다** — 항상허용 폼에
 * 별칭 필드가 없어 항상 `undefined`다. 레거시 API 함수 시그니처 그대로 옮기되
 * 보내지 않는 값은 넘기지 않는다(axios가 `undefined`를 직렬화에서 뺀다).
 */
export const postAlwaysAllowCar = async ({
  aptResidentUuid,
  carNum,
  phone,
  visitPurposeUuid,
  memo,
  notificationFlag,
}: {
  aptResidentUuid: string
  carNum: string
  phone: string
  visitPurposeUuid: string
  memo?: string
  notificationFlag?: boolean
}): Promise<void> => {
  await api.post(`${API_PREFIX.PARKING}/always-allow/${aptResidentUuid}`, {
    carNum,
    phone,
    visitPurposeUuid,
    memo,
    notificationFlag,
  })
}

/** 항상허용 삭제. **입주민 uuid를 쓰지 않는다** — 즐겨찾기와 비대칭이다 */
export const deleteAlwaysAllowCar = async ({
  alwaysAllowUuid,
}: {
  alwaysAllowUuid: string
}): Promise<void> => {
  await api.delete(`${API_PREFIX.PARKING}/always-allow/${alwaysAllowUuid}`)
}
