import type { ParkingPolicy } from '@/features/parking/types/parking'
import { API_PREFIX } from '@/shared/constants/api'
import { api } from '@/shared/lib/apiClient'
import type { ServerSuccessBody } from '@/shared/types/api'

/**
 * 우리 아파트 주차 정책 (PK1 드로어). 레거시 `api/parking.js`의 `getParkingPolicy`.
 *
 * ⚠️ **`yearMonthDate`는 이번 달 1일로 고정**이다. 정책이 월마다 바뀔 수 있어
 * 서버가 기준월을 요구하는데, 화면에는 월 선택이 없다.
 */
export const getParkingPolicy = async ({
  aptResidentUuid,
  yearMonthDate,
}: {
  aptResidentUuid: string
  yearMonthDate: string
}): Promise<ParkingPolicy | undefined> => {
  const response = await api.get<ServerSuccessBody<ParkingPolicy>>(
    `${API_PREFIX.PARKING}/${aptResidentUuid}/parking-policy`,
    { params: { yearMonthDate } },
  )

  return response.data.success
}
