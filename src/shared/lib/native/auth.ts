import { TO_NATIVE } from '@/shared/constants/native'
import { sendToNative } from '@/shared/lib/native/bridge'
import type { ResidentInfoPayload } from '@/shared/types/native'

/** 레거시 `src/natives/auth.js` 이식. */

/** 첫 로그인 또는 자동 로그인 시 입주민 정보 발신 */
export const nativeSendInitialResidentInfo = (payload: ResidentInfoPayload): void => {
  sendToNative({ type: TO_NATIVE.SEND_INITIAL_RESIDENT_INFO, data: payload })
}

/** 단지 변경 후 변경된 입주민 정보 발신. 페이로드 구조가 initial과 같다 */
export const nativeSendChangedResidentInfo = (payload: ResidentInfoPayload): void => {
  sendToNative({ type: TO_NATIVE.SEND_CHANGED_RESIDENT_INFO, data: payload })
}

export const nativeLogoutApp = (): void => {
  sendToNative({ type: TO_NATIVE.LOGOUT_APP })
}
