import { useState } from 'react'

import { MovingHouseDetailContainer } from '@/features/movingHouse/components/MovingHouseDetailContainer'
import {
  getMovingHouseCancelModalData,
  MOVING_HOUSE_MESSAGE,
} from '@/features/movingHouse/constants/movingHouse'
import {
  useDeleteMovingHouseReceipt,
  useMovingHouseDetail,
} from '@/features/movingHouse/queries/useMovingHouse'
import { MOVING_HOUSE_STATUS } from '@/features/movingHouse/types/movingHouse'
import { ButtonBase } from '@/shared/components/common/ButtonBase'
import { ModalButton } from '@/shared/components/common/ModalButton'
import { SpinnerCircle } from '@/shared/components/common/SpinnerCircle'

/**
 * 예약 상세 (MH2). 레거시 `MovingHouseDetailView.vue` 이식.
 *
 * **취소 버튼이 상태마다 다르게 동작한다.**
 *
 * | 상태        | 버튼          | 결과                                          |
 * | ----------- | ------------- | --------------------------------------------- |
 * | `WAITING`   | `예약취소`    | 2버튼 모달 → 실제 취소                        |
 * | `CONFIRMED` | `예약취소`    | 1버튼 안내 모달 — **실제로 취소되지 않는다**  |
 * | `CANCELED`  | **버튼 없음** | —                                             |
 *
 * ⚠️ **모달 내용은 상태가 정한다.** 화면은 버튼 배치(2개/1개)만 고른다.
 * ⚠️ **모달을 먼저 닫고 삭제를 시작한다** — 실패 시 에러 모달이 겹치지 않는다.
 * ⚠️ **취소 성공 토스트는 목록 화면에서 보인다** (뒤로 간 다음 띄운다).
 * ⚠️ **버튼 영역이 `fixed`가 아니다** — 문서 흐름 마지막의 `p-5`다.
 */
export const MovingHouseDetailPage = () => {
  const { movingHouseDetail, isMovingHouseDetailLoading } = useMovingHouseDetail()
  const { deleteMovingHouseReceiptMutation, isDeleteMovingHouseReceiptPending } =
    useDeleteMovingHouseReceipt()

  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false)

  const status = movingHouseDetail?.moveReservationStatus
  const isWaiting = status === MOVING_HOUSE_STATUS.WAITING

  return (
    <div className="h-full overflow-auto">
      <MovingHouseDetailContainer
        mode="detail"
        detail={movingHouseDetail}
        isLoading={isMovingHouseDetailLoading}
      />

      <div className="p-5">
        {status !== MOVING_HOUSE_STATUS.CANCELED && (
          <ButtonBase
            type="button"
            hasOutline
            roundType="rounded"
            color="alerts-error"
            disabled={isDeleteMovingHouseReceiptPending}
            className="flex justify-center"
            onClick={() => {
              setIsCancelModalOpen(true)
            }}
          >
            {isDeleteMovingHouseReceiptPending ? (
              <SpinnerCircle color="black" />
            ) : (
              MOVING_HOUSE_MESSAGE.cancelButton
            )}
          </ButtonBase>
        )}
      </div>

      <ModalButton
        open={isCancelModalOpen}
        onClose={() => {
          setIsCancelModalOpen(false)
        }}
        buttonType={isWaiting ? 'outline' : 'single'}
        modalData={getMovingHouseCancelModalData({ status })}
        onFirstClick={() => {
          setIsCancelModalOpen(false)
        }}
        onSecondClick={() => {
          // 모달을 먼저 닫고 요청한다 — 레거시 순서 그대로다
          setIsCancelModalOpen(false)
          deleteMovingHouseReceiptMutation()
        }}
      />
    </div>
  )
}
