import { FROM_NATIVE, TO_NATIVE } from '@/shared/constants/native'
import { sendToNative, subscribeToNative } from '@/shared/lib/native/bridge'
import type { ApassState } from '@/shared/lib/native/schemas'

/** 레거시 `src/natives/apass.js` 이식. */

/**
 * A-PASS 활성/비활성 요청. 결과는 `CALLBACK_APASS_STATE`로 온다.
 *
 * ⚠️ 레거시는 유일하게 위치 인자(`nativeSetApassState(isApassActive)`)를 받고
 * 내부에서 이름을 바꿔 보냈다. 타깃 컨벤션대로 객체 인자로 받되
 * **전송 필드명은 `isDeviceApassActive` 그대로**다 (`native-protocol.md` P9).
 */
export const nativeSetApassState = ({
  isDeviceApassActive,
}: {
  isDeviceApassActive: boolean
}): void => {
  sendToNative({ type: TO_NATIVE.SET_APASS_STATE, data: { isDeviceApassActive } })
}

/**
 * 디바이스 권한 설정 화면으로 이동 요청.
 * ⚠️ 레거시에도 호출부가 **0곳**이다 (`deferred.md` D-18 · `apass.md` AP-Q2).
 */
export const nativeGoAppPermission = (): void => {
  sendToNative({ type: TO_NATIVE.GO_APP_PERMISSION })
}

export const subscribeToApassState = ({
  handler,
}: {
  handler: (apassState: ApassState) => void
}): (() => void) => {
  return subscribeToNative<ApassState>({ type: FROM_NATIVE.CALLBACK_APASS_STATE, handler })
}
