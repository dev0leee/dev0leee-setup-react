import type { LobbyPhonePushAlarmState, NotificationSetting } from '@/features/mypage/types/mypage'
import { API_PREFIX } from '@/shared/constants/api'
import { api } from '@/shared/lib/apiClient'
import type { ServerSuccessBody } from '@/shared/types/api'

/**
 * 알림 토글 API (`endpoints.md` #64 #65 #66 #112 #113).
 *
 * ⚠️ 레거시는 이 셋을 `api/parking.js`에 뒀지만 **경로는 `apartmant` 접두사**다.
 * 주차 알림이라 파일만 주차 쪽에 있었던 것이다. 알림 설정 화면만 쓰므로 여기로 모았다.
 *
 * ⚠️ **메서드가 섞여 있다** — 정기/외부는 `PUT`, 월패드는 `PATCH`, 로비폰은 `PUT`.
 * 서버 계약이므로 통일하지 않는다.
 */

export const putRegularPush = async ({
  aptResidentUuid,
  regularPushFlag,
}: {
  aptResidentUuid: string
  regularPushFlag: boolean
}): Promise<NotificationSetting | undefined> => {
  const response = await api.put<ServerSuccessBody<NotificationSetting>>(
    `${API_PREFIX.APARTMANT}/apt-resident/${aptResidentUuid}/notification-setting/regular-push`,
    { regularPushFlag },
  )
  return response.data.success
}

export const putExternalPush = async ({
  aptResidentUuid,
  externalPushFlag,
}: {
  aptResidentUuid: string
  externalPushFlag: boolean
}): Promise<NotificationSetting | undefined> => {
  const response = await api.put<ServerSuccessBody<NotificationSetting>>(
    `${API_PREFIX.APARTMANT}/apt-resident/${aptResidentUuid}/notification-setting/external-push`,
    { externalPushFlag },
  )
  return response.data.success
}

export const patchWallPadNotification = async ({
  aptResidentUuid,
  wallPadParkingNotificationFlag,
}: {
  aptResidentUuid: string
  wallPadParkingNotificationFlag: boolean
}): Promise<NotificationSetting | undefined> => {
  const response = await api.patch<ServerSuccessBody<NotificationSetting>>(
    `${API_PREFIX.APARTMANT}/apt-resident/${aptResidentUuid}/notification-setting/wall-pad`,
    { wallPadParkingNotificationFlag },
  )
  return response.data.success
}

export const getLobbyPhonePushAlarmState = async ({
  aptResidentUuid,
}: {
  aptResidentUuid: string
}): Promise<LobbyPhonePushAlarmState | undefined> => {
  const response = await api.get<ServerSuccessBody<LobbyPhonePushAlarmState>>(
    `${API_PREFIX.APARTMANT}/${aptResidentUuid}/lobby-phone/push`,
  )
  return response.data.success
}

/**
 * 로비폰 알림 토글.
 *
 * ⚠️ **본문이 없다.** 서버가 현재 값을 뒤집는다 — 그래서 화면이 원하는 상태를
 * 보낼 수 없고, 성공 후 재조회로만 결과를 안다 (다른 토글은 응답값을 바로 쓴다).
 */
export const putLobbyPhonePushAlarmState = async ({
  aptResidentUuid,
}: {
  aptResidentUuid: string
}): Promise<void> => {
  await api.put(`${API_PREFIX.APARTMANT}/${aptResidentUuid}/lobby-phone/push`)
}

/** 탈퇴 시 로비폰 서버에도 알린다 (`endpoints.md` #115) */
export const deleteLobbyPhoneResident = async ({
  aptResidentUuid,
}: {
  aptResidentUuid: string
}): Promise<void> => {
  await api.delete(`${API_PREFIX.APARTMANT}/${aptResidentUuid}/lobby-phone/resident`)
}
