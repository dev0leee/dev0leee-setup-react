import type { LoginPayload, LoginResponseBody, LoginResult } from '@/features/auth/types/auth'
import { API_PREFIX } from '@/shared/constants/api'
import { api, publicApi } from '@/shared/lib/apiClient'
import { readHeader } from '@/shared/lib/responseHeaders'
import type { ServerSuccessBody } from '@/shared/types/api'
import type { LoginInfo } from '@/shared/types/resident'

/**
 * 로그인. 레거시 `api/auth.js`의 `postLogin`.
 *
 * ⚠️ **토큰이 body가 아니라 응답 헤더로 온다** (`authorization`, `refresh-token`).
 * 헤더를 읽는 책임은 여기서 끝내고, 호출부에는 도메인 값만 넘긴다.
 * 아직 토큰이 없는 요청이므로 `publicApi`를 쓴다.
 */
export const postLogin = async ({ id, password }: LoginPayload): Promise<LoginResult> => {
  const response = await publicApi.post<LoginResponseBody>(`${API_PREFIX.APARTMANT}/login`, {
    id,
    password,
  })

  return {
    accessToken: readHeader({ headers: response.headers, key: 'authorization' }),
    refreshToken: readHeader({ headers: response.headers, key: 'refresh-token' }),
    oldResidentFlag: response.data.success?.oldResidentFlag ?? false,
  }
}

/** 로그인 정보 조회. 단지 컨텍스트와 네이티브 발신 페이로드의 원천이다 */
export const getLoginInfo = async (): Promise<LoginInfo | undefined> => {
  const response = await api.get<ServerSuccessBody<LoginInfo>>(`${API_PREFIX.APARTMANT}/login/info`)
  return response.data.success
}

/**
 * 로그아웃. 레거시 `deleteLogout`.
 * refreshToken을 **헤더로** 보내 서버가 그 토큰을 폐기한다.
 */
export const deleteLogout = async ({ refreshToken }: { refreshToken: string }): Promise<void> => {
  await api.delete(`${API_PREFIX.APARTMANT}/logout`, {
    headers: { 'refresh-token': refreshToken },
  })
}
