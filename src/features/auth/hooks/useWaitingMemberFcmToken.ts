import { useCallback } from 'react'

import { getWaitingMemberLoginInfo } from '@/features/auth/api/auth'
import type { LoginPayload } from '@/features/auth/types/auth'
import { APT_CONTENT_NAME } from '@/shared/constants/aptContent'
import { hasAptContent } from '@/shared/lib/aptContext'
import { nativeSendInitialResidentInfo } from '@/shared/lib/native/auth'
import { nativeEndSplash } from '@/shared/lib/native/common'
import { cleanPhoneHyphen } from '@/shared/utils/cleanPhoneHyphen'

/**
 * 미승인 입주민의 정보를 앱에 미리 발신한다.
 * 레거시 `lib/composables/useWaitingMemberFcmToken.js` 이식.
 *
 * 목적은 **FCM 토큰을 서버에 등록시키는 것**이다. 그래야 승인 결과를 문자 대신
 * 푸시로 보낼 수 있다. 로그인이 `RESIDENT_NOT_APPROVED`로 실패한 직후에 부른다.
 */
export const useWaitingMemberFcmToken = () => {
  return useCallback(async ({ id, password }: LoginPayload) => {
    const loginInfo = await getWaitingMemberLoginInfo({
      id: cleanPhoneHyphen({ phone: id }),
      password,
    })
    if (!loginInfo) return

    const hasLobbyPhone = hasAptContent({
      contentList: loginInfo.contentList,
      contentName: APT_CONTENT_NAME.LOBBY_PHONE,
    })

    nativeSendInitialResidentInfo({
      aptResidentUuid: loginInfo.uuid ?? '',
      hasAptApassService: hasAptContent({
        contentList: loginInfo.contentList,
        contentName: APT_CONTENT_NAME.APASS,
      }),
      hasResidentApassService: loginInfo.apassUseFlag ?? false,
      isDeviceApassActive: loginInfo.apassOnOffFlag ?? false,
      hasAptLobbyPhoneService: hasLobbyPhone,
      hasResidentLobbyPhoneService: hasLobbyPhone,
    })

    // 미승인 화면으로 넘어가기 전에 스플래시를 내린다.
    await nativeEndSplash()
  }, [])
}
