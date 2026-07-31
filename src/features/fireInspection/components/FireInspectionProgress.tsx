import { FIRE_INSPECTION_MESSAGE } from '@/features/fireInspection/constants/fireInspection'

/**
 * 진행률 바 (F2a). 레거시 `FireInspectionProgress.vue`.
 *
 * ⚠️ **`sticky top-0`이라 스크롤하면 AppBar 아래에 붙어 따라온다.**
 * AppBar가 `z-[100]`, 이 바가 `z-10`이라 AppBar 아래로 지나간다 — 의도된 계층이다.
 */
export const FireInspectionProgress = ({ percent }: { percent: number }) => {
  return (
    <div className="sticky top-0 z-10 flex flex-col gap-2 border-b border-defaults-tertiary-border-tertiary bg-base-b-white px-5 pt-4 pb-4">
      <p className="pretendard-16SemiBold text-defaults-primary-text-primary">
        {FIRE_INSPECTION_MESSAGE.progressTitle}
      </p>
      <div className="flex items-center gap-2">
        <span className="pretendard-14Medium text-brand-default-text-brand">{percent}%</span>
        <div className="h-1 flex-1 rounded-full bg-defaults-secondary-background-secondary">
          <div
            className="h-full rounded-full bg-brand-default-background-brand transition-all duration-300"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>
    </div>
  )
}
