import {
  FROM_NATIVE,
  NATIVE_INTERNAL,
  PUSH_ALARM_DEEP_LINK_PATH,
  SAVE_FILE_TYPE,
  TO_NATIVE,
} from '@/shared/constants/native'
import { emitInternal, sendToNative, subscribeToNative } from '@/shared/lib/native/bridge'
import type { PushAlarm } from '@/shared/lib/native/schemas'
import type { SaveFileType } from '@/shared/types/native'

/** 레거시 `src/natives/common.js` 이식. */

// ── Web → App ────────────────────────────────────────────────────────────────

/** 앱 버전 요청. 결과는 `CALLBACK_APP_VERSION`으로 온다 */
export const nativeGetAppVersion = (): void => {
  sendToNative({ type: TO_NATIVE.GET_APP_VERSION })
}

/** 디바이스 권한 정보 요청. 결과는 `CALLBACK_PERMISSION_INFO`로 온다 */
export const nativeGetPermissionInfo = (): void => {
  sendToNative({ type: TO_NATIVE.GET_PERMISSION_INFO })
}

/**
 * 앱 캐시 삭제.
 * ⚠️ 레거시에도 호출부가 **0곳**이다. 프로토콜 상수라 앱이 기대할 수 있어 래퍼만 남긴다
 * (`native-protocol.md` N-Q2).
 */
export const nativeClearAppCache = (): void => {
  sendToNative({ type: TO_NATIVE.CLEAR_APP_CACHE })
}

export const nativeExitApp = (): void => {
  sendToNative({ type: TO_NATIVE.EXIT_APP })
}

/**
 * 스플래시 종료 요청.
 * 앱 응답을 기다리지 않고 즉시 resolve한다 — 실질적으로 동기 함수인데
 * 호출부가 `await`할 수 있게 감싼 것이다. 레거시 시그니처를 유지한다.
 */
export const nativeEndSplash = (): Promise<void> => {
  return new Promise((resolve) => {
    sendToNative({ type: TO_NATIVE.END_SPLASH })
    resolve()
  })
}

export const nativeOpenSystemBrowser = ({ targetUrl }: { targetUrl: string }): void => {
  sendToNative({ type: TO_NATIVE.OPEN_SYSTEM_BROWSER, data: { targetUrl } })
}

/**
 * 앱 내부에 새 웹뷰를 띄운다.
 *
 * ⚠️ **`hasBackButton`이 선택값이다.** 쇼핑몰 호출부가 이 필드를 넘기지 않아
 * 페이로드에서 통째로 빠진다(`JSON.stringify`가 `undefined` 키를 버린다).
 * 필수로 바꾸면 앱에 없던 필드가 새로 가고, 앱의 기본 동작이 달라질 수 있다
 * (`main.md` §11 · `native-protocol.md` N8).
 */
export const nativeOpenNewWebView = ({
  type,
  title,
  url,
  hasBackButton,
}: {
  type: string
  title: string
  url: string
  hasBackButton?: boolean
}): void => {
  sendToNative({
    type: TO_NATIVE.OPEN_NEW_WEBVIEW,
    data: { type, title, url, hasBackButton },
  })
}

/**
 * 파일 저장 요청.
 *
 * ⚠️ **`fileUrl` 뒤에 `?filName=`을 붙인다.** 오타이고 값도 없지만 **고치면 안 된다**
 * (`native-protocol.md` P8). S3 Content-Disposition 또는 앱 측 파싱 우회로 추정된다.
 */
export const nativeSaveFile = ({
  fileName,
  fileUrl,
  type = SAVE_FILE_TYPE.FILE,
}: {
  fileName: string
  fileUrl: string
  type?: SaveFileType
}): void => {
  sendToNative({
    type: TO_NATIVE.SAVE_FILE,
    data: { fileName, fileUrl: `${fileUrl}?filName=`, type },
  })
}

// ── App → Web ────────────────────────────────────────────────────────────────

/** 설치된 앱 버전 문자열. 유일하게 JSON 파싱 없이 원본이 온다 */
export const subscribeToAppVersion = ({
  handler,
}: {
  handler: (version: string) => void
}): (() => void) => {
  return subscribeToNative<string>({ type: FROM_NATIVE.CALLBACK_APP_VERSION, handler })
}

/**
 * 하드웨어 뒤로가기. 페이로드가 없다.
 *
 * 시그니처의 `payload?`는 `useNativeSubscription`과 맞추기 위한 것이다 —
 * 인자를 안 받는 핸들러도 그대로 넘길 수 있다.
 */
export const subscribeToGoBack = ({
  handler,
}: {
  handler: (payload?: unknown) => void
}): (() => void) => {
  return subscribeToNative<unknown>({
    type: FROM_NATIVE.CALLBACK_GO_BACK,
    handler: () => {
      handler()
    },
  })
}

export const subscribeToPermissionInfo = <T>({
  handler,
}: {
  handler: (permissionInfo: T) => void
}): (() => void) => {
  return subscribeToNative<T>({ type: FROM_NATIVE.CALLBACK_PERMISSION_INFO, handler })
}

// ── 푸시 알림 딥링크 ──────────────────────────────────────────────────────────
//
// 레거시는 `CALLBACK_PUSH_ALARM` 콜백 안에서 라우터 싱글턴을 직접 import해
// `router.push()`를 부르고, 실패하면 `window.location.href`로 폴백했다.
// 그 폴백은 **라우터가 아직 준비되지 않은 시점**을 위한 것이다
// (앱이 종료 상태에서 푸시로 열릴 때).
//
// 이관본은 경로를 큐에 담아두고 소비자가 붙는 순간 흘려보낸다. 라우터 마운트 전에
// 도착한 푸시를 버리지 않으면서 순환 의존도 생기지 않는다.

let queuedDeepLinkPath: string | null = null

/** 푸시 종류로 딥링크 경로를 만든다. 알려진 2종이 아니면 null. */
export const resolvePushAlarmPath = ({
  pushAlarmRequestType,
  dataUuid,
}: PushAlarm): string | null => {
  if (!dataUuid) return null

  if (pushAlarmRequestType === 'NOTICE') {
    return `${PUSH_ALARM_DEEP_LINK_PATH.NOTICE}/${dataUuid}`
  }
  if (pushAlarmRequestType === 'IN_OUT_PARKING') {
    return `${PUSH_ALARM_DEEP_LINK_PATH.IN_OUT_PARKING}/${dataUuid}`
  }
  return null
}

/** 콜백이 경로를 확정했을 때 부른다. 소비자가 없으면 큐에 남는다. */
export const enqueuePushAlarmDeepLink = ({ path }: { path: string }): void => {
  queuedDeepLinkPath = path
  emitInternal({ type: NATIVE_INTERNAL.PUSH_ALARM_DEEP_LINK, payload: path })
}

/**
 * 푸시 딥링크를 구독한다. **구독 시점에 이미 도착한 경로가 있으면 즉시 넘긴다.**
 * 라우터가 뜨기 전에 온 푸시를 잃지 않는 지점이다.
 */
export const subscribeToPushAlarmDeepLink = ({
  handler,
}: {
  handler: (path: string) => void
}): (() => void) => {
  const unsubscribe = subscribeToNative<string>({
    type: NATIVE_INTERNAL.PUSH_ALARM_DEEP_LINK,
    handler: (path) => {
      queuedDeepLinkPath = null
      handler(path)
    },
  })

  if (queuedDeepLinkPath) {
    const path = queuedDeepLinkPath
    queuedDeepLinkPath = null
    handler(path)
  }

  return unsubscribe
}

/**
 * 딥링크로 이어지지 않는 푸시 알림.
 * ⚠️ 레거시에 구독부가 **0곳**이다 — 알려진 2종은 항상 딥링크로 빠지므로
 * 이 경로는 실질적으로 죽어 있다. 등가 이관을 위해 발행만 유지한다
 * (`native-protocol.md` C4 · N-Q4).
 */
export const subscribeToPushAlarm = ({
  handler,
}: {
  handler: (pushAlarm: PushAlarm) => void
}): (() => void) => {
  return subscribeToNative<PushAlarm>({ type: FROM_NATIVE.CALLBACK_PUSH_ALARM, handler })
}
