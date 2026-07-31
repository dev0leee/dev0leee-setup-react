import { useState } from 'react'
import { useParams } from 'react-router-dom'

import { ReservationAgainButton } from '@/features/parking/components/reservation/ReservationAgainButton'
import { ReservationStatusChip } from '@/features/parking/components/reservation/ReservationStatusChip'
import {
  CAR_INFO_DELETE_MODAL_DATA,
  RESERVATION_CAR_DETAIL_FIELD,
  RESERVATION_DETAIL_ERROR_TEXT,
} from '@/features/parking/constants/parking'
import { useWallPadContent } from '@/features/parking/hooks/useWallPadContent'
import {
  useDeleteReservedCar,
  useReservationCarDetail,
} from '@/features/parking/queries/useReservationCar'
import type { ReservationCarDetail } from '@/features/parking/types/parking'
import { ModalButton } from '@/shared/components/common/ModalButton'
import { SkeletonBase } from '@/shared/components/common/SkeletonBase'
import { SpinnerCircle } from '@/shared/components/common/SpinnerCircle'
import { TextEmpty } from '@/shared/components/common/TextEmpty'
import { AppBar } from '@/shared/components/layouts/AppBar'
import { sanitizeHtml } from '@/shared/lib/sanitizeHtml'
import { formatHtmlText } from '@/shared/utils/formatHtmlText'
import { formatPhone } from '@/shared/utils/formatPhone'

const SKELETON_ROW_INDEXES = [0, 1, 2, 3, 4, 5, 6, 7]

/**
 * 예약 기간 표기. 목록(PK11)과 같은 규칙이다.
 * 레거시는 `?.`가 불완전했지만 `v-else` 안이라 실제 문제는 없었다 — 안전하게 옮겼다.
 */
const renderScheduledDate = (detail: ReservationCarDetail) => {
  const inDate = detail.inParkingScheduledDate?.replaceAll('-', '/')
  const outDate = detail.outParkingScheduledDate?.replaceAll('-', '/')

  if (detail.inParkingScheduledDate === detail.outParkingScheduledDate) {
    return inDate?.slice(5)
  }

  return `${inDate?.slice(5) ?? ''} ~ ${outDate?.slice(5) ?? ''}`
}

/**
 * 방문예약 상세 (PK14). 레거시 `ReservationCarDetailView.vue`(192 LOC) 이식.
 *
 * **AppBar를 화면 안에서 그린다** — 우측에 `삭제` 버튼을 넣어야 해서다(라우트 meta는
 * `showAppBar:false`).
 *
 * ⚠️ **`memo`만 HTML로 렌더된다.** 다른 필드는 텍스트 보간이라 `formatHtmlText`가 만든
 * `<br/>`이 **글자 그대로** 보인다. 메모만 줄바꿈이 살아난다 (`deferred.md`).
 *
 * ⚠️ **본문이 `mt-12 h-[calc(100%-50px)]`이다.** AppBar는 48px인데 50px을 뺀다 — 2px
 * 어긋나 있지만 레거시 그대로다.
 *
 * ⚠️ 하단 재신청 버튼은 목록의 것과 **같은 컴포넌트인데 모양이 다르다**(브랜드색·2xl).
 */
export const ReservationDetailPage = () => {
  const { uuid: parkingUuid } = useParams()
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

  const { hasWallPadUI } = useWallPadContent()
  const { reservationCarDetail, isReservationCarDetailLoading, isReservationCarDetailError } =
    useReservationCarDetail({ parkingUuid })
  const { deleteReservedCarMutation, isDeleteReservedCarPending } = useDeleteReservedCar()

  return (
    <div className="h-full w-full overflow-auto">
      <AppBar title="방문예약 차량 상세">
        <button
          type="button"
          disabled={isDeleteReservedCarPending}
          className="flex justify-center"
          onClick={() => {
            setIsDeleteModalOpen(true)
          }}
        >
          {isDeleteReservedCarPending ? <SpinnerCircle color="black" /> : <span>삭제</span>}
        </button>
      </AppBar>

      <div className="mt-12 h-[calc(100%-50px)] w-full p-5">
        {isReservationCarDetailLoading && (
          <ul className="space-y-5">
            {SKELETON_ROW_INDEXES.map((index) => {
              return (
                <li key={index} className="flex justify-between gap-5">
                  <SkeletonBase className="h-6 w-32 rounded" />
                  <SkeletonBase className="h-6 w-40 rounded" />
                </li>
              )
            })}
          </ul>
        )}

        {!isReservationCarDetailLoading && isReservationCarDetailError && (
          <div className="flex h-full w-full items-center justify-center text-center">
            <TextEmpty>
              {RESERVATION_DETAIL_ERROR_TEXT[0]}
              <br />
              {RESERVATION_DETAIL_ERROR_TEXT[1]}
            </TextEmpty>
          </div>
        )}

        {!isReservationCarDetailLoading && !isReservationCarDetailError && reservationCarDetail && (
          <div className="flex h-full w-full flex-col justify-between">
            <ul className="space-y-5">
              {RESERVATION_CAR_DETAIL_FIELD.map((item) => {
                return (
                  <li key={item.key} className="flex min-h-6 justify-between gap-5">
                    <span className="min-w-fit pretendard-15SemiBold text-defaults-primary-text-primary">
                      {item.label}
                    </span>

                    {item.key === 'phone' && (
                      <span className="pretendard-15Regular text-defaults-secondary-text-secondary">
                        {formatPhone({ phone: reservationCarDetail.phone ?? undefined }) || '-'}
                      </span>
                    )}

                    {item.key === 'inOutParkingScheduledDate' && (
                      <div className="flex items-center justify-end gap-2 text-defaults-secondary-text-secondary">
                        {renderScheduledDate(reservationCarDetail)}
                      </div>
                    )}

                    {item.key === 'inParkingFlag' && (
                      <div className="flex items-center justify-end gap-2">
                        <ReservationStatusChip
                          inParkingFlag={reservationCarDetail.inParkingFlag}
                          outParkingScheduledDate={reservationCarDetail.outParkingScheduledDate}
                        />
                      </div>
                    )}

                    {/* ⚠️ 메모만 HTML로 렌더된다 — 줄바꿈이 살아나는 유일한 필드다 */}
                    {item.key === 'memo' && (
                      <span
                        className="pretendard-15Regular text-defaults-secondary-text-secondary"
                        dangerouslySetInnerHTML={{
                          __html: sanitizeHtml({
                            html:
                              formatHtmlText({ text: reservationCarDetail.memo ?? undefined }) ||
                              '-',
                          }),
                        }}
                      />
                    )}

                    {item.key === 'carNum' && (
                      <span className="pretendard-15Regular text-defaults-secondary-text-secondary">
                        {formatHtmlText({ text: reservationCarDetail.carNum }) || '-'}
                      </span>
                    )}

                    {item.key === 'visitPurpose' && (
                      <span className="pretendard-15Regular text-defaults-secondary-text-secondary">
                        {formatHtmlText({ text: reservationCarDetail.visitPurpose ?? undefined }) ||
                          '-'}
                      </span>
                    )}
                  </li>
                )
              })}

              {hasWallPadUI && (
                <li className="flex min-h-6 items-start justify-between gap-5 self-stretch">
                  <span className="min-w-fit pretendard-15SemiBold text-defaults-primary-text-primary">
                    입출차 시 월패드 알림 여부
                  </span>
                  <span className="pretendard-15Regular text-defaults-secondary-text-secondary">
                    {reservationCarDetail.notificationFlag ? '예' : '아니오'}
                  </span>
                </li>
              )}
            </ul>

            <ReservationAgainButton uuid={parkingUuid ?? ''} isDetailPage />
          </div>
        )}
      </div>

      <ModalButton
        open={isDeleteModalOpen}
        buttonType="outline"
        modalData={CAR_INFO_DELETE_MODAL_DATA}
        onFirstClick={() => {
          setIsDeleteModalOpen(false)
        }}
        onSecondClick={() => {
          deleteReservedCarMutation({ reservationUuid: parkingUuid ?? '' })
          setIsDeleteModalOpen(false)
        }}
        onClose={() => {
          setIsDeleteModalOpen(false)
        }}
      />
    </div>
  )
}
