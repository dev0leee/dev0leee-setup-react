import { z } from 'zod'

import { PASSWORD_REGEX, PHONE_CUSTOM_REGEX } from '@/shared/constants/regex'

/**
 * 비밀번호 재설정 3단계의 폼 스키마. 레거시 `schemas/resident.js` + `PasswordResetView.vue`
 * 인라인 스키마 이식 (`auth.md` A2·A3).
 *
 * zod 3의 `required_error`는 4에서 `error`로 바뀌었다(`zod-migration.md`). 다만 RHF는
 * 입력을 항상 문자열로 초기화하므로 그 메시지가 보일 일이 없어 옮기지 않는다 —
 * 빈 값은 `min`/`regex`에 걸린다.
 */

/**
 * 휴대폰 번호. **하이픈이 없는** 형태를 요구한다(`PHONE_CUSTOM_REGEX`).
 *
 * ⚠️ 로그인 폼의 `id`와 정규식이 다르다 — 저쪽은 `InputBase type="tel"`이 하이픈을
 * 넣어주지만 이 화면은 `type="text"`라 사용자가 넣은 숫자가 그대로 남는다.
 * 필드명(`noHyphenPhone`)이 그 차이를 말한다.
 */
export const phoneCertSchema = z.object({
  noHyphenPhone: z
    .string()
    .trim()
    .regex(PHONE_CUSTOM_REGEX, '휴대폰 번호 형식으로 - 없이 올바르게 입력해주세요')
    .max(13, '숫자만 입력해주세요'),
})

export type PhoneCertForm = z.infer<typeof phoneCertSchema>

/** 문자로 받은 6자리 인증번호. 세 검사 모두 레거시에 있는 그대로 옮겼다 */
export const verificationCodeSchema = z.object({
  verificationCode: z
    .string()
    .trim()
    .regex(/^\d{6}$/, '인증번호는 6자리 숫자여야 합니다.')
    .min(6, '인증번호는 6자리여야 합니다.')
    .max(6, '인증번호는 6자리여야 합니다.'),
})

export type VerificationCodeForm = z.infer<typeof verificationCodeSchema>

/**
 * 새 비밀번호. 레거시는 이 스키마를 화면 파일 안에 인라인으로 뒀다.
 *
 * ⚠️ 레거시 `passwordConfirm`의 `refine`은 `values.password`를 **클로저로** 참조해
 * 필드 단위로 검사했다. zod 4에서는 필드 스키마가 형제 값을 볼 수 없으므로
 * **스키마 레벨 `refine` + `path: ['passwordConfirm']`** 으로 옮긴다 — 에러가 붙는
 * 위치와 문구가 같아 화면 결과는 동일하다.
 *
 * ⚠️ 확인 필드에는 **복잡도 검사가 없다.** `min(1)`뿐이다 (마이페이지 비밀번호 변경은
 * 확인 필드에도 정규식을 건다 — 두 화면이 다르다). 레거시 그대로 둔다.
 */
export const passwordResetSchema = z
  .object({
    password: z.string().min(1, { message: '비밀번호를 입력해주세요' }).regex(PASSWORD_REGEX, {
      message: '영문, 숫자, 특수문자(~!@#$%^&*()?) 3가지 포함 8자 이상',
    }),
    passwordConfirm: z.string().min(1, { message: '비밀번호를 한번 더 입력해주세요' }),
  })
  .refine(
    (values) => {
      return values.passwordConfirm === values.password
    },
    { message: '비밀번호가 일치하지 않습니다', path: ['passwordConfirm'] },
  )

export type PasswordResetForm = z.infer<typeof passwordResetSchema>
