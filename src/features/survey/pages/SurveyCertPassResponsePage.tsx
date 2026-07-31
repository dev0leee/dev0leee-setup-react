import { useSearchParams } from 'react-router-dom'

import {
  usePatchSurveyCertPass,
  useSurveyCertNavigation,
} from '@/features/survey/queries/useSurvey'
import { CertResponse } from '@/shared/components/common/CertResponse'
import { useSurveyCertStore } from '@/shared/stores/surveyCertStore'

/**
 * PASS 본인인증 결과 수신 (SV5). 레거시 `Auth/SurveyAuthPassResponseView.vue`(57 LOC) 이식.
 *
 * **KMC가 `tr_url`로 POST 리다이렉트해 도착하는 화면이다.** 쿼리스트링의 `apiToken`·
 * `certNum`을 서버에 넘겨 인증을 확정하고 참여 폼으로 보낸다. 화면에 그릴 것이 없어
 * 모달만 있는 `CertResponse` 껍데기를 쓴다.
 *
 * ⚠️ **이미 인증을 시도했다면 아무것도 렌더하지 않는다.** 뒤로가기로 이 URL에 다시
 * 들어오면 중복 인증 요청이 나가기 때문이다.
 *
 * ⚠️ 레거시 핸들러 안의 `if (isTriedVerification) moveToDetail()`은 **`return`이 없어**
 * 이동 후에도 mutation이 나가는 코드였다. 다만 위 조건 때문에 컴포넌트 자체가 렌더되지
 * 않아 **도달할 수 없다** — 죽은 분기라 옮기지 않았다 (`survey.md` §SV5). 투표(VT5)와 구조가 완전히 같다.
 */
export const SurveyCertPassResponsePage = () => {
  const [searchParams] = useSearchParams()
  const { patchSurveyCertPassMutation } = usePatchSurveyCertPass()
  const { goToDetail } = useSurveyCertNavigation()

  const surveyCertInfo = useSurveyCertStore((state) => {
    return state.surveyCertInfo
  })
  const setSurveyCertInfo = useSurveyCertStore((state) => {
    return state.setSurveyCertInfo
  })

  if (surveyCertInfo.isTriedVerification) return null

  return (
    <CertResponse
      onCertResponse={() => {
        setSurveyCertInfo({ isTriedVerification: true })
        patchSurveyCertPassMutation({
          apiToken: searchParams.get('apiToken') ?? '',
          certNum: searchParams.get('certNum') ?? '',
        })
      }}
      // 쿼리스트링 없이 직접 들어온 경우다. 상세로 되돌린다
      onAccessDenied={goToDetail}
    />
  )
}
