import { TermsAgreeForm } from '@/shared/components/common/TermsAgreeForm'
import { TextTitle } from '@/shared/components/common/TextTitle'
import { ROUTE_PATH } from '@/shared/constants/routes'

/**
 * 이용약관 동의 (S1). 레거시 `SignUpView/SignUpTermsAndConditionsView.vue` 이식.
 *
 * 폼 본체는 `TermsAgreeForm`이 갖는다 — 버전1 전환(`auth.md` A5)과 공유하는 컴포넌트다.
 * 이 화면이 정하는 것은 **제목·버튼 문구·콜백 경로** 세 가지뿐이다.
 *
 * ⚠️ **레거시 `setSignUpInfo({})`를 옮기지 않았다.** 스토어 setter가 병합이라
 * 빈 객체로는 아무것도 지워지지 않는다 — 초기화 의도가 실현되지 않는 죽은 호출이다
 * (`deferred.md` D-206).
 *
 * ⚠️ `pb-24`가 있다. 하단에 `fixed`로 붙는 인증 버튼에 본문이 가리지 않게 하는 여백이다.
 */
export const TermsAndConditionsPage = () => {
  return (
    <div className="h-full w-full space-y-20 overflow-auto p-5 pb-24">
      <TextTitle>
        <span>아파트먼트 서비스 이용약관에</span>
        <span>동의해주세요.</span>
      </TextTitle>
      <TermsAgreeForm
        certButtonText="동의하고 가입하기"
        certResponsePath={ROUTE_PATH.SIGNUP_CERT_RESPONSE}
      />
    </div>
  )
}
