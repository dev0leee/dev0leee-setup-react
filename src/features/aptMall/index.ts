/**
 * 아파트몰(주말조식) 슬라이스 공개 API (AM1~AM11).
 *
 * ⚠️ **페이지는 라우터만 참조한다.** 다른 feature가 이 배럴을 정적으로 import하면
 * lazy 청크가 갈라지지 않아 초기 번들이 커진다 (`deferred.md` D-294).
 */
export { AptMallListPage } from '@/features/aptMall/pages/AptMallListPage'
export { AptMallMyOrderDetailPage } from '@/features/aptMall/pages/AptMallMyOrderDetailPage'
export { AptMallMyOrderPage } from '@/features/aptMall/pages/AptMallMyOrderPage'
