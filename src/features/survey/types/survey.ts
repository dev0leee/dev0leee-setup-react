/** 설문 본인인증 결과. 전 필드 optional — 레거시 기본값이 `{}`다 */
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
