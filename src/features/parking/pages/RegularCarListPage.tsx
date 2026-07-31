import { useLocation } from 'react-router-dom'

import { CardList } from '@/features/parking/components/CardList'
import { CARD_ITEM_FIELD, PARKING_LIST_MESSAGE } from '@/features/parking/constants/parking'
import { useWallPadContent, WALL_PAD_CAR_TYPE } from '@/features/parking/hooks/useWallPadContent'
import { useRegularCarList } from '@/features/parking/queries/useRegularCarList'
import type { RegularCar } from '@/features/parking/types/parking'
import { ChipBase } from '@/shared/components/common/ChipBase'
import { ROUTE_PATH } from '@/shared/constants/routes'
import { cn } from '@/shared/utils/cn'
import { formatPhone } from '@/shared/utils/formatPhone'

const renderFieldValue = ({
  card,
  key,
}: {
  card: RegularCar
  key: (typeof CARD_ITEM_FIELD.regular)[number]['key']
}) => {
  const value = card[key]
  if (value === undefined) return '-'
  if (key === 'phone') return formatPhone({ phone: value ?? undefined })

  return value
}

/**
 * 정기권 차량 (PK15). 레거시 `RegularCar/RegularCarListView.vue`(104 LOC) 이식.
 *
 * ⚠️ **이 컴포넌트는 라우트이자 PK1의 임베드 블록이다.** 어느 쪽인지를 **경로로**
 * 판단한다 — props가 아니라 `useLocation()`이다(레거시 `getCurrentRoutePath()` 동일).
 *
 * | 구분      | PK15 (라우트)      | PK1 임베드                  |
 * | --------- | ------------------ | --------------------------- |
 * | 루트      | `h-full`           | `flex-1`                    |
 * | 제목      | 없음 (AppBar가 함) | `정기권 차량 등록 현황`     |
 * | 스크롤    | 자체 `overflow`    | **없음** — PK1 전체가 스크롤 |
 *
 * ⚠️ **PK1에서는 페이지 끝까지 내리면 다음 페이지가 로드된다.** 센티널이 페이지
 * 하단에 있고 자체 스크롤이 없어서다. 의도된 동작이다.
 *
 * ⚠️ **카드 스타일이 다른 주차 목록과 다르다** — 테두리·그림자가 없고 배경이 회색이며
 * 차량번호·라벨 폰트가 한 단계씩 작다. 클릭할 수 없는 목록이라 구분한 것으로 보인다.
 *
 * ⚠️ **카드가 `<button>`인데 클릭 핸들러가 없다.** 눌러도 아무 일이 없고 `active:`
 * 스타일도 없어 사용자는 알 수 없다. 레거시 그대로다 (`deferred.md` 「죽은 코드」).
 */
export const RegularCarListPage = () => {
  const location = useLocation()
  const isRegularPage = location.pathname.includes(ROUTE_PATH.PARKING_REGULAR_CAR)

  const {
    regularCarList,
    isRegularCarListLoading,
    isRegularCarListError,
    hasRegularCarListNextPage,
    fetchRegularCarListNextPage,
  } = useRegularCarList()

  // 🔴 `'regular'`를 넘기는 유일한 호출부다 — `외부월패드(정기차량)`만 구독한 단지에서도
  // 여기서는 월패드 칩이 보인다
  const { hasWallPadUI } = useWallPadContent(WALL_PAD_CAR_TYPE.REGULAR)

  return (
    <div
      className={cn(
        'w-full space-y-2 bg-defaults-primary-background-primary',
        isRegularPage ? 'h-full' : 'flex-1',
      )}
    >
      {!isRegularPage && <h2 className="px-7 pt-7 pretendard-16SemiBold">정기권 차량 등록 현황</h2>}

      <CardList
        list={regularCarList?.pages}
        isLoading={isRegularCarListLoading}
        isError={isRegularCarListError}
        errorMessage={PARKING_LIST_MESSAGE.regularCar.error}
        emptyMessage={PARKING_LIST_MESSAGE.regularCar.empty}
        hasNextPage={hasRegularCarListNextPage}
        fetchNextPage={fetchRegularCarListNextPage}
        hasScroll={isRegularPage}
      >
        {regularCarList?.pages.map((card) => {
          return (
            <li
              key={card.uuid}
              className="w-full rounded-xl bg-defaults-secondary-background-mono p-3"
            >
              <button type="button" className="flex w-full flex-col gap-3">
                <div className="w-full space-y-1 border-b border-defaults-secondary-border-secondary pb-3">
                  {hasWallPadUI && card.notificationFlag && (
                    <ChipBase color="blue" variant="fill" className="pb-2">
                      월패드 알림
                    </ChipBase>
                  )}
                  <div className="text-left pretendard-16SemiBold">{card.carNum}</div>
                </div>

                <ul className="flex w-full flex-col items-start gap-2.5">
                  {CARD_ITEM_FIELD.regular.map((item) => {
                    return (
                      <li key={item.key} className="flex w-full items-start justify-between gap-2">
                        <span className="pretendard-14Medium whitespace-nowrap text-defaults-tertiary-text-tertiary">
                          {item.label}
                        </span>
                        <span className="pretendard-14Regular text-defaults-secondary-text-secondary">
                          {renderFieldValue({ card, key: item.key }) || '-'}
                        </span>
                      </li>
                    )
                  })}
                </ul>
              </button>
            </li>
          )
        })}
      </CardList>
    </div>
  )
}
