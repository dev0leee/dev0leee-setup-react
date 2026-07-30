/**
 * 서비스 이름. `contentList`에서 단지의 서비스 보유 여부를 판정할 때 쓴다.
 *
 * ⚠️ 비교 전에 **`trim()`**을 해야 한다. `'로비폰'`에 공백이 섞여 오는 것을
 * 레거시가 `.trim()`으로 방어하고 있다 (`native-protocol.md` §N10).
 */
export const APT_SERVICE_NAME = {
  APASS: 'A-PASS',
  LOBBY_PHONE: '로비폰',
} as const

/** 로그인 에러코드별 처리. `domain-codes.md` §1-2 · `auth-strategy.md` */
export const LOGIN_ERROR_MESSAGE = {
  /** 존재하지 않는 입주민·비밀번호 불일치·단지 없음이 같은 문구를 쓴다 */
  INVALID_CREDENTIAL: '아이디 또는 비밀번호가 일치하지 않습니다.',
  HOUSEHOLD_NOT_FOUND: '존재하지 않는 세대입니다.',
} as const
