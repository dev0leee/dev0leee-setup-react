import { useNavigate } from 'react-router-dom'

import { ParkingMileageProgressBar } from '@/features/parking/components/dashboard/ParkingMileageProgressBar'
import { ParkingPolicyButton } from '@/features/parking/components/dashboard/ParkingPolicyButton'
import { MILEAGE_SUMMARY_ERROR_TEXT } from '@/features/parking/constants/parking'
import { SkeletonBase } from '@/shared/components/common/SkeletonBase'
import { ROUTE_PATH } from '@/shared/constants/routes'
import { useParkingRemainingMileage } from '@/shared/hooks/useParkingRemainingMileage'
import { formatMinutes } from '@/shared/utils/formatMinutes'

/**
 * 잔여 주차 마일리지 + 진행바 + 정책 버튼 (PK1 상단).
 * 레거시 `ParkingManagementMileage.vue`(103 LOC) 이식.
 *
 * ⚠️ **여기서는 기간을 바꾸지 않는다** — 항상 이번 달이다. 월 선택은 PK2의 몫이다.
 *
 * ⚠️ **에러면 진행바가 통째로 사라진다** (`v-if="!isError"`). 문구 2줄만 남는다.
 *
 * ⚠️ **분이 0이면 `undefined`가 보간된다** — `12시간 `처럼 뒤에 공백이 남는다.
 * 레거시 템플릿 그대로다.
 *
 * ⚠️ 레거시는 쿼리 `select`가 만든 `totalMileage`를 두고도 컴포넌트에서 다시 더한다.
 * 중복이라 **쿼리 값을 쓴다** — 같은 수식이라 결과가 같다.
 */
export const ParkingMileageSummary = () => {
  const navigate = useNavigate()
  const { parkingMileage, isParkingMileageLoading, isParkingMileageError } =
    useParkingRemainingMileage()

  const remaining = formatMinutes(parkingMileage?.remainingMileage)

  return (
    <div className="space-y-2.5">
      <div className="flex justify-between gap-3">
        <div className="space-y-1">
          <h2>
            <button
              type="button"
              className="flex items-center gap-2 text-left pretendard-14Medium break-keep text-defaults-secondary-text-secondary"
              onClick={() => {
                void navigate(ROUTE_PATH.PARKING_MILEAGE_HISTORY)
              }}
            >
              잔여 주차 마일리지
              <img src="/assets/icons/ArrowNarrowRight.svg" alt="화살표 아이콘" />
            </button>
          </h2>

          {isParkingMileageLoading && <SkeletonBase className="h-8 w-32 rounded-lg" />}

          {!isParkingMileageLoading && isParkingMileageError && (
            <p className="pt-2 pretendard-14Regular text-defaults-secondary-text-secondary">
              {MILEAGE_SUMMARY_ERROR_TEXT[0]} <br />
              {MILEAGE_SUMMARY_ERROR_TEXT[1]}
            </p>
          )}

          {!isParkingMileageLoading && !isParkingMileageError && (
            <span className="pretendard-24Bold">
              {remaining.hours}시간 {remaining.minutes ? `${remaining.minutes}분` : undefined}
            </span>
          )}
        </div>

        <ParkingPolicyButton />
      </div>

      {!isParkingMileageError && (
        <ParkingMileageProgressBar
          totalMileage={parkingMileage?.totalMileage ?? 0}
          useMileage={parkingMileage?.useMileage ?? 0}
          isLoading={isParkingMileageLoading}
        />
      )}
    </div>
  )
}
