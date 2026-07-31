/** 투표 진행 상태 */
export const VOTE_STATE = {
  PENDING: 'PENDING',
  PROGRESS: 'PROGRESS',
  CLOSE: 'CLOSE',
} as const

/** 투표자(나)의 참여 상태 */
export const VOTER_STATE = {
  PENDING: 'PENDING',
  VOTED: 'VOTED',
  UN_VOTED: 'UN_VOTED',
} as const

/** 본인인증 방식. `PASS`는 KMC 외부 사이트, `NAME_PHONE`은 앱 안에서 처리한다 */
export const AUTH_TYPE = {
  PASS: 'PASS',
  NAME_PHONE: 'NAME_PHONE',
} as const

export const QUESTION_TYPE = {
  SINGLE_CHOICE: 'SINGLE_CHOICE',
  MULTIPLE_CHOICE: 'MULTIPLE_CHOICE',
} as const

/**
 * 목록 1건 (VT1).
 *
 * ⚠️ **날짜 필드 이름이 목록과 상세에서 다르다** — 목록은 `openVoteDateTime`,
 * 상세는 `voteOpenDateTime`이다. 서버 계약이라 그대로 쓴다.
 */
export interface VoteListItemData {
  voteUuid: string
  voterUuid: string
  voteStatus?: string
  groupName?: string | null
  title?: string | null
  voteType?: string
  voterStatus?: string
  openVoteDateTime?: string
  closeVoteDateTime?: string
}

/** 상세 정보 (VT2·VT7). **비인증 API**라 비회원도 같은 응답을 받는다 */
export interface VoteDetailInfo {
  voterUuid?: string
  voteUuid?: string
  voteStatus?: string
  voterStatus?: string
  voteType?: string
  voteGroupName?: string | null
  title?: string | null
  /** Quill Delta JSON 문자열 */
  content?: string | null
  voteOpenDateTime?: string
  voteCloseDateTime?: string
  /** 본인인증을 마쳤는지 */
  authFlag?: boolean
  voteAuthType?: string
  dong?: string
  ho?: string
}

/** 결과 화면의 선택지 1개 */
export interface VoteResultOption {
  uuid?: string
  content?: string | null
  optionCount?: number
  fileList: { fileUuid: string; fileUrl: string; fileName: string }[]
}

/** 결과 화면의 질문 1개 */
export interface VoteResultQuestion {
  uuid: string
  content?: string | null
  questionType?: string
  /** 비율의 분모. **복수응답이면 응답자 수보다 클 수 있다** (VT-Q6) */
  questionFullCount?: number
  questionOptionList?: VoteResultOption[]
}

/** 투표 현황 (VT2 `투표 현황` 탭). **회원 전용 API**다 */
export interface VoteDetailStatus {
  voteStatus?: string
  fullVoterCount?: number
  voteRate?: number
  votedCount?: number
  notVotedCount?: number
  questionList?: VoteResultQuestion[]
}
