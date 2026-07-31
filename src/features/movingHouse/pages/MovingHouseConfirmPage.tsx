import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { MovingHouseDetailContainer } from '@/features/movingHouse/components/MovingHouseDetailContainer'
import {
  MOVING_HOUSE_DETAIL_MODAL_DATA,
  MOVING_HOUSE_MESSAGE,
} from '@/features/movingHouse/constants/movingHouse'
import {
  useMovingHouseSetting,
  usePostMovingHouse,
} from '@/features/movingHouse/queries/useMovingHouse'
import { useMovingHouseFormStore } from '@/features/movingHouse/stores/movingHouseFormStore'
import { ButtonBase } from '@/shared/components/common/ButtonBase'
import { ModalButton } from '@/shared/components/common/ModalButton'
import { SpinnerCircle } from '@/shared/components/common/SpinnerCircle'

/**
 * 예약 등록 확인 (MH4). 레거시 `MovingHouseWriteConfirmView.vue` 이식.
 *
 * MH2와 **같은 본문 컴포넌트**를 쓰고 데이터 출처만 스토어로 바뀐다.
 *
 * ⚠️ **완료 모달의 `확인`이 2단계 뒤로 간다** (`confirm` → `write` → `list`).
 * 히스토리 깊이를 가정한 코드라 MH4를 직접 열면 앱 밖으로 나간다 — 레거시 그대로다
 * (`moving-house.md` MH-Q15 · `deferred.md` D-97).
 *
 * ⚠️ **새로고침하면 폼 스토어가 비어 전 필드가 `-`로 보인다.** 그 상태에서 `예약확정`은
 * 아무 일도 하지 않는다 — 레거시는 `undefined`를 구조분해해 **TypeError**를 냈다.
 * 화면에 보이는 결과(아무 반응 없음)를 택했다.
 *
 * ⚠️ **완료 모달 문구가 `chargeFlag`로 갈린다** — 입금 안내 3줄 vs 2줄.
 */
export const MovingHouseConfirmPage = () => {
  const navigate = useNavigate()

  const movingHouseFormData = useMovingHouseFormStore((state) => {
    return state.movingHouseFormData
  })

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false)

  const { movingHouseSetting, isMovingHouseSettingLoading } = useMovingHouseSetting()
  const { postMovingHouseMutation, isPostMovingHousePending } = usePostMovingHouse({
    onCreated: () => {
      setIsConfirmModalOpen(true)
    },
  })

  return (
    <div className="h-full overflow-auto">
      <MovingHouseDetailContainer mode="confirm" form={movingHouseFormData} />

      <div className="p-5">
        <ButtonBase
          type="button"
          roundType="rounded"
          color="brand"
          disabled={isPostMovingHousePending || isMovingHouseSettingLoading}
          className="flex justify-center"
          onClick={() => {
            if (!movingHouseFormData) return

            postMovingHouseMutation(movingHouseFormData)
          }}
        >
          {isPostMovingHousePending ? (
            <SpinnerCircle color="white" />
          ) : (
            MOVING_HOUSE_MESSAGE.confirmButton
          )}
        </ButtonBase>
      </div>

      <ModalButton
        open={isConfirmModalOpen}
        onClose={() => {
          setIsConfirmModalOpen(false)
          void navigate(-2)
        }}
        buttonType="single"
        modalData={
          movingHouseSetting?.chargeFlag
            ? MOVING_HOUSE_DETAIL_MODAL_DATA.CREATED_USED_FEE
            : MOVING_HOUSE_DETAIL_MODAL_DATA.CREATED_NONE_FEE
        }
        onFirstClick={() => {
          setIsConfirmModalOpen(false)
          // confirm → write → list. 히스토리 깊이를 가정한 레거시 코드 그대로다
          void navigate(-2)
        }}
      />
    </div>
  )
}
