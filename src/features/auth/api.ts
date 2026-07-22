import { api, REFRESH_ENDPOINT } from '@/api/client'
import type { User } from '@/features/auth/types'

interface SessionResponse {
  accessToken: string
  user: User
}

export interface LoginPayload {
  email: string
  password: string
}

/** Access Token은 body로, Refresh Token은 Set-Cookie로 내려온다. */
export async function login(payload: LoginPayload): Promise<SessionResponse> {
  const { data } = await api.post<SessionResponse>('/login', payload)
  return data
}

/**
 * 새로고침으로 사라진 메모리 Access Token을 RT 쿠키로 복원한다.
 * 서버는 RTR을 수행하고 새 RT를 Set-Cookie로 내려준다.
 */
export async function restoreSession(): Promise<SessionResponse> {
  const { data } = await api.post<SessionResponse>(REFRESH_ENDPOINT)
  return data
}

/** 서버에서 Refresh Token을 폐기하고 쿠키를 삭제한다. */
export async function logout(): Promise<void> {
  await api.post('/logout')
}
