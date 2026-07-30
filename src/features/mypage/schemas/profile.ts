import { z } from 'zod'

import { NAME_REGEX, NICKNAME_REGEX, PASSWORD_REGEX } from '@/shared/constants/regex'

/**
 * 마이페이지 폼 스키마. 레거시 `schemas/resident.js` 이식.
 *
 * zod 3의 `required_error`는 4에서 `error`로 바뀌었다 (`zod-migration.md`).
 * 다만 RHF는 필드를 항상 문자열로 초기화하므로 이 메시지가 실제로 보일 일은 없다 —
 * 빈 문자열은 `min` 검사에 걸린다.
 */

/**
 * 프로필 수정. **`name`이 스키마에 있다.**
 *
 * ⚠️ 레거시 `InputBase`는 `useField(props.id)`로 등록해서 `<form>` 태그 밖에 있는
 * 이름 입력도 폼에 포함됐다 (`mypage.md` P3 P-Q3). 읽기 전용이라 값이 바뀌진 않지만
 * **검증 대상에는 들어간다** — 이름이 유효하지 않으면 `완료` 버튼이 활성색이 되지 않는다.
 * RHF에서도 `name`을 defaultValues에 넣어 같은 상태를 만든다.
 */
export const mypageProfileSchema = z.object({
  nickName: z
    .string()
    .trim()
    .min(2, { message: '2~10자로 입력해주세요' })
    .regex(NICKNAME_REGEX, '한글, 영문, 숫자만'),
  name: z
    .string()
    .trim()
    .min(2, { message: '2자 이상 입력해주세요' })
    .regex(NAME_REGEX, '한글, 영문, 띄어쓰기만'),
})

export type MypageProfileForm = z.infer<typeof mypageProfileSchema>

/**
 * 비밀번호 변경. 일치 검사는 스키마 레벨 `refine`이고 에러는 `confirmPassword`에 붙는다.
 *
 * ⚠️ **`newPassword`와 `confirmPassword` 둘 다 정규식 검사를 한다** — 확인 필드도
 * 형식 오류를 따로 보여준다. 레거시 그대로다.
 */
export const passwordEditSchema = z
  .object({
    currentPassword: z.string().min(1, '현재 비밀번호를 입력해주세요.'),
    newPassword: z.string().min(1, '변경할 비밀번호를 입력해주세요.').regex(PASSWORD_REGEX, {
      message: '영문, 숫자, 특수문자(~!@#$%^&*()?) 3가지 포함 8자 이상',
    }),
    confirmPassword: z.string().min(1, '비밀번호를 확인해주세요.').regex(PASSWORD_REGEX, {
      message: '영문, 숫자, 특수문자(~!@#$%^&*()?) 3가지 포함 8자 이상',
    }),
  })
  .refine(
    (data) => {
      return data.newPassword === data.confirmPassword
    },
    { message: '비밀번호가 일치하지 않습니다.', path: ['confirmPassword'] },
  )

export type PasswordEditForm = z.infer<typeof passwordEditSchema>
