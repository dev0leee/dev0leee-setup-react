import { useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'

import { APT_CONTENT_NAME } from '@/shared/constants/aptContent'
import { residentDetailInfoQueryKey } from '@/shared/constants/query'
import { fetchResidentDetailInfo, hasAptContent } from '@/shared/lib/aptContext'
import { nativeSendChangedResidentInfo } from '@/shared/lib/native/auth'
import { useAuthStore } from '@/shared/stores/authStore'
import type { ResidentApt } from '@/shared/types/resident'

/**
 * 단지를 바꾼다. 레거시 `lib/composables/useChangeApt.js` 이식.
 *
 * ⚠️ **`contentList`를 빈 배열로 리셋한 뒤 새 단지를 조회한다.** 새 구독 정보가 오기
 * 전까지 이전 단지의 메뉴가 보이면 안 되기 때문이다.
 *
 * ⚠️ **네이티브 발신 값을 스토어가 아니라 조회 응답에서 직접 읽는다** — 레거시와 다른
 * 유일한 지점이고 `main.md` §5에서 확정된 방침이다.
 *
 * 레거시는 `invalidateQueries` 뒤에 `authStore.getAptInfo()`를 읽으면서
 * **"`useGetResidentDetailInfo`의 `watch`가 이미 새 값을 써넣었을 것"** 이라고 가정한다.
 * 그 가정이 깨지면 `contentList`가 방금 비운 `[]`이라 A-PASS·로비폰이 **둘 다 false로
 * 앱에 전송된다.** React에서는 그 가정이 더 위험하다 — `await`가 풀리는 시점은
 * 마이크로태스크이고 적재는 `useEffect`(렌더 이후)라 **거의 항상 effect보다 먼저 온다.**
 *
 * `fetchQuery`는 캐시에 결과를 써서 화면 갱신은 그대로 일으키고(같은 키를 보는
 * `useQuery`가 마운트돼 있다) 응답을 값으로도 돌려준다. 요청은 1회다.
 * **정상 동작 시 결과가 레거시와 같으므로 등가 이관 위배가 아니다** (`deferred.md` D-36).
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
        const aptResidentUuid = newAptInfo.aptResidentUuid ?? ''

        const residentDetailInfo = await queryClient.fetchQuery({
          queryKey: residentDetailInfoQueryKey({ aptResidentUuid }),
          queryFn: () => {
            return fetchResidentDetailInfo({ aptResidentUuid })
          },
          // 방금 바꾼 단지의 값을 반드시 새로 받는다. staleTime을 상속하면 캐시가 나온다.
          staleTime: 0,
        })

        const contentList = residentDetailInfo?.contentList

        const hasLobbyPhone = hasAptContent({
          contentList,
          contentName: APT_CONTENT_NAME.LOBBY_PHONE,
        })

        nativeSendChangedResidentInfo({
          aptResidentUuid,
          hasAptApassService: hasAptContent({
            contentList,
            contentName: APT_CONTENT_NAME.APASS,
          }),
          hasResidentApassService: residentDetailInfo?.apassUseFlag ?? false,
          isDeviceApassActive: residentDetailInfo?.apassOnOffFlag ?? false,
          hasAptLobbyPhoneService: hasLobbyPhone,
          // 레거시가 단지·입주민 모두 같은 값을 보낸다. 입주민별 구분 값이 없다
          hasResidentLobbyPhoneService: hasLobbyPhone,
        })
      } catch (error) {
        // 레거시도 삼킨다. 단지 전환 자체는 이미 스토어에 반영됐다.
        console.error('[useChangeApt] 단지 변경에 실패했습니다.', error)
      }
    },
    [queryClient, setAptInfo],
  )
}
