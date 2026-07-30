import { MainApayMenus } from '@/features/main/components/MainApayMenus'
import { FIRST_ROW_HEIGHT_CLASS } from '@/features/main/constants/cardLayout'
import { useMainCardLayout } from '@/features/main/hooks/useMainCardLayout'
import { SkeletonBase } from '@/shared/components/common/SkeletonBase'
import { cn } from '@/shared/utils/cn'

/**
 * 카드 그리드. 레거시 `MainCardMenus.vue` 이식.
 *
 * 배치 계산은 `useMainCardLayout`이 하고 이 컴포넌트는 그린다.
 * 레거시 `<component :is>`는 계산 결과가 들고 있는 컴포넌트를 그대로 렌더하는 것으로 옮겼다.
 *
 * ⚠️ **1행 높이(`h-[106px]`)는 카드가 2장 이상일 때만 준다.** 1장이면 내용 높이를 따른다.
 *
 * ⚠️ **로딩 스켈레톤은 실제 카드 개수와 무관하게 고정 레이아웃**이다 (1행 2장 + 2행 1+2장).
 * 카드가 2장뿐인 단지도 로딩 중에는 5장짜리 뼈대를 본다 — 레거시 그대로다.
 */
export const MainCardMenus = () => {
  const { layoutRows, cardCount, getCardClassName, isResidentDetailInfoLoading } =
    useMainCardLayout()

  if (isResidentDetailInfoLoading) {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex h-[106px] w-full gap-2">
          <SkeletonBase className="w-1/3 rounded-lg" />
          <SkeletonBase className="w-2/3 rounded-lg" />
        </div>
        <div className="flex w-full gap-2">
          <SkeletonBase className="h-24 w-1/2 rounded-lg" />
          <div className="flex h-24 w-1/2 flex-col gap-2">
            <SkeletonBase className="h-full rounded-lg" />
            <SkeletonBase className="h-full rounded-lg" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {layoutRows.map((row, rowIndex) => {
        return (
          <div
            // 행은 서로 구분할 값이 없어 인덱스를 키로 쓴다 (레거시 동일)
            key={`row-${String(rowIndex)}`}
            className={cn(
              'flex w-full gap-2',
              cardCount > 1 && rowIndex === 0 && FIRST_ROW_HEIGHT_CLASS,
            )}
          >
            {row.map((cell) => {
              // 5장 배치의 2행 우측: 세로로 2장을 쌓는 컨테이너
              if (Array.isArray(cell)) {
                return (
                  <div
                    key={`nested-${String(rowIndex)}`}
                    className="flex h-full w-1/2 flex-col gap-2"
                  >
                    {cell.map(({ id, Component, layoutType, ...card }) => {
                      return (
                        <Component
                          key={id}
                          layoutType={layoutType}
                          className={getCardClassName({ id, Component, layoutType, ...card })}
                        />
                      )
                    })}
                  </div>
                )
              }

              const { id, Component, layoutType } = cell

              return (
                <Component key={id} layoutType={layoutType} className={getCardClassName(cell)} />
              )
            })}
          </div>
        )
      })}
      <MainApayMenus />
    </div>
  )
}
