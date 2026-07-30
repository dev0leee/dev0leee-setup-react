/**
 * 투표 본인인증 결과. 전 필드 optional — 레거시 기본값이 `{}`다.
 * 뒤로가기 처리가 이 두 uuid로 상세 경로를 만든다.
 */
export interface VoteCertInfo {
  voteUuid?: string
  voterUuid?: string
}

export interface VoteCertState {
  voteCertInfo: VoteCertInfo
  /** 기존 값에 병합한다 */
  setVoteCertInfo: (voteCertInfo: VoteCertInfo) => void
  initVoteCertInfo: () => void
}
