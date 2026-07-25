import { ANDROID_UA_PATTERN, IOS_UA_PATTERN } from '@/shared/constants/regex'
import { isNativeApp } from '@/shared/lib/native/bridge'
import type { DeviceOs } from '@/shared/types/native'

/**
 * userAgent로 OS를 감지한다. 네이티브 셸 안/밖 모두에서 동작한다.
 * "어느 네이티브 브릿지로 보낼까"는 bridge.ts가 window 객체 존재로 판단하므로,
 * 이 함수는 스타일·레이아웃을 OS로 분기하는 용도다(safe-area, 스토어 링크 등).
 */
export const getDeviceOs = (): DeviceOs => {
  const { userAgent } = navigator
  return {
    isIos: IOS_UA_PATTERN.test(userAgent),
    isAndroid: ANDROID_UA_PATTERN.test(userAgent),
  }
}

/** 네이티브 셸이 아닌 순수 웹 브라우저인지. 개발 중에는 항상 true다. */
export const isWebBrowser = (): boolean => {
  return !isNativeApp()
}
