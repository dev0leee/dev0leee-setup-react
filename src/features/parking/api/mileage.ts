import type { MileageHistoryItem } from '@/features/parking/types/parking'
import { API_PREFIX } from '@/shared/constants/api'
import { api } from '@/shared/lib/apiClient'
import type { ServerSuccessBody } from '@/shared/types/api'
import type { InfiniteListFetchParams, PageResponse } from '@/shared/types/infiniteList'

/**
 * 마일리지 사용 내역 (PK2). 레거시 `api/parking.js`의 `getParkingMileageList`.
 *
 * ⚠️ **경로에서 `inout-parking`이 uuid 앞에 온다** — 다른 주차 엔드포인트는
 * `/{uuid}/...` 형태인데 여기만 `/inout-parking/{uuid}/mileage`다. 서버 계약이라 그대로다.
 *
 * 🔴 **정렬 파라미터가 서버에 전달되지 않는다.** 이 함수는 `isDesc`를 받는데
 * 호출하는 훅은 `isLatest`를 보낸다 — 이름이 어긋나 `isDesc`가 항상 `undefined`이고
 * axios가 빈 파라미터를 떨어뜨린다. 화면에 정렬 토글이 없어 사용자는 체감할 수 없고,
 * 서버 기본 정렬이 적용된다. **등가 이관이라 고치지 않는다** (`deferred.md`).
 */
export const getParkingMileageList = async ({
  aptResidentUuid,
  page,
  size,
  startDate,
  endDate,
  isDesc,
}: InfiniteListFetchParams): Promise<PageResponse<MileageHistoryItem>> => {
  const response = await api.get<ServerSuccessBody<PageResponse<MileageHistoryItem>>>(
    `${API_PREFIX.PARKING}/inout-parking/${String(aptResidentUuid)}/mileage`,
    { params: { page, size, startDate, endDate, isDesc } },
  )

  return response.data.success as PageResponse<MileageHistoryItem>
}
