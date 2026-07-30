import { z } from 'zod'

/**
 * App → Web 페이로드 스키마.
 *
 * ⚠️ **모든 필드가 optional이다.** 레거시는 검증 없이 구조분해했고 화면들이
 * `undefined`를 falsy로 처리한다. 필수로 잡으면 필드 하나가 빠진 메시지를 통째로
 * 버려 동작이 달라진다 (`bridge.ts`의 `emitParsed` 주석).
 */

/**
 * `CALLBACK_PERMISSION_INFO` — 8필드 전부 boolean.
 *
 * ⚠️ `locAlawaysOn`·`btTransmitt`는 **오타지만 고치면 안 된다.**
 * 레거시 주석에 "앱팀과 협의된 철자 오류"라고 명시돼 있고, 앱이 이 철자로 보낸다
 * (`deferred.md` D-49·D-50).
 */
export const permissionInfoSchema = z.object({
  /** 블루투스 활성화 상태 */
  btOn: z.boolean().optional(),
  /** 비컨 송신 가능 여부 (`btTransmit` 오타) */
  btTransmitt: z.boolean().optional(),
  /** 데이터 절약 모드 활성화 상태 */
  dataSaverOff: z.boolean().optional(),
  gpsEnabled: z.boolean().optional(),
  /** 배터리 최적화 중지 허용 상태 */
  ignoringBatteryOpt: z.boolean().optional(),
  /** 위치 권한 항상허용 상태 (`locAlwaysOn` 오타) */
  locAlawaysOn: z.boolean().optional(),
  /** 절전모드 활성화 상태 (`lowPower`가 의미상 맞지만 그대로 유지) */
  lowerPowerEnabled: z.boolean().optional(),
  pushAuthorized: z.boolean().optional(),
})

export type PermissionInfo = z.infer<typeof permissionInfoSchema>

/** `CALLBACK_PUSH_ALARM` */
export const pushAlarmSchema = z.object({
  /** `NOTICE` | `IN_OUT_PARKING` — 다른 값이 올 수 있어 enum으로 잡지 않는다 */
  pushAlarmRequestType: z.string().optional(),
  dataUuid: z.string().optional(),
  aptUuid: z.string().optional(),
  aptResidentUuid: z.string().optional(),
})

export type PushAlarm = z.infer<typeof pushAlarmSchema>

/** `CALLBACK_APASS_STATE` */
export const apassStateSchema = z.object({
  isDeviceApassActive: z.boolean().optional(),
})

export type ApassState = z.infer<typeof apassStateSchema>

/** `CALLBACK_LOBBYPHONE_SIP_STATE` */
export const lobbyPhoneSipStateSchema = z.object({
  /** sip 활성화 상태 = 로비폰 통화 연결 상태 */
  isSipActive: z.boolean().optional(),
})

export type LobbyPhoneSipState = z.infer<typeof lobbyPhoneSipStateSchema>

/** `CALLBACK_FACE_IMAGE` — base64 JPEG/PNG */
export const faceImageSchema = z.object({
  image: z.string().optional(),
})

export type FaceImage = z.infer<typeof faceImageSchema>
