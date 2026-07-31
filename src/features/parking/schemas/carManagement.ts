import { z } from 'zod'

import { CARNUM_REGEX, NICKNAME_REGEX, PHONE_REGEX } from '@/shared/constants/regex'

/**
 * 차량관리 폼 스키마. 레거시 `schemas/parking.js` + `schemas/common.js` 이식.
 *
 * zod 3의 `required_error`·`invalid_type_error`는 4에서 `error`로 합쳐졌다
 * (`zod-migration.md`). RHF는 필드를 항상 초기화하므로 "값이 없음" 메시지가
 * 실제로 보일 일은 거의 없고, 빈 문자열이 `min`·`regex`에 먼저 걸린다.
 *
 * ⚠️ **`phone`은 하이픈이 **있는** 상태로 검증한다.** 입력창이 자동으로 하이픈을 넣고
 * 전송 직전에 `cleanPhoneHyphen`으로 뺀다. 왕복 규칙을 깨면 검증이 통과하지 않는다.
 *
 * ⚠️ **`PHONE_REGEX`에 `^...$` 앵커가 없다** — 부분 일치만으로 통과한다. 레거시 원본이라
 * 그대로 둔다 (`domain-codes.md`).
 *
 * ⚠️ **`nickName`에 `.max(10)`이 없다.** 메시지는 `2~10자`인데 스키마는 최소 2자만 본다 —
 * 상한은 입력창 `maxlength`가 막는다 (`deferred.md`).
 */
const carNum = z
  .string()
  .trim()
  .min(1, { message: '123가1234, 서울12가1234 형식으로 입력해주세요' })
  .regex(CARNUM_REGEX, '123가1234, 서울12가1234 형식으로 입력해주세요')

const nickName = z
  .string()
  .trim()
  .min(2, { message: '2~10자로 입력해주세요' })
  .regex(NICKNAME_REGEX, '한글, 영문, 숫자만')

const phone = z
  .string()
  .trim()
  .regex(PHONE_REGEX, '휴대폰 번호 형식으로 - 없이 입력해주세요')
  .max(13, '숫자만 입력해주세요')

/** 방문목적은 **객체 통째로** 폼 값이 된다. 전송 직전에 `uuid`만 꺼낸다 */
const visitPurpose = z.object(
  { name: z.string(), uuid: z.string() },
  { error: '방문목적을 선택해주세요' },
)

const memo = z.string().optional()

const parkingWallPadAlarm = z.boolean({ error: '예, 아니오 중에 선택해주세요' })

/** PK5 즐겨찾기 등록 · PK7 즐겨찾기 수정 */
export const bookmarkCarSchema = z.object({ carNum, nickName, phone })

export type BookmarkCarForm = z.infer<typeof bookmarkCarSchema>

/** PK6 항상허용 등록 */
export const alwaysAllowCarSchema = z.object({ carNum, phone, visitPurpose, memo })

/** 월패드 서비스 단지에서만 라디오가 붙는다 */
export const alwaysAllowCarWithWallPadSchema = alwaysAllowCarSchema.extend({
  parkingWallPadAlarm,
})

export type AlwaysAllowCarForm = z.infer<typeof alwaysAllowCarWithWallPadSchema>

/** 두 폼을 한 컴포넌트가 그리므로 값 타입도 합집합으로 다룬다 */
export type CarManagementForm = Partial<BookmarkCarForm> & Partial<AlwaysAllowCarForm>
