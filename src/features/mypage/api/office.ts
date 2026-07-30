import type { OfficeBusinessHour, OfficeContact } from '@/features/mypage/types/mypage'
import { API_PREFIX } from '@/shared/constants/api'
import { api } from '@/shared/lib/apiClient'
import type { ServerSuccessBody } from '@/shared/types/api'

/**
 * 관리사무소 정보 (`endpoints.md` #142 #143).
 *
 * ⚠️ **키가 `aptUuid`다** — 다른 마이페이지 API는 `aptResidentUuid`(입주민 단위)인데
 * 관리사무소는 단지 단위 정보라 다르다. 쿼리 키도 그에 맞춘다.
 */

export const getOfficeBusinessHours = async ({
  aptUuid,
}: {
  aptUuid: string
}): Promise<OfficeBusinessHour[]> => {
  const response = await api.get<ServerSuccessBody<OfficeBusinessHour[]>>(
    `${API_PREFIX.APARTMANT}/office/${aptUuid}`,
  )
  return response.data.success ?? []
}

/** 부서별 연락처. 경로가 `department`다 */
export const getOfficeContactList = async ({
  aptUuid,
}: {
  aptUuid: string
}): Promise<OfficeContact[]> => {
  const response = await api.get<ServerSuccessBody<OfficeContact[]>>(
    `${API_PREFIX.APARTMANT}/department/${aptUuid}`,
  )
  return response.data.success ?? []
}
