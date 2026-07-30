import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import { getNotificationSetting } from '@/features/mypage/api/mypage'
import { notificationSettingQueryKey } from '@/features/mypage/constants/query'
import { ROUTE_PATH } from '@/shared/constants/routes'
import { useAuthStore } from '@/shared/stores/authStore'

/**
 * 알림 설정 통합 조회. 레거시 `useGetNotificationSetting.js` 이식.
 *
 * ⚠️ **실패하면 에러 화면으로 보낸다.** 레거시가 `watch(isError)`로 `/error-auth`로
 * 이동시킨다 — 토글을 그릴 기본값이 없으면 화면이 성립하지 않기 때문이다.
 * 빈 상태(`알림 설정을 불러올 수 없습니다.`)는 조회 실패가 아니라
 * **구독 그룹이 0개일 때** 보이는 것이다.
 */
export const useNotificationSetting = () => {
  const aptResidentUuid = useAuthStore((state) => {
    return state.aptInfo.aptResidentUuid
  })
  const navigate = useNavigate()

  const {
    data: notificationSetting,
    isLoading: isNotificationSettingLoading,
    isError,
  } = useQuery({
    queryKey: notificationSettingQueryKey({ aptResidentUuid }),
    queryFn: () => {
      return getNotificationSetting({ aptResidentUuid: aptResidentUuid ?? '' })
    },
    enabled: Boolean(aptResidentUuid),
  })

  useEffect(() => {
    if (!isError) return
    void navigate(ROUTE_PATH.ERROR_AUTH)
  }, [isError, navigate])

  return { notificationSetting, isNotificationSettingLoading }
}
