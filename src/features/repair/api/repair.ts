import type { AxiosProgressEvent } from 'axios'

import type {
  RepairDetailData,
  RepairListItemData,
  RepairStatusCount,
} from '@/features/repair/types/repair'
import { API_PREFIX } from '@/shared/constants/api'
import { api } from '@/shared/lib/apiClient'
import type { ServerSuccessBody } from '@/shared/types/api'
import type { InfiniteListFetchParams, PageResponse } from '@/shared/types/infiniteList'

/**
 * 하자보수 API. 레거시 `api/repair.js` 이식.
 *
 * ⚠️ **경로에 `aptUuid`와 `aptResidentUuid`를 둘 다 요구한다** — 레거시 150개 엔드포인트
 * 중 이 도메인만 그렇다. 쿼리 키에도 둘이 모두 들어간다(그래서 단지 전환에 가장 안전하다).
 */
const repairPath = ({ aptUuid, aptResidentUuid }: { aptUuid: string; aptResidentUuid: string }) => {
  return `${API_PREFIX.BOARD}/repair/${aptUuid}/${aptResidentUuid}`
}

export const getRepairStatusCount = async (params: {
  aptUuid: string
  aptResidentUuid: string
}): Promise<RepairStatusCount | undefined> => {
  const response = await api.get<ServerSuccessBody<RepairStatusCount>>(
    `${repairPath(params)}/state-list`,
  )

  return response.data.success
}

export const getRepairList = async ({
  aptUuid,
  aptResidentUuid,
  page,
  size,
  state,
}: InfiniteListFetchParams): Promise<PageResponse<RepairListItemData>> => {
  const response = await api.get<ServerSuccessBody<PageResponse<RepairListItemData>>>(
    `${repairPath({ aptUuid: String(aptUuid), aptResidentUuid: String(aptResidentUuid) })}/list`,
    { params: { page, size, state } },
  )

  return response.data.success as PageResponse<RepairListItemData>
}

export const getRepairDetail = async ({
  repairUuid,
  ...params
}: {
  aptUuid: string
  aptResidentUuid: string
  repairUuid: string
}): Promise<RepairDetailData | undefined> => {
  const response = await api.get<ServerSuccessBody<RepairDetailData>>(
    `${repairPath(params)}/${repairUuid}`,
  )

  return response.data.success
}

export const deleteRepairReceipt = async ({
  repairUuid,
  ...params
}: {
  aptUuid: string
  aptResidentUuid: string
  repairUuid: string
}): Promise<void> => {
  await api.delete(`${repairPath(params)}/${repairUuid}`)
}

/**
 * 접수 등록 (RP2). **multipart**다.
 *
 * ⚠️ **`Content-Type`을 명시한다** — 안면인식(V11)은 axios에 맡긴다. 결과는 같다.
 */
export const postRepairSubmission = async ({
  formData,
  onUploadProgress,
  ...params
}: {
  aptUuid: string
  aptResidentUuid: string
  formData: FormData
  onUploadProgress?: (event: AxiosProgressEvent) => void
}): Promise<void> => {
  await api.post(repairPath(params), formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress,
  })
}

/**
 * 접수 수정 (RP3). **PATCH도 multipart**다.
 * 기존 첨부는 `fileUuid`로, 새 첨부는 `file`로 보내 유지 여부가 갈린다.
 */
export const patchRepairSubmission = async ({
  repairUuid,
  formData,
  onUploadProgress,
  ...params
}: {
  aptUuid: string
  aptResidentUuid: string
  repairUuid: string
  formData: FormData
  onUploadProgress?: (event: AxiosProgressEvent) => void
}): Promise<void> => {
  await api.patch(`${repairPath(params)}/${repairUuid}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress,
  })
}
