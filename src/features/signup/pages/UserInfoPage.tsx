import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'

import { SIGNUP_MAX_LENGTH, USER_INFO_BACK_MODAL_DATA } from '@/features/signup/constants/signup'
import { type UserInfoForm, userInfoSchema } from '@/features/signup/schemas/signup'
import { useSignUpStore } from '@/features/signup/stores/signUpStore'
import { ButtonBase } from '@/shared/components/common/ButtonBase'
import { InputBase } from '@/shared/components/common/InputBase'
import { InputPassword } from '@/shared/components/common/InputPassword'
import { ModalButton } from '@/shared/components/common/ModalButton'
import { TextError } from '@/shared/components/common/TextError'
import { TextTitle } from '@/shared/components/common/TextTitle'
import { AppBar } from '@/shared/components/layouts/AppBar'
import { ROUTE_PATH } from '@/shared/constants/routes'

/**
 * 내 정보 입력 (S3). 레거시 `SignUpView/SignUpUserInfoView.vue` 이식.
 *
 * ⚠️ **AppBar를 화면 안에서 렌더한다.** 라우트 meta는 `showAppBar:false`다 —
 * 뒤로가기를 눌렀을 때 바로 이동하지 않고 **확인 모달을 띄워야** 하기 때문이다.
 * 레거시가 `:navigate-fn`으로 주입한 것을 `onBack`으로 옮겼다.
 *
 * ⚠️ **이름·닉네임의 초기값이 KMC가 준 값이다.** 본인확인에서 받은 이름이 미리 채워진다.
 * 비밀번호 2개는 항상 빈 문자열이다.
 *
 * ⚠️ **접근 차단 검사가 없다.** 레거시 `onMounted`의 검사가 **주석 처리**돼 있어
 * `/signup/info/user`로 직접 들어오면 빈 폼이 그대로 보인다. S4는 같은 검사가 살아 있어
 * 비대칭이다 — 등가 이관으로 그대로 뒀다 (`signup.md` S-Q5).
 *
 * ⚠️ 죽은 `<style scoped>`(`.custom-date-picker`)는 옮기지 않았다. 날짜 선택기가 있었다가
 * 제거된 흔적이고 템플릿에서 쓰이지 않는다.
 */
export const UserInfoPage = () => {
  const navigate = useNavigate()
  const signUpInfo = useSignUpStore((state) => {
    return state.signUpInfo
  })
  const setSignUpInfo = useSignUpStore((state) => {
    return state.setSignUpInfo
  })

  const [isBackModalOpen, setIsBackModalOpen] = useState(false)

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<UserInfoForm>({
    resolver: zodResolver(userInfoSchema),
    mode: 'onChange',
    defaultValues: {
      name: signUpInfo.name ?? '',
      nickName: signUpInfo.nickName ?? '',
      password: '',
      passwordConfirm: '',
    },
  })

  // 레거시 `meta.valid`와 같은 의미다 — 에러의 부재이므로 진입 직후에도 참이다.
  const isFormValid = Object.keys(errors).length === 0

  const closeBackModal = () => {
    setIsBackModalOpen(false)
  }

  return (
    <div className="h-full">
      <AppBar
        onBack={() => {
          setIsBackModalOpen(true)
        }}
      />
      <div className="h-full w-full overflow-auto p-5">
        <TextTitle>내 정보 입력</TextTitle>
        <form
          className="flex flex-col items-center gap-7 self-stretch pb-14"
          onSubmit={(event) => {
            void handleSubmit((values) => {
              setSignUpInfo({
                name: values.name,
                nickName: values.nickName,
                password: values.password,
              })
              void navigate(ROUTE_PATH.SIGNUP_INFO_APT)
            })(event)
          }}
        >
          <div className="flex flex-col gap-3 self-stretch">
            <label
              htmlFor="name"
              className="flex items-center gap-1 text-center pretendard-15SemiBold text-defaults-primary-text-primary"
            >
              이름
              <img src="/assets/icons/Essential.svg" alt="별표 아이콘" />
            </label>
            <Controller
              control={control}
              name="name"
              render={({ field }) => {
                return (
                  <InputBase
                    id="name"
                    type="text"
                    placeholder="이름 입력"
                    maxLength={SIGNUP_MAX_LENGTH.NAME}
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                  />
                )
              }}
            />
            <TextError>{errors.name?.message}</TextError>
          </div>

          <div className="flex flex-col gap-3 self-stretch">
            <label
              htmlFor="nickName"
              className="flex items-center gap-1 text-center pretendard-15SemiBold text-defaults-primary-text-primary"
            >
              닉네임
              <img src="/assets/icons/Essential.svg" alt="별표 아이콘" />
            </label>
            <Controller
              control={control}
              name="nickName"
              render={({ field }) => {
                return (
                  <InputBase
                    id="nickName"
                    type="text"
                    placeholder="닉네임 입력"
                    maxLength={SIGNUP_MAX_LENGTH.NICK_NAME}
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                  />
                )
              }}
            />
            <TextError>{errors.nickName?.message}</TextError>
          </div>

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
                    placeholder="비밀번호 입력"
                    maxLength={SIGNUP_MAX_LENGTH.PASSWORD}
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
                    maxLength={SIGNUP_MAX_LENGTH.PASSWORD}
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                  />
                )
              }}
            />
            <TextError>{errors.passwordConfirm?.message}</TextError>
          </div>

          <ButtonBase
            type="submit"
            roundType="square"
            size="2xl"
            color={isFormValid ? 'brand' : 'defaults-secondary'}
            className="fixed bottom-0 left-0"
          >
            <span>완료</span>
          </ButtonBase>
        </form>

        <ModalButton
          open={isBackModalOpen}
          onClose={closeBackModal}
          buttonType="dual"
          modalData={USER_INFO_BACK_MODAL_DATA}
          onFirstClick={closeBackModal}
          onSecondClick={() => {
            closeBackModal()
            void navigate(ROUTE_PATH.HOME)
          }}
        />
      </div>
    </div>
  )
}
