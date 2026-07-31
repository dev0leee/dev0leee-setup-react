/**
 * 설문조사 타입. **투표(vote)와 대칭이지만 필드 이름이 다르다** — 설문은 `state`·
 * `startDateTime`·`endDateTime`, 투표는 `voteStatus`·`voteOpenDateTime`·`voteCloseDateTime`이다.
 * 서버 계약이라 통일하지 않는다.
 */

export const SURVEY_STATE = {
  PENDING: 'PENDING',
  PROGRESS: 'PROGRESS',
  CLOSE: 'CLOSE',
} as const

export const PARTICIPANT_STATE = {
  PENDING: 'PENDING',
  PARTICIPATED: 'PARTICIPATED',
  NOT_PARTICIPATED: 'NOT_PARTICIPATED',
} as const

/** ⚠️ **투표에 없는 `NONE`이 있다** — 인증 없이 바로 참여하는 설문이다 */
export const SURVEY_AUTH_TYPE = {
  NONE: 'NONE',
  PASS: 'PASS',
  NAME_PHONE: 'NAME_PHONE',
} as const

/** ⚠️ **투표에 없는 `SUBJECTIVE`(서술형)가 있다** */
export const SURVEY_QUESTION_TYPE = {
  SINGLE_CHOICE: 'SINGLE_CHOICE',
  MULTIPLE_CHOICE: 'MULTIPLE_CHOICE',
  SUBJECTIVE: 'SUBJECTIVE',
} as const

/** 목록 1건 (SV1) */
export interface SurveyListItemData {
  surveyUuid: string
  participantUuid: string
  state?: string
  groupName?: string | null
  title?: string | null
  respondentState?: string
  startDateTime?: string
  endDateTime?: string
}

/** 상세 (SV2·SV9). **비인증 API**라 비회원도 같은 응답을 받는다 */
export interface SurveyDetailInfoData {
  surveyUuid?: string
  participantUuid?: string
  state?: string
  respondentState?: string
  groupName?: string | null
  title?: string | null
  /** Quill Delta JSON 문자열 */
  content?: string | null
  startDateTime?: string
  endDateTime?: string
  authFlag?: boolean
  authType?: string
  dong?: string
  ho?: string
}

/**
 * 참여 폼의 선택지 1개 (SV3).
 *
 * ⚠️ **`type === 'SUBJECTIVE'`이면 기타 옵션**이다 — 선택하면 인라인 입력이 열린다.
 * 투표에는 없는 개념이다.
 */
export interface SurveyFormOption {
  uuid: string
  content?: string | null
  type?: string
}

/**
 * 참여 폼의 질문 1개 (SV3).
 *
 * ⚠️ **서버 필드가 `type`이고 폼 필드는 `questionType`이다.** 초기값을 만들 때 옮겨 담는다.
 * ⚠️ **`requiredFlag`로 질문마다 필수 여부가 갈린다** — 투표는 전 질문 필수다.
 */
export interface SurveyFormQuestionData {
  uuid: string
  content?: string | null
  type?: string
  requiredFlag?: boolean
  /** 이 질문에 기타 옵션이 있는지 */
  etcFlag?: boolean
  minChoice?: number
  maxChoice?: number
  optionList?: SurveyFormOption[]
}
