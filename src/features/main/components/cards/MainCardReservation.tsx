import { useNavigate } from 'react-router-dom'

import type { MainCardProps } from '@/features/main/types/card'
import { ROUTE_PATH } from '@/shared/constants/routes'
import { cn } from '@/shared/utils/cn'

/**
 * 주차 방문예약 카드. 레거시 `MainCardReservation.vue` 이식.
 *
 * ⚠️ **아이콘이 진입 시 2번 흔들린다.** `shake-animation` 클래스가 `index.css`에 있다.
 *
 * ⚠️ 레거시는 `onMounted`에서 300ms 뒤 `shouldShake`를 켜지만 **템플릿이 그 값을 쓰지
 * 않는다.** 애니메이션은 클래스로 항상 돈다 — 죽은 상태라 옮기지 않았다 (`deferred.md` D-37).
 *
 * ⚠️ `motion-reduce` 대응을 넣지 않았다. 레거시에 없어서 추가하면 동작이 달라진다
 * (`14-styling.md`와 충돌하지만 등가 이관 우선).
 */
export const MainCardReservation = ({ layoutType, className }: MainCardProps) => {
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
        void navigate(ROUTE_PATH.PARKING_RESERVATION)
      }}
    >
      <h2 className="text-left pretendard-14SemiBold break-keep">주차 방문예약</h2>
      <div className="flex self-end">
        <img
          src="/assets/icons/icon-parking-reservation.svg"
          alt="방문예약 아이콘"
          className="shake-animation h-8 w-8"
        />
      </div>
    </button>
  )
}
