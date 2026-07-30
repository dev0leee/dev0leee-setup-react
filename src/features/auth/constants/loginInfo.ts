/** 로그아웃 확인 모달. 레거시 `constants/domain/auth.js` 그대로 */
export const LOGOUT_MODAL_DATA = {
  description: '정말 로그아웃하시겠어요?',
  firstButton: '아니요',
  secondButton: '로그아웃',
} as const

/** 로그인 에러코드별 처리. `domain-codes.md` §1-2 · `auth-strategy.md` */
export const LOGIN_ERROR_MESSAGE = {
  /** 존재하지 않는 입주민·비밀번호 불일치·단지 없음이 같은 문구를 쓴다 */
  INVALID_CREDENTIAL: '아이디 또는 비밀번호가 일치하지 않습니다.',
  HOUSEHOLD_NOT_FOUND: '존재하지 않는 세대입니다.',
} as const
