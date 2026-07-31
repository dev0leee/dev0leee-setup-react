import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { useLocation, useParams } from 'react-router-dom'

import { REJECT_REASON_MAX_LENGTH } from '@/features/parking/constants/parking'
import { useRejectCar } from '@/features/parking/queries/useRejectCar'
import { type RejectCarForm, rejectCarSchema } from '@/features/parking/schemas/carManagement'
import { ButtonBase } from '@/shared/components/common/ButtonBase'
import { SpinnerCircle } from '@/shared/components/common/SpinnerCircle'
import { TextError } from '@/shared/components/common/TextError'

/**
 * 차량 거부 사유 (PK10). 레거시 `RejectCar/RejectReasonView.vue`(75 LOC) 이식.
 *
 * 🔴 **차량번호를 라우터 state로만 받는다.** 상세(PK9)의 거부 모달이 넘겨준다.
 * **새로고침·딥링크로 들어오면 빈 차량번호로 거부 요청이 나간다** — 게시글 신고
 * (`board.md` §5-13)·차량 수정 폼(D-243)과 같은 유형의 구조적 결함이다.
 * 등가 이관이라 그대로 옮겼다 (`deferred.md`).
 *
 * ⚠️ **100자를 넘겨 입력할 수 있다.** 상한을 `maxlength`가 아니라 스키마가 막아서
 * 제출할 때 에러가 뜬다. 게시글 신고는 반대로 JS로 잘라낸다 — **도메인 간 비대칭**을 유지한다.
 *
 * ⚠️ **검증에 실패해도 버튼이 눌린다.** `disabled`는 제출 중일 때만이고 색만 회색이다.
 *
 * ⚠️ 루트에 `relative`가 있어 버튼의 `absolute bottom-0`이 이 화면 기준으로 붙는다 —
 * 게시글 신고 화면은 `relative`가 없어 기준이 다르다(그쪽이 비정상이다).
 *
 * ⚠️ 레거시의 빈 `<span class="text-[#8f8f8f] …"></span>`은 옮기지 않았다. 죽은 마크업이다.
 */
export const RejectReasonPage = () => {
  const location = useLocation()
  const { uuid: parkingUuid } = useParams()

  // 🔴 state가 없으면 `''`가 그대로 전송된다 — 레거시는 `undefined`를 보낸다
  const carNum = (location.state as { carNum?: string } | null)?.carNum ?? ''

  const { rejectCarMutation, isRejectCarPending } = useRejectCar({ parkingUuid })

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RejectCarForm>({
    resolver: zodResolver(rejectCarSchema),
    mode: 'onChange',
    defaultValues: { rejectReason: '' },
  })

  const rejectReason = watch('rejectReason')
  const hasNoError = Object.keys(errors).length === 0

  const onSubmit = handleSubmit((formValues) => {
    rejectCarMutation({ carNum, reason: formValues.rejectReason })
  })

  return (
    <div className="relative h-full space-y-4 overflow-auto p-5">
      <div className="space-y-2.5">
        <span className="pretendard-18Bold">거부 사유를 입력해주세요</span>
      </div>

      <form id="reject-form" className="w-full space-y-3 self-stretch" onSubmit={onSubmit}>
        <Controller
          control={control}
          name="rejectReason"
          render={({ field }) => {
            return (
              <textarea
                value={field.value}
                placeholder="내용을 입력해주세요"
                className="h-[216px] w-full rounded border border-defaults-tertiary-border-tertiary bg-defaults-secondary-background-mono px-3 py-2.5 pretendard-16Regular"
                onChange={field.onChange}
                onBlur={field.onBlur}
              />
            )
          }}
        />

        <div className="flex w-full justify-between">
          <TextError>{errors.rejectReason?.message}</TextError>
          <div className="space-x-1 pretendard-13Regular text-defaults-secondary-text-secondary">
            <span className="pretendard-13SemiBold">글자 수 제한</span>
            <span>
              {rejectReason.length}/{REJECT_REASON_MAX_LENGTH}
            </span>
          </div>
        </div>
      </form>

      <ButtonBase
        form="reject-form"
        type="submit"
        className="absolute bottom-0 left-0 flex justify-center"
        roundType="square"
        size="2xl"
        color={hasNoError ? 'alerts-error' : 'defaults-secondary'}
        disabled={isRejectCarPending}
      >
        {isRejectCarPending ? <SpinnerCircle /> : <span>거부하기</span>}
      </ButtonBase>
    </div>
  )
}
