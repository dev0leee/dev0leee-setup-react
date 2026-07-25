import type { LoginPayload, SessionResponse } from '@/features/auth/types/auth'
import { api, publicApi, REFRESH_ENDPOINT } from '@/shared/lib/apiClient'

/** Access Token은 body로, Refresh Token은 Set-Cookie로 내려온다. */
export const login = async (payload: LoginPayload): Promise<SessionResponse> => {
  // 아직 토큰이 없는 요청이라 publicApi를 쓴다 (03-api 규칙 1).
  const { data } = await publicApi.post<SessionResponse>('/login', payload)
  return data
}

/**
 * 새로고침으로 사라진 메모리 Access Token을 RT 쿠키로 복원한다.
 * 서버는 RTR을 수행하고 새 RT를 Set-Cookie로 내려준다.
 *
 * refresh 엔드포인트를 직접 부르므로 반드시 publicApi를 쓴다.
 * api로 보내면 401 시 인터셉터가 같은 엔드포인트로 또 refresh를 걸어 루프가 된다.
 */
export const restoreSession = async (): Promise<SessionResponse> => {
  const { data } = await publicApi.post<SessionResponse>(REFRESH_ENDPOINT)
  return data
}

/** 서버에서 Refresh Token을 폐기하고 쿠키를 삭제한다. */
export const logout = async (): Promise<void> => {
  await api.post('/logout')
}
