import { useEffect, useState } from 'react'

import { MENU_SHAKE_DELAY_MS } from '@/features/parking/constants/parking'
import { cn } from '@/shared/utils/cn'

/**
 * 메뉴 타일 1개 (PK1). 레거시 `ParkingManagementItem.vue`(65 LOC) 이식.
 *
 * ⚠️ **`주차 방문예약`만 아이콘이 흔들린다.** 진입 300ms 뒤에 클래스가 붙고
 * `shake-animation`(0.6초 × 2회)이 재생된다. 애니메이션은 `index.css`에 이미 있다 —
 * 메인 카드(`MainCardReservation`)가 같은 클래스를 쓴다.
 *
 * ⚠️ **`isLarge`면 세로 배치가 되고 아이콘이 오른쪽 아래로 간다.**
 * 마일리지 한도 제한 단지에서 방문예약 타일이 2칸을 차지할 때만 그렇다.
 */
export const ParkingMenuTile = ({
  name,
  icon,
  isLarge = false,
  canShake = false,
  className,
  onClick,
}: {
  name: string
  icon: string
  isLarge?: boolean
  canShake?: boolean
  className?: string
  onClick: () => void
}) => {
  const [shouldShake, setShouldShake] = useState(false)

  useEffect(() => {
    if (!canShake) return

    const timer = setTimeout(() => {
      setShouldShake(true)
    }, MENU_SHAKE_DELAY_MS)

    return () => {
      clearTimeout(timer)
    }
  }, [canShake])

  return (
    <button
      type="button"
      className={cn(
        'flex justify-between gap-2 overflow-hidden rounded-lg border border-defaults-tertiary-border-tertiary bg-defaults-primary-background-primary p-3 active:bg-defaults-tertiary-border-tertiary/40',
        isLarge ? 'flex-col items-start' : 'items-center',
        className,
      )}
      onClick={onClick}
    >
      <span className="pretendard-14SemiBold whitespace-nowrap">{name}</span>
      <img
        src={icon}
        alt={`${name} 아이콘`}
        className={cn(isLarge && 'self-end', shouldShake && canShake && 'shake-animation')}
      />
    </button>
  )
}
