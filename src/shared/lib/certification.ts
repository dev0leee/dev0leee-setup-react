import { API_PREFIX } from '@/shared/constants/api'
import { publicApi } from '@/shared/lib/apiClient'
import type { ServerSuccessBody } from '@/shared/types/api'
import type { CertificationField, KmcType } from '@/shared/types/cert'

/**
 * KMC 본인인증 하부구조. 레거시 `api/auth.js`의 `getCertificationField` 이식.
 *
 * **`shared/lib/`에 두는 이유**: 회원가입·버전1 전환·투표·설문 **네 도메인**이 같은
 * 인증 창구를 쓴다. 특정 도메인의 규칙이 아니라 "본인인증은 KMC를 거친다"는
 * 앱 전체의 사실이다 (`recipe.md` §2). `aptContext.ts`와 같은 성격이다.
 */

/**
 * KMC 인증 사이트 주소. **레거시가 하드코딩했다.**
 * 환경변수가 아니라 코드 상수인 것까지 그대로 옮긴다 — 환경별로 다르지 않다.
 */
export const KMC_REQUEST_URL = 'https://www.kmcert.com/kmcis/web/kmcisReq.jsp'

/** 인증 폼에 필요한 서버 발급 필드를 받아온다 */
export const fetchCertificationField = async ({
  type,
}: {
  type: KmcType
}): Promise<CertificationField | undefined> => {
  const response = await publicApi.get<ServerSuccessBody<CertificationField>>(
    `${API_PREFIX.APARTMANT}/kmc`,
    { params: { type } },
  )

  return response.data.success
}
