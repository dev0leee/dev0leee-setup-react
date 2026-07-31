import { useLocation, useNavigate } from 'react-router-dom'

import { CardList } from '@/features/parking/components/CardList'
import { ReservationAgainButton } from '@/features/parking/components/reservation/ReservationAgainButton'
import { ReservationStatusChip } from '@/features/parking/components/reservation/ReservationStatusChip'
import { RESERVATION_LIST_MESSAGE } from '@/features/parking/constants/parking'
import { useWallPadContent } from '@/features/parking/hooks/useWallPadContent'
import { useCurrentYearMonth } from '@/features/parking/queries/useInOutCar'
import { useReservationCarList } from '@/features/parking/queries/useReservationCar'
import type { ReservationCar } from '@/features/parking/types/parking'
import { ButtonBase } from '@/shared/components/common/ButtonBase'
import { ChipBase } from '@/shared/components/common/ChipBase'
import { DrawerMonth } from '@/shared/components/common/DrawerMonth'
import { SkeletonBase } from '@/shared/components/common/SkeletonBase'
import { PARKING_RESERVATION_BASE, ROUTE_PATH } from '@/shared/constants/routes'
import type { YearMonth } from '@/shared/types/drawerMonth'

/**
 * 예약 기간 표기.
 *
 * ⚠️ **`.slice(5)`가 시각까지 남긴다.** `2026-07-29` → `2026/07/29` → `07/29`인데,
 * 서버가 시각을 포함해 주면 `07/29 00:00:00`처럼 보인다 (`parking.md` PK-Q9).
 *
 * ⚠️ 레거시는 `?.`가 `replaceAll`까지만 걸려 있어 값이 없으면 `.slice()`에서 터진다.
 * **옵셔널을 이어 붙여 막았다** — 정상 응답에서는 결과가 같다.
 */
const renderScheduledDate = (card: ReservationCar) => {
  const inDate = card.inParkingScheduledDate?.replaceAll('-', '/')
  const outDate = card.outParkingScheduledDate?.replaceAll('-', '/')

  if (card.inParkingScheduledDate === card.outParkingScheduledDate) {
    return inDate?.slice(5)
  }

  return `${inDate?.slice(5) ?? ''} ~ ${outDate?.slice(5) ?? ''}`
}

/** 라우터 state에 저장해 두는 선택 월. 상세를 다녀와도 살아남는다 */
interface ReservationListState {
  selectedYear?: number
  selectedMonth?: number
}

/**
 * 방문예약 관리 (PK11). 레거시 `ReservationCarListView.vue`(188 LOC) 이식.
 *
 * 입출차 목록(PK8)과 **월 보존·캐시 복원·스크롤 복원 구조가 같다.**
 *
 * ⚠️ **총 건수에 `|| 0`이 없다.** 응답 전에는 `총 건`으로 보인다 — 로딩 중엔 스켈레톤이
 * 대신 나와 가려진다. 마일리지 내역(PK2)에는 `|| 0`이 있다. **비대칭이고 레거시 그대로다.**
 *
 * 🔴 **카드 `<button>` 안에 재신청 `<button>`이 중첩된다.** HTML 규격 위반이지만 레이아웃이
 * 이것에 맞춰져 있어 그대로 옮겼다. 전파를 막아 카드 이동이 일어나지 않게 한다.
 */
export const ReservationListPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const currentYearMonth = useCurrentYearMonth()
  const { hasWallPadUI } = useWallPadContent()

  const savedMonth = location.state as ReservationListState | null
  const selectedMonth: YearMonth = {
    year: savedMonth?.selectedYear ?? currentYearMonth.year,
    month: savedMonth?.selectedMonth ?? currentYearMonth.month,
  }

  const {
    reservationCarList,
    isReservationCarListLoading,
    isReservationCarListError,
    hasReservationCarListNextPage,
    fetchReservationCarListNextPage,
    resetCache,
    markLeavingToDetail,
  } = useReservationCarList({ selectedMonth })

  const changeMonth = (yearMonth: YearMonth) => {
    resetCache()
    void navigate(location.pathname, {
      replace: true,
      state: {
        ...savedMonth,
        selectedYear: yearMonth.year,
        selectedMonth: yearMonth.month,
      } satisfies ReservationListState,
    })
  }

  return (
    <div className="h-full border-b border-neutral-b-gray-300 pb-20">
      <DrawerMonth selected={selectedMonth} onChange={changeMonth} />

      {isReservationCarListLoading ? (
        <div className="px-6 py-1.5">
          <SkeletonBase className="h-5 w-16 rounded" />
        </div>
      ) : (
        <span className="px-6 py-1.5 pretendard-16SemiBold text-defaults-primary-text-primary">
          총 {reservationCarList?.pageable.totalElements}건
        </span>
      )}

      <CardList
        list={reservationCarList?.pages}
        isLoading={isReservationCarListLoading}
        isError={isReservationCarListError}
        errorMessage={RESERVATION_LIST_MESSAGE.error}
        emptyMessage={RESERVATION_LIST_MESSAGE.empty}
        hasNextPage={hasReservationCarListNextPage}
        fetchNextPage={fetchReservationCarListNextPage}
        scrollRestorePath={ROUTE_PATH.PARKING_RESERVATION}
      >
        {reservationCarList?.pages.map((card) => {
          return (
            <li
              key={card.uuid}
              className="border-deep-glue-20 flex flex-col gap-3 self-stretch rounded-xl border bg-base-b-white p-3 shadow-md"
            >
              <button
                type="button"
                className="flex flex-col gap-3"
                onClick={() => {
                  markLeavingToDetail()
                  void navigate(`${PARKING_RESERVATION_BASE}/detail/${card.uuid}`)
                }}
              >
                <div className="flex w-full flex-col gap-1 border-b border-b-defaults-tertiary-border-tertiary pb-3">
                  <div className="flex gap-2">
                    <ReservationStatusChip
                      inParkingFlag={card.inParkingFlag}
                      outParkingScheduledDate={card.outParkingScheduledDate}
                    />
                    {hasWallPadUI && card.notificationFlag && (
                      <ChipBase color="blue" variant="fill">
                        월패드 알림
                      </ChipBase>
                    )}
                  </div>
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
                  <li className="flex w-full items-start justify-between gap-2">
                    <span className="pretendard-14SemiBold whitespace-nowrap text-defaults-tertiary-text-tertiary">
                      입출차 예약 기간
                    </span>
                    <span className="text-left pretendard-14Regular text-defaults-secondary-text-secondary">
                      {renderScheduledDate(card)}
                    </span>
                  </li>
                </ul>

                <div className="w-full pt-2">
                  <ReservationAgainButton uuid={card.uuid} />
                </div>
              </button>
            </li>
          )
        })}
        <div className="pt-8" />
      </CardList>

      <ButtonBase
        className="fixed bottom-0 left-0"
        color="brand"
        size="2xl"
        roundType="square"
        onClick={() => {
          void navigate(`${PARKING_RESERVATION_BASE}/add`)
        }}
      >
        예약하기
      </ButtonBase>
    </div>
  )
}
