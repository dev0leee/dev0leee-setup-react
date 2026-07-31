import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useLocation, useNavigate } from 'react-router-dom'

import { usePatchSurveyCertNamePhone } from '@/features/survey/queries/useSurvey'
import {
  type SurveyAuthNamePhoneForm,
  surveyAuthNamePhoneSchema,
} from '@/features/survey/schemas/survey'
import { ButtonBase } from '@/shared/components/common/ButtonBase'
import { InputBase } from '@/shared/components/common/InputBase'
import { ModalButton } from '@/shared/components/common/ModalButton'
import { SpinnerCircle } from '@/shared/components/common/SpinnerCircle'
import { TextError } from '@/shared/components/common/TextError'
import { ACCESS_DENIED_MODAL_DATA } from '@/shared/constants/message'
import { ROUTE_PATH } from '@/shared/constants/routes'

/**
 * 이름·휴대폰 본인인증 (SV6). 레거시 `Auth/SurveyAuthNamePhoneView.vue`(154 LOC) 이식.
 *
 * **PASS를 쓰지 않는 투표의 인증 방식이다.** 동/호수는 상세 화면이 `state`로 넘겨준
 * 값을 **읽기 전용으로 보여주기만** 한다 — 검증에도 제출에도 쓰지 않는다.
 *
 * ⚠️ **직접 URL로 들어오면 "잘못된 접근입니다" 모달을 띄우고 목록으로 보낸다.**
 * opinion 앱에서는 `/survey/list`가 **NotFound 화면**이라 거기로 떨어진다 —
 * 투표(VT6)는 그 경로가 아예 없어 매칭 실패였다. **같은 문제의 결과가 다르다** (SV-Q5).
 *
 * ✅ **휴대폰 검증 에러가 정상으로 뜬다.** 투표(VT6)는 없는 필드 `errors.id`를 읽어
 * 아무것도 안 보였는데(D-296) 설문은 `errors.phone`을 제대로 읽는다.
 * **복사된 두 화면 중 한쪽만 고쳐져 있다.**
 *
 * ⚠️ **버튼 색이 `isValid`가 아니라 에러 개수로 갈린다.** vee-validate의 `meta.valid`는
 * 검증 전에 `true`이고 RHF의 `isValid`는 `false`라 정반대다 — 첫 화면에서 색이 달라진다
 * (`recipe.md` §8).
 */
export const SurveyCertNamePhonePage = () => {
  const navigate = useNavigate()
  const { state } = useLocation() as {
    state: { auth?: boolean; dong?: string; ho?: string } | null
  }

  const [isForbiddenOpen, setIsForbiddenOpen] = useState(!state?.auth)

  const { patchSurveyCertNamePhoneMutation, isPatchSurveyCertNamePhonePending } =
    usePatchSurveyCertNamePhone()

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<SurveyAuthNamePhoneForm>({
    resolver: zodResolver(surveyAuthNamePhoneSchema),
    mode: 'onChange',
    defaultValues: { name: '', phone: '' },
  })

  const hasError = Object.keys(errors).length > 0

  const closeForbidden = () => {
    setIsForbiddenOpen(false)
    void navigate(ROUTE_PATH.SURVEY_LIST)
  }

  return (
    <div className="h-full overflow-auto">
      <form
        className="space-y-5 p-5 pb-14"
        onSubmit={(event) => {
          void handleSubmit((values) => {
            patchSurveyCertNamePhoneMutation(values)
          })(event)
        }}
      >
        {/* 🔴 **설문인데 `투표자 정보`다.** 투표에서 복사한 흔적이다 (D-314) */}
        <h3 className="font-bold">투표자 정보</h3>

        <div className="space-y-3">
          <label
            htmlFor="dong"
            className="flex items-center gap-1 text-center pretendard-15SemiBold text-defaults-primary-text-primary"
          >
            동/호수
          </label>
          <div className="flex gap-3">
            <div className="flex w-full flex-col gap-2">
              <div className="relative w-full">
                <InputBase
                  id="dong"
                  type="text"
                  placeholder="동 입력"
                  maxLength={5}
                  className="w-full py-[10px] pr-[30px] pl-4"
                  isDisabled
                  value={state?.dong ?? ''}
                  onChange={() => {
                    // 비활성이라 호출되지 않는다
                  }}
                />
                <label
                  className="absolute top-1/2 right-3 translate-y-[-50%] pretendard-16SemiBold text-defaults-secondary-text-secondary"
                  htmlFor="dong"
                >
                  동
                </label>
              </div>
            </div>
            <div className="flex w-full flex-col gap-2">
              <div className="relative w-full">
                <InputBase
                  id="ho"
                  type="text"
                  placeholder="호수 입력"
                  maxLength={5}
                  className="w-full py-[10px] pr-[42px] pl-4"
                  isDisabled
                  value={state?.ho ?? ''}
                  onChange={() => {
                    // 비활성이라 호출되지 않는다
                  }}
                />
                <label
                  className="absolute top-1/2 right-3 translate-y-[-50%] pretendard-16SemiBold text-defaults-secondary-text-secondary"
                  htmlFor="ho"
                >
                  호수
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <label
            htmlFor="name"
            className="flex items-center gap-1 text-center pretendard-15SemiBold text-defaults-primary-text-primary"
          >
            이름
          </label>
          <Controller
            name="name"
            control={control}
            render={({ field }) => {
              return (
                <InputBase
                  id="name"
                  type="text"
                  maxLength={10}
                  placeholder="이름 입력"
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                />
              )
            }}
          />
          <TextError>{errors.name?.message}</TextError>
        </div>

        <div className="space-y-3">
          <label
            htmlFor="phone"
            className="flex items-center gap-1 text-center pretendard-15SemiBold text-defaults-primary-text-primary"
          >
            휴대폰 번호
          </label>
          <Controller
            name="phone"
            control={control}
            render={({ field }) => {
              return (
                <InputBase
                  id="phone"
                  type="tel"
                  maxLength={13}
                  placeholder="휴대폰 번호(- 없이 숫자만 입력)"
                  className="mb-[6px]"
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                />
              )
            }}
          />
          {/* ✅ 투표와 달리 제대로 읽는다 */}
          <TextError>{errors.phone?.message}</TextError>
        </div>

        <ButtonBase
          type="submit"
          roundType="square"
          size="2xl"
          color={hasError ? 'defaults-secondary' : 'brand'}
          className="fixed bottom-0 left-0 flex justify-center"
          disabled={isPatchSurveyCertNamePhonePending}
        >
          {isPatchSurveyCertNamePhonePending ? <SpinnerCircle /> : <span>완료</span>}
        </ButtonBase>
      </form>

      <ModalButton
        open={isForbiddenOpen}
        onClose={closeForbidden}
        buttonType="single"
        modalData={ACCESS_DENIED_MODAL_DATA}
        onFirstClick={closeForbidden}
      />
    </div>
  )
}
