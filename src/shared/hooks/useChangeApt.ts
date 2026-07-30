import { useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'

import { APT_CONTENT_NAME } from '@/shared/constants/aptContent'
import { residentDetailInfoQueryKey } from '@/shared/constants/query'
import { hasAptContent } from '@/shared/lib/aptContext'
import { nativeSendChangedResidentInfo } from '@/shared/lib/native/auth'
import { useAuthStore } from '@/shared/stores/authStore'
import type { ResidentApt } from '@/shared/types/resident'

/**
 * 단지를 바꾼다. 레거시 `lib/composables/useChangeApt.js` 이식.
 *
 * ⚠️ **`contentList`를 빈 배열로 리셋한 뒤 무효화한다.** 새 단지의 구독 정보가
 * 오기 전까지 이전 단지의 메뉴가 보이면 안 되기 때문이다.
 *
 * ⚠️ **네이티브 발신에 쓰는 값은 `invalidateQueries` 이후 스토어에서 다시 읽는다.**
 * `useResidentDetailInfo`가 재조회 결과를 `aptInfo`에 적재하므로, 그 뒤에 읽어야
 * 새 단지의 A-PASS·로비폰 여부가 담긴다. 레거시의 순서 의존을 그대로 옮긴 것이다 —
 * 순서를 바꾸면 앱이 이전 단지 기준으로 설정된다.
 */
export const useChangeApt = () => {
  const queryClient = useQueryClient()
  const setAptInfo = useAuthStore((state) => {
    return state.setAptInfo
  })

  return useCallback(
    async ({ newAptInfo }: { newAptInfo: ResidentApt }) => {
      setAptInfo({
        aptResidentUuid: newAptInfo.aptResidentUuid,
        aptName: newAptInfo.aptName,
        aptUuid: newAptInfo.aptUuid,
        contentList: [],
      })

      try {
        await queryClient.invalidateQueries({
          queryKey: residentDetailInfoQueryKey({
            aptResidentUuid: newAptInfo.aptResidentUuid,
          }),
        })

        const { aptResidentUuid, contentList, apassUseFlag, apassOnOffFlag } =
          useAuthStore.getState().aptInfo

        const hasLobbyPhone = hasAptContent({
          contentList,
          contentName: APT_CONTENT_NAME.LOBBY_PHONE,
        })

        nativeSendChangedResidentInfo({
          aptResidentUuid: aptResidentUuid ?? '',
          hasAptApassService: hasAptContent({
            contentList,
            contentName: APT_CONTENT_NAME.APASS,
          }),
          hasResidentApassService: apassUseFlag ?? false,
          isDeviceApassActive: apassOnOffFlag ?? false,
          hasAptLobbyPhoneService: hasLobbyPhone,
          // 레거시가 단지·입주민 모두 같은 값을 보낸다. 입주민별 구분 값이 없다
          hasResidentLobbyPhoneService: hasLobbyPhone,
        })
      } catch (error) {
        console.error('[useChangeApt] 단지 변경에 실패했습니다.', error)
      }
    },
    [queryClient, setAptInfo],
  )
}
