import { useState } from 'react'

import {
  MOVING_HOUSE_DETAIL_ADDITIONAL_CONTENT_FIELD,
  MOVING_HOUSE_DETAIL_MODAL_DATA,
  MOVING_HOUSE_MESSAGE,
} from '@/features/movingHouse/constants/movingHouse'
import { useMovingHouseSetting } from '@/features/movingHouse/queries/useMovingHouse'
import {
  MOVING_HOUSE_STATUS,
  type MovingHouseDetailData,
} from '@/features/movingHouse/types/movingHouse'
import { ModalButton } from '@/shared/components/common/ModalButton'
import { copyValue } from '@/shared/utils/copyValue'

/**
 * `취소 사유` | `무통장 입금 정보` 섹션. 레거시 `MovingHouseDetailAdditionalContent.vue`.
 *
 * **세 갈래다.** 취소된 예약이면 취소 사유, 사용료 단지면 입금 정보, 그 밖이면
 * **아무것도 그리지 않는다**(빈 `<section>`).
 *
 * ⚠️ **계좌 복사는 토스트가 아니라 모달이다** (`복사가 완료되었습니다`).
 * `copyValue`는 폴백 경로에서 **복사에 실패해도 콜백을 부른다** — 웹뷰 호환을 위한
 * 의도적 관용이고 레거시 그대로다.
 *
 * ⚠️ **MH4에서는 상세가 없어 `CANCELED` 분기를 타지 않는다** — 의도된 동작이다.
 */
export const MovingHouseDepositInfo = ({ detail }: { detail?: MovingHouseDetailData }) => {
  const { movingHouseSetting } = useMovingHouseSetting()
  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false)

  const isCanceled = detail?.moveReservationStatus === MOVING_HOUSE_STATUS.CANCELED

  return (
    <section className="bg-base-b-white">
      {isCanceled && (
        <div className="flex flex-col gap-5 px-5 pt-[18px] pb-[30px]">
          <h2 className="pretendard-16SemiBold">{MOVING_HOUSE_MESSAGE.cancelReasonTitle}</h2>
          <p className="pretendard-14Regular leading-4 text-defaults-secondary-text-secondary">
            {detail.cancelReason || '-'}
          </p>
        </div>
      )}

      {!isCanceled && movingHouseSetting?.chargeFlag && (
        <div className="flex flex-col gap-5 px-5 pt-[18px] pb-[30px]">
          <h2 className="pretendard-16SemiBold">{MOVING_HOUSE_MESSAGE.depositTitle}</h2>
          <ol className="flex flex-col gap-4">
            {MOVING_HOUSE_DETAIL_ADDITIONAL_CONTENT_FIELD.map((field) => {
              const value = movingHouseSetting[field.key]

              return (
                <li key={field.key} className="flex min-h-5 justify-between gap-6">
                  <span className="pretendard-14SemiBold whitespace-nowrap text-defaults-tertiary-text-tertiary">
                    {field.label}
                  </span>
                  {field.key === 'depositAccount' ? (
                    <div className="flex items-center gap-3 pretendard-14Regular text-defaults-primary-text-primary">
                      {value || '-'}
                      <button
                        type="button"
                        className="flex items-center gap-1"
                        onClick={() => {
                          void copyValue({
                            value,
                            onCopied: () => {
                              setIsCopyModalOpen(true)
                            },
                          })
                        }}
                      >
                        <img src="/assets/icons/CopyClipboard.svg" alt="복사 아이콘" />
                        <span className="pretendard-14Regular text-defaults-primary-text-primary">
                          복사
                        </span>
                      </button>
                    </div>
                  ) : (
                    <span className="pretendard-14Regular text-defaults-primary-text-primary">
                      {value || '-'}
                    </span>
                  )}
                </li>
              )
            })}
          </ol>
        </div>
      )}

      <ModalButton
        open={isCopyModalOpen}
        onClose={() => {
          setIsCopyModalOpen(false)
        }}
        buttonType="single"
        modalData={MOVING_HOUSE_DETAIL_MODAL_DATA.COPIED}
        onFirstClick={() => {
          setIsCopyModalOpen(false)
        }}
      />
    </section>
  )
}
