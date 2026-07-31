import { FireInspectionItem } from '@/features/fireInspection/components/FireInspectionItem'
import { FireInspectionTooltip } from '@/features/fireInspection/components/FireInspectionTooltip'
import { FIRE_INSPECTION_MESSAGE } from '@/features/fireInspection/constants/fireInspection'
import { useFireInspectionFormContext } from '@/features/fireInspection/context/fireInspectionFormContext'
import type { InspectionCategory } from '@/features/fireInspection/types/fireInspection'
import { cn } from '@/shared/utils/cn'

/**
 * 카테고리 아코디언 (F2a). 레거시 `FireInspectionCategory.vue`.
 *
 * ✅ **헤더를 `<button>`에서 `<div role="button">`으로 바꿨다.** 레거시는 `<button>` 안에
 * 체크박스와 툴팁 버튼을 중첩해 HTML 명세를 위반했고 스크린리더가 헤더를 읽지 못했다.
 * **화면은 같다** (`fire-inspection.md` F-Q10).
 *
 * ⚠️ **본문을 조건 렌더가 아니라 `hidden`으로 감춘다** — 레거시 `v-show`와 같다.
 * 조건 렌더로 바꾸면 이미지 21개의 로딩 시점이 달라진다.
 *
 * ⚠️ **컨테이너가 `overflow-visible`이다** — 툴팁이 카드 밖으로 나가야 한다.
 * F4의 같은 카드는 `overflow-hidden`이다(툴팁이 없으므로 각각 맞다).
 */
export const FireInspectionCategory = ({ category }: { category: InspectionCategory }) => {
  const {
    getCategoryProgress,
    isCategoryCompleted,
    isCategoryExpanded,
    toggleCategory,
    notApplicableCategories,
    toggleNotApplicable,
    activeTooltipId,
    toggleTooltip,
  } = useFireInspectionFormContext()

  const progress = getCategoryProgress(category)
  const isCompleted = isCategoryCompleted(category)
  const isExpanded = isCategoryExpanded(category.categoryId)
  const isNotApplicable = Boolean(notApplicableCategories[category.categoryId])
  const isProgressFull = progress.completed === progress.total

  return (
    <div className="overflow-visible rounded-xl border border-defaults-tertiary-border-tertiary">
      <div
        role="button"
        tabIndex={0}
        className="relative flex w-full items-center justify-between gap-3 px-3 py-5 text-left"
        onClick={() => {
          toggleCategory(category.categoryId)
        }}
        onKeyDown={(event) => {
          if (event.key !== 'Enter' && event.key !== ' ') return
          event.preventDefault()
          toggleCategory(category.categoryId)
        }}
      >
        <div className="flex items-center gap-1.5">
          <span
            className={cn(
              'flex h-5 w-5 shrink-0 items-center justify-center rounded pretendard-12Bold text-base-b-white',
              isCompleted
                ? 'bg-brand-default-background-brand'
                : 'bg-defaults-tertiary-icon-tertiary',
            )}
          >
            {category.categoryNumber}
          </span>
          <span className="pretendard-16SemiBold text-defaults-primary-text-primary">
            {category.categoryName}
          </span>

          {/* 10개 중 2번 카테고리에만 `description`이 있다 */}
          {category.description && (
            <div className="-ml-1">
              <img
                src="/assets/images/자가점검표/Info.svg"
                alt="도움말"
                className="min-h-5 min-w-5 shrink-0"
                onClick={(event) => {
                  event.stopPropagation()
                  toggleTooltip(category.categoryId)
                }}
              />
            </div>
          )}

          <span
            className={cn(
              '-ml-1 pretendard-13Medium',
              isProgressFull
                ? 'text-brand-default-text-brand'
                : 'text-defaults-tertiary-text-tertiary',
            )}
          >
            ({progress.completed}/{progress.total})
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {/* 체크박스가 헤더 안에 있어 전파를 막지 않으면 아코디언이 함께 토글된다 */}
          <label
            className="flex items-center gap-1"
            onClick={(event) => {
              event.stopPropagation()
            }}
          >
            <input
              type="checkbox"
              checked={isNotApplicable}
              className="h-4 w-4 rounded border-defaults-tertiary-border-tertiary"
              onChange={() => {
                toggleNotApplicable(category)
              }}
            />
            <span className="pretendard-13Medium whitespace-nowrap text-defaults-secondary-text-secondary">
              {FIRE_INSPECTION_MESSAGE.notApplicable}
            </span>
          </label>

          <img
            src="/assets/icons/ChevronDown.svg"
            alt="펼치기/접기"
            aria-hidden
            className={cn('h-5 w-5 transition-transform duration-200', isExpanded && 'rotate-180')}
          />
        </div>

        {category.description && activeTooltipId === category.categoryId && (
          <FireInspectionTooltip
            content={category.description}
            positionClass="inset-x-3 top-full mt-1"
            onClose={(event) => {
              event.stopPropagation()
              toggleTooltip(category.categoryId)
            }}
          />
        )}
      </div>

      {/* `hidden`이라 접혀 있어도 DOM에 남는다 (레거시 `v-show`) */}
      <div
        className={cn(
          'flex flex-col gap-6 border-t border-defaults-tertiary-border-tertiary px-5 py-6',
          !isExpanded && 'hidden',
        )}
      >
        {category.items.map((item) => {
          return <FireInspectionItem key={item.itemId} item={item} />
        })}
      </div>
    </div>
  )
}
