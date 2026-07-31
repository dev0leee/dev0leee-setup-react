import { useState } from 'react'

import { LIST_ITEM_FIELD, MEAL_TYPE } from '@/features/aptMall/constants/aptMall'
import { formatOrderDateTime } from '@/features/aptMall/lib/aptMallOrder'
import { usePostAptMallOrder } from '@/features/aptMall/queries/useAptMall'
import { useAptMallFormStore } from '@/features/aptMall/stores/aptMallFormStore'
import { APT_MALL_ORDER_TYPE } from '@/features/aptMall/types/aptMall'
import { ButtonBase } from '@/shared/components/common/ButtonBase'
import { ModalButton } from '@/shared/components/common/ModalButton'

/**
 * 예약 확인 (AM7). 레거시 `AptMallFormOrderConfirm.vue`.
 *
 * ⚠️ **`포장`이면 `인원 수` 행을 뺀다** — 목록 카드는 빼지 않는다(비대칭).
 * ⚠️ **`이용예정 일자`가 `2026-08-01 (토) 08:00`이다** — 목록·상세는 요일이 없다.
 * ⚠️ **수량이 0인 메뉴는 목록에 나오지 않는다.**
 * ⚠️ **요청사항은 검증 없이 `maxlength=200`만 걸려 있다.**
 *
 * ✅ **실패 모달이 매번 뜬다.** 레거시는 `isError`의 `false → true` 전이를 `watch`해서
 * 띄웠기 때문에 **연속 실패 시 두 번째부터는 뜨지 않았다** (`apt-mall.md` AM-Q20).
 */
export const StepConfirm = ({
  aptMallUuid,
  onPrevStep,
  onNextStep,
}: {
  aptMallUuid: string | undefined
  onPrevStep: () => void
  onNextStep: () => void
}) => {
  const aptMallFormData = useAptMallFormStore((state) => {
    return state.aptMallFormData
  })

  const [orderNote, setOrderNote] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const { postAptMallOrderMutation, isPostAptMallOrderPending } = usePostAptMallOrder({
    aptMallUuid,
    onCreated: onNextStep,
    onFailed: setErrorMessage,
  })

  const isVisit = aptMallFormData.selectedType?.key === APT_MALL_ORDER_TYPE.VISIT

  const fields = isVisit
    ? LIST_ITEM_FIELD
    : LIST_ITEM_FIELD.filter((field) => {
        return field.key !== 'personCount'
      })

  const renderFieldValue = (key: (typeof LIST_ITEM_FIELD)[number]['key']): string => {
    if (key === 'aptMallOrderType') {
      return MEAL_TYPE[aptMallFormData.selectedType?.key ?? APT_MALL_ORDER_TYPE.VISIT]
    }
    if (key === 'orderDateTime') return formatOrderDateTime(aptMallFormData)

    return `${aptMallFormData.personCount}명`
  }

  return (
    <div>
      <div className="px-5 py-6">
        <ul className="flex flex-col gap-5">
          {fields.map((field) => {
            return (
              <li key={field.key} className="flex justify-between gap-2">
                <span className="pretendard-16SemiBold whitespace-nowrap">{field.label}</span>
                <span className="pretendard-16Regular text-defaults-primary-text-primary">
                  {renderFieldValue(field.key)}
                </span>
              </li>
            )
          })}

          <li className="flex flex-col gap-2">
            <span className="pretendard-16SemiBold whitespace-nowrap">메뉴</span>
            <ul className="space-y-2">
              {(aptMallFormData.menu ?? [])
                .filter((item) => {
                  return item.count > 0
                })
                .map((item) => {
                  return (
                    <li
                      key={item.uuid}
                      className="flex justify-between pretendard-16Regular text-defaults-primary-text-primary"
                    >
                      <span>
                        {item.name} x {item.count}
                      </span>
                      {/* ⚠️ 줄 합계다 — AM3 상세는 곱하지 않는다 (AM-Q10) */}
                      <span>{(item.count * item.price).toLocaleString()}원</span>
                    </li>
                  )
                })}
            </ul>
          </li>

          <li className="flex flex-col gap-2">
            <span className="pretendard-16SemiBold whitespace-nowrap">고객 요청사항</span>
            <textarea
              placeholder="요청사항이 있다면 작성해주세요."
              className="rounded-[4px] border border-defaults-tertiary-border-tertiary bg-defaults-secondary-background-secondary px-3 py-2.5 placeholder:text-defaults-tertiary-text-tertiary"
              rows={5}
              maxLength={200}
              value={orderNote}
              onChange={(event) => {
                setOrderNote(event.target.value)
              }}
            />
          </li>

          <li className="flex flex-col gap-3">
            <span className="pretendard-16SemiBold whitespace-nowrap">예약 유의사항</span>
            <div className="space-y-2 pretendard-13Regular">
              <p>· 방문이 어려우실 경우 관리사무실로 사전에 연락주시기 바랍니다.</p>
            </div>
          </li>

          <li className="flex justify-between gap-3 rounded-lg bg-defaults-secondary-background-mono p-4">
            <div className="flex items-center gap-2">
              <span className="pretendard-15Medium">총 결제금액</span>
              <span className="pretendard-13Medium text-defaults-secondary-text-secondary">
                *관리비 후불 청구
              </span>
            </div>
            <div className="pretendard-15Medium">
              {(aptMallFormData.totalPrice ?? 0).toLocaleString()}원
            </div>
          </li>
        </ul>
      </div>

      <div className="flex w-full items-center gap-3 px-5 py-1">
        <ButtonBase
          type="button"
          hasOutline
          roundType="rounded"
          color="defaults-secondary"
          onClick={onPrevStep}
        >
          이전
        </ButtonBase>
        <ButtonBase
          type="button"
          roundType="rounded"
          color="brand"
          disabled={isPostAptMallOrderPending}
          onClick={() => {
            postAptMallOrderMutation(orderNote || undefined)
          }}
        >
          예약하기
        </ButtonBase>
      </div>

      <ModalButton
        open={errorMessage !== null}
        onClose={() => {
          setErrorMessage(null)
        }}
        buttonType="single"
        modalData={{ title: '예약 실패', description: errorMessage ?? '', firstButton: '확인' }}
        onFirstClick={() => {
          setErrorMessage(null)
        }}
      />
    </div>
  )
}
