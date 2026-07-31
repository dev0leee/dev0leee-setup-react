import type { ReservationCar, ReservationCarDetail } from '@/features/parking/types/parking'
import { API_PREFIX } from '@/shared/constants/api'
import { api } from '@/shared/lib/apiClient'
import type { ServerSuccessBody } from '@/shared/types/api'
import type { InfiniteListFetchParams, PageResponse } from '@/shared/types/infiniteList'

/**
 * 방문예약 API. 레거시 `api/parking.js`의 방문예약 구획.
 *
 * ⚠️ **목록만 경로 끝에 `/list`가 붙는다.** 상세·등록·삭제는 붙지 않는다.
 */

export const getReservationCarList = async ({
  aptResidentUuid,
  page,
  size,
  startDate,
  endDate,
}: InfiniteListFetchParams): Promise<PageResponse<ReservationCar>> => {
  const response = await api.get<ServerSuccessBody<PageResponse<ReservationCar>>>(
    `${API_PREFIX.PARKING}/reservation/${String(aptResidentUuid)}/list`,
    { params: { page, size, startDate, endDate } },
  )

  return response.data.success as PageResponse<ReservationCar>
}

export const getReservationCarDetail = async ({
  aptResidentUuid,
  parkingUuid,
}: {
  aptResidentUuid: string
  parkingUuid: string
}): Promise<ReservationCarDetail | undefined> => {
  const response = await api.get<ServerSuccessBody<ReservationCarDetail>>(
    `${API_PREFIX.PARKING}/reservation/${aptResidentUuid}/${parkingUuid}`,
  )

  return response.data.success
}

/**
 * 방문예약 등록 (PK12·PK13).
 *
 * ⚠️ **날짜는 `YYYY-MM-DD 00:00:00` / `YYYY-MM-DD 23:59:59` 문자열이다.** 시각을 붙이는
 * 것과 타임존 보정은 호출부(mutation)가 한다 — 자정 근처에서 하루 밀리는 것을 막는다.
 */
export const postReservationCar = async ({
  aptResidentUuid,
  carNum,
  inParkingScheduledDate,
  outParkingScheduledDate,
  phone,
  visitPurposeUuid,
  memo,
  notificationFlag,
}: {
  aptResidentUuid: string
  carNum: string
  inParkingScheduledDate: string
  outParkingScheduledDate: string
  phone: string
  visitPurposeUuid: string
  memo?: string
  notificationFlag?: boolean
}): Promise<void> => {
  await api.post(`${API_PREFIX.PARKING}/reservation/${aptResidentUuid}`, {
    carNum,
    inParkingScheduledDate,
    outParkingScheduledDate,
    phone,
    visitPurposeUuid,
    memo,
    notificationFlag,
  })
}

export const deleteReservedCar = async ({
  aptResidentUuid,
  reservationUuid,
}: {
  aptResidentUuid: string
  reservationUuid: string
}): Promise<void> => {
  await api.delete(`${API_PREFIX.PARKING}/reservation/${aptResidentUuid}/${reservationUuid}`)
}
