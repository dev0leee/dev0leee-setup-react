import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { FaceRecogCard } from '@/features/visit/components/faceRegister/FaceRecogCard'
import {
  FACE_RECOG_DETAIL_NOTICE,
  FACE_RECOG_MESSAGE,
  FACE_RECOG_REGIST_CAUSE_FALLBACK,
  FACE_RECOG_REGIST_CAUSE_MESSAGE,
} from '@/features/visit/constants/faceRecog'
import { useDeleteFaceRecog, useFaceRecogDetail } from '@/features/visit/queries/useFaceRecog'
import { faceRegisterEditPath } from '@/shared/constants/routes'

/**
 * 안면인식 정보 상세 (V8).
 * 레거시 `FaceRegisterDetailView.vue`(231 LOC) 이식.
 *
 * ⚠️ **로딩 중에는 빈 화면이다.** 스켈레톤도 스피너도 없다 — 레거시 그대로다.
 *
 * ⚠️ **실패 사유와 대기 안내는 배타적이다.** `REJECT`면 빨간 사유 박스만, `PENDING`이면
 * 주황 안내만 뜬다. `COMPLETE`는 둘 다 없다.
 *
 * ⚠️ **삭제 확인 모달을 직접 만들었다.** 공용 `ModalBase`를 쓰지 않는다 — 폭 320px·그림자·
 * `h-5` 스페이서가 이 화면 전용값이라 공용 모달로 감싸면 픽셀이 어긋난다. 같은 도메인의
 * 임시 비밀번호 삭제(V4)에는 **확인 자체가 없다** — 비대칭도 그대로 옮긴다.
 */
export const FaceRegisterDetailPage = () => {
  const navigate = useNavigate()
  const { id: faceRecogGuid = '' } = useParams()
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

  const { faceRecogDetail: face, isFaceRecogDetailLoading } = useFaceRecogDetail({ faceRecogGuid })
  const { deleteFaceRecogMutation, isFaceRecogDeletePending } = useDeleteFaceRecog()

  // 미정의 사유 코드는 `ExceptionOccurred` 문구로 떨어진다
  const registCauseMessage =
    face?.faceRecogStatus === 'REJECT'
      ? (FACE_RECOG_REGIST_CAUSE_MESSAGE[face.registCause ?? ''] ??
        FACE_RECOG_REGIST_CAUSE_MESSAGE[FACE_RECOG_REGIST_CAUSE_FALLBACK])
      : ''

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false)
  }

  return (
    <div className="flex h-full w-full flex-col bg-defaults-primary-background-primary">
      {!isFaceRecogDetailLoading && face && (
        <div className="flex flex-col gap-3 px-5 pt-6 pb-5">
          <FaceRecogCard
            face={face}
            actions={
              <>
                <button
                  type="button"
                  className="flex h-9 items-center justify-center rounded-lg border border-defaults-secondary-border-secondary bg-defaults-primary-background-primary px-3 py-2 shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)]"
                  onClick={() => {
                    void navigate(faceRegisterEditPath({ guid: faceRecogGuid }))
                  }}
                >
                  <span className="pretendard-14SemiBold text-defaults-primary-text-primary">
                    수정
                  </span>
                </button>
                <button
                  type="button"
                  className="flex h-9 items-center justify-center rounded-lg border border-alerts-error-border-error bg-defaults-primary-background-primary px-3 py-2 shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)]"
                  onClick={() => {
                    setIsDeleteModalOpen(true)
                  }}
                >
                  <span className="pretendard-14SemiBold text-alerts-error-text-error">삭제</span>
                </button>
              </>
            }
          />

          {registCauseMessage ? (
            <p className="rounded-lg bg-alerts-error-background-error-secondary px-4 py-3 pretendard-14Medium text-alerts-error-text-error">
              {registCauseMessage}
            </p>
          ) : (
            face.faceRecogStatus === 'PENDING' && (
              <p className="rounded-lg bg-alerts-warning-background-warning-primary px-4 py-3 pretendard-14Medium text-alerts-warning-text-warning">
                {FACE_RECOG_MESSAGE.pending}
              </p>
            )
          )}

          <ul className="flex flex-col gap-1 pretendard-12Regular text-defaults-tertiary-text-tertiary">
            {FACE_RECOG_DETAIL_NOTICE.map((notice) => {
              return (
                <li key={notice} className="flex items-start gap-1.5 pl-0.5">
                  <span className="mt-[6px] h-[3px] w-[3px] shrink-0 rounded-full bg-defaults-tertiary-text-tertiary" />
                  <span>{notice}</span>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {isDeleteModalOpen && (
        <div
          role="presentation"
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 px-4"
          onClick={closeDeleteModal}
        >
          <div
            role="presentation"
            className="w-[320px] overflow-hidden rounded-xl bg-defaults-primary-background-primary shadow-[0px_20px_24px_-4px_rgba(16,24,40,0.08),0px_8px_8px_-4px_rgba(16,24,40,0.03)]"
            onClick={(event) => {
              event.stopPropagation()
            }}
          >
            <div className="flex flex-col items-center gap-2 px-4 pt-8 text-center">
              <p className="pretendard-18SemiBold text-defaults-primary-text-primary">
                얼굴 등록 정보 삭제
              </p>
              <p className="pretendard-16Regular text-defaults-foreground-text-gray-600">
                {face?.residentFaceName}님의 얼굴 등록정보를 삭제하시겠어요?
                <br />
                삭제 후 복구가 불가능합니다.
              </p>
            </div>
            <div className="h-5" />
            <div className="flex gap-3 px-4 pt-4 pb-4">
              <button
                type="button"
                className="flex flex-1 items-center justify-center rounded-lg border border-defaults-secondary-border-secondary bg-defaults-primary-background-primary px-[18px] py-3 shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)]"
                onClick={closeDeleteModal}
              >
                <span className="pretendard-16SemiBold text-defaults-primary-text-primary">
                  취소
                </span>
              </button>
              <button
                type="button"
                disabled={isFaceRecogDeletePending}
                className="flex flex-1 items-center justify-center rounded-lg bg-alerts-error-background-error px-[18px] py-3 shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] disabled:opacity-50"
                onClick={() => {
                  setIsDeleteModalOpen(false)
                  deleteFaceRecogMutation({ faceRecogGuid })
                }}
              >
                <span className="pretendard-16SemiBold text-defaults-primary-text-primary-inverse">
                  삭제
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
