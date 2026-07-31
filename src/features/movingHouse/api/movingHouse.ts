import type {
  MovingHouseDetailData,
  MovingHouseHolidayData,
  MovingHouseListItemData,
  MovingHouseSettingData,
  MovingHouseTimeSlotData,
} from '@/features/movingHouse/types/movingHouse'
import { API_PREFIX } from '@/shared/constants/api'
import { api } from '@/shared/lib/apiClient'
import type { ServerSuccessBody } from '@/shared/types/api'

/**
 * 이사예약 API 7개. 레거시 `api/movingHouse.js` 이식 (`endpoints.md` #124~#130).
 *
 * ⚠️ **목록에 페이징이 없다** (#124) — 예약이 많은 세대는 전부 한 번에 온다.
 * `useInfiniteList`를 쓰지 않는 몇 안 되는 목록 도메인이다.
 */
const movingPath = ({ aptResidentUuid }: { aptResidentUuid: string }) => {
  return `${API_PREFIX.BOARD}/${aptResidentUuid}/move`
}

export const getMovingHouseList = async ({
  aptResidentUuid,
  moveReservationStatus,
}: {
  aptResidentUuid: string
  moveReservationStatus: string | undefined
}): Promise<MovingHouseListItemData[] | undefined> => {
  const response = await api.get<ServerSuccessBody<MovingHouseListItemData[]>>(
    `${movingPath({ aptResidentUuid })}/reservation`,
    { params: { moveReservationStatus } },
  )

  return response.data.success
}

export const getMovingHouseDetail = async ({
  aptResidentUuid,
  movingUuid,
}: {
  aptResidentUuid: string
  movingUuid: string
}): Promise<MovingHouseDetailData | undefined> => {
  const response = await api.get<ServerSuccessBody<MovingHouseDetailData>>(
    `${movingPath({ aptResidentUuid })}/reservation/${movingUuid}`,
  )

  return response.data.success
}

export const deleteMovingHouseReceipt = async ({
  aptResidentUuid,
  movingUuid,
}: {
  aptResidentUuid: string
  movingUuid: string
}): Promise<void> => {
  await api.delete(`${movingPath({ aptResidentUuid })}/reservation/${movingUuid}`)
}

export const getMovingHouseSetting = async ({
  aptResidentUuid,
}: {
  aptResidentUuid: string
}): Promise<MovingHouseSettingData | undefined> => {
  const response = await api.get<ServerSuccessBody<MovingHouseSettingData>>(
    `${movingPath({ aptResidentUuid })}/setting`,
  )

  return response.data.success
}

/** 선택한 날짜의 시간대 슬롯. `moveDate`는 `YYYY-MM-DD`다 */
export const getMovingHouseReservationTimeList = async ({
  aptResidentUuid,
  moveDate,
}: {
  aptResidentUuid: string
  moveDate: string | undefined
}): Promise<MovingHouseTimeSlotData[] | undefined> => {
  const response = await api.get<ServerSuccessBody<MovingHouseTimeSlotData[]>>(
    `${movingPath({ aptResidentUuid })}/reservation-time`,
    { params: { moveDate } },
  )

  return response.data.success
}

export const getMovingHouseHolidayList = async ({
  aptResidentUuid,
}: {
  aptResidentUuid: string
}): Promise<MovingHouseHolidayData[] | undefined> => {
  const response = await api.get<ServerSuccessBody<MovingHouseHolidayData[]>>(
    `${movingPath({ aptResidentUuid })}/setting/move-holiday`,
  )

  return response.data.success
}

/**
 * 예약 등록 (#130).
 *
 * ⚠️ **폼의 `moveTime`이 `moveReservationTimeUuid`로 이름이 바뀐다.** 호출부가 변환한다.
 */
export const postMovingHouse = async ({
  aptResidentUuid,
  ...body
}: {
  aptResidentUuid: string
  moveType: string
  moveDate: string | undefined
  moveReservationTimeUuid: string
  depositorName?: string
  emergencyPhone?: string
  memo?: string
}): Promise<void> => {
  await api.post(`${movingPath({ aptResidentUuid })}/reservation`, body)
}
