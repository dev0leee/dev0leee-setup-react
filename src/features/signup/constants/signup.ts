import type { ModalData } from '@/shared/types/overlay'
import type { RadioItem } from '@/shared/types/radio'

/** 세대주 여부 라디오. 레거시는 이 배열을 화면 안에 인라인으로 뒀다 */
export const HOUSEHOLD_HEAD_OPTIONS: RadioItem[] = [
  { label: '세대주', key: 'householdHead' },
  { label: '세대원', key: 'householdMember' },
]

/** `householdHeadFlag` boolean을 만드는 기준값. 문자열 비교로 판정한다 */
export const HOUSEHOLD_HEAD_KEY = 'householdHead'

/** 입력 길이 제한. 레거시 `maxlength` 그대로 */
export const SIGNUP_MAX_LENGTH = {
  NAME: 10,
  NICK_NAME: 10,
  PASSWORD: 20,
  DONG: 5,
  HO: 5,
} as const

/** S3 뒤로가기 확인. 레거시 `USER_INFO_CLICK_BACK_MODAL_DATA` 그대로 */
export const USER_INFO_BACK_MODAL_DATA: ModalData = {
  description: ['본인인증이 취소됩니다.', '뒤로 가시겠습니까?'],
  firstButton: '취소',
  secondButton: '확인',
}

/** S4 뒤로가기 확인. 레거시 `APT_INFO_CLICK_BACK_MODAL_DATA` 그대로 */
export const APT_INFO_BACK_MODAL_DATA: ModalData = {
  description: ['작성 내용이 모두 지워집니다.', '뒤로 가시겠습니까?'],
  firstButton: '취소',
  secondButton: '확인',
}

/** 검색 모달 문구 */
export const APT_SEARCH_TEXT = {
  TITLE: '아파트 검색',
  EMPTY: '검색 결과가 없습니다',
  SELECT: '선택',
} as const
