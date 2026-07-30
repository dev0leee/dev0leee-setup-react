import { z } from 'zod'

import { PHONE_REGEX } from '@/shared/constants/regex'

/**
 * 인트로 로그인 폼. 레거시 `schemas/auth.js` `introLoginFormSchema` 이식.
 *
 * ⚠️ **아이디가 휴대폰 번호다** (`common.js:108` `export const id = phone`).
 * 필드명은 `id`인데 검증은 전화번호 규칙이다.
 *
 * ⚠️ **비밀번호에 복잡도 검증을 걸지 않는다.** 레거시 주석에 이유가 적혀 있다 —
 * *"버전1 회원 로그인도 가능하도록하기위해"*. 구버전 규칙으로 만든 비밀번호를 쓰는
 * 사용자가 로그인해야 한다. **완화도 강화도 하지 않는다** (`auth.md` A1 폼, 주의 4).
 *
 * ⚠️ `PHONE_REGEX`는 **하이픈이 있는** 형태를 요구한다. placeholder가 "- 없이 숫자만"인데
 * 통과하는 이유는 `InputBase`가 `type="tel"`일 때 하이픈을 자동으로 넣기 때문이다.
 * 메시지는 레거시 원문 그대로 둔다.
 */
export const loginSchema = z.object({
  id: z
    .string()
    .trim()
    .regex(PHONE_REGEX, '휴대폰 번호 형식으로 - 없이 입력해주세요')
    .max(13, '숫자만 입력해주세요'),
  password: z.string().min(1, { message: '비밀번호를 입력해주세요' }),
})

export type LoginFormValues = z.infer<typeof loginSchema>
