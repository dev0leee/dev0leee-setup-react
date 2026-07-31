/** 점검 응답 3종 (서버 enum `FireInspectionQuestionAnswer`) */
export const FIRE_INSPECTION_ANSWER = {
  NORMAL: 'NORMAL',
  DEFECTIVE: 'DEFECTIVE',
  NOT_APPLICABLE: 'NOT_APPLICABLE',
} as const

export type FireInspectionAnswer =
  (typeof FIRE_INSPECTION_ANSWER)[keyof typeof FIRE_INSPECTION_ANSWER]

/** 제출 상태 4종 (서버 enum `FireInspectionSubmissionStatus`) */
export const FIRE_INSPECTION_SUBMISSION_STATUS = {
  /** 점검 기간 전 */
  BEFORE_START: 'BEFORE_START',
  /** 기간 중 미제출 — **유일하게 점검을 시작할 수 있는 상태** */
  NOT_SUBMITTED: 'NOT_SUBMITTED',
  /** 제출 완료 — 상세 조회가 열린다 */
  SUBMITTED: 'SUBMITTED',
  /** 기간이 끝났는데 참여하지 않음 */
  NOT_PARTICIPATED: 'NOT_PARTICIPATED',
} as const

export type FireInspectionSubmissionStatus =
  (typeof FIRE_INSPECTION_SUBMISSION_STATUS)[keyof typeof FIRE_INSPECTION_SUBMISSION_STATUS]

/** 점검표 항목 하나. **문항이 서버가 아니라 여기 있다** */
export interface InspectionItem {
  itemId: number
  /** 서버 enum. 제출 페이로드에 그대로 실린다 */
  questionId: string
  label: string
  description: string
  /** 있는 항목에만 도움말 아이콘이 뜬다 — 21개 중 2개뿐이다 */
  tooltipText?: string
}

/** 점검표 카테고리 하나 */
export interface InspectionCategory {
  categoryId: number
  /** ⚠️ `categoryId`와 **항상 같다** (레거시 중복 필드). 화면 배지에 쓰인다 */
  categoryNumber: number
  categoryName: string
  /** 설비 대분류. **화면에는 쓰이지 않고 제출 페이로드에만 들어간다** */
  sectionId: string
  groupId: string
  /** 있는 카테고리에만 헤더 도움말 아이콘이 뜬다 — 10개 중 2번 하나뿐이다 */
  description?: string
  items: InspectionItem[]
}

/** 점검 회차 (#137) */
export interface FireInspectionStatusData {
  fireInspectionUuid: string
  householdFireInspectionUuid?: string
  submissionStatus?: FireInspectionSubmissionStatus
  startDate?: string
  endDate?: string
  submissionDateTime?: string
}

/** 제출된 답 하나 */
export interface FireInspectionQuestionAnswer {
  questionId: string
  answer: FireInspectionAnswer
}

/** 점검 상세 (#139) */
export interface FireInspectionDetailData {
  submissionDateTime?: string
  questionAnswerList?: FireInspectionQuestionAnswer[]
}

/** 제출 페이로드의 답 하나. **4필드가 그대로 `FormData` 키가 된다** */
export interface FireInspectionAnswerPayload {
  sectionId: string
  groupId: string
  questionId: string
  answer: FireInspectionAnswer
}
