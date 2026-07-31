import { ko } from 'date-fns/locale'
import { useState } from 'react'

import {
  TEMP_PASSWORD_MAX_DAYS_OFFSET,
  TEMP_PASSWORD_PERIOD_OPTIONS,
  TEMP_PASSWORD_TAB_GUIDE,
  WEEKDAY_LABELS,
} from '@/features/visit/constants/visit'
import { usePostTempPassword } from '@/features/visit/queries/useTempPassword'
import { TEMP_PASSWORD_TYPE, type TempPasswordType } from '@/features/visit/types/visit'
import { ButtonBase } from '@/shared/components/common/ButtonBase'
import { DrawerBase } from '@/shared/components/common/DrawerBase'
import { Calendar } from '@/shared/components/ui/calendar'
import { cn } from '@/shared/utils/cn'
import { formatObjectDate } from '@/shared/utils/formatObjectDate'

/** 오늘 자정 */
const getToday = () => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return today
}

/** 고를 수 있는 마지막 날 = 오늘 + 13일 */
const getMaxDate = () => {
  const maxDate = getToday()
  maxDate.setDate(maxDate.getDate() + TEMP_PASSWORD_MAX_DAYS_OFFSET)
  return maxDate
}

const getWeekday = (date: Date) => {
  return WEEKDAY_LABELS[date.getDay()]
}

/**
 * 날짜 필드 하나. 레거시는 `@vuepic/vue-datepicker` 입력창이었고, 타깃은
 * **읽기 전용 입력처럼 보이는 버튼 + 달력 드로어**로 옮겼다(0-5 결정).
 *
 * ⚠️ **비활성 상태가 화면의 핵심이다.** 시작일은 **항상** 비활성이고, 종료일은
 * `직접 선택`을 눌러야 열린다. 레거시도 `--dp-disabled-color`로 회색 처리했다.
 */
const TempPasswordDateField = ({
  value,
  disabled,
  onChange,
}: {
  value: Date
  disabled: boolean
  onChange: (date: Date) => void
}) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        className={cn(
          'w-full rounded border border-[#f3f3f3] px-3 py-2.5 text-left pretendard-15SemiBold text-[#585858]',
          disabled && 'bg-[#f3f3f3]',
        )}
        onClick={() => {
          setIsOpen(true)
        }}
      >
        {formatObjectDate({ date: value, type: 'hyphen' })}
      </button>

      {isOpen && (
        <DrawerBase
          open={isOpen}
          title="날짜 선택"
          hasCloseButton
          onClose={() => {
            setIsOpen(false)
          }}
        >
          <div className="w-full px-5 pb-4">
            <Calendar
              mode="single"
              locale={ko}
              selected={value}
              disabled={[{ before: getToday() }, { after: getMaxDate() }]}
              startMonth={getToday()}
              endMonth={getMaxDate()}
              className="w-full"
              onSelect={(date) => {
                if (!date) return
                onChange(date)
                setIsOpen(false)
              }}
            />
          </div>
        </DrawerBase>
      )}
    </>
  )
}

/**
 * 임시 비밀번호 생성 (V5).
 * 레거시 `VisitLobbyPhoneTempPasswordCreateView.vue`(278 LOC) 이식.
 *
 * | 항목        | 일회용(`TEMPOTP`)      | 기간형(`TEMPTERM`)          |
 * | ----------- | ---------------------- | --------------------------- |
 * | 날짜 선택기 | 숨김                   | 노출 (시작일은 항상 비활성) |
 * | 기간 버튼   | 숨김                   | 노출                        |
 * | 전송 종료일 | **오늘+13일 고정**     | 고른 종료일                 |
 * | 유효기간    | `~{오늘+13일} (14일)` | `~{종료일} ({요일})`        |
 *
 * ⚠️ **탭을 바꾸면 메모와 종료일이 초기화된다.** 종료일은 오늘로 돌아가고 종료일
 * 선택기도 다시 잠긴다.
 *
 * ⚠️ **`1일`을 고르면 종료일이 내일이 된다** (`오늘 + 1`). 레거시 계산 그대로다 (V-Q6).
 *
 * ⚠️ **스키마 검증이 사실상 없다.** 레거시 `superRefine`이 `'period'`라는 없는 값을
 * 비교해 죽어 있었고(`visit.md` §4-2), 메모는 `<textarea maxlength>`가 먼저 막는다.
 * 그래서 폼 라이브러리를 쓰지 않고 상태로만 다룬다 — 검증 결과가 같다.
 */
export const TempPasswordCreatePage = () => {
  const [tabType, setTabType] = useState<TempPasswordType>(TEMP_PASSWORD_TYPE.OTP)
  const [periodType, setPeriodType] = useState<string | null>('1')
  const [memo, setMemo] = useState('')
  const [endDate, setEndDate] = useState<Date>(getToday)
  const [isEndDateDisabled, setIsEndDateDisabled] = useState(true)

  const { postTempPasswordMutation, isPostTempPasswordPending } = usePostTempPassword()

  /** 일회용 비밀번호의 만료일. 오늘 + 13일 */
  const otpExpiryText = formatObjectDate({ date: getMaxDate(), type: 'hyphen' }) ?? ''

  const changeTab = (nextTab: TempPasswordType) => {
    setTabType(nextTab)
    // 탭을 바꾸면 메모·종료일·잠금 상태가 초기화된다 (레거시 `watch(tabType)`)
    setMemo('')
    setEndDate(getToday())
    setIsEndDateDisabled(true)
    setPeriodType(nextTab === TEMP_PASSWORD_TYPE.OTP ? null : '1')
  }

  const selectPeriod = (value: string) => {
    if (value === 'directSelection') {
      setPeriodType(value)
      setIsEndDateDisabled(false)
      return
    }

    setPeriodType(value)
    setIsEndDateDisabled(true)

    // ⚠️ `1일` → 내일이 된다 (V-Q6)
    const nextEndDate = getToday()
    nextEndDate.setDate(nextEndDate.getDate() + Number(value))
    setEndDate(nextEndDate)
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()

    postTempPasswordMutation({
      tempPasswordType: tabType,
      startDate: formatObjectDate({ date: getToday(), type: 'hyphen' }) ?? '',
      endDate:
        tabType === TEMP_PASSWORD_TYPE.OTP
          ? otpExpiryText
          : (formatObjectDate({ date: endDate, type: 'hyphen' }) ?? ''),
      description: memo,
    })
  }

  const isTermTab = tabType === TEMP_PASSWORD_TYPE.TERM
  const guide = isTermTab ? TEMP_PASSWORD_TAB_GUIDE.TEMPTERM : TEMP_PASSWORD_TAB_GUIDE.TEMPOTP

  return (
    <div className="h-full w-full overflow-auto px-5 pb-14">
      <form id="tempPasswordForm" onSubmit={handleSubmit}>
        <div className="mt-4">
          <div className="flex overflow-hidden bg-defaults-secondary-background-mono p-2 pretendard-16Regular">
            {[TEMP_PASSWORD_TYPE.OTP, TEMP_PASSWORD_TYPE.TERM].map((type) => {
              return (
                <button
                  key={type}
                  type="button"
                  className={cn(
                    'relative w-1/2 py-3 text-center',
                    tabType === type
                      ? 'bg-base-b-white font-medium text-brand-default-text-brand shadow-sm'
                      : 'text-defaults-tertiary-text-tertiary',
                  )}
                  onClick={() => {
                    changeTab(type)
                  }}
                >
                  {type === TEMP_PASSWORD_TYPE.OTP ? '일회용' : '기간형'}
                </button>
              )
            })}
          </div>
        </div>

        <div className="mt-6 mb-8">
          <p className="pretendard-18Bold leading-relaxed">{guide[0]}</p>
          <p className="pretendard-18Bold">{guide[1]}</p>
        </div>

        {isTermTab && (
          <div className="mb-4 flex items-center">
            <div className="flex w-full flex-col gap-3">
              {/* 시작일은 **항상 비활성**이고 값도 항상 오늘이다 */}
              <TempPasswordDateField
                value={getToday()}
                disabled
                onChange={() => {
                  // 비활성이라 호출되지 않는다
                }}
              />
            </div>
            <span className="px-4"> ~ </span>
            <div className="flex w-full flex-col gap-3">
              <TempPasswordDateField
                value={endDate}
                disabled={isEndDateDisabled}
                onChange={setEndDate}
              />
            </div>
          </div>
        )}

        {isTermTab && (
          <div className="mb-4 grid grid-cols-5 gap-2 pretendard-16Regular">
            {TEMP_PASSWORD_PERIOD_OPTIONS.map((option) => {
              return (
                <button
                  key={option.value}
                  type="button"
                  className={cn(
                    'rounded-md border py-2 text-center',
                    periodType === option.value
                      ? 'bg-brand-default-background-brand text-base-b-white'
                      : 'border-neutral-b-gray-300 bg-base-b-white text-neutral-b-gray-700',
                  )}
                  onClick={() => {
                    selectPeriod(option.value)
                  }}
                >
                  {option.label}
                </button>
              )
            })}
          </div>
        )}

        <div className="mb-4">
          <label htmlFor="memo" className="mb-2 block pretendard-16Regular text-neutral-b-gray-700">
            메모
          </label>
          <textarea
            id="memo"
            rows={3}
            value={memo}
            maxLength={50}
            placeholder="메모를 입력해주세요."
            className="h-[130px] w-full resize-none border border-[#F3F3F3] bg-[#F3F3F3] p-3 pretendard-16Regular focus:ring-0"
            onChange={(event) => {
              setMemo(event.target.value)
            }}
          />
        </div>

        <div className="mb-6 text-neutral-b-gray-700">
          <div className="flex justify-between pretendard-16Regular">
            <span>유효기간:</span>
            <div>
              ~
              {isTermTab
                ? `${formatObjectDate({ date: endDate, type: 'hyphen' })} (${getWeekday(endDate)})`
                : otpExpiryText}
              {!isTermTab && <span>(14일)</span>}
            </div>
          </div>
        </div>

        <ButtonBase
          type="submit"
          className="fixed bottom-0 left-0 h-14 w-full"
          size="2xl"
          roundType="square"
          disabled={isPostTempPasswordPending}
        >
          생성하기
        </ButtonBase>
      </form>
    </div>
  )
}
