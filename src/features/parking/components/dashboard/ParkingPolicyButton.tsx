import { useState } from 'react'

import { ParkingPolicyDrawer } from '@/features/parking/components/dashboard/ParkingPolicyDrawer'
import { ButtonBase } from '@/shared/components/common/ButtonBase'

/**
 * `아파트 주차 정책` 버튼 + 드로어 (PK1). 레거시 `ParkingManagementPolicy.vue`(32 LOC).
 *
 * 드로어를 여는 상태만 들고 있는 얇은 껍데기다 — 레거시 구조 그대로 두 파일로 나눈다.
 */
export const ParkingPolicyButton = () => {
  const [isPolicyDrawerOpen, setIsPolicyDrawerOpen] = useState(false)

  return (
    <div>
      <ButtonBase
        color="defaults-secondary"
        size="md"
        onClick={() => {
          setIsPolicyDrawerOpen(true)
        }}
      >
        아파트 주차 정책
      </ButtonBase>

      <ParkingPolicyDrawer
        open={isPolicyDrawerOpen}
        onClose={() => {
          setIsPolicyDrawerOpen(false)
        }}
      />
    </div>
  )
}
