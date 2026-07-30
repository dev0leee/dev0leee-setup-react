import { API_PREFIX } from '@/shared/constants/api'
import { publicApi } from '@/shared/lib/apiClient'
import type { ServerSuccessBody } from '@/shared/types/api'
import type { LoginInfo } from '@/shared/types/resident'

/**
 * 미승인 입주민 정보 조회. 레거시 `api/auth.js`의 `getWaitingMemberLoginInfo` 이식.
 *
 * `shared/lib/`에 있는 이유는 `useWaitingMemberFcmToken`과 같다 — 로그인 실패 경로와
 * 회원가입 성공 경로가 **같은 창구**를 쓴다. 도메인 API가 아니라 FCM 등록 하부구조다.
 *
 * ⚠️ **아이디·비밀번호를 쿼리스트링으로 보낸다.** 히스토리·서버 로그·프록시에 평문으로
 * 남는다. 레거시 그대로 유지하기로 확정됐다
 * (`decisions/inventory-questions.md` E-Q2 · `deferred.md` D-16).
 * POST body 전환은 백엔드 협의가 필요하다.
 */
export const fetchWaitingMemberLoginInfo = async ({
  id,
  password,
}: {
  id: string
  password: string
}): Promise<LoginInfo | undefined> => {
  const response = await publicApi.get<ServerSuccessBody<LoginInfo>>(
    `${API_PREFIX.APARTMANT}/login/waiting-info`,
    { params: { id, password } },
  )

  return response.data.success
}
