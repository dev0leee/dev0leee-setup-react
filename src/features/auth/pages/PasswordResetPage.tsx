import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useLocation, useNavigate } from 'react-router-dom'

import { PASSWORD_MAX_LENGTH } from '@/features/auth/constants/passwordReset'
import { usePatchPasswordReset } from '@/features/auth/queries/usePatchPasswordReset'
import { type PasswordResetForm, passwordResetSchema } from '@/features/auth/schemas/passwordReset'
import type { PasswordResetLocationState } from '@/features/auth/types/auth'
import { ButtonBase } from '@/shared/components/common/ButtonBase'
import { InputPassword } from '@/shared/components/common/InputPassword'
import { SpinnerCircle } from '@/shared/components/common/SpinnerCircle'
import { TextError } from '@/shared/components/common/TextError'
import { TextTitle } from '@/shared/components/common/TextTitle'
import { ROUTE_PATH } from '@/shared/constants/routes'

/** 폼 id. 하단 고정 `완료` 버튼이 폼 밖에 있어 `form` 속성으로 연결한다 */
const PASSWORD_UPDATE_FORM_ID = 'passwordUpdateForm'

/**
 * 비밀번호 재설정. 레거시 `LoginView/PasswordResetView.vue` 이식 (`auth.md` A3).
 *
 * ⚠️ **인증 토큰은 라우터 state로만 들어온다.** 없으면 직접 진입이므로 `/`로 돌린다.
 * 레거시는 `window.history.state`를 직접 읽고 `history.replaceState({}, '', pathname)`로
 * 비웠다 — 새로고침하면 토큰이 사라져 `/`로 튕기게 만드는 장치다. 타깃에서는 같은 효과를
 * `navigate(..., { replace: true, state: null })`로 낸다. `window.history`를 직접 덮으면
 * react-router가 쓰는 `key`·`idx`까지 날아가 히스토리 추적이 깨진다.
 *
 * ⚠️ **제출 시 `password`가 아니라 `passwordConfirm` 값을 보낸다** (`PasswordResetView.vue:41`).
 * 두 값이 같아야 통과하므로 결과는 같지만 레거시 그대로 둔다 (`auth.md` 주의 7).
 *
 * ⚠️ 레거시는 state로 `pageTitle`도 받아 `ref`에 담았지만 **어디에도 렌더하지 않는다.**
 * AppBar 제목은 라우트 meta(`새 비밀번호 설정`)에서 온다 — 죽은 값이라 옮기지 않았다.
 */
export const PasswordResetPage = () => {
  const navigate = useNavigate()
  const location = useLocation()

  // 초기화 함수로 한 번만 읽는다. 아래 effect가 히스토리 state를 비우기 때문에
  // 렌더마다 `location.state`를 읽으면 두 번째 렌더에서 토큰을 잃는다.
  const [verifiedToken] = useState(() => {
    const state = location.state as PasswordResetLocationState | null
    return state?.verifiedToken ?? ''
  })

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<PasswordResetForm>({
    resolver: zodResolver(passwordResetSchema),
    mode: 'onChange',
    defaultValues: { password: '', passwordConfirm: '' },
  })

  const { patchPasswordResetMutation, isPatchPasswordResetPending } = usePatchPasswordReset()

  useEffect(() => {
    if (!verifiedToken) {
      void navigate(ROUTE_PATH.HOME)
      return
    }

    void navigate(ROUTE_PATH.PASSWORD_RESET, { replace: true, state: null })
  }, [verifiedToken, navigate])

  const isFormValid = Object.keys(errors).length === 0

  return (
    <div className="flex h-full w-full flex-col justify-between overflow-y-auto p-5">
      <div className="h-full">
        <TextTitle>
          비밀번호를
          <br />
          재설정 해주세요
        </TextTitle>
        <form
          id={PASSWORD_UPDATE_FORM_ID}
          className="flex flex-col items-center gap-7 self-stretch"
          onSubmit={(event) => {
            void handleSubmit((values) => {
              patchPasswordResetMutation({
                token: verifiedToken,
                password: values.passwordConfirm,
              })
            })(event)
          }}
        >
          <div className="flex flex-col gap-3 self-stretch">
            <label
              htmlFor="password"
              className="flex items-center gap-1 text-center pretendard-15SemiBold text-defaults-primary-text-primary"
            >
              비밀번호
              <img src="/assets/icons/Essential.svg" alt="별표 아이콘" />
            </label>
            <Controller
              control={control}
              name="password"
              render={({ field }) => {
                return (
                  <InputPassword
                    id="password"
                    placeholder="영문, 숫자, 특수문자(~!@#$%^&*()?) 3가지 포함 8자 이상"
                    maxLength={PASSWORD_MAX_LENGTH}
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                  />
                )
              }}
            />
            <TextError>{errors.password?.message}</TextError>
          </div>
          <div className="flex flex-col gap-3 self-stretch">
            <label
              htmlFor="passwordConfirm"
              className="flex items-center gap-1 text-center pretendard-15SemiBold text-defaults-primary-text-primary"
            >
              비밀번호 확인
              <img src="/assets/icons/Essential.svg" alt="별표 아이콘" />
            </label>
            <Controller
              control={control}
              name="passwordConfirm"
              render={({ field }) => {
                return (
                  <InputPassword
                    id="passwordConfirm"
                    placeholder="비밀번호를 한번 더 입력해주세요"
                    maxLength={PASSWORD_MAX_LENGTH}
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                  />
                )
              }}
            />
            <TextError>{errors.passwordConfirm?.message}</TextError>
          </div>
        </form>
      </div>
      <ButtonBase
        type="submit"
        form={PASSWORD_UPDATE_FORM_ID}
        roundType="rounded"
        color={isFormValid ? 'brand' : 'defaults-secondary'}
        disabled={isPatchPasswordResetPending}
        size="xl"
        hasOutline={!isFormValid}
        className="flex w-full justify-center"
      >
        {isPatchPasswordResetPending ? <SpinnerCircle /> : <span>완료</span>}
      </ButtonBase>
    </div>
  )
}
