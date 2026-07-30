import type { NotificationSetting } from '@/features/mypage/types/mypage'
import { API_PREFIX } from '@/shared/constants/api'
import { api } from '@/shared/lib/apiClient'
import type { ServerSuccessBody } from '@/shared/types/api'

/** 마이페이지 — 프로필·비밀번호·탈퇴·알림 통합 (`endpoints.md` #10 #17 #18 #19 #20) */

/**
 * 닉네임 수정.
 *
 * ⚠️ **닉네임만 보낸다.** 폼에는 이름 필드도 있지만 읽기 전용이고 서버로 가지 않는다
 * (`mypage.md` P3). 이름은 성공 후 localStorage 갱신에만 쓰인다.
 */
export const patchMyProfile = async ({
  aptResidentUuid,
  nickName,
}: {
  aptResidentUuid: string
  nickName: string
}): Promise<void> => {
  await api.patch(`${API_PREFIX.APARTMANT}/apt-resident/${aptResidentUuid}/info`, { nickName })
}

/** 비밀번호 변경. **폼 필드명과 요청 필드명이 다르다** (`currentPassword` → `oldPassword`) */
export const patchPasswordEdit = async ({
  oldPassword,
  password,
}: {
  oldPassword: string
  password: string
}): Promise<void> => {
  await api.patch(`${API_PREFIX.APARTMANT}/password`, { oldPassword, password })
}

/** 회원 탈퇴. 경로가 접두사 자체다 — 뒤에 아무것도 붙지 않는다 */
export const deleteAccount = async (): Promise<void> => {
  await api.delete(API_PREFIX.APARTMANT)
}

/** 알림 설정 통합 조회. 토글 6종의 기본값이 여기서 온다 */
export const getNotificationSetting = async ({
  aptResidentUuid,
}: {
  aptResidentUuid: string
}): Promise<NotificationSetting | undefined> => {
  const response = await api.get<ServerSuccessBody<NotificationSetting>>(
    `${API_PREFIX.APARTMANT}/apt-resident/${aptResidentUuid}/notification-setting`,
  )
  return response.data.success
}

/**
 * 마케팅·광고성 동의 변경. **두 플래그를 항상 함께 보낸다** —
 * 한쪽만 보내는 API가 없어서 양방향 연동이 클라이언트 책임이 됐다
 * (`mypage.md` P4 `changeTermsState`).
 *
 * 응답에 변경 후 플래그와 변경 일시가 담겨 오고, 화면은 조회값보다 이것을 우선한다.
 */
export const putMarketingConsent = async ({
  aptResidentUuid,
  marketingDataConsentFlag,
  receiveAdvertsConsentFlag,
}: {
  aptResidentUuid: string
  marketingDataConsentFlag: boolean
  receiveAdvertsConsentFlag: boolean
}): Promise<NotificationSetting | undefined> => {
  const response = await api.put<ServerSuccessBody<NotificationSetting>>(
    `${API_PREFIX.APARTMANT}/apt-resident/${aptResidentUuid}/notification-setting/marketing-consent`,
    { marketingDataConsentFlag, receiveAdvertsConsentFlag },
  )
  return response.data.success
}
