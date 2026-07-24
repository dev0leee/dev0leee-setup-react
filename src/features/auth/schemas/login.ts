import { z } from 'zod'

import { MIN_PASSWORD_LENGTH } from '@/features/auth/constants/policy'

export const loginSchema = z.object({
  email: z.email('올바른 이메일을 입력하세요.'),
  password: z
    .string()
    .min(MIN_PASSWORD_LENGTH, `비밀번호는 ${MIN_PASSWORD_LENGTH}자 이상이어야 합니다.`),
})

export type LoginFormValues = z.infer<typeof loginSchema>
