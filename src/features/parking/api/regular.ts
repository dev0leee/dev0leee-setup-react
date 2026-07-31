import type { RegularCar } from '@/features/parking/types/parking'
import { API_PREFIX } from '@/shared/constants/api'
import { api } from '@/shared/lib/apiClient'
import type { ServerSuccessBody } from '@/shared/types/api'
import type { InfiniteListFetchParams, PageResponse } from '@/shared/types/infiniteList'

/**
 * 세대에 등록된 정기권 차량 (PK15 · PK1 임베드).
 * 레거시 `api/parking.js`의 `getRegularCarList`.
 */
export const getRegularCarList = async ({
  aptResidentUuid,
  page,
  size,
}: InfiniteListFetchParams): Promise<PageResponse<RegularCar>> => {
  const response = await api.get<ServerSuccessBody<PageResponse<RegularCar>>>(
    `${API_PREFIX.PARKING}/${String(aptResidentUuid)}/regular/household`,
    { params: { page, size } },
  )

  return response.data.success as PageResponse<RegularCar>
}
