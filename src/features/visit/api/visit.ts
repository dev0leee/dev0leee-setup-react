import type { VisitorPassPassword } from '@/features/visit/types/visit'
import { API_PREFIX } from '@/shared/constants/api'
import { api } from '@/shared/lib/apiClient'
import type { ServerSuccessBody } from '@/shared/types/api'

/**
 * 방문증 키오스크 · 로비폰 비밀번호 API.
 * 레거시 `api/kiosk.js` · `api/lobbyPhone.js`.
 *
 * ⚠️ **키오스크만 `aptUuid`와 `aptResidentUuid`를 둘 다 쓴다.** 로비폰은 입주민 uuid만
 * 쓴다 — 서버 경로 설계가 다르다.
 */

/** 키오스크 비밀번호 경로. 조회와 변경이 같은 경로를 쓰고 메서드만 다르다 */
const kioskPasswordPath = ({
  aptUuid,
  aptResidentUuid,
}: {
  aptUuid: string
  aptResidentUuid: string
}) => {
  return `${API_PREFIX.APARTMANT}/${aptUuid}/apt/household/kiosk/password/${aptResidentUuid}`
}

export const getVisitorPassPassword = async (params: {
  aptUuid: string
  aptResidentUuid: string
}): Promise<VisitorPassPassword | undefined> => {
  const response = await api.get<ServerSuccessBody<VisitorPassPassword>>(kioskPasswordPath(params))

  return response.data.success
}

export const putVisitorPassPassword = async ({
  password,
  ...params
}: {
  aptUuid: string
  aptResidentUuid: string
  password: string
}): Promise<void> => {
  await api.put(kioskPasswordPath(params), { password })
}

/** 로비폰 세대 비밀번호 변경 (V3) */
export const putLobbyPhonePassword = async ({
  aptResidentUuid,
  password,
}: {
  aptResidentUuid: string
  password: string
}): Promise<void> => {
  await api.put(`${API_PREFIX.APARTMANT}/${aptResidentUuid}/lobby-phone/password`, { password })
}
