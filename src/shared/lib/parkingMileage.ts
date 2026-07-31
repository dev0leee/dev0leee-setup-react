import { API_PREFIX } from '@/shared/constants/api'
import { api } from '@/shared/lib/apiClient'
import type { ServerSuccessBody } from '@/shared/types/api'
import type { ParkingMileage } from '@/shared/types/parking'

/**
 * 잔여·사용 주차 마일리지. 레거시 `api/parking.js`의 `getParkingRemainingMileage`.
 *
 * **메인 카드(`features/main`)와 주차 화면(`features/parking`)이 같이 쓴다.**
 * 레거시도 두 곳이 같은 훅(`useGetParkingRemainingMileage`)을 호출했다.
 *
 * ⚠️ **`startDate`·`endDate`에 시각까지 붙여 보낸다** — 호출부가 `00:00:00`·`23:59:59`를
 * 이어 붙인 문자열을 넘긴다. 서버가 날짜만으로는 경계를 포함하지 않는다.
 */
export const fetchParkingRemainingMileage = async ({
  aptResidentUuid,
  startDate,
  endDate,
}: {
  aptResidentUuid: string
  startDate: string
  endDate: string
}): Promise<ParkingMileage> => {
  const response = await api.get<
    ServerSuccessBody<{ useMileage: number; remainingMileage: number }>
  >(`${API_PREFIX.PARKING}/${aptResidentUuid}/mileage`, { params: { startDate, endDate } })

  const useMileage = response.data.success?.useMileage ?? 0
  const remainingMileage = response.data.success?.remainingMileage ?? 0

  return { useMileage, remainingMileage, totalMileage: useMileage + remainingMileage }
}
