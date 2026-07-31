/**
 * 설문조사 공개 API. **SV1·SV2(PR1)까지 이관됐다.**
 * 참여 폼(SV3)·완료(SV4)·인증(SV5·SV6)이 남았고, opinion 전용 SV7~SV9는 그 엔트리와 함께다.
 *
 * ⚠️ **본인인증 정보(`surveyCertInfo`) 스토어는 여기서 내보내지 않는다.**
 * 네이티브 뒤로가기가 앱 전역에서 읽어야 해서 `shared/stores/surveyCertStore.ts`에 있다 —
 * 이 배럴에서 내보내면 설문 화면 전체가 초기 번들에 실린다 (D-294).
 */
export { SurveyDetailPage } from '@/features/survey/pages/SurveyDetailPage'
export { SurveyListPage } from '@/features/survey/pages/SurveyListPage'
