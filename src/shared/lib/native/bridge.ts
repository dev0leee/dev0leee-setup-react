import { z } from 'zod'

import { NATIVE_HANDLER } from '@/shared/constants/native'
import type { NativeWindow } from '@/shared/types/native'

/**
 * 웹뷰 ↔ 네이티브 앱 통신 창구.
 *
 * 도메인별 파일(common.ts, auth.ts ...)은 이 모듈의 send/subscribe만 쓴다.
 * window에 직접 손대는 곳은 여기 하나뿐이어야 한다.
 */

const getNativeWindow = (): NativeWindow => {
  return window as unknown as NativeWindow
}

/** 네이티브 셸 안에서 실행 중인지. 브라우저에서 열었으면 false. */
export const isNativeApp = (): boolean => {
  const nativeWindow = getNativeWindow()
  return Boolean(
    nativeWindow.AndroidBridge ?? nativeWindow.webkit?.messageHandlers?.[NATIVE_HANDLER],
  )
}

/**
 * 네이티브로 메시지를 보낸다. 브라우저에서는 조용히 무시한다.
 * 네이티브가 없다고 앱이 죽으면 안 된다 — 개발 중에는 늘 브라우저다.
 */
export const sendToNative = ({ type, payload }: { type: string; payload?: unknown }): void => {
  const body = JSON.stringify({ type, payload })
  const nativeWindow = getNativeWindow()

  if (nativeWindow.AndroidBridge) {
    nativeWindow.AndroidBridge.postMessage(body)
    return
  }
  nativeWindow.webkit?.messageHandlers?.[NATIVE_HANDLER]?.postMessage(body)
}

const safeJsonParse = ({ raw }: { raw: string }): unknown => {
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

/**
 * 네이티브가 보내온 메시지를 구독한다. 반환값은 구독 해제 함수다.
 *
 * 네이티브에서 오는 값은 신뢰할 수 없는 입력이므로 zod로 검증한다
 * (환경변수·폼 입력과 같은 범주 — docs/conventions/05-types.md).
 */
export const subscribeToNative = <T>({
  type,
  schema,
  handler,
}: {
  type: string
  schema: z.ZodType<T>
  handler: (payload: T) => void
}): (() => void) => {
  const onMessage = (event: MessageEvent<string>) => {
    const parsed = z
      .object({ type: z.string(), payload: z.unknown() })
      .safeParse(safeJsonParse({ raw: event.data }))
    if (!parsed.success || parsed.data.type !== type) return

    const result = schema.safeParse(parsed.data.payload)
    if (!result.success) {
      console.error(`[native] ${type} 페이로드가 스키마와 다릅니다.`, z.treeifyError(result.error))
      return
    }
    handler(result.data)
  }

  window.addEventListener('message', onMessage)
  return () => {
    window.removeEventListener('message', onMessage)
  }
}
