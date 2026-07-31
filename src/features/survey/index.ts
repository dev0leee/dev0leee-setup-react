/**
 * 설문조사 공개 API. **메인 앱 6화면(SV1~SV6)이 전부 이관됐다.**
 * opinion 전용 SV7~SV9는 그 엔트리와 함께 붙인다.
 *
 * ⚠️ **본인인증 정보(`surveyCertInfo`) 스토어는 여기서 내보내지 않는다.**
 * 네이티브 뒤로가기가 앱 전역에서 읽어야 해서 `shared/stores/surveyCertStore.ts`에 있다 (D-294).
 */
export { SurveyCertNamePhonePage } from '@/features/survey/pages/SurveyCertNamePhonePage'
export { SurveyCertPassResponsePage } from '@/features/survey/pages/SurveyCertPassResponsePage'
export { SurveyCompletedPage } from '@/features/survey/pages/SurveyCompletedPage'
export { SurveyDetailPage } from '@/features/survey/pages/SurveyDetailPage'
export { SurveyFormPage } from '@/features/survey/pages/SurveyFormPage'
export { SurveyListPage } from '@/features/survey/pages/SurveyListPage'
