/**
 * A-PASS 공개 API. **AP1 한 화면이 전부다.**
 *
 * ⚠️ **토글 진행 플래그(`isApassLoading`) 스토어는 여기서 내보내지 않는다.**
 * 네이티브 뒤로가기가 앱 전역에서 읽어야 해서 `shared/stores/apassLoadingStore.ts`에 있다 —
 * 이 배럴에서 내보내면 A-PASS 화면이 초기 번들에 실린다 (D-294).
 */
export { ApassPage } from '@/features/apass/pages/ApassPage'
