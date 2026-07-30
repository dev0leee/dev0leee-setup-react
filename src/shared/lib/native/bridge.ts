import { z } from 'zod'

import { env } from '@/config/env'
import { NATIVE_HANDLER } from '@/shared/constants/native'
import { checkDeviceOs } from '@/shared/lib/native/device'
import { emit, off, on } from '@/shared/lib/native/eventBus'
import type { NativeMessage, NativeWindow } from '@/shared/types/native'

/**
 * 웹뷰 ↔ 네이티브 앱 통신 창구. **`window`에 손대는 곳은 이 파일 하나뿐이다.**
 *
 * 레거시 `src/natives/native.js` 재작성. 템플릿 원본과 프로토콜이 전부 달랐다
 * (`docs/migration/native-protocol.md` §0):
 *  - 핸들러명 `appBridge` → **`JsInterface`**
 *  - 메시지 필드 `payload` → **`data`**
 *  - iOS에 문자열 → **객체 그대로** (Android만 문자열)
 *  - 수신을 `message` 이벤트로 → **`window.CALLBACK_*` 전역 함수**
 */

const getNativeWindow = (): NativeWindow => {
  return window as unknown as NativeWindow
}

/** 네이티브 셸 안에서 실행 중인지. 브라우저에서 열었으면 false. */
export const isNativeApp = (): boolean => {
  const nativeWindow = getNativeWindow()
  return Boolean(nativeWindow.webkit?.messageHandlers?.[NATIVE_HANDLER] ?? nativeWindow.JsInterface)
}

/** 네이티브 셸이 아닌 순수 웹 브라우저인지. 개발 중에는 항상 true다. */
export const isWebBrowser = (): boolean => {
  return !isNativeApp()
}

/**
 * 네이티브로 메시지를 보낸다. 브라우저에서는 조용히 무시된다.
 *
 * ⚠️ 보존 항목 3개 (`native-protocol.md` P2·P3·P4):
 *  - `data`의 기본값은 **빈 문자열**이다. `undefined`나 필드 생략이 아니다
 *  - iOS에는 **객체**, Android에는 **JSON 문자열**을 보낸다 (의도된 비대칭)
 *  - 분기 기준이 `window` 객체 존재가 아니라 **userAgent**다
 */
export const sendToNative = ({ type, data }: { type: string; data?: unknown }): void => {
  const { isIOS, isAndroid } = checkDeviceOs()
  const message: NativeMessage = { type, data: data ?? '' }

  // 레거시는 `import.meta.env.MODE === 'development'`로 게이트했다.
  // 개발 편의 기능이라 동작 등가성에 영향이 없다.
  if (env.APP_ENV === 'development') console.warn('[native] →', message)

  try {
    if (isIOS) {
      getNativeWindow().webkit?.messageHandlers?.[NATIVE_HANDLER]?.postMessage(message)
      return
    }
    if (isAndroid) {
      getNativeWindow().JsInterface?.postMessage(JSON.stringify(message))
    }
  } catch (error) {
    console.error('[native] 메시지 전송에 실패했습니다.', error)
  }
}

/**
 * 콜백으로 들어온 JSON 문자열을 검증한다. 실패하면 로그를 남기고 `null`.
 *
 * ⚠️ 스키마의 필드는 **전부 optional이어야 한다.** 레거시는 검증 없이 구조분해해서
 * 없는 필드를 `undefined`로 흘려보냈고, 화면들이 그 값을 falsy로 처리한다.
 * 필수로 잡으면 필드 하나가 빠진 메시지를 **통째로 버려** 동작이 달라진다.
 * 검증의 목적은 JSON 파싱 실패와 타입 불일치를 로그로 드러내는 것까지다.
 */
export const parseNativePayload = <T>({
  type,
  raw,
  schema,
}: {
  type: string
  raw: string
  schema: z.ZodType<T>
}): T | null => {
  let json: unknown
  try {
    json = JSON.parse(raw)
  } catch (error) {
    console.error(`[native] ${type} 페이로드가 JSON이 아닙니다.`, error)
    return null
  }

  const result = schema.safeParse(json)
  if (!result.success) {
    console.error(`[native] ${type} 페이로드가 스키마와 다릅니다.`, z.treeifyError(result.error))
    return null
  }

  return result.data
}

/**
 * `window.CALLBACK_*` 전역 함수를 설치한다.
 *
 * 레거시는 `main.js`가 `natives/*.js`를 side-effect import하는 것으로 등록했다.
 * 이관본은 부팅 시 한 번 명시적으로 부른다 — import 순서에 동작이 걸리지 않게.
 */
export const defineNativeCallback = ({
  type,
  handler,
}: {
  type: string
  handler: (raw: string) => void
}): void => {
  Object.assign(window, { [type]: handler })
}

/** JSON 파싱·검증 후 그대로 발행하는 콜백. 대부분이 이 형태다. */
export const defineParsedNativeCallback = <T>({
  type,
  schema,
}: {
  type: string
  schema: z.ZodType<T>
}): void => {
  defineNativeCallback({
    type,
    handler: (raw) => {
      const payload = parseNativePayload({ type, raw, schema })
      if (payload === null) return
      emit(type, payload)
    },
  })
}

/** 검증 없이 원본 문자열을 그대로 흘리는 콜백. `CALLBACK_APP_VERSION` 하나뿐이다. */
export const defineRawNativeCallback = ({ type }: { type: string }): void => {
  defineNativeCallback({
    type,
    handler: (raw) => {
      emit(type, raw)
    },
  })
}

/** 인자가 없는 콜백. `CALLBACK_GO_BACK` 하나뿐이다. */
export const defineSignalNativeCallback = ({ type }: { type: string }): void => {
  Object.assign(window, {
    [type]: () => {
      emit(type)
    },
  })
}

/** 콜백이 가공한 값을 웹 내부로 발행한다 (푸시 딥링크 등). */
export const emitInternal = ({ type, payload }: { type: string; payload?: unknown }): void => {
  emit(type, payload)
}

/**
 * 네이티브 이벤트를 구독한다. 반환값은 구독 해제 함수다.
 * React에서는 `useEffect` cleanup으로 반드시 돌려준다.
 */
export const subscribeToNative = <T>({
  type,
  handler,
}: {
  type: string
  handler: (payload: T) => void
}): (() => void) => {
  const listener = (payload?: unknown) => {
    handler(payload as T)
  }

  on(type, listener)
  return () => {
    off(type, listener)
  }
}
