/** 방문자 출입관리 쿼리 키. **문자열은 레거시 그대로다** (`query-keys.md`) */

/** V2 현재 키오스크 비밀번호. 단지와 입주민 uuid를 둘 다 쓴다 */
export const visitorPassPasswordQueryKey = ({
  aptUuid,
  aptResidentUuid,
}: {
  aptUuid: string | undefined
  aptResidentUuid: string | undefined
}) => {
  return ['visitorPassPassword', aptUuid, aptResidentUuid] as const
}

/** V4 임시 비밀번호 목록 */
export const tempPasswordListQueryKey = ({
  aptResidentUuid,
}: {
  aptResidentUuid: string | undefined
}) => {
  return ['lobbyPhoneTempPasswordList', aptResidentUuid] as const
}

/** V6 로비 QR. **키 이름이 `...QrServiceCode`다** — 레거시 그대로 유지한다 */
export const lobbyPhoneQrQueryKey = ({
  aptResidentUuid,
}: {
  aptResidentUuid: string | undefined
}) => {
  return ['lobbyPhoneQrServiceCode', aptResidentUuid] as const
}
