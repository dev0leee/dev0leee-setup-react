import type { TempPassword, VisitorPassPassword } from '@/features/visit/types/visit'
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

/**
 * 임시 비밀번호 목록 (V4).
 *
 * ⚠️ **레거시 API 함수들이 인자를 객체가 아니라 **위치 인자**로 받는다** — 이 구획만
 * 그렇다(`getLobbyPhoneTempPasswordList(uuid)` · `postCreate...(data, uuid)`).
 * 타깃은 전부 객체로 통일한다 — 호출 결과는 같다.
 */
export const getTempPasswordList = async ({
  aptResidentUuid,
}: {
  aptResidentUuid: string
}): Promise<TempPassword[]> => {
  const response = await api.get<ServerSuccessBody<TempPassword[]>>(
    `${API_PREFIX.APARTMANT}/${aptResidentUuid}/lobby-phone/temp-password`,
  )

  return response.data.success ?? []
}

/** 임시 비밀번호 생성 (V5) */
export const postTempPassword = async ({
  aptResidentUuid,
  tempPasswordType,
  startDate,
  endDate,
  description,
}: {
  aptResidentUuid: string
  tempPasswordType: string
  startDate: string
  endDate: string
  description?: string
}): Promise<void> => {
  await api.post(`${API_PREFIX.APARTMANT}/${aptResidentUuid}/lobby-phone/temp-password`, {
    tempPasswordType,
    startDate,
    endDate,
    description,
  })
}

export const deleteTempPassword = async ({
  aptResidentUuid,
  uuid,
}: {
  aptResidentUuid: string
  uuid: string
}): Promise<void> => {
  await api.delete(`${API_PREFIX.APARTMANT}/${aptResidentUuid}/lobby-phone/temp-password/${uuid}`)
}

/**
 * 1회용 출입 QR의 암호화 문자열 (V6). 이 값이 그대로 QR로 그려진다.
 * 응답은 문자열 하나다.
 */
export const getLobbyPhoneQrData = async ({
  aptResidentUuid,
}: {
  aptResidentUuid: string
}): Promise<string | undefined> => {
  const response = await api.get<ServerSuccessBody<string>>(
    `${API_PREFIX.APARTMANT}/${aptResidentUuid}/lobby-phone/qr`,
  )

  return response.data.success
}
