import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { FireInspectionCategory } from '@/features/fireInspection/components/FireInspectionCategory'
import { FireInspectionProgress } from '@/features/fireInspection/components/FireInspectionProgress'
import { FireInspectionSignature } from '@/features/fireInspection/components/FireInspectionSignature'
import {
  FIRE_INSPECTION_MESSAGE,
  INSPECTION_CATEGORIES,
  SIGNATURE_CANVAS,
} from '@/features/fireInspection/constants/fireInspection'
import { FireInspectionFormContext } from '@/features/fireInspection/context/fireInspectionFormContext'
import { useFireInspectionForm } from '@/features/fireInspection/hooks/useFireInspectionForm'
import { usePostFireInspectionResult } from '@/features/fireInspection/queries/useFireInspection'
import { ButtonBase } from '@/shared/components/common/ButtonBase'
import { AppBar } from '@/shared/components/layouts/AppBar'
import { base64ToFile } from '@/shared/utils/base64ToFile'

/**
 * 점검표 작성 (F2). 레거시 `FireInspectionProcessView.vue` 이식.
 *
 * **라우트 없이 2단계로 갈린다** — 점검표(F2a)와 서명(F2b). URL이 바뀌지 않는다.
 *
 * ⚠️ **AppBar 뒤로가기가 서명 → 점검표로 되돌린다.** 다만 **네이티브/하드웨어 뒤로가기는
 * 라우트를 벗어나 점검 내용이 전부 사라진다** — 레거시 그대로다 (`fire-inspection.md` F-Q1).
 *
 * ⚠️ **AppBar 제목이 두 단계 모두 `자가점검표 작성`이다** (서명 단계에서도 바뀌지 않는다).
 *
 * ⚠️ **하단 버튼 영역은 두 단계 공통**이고 `fixed`가 아니라 flex 마지막 자식이다.
 * ⚠️ **제출 중 스피너가 없다** — 버튼만 비활성되고 문구는 `완료`로 남는다.
 */
export const FireInspectionProcessPage = () => {
  const navigate = useNavigate()
  const { householdFireInspectionUuid = '' } = useParams()

  const inspectionForm = useFireInspectionForm()
  const { submitInspectionResult, isSubmitPending } = usePostFireInspectionResult()

  const [isSignatureStep, setIsSignatureStep] = useState(false)
  const [signatureData, setSignatureData] = useState<string | null>(null)

  const isNextButtonEnabled = isSignatureStep
    ? Boolean(signatureData)
    : inspectionForm.isAllCompleted

  const handleNextButtonClick = () => {
    if (!isSignatureStep) {
      setIsSignatureStep(true)
      return
    }
    if (!signatureData) return

    submitInspectionResult({
      householdFireInspectionUuid,
      signatureFile: base64ToFile({
        base64String: signatureData,
        fileName: SIGNATURE_CANVAS.fileName,
      }),
      questionAnswerList: inspectionForm.buildQuestionAnswerList(),
    })
  }

  return (
    <FireInspectionFormContext.Provider value={inspectionForm}>
      <div className="flex h-full w-full flex-col bg-base-b-white">
        <AppBar
          title={FIRE_INSPECTION_MESSAGE.processTitle}
          onBack={() => {
            if (isSignatureStep) {
              setIsSignatureStep(false)
              return
            }
            void navigate(-1)
          }}
        />

        {isSignatureStep ? (
          <FireInspectionSignature onComplete={setSignatureData} />
        ) : (
          <div className="flex flex-1 flex-col overflow-auto pt-12">
            <FireInspectionProgress percent={inspectionForm.progressPercent} />

            <div className="flex flex-col gap-4 px-5 py-6">
              {INSPECTION_CATEGORIES.map((category) => {
                return <FireInspectionCategory key={category.categoryId} category={category} />
              })}
            </div>
          </div>
        )}

        <div className="border-t border-defaults-tertiary-border-tertiary px-5 py-4">
          <ButtonBase
            type="button"
            color={isNextButtonEnabled ? 'brand' : 'defaults-secondary'}
            size="xl"
            disabled={!isNextButtonEnabled || isSubmitPending}
            onClick={handleNextButtonClick}
          >
            {isSignatureStep ? FIRE_INSPECTION_MESSAGE.submit : FIRE_INSPECTION_MESSAGE.next}
          </ButtonBase>
        </div>
      </div>
    </FireInspectionFormContext.Provider>
  )
}
