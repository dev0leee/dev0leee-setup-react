import { useCallback } from 'react'

import { getLoginInfo, getResidentAptList } from '@/features/auth/api/auth'
import { APT_SERVICE_NAME } from '@/features/auth/constants/loginInfo'
import type { LoginInfo } from '@/features/auth/types/auth'
import { nativeSendInitialResidentInfo } from '@/shared/lib/native/auth'
import { useAuthStore } from '@/shared/stores/authStore'

/** `contentList`에서 서비스 보유 여부를 본다. **`trim()`이 필수다** */
export const hasAptService = ({
  loginInfo,
  serviceName,
}: {
  loginInfo: LoginInfo | undefined
  serviceName: string
}): boolean => {
  return (
    loginInfo?.contentList?.some((content) => {
      return content.name.trim() === serviceName
    }) ?? false
  )
}

/**
 * 로그인 직후 단지 컨텍스트를 채우고 네이티브에 입주민 정보를 발신한다.
 * 레거시 `lib/composables/useLoginData.js` 이식.
 *
 * ⚠️ **실패해도 throw하지 않는다.** 레거시가 `catch`에서 `console.error`만 하고
 * 넘어간다 — 여기서 던지면 로그인 자체가 실패로 보인다.
 * 다만 `aptInfo`가 비어 있으면 라우터 가드를 통과하지 못한다.
 */
export const useLoginData = () => {
  const setAptInfo = useAuthStore((state) => {
    return state.setAptInfo
  })

  return useCallback(async () => {
    try {
      // 두 요청을 병렬로 보낸다(레거시도 Promise.all).
      const [loginInfo, residentAptList] = await Promise.all([getLoginInfo(), getResidentAptList()])

      // aptUuid는 login/info에 없어서 단지 목록에서 uuid로 찾아온다.
      const matchedApt = residentAptList.find((apt) => {
        return apt.aptResidentUuid === loginInfo?.uuid
      })

      setAptInfo({
        aptResidentUuid: loginInfo?.uuid,
        aptName: loginInfo?.aptName,
        aptUuid: matchedApt?.aptUuid,
        aptId: loginInfo?.aptId,
        residentName: loginInfo?.name,
        residentNickName: loginInfo?.nickName,
        communityToken: loginInfo?.oldApartmantToken,
        aptLogoFileUrl: loginInfo?.aptLogoFileUrl,
      })

      const hasLobbyPhone = hasAptService({
        loginInfo,
        serviceName: APT_SERVICE_NAME.LOBBY_PHONE,
      })

      nativeSendInitialResidentInfo({
        aptResidentUuid: loginInfo?.uuid ?? '',
        hasAptApassService: hasAptService({ loginInfo, serviceName: APT_SERVICE_NAME.APASS }),
        hasResidentApassService: loginInfo?.apassUseFlag ?? false,
        isDeviceApassActive: loginInfo?.apassOnOffFlag ?? false,
        hasAptLobbyPhoneService: hasLobbyPhone,
        // 레거시가 단지·입주민 모두 같은 값을 보낸다. 입주민별 구분 값이 없다
        hasResidentLobbyPhoneService: hasLobbyPhone,
      })
    } catch (error) {
      console.error('[useLoginData] 로그인 정보 적재에 실패했습니다.', error)
    }
  }, [setAptInfo])
}
