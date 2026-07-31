import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { env } from '@/config/env'
import {
  CAR_TYPE_INFO,
  IN_OUT_DETAIL_ERROR_TEXT,
  IN_OUT_HISTORY_DETAIL_FIELD,
  type InOutDetailFieldKey,
  NO_CAR_IMAGE_TEXT,
  PARKING_REJECT_MODAL_DATA,
} from '@/features/parking/constants/parking'
import { useInOutCarDetail } from '@/features/parking/queries/useInOutCar'
import { CAR_TYPE_KEY, type InOutCarDetail } from '@/features/parking/types/parking'
import { ButtonBase } from '@/shared/components/common/ButtonBase'
import { ChipBase } from '@/shared/components/common/ChipBase'
import { ModalButton } from '@/shared/components/common/ModalButton'
import { SkeletonBase } from '@/shared/components/common/SkeletonBase'
import { TextEmpty } from '@/shared/components/common/TextEmpty'
import { PARKING_REJECT_BASE } from '@/shared/constants/routes'
import { formatMinutes } from '@/shared/utils/formatMinutes'
import { formatPhone } from '@/shared/utils/formatPhone'

const SKELETON_FIELD_INDEXES = [0, 1, 2, 3, 4, 5, 6]

/**
 * 총 주차시간.
 *
 * ⚠️ **0이면 `-`다.** 목록(PK8)은 같은 값을 `0분`으로 쓴다 — 화면 간 표기가 다르고
 * 레거시 그대로다 (`deferred.md` 「오타·표기」).
 */
const renderParkingMinutes = (value: number | null | undefined) => {
  const { hours, minutes } = formatMinutes(value ?? undefined)

  if (!hours && !minutes) return '-'
  if (!hours) return `${minutes}분`
  return `${hours}시간 ${minutes}분`
}

/** 입차·출차 사진 한 칸. 없으면 비율이 2:1에서 16:9로 **바뀐다**(레거시 그대로) */
const CarImage = ({
  label,
  chipColor,
  imageUrl,
  className,
}: {
  label: string
  chipColor: 'green' | 'blue'
  imageUrl: string | null | undefined
  className?: string
}) => {
  return (
    <div className={className}>
      <ChipBase color={chipColor} variant="fill">
        {label}
      </ChipBase>
      {imageUrl ? (
        <div className="aspect-[2/1] w-full overflow-hidden rounded-lg">
          <img
            src={`${env.VITE_S3_BUCKET_URL_FILE}${imageUrl}`}
            alt={`${label} 사진`}
            className="h-full w-full object-cover"
          />
        </div>
      ) : (
        <div className="flex aspect-video w-full items-center justify-center rounded-lg bg-neutral-b-gray-200">
          <span className="pretendard-14Regular text-neutral-b-gray-500">{NO_CAR_IMAGE_TEXT}</span>
        </div>
      )}
    </div>
  )
}

/** 필드 1개의 값. `carType`은 칩이라 여기서 다루지 않는다 */
const renderDetailValue = ({
  detail,
  key,
}: {
  detail: InOutCarDetail
  key: Exclude<InOutDetailFieldKey, 'carType'>
}) => {
  if (key === 'phone') return formatPhone({ phone: detail.phone ?? undefined })
  if (key === 'parkingMinutes') return renderParkingMinutes(detail.parkingMinutes)

  return detail[key]
}

/**
 * 입출차 차량 상세 (PK9). 레거시 `InOutCarHistoryDetailView.vue`(226 LOC) 이식.
 *
 * **네이티브 푸시 딥링크의 도착지 2곳 중 하나다** (다른 하나는 공지 상세).
 *
 * ⚠️ **거부 영역은 미등록·일반방문이면서 아직 거부되지 않은 차량에만 뜬다.**
 *
 * ⚠️ **이미지가 없으면 비율이 2:1 → 16:9로 바뀐다.** 사진이 있는 칸과 없는 칸의 높이가
 * 달라진다 (`deferred.md` 「동작 의심」). 그대로 옮겼다.
 *
 * ⚠️ 레거시는 거부 영역을 `<ul>` 안에 `<div>`로 넣어 HTML 규격을 어긴다.
 * **`<li>`로 감싸 고쳤다** — 보이는 결과는 같다.
 *
 * ⚠️ 레거시의 `.car-image-section` 클래스는 정의가 없다. 옮기지 않았다.
 */
export const InOutHistoryDetailPage = () => {
  const navigate = useNavigate()
  const { uuid: parkingUuid } = useParams()
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false)

  const { inOutCarDetail, isInOutCarDetailLoading, isInOutCarDetailError } = useInOutCarDetail({
    parkingUuid,
  })

  const canRejectCar =
    (inOutCarDetail?.carType === CAR_TYPE_KEY.UNKNOWN ||
      inOutCarDetail?.carType === CAR_TYPE_KEY.GENERAL) &&
    !inOutCarDetail.rejectFlag

  return (
    <div className="h-full w-full overflow-auto">
      <div className="relative flex h-full w-full flex-col items-start justify-between p-5">
        {isInOutCarDetailLoading && (
          <div className="h-full w-full">
            <ul className="space-y-5 pb-12">
              {SKELETON_FIELD_INDEXES.map((index) => {
                return (
                  <li key={index} className="flex justify-between">
                    <SkeletonBase className="h-6 w-32 rounded" />
                    <SkeletonBase className="h-6 w-40 rounded" />
                  </li>
                )
              })}

              <li className="flex w-full flex-col gap-2 pt-4">
                <SkeletonBase className="mb-4 h-6 w-24 rounded" />
                <div className="flex flex-col gap-2">
                  <SkeletonBase className="h-6 w-12 rounded-full" />
                  <SkeletonBase className="aspect-[2/1] w-full rounded-lg" />
                </div>
                <div className="flex flex-col gap-2 pt-4">
                  <SkeletonBase className="h-6 w-12 rounded-full" />
                  <SkeletonBase className="aspect-[2/1] w-full rounded-lg" />
                </div>
              </li>
            </ul>
          </div>
        )}

        {!isInOutCarDetailLoading && isInOutCarDetailError && (
          <div className="flex h-full w-full items-center justify-center text-center">
            <TextEmpty>
              {IN_OUT_DETAIL_ERROR_TEXT[0]}
              <br />
              {IN_OUT_DETAIL_ERROR_TEXT[1]}
            </TextEmpty>
          </div>
        )}

        {!isInOutCarDetailLoading && !isInOutCarDetailError && inOutCarDetail && (
          <ul className="flex h-full w-full flex-col items-start gap-5 self-stretch pb-12">
            {IN_OUT_HISTORY_DETAIL_FIELD.map((item) => {
              return (
                <li
                  key={item.key}
                  className="flex min-h-6 items-start justify-between self-stretch"
                >
                  <span className="pretendard-15SemiBold text-defaults-primary-text-primary">
                    {item.label}
                  </span>

                  {item.key === 'carType' ? (
                    <div className="flex w-52 items-center justify-end gap-2">
                      <ChipBase
                        color={CAR_TYPE_INFO[inOutCarDetail.carType ?? '']?.chipColor}
                        variant="fill"
                      >
                        {CAR_TYPE_INFO[inOutCarDetail.carType ?? '']?.label}
                      </ChipBase>
                    </div>
                  ) : (
                    <span className="pretendard-15Regular text-defaults-secondary-text-secondary">
                      {renderDetailValue({ detail: inOutCarDetail, key: item.key }) || '-'}
                    </span>
                  )}
                </li>
              )
            })}

            {canRejectCar && (
              <li className="flex w-full flex-col gap-3">
                <span className="pretendard-15SemiBold text-defaults-primary-text-primary">
                  미확인 차량 거부
                </span>
                <ButtonBase
                  roundType="rounded"
                  color="brand"
                  onClick={() => {
                    setIsRejectModalOpen(true)
                  }}
                >
                  거부하기
                </ButtonBase>
              </li>
            )}

            <li className="flex w-full flex-col gap-2">
              <span className="mb-4 pretendard-15SemiBold text-defaults-primary-text-primary">
                차량 이미지
              </span>
              <div className="flex flex-col gap-4">
                <CarImage
                  label="입차"
                  chipColor="green"
                  imageUrl={inOutCarDetail.inParkingImageUrl}
                  className="flex flex-col gap-2"
                />
                {/* 마지막 블록만 `mb-20`이다 — 하단 여백 확보용 */}
                <CarImage
                  label="출차"
                  chipColor="blue"
                  imageUrl={inOutCarDetail.outParkingImageUrl}
                  className="mb-20 flex flex-col gap-2"
                />
              </div>
            </li>
          </ul>
        )}
      </div>

      <ModalButton
        open={isRejectModalOpen}
        buttonType="dual"
        modalData={PARKING_REJECT_MODAL_DATA}
        onFirstClick={() => {
          setIsRejectModalOpen(false)
        }}
        onSecondClick={() => {
          setIsRejectModalOpen(false)
          // 차량번호를 state로만 넘긴다 — PK10이 그것 말고는 알 방법이 없다
          void navigate(`${PARKING_REJECT_BASE}/${parkingUuid ?? ''}`, {
            state: { carNum: inOutCarDetail?.carNum },
          })
        }}
        onClose={() => {
          setIsRejectModalOpen(false)
        }}
      />
    </div>
  )
}
