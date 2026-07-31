import { ParkingMenuGrid } from '@/features/parking/components/dashboard/ParkingMenuGrid'
import { ParkingMileageSummary } from '@/features/parking/components/dashboard/ParkingMileageSummary'
import { RegularCarListPage } from '@/features/parking/pages/RegularCarListPage'

/**
 * 주차 관리 (PK1). 레거시 `ParkingManagement/ParkingManagementView.vue`(17 LOC) 이식.
 *
 * 상단 그라데이션 영역(마일리지 + 메뉴)과 하단 정기권 목록으로 나뉜다.
 * **정기권 목록은 PK15와 같은 컴포넌트**이고, 경로를 보고 제목·스크롤 여부를 바꾼다.
 *
 * ⚠️ **페이지 전체가 하나의 스크롤 컨테이너다.** 정기권 목록이 자체 스크롤을 갖지 않아
 * 여기까지 내려오면 다음 페이지가 로드된다.
 */
export const ParkingManagementPage = () => {
  return (
    <div className="flex h-full w-full flex-col space-y-2 overflow-auto">
      <div className="w-full space-y-5 bg-gradient-to-b from-defaults-primary-background-primary to-defaults-secondary-background-mono p-5">
        <ParkingMileageSummary />
        <ParkingMenuGrid />
      </div>

      <RegularCarListPage />
    </div>
  )
}
