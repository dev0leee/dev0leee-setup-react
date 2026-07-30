import { TermsAgreeForm } from '@/shared/components/common/TermsAgreeForm'
import { TextTitle } from '@/shared/components/common/TextTitle'
import { ROUTE_PATH } from '@/shared/constants/routes'

/**
 * 버전1 서비스 이용약관 동의 (A5). 레거시 `LoginView/VersionOneTermsView.vue` 이식.
 *
 * 구버전(`oldResidentFlag`) 계정으로 로그인하면 여기로 온다. 약관 폼 자체는 회원가입
 * S1과 **같은 컴포넌트**이고 버튼 문구와 콜백 경로만 다르다.
 *
 * ⚠️ 레거시 `<style scoped>`의 `.fixed-width`는 **템플릿에서 쓰이지 않는 죽은 스타일**이다
 * (`TermsAgreeForm` 안에서 이미 적용된다). 옮기지 않았다.
 */
export const VersionOneTermsPage = () => {
  return (
    <div className="h-full w-full space-y-10 overflow-y-auto p-5">
      <div>
        <TextTitle>
          <span>아파트먼트 V2</span>
          <span>서비스 이용약관</span>
        </TextTitle>
        <p>버전2 서비스 이용약관 동의가 필요해요.</p>
      </div>
      <TermsAgreeForm
        certButtonText="동의하고 인증하기"
        certResponsePath={ROUTE_PATH.VERSION_ONE_TERMS_RESPONSE}
      />
    </div>
  )
}
