import { ko } from 'date-fns/locale'
import { useEffect, useState } from 'react'

import {
  classifyTimeOfDay,
  findFirstAvailableDate,
  getDisabledWeekDays,
  getMaxOrderDate,
  getRemainingSeat,
  isOrderTimeDisabled,
} from '@/features/aptMall/lib/aptMallOrder'
import { useAptMallDetail, useAptMallOrderTimeList } from '@/features/aptMall/queries/useAptMall'
import { useAptMallFormStore } from '@/features/aptMall/stores/aptMallFormStore'
import { APT_MALL_ORDER_TYPE } from '@/features/aptMall/types/aptMall'
import { ButtonBase } from '@/shared/components/common/ButtonBase'
import { SpinnerCircle } from '@/shared/components/common/SpinnerCircle'
import { Calendar } from '@/shared/components/ui/calendar'
import { cn } from '@/shared/utils/cn'

const MAX_PERSON_COUNT = 10

/**
 * 일자·인원·시간대 (AM5 = AM9 + AM10 + AM11).
 * 레거시 `AptMallFormOrderCalendar.vue` + 하위 3개 이식.
 *
 * ⚠️ **인원 영역은 `방문식사`일 때만 보인다.**
 * ⚠️ **시간대를 고르면 즉시 메뉴 단계로 넘어간다** — 확인 버튼이 없다.
 * ⚠️ **하단 버튼은 `닫기` 하나다** — 이전 단계로 돌아가지 않는다.
 *
 * ⚠️ **인원 상한 10은 클라이언트 하드코딩이다** — 서버 값이 아니다 (AM-Q16).
 * 잔여석보다 큰 인원을 고를 수 있고, 그러면 모든 시간대가 비활성이 된다.
 *
 * ⚠️ **달력을 `react-day-picker`로 갈았다** — 레거시는 `VueDatePicker` 기본 CSS가 그대로
 * 화면이었으므로 **모양이 달라진다** (`apt-mall.md` AM-Q14). 동작(주 시작 일요일,
 * 오늘 강조 없음, 비운영 요일·범위 비활성, 초기 선택일)은 그대로 맞췄다.
 */
export const StepCalendar = ({
  onNextStep,
  onClose,
}: {
  onNextStep: () => void
  onClose: () => void
}) => {
  const { aptMallDetail } = useAptMallDetail()

  const setAptMallFormData = useAptMallFormStore((state) => {
    return state.setAptMallFormData
  })
  const { selectedType, date, personCount } = useAptMallFormStore((state) => {
    return state.aptMallFormData
  })

  const isVisit = selectedType?.key === APT_MALL_ORDER_TYPE.VISIT

  const { aptMallOrderTimeList, isAptMallOrderTimeListLoading } = useAptMallOrderTimeList({
    aptMallUuid: aptMallDetail?.aptMallUuid,
    orderDate: date,
  })

  const disabledWeekDays = getDisabledWeekDays(aptMallDetail)
  const today = new Date()
  const [month, setMonth] = useState(date ?? today)

  // 진입 시 예약 가능한 가장 빠른 날짜를 고른다 (레거시 `onMounted`)
  useEffect(() => {
    if (!aptMallDetail) return

    setAptMallFormData({ date: findFirstAvailableDate({ detail: aptMallDetail }) })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aptMallDetail])

  // 인원은 진입 시 1명으로 시작한다 (레거시도 `onMounted`에서 스토어에 넣는다)
  useEffect(() => {
    if (!isVisit) return

    setAptMallFormData({ personCount: 1 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVisit])

  useEffect(() => {
    if (date) setMonth(date)
  }, [date])

  return (
    <div>
      <div className="px-5">
        <Calendar
          className="w-full"
          mode="single"
          locale={ko}
          weekStartsOn={0}
          selected={date}
          month={month}
          startMonth={today}
          endMonth={getMaxOrderDate({ detail: aptMallDetail })}
          // 레거시 `no-today` — 오늘 강조를 지운다
          modifiersClassNames={{ today: '' }}
          disabled={[
            { before: today },
            { after: getMaxOrderDate({ detail: aptMallDetail }) },
            { dayOfWeek: disabledWeekDays },
          ]}
          onMonthChange={setMonth}
          onSelect={(next) => {
            if (!next) return
            setAptMallFormData({ date: next })
          }}
        />
      </div>

      <div className="space-y-[18px] p-5">
        {isVisit && (
          <ol className="flex h-11 items-center gap-2 overflow-x-scroll">
            {Array.from({ length: MAX_PERSON_COUNT }, (_, index) => {
              return index + 1
            }).map((number) => {
              return (
                <li key={number} className="whitespace-nowrap">
                  <input
                    id={`person-${number}`}
                    type="radio"
                    name="personCount"
                    value={number}
                    checked={personCount === number}
                    className="hidden"
                    onChange={() => {
                      setAptMallFormData({ personCount: number })
                    }}
                  />
                  <label
                    htmlFor={`person-${number}`}
                    className={cn(
                      'flex h-11 w-11 items-center justify-center rounded-full border text-center pretendard-14Medium',
                      personCount === number &&
                        'border-brand-default-border-brand bg-brand-default-background-brand text-base-b-white',
                    )}
                  >
                    {number}명
                  </label>
                </li>
              )
            })}
          </ol>
        )}

        <div className="flex">
          {isAptMallOrderTimeListLoading ? (
            <div className="mx-auto">
              <SpinnerCircle color="black" />
            </div>
          ) : (
            <ol className="flex gap-3 overflow-y-scroll">
              {(aptMallOrderTimeList ?? []).map((time) => {
                const isDisabled = isOrderTimeDisabled({
                  time,
                  personCount: isVisit ? personCount : undefined,
                  selectedDate: date,
                })

                return (
                  <li key={time.aptMallOrderTimeUuid}>
                    <button
                      type="button"
                      disabled={isDisabled}
                      className="flex flex-col items-center gap-1.5"
                      onClick={() => {
                        setAptMallFormData({ time })
                        onNextStep()
                      }}
                    >
                      <div
                        className={cn(
                          'rounded-md px-2.5 py-2 pretendard-15Regular whitespace-nowrap text-base-b-white',
                          isDisabled
                            ? 'bg-neutral-b-gray-700'
                            : 'bg-brand-default-background-brand',
                        )}
                      >
                        {classifyTimeOfDay(time.orderTime)} {time.orderTime.slice(0, 5)}
                      </div>
                      {aptMallDetail?.orderTimeLimitPersonFlag && isVisit && (
                        <div className="pretendard-14Medium">
                          잔여 {getRemainingSeat(time).toLocaleString()}석
                        </div>
                      )}
                    </button>
                  </li>
                )
              })}
            </ol>
          )}
        </div>
      </div>

      <div className="p-5 pt-2">
        <ButtonBase
          type="button"
          hasOutline
          roundType="rounded"
          color="defaults-secondary"
          onClick={onClose}
        >
          닫기
        </ButtonBase>
      </div>
    </div>
  )
}
