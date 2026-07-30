import { z } from 'zod'

import { NAME_REGEX, NICKNAME_REGEX, PASSWORD_REGEX } from '@/shared/constants/regex'

/**
 * 회원가입 폼 스키마. 레거시는 두 화면 파일 안에 인라인으로 뒀다
 * (`SignUpUserInfoView.vue:25-39` · `SignUpAptInfoView.vue:23-44`).
 */

/**
 * S3 내 정보 입력.
 *
 * ⚠️ **비밀번호에 `PASSWORD_REGEX`를 적용한다.** 로그인(`auth.md` A1)은 적용하지 않는다 —
 * 신규 가입은 새 규칙, 로그인은 구버전 호환. **의도된 비대칭이다.**
 *
 * ⚠️ 확인 필드에는 복잡도 검사가 없다. 일치 검사만 한다(레거시 그대로).
 */
export const userInfoSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, { message: '2자 이상 입력해주세요' })
      .regex(NAME_REGEX, '한글, 영문, 띄어쓰기만'),
    nickName: z
      .string()
      .trim()
      .min(2, { message: '2~10자로 입력해주세요' })
      .regex(NICKNAME_REGEX, '한글, 영문, 숫자만'),
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

export type UserInfoForm = z.infer<typeof userInfoSchema>

/**
 * S4 아파트 설정.
 *
 * ⚠️ **`ho`의 대문자 검증이 `val === val.toUpperCase()`다.** 숫자만이면 통과하고
 * 소문자 영문이 섞이면 막힌다 (`101a` ✗ · `101A` ✓ · `101` ✓). 그대로 옮긴다.
 *
 * ⚠️ **`dong`이 문자열·숫자 둘 다 허용한다** (레거시 `z.union`). `InputBase`가
 * `type="text"`라 실제로는 문자열만 들어오지만 계약을 좁히지 않는다.
 *
 * ⚠️ `aptName`은 **읽기 전용**이다. 검색 모달에서만 값이 들어온다.
 */
export const aptInfoSchema = z.object({
  aptName: z.string().min(1, { message: '아파트명을 입력해주세요' }),
  dong: z.union([z.string().min(1, { message: '동을 입력해주세요' }), z.number()]),
  ho: z
    .string()
    .min(1, { message: '호수를 입력해주세요' })
    .refine(
      (value) => {
        return value === value.toUpperCase()
      },
      { message: '호수는 대문자로만 입력해주세요' },
    ),
  isHeadHousehold: z.string().min(1, { message: '세대주 여부를 선택해주세요' }),
})

export type AptInfoForm = z.infer<typeof aptInfoSchema>
