import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { FireInspectionHeader } from '@/features/fireInspection/components/FireInspectionHeader'
import { FireInspectionStartModal } from '@/features/fireInspection/components/FireInspectionStartModal'
import { FireInspectionStatusCard } from '@/features/fireInspection/components/FireInspectionStatusCard'
import { FIRE_INSPECTION_MESSAGE } from '@/features/fireInspection/constants/fireInspection'
import { useFireInspectionStatus } from '@/features/fireInspection/queries/useFireInspection'
import { FIRE_INSPECTION_SUBMISSION_STATUS } from '@/features/fireInspection/types/fireInspection'
import { SpinnerDots } from '@/shared/components/common/SpinnerDots'
import { fireInspectionProcessPath } from '@/shared/constants/routes'

/**
 * 점검 메인 (F1). 레거시 `FireInspectionView.vue` 이식.
 *
 * ⚠️ **이 도메인에서 유일하게 바텀네비가 보이는 화면이다** (`showBottomNav: true`).
 * 메인 메뉴에서 들어오므로 그것이 맞다.
 *
 * 🔴 **정렬 없이 `[0]`을 최신 회차로 쓴다.** 서버가 최신순으로 준다는 가정이고,
 * 순서가 뒤바뀌면 헤더 버튼이 과거 회차 상태를 보여주고 `시작하기`가 과거 회차의
 * uuid로 이동한다 (`fire-inspection.md` F-Q7). 레거시 그대로다.
 *
 * ⚠️ **셸 배경과 구분선 배경이 같은 토큰이다** — 헤더·내역이 흰색이라 그 사이가
 * 8px 회색 띠로 보인다.
 */
export const FireInspectionPage = () => {
  const navigate = useNavigate()

  const { inspectionStatusData, isInspectionStatusLoading } = useFireInspectionStatus()
  const [isStartModalOpen, setIsStartModalOpen] = useState(false)

  const inspectionList = inspectionStatusData ?? []
  const latestInspection = inspectionList[0]

  return (
    <div className="flex h-full w-full flex-col overflow-auto bg-defaults-secondary-background-secondary">
      {isInspectionStatusLoading ? (
        <SpinnerDots />
      ) : (
        <>
          <FireInspectionHeader
            submissionStatus={latestInspection?.submissionStatus}
            onStartInspection={() => {
              // 버튼이 `NOT_SUBMITTED`에서만 활성이므로 이 가드는 중복 방어다 (레거시 그대로)
              if (
                latestInspection?.submissionStatus !==
                FIRE_INSPECTION_SUBMISSION_STATUS.NOT_SUBMITTED
              ) {
                return
              }
              setIsStartModalOpen(true)
            }}
          />

          <div className="h-2 bg-defaults-secondary-background-secondary" />

          <div className="flex flex-1 flex-col gap-4 bg-base-b-white px-5 py-5">
            <h3 className="pretendard-16Bold text-defaults-primary-text-primary">
              {FIRE_INSPECTION_MESSAGE.historyTitle}
            </h3>

            {inspectionList.length > 0 ? (
              <ul className="flex flex-col gap-3">
                {inspectionList.map((inspection) => {
                  return (
                    <FireInspectionStatusCard
                      key={inspection.fireInspectionUuid}
                      inspection={inspection}
                    />
                  )
                })}
              </ul>
            ) : (
              <div className="flex h-32 items-center justify-center">
                <span className="pretendard-14Regular text-defaults-tertiary-text-tertiary">
                  {FIRE_INSPECTION_MESSAGE.historyEmpty}
                </span>
              </div>
            )}
          </div>
        </>
      )}

      {latestInspection && (
        <FireInspectionStartModal
          open={isStartModalOpen}
          inspection={latestInspection}
          onClose={() => {
            setIsStartModalOpen(false)
          }}
          onConfirm={() => {
            setIsStartModalOpen(false)
            if (!latestInspection.householdFireInspectionUuid) return

            void navigate(
              fireInspectionProcessPath({
                householdFireInspectionUuid: latestInspection.householdFireInspectionUuid,
              }),
            )
          }}
        />
      )}
    </div>
  )
}
