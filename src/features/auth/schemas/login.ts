import { z } from 'zod'

import { MIN_PASSWORD_LENGTH } from '@/features/auth/constants/policy'
import { PHONE_REGEX } from '@/shared/constants/regex'

/**
 * 로그인 폼. **아이디는 휴대폰 번호다** (이메일이 아니다).
 * 레거시 vee-validate 스키마의 문구까지 맞추는 작업은 인트로 화면 이관과 함께 한다.
 */
export const loginSchema = z.object({
  id: z.string().regex(PHONE_REGEX, '휴대폰 번호를 정확히 입력해주세요'),
  password: z
    .string()
    .min(MIN_PASSWORD_LENGTH, `비밀번호는 ${MIN_PASSWORD_LENGTH}자 이상이어야 합니다.`),
})

export type LoginFormValues = z.infer<typeof loginSchema>
