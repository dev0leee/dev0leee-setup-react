import type { SpinnerDotsProps } from '@/shared/types/spinner'
import { cn } from '@/shared/utils/cn'

/**
 * 전면 로딩 오버레이. 레거시 `SpinnerDots.vue`.
 *
 * ⚠️ 점 3개의 `animation-delay`가 **`.7s` · `.3s` · `.7s`**다.
 * 첫째와 셋째가 같아서 물결이 아니라 두 박자로 튄다. 레거시 그대로 옮겼다 —
 * 고치면 애니메이션이 눈에 보이게 달라진다.
 *
 * `progressPercent`가 0이면 숫자를 그리지 않는다(레거시 `v-if`가 falsy 검사).
 */
export const SpinnerDots = ({
  progressPercent = 0,
  backgroundColor = '',
  textColor = 'text-base-b-black',
}: SpinnerDotsProps) => {
  return (
    <div
      className={cn(
        'fixed top-0 left-0 z-[9999] flex h-full w-full flex-col items-center justify-center gap-3',
        backgroundColor,
      )}
    >
      <div className="flex flex-row items-center justify-center gap-2">
        <div className="h-4 w-4 animate-bounce rounded-full bg-primary-pc-indigo-700 [animation-delay:.7s]" />
        <div className="h-4 w-4 animate-bounce rounded-full bg-primary-pc-indigo-400 [animation-delay:.3s]" />
        <div className="h-4 w-4 animate-bounce rounded-full bg-primary-pc-indigo-200 [animation-delay:.7s]" />
      </div>
      {progressPercent ? <div className={textColor}>{progressPercent}%</div> : null}
    </div>
  )
}
