import type { InOutCar, InOutCarDetail } from '@/features/parking/types/parking'
import { API_PREFIX } from '@/shared/constants/api'
import { api } from '@/shared/lib/apiClient'
import type { ServerSuccessBody } from '@/shared/types/api'
import type { InfiniteListFetchParams, PageResponse } from '@/shared/types/infiniteList'

/**
 * 입출차 내역 (PK8).
 *
 * ⚠️ **마일리지 목록과 달리 정렬이 제대로 전달된다** — 훅이 보내는 이름(`desc`)과
 * 이 함수가 받는 이름이 같다. 마일리지 쪽은 `isLatest`/`isDesc`로 어긋나 있다 (D-237).
 *
 * ⚠️ **`carType` 파라미터를 아무도 채우지 않는다.** 필터 UI가 없다. 시그니처만 남긴다.
 */
export const getInOutCarList = async ({
  aptResidentUuid,
  page,
  size,
  startDate,
  endDate,
  desc,
  carType,
}: InfiniteListFetchParams): Promise<PageResponse<InOutCar>> => {
  const response = await api.get<ServerSuccessBody<PageResponse<InOutCar>>>(
    `${API_PREFIX.PARKING}/inout-parking/${String(aptResidentUuid)}`,
    { params: { page, size, startDate, endDate, desc, carType } },
  )

  return response.data.success as PageResponse<InOutCar>
}

/** 입출차 차량 상세 (PK9). 네이티브 푸시 딥링크가 이 화면으로 들어온다 */
export const getInOutCarDetail = async ({
  aptResidentUuid,
  parkingUuid,
}: {
  aptResidentUuid: string
  parkingUuid: string
}): Promise<InOutCarDetail | undefined> => {
  const response = await api.get<ServerSuccessBody<InOutCarDetail>>(
    `${API_PREFIX.PARKING}/inout-parking/${aptResidentUuid}/${parkingUuid}`,
  )

  return response.data.success
}
