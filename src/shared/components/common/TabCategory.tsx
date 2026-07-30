import type { TabCategoryProps } from '@/shared/types/tab'
import { cn } from '@/shared/utils/cn'

/** 캡슐형 카테고리 탭. 레거시 `TabCategory.vue` */
const CATEGORY_BASE =
  'min-w-fit cursor-pointer rounded-[36px] px-3 py-2 text-center transition-all duration-300 ease-in-out pretendard-14Regular'
const CATEGORY_ACTIVE = 'bg-brand-default-background-brand text-brand-default-text-brand-inverse'
const CATEGORY_INACTIVE =
  'bg-defaults-secondary-background-mono text-defaults-secondary-text-secondary'

/**
 * ⚠️ 선택 상태를 **인덱스로** 들고 있다. `hasTotalType`이면 '전체'가 0번을 차지하고
 * 실제 카테고리는 1번부터 시작한다. 레거시 인덱스 계산을 그대로 옮겼다 —
 * uuid 비교로 바꾸면 uuid가 없는 '전체' 항목이 어긋난다.
 */
export const TabCategory = ({
  categories,
  selectedIndex,
  hasTotalType = false,
  onSelect,
}: TabCategoryProps) => {
  return (
    <ul className="relative flex gap-2 overflow-x-auto px-6">
      {hasTotalType && (
        <li
          className={cn(CATEGORY_BASE, selectedIndex === 0 ? CATEGORY_ACTIVE : CATEGORY_INACTIVE)}
          onClick={() => {
            onSelect({ index: 0, category: { uuid: undefined, category: '전체' } })
          }}
        >
          전체
        </li>
      )}
      {categories.map((category, index) => {
        const tabIndex = hasTotalType ? index + 1 : index

        return (
          <li
            key={category.uuid ?? category.category}
            className={cn(
              CATEGORY_BASE,
              selectedIndex === tabIndex ? CATEGORY_ACTIVE : CATEGORY_INACTIVE,
            )}
            onClick={() => {
              onSelect({ index: tabIndex, category })
            }}
          >
            {category.category}
          </li>
        )
      })}
    </ul>
  )
}
