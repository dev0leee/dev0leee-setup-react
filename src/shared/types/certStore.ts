/**
 * 투표·설문 본인인증 정보.
 *
 * **`shared`에 두는 이유**: 네이티브 뒤로가기(`app/hooks/useNativeBackButton`)가
 * 이 값으로 되돌아갈 경로를 만든다. 앱 어디에서 눌러도 동작해야 하는 전역 관심사라
 * 도메인 슬라이스에 두면 **투표·설문 슬라이스 전체가 초기 번들에 끌려 들어온다**
 * (실측 408 kB → 548 kB). 저장 값 자체에는 도메인 로직이 없다.
 */

/** 전 필드 optional — 레거시 기본값이 `{}`다 */
export interface VoteCertInfo {
  voteUuid?: string
  voterUuid?: string
  /**
   * KMC 왕복 중복 방지 플래그. **상세(VT2·VT7)에 들어갈 때마다 `undefined`로 지운다** —
   * 다른 투표에 들어가면 인증을 다시 할 수 있어야 하기 때문이다.
   */
  isTriedVerification?: boolean
}

export interface VoteCertState {
  voteCertInfo: VoteCertInfo
  /** 기존 값에 병합한다 */
  setVoteCertInfo: (voteCertInfo: VoteCertInfo) => void
  initVoteCertInfo: () => void
}

/** 설문 본인인증 결과. 구조가 투표와 같다 */
export interface SurveyCertInfo {
  surveyUuid?: string
  participantUuid?: string
}

export interface SurveyCertState {
  surveyCertInfo: SurveyCertInfo
  /** 기존 값에 병합한다 */
  setSurveyCertInfo: (surveyCertInfo: SurveyCertInfo) => void
  initSurveyCertInfo: () => void
}
