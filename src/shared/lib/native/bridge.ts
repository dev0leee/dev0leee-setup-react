import { z } from 'zod'

/**
 * 웹뷰 ↔ 네이티브 앱 통신 창구.
 *
 * 도메인별 파일(common.ts, auth.ts ...)은 이 모듈의 send/subscribe만 쓴다.
 * window에 직접 손대는 곳은 여기 하나뿐이어야 한다.
 */

interface NativeWindow {
  /** iOS: WKWebView 메시지 핸들러 */
  webkit?: { messageHandlers?: Record<string, { postMessage: (body: string) => void }> }
  /** Android: addJavascriptInterface로 주입된 객체 */
  AndroidBridge?: { postMessage: (body: string) => void }
}

const NATIVE_HANDLER = 'appBridge'

const getNativeWindow = (): NativeWindow => {
  return window as unknown as NativeWindow
}

/** 네이티브 셸 안에서 실행 중인지. 브라우저에서 열었으면 false. */
export const isNativeApp = (): boolean => {
  const w = getNativeWindow()
  return Boolean(w.AndroidBridge ?? w.webkit?.messageHandlers?.[NATIVE_HANDLER])
}

/**
 * 네이티브로 메시지를 보낸다. 브라우저에서는 조용히 무시한다.
 * 네이티브가 없다고 앱이 죽으면 안 된다 — 개발 중에는 늘 브라우저다.
 */
export const sendToNative = (type: string, payload?: unknown): void => {
  const body = JSON.stringify({ type, payload })
  const w = getNativeWindow()

  if (w.AndroidBridge) {
    w.AndroidBridge.postMessage(body)
    return
  }
  w.webkit?.messageHandlers?.[NATIVE_HANDLER]?.postMessage(body)
}

/**
 * 네이티브가 보내온 메시지를 구독한다. 반환값은 구독 해제 함수다.
 *
 * 네이티브에서 오는 값은 신뢰할 수 없는 입력이므로 zod로 검증한다
 * (환경변수·폼 입력과 같은 범주 — docs/conventions/05-types.md).
 */
export const subscribeToNative = <T>(
  type: string,
  schema: z.ZodType<T>,
  handler: (payload: T) => void,
): (() => void) => {
  const onMessage = (event: MessageEvent<string>) => {
    const parsed = z
      .object({ type: z.string(), payload: z.unknown() })
      .safeParse(safeJsonParse(event.data))
    if (!parsed.success || parsed.data.type !== type) return

    const result = schema.safeParse(parsed.data.payload)
    if (!result.success) {
      console.error(`[native] ${type} 페이로드가 스키마와 다릅니다.`, z.treeifyError(result.error))
      return
    }
    handler(result.data)
  }

  window.addEventListener('message', onMessage)
  return () => window.removeEventListener('message', onMessage)
}

const safeJsonParse = (raw: string): unknown => {
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}
