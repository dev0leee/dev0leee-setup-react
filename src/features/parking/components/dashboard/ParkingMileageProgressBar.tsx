import { useEffect, useState } from 'react'

import { PROGRESS_ANIMATION_DELAY_MS } from '@/features/parking/constants/parking'
import { SkeletonBase } from '@/shared/components/common/SkeletonBase'
import { formatMinutes } from '@/shared/utils/formatMinutes'

/**
 * 마일리지 진행바. 레거시 `ParkingMileageProgressBar.vue`(79 LOC) 이식.
 *
 * **네이티브 `<progress>` 엘리먼트**를 쓰고 채움 색을 `::-webkit-progress-*` /
 * `::-moz-progress-*` 임의 변형자로 칠한다.
 *
 * ⚠️ **값을 100ms 뒤에 넣어 차오르는 연출을 만든다.** 처음부터 최종값을 넣으면
 * `transition duration-1000`이 걸릴 구간이 없어 즉시 채워진다.
 *
 * ⚠️ **분이 0이면 `undefined`를 렌더한다** — 레거시 템플릿이 그렇다. Vue도 React도
 * 빈 문자열로 취급하므로 `3시간 사용`(시간 뒤 공백)이 된다. 화면상 문제는 없다.
 *
 * ⚠️ 레거시는 부모가 `isError`도 넘기는데 `defineProps`에 없어 루트 `<div>`의 HTML
 * 속성이 됐다. 무해한 fallthrough라 옮기지 않았다.
 */
export const ParkingMileageProgressBar = ({
  totalMileage,
  useMileage,
  isLoading,
}: {
  totalMileage: number
  useMileage: number
  isLoading: boolean
}) => {
  const [animatedValue, setAnimatedValue] = useState(0)

  useEffect(() => {
    if (isLoading) return

    const timer = setTimeout(() => {
      setAnimatedValue(useMileage)
    }, PROGRESS_ANIMATION_DELAY_MS)

    return () => {
      clearTimeout(timer)
    }
  }, [useMileage, isLoading])

  const used = formatMinutes(useMileage)
  const total = formatMinutes(totalMileage)

  return (
    <div className="space-y-1.5">
      {isLoading ? (
        <SkeletonBase className="h-2 w-full rounded-full" />
      ) : (
        <progress
          max={totalMileage}
          value={animatedValue}
          className="h-2 w-full transition-all duration-1000 ease-out [&::-moz-progress-bar]:rounded-full [&::-moz-progress-bar]:bg-defaults-secondary-background-secondary [&::-moz-progress-bar]:transition-all [&::-moz-progress-bar]:duration-1000 [&::-moz-progress-value]:rounded-full [&::-moz-progress-value]:bg-brand-default-background-brand [&::-webkit-progress-bar]:rounded-full [&::-webkit-progress-bar]:bg-defaults-secondary-background-secondary [&::-webkit-progress-value]:rounded-full [&::-webkit-progress-value]:bg-brand-default-background-brand [&::-webkit-progress-value]:transition-all [&::-webkit-progress-value]:duration-1000 [&::-webkit-progress-value]:ease-out"
        />
      )}

      {isLoading ? (
        <div className="flex justify-between pretendard-14Medium">
          <SkeletonBase className="h-5 w-24 rounded-lg" />
          <SkeletonBase className="h-5 w-24 rounded-lg" />
        </div>
      ) : (
        <div className="flex justify-between pretendard-14Medium">
          <span className="text-brand-default-text-brand">
            {used.hours}시간 {used.minutes ? `${used.minutes}분` : undefined} 사용
          </span>
          <span className="text-defaults-secondary-text-secondary">
            총 {total.hours}시간 {total.minutes ? `${total.minutes}분` : undefined}
          </span>
        </div>
      )}
    </div>
  )
}
