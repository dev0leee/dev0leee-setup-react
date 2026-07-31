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
