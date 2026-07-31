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
 * ⚠️ **마지막 항목만 아래 테두리가 없다.** 인덱스 비교로 판단한다.
 *
 * 🔴 **레거시의 `enabled` 플래그는 아무 효과가 없어 옮기지 않았다.**
 * 조건이 `v-if="item.enabled ? item.enabled : true"`인데, 이 식은 `enabled`가
 * 참이면 참이고 **거짓이면 `true`가 되어** 어느 쪽이든 렌더된다. 실제로 이 때문에
 * 게시글 상세에서 **익명 작성자의 `이 사용자의 글 보지 않기` 항목이 숨겨지지 않는다**
 * (`board.md` §DetailPostMoreButton). 등가 이관이라 그 동작을 유지하되,
 * 아무것도 안 하는 prop을 남겨두면 다음 도메인이 속으므로 **API에서 뺐다.**
 * 실제로 숨겨야 할 곳이 생기면 호출부가 목록에서 빼고 넘기면 된다.
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
