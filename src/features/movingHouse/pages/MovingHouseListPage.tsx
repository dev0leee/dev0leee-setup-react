import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { MovingHouseListItem } from '@/features/movingHouse/components/MovingHouseListItem'
import {
  MOVING_HOUSE_MESSAGE,
  MOVING_HOUSE_STATUS_LIST,
} from '@/features/movingHouse/constants/movingHouse'
import { useMovingHouseList } from '@/features/movingHouse/queries/useMovingHouse'
import { ButtonBase } from '@/shared/components/common/ButtonBase'
import { SpinnerDots } from '@/shared/components/common/SpinnerDots'
import { TabCategory } from '@/shared/components/common/TabCategory'
import { TextEmpty } from '@/shared/components/common/TextEmpty'
import { movingHouseDetailPath, ROUTE_PATH } from '@/shared/constants/routes'
import { useInfiniteScrollPosition } from '@/shared/hooks/useInfiniteScrollPosition'

/**
 * 예약 목록 (MH1). 레거시 `MovingHouseView.vue` + `MovingHouseList.vue` 이식.
 *
 * ⚠️ **페이징이 없다** (#124). 예약이 많은 세대는 전부 한 번에 온다 — 무한 스크롤을
 * 붙이지 않는다. 그런데도 스크롤 **위치 복원**은 쓴다(레거시가 그 훅의 복원 기능만
 * 가져다 썼다).
 *
 * ⚠️ **탭 선택은 화면 상태다.** 상세를 보고 돌아오면 `전체`로 초기화된다 —
 * 스크롤 위치는 복원되는데 탭은 아니다. 레거시 그대로다.
 *
 * ⚠️ **하단 버튼의 고정 클래스에 `right-0`이 없다** (`fixed bottom-0 left-0`).
 * `ButtonBase` 루트의 `w-full`이 있어 결과적으로 전체 폭이 된다 — MH3의 `다음`은
 * `right-0`까지 준다. 레거시 클래스를 그대로 옮겼다.
 */
export const MovingHouseListPage = () => {
  const navigate = useNavigate()

  const [selectedIndex, setSelectedIndex] = useState(0)
  const [moveReservationStatus, setMoveReservationStatus] = useState<string | undefined>(undefined)

  const { movingHouseList, isMovingHouseListLoading } = useMovingHouseList({
    moveReservationStatus,
  })

  const { scrollContainerRef } = useInfiniteScrollPosition<HTMLDivElement>({
    rules: { moveFrom: '/detail', moveTo: '/movingHouse' },
  })

  const categories = MOVING_HOUSE_STATUS_LIST.map((status) => {
    return { uuid: status.status, category: status.label }
  })

  return (
    <div className="h-full pb-24">
      <section className="h-full w-full space-y-3">
        <div className="pt-3">
          <TabCategory
            categories={categories}
            selectedIndex={selectedIndex}
            hasTotalType
            onSelect={({ index, category }) => {
              setSelectedIndex(index)
              setMoveReservationStatus(category.uuid)
            }}
          />
        </div>

        <div ref={scrollContainerRef} className="flex h-full w-full flex-col overflow-auto">
          {isMovingHouseListLoading ? (
            <SpinnerDots />
          ) : movingHouseList && movingHouseList.length > 0 ? (
            <ul className="flex w-full flex-col items-start gap-3 p-6">
              {movingHouseList.map((item) => {
                return (
                  <MovingHouseListItem
                    key={item.uuid}
                    movingHouseInfo={item}
                    onClick={() => {
                      void navigate(movingHouseDetailPath({ movingUuid: item.uuid }))
                    }}
                  />
                )
              })}
            </ul>
          ) : (
            <TextEmpty className="flex-1">{MOVING_HOUSE_MESSAGE.listEmpty}</TextEmpty>
          )}
        </div>
      </section>

      <ButtonBase
        type="button"
        color="brand"
        roundType="square"
        size="xl"
        className="fixed bottom-0 left-0"
        onClick={() => {
          void navigate(ROUTE_PATH.MOVING_HOUSE_WRITE)
        }}
      >
        {MOVING_HOUSE_MESSAGE.writeButton}
      </ButtonBase>
    </div>
  )
}
