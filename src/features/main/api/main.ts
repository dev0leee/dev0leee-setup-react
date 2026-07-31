import type {
  ImposeYearMonthsResponse,
  ManagementFeeBill,
  NoticeTopThreeItem,
  ShoppingToken,
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

// 주차 마일리지는 **주차 도메인과 공유**하므로 `shared/lib/parkingMileage.ts`에 있다.

/** 최근 공지 3건. 단지 단위라 `aptUuid`로 조회한다 (다른 요약 API와 달리 입주민 uuid가 아니다) */
export const getNoticeTopThree = async ({
  aptUuid,
}: {
  aptUuid: string
}): Promise<NoticeTopThreeItem[]> => {
  const response = await api.get<ServerSuccessBody<NoticeTopThreeItem[]>>(
    `${API_PREFIX.BOARD}/notice/${aptUuid}/top-three`,
  )

  return response.data.success ?? []
}

/**
 * 쇼핑몰 SSO 토큰. 자동 조회하지 않고 사용자가 쇼핑몰을 누를 때만 부른다.
 *
 * ⚠️ 받은 토큰 4개를 **외부 사이트 쿼리스트링에 그대로 실어 보낸다** — 레거시 그대로다
 * (`deferred.md` D-39).
 */
export const getShoppingToken = async (): Promise<ShoppingToken | undefined> => {
  const response = await api.get<ServerSuccessBody<ShoppingToken>>(
    `${API_PREFIX.APARTMANT}/commerce/token`,
  )

  return response.data.success
}

/** 마케팅·광고성 수신 동의 저장. 쇼핑 약관 바텀시트가 동의·거절 모두에서 부른다 */
export const putMarketingConsent = async ({
  aptResidentUuid,
  marketingDataConsentFlag,
  receiveAdvertsConsentFlag,
}: {
  aptResidentUuid: string
  marketingDataConsentFlag: boolean
  receiveAdvertsConsentFlag: boolean
}): Promise<void> => {
  await api.put(
    `${API_PREFIX.APARTMANT}/apt-resident/${aptResidentUuid}/notification-setting/marketing-consent`,
    { marketingDataConsentFlag, receiveAdvertsConsentFlag },
  )
}
