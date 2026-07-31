import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { AptMallMyOrderListItem } from '@/features/aptMall/components/AptMallMyOrderListItem'
import { AptMallOrderDrawer } from '@/features/aptMall/components/form/AptMallOrderDrawer'
import { APT_MALL_MESSAGE } from '@/features/aptMall/constants/aptMall'
import { useAptMallMyOrderList } from '@/features/aptMall/queries/useAptMall'
import { ButtonBase } from '@/shared/components/common/ButtonBase'
import { SpinnerDots } from '@/shared/components/common/SpinnerDots'
import { TextEmpty } from '@/shared/components/common/TextEmpty'
import { aptMallMyOrderDetailPath } from '@/shared/constants/routes'
import { useInfiniteScrollPosition } from '@/shared/hooks/useInfiniteScrollPosition'
import { useIntersectionObserver } from '@/shared/hooks/useIntersectionObserver'

/**
 * 나의 예약 (AM2). 레거시 `AptMallMyOrderView.vue` + `AptMallMyOrderList.vue` 이식.
 *
 * ⚠️ **`예약하기` 버튼이 `fixed`인데 목록 여백이 `pb-10`(40px)뿐이다** — 버튼 높이가
 * `2xl`(약 60px)이라 **마지막 카드가 가린다.** 등가 이관이라 그대로 옮겼다.
 *
 * ⚠️ **에러 상태가 없다** — 조회에 실패해도 빈 목록으로 보인다.
 *
 * ⚠️ **예약 위저드는 라우트가 아니라 이 화면의 드로어다.** 위저드 중 뒤로가기를 누르면
 * 단계가 아니라 화면이 빠져나간다.
 */
export const AptMallMyOrderPage = () => {
  const navigate = useNavigate()
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  const {
    aptMallMyOrderList,
    totalElements,
    isAptMallMyOrderListLoading,
    hasAptMallMyOrderListNextPage,
    fetchAptMallMyOrderListNextPage,
  } = useAptMallMyOrderList()

  const { scrollContainerRef } = useInfiniteScrollPosition<HTMLUListElement>({
    rules: { moveFrom: '/detail', moveTo: '/aptMall/myOrder' },
  })

  const { targetRef, isIntersecting } = useIntersectionObserver<HTMLDivElement>()

  useEffect(() => {
    if (isIntersecting && hasAptMallMyOrderListNextPage) void fetchAptMallMyOrderListNextPage()
  }, [isIntersecting, hasAptMallMyOrderListNextPage, fetchAptMallMyOrderListNextPage])

  return (
    <div className="relative flex h-full flex-col bg-defaults-secondary-background-secondary">
      <div className="flex h-full w-full flex-col bg-defaults-secondary-background-secondary">
        {isAptMallMyOrderListLoading ? (
          <SpinnerDots />
        ) : aptMallMyOrderList.length > 0 ? (
          <>
            <div className="space-y-4 px-5 py-2 pretendard-16SemiBold text-defaults-primary-text-primary">
              총 {totalElements}건
            </div>
            <ul
              ref={scrollContainerRef}
              className="flex w-full flex-1 flex-col items-start gap-3 overflow-auto px-5 py-6 pb-10"
            >
              {aptMallMyOrderList.map((item) => {
                return (
                  <AptMallMyOrderListItem
                    key={item.aptMallOrderUuid}
                    info={item}
                    onClick={() => {
                      void navigate(
                        aptMallMyOrderDetailPath({ aptMallOrderUuid: item.aptMallOrderUuid }),
                      )
                    }}
                  />
                )
              })}
              <div ref={targetRef} className="w-full pt-4" />
            </ul>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <TextEmpty>{APT_MALL_MESSAGE.listEmpty}</TextEmpty>
          </div>
        )}
      </div>

      <div className="fixed right-0 bottom-0 left-0">
        <ButtonBase
          type="button"
          color="brand"
          roundType="square"
          size="2xl"
          onClick={() => {
            setIsDrawerOpen(true)
          }}
        >
          {APT_MALL_MESSAGE.reserveButton}
        </ButtonBase>
      </div>

      <AptMallOrderDrawer
        open={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false)
        }}
      />
    </div>
  )
}
