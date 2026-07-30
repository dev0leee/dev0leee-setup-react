import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { useImposeYearMonths } from '@/features/main/queries/useImposeYearMonths'
import { useManagementFeeBill } from '@/features/main/queries/useManagementFeeBill'
import type { MainCardProps } from '@/features/main/types/card'
import { SkeletonBase } from '@/shared/components/common/SkeletonBase'
import { ROUTE_PATH } from '@/shared/constants/routes'
import { useAuthStore } from '@/shared/stores/authStore'
import { cn } from '@/shared/utils/cn'

/**
 * 최신 년월을 고른다. 레거시 `watch(imposeYearMonths, ..., { immediate: true })` +
 * `watch(aptResidentUuid)` 두 개를 하나로 합쳤다.
 *
 * `sort().reverse()`로 문자열 정렬한다 — `YYYY-MM` 형식이라 사전순 = 시간순이다.
 *
 * ⚠️ **단지가 바뀌면 선택을 비운다.** 이전 단지의 년월로 새 단지 고지서를 조회하면
 * 엉뚱한 값이 나온다. 레거시는 별도 `watch`였고, 여기서는 `aptResidentUuid`를 의존성에
 * 넣어 같은 결과를 만든다.
 */
const useLatestYearMonth = ({ imposeYearMonths }: { imposeYearMonths: string[] | undefined }) => {
  const aptResidentUuid = useAuthStore((state) => {
    return state.aptInfo.aptResidentUuid
  })
  const [selected, setSelected] = useState<{ year: number | null; month: number | null }>({
    year: null,
    month: null,
  })

  useEffect(() => {
    if (!imposeYearMonths || imposeYearMonths.length === 0) {
      setSelected({ year: null, month: null })
      return
    }

    const [latest] = [...imposeYearMonths].sort().reverse()
    const [year, month] = (latest ?? '').split('-')

    setSelected({ year: Number(year), month: Number(month) })
  }, [imposeYearMonths, aptResidentUuid])

  return selected
}

/**
 * 관리비 카드. 레거시 `MainCardManagementFee.vue`(193 LOC) 이식. 카드 중 가장 복잡하다.
 *
 * **상태가 4단계**고 그중 두 개가 에러다:
 *
 * | 상태            | 표시                                | 클릭      |
 * | --------------- | ----------------------------------- | --------- |
 * | 로딩            | 스켈레톤                            | —         |
 * | 년월 목록 실패  | `관리비` + 안내                     | **불가**  |
 * | 고지서만 실패   | `관리비` + 화살표 + 안내            | 가능      |
 * | 정상            | `{월}월분 관리비` + 금액 + 증감     | 가능      |
 *
 * ⚠️ **두 에러의 차이가 클릭 가능 여부다.** 년월 목록조차 없으면 상세 화면에서 보여줄
 * 것이 없으므로 `<div>`로 렌더해 아예 못 누르게 한다.
 *
 * ⚠️ **금액 폰트가 인라인 `clamp(14px, 4vw, 18px)`다.** Tailwind 클래스가 아니다 —
 * 긴 금액이 카드를 넘치지 않게 하는 처리라 그대로 옮겼다.
 *
 * ⚠️ 년월이 아직 안 정해진 상태도 **로딩으로 취급한다** (레거시 `isLoading` 정의).
 */
export const MainCardManagementFee = ({ layoutType, className }: MainCardProps) => {
  const navigate = useNavigate()
  const { imposeYearMonths, isImposeYearMonthsLoading, isImposeYearMonthsError } =
    useImposeYearMonths()
  const { year, month } = useLatestYearMonth({ imposeYearMonths })
  const { managementFeeBill, isManagementFeeBillLoading, isManagementFeeBillError } =
    useManagementFeeBill({ year, month })

  const isLoading = isImposeYearMonthsLoading || isManagementFeeBillLoading || !year || !month

  /** 세로 배치면 값을 우측 정렬한다 */
  const valueAlignClass = layoutType === 'horizontal' ? '' : 'items-end'

  if (isLoading) {
    return (
      <div className={cn('flex flex-col justify-between gap-3 overflow-hidden', className)}>
        <div className="flex items-center">
          <SkeletonBase className="h-5 w-24 rounded" />
        </div>
        <div className={cn('flex flex-col gap-1', valueAlignClass)}>
          <SkeletonBase className="h-6 w-32 rounded" />
          <SkeletonBase className="h-4 w-24 rounded" />
        </div>
      </div>
    )
  }

  const errorMessage = (
    <div
      className={cn(
        'flex flex-col gap-1 pretendard-13Regular text-defaults-secondary-text-secondary',
        layoutType === 'horizontal' ? '' : 'items-end text-right',
      )}
    >
      관리비를 불러올 수 없습니다
    </div>
  )

  // 년월 목록조차 못 가져오면 상세로 보낼 수 없다 → 누를 수 없는 div
  if (isImposeYearMonthsError) {
    return (
      <div className={cn('flex flex-col justify-between gap-3 overflow-hidden', className)}>
        <div className="flex items-center">
          <h2 className="flex items-center gap-0.5 text-left pretendard-13Medium break-keep text-defaults-secondary-text-secondary">
            관리비
          </h2>
        </div>
        {errorMessage}
      </div>
    )
  }

  const goToDetail = () => {
    void navigate(ROUTE_PATH.MANAGEMENT_FEE_DETAIL)
  }

  if (isManagementFeeBillError) {
    return (
      <button
        type="button"
        className={cn(
          'flex cursor-pointer flex-col justify-between gap-3 overflow-hidden',
          className,
        )}
        onClick={goToDetail}
      >
        <div className="flex items-center">
          <h2 className="flex items-center gap-0.5 text-left pretendard-13Medium break-keep text-defaults-secondary-text-secondary">
            관리비
            <img
              src="/assets/icons/ArrowRight.svg"
              alt="화살표 아이콘"
              className="h-[18px] w-[18px]"
            />
          </h2>
        </div>
        {errorMessage}
      </button>
    )
  }

  const imposeAmount = managementFeeBill?.imposeAmount?.imposeAmount ?? 0
  const comparedAmount = managementFeeBill?.imposeAmount?.previousMonthComparedAmount ?? 0
  const isDecrease = comparedAmount < 0

  return (
    <button
      type="button"
      className={cn(
        'flex cursor-pointer flex-col justify-between gap-3 overflow-hidden',
        className,
      )}
      onClick={goToDetail}
    >
      <h2 className="flex items-center gap-0.5 text-left pretendard-13Medium break-keep text-defaults-secondary-text-secondary">
        {month}월분 관리비
        <img src="/assets/icons/ArrowRight.svg" alt="화살표 아이콘" className="h-[18px] w-[18px]" />
      </h2>
      <div className={cn('flex flex-col gap-1', valueAlignClass)}>
        {/* Tailwind 클래스가 아니라 인라인 clamp다 — 긴 금액이 카드를 넘치지 않게 한다 */}
        <div
          className="flex flex-wrap items-baseline gap-x-1 text-left font-semibold"
          style={{ fontSize: 'clamp(14px, 4vw, 18px)' }}
        >
          {imposeAmount.toLocaleString('ko-KR')}원
        </div>
        <span
          className={cn(
            'text-left pretendard-10Medium whitespace-nowrap',
            isDecrease ? 'text-alerts-informal-text-informal' : 'text-alerts-error-text-error',
          )}
        >
          {isDecrease ? '▼' : '▲'} {Math.abs(comparedAmount).toLocaleString('ko-KR')}원
        </span>
      </div>
    </button>
  )
}
