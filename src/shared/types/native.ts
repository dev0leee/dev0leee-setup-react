import type { SAVE_FILE_TYPE } from '@/shared/constants/native'

/**
 * 앱이 웹뷰에 주입하는 것들. iOS는 WKWebView 메시지 핸들러, Android는 JS 인터페이스.
 * **두 이름이 같다** (`JsInterface`).
 */
export interface NativeWindow {
  webkit?: {
    /** iOS는 **객체 그대로** 받는다. 문자열이 아니다 */
    messageHandlers?: Record<string, { postMessage: (message: unknown) => void }>
  }
  /** Android: `addJavascriptInterface`로 주입. **문자열만** 받는다 */
  JsInterface?: { postMessage: (message: string) => void }
  /** 레거시 iOS 감지식이 보는 값. 구형 IE에만 존재한다 */
  MSStream?: unknown
}

/** 레거시 `checkDeviceOs()`의 반환 형태. `isIOS` 대문자 표기까지 그대로 */
export interface DeviceOs {
  isIOS: boolean
  isAndroid: boolean
}

/** `{ type, data }` — `payload`가 아니다. 앱 파서 계약이다 */
export interface NativeMessage {
  type: string
  /** 값이 없으면 **빈 문자열**이다. `undefined`나 필드 생략이 아니다 */
  data: unknown
}

export type SaveFileType = (typeof SAVE_FILE_TYPE)[keyof typeof SAVE_FILE_TYPE]

/**
 * `SEND_INITIAL_RESIDENT_INFO` · `SEND_CHANGED_RESIDENT_INFO` 페이로드.
 * 두 타입이 같은 구조를 쓴다.
 */
export interface ResidentInfoPayload {
  aptResidentUuid: string
  /** 단지의 A-PASS 서비스 가입 여부 */
  hasAptApassService: boolean
  /** 입주민의 A-PASS 서비스 가입 여부 */
  hasResidentApassService: boolean
  /** 기기 A-PASS 기능 활성화 여부 */
  isDeviceApassActive: boolean
  hasAptLobbyPhoneService: boolean
  hasResidentLobbyPhoneService: boolean
}
