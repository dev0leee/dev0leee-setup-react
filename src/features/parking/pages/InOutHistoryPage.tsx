import { useLocation, useNavigate } from 'react-router-dom'

import { CardList } from '@/features/parking/components/CardList'
import {
  CAR_TYPE_INFO,
  CARD_ITEM_FIELD,
  IN_OUT_LIST_MESSAGE,
} from '@/features/parking/constants/parking'
import { useCurrentYearMonth, useInOutCarList } from '@/features/parking/queries/useInOutCar'
import type { InOutCar } from '@/features/parking/types/parking'
import { ChipBase } from '@/shared/components/common/ChipBase'
import { DrawerMonth } from '@/shared/components/common/DrawerMonth'
import { ROUTE_PATH } from '@/shared/constants/routes'
import type { YearMonth } from '@/shared/types/drawerMonth'
import { formatMinutes } from '@/shared/utils/formatMinutes'

type InOutFieldKey = (typeof CARD_ITEM_FIELD.inOutHistory)[number]['key']

/**
 * 카드 필드 1개의 값.
 *
 * ⚠️ **0분을 `0분`으로 쓴다.** 상세(PK9)는 같은 값을 `-`로 쓴다 — 표기가 다르다
 * (`deferred.md` 「오타·표기」). 그대로 옮겼다.
 */
const renderFieldValue = ({ card, key }: { card: InOutCar; key: InOutFieldKey }) => {
  const value = card[key]
  if (value === undefined) return '-'

  if (key === 'parkingMinutes') {
    const { hours, minutes } = formatMinutes(typeof value === 'number' ? value : undefined)

    if (!hours && !minutes) return '0분'
    if (!hours) return `${minutes}분`
    return `${hours}시간 ${minutes}분`
  }

  return value
}

/** 라우터 state에 저장해 두는 선택 월. 상세를 다녀와도 살아남는다 */
interface InOutHistoryState {
  selectedYear?: number
  selectedMonth?: number
}

/**
 * 입출차 내역 (PK8). 레거시 `InOutHistory/InOutCarHistoryListView.vue`(148 LOC) 이식.
 *
 * **상세를 다녀와도 선택한 달과 스크롤 위치가 유지된다.** 세 장치가 함께 작동한다:
 *
 * | 장치                     | 유지하는 것       |
 * | ------------------------ | ----------------- |
 * | 라우터 state의 선택 월   | 조회 조건         |
 * | `useReturnFromDetail`    | 목록 캐시(페이지) |
 * | `CardList`의 스크롤 복원 | 스크롤 위치       |
 *
 * ⚠️ **달을 라우터 state에 넣는다.** 레거시가 `history.replaceState`로 하던 것과 같다 —
 * 뒤로 돌아오면 브라우저가 그 항목의 state를 복원해 준다. URL에는 남기지 않는다.
 *
 * ⚠️ **다른 화면에서 새로 들어오면 이번 달로 초기화된다** — 새 히스토리 항목에는
 * state가 없다. 레거시와 같다.
 *
 * ⚠️ **마일리지 내역(PK2)은 이 저장을 하지 않는다.** 3개 목록 중 2개만 한다 — 비대칭이고
 * 레거시 그대로다 (`deferred.md` D-239).
 */
export const InOutHistoryPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const currentYearMonth = useCurrentYearMonth()

  const savedMonth = location.state as InOutHistoryState | null
  const selectedMonth: YearMonth = {
    year: savedMonth?.selectedYear ?? currentYearMonth.year,
    month: savedMonth?.selectedMonth ?? currentYearMonth.month,
  }

  const {
    inOutCarList,
    isInOutCarListLoading,
    isInOutCarListError,
    hasInOutCarListNextPage,
    fetchInOutCarListNextPage,
    resetCache,
    markLeavingToDetail,
  } = useInOutCarList({ selectedMonth })

  const changeMonth = (yearMonth: YearMonth) => {
    resetCache()
    void navigate(location.pathname, {
      replace: true,
      state: {
        ...savedMonth,
        selectedYear: yearMonth.year,
        selectedMonth: yearMonth.month,
      } satisfies InOutHistoryState,
    })
  }

  return (
    <div className="h-full pb-10">
      <DrawerMonth selected={selectedMonth} onChange={changeMonth} />

      <CardList
        list={inOutCarList?.pages}
        isLoading={isInOutCarListLoading}
        isError={isInOutCarListError}
        errorMessage={IN_OUT_LIST_MESSAGE.error}
        emptyMessage={IN_OUT_LIST_MESSAGE.empty}
        hasNextPage={hasInOutCarListNextPage}
        fetchNextPage={fetchInOutCarListNextPage}
        scrollRestorePath={ROUTE_PATH.PARKING_INOUT_HISTORY}
      >
        {inOutCarList?.pages.map((card) => {
          // 목록에 없는 유형이면 라벨도 색도 없는 칩이 된다 — 레거시 `findCarType` 동일
          const carTypeInfo = CAR_TYPE_INFO[card.carType ?? '']

          return (
            <li
              key={card.uuid}
              className="border-deep-glue-20 flex flex-col gap-3 self-stretch rounded-xl border bg-base-b-white p-3 shadow-md"
            >
              <button
                type="button"
                className="flex flex-col gap-3"
                onClick={() => {
                  // 돌아왔을 때 목록을 되살리기 위한 표시다 (`useReturnFromDetail`)
                  markLeavingToDetail()
                  void navigate(`${ROUTE_PATH.PARKING_INOUT_HISTORY}/detail/${card.uuid}`)
                }}
              >
                <div className="flex w-full flex-col gap-1 border-b border-b-defaults-tertiary-border-tertiary pb-3">
                  <ChipBase color={carTypeInfo?.chipColor} variant="fill">
                    {carTypeInfo?.label}
                  </ChipBase>
                  <div className="flex w-full items-center gap-1">
                    <span className="pretendard-18SemiBold text-defaults-primary-text-primary">
                      {card.carNum}
                    </span>
                    <img
                      className="h-[18px] w-[18px]"
                      src="/assets/icons/ArrowRight.svg"
                      alt="화살표 아이콘"
                    />
                  </div>
                </div>

                <ul className="flex w-full flex-col items-start gap-2.5">
                  {CARD_ITEM_FIELD.inOutHistory.map((item) => {
                    return (
                      <li key={item.key} className="flex w-full items-start justify-between gap-2">
                        <span className="pretendard-14SemiBold whitespace-nowrap text-defaults-tertiary-text-tertiary">
                          {item.label}
                        </span>
                        <span className="text-left pretendard-14Regular text-defaults-secondary-text-secondary">
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
