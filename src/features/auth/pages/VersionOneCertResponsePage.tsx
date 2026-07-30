import { useNavigate, useSearchParams } from 'react-router-dom'

import { usePostUserVersionOneInfo } from '@/features/auth/queries/usePostUserVersionOneInfo'
import { CertResponse } from '@/shared/components/common/CertResponse'
import { ROUTE_PATH } from '@/shared/constants/routes'

/**
 * 버전1 본인인증 결과 수신 (A6). 레거시 `LoginView/VersionOneCertResponseView.vue` 이식.
 *
 * **화면 요소가 없다.** KMC 콜백 착륙지점이고 쿼리스트링을 그대로 서버에 전달한다.
 *
 * ⚠️ **회원가입(S2)과 달리 스토어를 거치지 않는다.** 이미 로그인 상태라 위저드가 없고,
 * 쿼리스트링의 `apiToken`·`certNum`만 바로 전송한다.
 *
 * ⚠️ 진행 중이면 재요청을 막는다. 레거시가 `isPending`을 직접 확인한다 — 콜백 화면이
 * 어떤 이유로 다시 마운트돼도 중복 가입 요청이 나가지 않게 하는 장치다.
 */
export const VersionOneCertResponsePage = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { postUserVersionOneInfoMutation, isPostUserVersionOneInfoPending } =
    usePostUserVersionOneInfo()

  const handleCertResponse = () => {
    if (isPostUserVersionOneInfoPending) return

    postUserVersionOneInfoMutation({
      apiToken: searchParams.get('apiToken') ?? '',
      certNum: searchParams.get('certNum') ?? '',
    })
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
