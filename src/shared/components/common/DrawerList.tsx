import { DrawerBase } from '@/shared/components/common/DrawerBase'
import type { DrawerListProps } from '@/shared/types/overlay'
import { cn } from '@/shared/utils/cn'

/** 정렬 클래스. 지정하지 않으면 가운데다 (레거시 default 분기) */
const TEXT_ALIGN = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
} as const

/**
 * 목록형 바텀시트. 레거시 `DrawerList.vue`.
 *
 * ⚠️ **마지막 항목만 아래 테두리가 없다.** 인덱스 비교로 판단한다 —
 * `last:border-b-0`로 바꾸면 숨겨진 항목(`enabled: false`)이 마지막일 때 결과가 달라진다.
 */
export const DrawerList = ({
  open,
  onClose,
  title = '',
  textAlign = 'center',
  list,
}: DrawerListProps) => {
  return (
    <DrawerBase open={open} onClose={onClose} title={title}>
      <ul className="flex w-full flex-col items-start bg-base-b-white px-5 py-0 pretendard-16Regular">
        {list.map((item, index) => {
          // 레거시는 `item.enabled ? item.enabled : true` — undefined면 보인다.
          if (item.enabled === false) return null

          return (
            <li key={item.key} className="w-full">
              <button
                type="button"
                className={cn(
                  'h-12 w-full self-stretch p-4',
                  list.length - 1 === index
                    ? undefined
                    : 'border-b border-b-defaults-tertiary-border-tertiary',
                  item.color ?? 'text-defaults-primary-text-primary',
                  TEXT_ALIGN[textAlign],
                )}
                onClick={item.onClick}
              >
                {item.label}
              </button>
            </li>
          )
        })}
      </ul>
    </DrawerBase>
  )
}
