import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'

import { usePatchLogin } from '@/features/auth/queries/usePatchLogin'
import { type LoginFormValues, loginSchema } from '@/features/auth/schemas/login'
import { ButtonBase } from '@/shared/components/common/ButtonBase'
import { InputBase } from '@/shared/components/common/InputBase'
import { InputPassword } from '@/shared/components/common/InputPassword'
import { SpinnerCircle } from '@/shared/components/common/SpinnerCircle'
import { TextError } from '@/shared/components/common/TextError'

/** 휴대폰 번호 입력 `maxlength`. 하이픈 2개를 포함한 길이다(010-1234-5678) */
const PHONE_INPUT_MAX_LENGTH = 13

/**
 * 인트로의 로그인 폼. 레거시 `IntroView/IntroForm.vue` 이식.
 *
 * 화면(`IntroPage`)과 분리된 것은 레거시 구조 그대로다 — 배경·로고·링크는 폼이
 * 다시 렌더되는 것과 무관하다.
 *
 * ⚠️ **버튼 색을 `formState.isValid`로 정하지 않는다.** 레거시 `meta.valid`는
 * "에러 객체가 비어 있음"이라 **검증 전에는 `true`** 다 — 화면에 들어온 직후 버튼이
 * 활성색(brand)이다. `isValid`를 쓰면 처음에 회색으로 시작해 눈에 보이는 차이가 난다
 * (`recipe.md` §7).
 *
 * ⚠️ 두 입력은 제어 컴포넌트라 `register`가 아니라 `Controller`로 붙인다.
 * 레거시 `InputBase`는 `id`를 필드명으로 썼으므로 `name`도 `id`와 같게 맞춘다.
 */
export const IntroForm = () => {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    // vee-validate는 입력 중에 검증한다. RHF 기본(onSubmit)이면 에러가 늦게 뜬다.
    mode: 'onChange',
    defaultValues: { id: '', password: '' },
  })

  const { patchLoginMutation, isPatchLoginPending } = usePatchLogin()

  // 레거시 `meta.valid`와 같은 의미다 — 값의 존재가 아니라 에러의 부재를 본다.
  const hasNoError = Object.keys(errors).length === 0

  return (
    <form
      className="flex w-full flex-col gap-3 px-6 py-5"
      onSubmit={(event) => {
        void handleSubmit((values) => {
          // 이동·에러 모달·토큰 저장은 전부 usePatchLogin이 한다 (`auth.md` A1-2).
          patchLoginMutation(values)
        })(event)
      }}
    >
      <div className="flex w-full flex-col items-center gap-4 bg-base-b-white">
        <ol className="flex w-full flex-col gap-2 bg-base-b-white">
          <li>
            <Controller
              control={control}
              name="id"
              render={({ field }) => {
                return (
                  <InputBase
                    id="id"
                    name="id"
                    type="tel"
                    placeholder="휴대폰 번호(- 없이 숫자만 입력)"
                    maxLength={PHONE_INPUT_MAX_LENGTH}
                    className="mb-[6px]"
                    value={field.value}
                    onChange={(value) => {
                      field.onChange(value)
                    }}
                    onBlur={field.onBlur}
                  />
                )
              }}
            />
            <TextError>{errors.id?.message}</TextError>
          </li>
          <li>
            <Controller
              control={control}
              name="password"
              render={({ field }) => {
                return (
                  <InputPassword
                    id="password"
                    placeholder="비밀번호"
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                  />
                )
              }}
            />
            <TextError className="mt-[6px]">{errors.password?.message}</TextError>
          </li>
        </ol>
      </div>

      <ButtonBase
        type="submit"
        roundType="rounded"
        disabled={isPatchLoginPending}
        color={hasNoError ? 'brand' : 'defaults-secondary'}
        className="flex justify-center"
      >
        {isPatchLoginPending ? <SpinnerCircle /> : <span>로그인</span>}
      </ButtonBase>
    </form>
  )
}
