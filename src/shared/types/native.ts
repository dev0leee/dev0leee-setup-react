export interface NativeWindow {
  /** iOS: WKWebView 메시지 핸들러 */
  webkit?: { messageHandlers?: Record<string, { postMessage: (body: string) => void }> }
  /** Android: addJavascriptInterface로 주입된 객체 */
  AndroidBridge?: { postMessage: (body: string) => void }
}

export interface DeviceOs {
  isIos: boolean
  isAndroid: boolean
}
