import { useState } from 'react'

import { StepCalendar } from '@/features/aptMall/components/form/StepCalendar'
import { StepConfirm } from '@/features/aptMall/components/form/StepConfirm'
import { StepMenu } from '@/features/aptMall/components/form/StepMenu'
import { StepOrderType } from '@/features/aptMall/components/form/StepOrderType'
import { formatOrderDateTime } from '@/features/aptMall/lib/aptMallOrder'
import { useAptMallDetail } from '@/features/aptMall/queries/useAptMall'
import { useAptMallFormStore } from '@/features/aptMall/stores/aptMallFormStore'
import { ButtonBase } from '@/shared/components/common/ButtonBase'
import { DrawerBase } from '@/shared/components/common/DrawerBase'
import { SpinnerDots } from '@/shared/components/common/SpinnerDots'

const STEP_TITLES = [
  '예약 유형 선택',
  '일자 및 인원 선택',
  '메뉴 선택',
  '예약 정보가 맞으신가요?',
  '예약완료',
]

/**
 * 예약 위저드 5단계 셸 (AM4~AM8). 레거시 `AptMallForm.vue`.
 *
 * ⚠️ **URL을 만들지 않는다.** 단계는 로컬 상태일 뿐이라 뒤로가기를 누르면 위저드가
 * 아니라 화면이 빠져나간다 — 라우트로 쪼개면 동작이 달라진다 (`apt-mall.md` 「반드시」1).
 *
 * ⚠️ **배경 클릭·X 버튼으로도 닫힌다** — 위저드 중간에 실수로 닫힐 수 있고, 그때
 * 스토어가 초기화된다. 레거시 그대로다.
 *
 * ⚠️ **진행 바는 0단계에서 숨는다.** 1~4단계에서 25/50/75/100%로 찬다.
 */
export const AptMallOrderDrawer = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const [currentStep, setCurrentStep] = useState(0)

  const { aptMallDetail, isAptMallDetailLoading } = useAptMallDetail()

  const resetAptMallFormData = useAptMallFormStore((state) => {
    return state.resetAptMallFormData
  })
  const aptMallFormData = useAptMallFormStore((state) => {
    return state.aptMallFormData
  })

  const closeDrawer = () => {
    resetAptMallFormData()
    setCurrentStep(0)
    onClose()
  }

  const nextStep = () => {
    setCurrentStep((step) => {
      return Math.min(step + 1, STEP_TITLES.length - 1)
    })
  }

  const prevStep = () => {
    setCurrentStep((step) => {
      return Math.max(step - 1, 0)
    })
  }

  return (
    <DrawerBase
      open={open}
      onClose={closeDrawer}
      title={STEP_TITLES[currentStep]}
      hasCloseButton
      hasButtons={false}
    >
      {isAptMallDetailLoading ? (
        <SpinnerDots />
      ) : (
        <div className="h-full w-full pt-2.5">
          <div className="max-h-[90vh] w-full overflow-auto">
            {currentStep > 0 && (
              <div className="mb-3 h-1.5 bg-defaults-secondary-background-mono">
                <div
                  className="h-full bg-brand-default-background-brand transition-all duration-300"
                  style={{ width: `${(currentStep / (STEP_TITLES.length - 1)) * 100}%` }}
                />
              </div>
            )}

            {currentStep === 0 && <StepOrderType onNextStep={nextStep} />}
            {currentStep === 1 && <StepCalendar onNextStep={nextStep} onClose={closeDrawer} />}
            {currentStep === 2 && (
              <StepMenu
                aptMallUuid={aptMallDetail?.aptMallUuid}
                onPrevStep={prevStep}
                onNextStep={nextStep}
              />
            )}
            {currentStep === 3 && (
              <StepConfirm
                aptMallUuid={aptMallDetail?.aptMallUuid}
                onPrevStep={prevStep}
                onNextStep={nextStep}
              />
            )}
            {currentStep === 4 && (
              /* AM8 — 문구가 `주말조식 예약 완료`로 하드코딩돼 있다. 몰 이름을 쓰지 않는다 */
              <div className="space-y-9 p-5">
                <div className="flex flex-col items-center justify-center gap-3">
                  <img
                    src="/assets/icons/CheckCircleBlue.svg"
                    className="h-12 w-12"
                    alt="확인 아이콘"
                  />
                  <div className="space-y-2 text-center">
                    <div className="pretendard-18SemiBold">주말조식 예약 완료</div>
                    <div className="pretendard-16Medium">
                      {formatOrderDateTime(aptMallFormData)}
                    </div>
                  </div>
                </div>
                <div className="flex w-full gap-3">
                  <ButtonBase type="button" roundType="rounded" color="brand" onClick={closeDrawer}>
                    확인
                  </ButtonBase>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </DrawerBase>
  )
}
