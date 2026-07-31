import { CardList } from '@/features/parking/components/CardList'
import { MileageCardMenus } from '@/features/parking/components/mileage/MileageCardMenus'
import { CARD_ITEM_FIELD, PARKING_LIST_MESSAGE } from '@/features/parking/constants/parking'
import { useParkingMileageList } from '@/features/parking/queries/useParkingMileageList'
import type { MileageHistoryItem } from '@/features/parking/types/parking'
import { ChipBase } from '@/shared/components/common/ChipBase'
import { DrawerMonth } from '@/shared/components/common/DrawerMonth'
import { formatMinutes } from '@/shared/utils/formatMinutes'

type MileageFieldKey = (typeof CARD_ITEM_FIELD.mileageHistory)[number]['key']

/**
 * 카드 필드 1개의 값.
 *
 * ⚠️ **`inParkingTime`·`outParkingTime`은 서버 문자열을 그대로 출력한다.** 포맷 가공이
 * 없어 서버가 `2026-07-29 14:30:00`을 주면 그대로 보인다 (`parking.md` PK-Q7).
 *
 * ⚠️ 레거시는 한 필드를 그리며 `formatMinutes`를 최대 6번 부른다. 여기서는 한 번만
 * 계산한다 — 결과는 같다.
 */
const renderFieldValue = ({ card, key }: { card: MileageHistoryItem; key: MileageFieldKey }) => {
  const value = card[key]
  if (value === undefined) return '-'

  if (key === 'parkingMinutes' || key === 'useMileage') {
    const { hours, minutes } = formatMinutes(typeof value === 'number' ? value : undefined)

    if (!hours && !minutes) return '0분'
    if (!hours) return `${minutes}분`
    return `${hours}시간 ${minutes}분`
  }

  return value
}

/**
 * 마일리지 내역 (PK2). 레거시 `Mileage/MileageHistoryListView.vue`(144 LOC) 이식.
 *
 * 상단 블록(월 선택 + 카드 2개)과 목록이 `border-b-8`로 갈린다.
 *
 * ⚠️ **총 건수는 첫 페이지 응답 기준이다** (`pageable.totalElements`). 스크롤로 더 받아도
 * 숫자가 바뀌지 않는다 — `useInfiniteList`가 `pages[0]`에서만 `pageable`을 뽑는다.
 *
 * ⚠️ **월 선택 드로어에는 이번 달 포함 최근 3개월만 나온다.** 주차는
 * `availableYearmonths`를 넘기지 않아 `DrawerMonth`가 기본 목록을 만든다.
 *
 * ⚠️ **`outParkingTime`이 없으면 빨간 `미출차` 칩이 붙고 출차시간은 `-`가 된다.**
 *
 * ⚠️ **카드 테두리가 회색이다.** 레거시 `border-deep-glue-20`이 CSS를 만들지 않아
 * `border` 기본색만 적용된다. 대응 토큰을 몰라 현행 유지한다
 * (`broken-styles.md` §5 · B-Q2).
 */
export const MileageHistoryPage = () => {
  const {
    parkingMileageList,
    isParkingMileageListLoading,
    isParkingMileageListError,
    hasParkingMileageListNextPage,
    fetchParkingMileageListNextPage,
    selectedMonth,
    selectedMonthRange,
    changeMonth,
  } = useParkingMileageList()

  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      <div className="w-full shrink-0 border-b-8 border-b-defaults-secondary-background-secondary bg-base-b-white px-5 pt-[18px] pb-[29px]">
        <DrawerMonth selected={selectedMonth} hasNoPadding onChange={changeMonth} />
        <MileageCardMenus dateRange={selectedMonthRange} className="pt-3" />
      </div>

      <div className="flex min-h-0 w-full flex-1 flex-col bg-base-b-white">
        <div className="shrink-0 px-6 py-4 pretendard-16SemiBold text-defaults-primary-text-primary">
          총 {parkingMileageList?.pageable.totalElements ?? 0}건
        </div>

        <div className="min-h-0 flex-1">
          <CardList
            list={parkingMileageList?.pages}
            isLoading={isParkingMileageListLoading}
            isError={isParkingMileageListError}
            errorMessage={PARKING_LIST_MESSAGE.mileageHistory.error}
            emptyMessage={PARKING_LIST_MESSAGE.mileageHistory.empty}
            hasNextPage={hasParkingMileageListNextPage}
            fetchNextPage={fetchParkingMileageListNextPage}
          >
            {parkingMileageList?.pages.map((card) => {
              return (
                <li
                  key={card.uuid}
                  className="border-deep-glue-20 flex flex-col gap-3 self-stretch rounded-xl border p-3 shadow-md"
                >
                  <div className="w-full border-b border-b-defaults-tertiary-border-tertiary pb-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="pretendard-18SemiBold text-defaults-primary-text-primary">
                        {card.carNum}
                      </span>
                      {!card.outParkingTime && (
                        <ChipBase color="red" className="pretendard-12Regular">
                          미출차
                        </ChipBase>
                      )}
                    </div>
                  </div>

                  <ul className="flex w-full flex-col items-start gap-2.5">
                    {CARD_ITEM_FIELD.mileageHistory.map((item) => {
                      return (
                        <li
                          key={item.key}
                          className="flex w-full items-start justify-between gap-2"
                        >
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
                </li>
              )
            })}
            {/* 목록 끝 여백. 레거시가 슬롯 마지막에 넣는 빈 블록이다 */}
            <div className="p-2" />
          </CardList>
        </div>
      </div>
    </div>
  )
}
