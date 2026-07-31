/**
 * 전자투표 공개 API. **메인 앱 화면 전부(VT1~VT6·VT10)가 이관됐다.**
 * opinion 전용 VT7~VT9는 그 엔트리와 함께 붙인다.
 *
 * ⚠️ **`VoteVoterHasPendingModal`은 메인 화면이 렌더한다** — 라우트가 없다.
 * 그래서 이 배럴은 `app/MainScreen`이 정적으로 import한다(청크 분리는 유지된다,
 * 팝업만 초기 번들에 들어간다).
 *
 * ⚠️ **본인인증 정보(`voteCertInfo`) 스토어는 여기서 내보내지 않는다.**
 * 네이티브 뒤로가기가 앱 전역에서 읽어야 해서 `shared/stores/voteCertStore.ts`에 있다 —
 * 이 배럴에서 내보내면 배럴이 초기 번들에 고정되어 **투표 화면 전체가 함께 실린다**
 * (실측 408 kB → 548 kB).
 */
export { VoteVoterHasPendingModal } from '@/features/vote/components/VoteVoterHasPendingModal'
export { VoteCertNamePhonePage } from '@/features/vote/pages/VoteCertNamePhonePage'
export { VoteCertPassResponsePage } from '@/features/vote/pages/VoteCertPassResponsePage'
export { VoteCompletedPage } from '@/features/vote/pages/VoteCompletedPage'
export { VoteDetailPage } from '@/features/vote/pages/VoteDetailPage'
export { VoteFormPage } from '@/features/vote/pages/VoteFormPage'
export { VoteListPage } from '@/features/vote/pages/VoteListPage'
