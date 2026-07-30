import { FROM_NATIVE } from '@/shared/constants/native'
import {
  defineNativeCallback,
  defineParsedNativeCallback,
  defineRawNativeCallback,
  defineSignalNativeCallback,
  emitInternal,
  parseNativePayload,
} from '@/shared/lib/native/bridge'
import { enqueuePushAlarmDeepLink, resolvePushAlarmPath } from '@/shared/lib/native/common'
import {
  apassStateSchema,
  faceImageSchema,
  lobbyPhoneSipStateSchema,
  permissionInfoSchema,
  pushAlarmSchema,
} from '@/shared/lib/native/schemas'

/**
 * `window.CALLBACK_*` 7종을 설치한다.
 *
 * 레거시는 `main.js`가 `natives/{apass,auth,face,lobbyPhone}.js`를
 * **side-effect import**하는 것으로 등록했다 — import를 지우면 조용히 죽는 구조다.
 * 이관본은 엔트리에서 이 함수를 한 번 부른다.
 *
 * ⚠️ **앱이 뜨자마자 호출해야 한다.** 앱이 종료 상태에서 푸시로 열리면
 * 웹이 준비되기 전에 `CALLBACK_PUSH_ALARM`이 날아올 수 있다
 * (`native-protocol.md` N-Q3).
 */
export const registerNativeCallbacks = (): void => {
  defineRawNativeCallback({ type: FROM_NATIVE.CALLBACK_APP_VERSION })
  defineSignalNativeCallback({ type: FROM_NATIVE.CALLBACK_GO_BACK })

  defineParsedNativeCallback({
    type: FROM_NATIVE.CALLBACK_PERMISSION_INFO,
    schema: permissionInfoSchema,
  })
  defineParsedNativeCallback({ type: FROM_NATIVE.CALLBACK_APASS_STATE, schema: apassStateSchema })
  defineParsedNativeCallback({
    type: FROM_NATIVE.CALLBACK_LOBBYPHONE_SIP_STATE,
    schema: lobbyPhoneSipStateSchema,
  })
  defineParsedNativeCallback({ type: FROM_NATIVE.CALLBACK_FACE_IMAGE, schema: faceImageSchema })

  // 푸시만 가공이 들어간다. 레거시 제어 흐름을 그대로 옮겼다:
  // 알려진 2종은 딥링크로 처리하고 **거기서 끝낸다**(early return).
  // 그 외 타입만 이벤트로 발행된다 — 구독부가 없어 실질적으로 죽은 경로다.
  defineNativeCallback({
    type: FROM_NATIVE.CALLBACK_PUSH_ALARM,
    handler: (raw) => {
      const pushAlarm = parseNativePayload({
        type: FROM_NATIVE.CALLBACK_PUSH_ALARM,
        raw,
        schema: pushAlarmSchema,
      })
      if (pushAlarm === null) return

      const path = resolvePushAlarmPath(pushAlarm)
      if (path) {
        enqueuePushAlarmDeepLink({ path })
        return
      }

      emitInternal({ type: FROM_NATIVE.CALLBACK_PUSH_ALARM, payload: pushAlarm })
    },
  })
}
