/**
 * 관리비 슬라이스 공개 API (MF1·MF2).
 *
 * ⚠️ **페이지는 라우터만 참조한다.** 다른 feature가 이 배럴을 정적으로 import하면
 * lazy 청크가 갈라지지 않아 초기 번들이 커진다 (`deferred.md` D-294).
 */
export { ManagementFeeDetailPage } from '@/features/managementFee/pages/ManagementFeeDetailPage'
export { ManagementFeeInfoPage } from '@/features/managementFee/pages/ManagementFeeInfoPage'
