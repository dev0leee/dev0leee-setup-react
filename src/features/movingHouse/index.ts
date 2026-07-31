/**
 * 이사예약 슬라이스 공개 API (MH1~MH4).
 *
 * ⚠️ **페이지는 라우터만 참조한다.** 다른 feature가 이 배럴을 정적으로 import하면
 * lazy 청크가 갈라지지 않아 초기 번들이 커진다 (`deferred.md` D-294).
 */
export { MovingHouseConfirmPage } from '@/features/movingHouse/pages/MovingHouseConfirmPage'
export { MovingHouseDetailPage } from '@/features/movingHouse/pages/MovingHouseDetailPage'
export { MovingHouseListPage } from '@/features/movingHouse/pages/MovingHouseListPage'
export { MovingHouseWritePage } from '@/features/movingHouse/pages/MovingHouseWritePage'
