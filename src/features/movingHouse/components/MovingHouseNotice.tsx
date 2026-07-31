import { MOVING_HOUSE_DETAIL_INFO_DATA } from '@/features/movingHouse/constants/movingHouse'
import { useMovingHouseSetting } from '@/features/movingHouse/queries/useMovingHouse'
import {
  MOVING_HOUSE_STATUS,
  type MovingHouseDetailData,
} from '@/features/movingHouse/types/movingHouse'

/**
 * 하단 안내문. 레거시 `MovingHouseDetailInfo.vue`.
 *
 * ✅ **MH-Q10 결정 적용 — 회색 카드 배경을 살렸다.** 레거시는 `<p>` 안에 `<div>`를 넣어
 * HTML 파서가 `<p>`를 강제로 닫았고, 그래서 **`chargeFlag: true`인 단지에서만 배경·패딩·
 * 글자색이 통째로 사라졌다.** 같은 화면이 단지 설정에 따라 다르게 보이던 것이라
 * 사용자 결정으로 고쳤다 — 이제 두 경우 모두 회색 카드로 보인다
 * (`moving-house.md` MH-Q10 · `deferred.md` D-94).
 *
 * ⚠️ **`14일`은 문구에 하드코딩돼 있다** — 서버 설정값이 아니다 (MH-Q3).
 * ⚠️ **MH4에서는 상세가 없어 언제나 `CANCELED`가 아닌 쪽으로 간다.**
 */
export const MovingHouseNotice = ({ detail }: { detail?: MovingHouseDetailData }) => {
  const { movingHouseSetting } = useMovingHouseSetting()

  const isCanceled = detail?.moveReservationStatus === MOVING_HOUSE_STATUS.CANCELED

  return (
    <div className="flex flex-col gap-3 bg-defaults-secondary-background-secondary px-4 py-3 pretendard-14Regular text-defaults-secondary-text-secondary">
      {isCanceled && MOVING_HOUSE_DETAIL_INFO_DATA.CANCELED}

      {!isCanceled &&
        (movingHouseSetting?.chargeFlag ? (
          <div className="flex flex-col gap-5">
            {MOVING_HOUSE_DETAIL_INFO_DATA.USED_FEE.map((paragraph) => {
              return <div key={paragraph}>{paragraph}</div>
            })}
          </div>
        ) : (
          MOVING_HOUSE_DETAIL_INFO_DATA.NONE_FEE
        ))}
    </div>
  )
}
