import { useNavigate } from 'react-router-dom'

import { ParkingMenuTile } from '@/features/parking/components/dashboard/ParkingMenuTile'
import { PARKING_MENU_LIST, SHAKE_MENU_NAME } from '@/features/parking/constants/parking'
import { SkeletonBase } from '@/shared/components/common/SkeletonBase'
import { APT_CONTENT_NAME } from '@/shared/constants/aptContent'
import { useResidentDetailInfo } from '@/shared/hooks/useResidentDetailInfo'
import { hasAptContent } from '@/shared/lib/aptContext'
import { useAuthStore } from '@/shared/stores/authStore'

/** 로딩 스켈레톤 타일 수. 실제 메뉴가 3개인 단지에서도 4개가 보인다 — 레거시 그대로 */
const SKELETON_TILE_COUNT = 4

/**
 * PK1 메뉴 그리드. 레거시 `ParkingManagementMenus.vue`(63 LOC) 이식.
 *
 * ### 마일리지 한도 제한 단지
 *
 * | 단지 유형          | 메뉴                                            | 배치                    |
 * | ------------------ | ----------------------------------------------- | ----------------------- |
 * | 일반               | 방문예약 · 입출차 · 즐겨찾기 · 항상허용        | 2×2 균등                |
 * | 마일리지 한도 제한 | 방문예약(크게) · 입출차 · 즐겨찾기             | 방문예약이 세로 2칸     |
 *
 * ⚠️ **`항상허용 차량` 메뉴가 사라져도 라우트(PK4)는 살아 있다.** 마이페이지에도 링크가
 * 없어 실질적으로 도달할 수 없지만 URL 직접 진입은 된다. 레거시 그대로 둔다
 * (`parking.md` PK-Q5).
 *
 * ⚠️ **판정을 읽는 곳과 기다리는 곳이 다르다.** `마일리지 한도 제한` 여부는
 * `aptInfo`(localStorage)에서 읽는데, 로딩 게이트는 `residentDetailInfo`(서버) 조회다.
 * 메뉴 자체는 상수라 서버를 기다릴 이유가 없지만 레거시가 그렇게 만들어져 있다
 * (`deferred.md`).
 *
 * ⚠️ **로딩과 완료의 `gap`이 다르다** (`gap-[14px]` vs `gap-3`=12px). 전환 시 미세하게
 * 흔들린다. 레거시 그대로다.
 */
export const ParkingMenuGrid = () => {
  const navigate = useNavigate()
  const { isResidentDetailInfoLoading } = useResidentDetailInfo()

  const contentList = useAuthStore((state) => {
    return state.aptInfo.contentList
  })

  const hasMileageLimit = hasAptContent({
    contentList,
    contentName: APT_CONTENT_NAME.MILEAGE_LIMIT,
  })

  // 앞 3개만 남기고 `항상허용 차량`을 버린다. 순서는 상수 그대로다
  const parkingMenuList = hasMileageLimit ? PARKING_MENU_LIST.slice(0, 3) : PARKING_MENU_LIST

  if (isResidentDetailInfoLoading) {
    return (
      <div className="space-y-2">
        <div className="grid w-full grid-cols-2 gap-[14px]">
          {Array.from({ length: SKELETON_TILE_COUNT }, (_, index) => {
            return <SkeletonBase key={index} className="h-16 w-full rounded" />
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="grid w-full grid-cols-2 gap-3">
        {parkingMenuList.map((menu) => {
          // 큰 타일은 마일리지 한도 제한 단지의 첫 메뉴(방문예약) 하나뿐이다
          const isLarge = hasMileageLimit && menu.name === SHAKE_MENU_NAME

          return (
            <ParkingMenuTile
              key={menu.name}
              name={menu.name}
              icon={menu.icon}
              isLarge={isLarge}
              canShake={menu.name === SHAKE_MENU_NAME}
              className={isLarge ? 'row-span-2' : undefined}
              onClick={() => {
                void navigate(menu.url)
              }}
            />
          )
        })}
      </div>
    </div>
  )
}
