import { AlarmSettingGroupItem } from '@/features/mypage/components/AlarmSettingGroupItem'
import { MYPAGE_EMPTY_TEXT } from '@/features/mypage/constants/mypage'
import { useAlarmSetting } from '@/features/mypage/hooks/useAlarmSetting'
import { SpinnerDots } from '@/shared/components/common/SpinnerDots'
import { TextEmpty } from '@/shared/components/common/TextEmpty'

/**
 * 알림 설정 (P4). 레거시 `AlarmSettingView.vue` 이식.
 *
 * ⚠️ 빈 상태 문구는 **조회 실패가 아니라 구독 그룹이 0개**일 때 나온다.
 * 조회 실패는 `useNotificationSetting`이 에러 화면으로 보낸다.
 * 마케팅 그룹은 항상 `isActive: true`라 실제로는 0개가 되지 않는다 —
 * 방어용 분기를 그대로 옮긴 것이다.
 */
export const AlarmSettingPage = () => {
  const { isResidentDetailInfoLoading, isNotificationSettingLoading, alarmGroups } =
    useAlarmSetting()

  const isLoading = isResidentDetailInfoLoading || isNotificationSettingLoading

  return (
    <div className="h-full w-full space-y-2 overflow-auto bg-defaults-secondary-background-mono pb-10">
      {isLoading && <SpinnerDots />}

      {!isLoading &&
        (alarmGroups.length > 0 ? (
          alarmGroups.map((group) => {
            return (
              <AlarmSettingGroupItem key={group.title} title={group.title} items={group.items} />
            )
          })
        ) : (
          <div className="flex h-full items-center justify-center bg-defaults-primary-background-primary">
            <TextEmpty>{MYPAGE_EMPTY_TEXT.ALARM_SETTING}</TextEmpty>
          </div>
        ))}
    </div>
  )
}
