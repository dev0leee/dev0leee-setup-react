import { useNavigate } from 'react-router-dom'

import { MainCardApassBadge } from '@/features/main/components/cards/MainCardApassBadge'
import type { MainCardProps } from '@/features/main/types/card'
import { ROUTE_PATH } from '@/shared/constants/routes'
import { useResidentDetailInfo } from '@/shared/hooks/useResidentDetailInfo'
import { cn } from '@/shared/utils/cn'

/**
 * A-PASS 카드. 레거시 `MainCardAPass.vue` 이식.
 *
 * ⚠️ **미가입(`apassUseFlag`가 false)이면 눌러도 이동하지 않는다.** 카드는 그대로 보이고
 * 커서만 `not-allowed`로 바뀐다 — `disabled`가 아니라 핸들러에서 막는다(레거시 동일).
 */
export const MainCardAPass = ({ layoutType, className }: MainCardProps) => {
  const navigate = useNavigate()
  const { residentDetailInfo } = useResidentDetailInfo()

  const canUseApass = Boolean(residentDetailInfo?.apassUseFlag)

  return (
    <button
      type="button"
      className={cn(
        'min-h-[54px] cursor-pointer justify-between',
        !canUseApass && 'cursor-not-allowed',
        layoutType === 'horizontal' ? 'flex max-h-[54px] items-center' : 'flex flex-col',
        className,
      )}
      onClick={() => {
        if (!canUseApass) return
        void navigate(ROUTE_PATH.APASS)
      }}
    >
      <h2 className="text-left pretendard-14SemiBold whitespace-nowrap">A-PASS</h2>
      <MainCardApassBadge
        apassStatus={residentDetailInfo?.apassOnOffFlag}
        apassUseFlagStatus={residentDetailInfo?.apassUseFlag}
      />
    </button>
  )
}
