import { useState } from 'react'

import { DrawerBase } from '@/shared/components/common/DrawerBase'
import { RECENT_MONTH_FALLBACK_COUNT } from '@/shared/constants/date'
import type { DrawerMonthProps, YearMonth } from '@/shared/types/drawerMonth'
import { cn } from '@/shared/utils/cn'

/**
 * 연월 선택기 + 바텀시트. 레거시 `DrawerMonth.vue`(137 LOC).
 *
 * ⚠️ **선택 값을 부모가 소유한다.** 레거시는 내부 `ref`로 들고 있으면서
 * `availableYearmonths` prop이 바뀔 때마다 `watch`로 최신 달로 되돌리고
 * `changeMonth`를 emit했다 — refetch로 새 배열이 오면 **사용자가 고른 달이
 * 최신 달로 튕긴다**(`deferred.md` D-143 · `management-fee.md` MF-Q8).
 * React에서 그 구조를 흉내내면 `useEffect`로 부모 상태를 되돌리는 안티패턴이 되고,
 * 버그도 함께 옮겨진다. **값을 부모가 갖게 하면 두 문제가 같이 사라진다.**
 * 초기 선택(가장 최신 달)은 부모가 데이터를 받을 때 정한다.
 *
 * `availableYearmonths`가 비면 **이번 달부터 과거로 3개월**을 만든다(레거시 동일).
 */
const generateRecentMonths = (): YearMonth[] => {
  const cursor = new Date()
  // 말일(31일)에 setMonth를 하면 달을 건너뛴다. 1일로 고정해서 막는다.
  cursor.setDate(1)

  return Array.from({ length: RECENT_MONTH_FALLBACK_COUNT }, () => {
    const yearMonth = { year: cursor.getFullYear(), month: cursor.getMonth() + 1 }
    cursor.setMonth(cursor.getMonth() - 1)
    return yearMonth
  })
}

/** `'2026-07'` 형태를 파싱해 최신순으로 정렬한다 */
const parseAvailableMonths = (availableYearmonths: string[]): YearMonth[] => {
  return availableYearmonths
    .map((yearMonth) => {
      const [year, month] = yearMonth.split('-')
      return { year: Number(year), month: Number(month) }
    })
    .sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year
      return b.month - a.month
    })
}

export const DrawerMonth = ({
  selected,
  availableYearmonths = [],
  hasNoPadding = false,
  className,
  onChange,
}: DrawerMonthProps) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  const availableMonths =
    availableYearmonths.length > 0
      ? parseAvailableMonths(availableYearmonths)
      : generateRecentMonths()

  return (
    <>
      <div
        className={cn(
          'flex items-center gap-1.5 pretendard-16SemiBold text-base-b-black',
          className,
          !hasNoPadding && 'px-6 py-3',
        )}
        onClick={() => {
          setIsDrawerOpen(true)
        }}
      >
        <span>
          {selected.year}년 {selected.month}월분
        </span>
        <img
          src="/assets/icons/icon-select-dropdown.svg"
          alt="화살표 아이콘"
          className="h-3.5 w-3.5"
        />
      </div>

      <DrawerBase
        open={isDrawerOpen}
        hasCloseButton
        onClose={() => {
          setIsDrawerOpen(false)
        }}
      >
        <ul className="flex max-h-[80vh] flex-col items-start self-stretch overflow-auto px-5">
          {availableMonths.map((yearMonth) => {
            const isSelected =
              selected.year === yearMonth.year && selected.month === yearMonth.month

            return (
              <li
                key={`${yearMonth.year}-${yearMonth.month}`}
                className={cn(
                  'flex items-center self-stretch border-b border-defaults-tertiary-border-tertiary p-4 last:border-b-0',
                  isSelected && 'font-semibold text-brand-default-text-brand',
                )}
                onClick={() => {
                  onChange(yearMonth)
                  setIsDrawerOpen(false)
                }}
              >
                {yearMonth.year}년 {yearMonth.month}월
              </li>
            )
          })}
        </ul>
      </DrawerBase>
    </>
  )
}
