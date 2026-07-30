import { FROM_NATIVE, TO_NATIVE } from '@/shared/constants/native'
import { sendToNative, subscribeToNative } from '@/shared/lib/native/bridge'
import type { LobbyPhoneSipState } from '@/shared/lib/native/schemas'

/** 레거시 `src/natives/lobbyPhone.js` 이식. */

/** sip 상태 요청. 결과는 `CALLBACK_LOBBYPHONE_SIP_STATE`로 온다 */
export const nativeGetLobbyPhoneSipState = (): void => {
  sendToNative({ type: TO_NATIVE.GET_LOBBYPHONE_SIP_STATE })
}

export const nativeCallLobbyPhoneGuard = (): void => {
  sendToNative({ type: TO_NATIVE.CALL_LOBBYPHONE_GUARD })
}

/** QR base64 이미지 전송 */
export const nativeSendLobbyPhoneQrInfo = ({ qrInfo }: { qrInfo: string }): void => {
  sendToNative({ type: TO_NATIVE.SEND_LOBBYPHONE_QR_INFO, data: { qrInfo } })
}

export const subscribeToLobbyPhoneSipState = ({
  handler,
}: {
  handler: (sipState: LobbyPhoneSipState) => void
}): (() => void) => {
  return subscribeToNative<LobbyPhoneSipState>({
    type: FROM_NATIVE.CALLBACK_LOBBYPHONE_SIP_STATE,
    handler,
  })
}
