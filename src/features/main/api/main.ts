import type {
  ImposeYearMonthsResponse,
  ManagementFeeBill,
  ParkingMileage,
} from '@/features/main/types/main'
import { API_PREFIX } from '@/shared/constants/api'
import { api } from '@/shared/lib/apiClient'
import type { ServerSuccessBody } from '@/shared/types/api'

/**
 * 메인 카드가 읽는 요약 엔드포인트.
 *
 * ⚠️ **다른 도메인의 데이터를 읽는다** — 관리비·주차·게시판. 그래도 `features/main/api/`에
 * 두는 이유는 **feature는 다른 feature를 import할 수 없기** 때문이다. 대시보드 성격의
 * 화면은 필연적으로 남의 데이터를 읽고, 상세 화면이 쓰는 쿼리와는 키·파라미터·가공이
 * 다르다. 각 도메인이 이관되면 그쪽은 자기 함수를 갖는다 (`recipe.md` §1).
 */

/** 조회 가능한 관리비 년월 목록 */
export const getImposeYearMonths = async ({
  aptResidentUuid,
}: {
  aptResidentUuid: string
}): Promise<string[]> => {
  const response = await api.get<ServerSuccessBody<ImposeYearMonthsResponse>>(
    `${API_PREFIX.APARTMANT}/${aptResidentUuid}/bill/impose-yearmonths`,
  )

  return response.data.success?.imposeYearmonths ?? []
}

/**
 * 관리비 고지서.
 *
 * ⚠️ **쿼리 파라미터 이름이 `startDateTIme`·`endDateTIme`다** (`I`가 대문자).
 * 서버 계약이라 고치면 조회가 깨진다 (`deferred.md` D-9).
 */
export const getManagementFeeBill = async ({
  aptResidentUuid,
  startDateTime,
  endDateTime,
}: {
  aptResidentUuid: string
  startDateTime: string
  endDateTime: string
}): Promise<ManagementFeeBill | undefined> => {
  const response = await api.get<ServerSuccessBody<ManagementFeeBill>>(
    `${API_PREFIX.APARTMANT}/${aptResidentUuid}/bill`,
    { params: { startDateTIme: startDateTime, endDateTIme: endDateTime } },
  )

  return response.data.success
}

/**
 * 주차 마일리지. 응답의 `useMileage`·`remainingMileage`를 더해 `totalMileage`를 만든다 —
 * 서버가 총량을 주지 않아 클라이언트가 계산한다(레거시 `select` 동일).
 */
export const getParkingRemainingMileage = async ({
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
