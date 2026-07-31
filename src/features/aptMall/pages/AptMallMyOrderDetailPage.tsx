import { useState } from 'react'

import {
  APT_MALL_MESSAGE,
  type AptMallOrderFieldKey,
  DETAIL_CANCEL_MODAL_DATA,
  DETAIL_PAGE_INFO_FIELD,
  MEAL_TYPE,
  STATUS_LIST,
} from '@/features/aptMall/constants/aptMall'
import {
  useAptMallMyOrderDetail,
  useDeleteAptMallMyOrder,
} from '@/features/aptMall/queries/useAptMall'
import {
  APT_MALL_ORDER_STATE,
  type AptMallMyOrderDetailData,
} from '@/features/aptMall/types/aptMall'
import { ButtonBase } from '@/shared/components/common/ButtonBase'
import { ChipBase } from '@/shared/components/common/ChipBase'
import { ModalButton } from '@/shared/components/common/ModalButton'
import { SpinnerCircle } from '@/shared/components/common/SpinnerCircle'
import { SpinnerDots } from '@/shared/components/common/SpinnerDots'
import { sanitizeHtml } from '@/shared/lib/sanitizeHtml'
import { formatIsoStringDate } from '@/shared/utils/formatIsoStringDate'

/**
 * 예약 상세 (AM3). 레거시 `AptMallMyOrderDetailView.vue` + 하위 5개 이식.
 *
 * ⚠️ **하단 버튼이 상태머신이다** — `RESERVATION`이면 `취소하기`(빨강 아웃라인),
 * 그 밖이면 `{취소일시} 취소 완료`(회색, 비활성)다. `CANCELED`가 아닌 미지의 상태에서는
 * 취소일시가 없어 **`undefined 취소 완료`** 로 보인다 (`apt-mall.md` AM-Q5).
 *
 * ✅ **취소 섹션 판정에 `?.`를 붙였다.** 레거시는 `findStatus.status`라 `STATUS_LIST`에
 * 없는 상태가 오면 **상세 화면이 통째로 크래시**했다 — 같은 파일의 정의부는 옵셔널인데
 * 사용부만 아니었다 (AM-Q5 · §7-8). 정상 데이터에서는 화면이 완전히 같다.
 *
 * ⚠️ **결제금액 합계가 `price`만 더한다** — 확인 단계(AM7)는 `count * price`로 곱한다.
 * 서버 `price`가 단가인지 줄 합계인지 확정되지 않아 레거시 계산을 그대로 뒀다 (AM-Q10).
 *
 * ⚠️ **`고객 요청사항`만 HTML로 렌더된다.** `formatHtmlText`를 거치지 않아 **개행이
 * 사라진다** (AM-Q11). 레거시 그대로다.
 *
 * ⚠️ **취소 실패 시 확인 모달이 닫히지 않는다** — 에러 모달이 그 위에 겹친다 (AM-Q12).
 */
const renderFieldValue = ({
  key,
  info,
}: {
  key: AptMallOrderFieldKey
  info: AptMallMyOrderDetailData
}): string => {
  const value = info[key]
  if (value === undefined) return '-'

  if (key === 'aptMallOrderType') return MEAL_TYPE[info.aptMallOrderType ?? 'VISIT']
  if (key === 'orderDateTime') {
    return formatIsoStringDate({ dateTimeString: info.orderDateTime }).dateTime() ?? '-'
  }
  if (key === 'personCount') return `${info.personCount}명`

  return `${value}`
}

export const AptMallMyOrderDetailPage = () => {
  const { aptMallMyOrderDetail, isAptMallMyOrderDetailLoading } = useAptMallMyOrderDetail()
  const { deleteAptMallMyOrderMutation, isDeleteAptMallMyOrderPending } = useDeleteAptMallMyOrder()

  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false)

  const info = aptMallMyOrderDetail
  const statusInfo = STATUS_LIST.find((status) => {
    return status.status === info?.aptMallOrderState
  })
  const isReservation = info?.aptMallOrderState === APT_MALL_ORDER_STATE.RESERVATION
  const menuList = info?.aptMallOrderMenuList ?? []

  const totalPrice = menuList.reduce((sum, item) => {
    return sum + (item.price ?? 0)
  }, 0)

  return (
    <div className="h-full space-y-3 overflow-auto pb-20">
      {isAptMallMyOrderDetailLoading ? (
        <SpinnerDots />
      ) : (
        <>
          <section className="flex justify-between border-b-8 border-defaults-secondary-background-secondary bg-base-b-white p-5">
            <div className="flex flex-col gap-2">
              <h2 className="pretendard-18SemiBold">{info?.aptMallName}</h2>
              <span className="pretendard-14Regular text-defaults-secondary-text-secondary">
                {formatIsoStringDate({ dateTimeString: info?.createdDate }).dateTime()} 등록
              </span>
            </div>
            <ChipBase color={statusInfo?.color} variant="fill" className="h-fit">
              {statusInfo?.label}
            </ChipBase>
          </section>

          <section>
            <div className="border-b bg-base-b-white p-5">
              <h3 className="pb-6 pretendard-17SemiBold">{APT_MALL_MESSAGE.infoTitle}</h3>
              <ul className="flex flex-col gap-3">
                {DETAIL_PAGE_INFO_FIELD.map((field) => {
                  const value = renderFieldValue({ key: field.key, info: info ?? {} })

                  return (
                    <li key={field.key} className="flex items-center justify-between gap-3">
                      <span className="flex h-5 items-center pretendard-15Medium">
                        {field.label}
                      </span>
                      {field.key === 'orderNote' ? (
                        <span
                          className="pretendard-14Regular text-defaults-primary-text-primary"
                          dangerouslySetInnerHTML={{ __html: sanitizeHtml({ html: value }) }}
                        />
                      ) : (
                        <span className="pretendard-14Regular text-defaults-primary-text-primary">
                          {value}
                        </span>
                      )}
                    </li>
                  )
                })}
              </ul>
            </div>

            <div className="bg-base-b-white p-5">
              <h3 className="pb-6 pretendard-17SemiBold">{APT_MALL_MESSAGE.paymentTitle}</h3>
              <ol className="mb-3 flex flex-col gap-3">
                {menuList.map((item, index) => {
                  return (
                    <li
                      key={`${item.menuName}-${index}`}
                      className="flex items-center justify-between gap-3"
                    >
                      <span className="flex h-5 items-center pretendard-15Medium">
                        {item.menuName} x {item.count}
                      </span>
                      <span className="flex h-5 items-center pretendard-14Regular text-defaults-primary-text-primary">
                        {Number(item.price).toLocaleString()}원
                      </span>
                    </li>
                  )
                })}
              </ol>
              <div className="flex justify-between pretendard-15SemiBold">
                <span className="flex h-5 items-center">{APT_MALL_MESSAGE.totalPrice}</span>
                <span className="flex h-5 items-center">
                  {Number(totalPrice).toLocaleString()}원
                </span>
              </div>
            </div>

            {statusInfo?.status === APT_MALL_ORDER_STATE.CANCELED && (
              <ul className="space-y-3 border-t bg-base-b-white p-5">
                <li className="flex w-full justify-between">
                  <span className="pretendard-15Medium">{APT_MALL_MESSAGE.canceledAt}</span>
                  <span className="pretendard-15Regular text-defaults-primary-text-primary">
                    {formatIsoStringDate({ dateTimeString: info?.canceledDateTime }).dateTime()}
                  </span>
                </li>
                <li className="flex w-full justify-between">
                  <span className="pretendard-15Medium">{APT_MALL_MESSAGE.canceledReason}</span>
                  <span className="pretendard-15Regular text-defaults-primary-text-primary">
                    {info?.canceledReason}
                  </span>
                </li>
              </ul>
            )}
          </section>

          <div className="fixed right-0 bottom-0 left-0 z-[200] bg-defaults-primary-background-primary p-5">
            {isReservation ? (
              <ButtonBase
                type="button"
                hasOutline
                roundType="rounded"
                color="alerts-error"
                disabled={isDeleteAptMallMyOrderPending}
                className="flex justify-center gap-2"
                onClick={() => {
                  setIsCancelModalOpen(true)
                }}
              >
                {isDeleteAptMallMyOrderPending ? (
                  <SpinnerCircle color="black" />
                ) : (
                  APT_MALL_MESSAGE.cancelButton
                )}
              </ButtonBase>
            ) : (
              <ButtonBase
                type="button"
                hasOutline
                roundType="rounded"
                color="defaults-secondary"
                disabled
              >
                {`${formatIsoStringDate({ dateTimeString: info?.canceledDateTime }).dateTime()} ${APT_MALL_MESSAGE.cancelDone}`}
              </ButtonBase>
            )}
          </div>
        </>
      )}

      <ModalButton
        open={isCancelModalOpen}
        onClose={() => {
          setIsCancelModalOpen(false)
        }}
        buttonType="outline"
        modalData={DETAIL_CANCEL_MODAL_DATA}
        onFirstClick={() => {
          setIsCancelModalOpen(false)
        }}
        onSecondClick={() => {
          if (!info?.aptMallOrderUuid) return

          // ⚠️ 레거시는 성공한 뒤에야 모달을 닫는다 — 실패하면 확인 모달이 남고
          // 그 위에 에러 모달이 겹친다 (AM-Q12). 그 순서를 그대로 옮겼다
          deleteAptMallMyOrderMutation(info.aptMallOrderUuid, {
            onSuccess: () => {
              setIsCancelModalOpen(false)
            },
          })
        }}
      />
    </div>
  )
}
