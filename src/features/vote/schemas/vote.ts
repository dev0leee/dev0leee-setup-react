import { z } from 'zod'

import { NAME_REGEX, PHONE_REGEX } from '@/shared/constants/regex'

/**
 * 투표 이름·휴대폰 본인인증 (VT6). 레거시 `schemas/vote.js`의 `voteAuthNamePhoneSchema`.
 *
 * 레거시가 공용 `name`·`phone` 필드를 조합한 것을 그대로 옮겼다 — 문구까지 동일하다.
 *
 * ⚠️ **`PHONE_REGEX`는 하이픈이 있는 형태를 요구한다.** placeholder는 "- 없이"라고
 * 하지만 `InputBase type="tel"`이 입력하는 동안 하이픈을 넣어준다. 로그인 폼과 같은
 * 구조다(`features/auth/schemas/login.ts`).
 *
 * ⚠️ **`dong`·`ho`는 스키마에 없다.** 화면이 표시만 하고 제출에 싣지 않는다.
 */
export const voteAuthNamePhoneSchema = z.object({
  name: z
    .string({ error: '이름을 입력해주세요' })
    .trim()
    .min(2, { message: '2자 이상 입력해주세요' })
    .regex(NAME_REGEX, '한글, 영문, 띄어쓰기만'),
  phone: z
    .string({ error: '휴대폰을 입력해주세요' })
    .trim()
    .regex(PHONE_REGEX, '휴대폰 번호 형식으로 - 없이 입력해주세요')
    .max(13, '숫자만 입력해주세요'),
})

export type VoteAuthNamePhoneForm = z.infer<typeof voteAuthNamePhoneSchema>
