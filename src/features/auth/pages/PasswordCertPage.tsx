import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'

import {
  CERT_TIMER_SECONDS,
  SECONDS_PER_MINUTE,
  VERIFICATION_CODE_LENGTH,
} from '@/features/auth/constants/passwordReset'
import { usePostPasswordResetCodeVerify } from '@/features/auth/queries/usePostPasswordResetCodeVerify'
import { usePostPasswordResetSendCode } from '@/features/auth/queries/usePostPasswordResetSendCode'
import {
  type PhoneCertForm,
  phoneCertSchema,
  type VerificationCodeForm,
  verificationCodeSchema,
} from '@/features/auth/schemas/passwordReset'
import { ButtonBase } from '@/shared/components/common/ButtonBase'
import { InputBase } from '@/shared/components/common/InputBase'
import { TextError } from '@/shared/components/common/TextError'
import { TextTitle } from '@/shared/components/common/TextTitle'
import { ROUTE_PATH } from '@/shared/constants/routes'

/** 타이머 간격(ms) */
const TIMER_TICK_MS = 1_000

/** 폼 id. 하단 고정 `완료` 버튼이 폼 밖에 있어 `form` 속성으로 연결한다 */
const VERIFICATION_FORM_ID = 'verificationCodeForm'

const formatRemainingTime = ({ seconds }: { seconds: number }) => {
  const minutes = Math.floor(seconds / SECONDS_PER_MINUTE)
  const restSeconds = seconds % SECONDS_PER_MINUTE

  return `${String(minutes).padStart(2, '0')}:${String(restSeconds).padStart(2, '0')}`
}

/**
 * 비밀번호 휴대폰 인증. 레거시 `LoginView/PasswordPhoneCertView.vue` 이식 (`auth.md` A2).
 *
 * 폼이 **두 개**다 — 휴대폰 번호(전송)와 인증번호(검증)가 각자 스키마를 갖는다.
 * 레거시도 `useForm`을 두 번 불러 같은 구조였고, 인증번호 검증 시 휴대폰 값을
 * 첫 폼에서 꺼내 함께 보냈다. 그 관계를 `getValues`로 옮겼다.
 *
 * ⚠️ **인증 성공 시 화면이 사라진다.** 레거시 루트에 `v-if="!isSuccess"`가 걸려 있어
 * 이동 직전 한 프레임 빈 화면이 보인다 (`auth.md` A-Q2). 그대로 재현한다.
 *
 * ⚠️ **레거시 `setSignUpInfo({})`는 옮기지 않았다.** 마운트 시 가입 위저드를 초기화하려는
 * 코드였지만, 그 setter가 `{...기존, ...넘긴값}` 병합이라 **빈 객체를 넘기면 아무것도
 * 지워지지 않는다** — 실제로는 아무 일도 하지 않는 호출이다 (`deferred.md` D-206).
 */
export const PasswordCertPage = () => {
  const navigate = useNavigate()

  const [hasSentCode, setHasSentCode] = useState(false)
  const [isTimerActive, setIsTimerActive] = useState(false)
  const [remainingTime, setRemainingTime] = useState(CERT_TIMER_SECONDS)
  /** 타이머를 다시 시작하기 위한 식별자. 재요청 때 증가시켜 인터벌을 새로 만든다 */
  const [timerRunId, setTimerRunId] = useState(0)
  /** ⚠️ 한 번 `false`가 되면 다시 `true`로 돌아오지 않는다 — 레거시 그대로 (`auth.md` A-Q1) */
  const [canResend, setCanResend] = useState(true)

  const phoneForm = useForm<PhoneCertForm>({
    resolver: zodResolver(phoneCertSchema),
    mode: 'onChange',
    defaultValues: { noHyphenPhone: '' },
  })

  const codeForm = useForm<VerificationCodeForm>({
    resolver: zodResolver(verificationCodeSchema),
    mode: 'onChange',
    defaultValues: { verificationCode: '' },
  })

  const { postPasswordResetSendCodeMutation } = usePostPasswordResetSendCode()
  const { postPasswordResetCodeVerifyMutation, isCodeVerifySuccess } =
    usePostPasswordResetCodeVerify()

  const startTimer = () => {
    setRemainingTime(CERT_TIMER_SECONDS)
    setIsTimerActive(true)
    setTimerRunId((runId) => {
      return runId + 1
    })
  }

  // 외부 타이머를 붙였다 떼는 일이므로 effect가 맞다. `timerRunId`가 바뀌면
  // 이전 인터벌을 정리하고 새로 만든다 — 레거시 `startTimer`의 `clearInterval`과 같다.
  useEffect(() => {
    if (timerRunId === 0) return

    const intervalId = setInterval(() => {
      setRemainingTime((prev) => {
        return prev > 0 ? prev - 1 : prev
      })
    }, TIMER_TICK_MS)

    return () => {
      clearInterval(intervalId)
    }
  }, [timerRunId])

  // 만료 처리. 레거시는 **0이 된 다음 tick**에서 이동하므로 `00:00`이 1초간 보인다.
  useEffect(() => {
    if (!isTimerActive || remainingTime > 0) return

    const timeoutId = setTimeout(() => {
      setIsTimerActive(false)
      void navigate(ROUTE_PATH.HOME)
    }, TIMER_TICK_MS)

    return () => {
      clearTimeout(timeoutId)
    }
  }, [isTimerActive, remainingTime, navigate])

  const sendCode = ({ noHyphenPhone }: { noHyphenPhone: string }) => {
    postPasswordResetSendCodeMutation(
      { noHyphenPhone },
      {
        onSuccess: () => {
          startTimer()
          setHasSentCode(true)
        },
      },
    )
  }

  // 레거시 재요청은 폼 검증을 거치지 않고 저장된 번호로 바로 재전송한다.
  const handleResend = () => {
    sendCode({ noHyphenPhone: phoneForm.getValues('noHyphenPhone') })
    setCanResend(false)
  }

  // 인증 성공 순간 화면이 빈다 (레거시 `v-if`). 이어서 아래 이동이 일어난다.
  if (isCodeVerifySuccess) return null

  // 레거시 `passwordResetMeta.valid` · `verificationMeta.valid`와 같은 의미다 —
  // 값의 존재가 아니라 에러의 부재이므로 **진입 직후에도 참**이다 (`recipe.md` §7).
  const isPhoneValid = Object.keys(phoneForm.formState.errors).length === 0
  const isCodeValid = Object.keys(codeForm.formState.errors).length === 0

  return (
    <div className="flex h-full w-full flex-col justify-between gap-3 overflow-auto p-5">
      <div>
        <div>
          <TextTitle>
            <span>
              비밀번호 재설정을 위해
              <br />
              인증할게요
            </span>
          </TextTitle>

          <form
            id="passwordResetForm"
            onSubmit={(event) => {
              void phoneForm.handleSubmit(sendCode)(event)
            }}
          >
            <label
              htmlFor="noHyphenPhone"
              className="pretendard-15SemiBold text-defaults-primary-text-primary"
            >
              휴대폰 번호
            </label>
            <Controller
              control={phoneForm.control}
              name="noHyphenPhone"
              render={({ field }) => {
                return (
                  <InputBase
                    id="noHyphenPhone"
                    name="noHyphenPhone"
                    type="text"
                    placeholder="숫자만 입력"
                    className="mt-4 mb-2"
                    isDisabled={hasSentCode}
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                  />
                )
              }}
            />
            <TextError>{phoneForm.formState.errors.noHyphenPhone?.message}</TextError>
            {!hasSentCode && (
              <ButtonBase
                type="submit"
                hasOutline
                roundType="rounded"
                color="brand"
                disabled={!isPhoneValid}
                className="mt-2"
              >
                <span>인증번호 전송</span>
              </ButtonBase>
            )}
          </form>

          {hasSentCode && (
            <form
              id={VERIFICATION_FORM_ID}
              onSubmit={(event) => {
                void codeForm.handleSubmit(({ verificationCode }) => {
                  postPasswordResetCodeVerifyMutation(
                    {
                      verificationCode,
                      noHyphenPhone: phoneForm.getValues('noHyphenPhone'),
                    },
                    {
                      onSuccess: (verifiedToken) => {
                        // 토큰이 없으면 재설정 화면이 즉시 `/`로 튕긴다 — 서버가 헤더를
                        // 안 준 경우까지 레거시와 같은 결과가 된다.
                        void navigate(ROUTE_PATH.PASSWORD_RESET, { state: { verifiedToken } })
                      },
                    },
                  )
                })(event)
              }}
            >
              <label
                htmlFor="verificationCode"
                className="pretendard-15SemiBold text-defaults-primary-text-primary"
              >
                인증번호
              </label>
              <div className="relative">
                <Controller
                  control={codeForm.control}
                  name="verificationCode"
                  render={({ field }) => {
                    return (
                      <InputBase
                        id="verificationCode"
                        name="verificationCode"
                        type="text"
                        placeholder="인증번호 입력"
                        maxLength={VERIFICATION_CODE_LENGTH}
                        className="relative mt-4 mb-2"
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                      />
                    )
                  }}
                />
                {isTimerActive && (
                  <span className="absolute top-1/2 right-3 -translate-y-1/2 pretendard-15SemiBold text-[#eab308]">
                    {formatRemainingTime({ seconds: remainingTime })}
                  </span>
                )}
              </div>
              <TextError>{codeForm.formState.errors.verificationCode?.message}</TextError>
            </form>
          )}

          {hasSentCode && (
            <ButtonBase
              type="button"
              hasOutline
              roundType="rounded"
              color="brand"
              className="mt-2 mb-6"
              disabled={!canResend}
              onClick={handleResend}
            >
              <span>재요청</span>
            </ButtonBase>
          )}
        </div>
      </div>

      <ButtonBase
        type="submit"
        form={VERIFICATION_FORM_ID}
        size="xl"
        hasOutline={!isCodeValid}
        roundType="rounded"
        color="brand"
        disabled={!isCodeValid}
        className="w-full"
      >
        <span>완료</span>
      </ButtonBase>
    </div>
  )
}
