import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'

import { MovingHouseDatePicker } from '@/features/movingHouse/components/MovingHouseDatePicker'
import {
  buildNewOccupancyNotice,
  MOVING_HOUSE_MAX_LENGTH,
  MOVING_HOUSE_MESSAGE,
  MOVING_HOUSE_TYPE_LIST,
} from '@/features/movingHouse/constants/movingHouse'
import {
  createIsHolidayDate,
  getDatePickerRange,
  isNewOccupancyActive,
} from '@/features/movingHouse/lib/movingHouseDate'
import {
  useMovingHouseHolidayList,
  useMovingHouseReservationTimeList,
  useMovingHouseSetting,
} from '@/features/movingHouse/queries/useMovingHouse'
import {
  createMovingHouseFormSchema,
  type MovingHouseFormValues,
} from '@/features/movingHouse/schemas/movingHouse'
import { useMovingHouseFormStore } from '@/features/movingHouse/stores/movingHouseFormStore'
import { ButtonBase } from '@/shared/components/common/ButtonBase'
import { InputRadioList } from '@/shared/components/common/InputRadioList'
import { ModalButton } from '@/shared/components/common/ModalButton'
import { SpinnerCircle } from '@/shared/components/common/SpinnerCircle'
import { SpinnerDots } from '@/shared/components/common/SpinnerDots'
import { TextError } from '@/shared/components/common/TextError'
import { AppBar } from '@/shared/components/layouts/AppBar'
import { WRITE_BACK_MODAL_DATA } from '@/shared/constants/message'
import { ROUTE_PATH } from '@/shared/constants/routes'
import { formatPhone } from '@/shared/utils/formatPhone'

const INPUT_CLASS =
  'h-10 w-full rounded-[4px] border border-defaults-tertiary-border-tertiary px-4 py-2.5 pretendard-16Regular text-defaults-primary-text-primary caret-primary-pc-indigo-700 placeholder:text-defaults-tertiary-text-tertiary disabled:bg-defaults-secondary-background-mono disabled:text-defaults-primary-text-primary'

const LABEL_CLASS = 'flex gap-1 pretendard-15SemiBold text-defaults-secondary-text-secondary'

/**
 * 예약 등록 (MH3). 레거시 `MovingHouseWriteView.vue`(379줄) 이식 — 이 도메인에서 가장 큰 화면.
 *
 * **`chargeFlag`가 이 화면의 3곳을 바꾼다** — 입금자명 입력, 하단 `총 사용료`,
 * 그리고 **검증 스키마**(입금자명 필수 여부).
 *
 * ⚠️ **설정이 늦게 도착하면 필수 여부가 갱신돼야 한다.** vee-validate는 computed 스키마를
 * 자동 재검증했지만 RHF는 그러지 않는다 — 리졸버를 `useMemo`로 다시 만들고, **이미 손을
 * 댄 폼일 때만** 재검증한다. 아직 건드리지 않은 폼은 어차피 필수 항목이 비어 있어
 * `다음`이 회색이므로 결과가 같고, 손대지 않은 필드에 에러가 튀어나오지도 않는다
 * (`moving-house.md` 「반드시 지켜야 할 것」 2).
 *
 * ⚠️ **`다음` 버튼은 비활성이 아니다.** 색만 회색이고 눌린다 — 누르면 각 필드에 에러가
 * 뜬다. AptMall·소방은 `disabled`를 걸었는데 이 화면만 다르다 (MH-Q13 · D-96).
 *
 * ⚠️ **`moveTime` 에러는 한 번이라도 만졌을 때만 뜬다.** 다른 필드는 즉시 뜬다.
 *
 * ⚠️ **날짜를 바꾸면 시간대 선택이 `resetField`로 초기화된다** — 값만 지우면 touched가
 * 남아 필수 에러가 즉시 뜬다. 레거시 주석이 그 이유를 적어뒀다.
 *
 * ⚠️ **MH4에서 뒤로 오면 폼이 전부 복원된다.** 스토어를 비우는 것은 `그만두기`와
 * 제출 성공뿐이다.
 *
 * ✅ **레거시는 이동한 뒤에 저장했다**(`navigateTo` → `setMovingHouseFormData`).
 * 동기 실행 순서 덕에 동작했을 뿐이라 **저장 → 이동**으로 바로잡았다. 결과는 같다.
 */
export const MovingHouseWritePage = () => {
  const navigate = useNavigate()

  const { movingHouseSetting, isMovingHouseSettingLoading } = useMovingHouseSetting()
  const { movingHouseHolidayList, isMovingHouseHolidayListLoading } = useMovingHouseHolidayList()

  const setMovingHouseFormData = useMovingHouseFormStore((state) => {
    return state.setMovingHouseFormData
  })

  // 복원 판정은 진입 시점에 한 번이면 된다 — 저장 후 이동하면 값이 바뀌므로
  // 이후 렌더에서 다시 읽으면 자동 선택 로직이 어긋난다 (레거시도 setup 스냅샷을 썼다)
  const restoredFormRef = useRef(useMovingHouseFormStore.getState().movingHouseFormData)
  const restoredForm = restoredFormRef.current

  const [isBackModalOpen, setIsBackModalOpen] = useState(false)

  const chargeFlag = movingHouseSetting?.chargeFlag === true

  const resolver = useMemo(() => {
    return zodResolver(createMovingHouseFormSchema({ chargeFlag }))
  }, [chargeFlag])

  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    resetField,
    trigger,
    formState: { errors, isValid, touchedFields, isDirty },
  } = useForm<MovingHouseFormValues>({
    resolver,
    mode: 'onChange',
    defaultValues: restoredForm,
  })

  const moveDate = watch('moveDate')

  const { timeSlotRadioList, isMovingHouseReservationTimeListLoading } =
    useMovingHouseReservationTimeList({ moveDate })

  const datePickerRange = getDatePickerRange({ setting: movingHouseSetting })
  const isHolidayDate = createIsHolidayDate(movingHouseHolidayList)

  const newOccupancyNotice = isNewOccupancyActive({ setting: movingHouseSetting })
    ? buildNewOccupancyNotice(movingHouseSetting?.newOccupancyEndDate ?? '')
    : ''

  // 설정이 늦게 도착해 입금자명 필수 여부가 바뀌면 다시 판정한다.
  // 아직 손대지 않은 폼에는 에러를 띄우지 않는다 (레거시의 silent 재검증과 같은 결과)
  useEffect(() => {
    if (isDirty) void trigger()
  }, [chargeFlag, isDirty, trigger])

  // 선택 가능 시작일이 바뀌면 그 날짜를 자동 선택한다.
  // 복원 진입이면 저장된 값을 유지한다 — 레거시 watch의 조기 return과 같다
  const minTime = datePickerRange.minDate.getTime()

  useEffect(() => {
    if (restoredFormRef.current !== undefined) return

    setValue('moveDate', new Date(minTime), { shouldValidate: false })
  }, [minTime, setValue])

  const submit = handleSubmit((values) => {
    setMovingHouseFormData({
      ...values,
      emergencyPhone: values.emergencyPhone ?? undefined,
      moveReservationPrice: movingHouseSetting?.moveReservationPrice ?? 0,
    })
    void navigate(ROUTE_PATH.MOVING_HOUSE_WRITE_CONFIRM)
  })

  const isLoading = isMovingHouseSettingLoading || isMovingHouseHolidayListLoading

  return (
    <div className="h-full overflow-auto">
      <AppBar
        title="이사예약 작성"
        onBack={() => {
          setIsBackModalOpen(true)
        }}
      />

      {isLoading ? (
        <SpinnerDots />
      ) : (
        <div className="space-y-2 bg-base-b-white pt-12 pb-28">
          <form
            id="movingHouseForm"
            className="flex w-full flex-col items-start gap-6 bg-base-b-white px-5 pb-5"
            onSubmit={submit}
          >
            <div className="flex w-full flex-col gap-3">
              <label className={LABEL_CLASS} htmlFor="moveType">
                유형 선택
                <img src="/assets/icons/Essential.svg" alt="별표 아이콘" />
              </label>
              <Controller
                control={control}
                name="moveType"
                render={({ field }) => {
                  return (
                    <InputRadioList
                      name="moveType"
                      list={MOVING_HOUSE_TYPE_LIST}
                      value={field.value}
                      roundType="round-square"
                      width="grid"
                      textColor="text-defaults-primary-text-primary"
                      className="h-10 px-4 py-3 whitespace-nowrap"
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                    />
                  )
                }}
              />
              {errors.moveType && <TextError>{errors.moveType.message}</TextError>}
            </div>

            <div className="flex w-full flex-col gap-3">
              <label className={LABEL_CLASS} htmlFor="moveDate">
                날짜 및 시간대 선택
                <img src="/assets/icons/Essential.svg" alt="별표 아이콘" />
              </label>

              {newOccupancyNotice && (
                <div
                  className="rounded-md bg-primary-pc-indigo-50 px-4 py-3 pretendard-13SemiBold text-primary-pc-indigo-700"
                  role="note"
                >
                  {newOccupancyNotice}
                </div>
              )}

              <Controller
                control={control}
                name="moveDate"
                render={({ field }) => {
                  return (
                    <MovingHouseDatePicker
                      value={field.value}
                      minDate={datePickerRange.minDate}
                      maxDate={datePickerRange.maxDate}
                      isHolidayDate={isHolidayDate}
                      onSelect={(date) => {
                        if (!date || date.getTime() === field.value?.getTime()) return

                        field.onChange(date)
                        // 날짜가 바뀌면 슬롯 조건이 달라진다. 값만 지우면 touched가 남아
                        // 필수 에러가 즉시 뜨므로 값·에러·touched를 함께 초기화한다
                        resetField('moveTime')
                      }}
                    />
                  )
                }}
              />
              {errors.moveDate && <TextError>{errors.moveDate.message}</TextError>}
            </div>

            <div className="flex w-full flex-col gap-3">
              {isMovingHouseReservationTimeListLoading ? (
                <div className="flex h-24 w-full items-center justify-center">
                  <SpinnerCircle color="black" />
                </div>
              ) : (
                <Controller
                  control={control}
                  name="moveTime"
                  render={({ field }) => {
                    return (
                      <InputRadioList
                        name="moveTime"
                        list={timeSlotRadioList}
                        value={field.value}
                        roundType="round-square"
                        width="grid"
                        textColor="text-defaults-primary-text-primary"
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                      />
                    )
                  }}
                />
              )}
              {errors.moveTime && touchedFields.moveTime && (
                <TextError>{errors.moveTime.message}</TextError>
              )}
            </div>

            {chargeFlag && (
              <div className="flex w-full flex-col gap-3">
                <label className={LABEL_CLASS} htmlFor="depositorName">
                  입금자명
                  <img src="/assets/icons/Essential.svg" alt="별표 아이콘" />
                </label>
                <input
                  id="depositorName"
                  type="text"
                  placeholder="입금자명을 입력해주세요"
                  maxLength={MOVING_HOUSE_MAX_LENGTH.depositorName}
                  className={INPUT_CLASS}
                  {...register('depositorName')}
                />
                {errors.depositorName && <TextError>{errors.depositorName.message}</TextError>}
              </div>
            )}

            <div className="flex w-full flex-col gap-3">
              <label className={LABEL_CLASS} htmlFor="emergencyPhone">
                비상 연락처(선택)
              </label>
              <Controller
                control={control}
                name="emergencyPhone"
                render={({ field }) => {
                  return (
                    <input
                      id="emergencyPhone"
                      type="tel"
                      placeholder="휴대폰 번호(- 없이 숫자만 입력)"
                      maxLength={MOVING_HOUSE_MAX_LENGTH.emergencyPhone}
                      className={INPUT_CLASS}
                      value={field.value ?? ''}
                      onBlur={field.onBlur}
                      onChange={(event) => {
                        // 숫자만 남긴 뒤 길이에 맞춰 하이픈을 넣는다 (레거시와 동일)
                        field.onChange(
                          formatPhone({ phone: event.target.value.replace(/\D/g, '') }),
                        )
                      }}
                    />
                  )
                }}
              />
              {errors.emergencyPhone && <TextError>{errors.emergencyPhone.message}</TextError>}
            </div>

            <div className="flex w-full flex-col gap-3">
              <label className={LABEL_CLASS} htmlFor="memo">
                메모(선택)
              </label>
              {/* ✅ 레거시 `border-bg-gray`는 생성되지 않는 클래스였다 —
                  같은 폼의 입력칸과 같은 테두리로 확정 (`broken-styles.md` §5) */}
              <textarea
                id="memo"
                rows={7}
                maxLength={MOVING_HOUSE_MAX_LENGTH.memo}
                placeholder="메모를 입력해주세요"
                className="w-full overflow-auto rounded-[4px] border border-defaults-tertiary-border-tertiary px-4 py-4 pretendard-16Regular text-defaults-primary-text-primary placeholder:text-defaults-tertiary-text-tertiary focus:border-defaults-focus-border-focus"
                {...register('memo')}
              />
            </div>
          </form>

          {chargeFlag && (
            <div className="flex justify-between border-t border-defaults-tertiary-border-tertiary bg-defaults-primary-background-primary px-5 py-6 pretendard-13SemiBold">
              <span>{MOVING_HOUSE_MESSAGE.totalFee}</span>
              <span className="flex items-center">
                <span className="mr-0.5 pretendard-20Bold">
                  {movingHouseSetting?.moveReservationPrice?.toLocaleString() ?? 0}
                </span>
                <span>원</span>
              </span>
            </div>
          )}
        </div>
      )}

      {/* 🔴 `disabled`가 없다 — 회색이어도 눌리고, 누르면 각 필드에 에러가 뜬다 */}
      <ButtonBase
        form="movingHouseForm"
        type="submit"
        className="fixed right-0 bottom-0 left-0"
        roundType="square"
        size="2xl"
        color={isValid ? 'brand' : 'defaults-secondary'}
      >
        {MOVING_HOUSE_MESSAGE.nextButton}
      </ButtonBase>

      <ModalButton
        open={isBackModalOpen}
        onClose={() => {
          setIsBackModalOpen(false)
        }}
        buttonType="outline"
        modalData={WRITE_BACK_MODAL_DATA}
        onFirstClick={() => {
          setIsBackModalOpen(false)
        }}
        onSecondClick={() => {
          setIsBackModalOpen(false)
          void navigate(-1)
          setMovingHouseFormData(undefined)
        }}
      />
    </div>
  )
}
