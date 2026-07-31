import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { env } from '@/config/env'
import {
  getRepairNonEditableModalData,
  REPAIR_DETAIL_ANSWER_FIELD,
  REPAIR_DETAIL_CONTENT_FIELD,
  REPAIR_DETAIL_MODAL_DATA,
  REPAIR_MESSAGE,
  REPAIR_STATUS_LIST,
} from '@/features/repair/constants/repair'
import { useDeleteRepairReceipt, useRepairDetail } from '@/features/repair/queries/useRepair'
import { REPAIR_STATE, type RepairDetailData } from '@/features/repair/types/repair'
import { ButtonBase } from '@/shared/components/common/ButtonBase'
import { ChipBase } from '@/shared/components/common/ChipBase'
import { ModalButton } from '@/shared/components/common/ModalButton'
import { SpinnerCircle } from '@/shared/components/common/SpinnerCircle'
import { AppBar } from '@/shared/components/layouts/AppBar'
import { repairEditPath } from '@/shared/constants/routes'
import { sanitizeHtml } from '@/shared/lib/sanitizeHtml'
import { formatHtmlText } from '@/shared/utils/formatHtmlText'
import { formatIsoStringDate } from '@/shared/utils/formatIsoStringDate'
import { formatPhone } from '@/shared/utils/formatPhone'

/**
 * 접수 상세 (RP4). 레거시 `RepairDetailView` + `DetailContent` + `DetailAnswer` 이식.
 *
 * ⚠️ **`수정` 버튼은 항상 보인다.** `접수 대기`가 아니면 이동 대신 **상태 라벨을 끼운
 * 안내 모달**이 뜬다 — `처리 불가된 접수는 수정할 수 없습니다`처럼 어색한 조합이 나온다
 * (`repair.md` RP-Q6). 그대로 옮겼다.
 *
 * ⚠️ **모든 값이 HTML로 렌더된다** — 접수번호까지 그렇다. 레거시 `v-dompurify-html`이다.
 *
 * ⚠️ **취소 버튼은 `접수 대기`일 때만 있다.** `접수 완료`면 안내 문구로 바뀌고,
 * `처리 완료`·`처리 불가`면 아무것도 없다.
 *
 * ⚠️ **`처리 불가`면 방문일자 줄이 사라진다.**
 *
 * ⚠️ **첨부에 확대(라이트박스)가 없다** — 썸네일만 보인다 (`repair.md` RP-Q12).
 */
const renderContentValue = ({
  key,
  repairDetail,
}: {
  key: (typeof REPAIR_DETAIL_CONTENT_FIELD)[number]['key']
  repairDetail?: RepairDetailData
}) => {
  if (key === 'createdDate') {
    return formatIsoStringDate({ dateTimeString: repairDetail?.createdDate }).dateTime() || '-'
  }
  if (key === 'emergencyPhone') {
    return formatPhone({ phone: repairDetail?.emergencyPhone ?? '' }) || '-'
  }

  return formatHtmlText({ text: repairDetail?.[key] ?? '' }) || '-'
}

export const RepairDetailPage = () => {
  const navigate = useNavigate()
  const { repairUuid = '' } = useParams()

  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false)
  const [isNonEditableModalOpen, setIsNonEditableModalOpen] = useState(false)

  const { repairDetail } = useRepairDetail({ repairUuid })
  const { deleteRepairReceiptMutation, isDeleteRepairReceiptPending } = useDeleteRepairReceipt({
    repairUuid,
  })

  const statusInfo = REPAIR_STATUS_LIST.find((status) => {
    return status.status === repairDetail?.repairState
  })

  const isImpossible = repairDetail?.repairState === REPAIR_STATE.IMPOSSIBLE

  return (
    <div className="h-full overflow-auto">
      <AppBar className="bg-base-b-white" title="하자보수 상세">
        <button
          type="button"
          onClick={() => {
            if (repairDetail?.repairState === REPAIR_STATE.WAITING) {
              void navigate(repairEditPath({ repairUuid }))
              return
            }
            setIsNonEditableModalOpen(true)
          }}
        >
          수정
        </button>
      </AppBar>

      <div className="flex flex-col gap-2 bg-defaults-secondary-background-secondary pt-12">
        <section className="flex flex-col gap-5 bg-base-b-white px-5 pt-[18px] pb-[30px]">
          <h2 className="pretendard-16SemiBold">{REPAIR_MESSAGE.contentTitle}</h2>

          {REPAIR_DETAIL_CONTENT_FIELD.map((field) => {
            return (
              <div key={field.key} className="flex min-h-5 justify-between gap-6">
                <span className="pretendard-14SemiBold whitespace-nowrap text-defaults-tertiary-text-tertiary">
                  {field.label}
                </span>
                <span
                  className="pretendard-14Regular text-defaults-primary-text-primary"
                  dangerouslySetInnerHTML={{
                    __html: sanitizeHtml({
                      html: renderContentValue({ key: field.key, repairDetail }),
                    }),
                  }}
                />
              </div>
            )
          })}

          {repairDetail?.fileList && (
            <ul className="grid w-full grid-cols-3 gap-2 sm:flex sm:flex-wrap">
              {repairDetail.fileList.map((file) => {
                return (
                  <li key={file.fileUuid} className="flex justify-center">
                    <img
                      className="h-28 w-28 rounded-md border border-defaults-tertiary-border-tertiary object-cover"
                      src={`${env.VITE_S3_BUCKET_URL_FILE}${file.fileUrl}`}
                      alt={`${file.fileUrl?.split('/').at(-1) ?? '첨부'}`}
                    />
                  </li>
                )
              })}
            </ul>
          )}

          {repairDetail?.repairState === REPAIR_STATE.WAITING && (
            <ButtonBase
              type="button"
              hasOutline
              color="alerts-error"
              roundType="rounded"
              disabled={isDeleteRepairReceiptPending}
              onClick={() => {
                setIsCancelModalOpen(true)
              }}
            >
              {isDeleteRepairReceiptPending ? (
                <SpinnerCircle color="black" />
              ) : (
                REPAIR_MESSAGE.cancelButton
              )}
            </ButtonBase>
          )}

          {repairDetail?.repairState === REPAIR_STATE.RECEIVED && (
            <p className="rounded-lg bg-defaults-secondary-background-secondary px-4 py-3 pretendard-13Regular text-defaults-secondary-text-secondary">
              {REPAIR_MESSAGE.cannotCancel}
            </p>
          )}
        </section>

        <section className="flex flex-col gap-5 bg-base-b-white px-5 pt-[18px] pb-[30px]">
          <h2 className="pretendard-16SemiBold">{REPAIR_MESSAGE.answerTitle}</h2>

          {REPAIR_DETAIL_ANSWER_FIELD.filter((field) => {
            // 처리 불가면 방문일자 줄이 사라진다
            return !(field.key === 'visitDateTime' && isImpossible)
          }).map((field) => {
            return (
              <div key={field.key} className="flex min-h-5 justify-between gap-6">
                <span className="pretendard-14SemiBold whitespace-nowrap text-defaults-tertiary-text-tertiary">
                  {field.label}
                </span>
                {field.key === 'repairState' ? (
                  <ChipBase color={statusInfo?.color}>{statusInfo?.label}</ChipBase>
                ) : (
                  <span
                    className="pretendard-14Regular text-defaults-primary-text-primary"
                    dangerouslySetInnerHTML={{
                      __html: sanitizeHtml({
                        html:
                          field.key === 'visitDateTime'
                            ? (formatIsoStringDate({
                                dateTimeString: repairDetail?.visitDateTime ?? undefined,
                              }).dateTime() ?? '-')
                            : formatHtmlText({ text: repairDetail?.adminComment ?? '' }) || '-',
                      }),
                    }}
                  />
                )}
              </div>
            )
          })}
        </section>
      </div>

      <ModalButton
        open={isCancelModalOpen}
        onClose={() => {
          setIsCancelModalOpen(false)
        }}
        buttonType="outline"
        modalData={REPAIR_DETAIL_MODAL_DATA}
        onFirstClick={() => {
          setIsCancelModalOpen(false)
        }}
        onSecondClick={() => {
          // 모달을 먼저 닫고 요청한다 — 레거시 순서 그대로다
          setIsCancelModalOpen(false)
          deleteRepairReceiptMutation()
        }}
      />

      <ModalButton
        open={isNonEditableModalOpen}
        onClose={() => {
          setIsNonEditableModalOpen(false)
        }}
        buttonType="single"
        modalData={getRepairNonEditableModalData({ status: repairDetail?.repairState })}
        onFirstClick={() => {
          setIsNonEditableModalOpen(false)
        }}
      />
    </div>
  )
}
