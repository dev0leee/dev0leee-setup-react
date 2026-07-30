import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'

import { AptSearchModal } from '@/features/signup/components/AptSearchModal'
import {
  APT_INFO_BACK_MODAL_DATA,
  HOUSEHOLD_HEAD_KEY,
  HOUSEHOLD_HEAD_OPTIONS,
  SIGNUP_MAX_LENGTH,
} from '@/features/signup/constants/signup'
import { usePostSignUp } from '@/features/signup/queries/usePostSignUp'
import { type AptInfoForm, aptInfoSchema } from '@/features/signup/schemas/signup'
import { useSignUpStore } from '@/features/signup/stores/signUpStore'
import { ButtonBase } from '@/shared/components/common/ButtonBase'
import { InputBase } from '@/shared/components/common/InputBase'
import { InputRadioDual } from '@/shared/components/common/InputRadioDual'
import { InputSearch } from '@/shared/components/common/InputSearch'
import { ModalButton } from '@/shared/components/common/ModalButton'
import { SpinnerCircle } from '@/shared/components/common/SpinnerCircle'
import { TextError } from '@/shared/components/common/TextError'
import { TextTitle } from '@/shared/components/common/TextTitle'
import { AppBar } from '@/shared/components/layouts/AppBar'
import { ACCESS_DENIED_MODAL_DATA } from '@/shared/constants/message'
import { ROUTE_PATH } from '@/shared/constants/routes'

/**
 * 아파트 설정 (S4). 레거시 `SignUpView/SignUpAptInfoView.vue` 이식.
 * 이 도메인에서 가장 복잡한 화면이다.
 *
 * ⚠️ **AppBar를 화면 안에서 렌더한다** (S3와 같은 이유 — 뒤로가기 확인 모달).
 * 다만 확인 시 가는 곳이 다르다: S3는 `/`, **S4는 S3로 돌아간다.**
 *
 * ⚠️ **아파트명은 직접 입력할 수 없다.** `InputSearch`가 읽기 전용이고 클릭하면 검색
 * 모달이 열린다. `aptUuid`는 폼이 아니라 별도 상태가 들고 있다 — 화면에 보이는 값(이름)과
 * 서버에 보내는 값(uuid)이 다르기 때문이다.
 *
 * ⚠️ **레거시 `selectedAptUuid` 초기값이 `'aaaa'`였다.** 하드코딩된 플레이스홀더인데
 * `aptName`이 필수라 실제로 전송되지는 않았다. 여기서는 `undefined`로 두고 **선택 전에는
 * 제출하지 않는다** — 눈에 보이는 동작은 같고 지뢰만 제거했다 (`deferred.md` D-26).
 *
 * ⚠️ **`signUpInfo`가 비어 있으면 접근 거부 모달을 띄운다.** 레거시는 `onMounted`에서
 * 검사했고, 여기서는 **렌더 중 판단**한다 — 스토어 값에서 곧바로 나오는 파생 상태라
 * effect가 필요 없다.
 */
export const AptInfoPage = () => {
  const navigate = useNavigate()
  const signUpInfo = useSignUpStore((state) => {
    return state.signUpInfo
  })
  const { postSignUpMutation, isPostSignUpPending } = usePostSignUp()

  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false)
  const [isBackModalOpen, setIsBackModalOpen] = useState(false)
  const [selectedAptUuid, setSelectedAptUuid] = useState<string>()
  /** 접근 거부 모달을 한 번 닫으면 다시 띄우지 않는다 */
  const [isAccessDeniedClosed, setIsAccessDeniedClosed] = useState(false)

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<AptInfoForm>({
    resolver: zodResolver(aptInfoSchema),
    mode: 'onChange',
    defaultValues: { aptName: '', dong: '', ho: '', isHeadHousehold: '' },
  })

  const isFormValid = Object.keys(errors).length === 0
  const hasSignUpInfo = Object.keys(signUpInfo).length > 0

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
      <div className="h-full w-full overflow-y-auto px-5 pt-16 pb-10">
        <TextTitle>아파트 설정</TextTitle>
        <form
          className="mt-7 flex flex-col items-center gap-7 self-stretch"
          onSubmit={(event) => {
            void handleSubmit((values) => {
              if (!selectedAptUuid) return

              postSignUpMutation({
                apiToken: signUpInfo.apiToken,
                certNum: signUpInfo.certNum,
                nickName: signUpInfo.nickName,
                password: signUpInfo.password,
                name: signUpInfo.name,
                birthDay: signUpInfo.birthDay,
                gender: signUpInfo.gender,
                nation: signUpInfo.nation,
                aptUuid: selectedAptUuid,
                dong: values.dong,
                ho: values.ho,
                // 라디오 값이 문자열이라 여기서 boolean으로 바꾼다
                householdHeadFlag: values.isHeadHousehold === HOUSEHOLD_HEAD_KEY,
                marketingDataConsentFlag: signUpInfo.marketingDataConsentFlag,
                receiveAdvertsConsentFlag: signUpInfo.receiveAdvertsConsentFlag,
              })
            })(event)
          }}
        >
          <div className="flex h-[92px] flex-col gap-3 self-stretch">
            <label
              htmlFor="aptName"
              className="flex items-center gap-1 text-center pretendard-15SemiBold text-defaults-primary-text-primary"
            >
              아파트명
            </label>
            <Controller
              control={control}
              name="aptName"
              render={({ field }) => {
                return (
                  <InputSearch
                    id="aptName"
                    value={field.value}
                    isReadonly
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    onClick={() => {
                      setIsSearchModalOpen(true)
                    }}
                  />
                )
              }}
            />
            {/* 레거시는 `values.aptName === undefined`일 때만 에러를 보여준다 */}
            <TextError>{errors.aptName?.message}</TextError>
          </div>

          <div className="flex flex-col gap-3 self-stretch">
            <label
              htmlFor="dong"
              className="flex items-center gap-1 text-center pretendard-15SemiBold text-defaults-primary-text-primary"
            >
              동/호수
            </label>
            <div className="flex gap-3">
              <div className="flex w-full flex-col gap-2">
                <div className="relative w-full">
                  <Controller
                    control={control}
                    name="dong"
                    render={({ field }) => {
                      return (
                        <InputBase
                          id="dong"
                          type="text"
                          placeholder="동 입력"
                          maxLength={SIGNUP_MAX_LENGTH.DONG}
                          className="w-full py-[10px] pr-[30px] pl-4"
                          value={field.value}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                        />
                      )
                    }}
                  />
                  <label
                    htmlFor="dong"
                    className="absolute top-1/2 right-3 translate-y-[-50%] pretendard-16SemiBold text-defaults-secondary-text-secondary"
                  >
                    동
                  </label>
                </div>
                <TextError>{errors.dong?.message}</TextError>
              </div>
              <div className="flex w-full flex-col gap-2">
                <div className="relative w-full">
                  <Controller
                    control={control}
                    name="ho"
                    render={({ field }) => {
                      return (
                        <InputBase
                          id="ho"
                          type="text"
                          placeholder="호수 입력"
                          maxLength={SIGNUP_MAX_LENGTH.HO}
                          className="w-full py-[10px] pr-[42px] pl-4"
                          value={field.value}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                        />
                      )
                    }}
                  />
                  <label
                    htmlFor="ho"
                    className="absolute top-1/2 right-3 translate-y-[-50%] pretendard-16SemiBold text-defaults-secondary-text-secondary"
                  >
                    호수
                  </label>
                </div>
                <TextError>{errors.ho?.message}</TextError>
              </div>
            </div>
          </div>

          <div className="mb-16 flex flex-col gap-3 self-stretch">
            <label
              htmlFor="isHeadHousehold-householdHead"
              className="flex items-center gap-1 text-center pretendard-15SemiBold text-defaults-primary-text-primary"
            >
              세대주 여부
            </label>
            <Controller
              control={control}
              name="isHeadHousehold"
              render={({ field }) => {
                return (
                  <InputRadioDual
                    name="isHeadHousehold"
                    list={HOUSEHOLD_HEAD_OPTIONS}
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                  />
                )
              }}
            />
            <TextError>{errors.isHeadHousehold?.message}</TextError>
          </div>

          <div className="fixed bottom-0 left-0 w-full space-y-4 pretendard-14Regular text-defaults-secondary-text-secondary">
            <ButtonBase
              type="submit"
              size="2xl"
              roundType="square"
              disabled={isPostSignUpPending}
              color={isFormValid ? 'brand' : 'defaults-secondary'}
              className="flex justify-center"
            >
              {isPostSignUpPending ? <SpinnerCircle /> : <span>완료</span>}
            </ButtonBase>
          </div>
        </form>
      </div>

      {isSearchModalOpen && (
        <AptSearchModal
          onClose={(apt) => {
            setIsSearchModalOpen(false)
            if (!apt) return

            setValue('aptName', apt.name, { shouldValidate: true })
            setSelectedAptUuid(apt.uuid)
          }}
        />
      )}

      <ModalButton
        open={isBackModalOpen}
        onClose={closeBackModal}
        buttonType="dual"
        modalData={APT_INFO_BACK_MODAL_DATA}
        onFirstClick={closeBackModal}
        onSecondClick={() => {
          closeBackModal()
          // ⚠️ S3의 모달은 `/`로 가지만 여기서는 앞 단계로 돌아간다
          void navigate(ROUTE_PATH.SIGNUP_INFO_USER)
        }}
      />

      <ModalButton
        open={!hasSignUpInfo && !isAccessDeniedClosed}
        onClose={() => {
          setIsAccessDeniedClosed(true)
          void navigate(ROUTE_PATH.HOME)
        }}
        buttonType="single"
        modalData={ACCESS_DENIED_MODAL_DATA}
        onFirstClick={() => {
          setIsAccessDeniedClosed(true)
          void navigate(ROUTE_PATH.HOME)
        }}
      />
    </div>
  )
}
