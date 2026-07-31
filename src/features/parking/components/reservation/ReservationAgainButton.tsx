import { useNavigate } from 'react-router-dom'

import { ButtonBase } from '@/shared/components/common/ButtonBase'
import { PARKING_RESERVATION_BASE } from '@/shared/constants/routes'
import { cn } from '@/shared/utils/cn'

/**
 * `방문예약 재신청하기` 버튼. 레거시 `ReservationAgainButton.vue`(40 LOC) 이식.
 *
 * **같은 버튼이 두 곳에서 전혀 다르게 보인다.**
 *
 * | 위치      | 색                   | 크기  | 외곽선 | 글자색                        |
 * | --------- | -------------------- | ----- | ------ | ----------------------------- |
 * | PK11 카드 | `defaults-secondary` | `lg`  | ✅     | `text-navy-default-text-navy` |
 * | PK14 상세 | `brand`              | `2xl` | ❌     | `text-base-b-white`           |
 *
 * ⚠️ 레거시는 **경로에 `detail`이 들어 있는지**로 판별한다. 여기서는 그 판정을 호출부가
 * 명시적으로 넘긴다 — 같은 결과이고, 어느 모습으로 쓰는지가 호출부에서 드러난다.
 *
 * ⚠️ **목록에서는 카드 `<button>` 안에 이 버튼이 들어간다** — 중첩 버튼이라 HTML 규격
 * 위반이다. 클릭 전파를 막아 카드 이동이 일어나지 않게 한다(레거시 `@click.stop`).
 */
export const ReservationAgainButton = ({
  uuid,
  isDetailPage = false,
}: {
  uuid: string
  isDetailPage?: boolean
}) => {
  const navigate = useNavigate()

  return (
    <ButtonBase
      roundType="rounded"
      color={isDetailPage ? 'brand' : 'defaults-secondary'}
      size={isDetailPage ? '2xl' : 'lg'}
      hasOutline={!isDetailPage}
      onClick={(event) => {
        // 카드 전체가 클릭 가능하므로 전파를 막는다
        event.stopPropagation()
        void navigate(`${PARKING_RESERVATION_BASE}/add/${uuid}`)
      }}
    >
      <span
        className={cn(
          isDetailPage ? 'text-base-b-white' : 'pretendard-16SemiBold text-navy-default-text-navy',
        )}
      >
        방문예약 재신청하기
      </span>
    </ButtonBase>
  )
}
