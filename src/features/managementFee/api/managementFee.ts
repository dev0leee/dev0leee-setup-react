import type {
  ImposeYearMonthsData,
  ManagementFeeBillData,
} from '@/features/managementFee/types/managementFee'
import { API_PREFIX } from '@/shared/constants/api'
import { api } from '@/shared/lib/apiClient'
import type { ServerSuccessBody } from '@/shared/types/api'

/**
 * 관리비 API 2개. 레거시 `api/managementFee.js` 이식 (`endpoints.md` #146~#147).
 *
 * **조회 전용 도메인이다** — mutation이 없어 무효화 문제도 없다.
 */
const managementFeePath = ({ aptResidentUuid }: { aptResidentUuid: string }) => {
  return `${API_PREFIX.APARTMANT}/${aptResidentUuid}/bill`
}

export const getImposeYearMonths = async ({
  aptResidentUuid,
}: {
  aptResidentUuid: string
}): Promise<ImposeYearMonthsData | undefined> => {
  const response = await api.get<ServerSuccessBody<ImposeYearMonthsData>>(
    `${managementFeePath({ aptResidentUuid })}/impose-yearmonths`,
  )

  return response.data.success
}

/**
 * 고지서 조회 (#147).
 *
 * 🔴 **쿼리 키가 `startDateTIme`·`endDateTIme`다 — 대문자 `I`가 들어간 오타지만 서버 계약이다.**
 * 고치면 조회가 통째로 깨진다 (`deferred.md` D-9 · **이관 중 절대 수정 금지**로 확정).
 * 함수 인자명만 정상 표기(`startDateTime`)를 쓴다.
 *
 * ⚠️ **날짜 형식이 공백 구분이다** (`2026-07-01 00:00:00`) — ISO `T`가 아니다.
 */
export const getManagementFeeBill = async ({
  aptResidentUuid,
  startDateTime,
  endDateTime,
}: {
  aptResidentUuid: string
  startDateTime: string
  endDateTime: string
}): Promise<ManagementFeeBillData | undefined> => {
  const response = await api.get<ServerSuccessBody<ManagementFeeBillData>>(
    managementFeePath({ aptResidentUuid }),
    {
      params: {
        startDateTIme: startDateTime,
        endDateTIme: endDateTime,
      },
    },
  )

  return response.data.success
}
