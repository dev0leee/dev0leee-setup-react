import { beforeEach, describe, expect, it, vi } from 'vitest'

import { FROM_NATIVE, NATIVE_HANDLER, TO_NATIVE } from '@/shared/constants/native'
import { nativeSetApassState, subscribeToApassState } from '@/shared/lib/native/apass'
import { sendToNative } from '@/shared/lib/native/bridge'
import {
  nativeSaveFile,
  subscribeToGoBack,
  subscribeToPermissionInfo,
  subscribeToPushAlarmDeepLink,
} from '@/shared/lib/native/common'
import { registerNativeCallbacks } from '@/shared/lib/native/register'
import type { PermissionInfo } from '@/shared/lib/native/schemas'

/**
 * 브릿지는 앱과의 계약이라 틀리면 기능이 조용히 죽는다
 * (`docs/migration/native-protocol.md` §4-4 보존 목록 11개).
 */

const IOS_UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
const ANDROID_UA =
  'Mozilla/5.0 (Linux; Android 14; SM-S911N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36'

const setUserAgent = (userAgent: string) => {
  vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(userAgent)
}

/** iOS는 객체를 받는다. Android는 문자열을 받는다. */
const installIosHandler = () => {
  const postMessage = vi.fn()
  Object.assign(window, { webkit: { messageHandlers: { [NATIVE_HANDLER]: { postMessage } } } })
  return postMessage
}

const installAndroidHandler = () => {
  const postMessage = vi.fn()
  Object.assign(window, { [NATIVE_HANDLER]: { postMessage } })
  return postMessage
}

describe('sendToNative', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    Reflect.deleteProperty(window, 'webkit')
    Reflect.deleteProperty(window, NATIVE_HANDLER)
  })

  it('iOS에는 객체를 그대로 보낸다', () => {
    setUserAgent(IOS_UA)
    const postMessage = installIosHandler()

    sendToNative({ type: TO_NATIVE.EXIT_APP })

    // JSON.stringify를 거치지 않는다 — 앱이 객체를 기대한다.
    expect(postMessage).toHaveBeenCalledWith({ type: 'EXIT_APP', data: '' })
  })

  it('Android에는 JSON 문자열을 보낸다', () => {
    setUserAgent(ANDROID_UA)
    const postMessage = installAndroidHandler()

    sendToNative({ type: TO_NATIVE.EXIT_APP })

    expect(postMessage).toHaveBeenCalledWith('{"type":"EXIT_APP","data":""}')
  })

  it('data를 생략하면 빈 문자열이 들어간다 (undefined나 필드 생략이 아니다)', () => {
    setUserAgent(ANDROID_UA)
    const postMessage = installAndroidHandler()

    sendToNative({ type: TO_NATIVE.GET_APP_VERSION })

    expect(postMessage).toHaveBeenCalledWith('{"type":"GET_APP_VERSION","data":""}')
  })

  it('핸들러가 설치돼 있어도 userAgent가 다르면 보내지 않는다', () => {
    // 분기 기준이 window 객체 존재가 아니라 UA다(보존 항목 P11).
    setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)')
    const ios = installIosHandler()
    const android = installAndroidHandler()

    sendToNative({ type: TO_NATIVE.EXIT_APP })

    expect(ios).not.toHaveBeenCalled()
    expect(android).not.toHaveBeenCalled()
  })

  it('SAVE_FILE은 fileUrl 뒤에 ?filName= 을 붙인다', () => {
    setUserAgent(ANDROID_UA)
    const postMessage = installAndroidHandler()

    nativeSaveFile({ fileName: '공지.pdf', fileUrl: 'https://s3/a.pdf' })

    // 오타이고 값도 없지만 고치면 파일 저장이 깨진다(보존 항목 P8).
    expect(postMessage).toHaveBeenCalledWith(
      '{"type":"SAVE_FILE","data":{"fileName":"공지.pdf","fileUrl":"https://s3/a.pdf?filName=","type":"file"}}',
    )
  })

  it('SET_APASS_STATE의 전송 필드명은 isDeviceApassActive다', () => {
    setUserAgent(ANDROID_UA)
    const postMessage = installAndroidHandler()

    nativeSetApassState({ isDeviceApassActive: true })

    expect(postMessage).toHaveBeenCalledWith(
      '{"type":"SET_APASS_STATE","data":{"isDeviceApassActive":true}}',
    )
  })
})

describe('window.CALLBACK_* 수신', () => {
  beforeEach(() => {
    registerNativeCallbacks()
  })

  const callCallback = (type: string, raw?: string) => {
    const callback = (window as unknown as Record<string, (raw?: string) => void>)[type]
    expect(callback).toBeTypeOf('function')
    callback?.(raw)
  }

  it('CALLBACK_GO_BACK은 인자 없이 호출된다', () => {
    const handler = vi.fn()
    const unsubscribe = subscribeToGoBack({ handler })

    callCallback(FROM_NATIVE.CALLBACK_GO_BACK)

    expect(handler).toHaveBeenCalledTimes(1)
    unsubscribe()
  })

  it('구독을 해제하면 더 이상 받지 않는다', () => {
    const handler = vi.fn()
    subscribeToGoBack({ handler })()

    callCallback(FROM_NATIVE.CALLBACK_GO_BACK)

    expect(handler).not.toHaveBeenCalled()
  })

  it('CALLBACK_PERMISSION_INFO의 오타 필드를 그대로 전달한다', () => {
    const handler = vi.fn()
    const unsubscribe = subscribeToPermissionInfo<PermissionInfo>({ handler })

    callCallback(
      FROM_NATIVE.CALLBACK_PERMISSION_INFO,
      JSON.stringify({ btOn: true, locAlawaysOn: true, btTransmitt: false }),
    )

    // locAlawaysOn / btTransmitt 철자를 고치면 값을 못 받는다(보존 항목 P7).
    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({ btOn: true, locAlawaysOn: true, btTransmitt: false }),
    )
    unsubscribe()
  })

  it('필드가 빠진 메시지도 버리지 않는다', () => {
    const handler = vi.fn()
    const unsubscribe = subscribeToPermissionInfo<PermissionInfo>({ handler })

    // 레거시는 검증 없이 구조분해했다. 스키마가 필수를 요구하면 이 메시지가 통째로 버려진다.
    callCallback(FROM_NATIVE.CALLBACK_PERMISSION_INFO, JSON.stringify({ btOn: true }))

    expect(handler).toHaveBeenCalledWith({ btOn: true })
    unsubscribe()
  })

  it('JSON이 아니면 발행하지 않는다', () => {
    const handler = vi.fn()
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const unsubscribe = subscribeToApassState({ handler })

    callCallback(FROM_NATIVE.CALLBACK_APASS_STATE, '깨진 문자열')

    expect(handler).not.toHaveBeenCalled()
    expect(errorSpy).toHaveBeenCalled()
    unsubscribe()
    errorSpy.mockRestore()
  })

  it('푸시 알림 NOTICE는 공지 상세 경로로 변환된다', () => {
    const handler = vi.fn()
    const unsubscribe = subscribeToPushAlarmDeepLink({ handler })

    callCallback(
      FROM_NATIVE.CALLBACK_PUSH_ALARM,
      JSON.stringify({ pushAlarmRequestType: 'NOTICE', dataUuid: 'abc' }),
    )

    expect(handler).toHaveBeenCalledWith('/board/notice/detail/abc')
    unsubscribe()
  })

  it('라우터가 준비되기 전에 도착한 푸시를 잃지 않는다', () => {
    // 앱이 종료 상태에서 푸시로 열리면 구독자보다 콜백이 먼저 온다.
    callCallback(
      FROM_NATIVE.CALLBACK_PUSH_ALARM,
      JSON.stringify({ pushAlarmRequestType: 'IN_OUT_PARKING', dataUuid: 'xyz' }),
    )

    const handler = vi.fn()
    const unsubscribe = subscribeToPushAlarmDeepLink({ handler })

    expect(handler).toHaveBeenCalledWith('/parking/inoutHistory/detail/xyz')

    unsubscribe()
  })

  it('큐에 담긴 딥링크는 한 번만 소비된다', () => {
    callCallback(
      FROM_NATIVE.CALLBACK_PUSH_ALARM,
      JSON.stringify({ pushAlarmRequestType: 'NOTICE', dataUuid: 'once' }),
    )

    subscribeToPushAlarmDeepLink({ handler: vi.fn() })()

    const later = vi.fn()
    subscribeToPushAlarmDeepLink({ handler: later })()

    expect(later).not.toHaveBeenCalled()
  })
})
