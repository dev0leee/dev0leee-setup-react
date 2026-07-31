import { useState } from 'react'

import { CarManagementList } from '@/features/parking/components/carManagement/CarManagementList'
import type { CarListItem } from '@/features/parking/types/parking'
import { DrawerBase } from '@/shared/components/common/DrawerBase'

/**
 * `즐겨찾기 차량 불러오기` 버튼 + 드로어. 레거시 `BookmarkCarSelectorButton.vue`(49 LOC).
 *
 * **PK6(항상허용 등록) · PK12·PK13(방문예약 등록)에만 있다.** 즐겨찾기 등록·수정에는 없다.
 *
 * ⚠️ **차량번호와 연락처만 채운다.** 별칭·메모·방문목적은 건드리지 않는다.
 *
 * ⚠️ **드로어를 열면 항상허용 목록 캐시가 지워진다** — 안에 있는 `CarManagementList`가
 * 두 목록 훅을 모두 호출하기 때문이다 (`useResetListCacheOnMount` 주석).
 */
export const BookmarkCarSelectorButton = ({
  onSelectCard,
}: {
  onSelectCard: (card: CarListItem) => void
}) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        className="flex h-6 items-center justify-center gap-1 rounded-full border border-navy-default-border-navy bg-base-b-white px-3 pretendard-12SemiBold text-navy-default-text-navy"
        onClick={() => {
          setIsDrawerOpen(true)
        }}
      >
        <img src="/assets/icons/Star.svg" alt="별 아이콘" />
        <span>즐겨찾기 차량 불러오기</span>
      </button>

      <DrawerBase
        open={isDrawerOpen}
        title="즐겨찾기 차량 불러오기"
        hasCloseButton
        onClose={() => {
          setIsDrawerOpen(false)
        }}
      >
        <div className="h-full w-full pt-2.5">
          <div className="h-full max-h-[70vh] min-h-72 w-full overflow-auto">
            <CarManagementList
              isDrawer
              onSelectCard={(card) => {
                onSelectCard(card)
                setIsDrawerOpen(false)
              }}
            />
          </div>
        </div>
      </DrawerBase>
    </>
  )
}
