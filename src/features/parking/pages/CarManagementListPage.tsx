import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { CarManagementList } from '@/features/parking/components/carManagement/CarManagementList'
import {
  CAR_INFO_DELETE_MODAL_DATA,
  CAR_MANAGEMENT_DRAWER_LABEL,
  CAR_MANAGEMENT_TYPE,
} from '@/features/parking/constants/parking'
import { useCarManagementType } from '@/features/parking/hooks/useCarManagementType'
import {
  useDeleteAlwaysAllowCar,
  useDeleteBookmarkCar,
} from '@/features/parking/queries/useCarMutations'
import type { CarListItem } from '@/features/parking/types/parking'
import { ButtonBase } from '@/shared/components/common/ButtonBase'
import { DrawerBase } from '@/shared/components/common/DrawerBase'
import { ModalButton } from '@/shared/components/common/ModalButton'
import { PARKING_CAR_MANAGEMENT_BASE } from '@/shared/constants/routes'

/**
 * 즐겨찾기 / 항상허용 차량 목록 (PK3·PK4).
 * 레거시 `CarManagementListView.vue`(119 LOC) 이식.
 *
 * **두 화면이 한 컴포넌트다** — 경로에 `alwaysAllow`가 있는지로 갈린다.
 *
 * | 구분          | PK3 즐겨찾기        | PK4 항상허용     |
 * | ------------- | ------------------- | ---------------- |
 * | 카드 필드     | 별칭 · 연락처       | 연락처 · 메모    |
 * | 별 아이콘     | ✅                  | ❌               |
 * | 월패드 칩     | ❌                  | ✅ (구독 단지)   |
 * | 드로어 `수정` | ✅                  | ❌ **없다**(R-1) |
 *
 * ⚠️ **항상허용에는 수정이 없다.** 라우트도 API도 없다. 만들지 않는다.
 *
 * ⚠️ **삭제해도 화면 이동이 없다.** 토스트가 뜨고 목록이 갱신될 뿐이다.
 *
 * ⚠️ 레거시의 `isDeleted` ref는 설정만 되고 **어디서도 읽지 않는다.** 옮기지 않았다.
 */
export const CarManagementListPage = () => {
  const navigate = useNavigate()
  const { carManagementType } = useCarManagementType()

  const [selectedCard, setSelectedCard] = useState<CarListItem | null>(null)
  const [isMoreDrawerOpen, setIsMoreDrawerOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

  const { deleteBookmarkCarMutation, isDeleteBookmarkCarPending } = useDeleteBookmarkCar()
  const { deleteAlwaysAllowCarMutation, isDeleteAlwaysAllowCarPending } = useDeleteAlwaysAllowCar()

  const isBookmark = carManagementType.key === CAR_MANAGEMENT_TYPE.BOOKMARK.key
  const carManagementBase = `${PARKING_CAR_MANAGEMENT_BASE}/${carManagementType.key}`

  const handleDeleteConfirm = () => {
    setIsDeleteModalOpen(false)
    if (!selectedCard) return

    // 레거시가 mutation마다 pending 가드를 둔다 — 모달이 닫히기 전 연타를 막는다
    if (isBookmark) {
      if (isDeleteBookmarkCarPending) return
      deleteBookmarkCarMutation({ bookmarkUuid: selectedCard.uuid })
      return
    }

    if (isDeleteAlwaysAllowCarPending) return
    deleteAlwaysAllowCarMutation({ alwaysAllowUuid: selectedCard.uuid })
  }

  return (
    <div className="h-full w-full overflow-auto">
      <CarManagementList
        onSelectCard={(card) => {
          setSelectedCard(card)
          setIsMoreDrawerOpen(true)
        }}
      />

      <DrawerBase
        open={isMoreDrawerOpen}
        onClose={() => {
          setIsMoreDrawerOpen(false)
        }}
      >
        <div className="flex w-full flex-col items-start self-stretch px-5 py-0">
          {isBookmark && (
            <button
              type="button"
              className="flex items-center justify-center self-stretch border-b border-b-defaults-tertiary-border-tertiary bg-base-b-white p-4 pretendard-16Regular text-defaults-primary-text-primary"
              onClick={() => {
                // 카드 정보를 통째로 넘긴다 — 수정 폼의 유일한 초기값 출처다
                void navigate(`${carManagementBase}/edit/${selectedCard?.uuid ?? ''}`, {
                  state: { carInfo: selectedCard },
                })
              }}
            >
              {CAR_MANAGEMENT_DRAWER_LABEL.EDIT}
            </button>
          )}
          <button
            type="button"
            className="flex items-center justify-center self-stretch bg-base-b-white p-4 pretendard-16Regular text-alerts-error-text-error"
            onClick={() => {
              setIsMoreDrawerOpen(false)
              setIsDeleteModalOpen(true)
            }}
          >
            {CAR_MANAGEMENT_DRAWER_LABEL.DELETE}
          </button>
        </div>
      </DrawerBase>

      <ButtonBase
        className="fixed bottom-0 left-0"
        color="brand"
        size="2xl"
        roundType="square"
        onClick={() => {
          void navigate(`${carManagementBase}/add`)
        }}
      >
        + 등록하기
      </ButtonBase>

      <ModalButton
        open={isDeleteModalOpen}
        buttonType="outline"
        modalData={CAR_INFO_DELETE_MODAL_DATA}
        onFirstClick={() => {
          setIsDeleteModalOpen(false)
        }}
        onSecondClick={handleDeleteConfirm}
        onClose={() => {
          setIsDeleteModalOpen(false)
        }}
      />
    </div>
  )
}
