import type { MouseEvent } from 'react'

import { FIRE_INSPECTION_MESSAGE } from '@/features/fireInspection/constants/fireInspection'
import { cn } from '@/shared/utils/cn'

/**
 * 도움말 툴팁. 레거시 `FireInspectionTooltip.vue`.
 *
 * ⚠️ **닫기 버튼이 이벤트를 부모로 올린다.** 부모가 `stopPropagation`을 부르기 때문이다 —
 * **이 결합을 끊으면 카테고리 툴팁을 닫을 때 아코디언이 함께 토글된다.**
 *
 * ⚠️ `label`은 레거시에서 어디서도 덮어쓰지 않아 언제나 `어디에 있나요?`다.
 */
export const FireInspectionTooltip = ({
  content,
  positionClass,
  onClose,
}: {
  content: string
  positionClass: string
  onClose: (event: MouseEvent) => void
}) => {
  return (
    <div
      className={cn(
        'absolute z-20 rounded-lg bg-defaults-primary-background-primary-inverse p-[12px]',
        positionClass,
      )}
    >
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3">
          <span className="pretendard-14Medium text-defaults-tertiary-text-tertiary">
            {FIRE_INSPECTION_MESSAGE.tooltipLabel}
          </span>
          <button type="button" onClick={onClose}>
            <img src="/assets/icons/CloseBold.svg" alt="닫기" className="h-3 w-3 shrink-0" />
          </button>
        </div>
        <span className="pretendard-14Regular !leading-5 text-defaults-primary-text-primary-inverse">
          {content}
        </span>
      </div>
    </div>
  )
}
