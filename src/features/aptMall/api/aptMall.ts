import type {
  AptMallDetailData,
  AptMallListItemData,
  AptMallMenuData,
  AptMallMyOrderDetailData,
  AptMallMyOrderListItemData,
  AptMallOrderTimeData,
} from '@/features/aptMall/types/aptMall'
import { API_PREFIX } from '@/shared/constants/api'
import { api } from '@/shared/lib/apiClient'
import type { ServerSuccessBody } from '@/shared/types/api'
import type { InfiniteListFetchParams, PageResponse } from '@/shared/types/infiniteList'

/**
 * 아파트몰 API 8개. 레거시 `api/aptMall.js` 이식 (`endpoints.md` #102~#109).
 *
 * ✅ **레거시 인자명 `mealUuid`를 `aptMallOrderUuid`로 바꿨다.** 경로에 값만 보간되고
 * **이름은 서버에 나가지 않는다** — 요청은 한 글자도 달라지지 않는다
 * (`apt-mall.md` §1 · AM-Q22).
 */
const aptMallPath = ({ aptResidentUuid }: { aptResidentUuid: string }) => {
  return `${API_PREFIX.APARTMANT}/${aptResidentUuid}/apt-mall`
}

export const getAptMallList = async ({
  aptResidentUuid,
}: {
  aptResidentUuid: string
}): Promise<AptMallListItemData[] | undefined> => {
  const response = await api.get<ServerSuccessBody<AptMallListItemData[]>>(
    aptMallPath({ aptResidentUuid }),
  )

  return response.data.success
}

export const getAptMallDetail = async ({
  aptResidentUuid,
  aptMallUuid,
}: {
  aptResidentUuid: string
  aptMallUuid: string
}): Promise<AptMallDetailData | undefined> => {
  const response = await api.get<ServerSuccessBody<AptMallDetailData>>(
    `${aptMallPath({ aptResidentUuid })}/${aptMallUuid}`,
  )

  return response.data.success
}

export const getAptMallMyOrderList = async ({
  aptResidentUuid,
  page,
  size,
}: InfiniteListFetchParams): Promise<PageResponse<AptMallMyOrderListItemData>> => {
  const response = await api.get<ServerSuccessBody<PageResponse<AptMallMyOrderListItemData>>>(
    `${aptMallPath({ aptResidentUuid: String(aptResidentUuid) })}/order`,
    { params: { page, size } },
  )

  return response.data.success as PageResponse<AptMallMyOrderListItemData>
}

export const getAptMallMyOrderDetail = async ({
  aptResidentUuid,
  aptMallOrderUuid,
}: {
  aptResidentUuid: string
  aptMallOrderUuid: string
}): Promise<AptMallMyOrderDetailData | undefined> => {
  const response = await api.get<ServerSuccessBody<AptMallMyOrderDetailData>>(
    `${aptMallPath({ aptResidentUuid })}/order/${aptMallOrderUuid}`,
  )

  return response.data.success
}

export const deleteAptMallMyOrder = async ({
  aptResidentUuid,
  aptMallOrderUuid,
}: {
  aptResidentUuid: string
  aptMallOrderUuid: string
}): Promise<void> => {
  await api.delete(`${aptMallPath({ aptResidentUuid })}/order/${aptMallOrderUuid}`)
}

/** 선택한 날짜의 예약 가능 시간대. `orderDate`는 `YYYY-MM-DD`다 */
export const getAptMallOrderTimeList = async ({
  aptResidentUuid,
  aptMallUuid,
  orderDate,
}: {
  aptResidentUuid: string
  aptMallUuid: string
  orderDate: string
}): Promise<AptMallOrderTimeData[] | undefined> => {
  const response = await api.get<ServerSuccessBody<AptMallOrderTimeData[]>>(
    `${aptMallPath({ aptResidentUuid })}/${aptMallUuid}/order/time`,
    { params: { orderDate } },
  )

  return response.data.success
}

export const getAptMallOrderMenuList = async ({
  aptResidentUuid,
  aptMallUuid,
}: {
  aptResidentUuid: string
  aptMallUuid: string
}): Promise<AptMallMenuData[] | undefined> => {
  const response = await api.get<ServerSuccessBody<AptMallMenuData[]>>(
    `${aptMallPath({ aptResidentUuid })}/${aptMallUuid}/menu`,
  )

  return response.data.success
}

/**
 * 예약 등록 (#109).
 *
 * ⚠️ **`포장`은 `personCount` 키 자체가 없다** — `undefined`가 JSON에서 빠진다.
 */
export const postAptMallOrder = async ({
  aptResidentUuid,
  aptMallUuid,
  ...body
}: {
  aptResidentUuid: string
  aptMallUuid: string
  aptMallOrderMenuList: { aptMallOrderMenuUuid: string; count: number }[]
  aptMallOrderTimeUuid: string
  orderDate: string | undefined
  aptMallOrderType: string
  personCount?: number
  orderNote?: string
}): Promise<void> => {
  await api.post(`${aptMallPath({ aptResidentUuid })}/${aptMallUuid}/order`, body)
}
