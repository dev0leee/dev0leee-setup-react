import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { Controller, type Resolver, useForm } from 'react-hook-form'
import { useParams } from 'react-router-dom'

import { BookmarkCarSelectorButton } from '@/features/parking/components/BookmarkCarSelectorButton'
import { ReservationDateField } from '@/features/parking/components/reservation/ReservationDateField'
import { VisitPurposeSelect } from '@/features/parking/components/VisitPurposeSelect'
import {
  CAR_FORM_MAX_LENGTH,
  CAR_FORM_PLACEHOLDER,
  PARKING_WALL_PAD_ALARM_DESCRIPTION,
  PARKING_WALL_PAD_ALARM_INPUT,
  RESERVATION_FORM_PLACEHOLDER,
} from '@/features/parking/constants/parking'
import { useWallPadContent } from '@/features/parking/hooks/useWallPadContent'
import { useVisitPurposeList } from '@/features/parking/queries/useCarLists'
import {
  usePostReservationCar,
  useReservationCarDetail,
} from '@/features/parking/queries/useReservationCar'
import {
  type ReservationForm,
  reservationSchema,
  reservationWithWallPadSchema,
} from '@/features/parking/schemas/carManagement'
import { ButtonBase } from '@/shared/components/common/ButtonBase'
import { InputBase } from '@/shared/components/common/InputBase'
import { InputRadioDual } from '@/shared/components/common/InputRadioDual'
import { SpinnerCircle } from '@/shared/components/common/SpinnerCircle'
import { TextError } from '@/shared/components/common/TextError'
import { formatPhone } from '@/shared/utils/formatPhone'

/** 필수 표시 아이콘 */
const EssentialMark = () => {
  return <img src="/assets/icons/Essential.svg" alt="별표 아이콘" />
}

/**
 * 방문예약 등록·재등록 (PK12·PK13). 레거시 `ReservationCarAddView.vue`(221 LOC) 이식.
 *
 * **경로에 `uuid`가 있으면 재등록**이고, 기존 예약에서 초기값을 가져온다.
 * 등록/재등록을 가르는 것은 라우트 파라미터 하나뿐이다 — 레거시와 같은 암묵적 설계다.
 *
 * ⚠️ **재등록이어도 예약 기간은 비워 둔다.** 날짜는 매번 새로 골라야 한다. 의도된 동작이다.
 *
 * 🔴 **기존 예약의 방문목적을 이름으로 되찾는다.** 상세 응답이 `visitPurpose`를 **이름
 * 문자열**로만 주기 때문에 목록에서 uuid를 찾아야 한다. 레거시는 `.find(...).uuid`에
 * 옵셔널이 없어 **관리사무소가 그 방문목적을 지웠으면 화면이 TypeError로 깨진다**
 * (`parking.md` PK-Q10). **이관본은 깨지지 않게 했다** — 못 찾으면 방문목적을 비워 두고
 * 사용자가 다시 고르게 한다. 정상 데이터에서는 결과가 같고, 크래시를 옮길 이유가 없다.
 *
 * ⚠️ **차량관리 폼(PK5~PK7)과 간격이 미묘하게 다르다** — `px-5`(vs `p-5`),
 * `gap-3`(vs `gap-[11px]`). 같은 폼처럼 보여도 픽셀이 다르다. UI 대조 시 주의한다.
 *
 * ⚠️ **차량번호·방문목적 placeholder 문구도 다르다** (`선택하세요` vs `선택해주세요`).
 */
export const ReservationFormPage = () => {
  const { uuid: parkingUuid } = useParams()
  const { hasWallPadUI } = useWallPadContent()

  const { visitPurposeList, isVisitPurposeLoading, isVisitPurposeError } = useVisitPurposeList()
  const { reservationCarDetail } = useReservationCarDetail({ parkingUuid })
  const { postReservationCarMutation, isPostReservationCarPending } = usePostReservationCar()

  const schema = hasWallPadUI ? reservationWithWallPadSchema : reservationSchema

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ReservationForm>({
    // 월패드 라디오 유무로 스키마가 갈리는데 폼 값 타입은 하나다 (`CarManagementFormPage` 동일)
    resolver: zodResolver(schema) as unknown as Resolver<ReservationForm>,
    mode: 'onChange',
  })

  /**
   * 재등록 초기값. 예약 상세와 방문목적 목록이 **둘 다** 도착해야 채울 수 있다 —
   * 방문목적 uuid를 목록에서 찾아야 하기 때문이다(레거시 `watch([detail, purposes])`).
   */
  useEffect(() => {
    if (!reservationCarDetail || !visitPurposeList) return

    const matchedPurpose = visitPurposeList.find((purpose) => {
      return purpose.name === reservationCarDetail.visitPurpose
    })

    setValue('carNum', reservationCarDetail.carNum ?? '')
    setValue('phone', formatPhone({ phone: reservationCarDetail.phone ?? undefined }))
    // 🔴 목록에서 사라진 방문목적이면 비워 둔다 (레거시는 여기서 터진다)
    if (matchedPurpose) setValue('visitPurpose', matchedPurpose)
    setValue('memo', reservationCarDetail.memo ?? undefined)
    setValue('parkingWallPadAlarm', reservationCarDetail.notificationFlag ?? false)
  }, [reservationCarDetail, visitPurposeList, setValue])

  const hasNoError = Object.keys(errors).length === 0

  const onSubmit = handleSubmit((formValues) => {
    postReservationCarMutation(formValues)
  })

  return (
    <form className="h-full w-full overflow-auto" onSubmit={onSubmit}>
      <ul className="w-full space-y-5 px-5 pb-20">
        <li className="flex flex-col items-start gap-3 self-stretch">
          <div className="flex w-full justify-between">
            <label
              htmlFor="carNum"
              className="flex items-center gap-1 px-1 py-0 pretendard-15SemiBold"
            >
              <span>차량번호</span>
              <EssentialMark />
            </label>
            <BookmarkCarSelectorButton
              onSelectCard={(card) => {
                setValue('carNum', card.carNum ?? '', { shouldValidate: true })
                setValue('phone', formatPhone({ phone: card.phone ?? undefined }), {
                  shouldValidate: true,
                })
              }}
            />
          </div>
          <div className="flex w-full flex-col items-start gap-[6px]">
            <Controller
              control={control}
              name="carNum"
              render={({ field }) => {
                return (
                  <InputBase
                    id="carNum"
                    value={field.value}
                    placeholder={RESERVATION_FORM_PLACEHOLDER.carNum}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                  />
                )
              }}
            />
            <TextError>{errors.carNum?.message}</TextError>
          </div>
        </li>

        <Controller
          control={control}
          name="inOutParkingScheduledDate"
          render={({ field }) => {
            return (
              <ReservationDateField
                value={field.value}
                errorMessage={errors.inOutParkingScheduledDate?.message}
                onChange={field.onChange}
              />
            )
          }}
        />

        <li className="flex flex-col items-start gap-3 self-stretch">
          <label
            htmlFor="phone"
            className="flex items-center gap-1 px-1 py-0 pretendard-15SemiBold"
          >
            <span>연락처</span>
            <EssentialMark />
          </label>
          <div className="flex w-full flex-col items-start gap-[6px]">
            <Controller
              control={control}
              name="phone"
              render={({ field }) => {
                return (
                  <InputBase
                    id="phone"
                    type="tel"
                    value={field.value}
                    maxLength={CAR_FORM_MAX_LENGTH.phone}
                    placeholder={CAR_FORM_PLACEHOLDER.phone}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                  />
                )
              }}
            />
            <TextError>{errors.phone?.message}</TextError>
          </div>
        </li>

        <li className="flex flex-col items-start gap-3 self-stretch">
          <label
            htmlFor="visitPurpose"
            className="flex items-center gap-1 px-1 py-0 pretendard-15SemiBold text-defaults-primary-text-primary"
          >
            <span>방문 목적</span>
            <EssentialMark />
          </label>
          <div className="flex w-full flex-col items-start gap-[6px]">
            <Controller
              control={control}
              name="visitPurpose"
              render={({ field }) => {
                return (
                  <VisitPurposeSelect
                    id="visitPurpose"
                    value={field.value}
                    list={visitPurposeList ?? []}
                    isLoading={isVisitPurposeLoading}
                    isError={isVisitPurposeError}
                    placeholder={RESERVATION_FORM_PLACEHOLDER.visitPurpose}
                    onChange={field.onChange}
                  />
                )
              }}
            />
            <TextError>{errors.visitPurpose?.message}</TextError>
          </div>
        </li>

        <li className="flex flex-col items-start gap-3 self-stretch">
          <label
            htmlFor="memo"
            className="flex items-center gap-1 px-1 py-0 pretendard-15SemiBold text-defaults-primary-text-primary"
          >
            메모
          </label>
          <div className="flex w-full flex-col items-start gap-[6px]">
            <Controller
              control={control}
              name="memo"
              render={({ field }) => {
                return (
                  <textarea
                    id="memo"
                    value={field.value ?? ''}
                    maxLength={CAR_FORM_MAX_LENGTH.memo}
                    placeholder={CAR_FORM_PLACEHOLDER.memo}
                    className="flex min-h-[105px] w-full flex-col items-start justify-center gap-2.5 self-stretch rounded border border-defaults-tertiary-border-tertiary p-2.5 px-3 pretendard-16Regular font-['Pretendard'] text-defaults-primary-text-primary placeholder:text-defaults-tertiary-text-tertiary"
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                  />
                )
              }}
            />
            <TextError>{errors.memo?.message}</TextError>
          </div>
        </li>

        {hasWallPadUI && (
          <li className="flex flex-col items-start gap-3 self-stretch">
            <label
              htmlFor="parkingWallPadAlarm"
              className="flex flex-col gap-1 px-1 py-0 pretendard-15SemiBold text-defaults-primary-text-primary"
            >
              <div className="flex gap-1">
                입출차 시 월패드 알림
                <EssentialMark />
              </div>
              <div className="flex flex-col gap-1 pretendard-14Regular">
                {PARKING_WALL_PAD_ALARM_DESCRIPTION.map((description) => {
                  return <p key={description}>{description}</p>
                })}
              </div>
            </label>
            <div className="flex w-full flex-col items-start gap-[6px]">
              <Controller
                control={control}
                name="parkingWallPadAlarm"
                render={({ field }) => {
                  return (
                    <InputRadioDual
                      name="parkingWallPadAlarm"
                      list={PARKING_WALL_PAD_ALARM_INPUT}
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                    />
                  )
                }}
              />
              <TextError>{errors.parkingWallPadAlarm?.message}</TextError>
            </div>
          </li>
        )}
      </ul>

      <ButtonBase
        type="submit"
        className="fixed bottom-4 left-4 flex w-[calc(100%-32px)] justify-center"
        roundType="rounded"
        size="xl"
        color={hasNoError ? 'brand' : 'defaults-secondary'}
        hasOutline={!hasNoError}
        disabled={isPostReservationCarPending}
      >
        {isPostReservationCarPending ? <SpinnerCircle /> : <span>등록하기</span>}
      </ButtonBase>
    </form>
  )
}
