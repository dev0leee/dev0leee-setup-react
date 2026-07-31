/**
 * 소방 자가점검 슬라이스 공개 API (F1~F4).
 *
 * ⚠️ **페이지는 라우터만 참조한다.** 다른 feature가 이 배럴을 정적으로 import하면
 * lazy 청크가 갈라지지 않아 초기 번들이 커진다 (`deferred.md` D-294).
 */
export { FireInspectionCompletePage } from '@/features/fireInspection/pages/FireInspectionCompletePage'
export { FireInspectionDetailPage } from '@/features/fireInspection/pages/FireInspectionDetailPage'
export { FireInspectionPage } from '@/features/fireInspection/pages/FireInspectionPage'
export { FireInspectionProcessPage } from '@/features/fireInspection/pages/FireInspectionProcessPage'
