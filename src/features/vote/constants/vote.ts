import { VOTE_STATE } from '@/features/vote/types/vote'
import type { ChipColor } from '@/shared/types/chip'

/** 전자투표 상수. 레거시 `constants/domain/vote.js` 전문 이식 */

/** 상태 칩 3종. **목록과 상세가 같은 표를 쓴다** */
export const STATE_LIST: { status: string; label: string; color: ChipColor }[] = [
  { status: VOTE_STATE.PENDING, label: '시작전', color: 'gray' },
  { status: VOTE_STATE.PROGRESS, label: '진행중', color: 'blue' },
  { status: VOTE_STATE.CLOSE, label: '종료', color: 'darkGray' },
]

/**
 * VT1 필터 탭.
 *
 * ⚠️ **`{ uuid, category }` 모양이다** — `TabCategory`가 게시판 카테고리용으로 만든
 * 계약을 그대로 재사용한다. 여기서 `uuid`는 식별자가 아니라 `voteStatus` 값이다.
 */
export const LIST_PAGE_FILTER_LIST = [
  { uuid: VOTE_STATE.PENDING, category: '시작전' },
  { uuid: VOTE_STATE.PROGRESS, category: '진행중' },
  { uuid: VOTE_STATE.CLOSE, category: '종료' },
]

export const VOTER_STATUS: Record<string, string> = {
  PENDING: '미완료',
  VOTED: '투표완료',
  UN_VOTED: '투표불참',
}

export const VOTE_TYPE: Record<string, string> = {
  REPRESENT: '선거투표',
  NORMAL: '일반투표',
  AGAINST: '찬반투표',
  SURVEY: '설문조사',
}

/**
 * VT1 카드의 필드 4줄.
 *
 * ⚠️ **`투표 시작 일시 `의 끝에 공백이 하나 있다.** 화면에 그대로 나가는 문구라
 * 지우지 않는다 (`deferred.md` 「오타·표기」).
 */
export const LIST_ITEM_FIELD = [
  { key: 'voteType', label: '유형' },
  { key: 'voterStatus', label: '참여상태' },
  { key: 'openVoteDateTime', label: '투표 시작 일시 ' },
  { key: 'closeVoteDateTime', label: '투표 종료 일시' },
] as const

/** VT2 탭 2개. **시작 전이면 첫 번째만 보인다** */
export const DETAIL_PAGE_TAB_LIST = [
  { key: 'info', label: '투표 정보' },
  { key: 'result', label: '투표 현황' },
]

/** VT2 `투표 정보` 탭의 4줄. 아이콘 파일명이 곧 키다 */
export const DETAIL_PAGE_INFO_FIELD = [
  { key: 'period', label: '투표 기간', iconPath: 'CalendarDate' },
  { key: 'joinState', label: '참여 상태', iconPath: 'User' },
  { key: 'voteType', label: '투표 유형', iconPath: 'List' },
  { key: 'content', label: '상세내용', iconPath: 'InfoCircleDarkGray' },
] as const

/** VT2 `투표 현황` 탭의 집계 4칸 */
export const DETAIL_PAGE_INFO_STATUS_COUNT = [
  { key: 'fullVoterCount', label: '투표 대상' },
  { key: 'voteRate', label: '참여율' },
  { key: 'votedCount', label: '참여 인원' },
  { key: 'notVotedCount', label: '미참여 인원' },
] as const

export const VOTE_MESSAGE = {
  listEmpty: '등록된 투표가 없습니다',
  infoTitle: '투표 기본정보',
  countTitle: '투표 집계',
  resultTitle: '투표 결과',
  voteButton: '투표하기',
  voted: '투표완료',
  closed: '종료',
  multipleChoice: '(복수응답)',
  detailMore: '자세히 보기',
} as const
