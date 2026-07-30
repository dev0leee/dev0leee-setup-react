import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'

import { PasswordEditModal } from '@/features/mypage/components/PasswordEditModal'
import { PROFILE_TEXT } from '@/features/mypage/constants/mypage'
import { usePatchMyProfile } from '@/features/mypage/queries/usePatchMyProfile'
import { type MypageProfileForm, mypageProfileSchema } from '@/features/mypage/schemas/profile'
import { ButtonBase } from '@/shared/components/common/ButtonBase'
import { InputBase } from '@/shared/components/common/InputBase'
import { SpinnerCircle } from '@/shared/components/common/SpinnerCircle'
import { TextError } from '@/shared/components/common/TextError'
import { AppBar } from '@/shared/components/layouts/AppBar'
import { useAuthStore } from '@/shared/stores/authStore'

/**
 * 내 프로필 수정 (P3). 레거시 `MyProfileEditView.vue` 이식.
 *
 * ⚠️ **이름 입력은 `<form>` 태그 밖에 있다.** 레거시 `InputBase`가 `useField(id)`로
 * 폼 컨텍스트에 직접 등록하기 때문에 DOM 위치와 무관하게 검증 대상이었다
 * (`mypage.md` P-Q3). 그래서 스키마에 `name`이 있고, 이름이 유효하지 않으면
 * `완료` 버튼이 활성색이 되지 않는다. RHF에서는 마크업 구조와 무관하게 폼이 값을
 * 소유하므로 **읽기 전용 이름도 `defaultValues`에 넣어** 같은 상태를 만든다.
 *
 * ⚠️ **버튼 활성색 판정이 `errors` 비어 있음**이다. 레거시 `meta.valid`가
 * 에러 유무 기반이라 검증 전에는 true다 — 진입 직후 버튼이 파랗다.
 * `formState.isValid`를 쓰면 진입 시 회색이 되어 어긋난다.
 *
 * ⚠️ AppBar의 `form`/`type="submit"` 조합으로 화면 밖 버튼이 폼을 제출한다.
 * React에서도 같은 방식이 동작하므로 유지했다.
 */
export const ProfileEditPage = () => {
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)
  const aptInfo = useAuthStore((state) => {
    return state.aptInfo
  })

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<MypageProfileForm>({
    resolver: zodResolver(mypageProfileSchema),
    mode: 'onChange',
    defaultValues: {
      nickName: aptInfo.residentNickName ?? '',
      // 읽기 전용이지만 검증·제출 값에 포함된다 (위 주석 참고)
      name: aptInfo.residentName ?? '',
    },
  })

  const { patchMyProfileMutation, isPatchMyProfilePending } = usePatchMyProfile()

  const onSubmit = handleSubmit((formValues) => {
    patchMyProfileMutation(formValues)
  })

  const hasNoError = Object.keys(errors).length === 0

  return (
    <div className="h-full w-full overflow-auto">
      <AppBar title="내 정보">
        <button
          form="profileEditForm"
          type="submit"
          disabled={isPatchMyProfilePending}
          className={`flex justify-center ${hasNoError ? 'text-brand-default-text-brand' : ''}`}
        >
          {isSubmitting || isPatchMyProfilePending ? (
            <SpinnerCircle color="blue" />
          ) : (
            <span>완료</span>
          )}
        </button>
      </AppBar>

      <div className="h-full w-full px-5 pt-16">
        <div className="mx-auto h-20 w-20 overflow-hidden rounded-full border border-neutral-b-gray-100">
          <img className="h-20 w-20" src="/assets/images/Profile.svg" alt="프로필 이미지" />
        </div>

        <div className="mt-8 space-y-6 pb-5">
          <div className="flex flex-col items-start gap-2 self-stretch">
            <label htmlFor="name" className="pretendard-15SemiBold text-neutral-b-gray-900">
              {PROFILE_TEXT.NAME_LABEL}
            </label>
            <div className="flex w-full flex-col items-start gap-1.5">
              <InputBase
                id="name"
                type="text"
                value={aptInfo.residentName}
                placeholder={PROFILE_TEXT.NAME_PLACEHOLDER}
                isDisabled
                // 읽기 전용이라 값이 바뀌지 않는다. 폼 값은 defaultValues가 갖고 있다
                onChange={() => {}}
              />
            </div>
          </div>

          <form id="profileEditForm" className="w-full space-y-5" onSubmit={onSubmit}>
            <div className="flex flex-col items-start gap-2 self-stretch">
              <label htmlFor="nickName" className="pretendard-15SemiBold text-neutral-b-gray-900">
                {PROFILE_TEXT.NICKNAME_LABEL}
              </label>
              <div className="flex w-full flex-col items-start gap-1.5">
                <Controller
                  control={control}
                  name="nickName"
                  render={({ field }) => {
                    return (
                      <InputBase
                        id="nickName"
                        type="text"
                        placeholder={PROFILE_TEXT.NICKNAME_PLACEHOLDER}
                        maxLength={PROFILE_TEXT.NICKNAME_MAX_LENGTH}
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                      />
                    )
                  }}
                />
                <TextError>{errors.nickName?.message}</TextError>
              </div>
            </div>
          </form>

          <ButtonBase
            type="button"
            roundType="rounded"
            color="brand"
            className="mt-2"
            onClick={() => {
              setIsPasswordModalOpen(true)
            }}
          >
            비밀번호 변경하기
          </ButtonBase>
        </div>

        <PasswordEditModal
          open={isPasswordModalOpen}
          onClose={() => {
            setIsPasswordModalOpen(false)
          }}
        />
      </div>
    </div>
  )
}
