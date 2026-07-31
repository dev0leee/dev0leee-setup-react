import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useLocation, useNavigate } from 'react-router-dom'

import { usePatchVoteCertNamePhone } from '@/features/vote/queries/useVote'
import { type VoteAuthNamePhoneForm, voteAuthNamePhoneSchema } from '@/features/vote/schemas/vote'
import { ButtonBase } from '@/shared/components/common/ButtonBase'
import { InputBase } from '@/shared/components/common/InputBase'
import { ModalButton } from '@/shared/components/common/ModalButton'
import { SpinnerCircle } from '@/shared/components/common/SpinnerCircle'
import { TextError } from '@/shared/components/common/TextError'
import { ACCESS_DENIED_MODAL_DATA } from '@/shared/constants/message'
import { ROUTE_PATH } from '@/shared/constants/routes'

/**
 * 이름·휴대폰 본인인증 (VT6). 레거시 `Auth/VoteAuthNamePhoneView.vue`(154 LOC) 이식.
 *
 * **PASS를 쓰지 않는 투표의 인증 방식이다.** 동/호수는 상세 화면이 `state`로 넘겨준
 * 값을 **읽기 전용으로 보여주기만** 한다 — 검증에도 제출에도 쓰지 않는다.
 *
 * ⚠️ **직접 URL로 들어오면 "잘못된 접근입니다" 모달을 띄우고 목록으로 보낸다.**
 * 새로고침해도 `state`가 날아가 같은 모달이 뜬다 — 여기서는 **의도된 가드**다.
 * 목적지가 `/vote/list`라 **비회원(opinion)에게는 없는 경로**인데, 레거시 그대로다
 * (`vote.md` VT-Q5).
 *
 * 🔴 **휴대폰 검증 에러가 화면에 뜨지 않는다.** 레거시가 `errors.id`를 읽는데 스키마
 * 필드는 `phone`이라 항상 빈 값이었다 (`vote.md` §7-3). 형식이 틀리면 **버튼만 회색으로
 * 남고 이유를 알려주지 않는다.** 고치면 없던 문구가 생기므로 그대로 옮겼다.
 *
 * ⚠️ **버튼 색이 `isValid`가 아니라 에러 개수로 갈린다.** vee-validate의 `meta.valid`는
 * 검증 전에 `true`이고 RHF의 `isValid`는 `false`라 정반대다 — 첫 화면에서 색이 달라진다
 * (`recipe.md` §8).
 */
export const VoteCertNamePhonePage = () => {
  const navigate = useNavigate()
  const { state } = useLocation() as {
    state: { auth?: boolean; dong?: string; ho?: string } | null
  }

  const [isForbiddenOpen, setIsForbiddenOpen] = useState(!state?.auth)

  const { patchVoteCertNamePhoneMutation, isPatchVoteCertNamePhonePending } =
    usePatchVoteCertNamePhone()

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<VoteAuthNamePhoneForm>({
    resolver: zodResolver(voteAuthNamePhoneSchema),
    mode: 'onChange',
    defaultValues: { name: '', phone: '' },
  })

  const hasError = Object.keys(errors).length > 0

  const closeForbidden = () => {
    setIsForbiddenOpen(false)
    void navigate(ROUTE_PATH.VOTE_LIST)
  }

  return (
    <div className="h-full overflow-auto">
      <form
        className="space-y-5 p-5 pb-14"
        onSubmit={(event) => {
          void handleSubmit((values) => {
            patchVoteCertNamePhoneMutation(values)
          })(event)
        }}
      >
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
          {/* 🔴 레거시가 `errors.id`를 읽어 **아무것도 뜨지 않는다.** 그대로 둔다 */}
          <TextError />
        </div>

        <ButtonBase
          type="submit"
          roundType="square"
          size="2xl"
          color={hasError ? 'defaults-secondary' : 'brand'}
          className="fixed bottom-0 left-0 flex justify-center"
          disabled={isPatchVoteCertNamePhonePending}
        >
          {isPatchVoteCertNamePhonePending ? <SpinnerCircle /> : <span>완료</span>}
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
