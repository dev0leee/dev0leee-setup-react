import { API_PREFIX } from '@/shared/constants/api'
import { api } from '@/shared/lib/apiClient'

/**
 * 로비폰 서버에 입주민 로그아웃을 알린다.
 *
 * 레거시는 `api/lobbyPhone.js`에 있었지만 **호출부가 로그아웃 하나뿐**이라
 * 인증 슬라이스로 옮겼다. 로비폰 도메인이 이관될 때 다른 호출부가 생기면
 * 그때 `shared`로 올린다 (feature 간 직접 import는 금지 — 01-folder-structure).
 */
export const putLobbyPhoneResidentLogout = async ({
  aptResidentUuid,
}: {
  aptResidentUuid: string
}): Promise<void> => {
  await api.put(`${API_PREFIX.APARTMANT}/${aptResidentUuid}/lobby-phone/logout`)
}
