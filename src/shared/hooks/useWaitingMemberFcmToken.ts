import { useCallback } from 'react'

import { APT_CONTENT_NAME } from '@/shared/constants/aptContent'
import { hasAptContent } from '@/shared/lib/aptContext'
import { nativeSendInitialResidentInfo } from '@/shared/lib/native/auth'
import { nativeEndSplash } from '@/shared/lib/native/common'
import { fetchWaitingMemberLoginInfo } from '@/shared/lib/waitingMember'

/**
 * 미승인 입주민의 정보를 앱에 미리 발신한다.
 * 레거시 `lib/composables/useWaitingMemberFcmToken.js` 이식.
 *
 * 목적은 **FCM 토큰을 서버에 등록시키는 것**이다. 그래야 승인 결과를 문자 대신 푸시로
 * 보낼 수 있다 (레거시 주석: *"미승인 회원 로그인 정보 조회로 미리 fcmToken 서버에 전송,
 * 문자 대신 푸시알림 발송 가능하도록 변경"*).
 *
 * **`shared/`에 있는 이유**: 부르는 곳이 두 도메인이다 —
 * 로그인이 `RESIDENT_NOT_APPROVED`로 실패한 직후(`auth.md` A1-2)와
 * 회원가입이 성공한 직후(`signup.md` S4). 도메인 규칙이 아니라 앱↔네이티브 계약이다.
 *
 * ⚠️ **아이디는 상황에 따라 다른 값이다.** 로그인 실패 경로는 사용자가 입력한 휴대폰
 * 번호를, 가입 성공 경로는 **서버가 준 `id`**를 넘긴다. 하이픈 제거는 호출부 책임이다.
 */
export const useWaitingMemberFcmToken = () => {
  return useCallback(async ({ id, password }: { id: string; password: string }) => {
    const loginInfo = await fetchWaitingMemberLoginInfo({ id, password })
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
