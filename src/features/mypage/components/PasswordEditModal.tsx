import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'

import { PASSWORD_MODAL_TEXT } from '@/features/mypage/constants/mypage'
import { usePatchPasswordEdit } from '@/features/mypage/queries/usePatchPasswordEdit'
import { type PasswordEditForm, passwordEditSchema } from '@/features/mypage/schemas/profile'
import { ButtonBase } from '@/shared/components/common/ButtonBase'
import { InputBase } from '@/shared/components/common/InputBase'
import { ModalBase } from '@/shared/components/common/ModalBase'
import { SpinnerCircle } from '@/shared/components/common/SpinnerCircle'
import { TextError } from '@/shared/components/common/TextError'

/**
 * 비밀번호 변경 모달. 레거시 `MyProfilePasswordEditModal.vue` 이식.
 *
 * ⚠️ **제출 버튼 활성 조건이 `isValid`가 아니다.** 레거시는
 * `세 값이 모두 있음 && 에러 객체가 비어 있음`으로 판정한다 — 검증이 아직 돌지 않은
 * 초기 상태에서는 에러가 없으니 통과한다. `formState.isValid`로 바꾸면
 * 활성화 시점이 달라지므로 레거시 조건을 그대로 계산한다 (`mypage.md` 주의 4).
 *
 * ⚠️ 성공하면 **모달만 닫는다.** 화면 이동도 폼 리셋도 없다. 레거시가
 * `watch(isSuccess)`로 emit하던 것을 effect로 옮겼다 — 뮤테이션 성공은
 * 렌더 밖 이벤트라 여기서는 effect가 맞다.
 */
export const PasswordEditModal = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<PasswordEditForm>({
    resolver: zodResolver(passwordEditSchema),
    mode: 'onChange',
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  })

  const { patchPasswordEditMutation, isPatchPasswordEditPending, isPatchPasswordEditSuccess } =
    usePatchPasswordEdit()

  useEffect(() => {
    if (!isPatchPasswordEditSuccess) return
    onClose()
  }, [isPatchPasswordEditSuccess, onClose])

  const values = watch()
  const isFormValid = Boolean(
    values.currentPassword &&
    values.newPassword &&
    values.confirmPassword &&
    Object.keys(errors).length === 0,
  )

  const onSubmit = handleSubmit((formValues) => {
    // 폼 필드명과 요청 필드명이 다르다. 서버 계약이다
    patchPasswordEditMutation({
      oldPassword: formValues.currentPassword,
      password: formValues.newPassword,
    })
  })

  const fields = [
    {
      id: 'currentPassword' as const,
      label: PASSWORD_MODAL_TEXT.CURRENT_LABEL,
      placeholder: PASSWORD_MODAL_TEXT.CURRENT_PLACEHOLDER,
      className: 'mb-4',
    },
    {
      id: 'newPassword' as const,
      label: PASSWORD_MODAL_TEXT.NEW_LABEL,
      placeholder: PASSWORD_MODAL_TEXT.NEW_PLACEHOLDER,
      className: 'mb-4',
    },
    {
      id: 'confirmPassword' as const,
      label: PASSWORD_MODAL_TEXT.CONFIRM_LABEL,
      placeholder: PASSWORD_MODAL_TEXT.CONFIRM_PLACEHOLDER,
      // 마지막 필드만 아래 여백이 넓다
      className: 'mb-6',
    },
  ]

  return (
    <ModalBase open={open} onClose={onClose}>
      <div className="flex w-[334px] max-w-[80vw] flex-col rounded-lg bg-base-b-white">
        <div className="mb-2 flex w-full items-center justify-between p-5 pb-2">
          <h1 className="pretendard-18Bold text-base-b-black">{PASSWORD_MODAL_TEXT.TITLE}</h1>
          <button
            type="button"
            className="flex h-7 w-7 items-center justify-center"
            aria-label="닫기"
            onClick={onClose}
          >
            {/* 아이콘이 아니라 곱셈 기호 문자다. 레거시 그대로 */}
            <span className="pretendard-20Bold">×</span>
          </button>
        </div>

        <form className="p-5 pt-2" onSubmit={onSubmit}>
          {fields.map((field) => {
            return (
              <div key={field.id} className={field.className}>
                <label
                  htmlFor={field.id}
                  className="mb-1 block pretendard-14Medium text-neutral-b-gray-700"
                >
                  {field.label} <span className="text-[#ef4444]">*</span>
                </label>
                {/* `InputBase`는 값을 부모가 소유하는 제어 컴포넌트다. RHF의 `register`는
                    DOM ref와 이벤트 객체를 요구하므로 맞지 않는다 → `Controller`로 잇는다.
                    `field.onChange`는 값을 그대로 받으므로 변환이 필요 없다. */}
                <Controller
                  control={control}
                  name={field.id}
                  render={({ field: controllerField }) => {
                    return (
                      <InputBase
                        id={field.id}
                        type="password"
                        placeholder={field.placeholder}
                        isRequired
                        value={controllerField.value}
                        onChange={controllerField.onChange}
                        onBlur={controllerField.onBlur}
                      />
                    )
                  }}
                />
                {errors[field.id] && (
                  <TextError className="mt-1 pretendard-12Regular">
                    {errors[field.id]?.message}
                  </TextError>
                )}
              </div>
            )
          })}

          <ButtonBase
            type="submit"
            roundType="rounded"
            color="brand"
            disabled={!isFormValid || isPatchPasswordEditPending}
            className="flex w-full justify-center"
          >
            {isPatchPasswordEditPending ? (
              <SpinnerCircle />
            ) : (
              <span>{PASSWORD_MODAL_TEXT.SUBMIT}</span>
            )}
          </ButtonBase>
        </form>
      </div>
    </ModalBase>
  )
}
