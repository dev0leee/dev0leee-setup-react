import { API_PREFIX } from '@/shared/constants/api'
import { api } from '@/shared/lib/apiClient'

/**
 * 버전1 입주민 전환. 레거시 `api/auth.js`의 `postVersionOneResidentSignUp` 이식
 * (`endpoints.md` #5).
 *
 * ⚠️ **이 요청만 인증 인스턴스(`api`)를 쓴다.** 구버전 계정으로 이미 로그인이 끝난
 * 상태에서 v2 약관에 동의하고 본인인증을 거치는 흐름이라 토큰이 있다
 * (`decisions/inventory-questions.md` E-Q3).
 */
export const postVersionOneResidentSignUp = async ({
  apiToken,
  certNum,
}: {
  apiToken: string
  certNum: string
}): Promise<void> => {
  await api.post(`${API_PREFIX.APARTMANT}/old/sign-up`, { apiToken, certNum })
}
