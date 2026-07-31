import {
  DAY_FREE_TYPE_LABEL,
  DAY_OF_WEEK_LIST,
  PARKING_POLICY_ERROR_TEXT,
  PARKING_POLICY_FIELD_LIST,
  type ParkingPolicyFieldKey,
} from '@/features/parking/constants/parking'
import { useParkingPolicy } from '@/features/parking/queries/useParkingPolicy'
import type { DayFreeTime, ParkingPolicy } from '@/features/parking/types/parking'
import { ButtonBase } from '@/shared/components/common/ButtonBase'
import { DrawerBase } from '@/shared/components/common/DrawerBase'
import { SkeletonBase } from '@/shared/components/common/SkeletonBase'
import { formatMinutes } from '@/shared/utils/formatMinutes'

/** 로딩 스켈레톤 행 수. 필드는 4개인데 5행이다 — 레거시 그대로 */
const SKELETON_ROW_COUNT = 5

/** `'HH:mm:ss'` → `'HH:mm'`. 값이 없으면 빈 문자열 (레거시 `formatTime.js`) */
const formatTime = (time?: string): string => {
  return time?.slice(0, 5) ?? ''
}

/**
 * 요일 1건을 화면 문구로.
 *
 * **시각이 있으면 시간대로 표기한다** — `freeType`이 빠진 구버전 응답도 자연히 흡수하려는
 * 순서다(레거시 주석). 시각이 없을 때만 유형 라벨을 쓰고, 라벨도 없으면 `-`.
 */
const renderDayFreeTime = ({
  freeType,
  freeParkingStartTime,
  freeParkingEndTime,
}: DayFreeTime): string => {
  if (freeParkingStartTime && freeParkingEndTime) {
    return `${formatTime(freeParkingStartTime)} ~ ${formatTime(freeParkingEndTime)}`
  }

  return DAY_FREE_TYPE_LABEL[freeType ?? ''] ?? '-'
}

/**
 * 요일별 무료 시간 목록. 레거시 `formatDayFreeTime.js`.
 *
 * **응답 순서를 쓰지 않고 월~일 순서로 다시 세운다.** 응답에 없는 요일은 빠진다.
 * 목록이 비면 `null`을 돌려 **단일 시간대 표시로 폴백**시킨다 — 요일별 설정을
 * 쓰지 않는 단지가 그렇다.
 */
const formatDayFreeTime = (dayFreeTimeList?: DayFreeTime[]) => {
  if (!dayFreeTimeList?.length) return null

  return DAY_OF_WEEK_LIST.map(({ value, label }) => {
    const dayFreeTime = dayFreeTimeList.find((item) => {
      return item.dayOfWeek === value
    })

    if (!dayFreeTime) return null

    return { dayOfWeek: value, label, value: renderDayFreeTime(dayFreeTime) }
  }).filter((item) => {
    return item !== null
  })
}

/**
 * 필드 1개의 값.
 *
 * ⚠️ **레거시는 `mileagePolicy.minuteAmount.toLocaleString()`을 옵셔널 없이 호출한다** —
 * 서버가 `mileagePolicy`를 빼면 화면이 터진다. 재현할 가치가 없어 옵셔널 체이닝으로
 * 막았다. 정상 응답에서는 결과가 같다.
 */
const renderPolicyField = ({
  fieldKey,
  parkingPolicy,
}: {
  fieldKey: ParkingPolicyFieldKey
  parkingPolicy: ParkingPolicy
}): string | undefined => {
  const { mileagePolicy, freeParkingMinute, freeParkingStartTime, freeParkingEndTime } =
    parkingPolicy

  if (fieldKey === 'monthBaseMileage') {
    const { hours, minutes } = formatMinutes(mileagePolicy?.monthBaseMileage)

    if (!hours && !minutes) return '0분/월'
    if (!hours) return `${minutes}분/월`
    if (!minutes) return `${hours}시간/월`
    return `${hours}시간 ${minutes}분/월`
  }

  if (fieldKey === 'freeParkingMinute') return `${freeParkingMinute}분`

  if (fieldKey === 'freeParkingTime') {
    // 무료 시간대를 쓰지 않는 단지는 시각이 없거나 시작=종료(구간 0)로 내려온다
    if (!freeParkingStartTime || !freeParkingEndTime) return DAY_FREE_TYPE_LABEL.NONE
    if (freeParkingStartTime === freeParkingEndTime) return DAY_FREE_TYPE_LABEL.NONE

    return `매일 ${formatTime(freeParkingStartTime)} ~ ${formatTime(freeParkingEndTime)}`
  }

  return `${mileagePolicy?.minuteAmount?.toLocaleString() ?? ''}원/분`
}

/**
 * 우리 아파트 주차 정책 드로어 (PK1). 레거시 `ParkingManagementPolicyModal.vue`(154 LOC).
 *
 * ⚠️ **레거시는 열 때 컴포넌트를 붙이고 닫을 때 뗀다.** 타깃은 계속 마운트해 두고
 * `enabled`로 조회 시점을 맞춘다 — 그래야 바텀시트 슬라이드업 전환이 산다.
 */
export const ParkingPolicyDrawer = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const { parkingPolicy, isParkingPolicyLoading, isParkingPolicyError } = useParkingPolicy({
    enabled: open,
  })

  const dayFreeTimeList = formatDayFreeTime(parkingPolicy?.dayFreeTimeList)

  return (
    <DrawerBase
      open={open}
      onClose={onClose}
      title="우리 아파트 주차 정책"
      hasCloseButton
      hasButtons
      buttons={
        <ButtonBase className="h-10 w-full" onClick={onClose}>
          닫기
        </ButtonBase>
      }
    >
      <div className="w-full px-5">
        <ul className="mt-4 flex w-full flex-col gap-3 rounded-lg bg-neutral-b-gray-50 px-3 py-4">
          {isParkingPolicyLoading && (
            <div className="space-y-3">
              {Array.from({ length: SKELETON_ROW_COUNT }, (_, index) => {
                return (
                  <div key={index} className="flex justify-between">
                    <SkeletonBase className="h-4 w-32 rounded-lg" />
                    <SkeletonBase className="h-4 w-40 rounded-lg" />
                  </div>
                )
              })}
            </div>
          )}

          {!isParkingPolicyLoading && isParkingPolicyError && (
            <div className="py-10 text-center pretendard-16Regular text-defaults-tertiary-text-tertiary">
              {PARKING_POLICY_ERROR_TEXT[0]} <br />
              {PARKING_POLICY_ERROR_TEXT[1]}
            </div>
          )}

          {!isParkingPolicyLoading &&
            !isParkingPolicyError &&
            PARKING_POLICY_FIELD_LIST.map((field) => {
              // 요일별 설정이 있는 단지는 `무료 주차 시간` 행이 요일 목록으로 바뀐다
              if (field.key === 'freeParkingTime' && dayFreeTimeList) {
                return (
                  <li key={field.key} className="flex flex-col gap-2">
                    <span className="pretendard-15SemiBold whitespace-nowrap text-defaults-secondary-text-secondary">
                      {field.label}
                    </span>
                    <ul className="flex w-full flex-col gap-2 pl-2">
                      {dayFreeTimeList.map((dayFreeTime) => {
                        return (
                          <li key={dayFreeTime.dayOfWeek} className="flex justify-between gap-4">
                            <span className="pretendard-15Regular whitespace-nowrap text-defaults-tertiary-text-tertiary">
                              {dayFreeTime.label}
                            </span>
                            <span className="text-right pretendard-15Regular">
                              {dayFreeTime.value}
                            </span>
                          </li>
                        )
                      })}
                    </ul>
                  </li>
                )
              }

              return (
                <li key={field.key} className="flex justify-between gap-4">
                  <span className="pretendard-15SemiBold whitespace-nowrap text-defaults-secondary-text-secondary">
                    {field.label}
                  </span>
                  <span className="text-right pretendard-15Regular">
                    {parkingPolicy && renderPolicyField({ fieldKey: field.key, parkingPolicy })}
                  </span>
                </li>
              )
            })}
        </ul>
      </div>
    </DrawerBase>
  )
}
