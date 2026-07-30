import { useNavigate } from 'react-router-dom'

import type { MainCardProps } from '@/features/main/types/card'
import { ROUTE_PATH } from '@/shared/constants/routes'
import { cn } from '@/shared/utils/cn'

/** 방문 출입관리 카드. 레거시 `MainCardVisitorPass.vue` 이식 */
export const MainCardVisitorPass = ({ layoutType, className }: MainCardProps) => {
  const navigate = useNavigate()

  return (
    <button
      type="button"
      className={cn(
        'cursor-pointer',
        layoutType === 'vertical'
          ? 'flex flex-col justify-between'
          : 'flex max-h-[54px] items-center justify-between',
        className,
      )}
      onClick={() => {
        void navigate(ROUTE_PATH.VISIT)
      }}
    >
      <h2 className="text-left pretendard-14SemiBold break-keep">방문 출입관리</h2>
      <div className="flex self-end">
        <img src="/assets/icons/icon-main-visit.svg" alt="방문증 아이콘" className="h-8 w-8" />
      </div>
    </button>
  )
}
