import { useNavigate, useSearchParams } from 'react-router-dom'

import { useSignUpStore } from '@/features/signup/stores/signUpStore'
import { CertResponse } from '@/shared/components/common/CertResponse'
import { ROUTE_PATH } from '@/shared/constants/routes'

/**
 * 본인인증 결과 수신 (S2). 레거시 `SignUpView/SignUpCertResponseView.vue` 이식.
 *
 * **화면 요소가 없다.** KMC가 쿼리스트링을 붙여 돌려보내는 착륙지점이고, 값을 스토어에
 * 옮긴 뒤 곧바로 다음 단계로 넘긴다.
 *
 * ⚠️ **쿼리스트링 전체를 그대로 스토어에 펼쳐 넣는다.** KMC가 어떤 필드를 붙이는지
 * 문서가 없어 레거시가 `...query`로 전부 받는다 (`signup.md` S-Q4). 필드를 골라 받으면
 * 서버가 요구하는 값이 빠질 수 있어 같은 방식을 유지한다.
 *
 * ⚠️ **선택 동의 2개만 boolean으로 되돌린다.** 쿼리스트링을 왕복하며 `'true'`/`'false'`
 * 문자열이 됐기 때문이다. 나머지 필드는 원래 문자열이라 손대지 않는다.
 */
export const SignUpCertResponsePage = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const setSignUpInfo = useSignUpStore((state) => {
    return state.setSignUpInfo
  })

  const handleCertResponse = () => {
    const query = Object.fromEntries(searchParams)

    setSignUpInfo({
      ...query,
      marketingDataConsentFlag: query.marketingDataConsentFlag === 'true',
      receiveAdvertsConsentFlag: query.receiveAdvertsConsentFlag === 'true',
    })

    void navigate(ROUTE_PATH.SIGNUP_INFO_USER)
  }

  return (
    <CertResponse
      onCertResponse={handleCertResponse}
      onAccessDenied={() => {
        void navigate(ROUTE_PATH.HOME)
      }}
    />
  )
}
