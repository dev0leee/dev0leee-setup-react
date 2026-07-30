/**
 * 쿼리 키. **레거시 문자열 그대로다** — 키가 달라지면 무효화 대상이 어긋난다
 * (`docs/migration/query-keys.md`).
 *
 * 단지 컨텍스트가 키에 들어가는 이유: 단지를 바꾸면 같은 화면이라도 다른 데이터다.
 * 레거시가 `aptResidentUuid`·`aptUuid` 중 무엇을 쓰는지도 그대로 옮겼다 —
 * 관리사무소 정보만 `aptUuid`(단지 단위)이고 나머지는 입주민 단위다.
 */
export const NOTIFICATION_SETTING_QUERY_KEY = ['notificationSetting'] as const
export const LOBBY_PHONE_PUSH_ALARM_QUERY_KEY = ['lobbyPhonePushAlarmState'] as const

export const notificationSettingQueryKey = ({
  aptResidentUuid,
}: {
  aptResidentUuid: string | undefined
}) => {
  return [...NOTIFICATION_SETTING_QUERY_KEY, aptResidentUuid] as const
}

export const lobbyPhonePushAlarmQueryKey = ({
  aptResidentUuid,
}: {
  aptResidentUuid: string | undefined
}) => {
  return [...LOBBY_PHONE_PUSH_ALARM_QUERY_KEY, aptResidentUuid] as const
}

export const officeContactListQueryKey = ({ aptUuid }: { aptUuid: string | undefined }) => {
  return ['officeContactList', aptUuid] as const
}

export const officeBusinessHoursQueryKey = ({ aptUuid }: { aptUuid: string | undefined }) => {
  return ['officeBusinessHours', aptUuid] as const
}
