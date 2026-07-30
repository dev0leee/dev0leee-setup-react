import { ANDROID_UA_PATTERN, IOS_UA_PATTERN } from '@/shared/constants/regex'
import type { DeviceOs, NativeWindow } from '@/shared/types/native'

/**
 * userAgent로 OS를 감지한다. 레거시 `checkDeviceOs()` 이식.
 *
 * ⚠️ **브릿지 전송 분기가 이 함수 결과로 갈린다** (`native-protocol.md` P11).
 * 템플릿은 `window.AndroidBridge` 객체 존재로 분기했는데 레거시는 UA로 분기한다.
 * 판정 기준이 다르면 전송 형식(객체/문자열)이 뒤바뀐다.
 *
 * `MSStream` 체크는 레거시 원본 그대로다 — 구형 IE가 iPad UA를 흉내내던 시절의 방어다.
 */
export const checkDeviceOs = (): DeviceOs => {
  const { userAgent } = navigator
  const nativeWindow = window as unknown as NativeWindow

  return {
    isIOS: IOS_UA_PATTERN.test(userAgent) && !nativeWindow.MSStream,
    isAndroid: ANDROID_UA_PATTERN.test(userAgent),
  }
}
