/**
 * 전자투표 공개 API. **VT1·VT2·VT4·VT5·VT6까지 이관됐다.**
 * 참여 폼(VT3)과 미완료 투표 팝업(VT10)이 남았고,
 * opinion 전용 VT7~VT9는 opinion 엔트리와 함께 붙인다.
 *
 * ⚠️ **본인인증 정보(`voteCertInfo`) 스토어는 여기서 내보내지 않는다.**
 * 네이티브 뒤로가기가 앱 전역에서 읽어야 해서 `shared/stores/voteCertStore.ts`에 있다 —
 * 이 배럴에서 내보내면 배럴이 초기 번들에 고정되어 **투표 화면 전체가 함께 실린다**
 * (실측 408 kB → 548 kB).
 */
export { VoteCertNamePhonePage } from '@/features/vote/pages/VoteCertNamePhonePage'
export { VoteCertPassResponsePage } from '@/features/vote/pages/VoteCertPassResponsePage'
export { VoteCompletedPage } from '@/features/vote/pages/VoteCompletedPage'
export { VoteDetailPage } from '@/features/vote/pages/VoteDetailPage'
export { VoteListPage } from '@/features/vote/pages/VoteListPage'
