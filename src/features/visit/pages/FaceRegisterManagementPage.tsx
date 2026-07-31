import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { FaceRecogCard } from '@/features/visit/components/faceRegister/FaceRecogCard'
import { FaceRegisterNoticeBottomSheet } from '@/features/visit/components/faceRegister/FaceRegisterNoticeBottomSheet'
import { FACE_RECOG_MESSAGE, MAX_FACES } from '@/features/visit/constants/faceRecog'
import { useFaceRecogList } from '@/features/visit/queries/useFaceRecog'
import { faceRegisterDetailPath, ROUTE_PATH } from '@/shared/constants/routes'

/**
 * 안면인식 얼굴 등록 관리 (V7).
 * 레거시 `FaceRegisterManagementView.vue`(200 LOC) 이식.
 *
 * ⚠️ **10개를 채우면 `신규 등록` 버튼이 사라지고 경고 배너가 대신 뜬다.** 버튼이 비활성이
 * 되는 게 아니라 **없어진다.**
 *
 * ⚠️ **빈 상태는 로딩이 끝난 뒤에만 보인다.** 스켈레톤이 없어서 조회 중에는 헤더만 있는
 * 화면이다 — 레거시 그대로다.
 */
export const FaceRegisterManagementPage = () => {
  const navigate = useNavigate()
  const [isNoticeOpen, setIsNoticeOpen] = useState(false)

  const { faceRecogList, isFaceRecogListLoading } = useFaceRecogList()

  const faceList = faceRecogList ?? []
  const isFull = faceList.length >= MAX_FACES

  return (
    <div className="flex h-full w-full flex-col overflow-auto bg-base-b-white">
      <div className="relative px-5 pt-8 pb-6">
        <div className="flex flex-col gap-2.5">
          <h2 className="pretendard-20Bold text-defaults-primary-text-primary">
            안면인식을 위한
            <br />
            얼굴을 등록해주세요.
          </h2>
          <p className="pretendard-14Medium text-defaults-secondary-text-secondary">
            공동현관 및 커뮤니티 시설 출입시 사용됩니다.
          </p>
        </div>
        <img
          className="absolute top-4 right-[14px] h-[88px] w-[88px]"
          src="/assets/images/faceId-1.png"
          alt="안면인식 아이콘"
        />
      </div>

      <div className="h-2 w-full bg-defaults-secondary-background-secondary" />

      <div className="flex flex-1 flex-col gap-5 px-5 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 pretendard-18SemiBold">
            <span className="text-defaults-primary-text-primary">등록된 얼굴</span>
            <div className="flex items-center">
              <span className="text-brand-default-text-brand">{faceList.length}</span>
              <span className="text-defaults-primary-text-primary">/{MAX_FACES}</span>
            </div>
          </div>
          {!isFull && (
            <button
              type="button"
              className="flex h-9 items-center gap-1 rounded-lg bg-brand-default-background-brand px-3 py-2 shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)]"
              onClick={() => {
                setIsNoticeOpen(true)
              }}
            >
              <img src="/assets/icons/icon-plus-white.svg" alt="추가 아이콘" className="h-4 w-4" />
              <span className="pretendard-14SemiBold text-base-b-white">신규 등록</span>
            </button>
          )}
        </div>

        {isFull && (
          <div className="flex items-start gap-[7px] rounded-md bg-alerts-warning-background-warning-primary px-[13px] py-3">
            <div className="mt-px flex h-[14px] w-[14px] shrink-0 items-center justify-center rounded-full bg-alerts-warning-background-warning">
              <span className="text-[10px] leading-none font-bold text-base-b-white">!</span>
            </div>
            <p className="flex-1 pretendard-13Medium text-alerts-warning-text-warning">
              {FACE_RECOG_MESSAGE.full}
            </p>
          </div>
        )}

        {faceList.length > 0 ? (
          <div className="flex flex-col gap-3">
            {faceList.map((face) => {
              return (
                <FaceRecogCard
                  key={face.faceRecogGuid}
                  face={face}
                  actions={
                    <button
                      type="button"
                      className="flex h-9 shrink-0 items-center justify-center rounded-lg border border-defaults-secondary-border-secondary bg-base-b-white px-3 py-2 shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)]"
                      onClick={() => {
                        void navigate(faceRegisterDetailPath({ guid: face.faceRecogGuid }))
                      }}
                    >
                      <span className="pretendard-14SemiBold text-defaults-primary-text-primary">
                        상세
                      </span>
                    </button>
                  }
                />
              )
            })}
          </div>
        ) : (
          !isFaceRecogListLoading && (
            <div className="flex flex-1 items-center justify-center py-40">
              <p className="pretendard-16Medium text-defaults-tertiary-text-tertiary">
                {FACE_RECOG_MESSAGE.empty}
              </p>
            </div>
          )
        )}
      </div>

      {isNoticeOpen && (
        <FaceRegisterNoticeBottomSheet
          onClose={() => {
            setIsNoticeOpen(false)
          }}
          onConfirm={() => {
            void navigate(ROUTE_PATH.VISIT_FACE_REGISTER_FORM)
          }}
        />
      )}
    </div>
  )
}
