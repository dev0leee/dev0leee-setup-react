import { SURVEY_STATE } from '@/features/survey/types/survey'
import type { ChipColor } from '@/shared/types/chip'

/** 설문조사 상수. 레거시 `constants/domain/survey.js` 전문 이식 */

/**
 * 상태 칩 3종.
 *
 * ⚠️ **키가 `state`다** — 투표의 같은 표는 `status`이고 서버 필드도 `voteStatus`다.
 */
export const STATUS_LIST: { state: string; label: string; color: ChipColor }[] = [
  { state: SURVEY_STATE.PENDING, label: '시작전', color: 'gray' },
  { state: SURVEY_STATE.PROGRESS, label: '진행중', color: 'blue' },
  { state: SURVEY_STATE.CLOSE, label: '종료', color: 'darkGray' },
]

export const LIST_PAGE_FILTER_LIST = [
  { uuid: SURVEY_STATE.PENDING, category: '시작전' },
  { uuid: SURVEY_STATE.PROGRESS, category: '진행중' },
  { uuid: SURVEY_STATE.CLOSE, category: '종료' },
]

export const PARTICIPANT_STATE_LABEL: Record<string, string> = {
  PENDING: '미완료',
  PARTICIPATED: '참여완료',
  NOT_PARTICIPATED: '설문불참',
}

/**
 * SV1 카드의 필드 3줄.
 *
 * ⚠️ **투표에는 있는 `유형`이 없다** — 설문에는 유형 구분이 없다.
 * ⚠️ **키와 서버 필드명이 다르다** — `openSurveyDateTime` 키로 `startDateTime`을 읽는다.
 */
export const LIST_ITEM_FIELD = [
  { key: 'participantStatus', label: '참여상태' },
  { key: 'openSurveyDateTime', label: '설문 시작 일시' },
  { key: 'closeSurveyDateTime', label: '설문 종료 일시' },
] as const

/** SV2 기본정보 3줄. **투표는 4줄**이다(유형이 하나 더 있다) */
export const DETAIL_PAGE_INFO_FIELD = [
  { key: 'period', label: '설문 기간', iconPath: 'CalendarDate' },
  { key: 'joinState', label: '참여 상태', iconPath: 'User' },
  { key: 'content', label: '상세내용', iconPath: 'InfoCircleDarkGray' },
] as const

export const SURVEY_MESSAGE = {
  listEmpty: '등록된 설문이 없습니다',
  infoTitle: '설문 기본정보',
  joinButton: '참여하기',
  participated: '참여완료',
  closed: '종료',
} as const
