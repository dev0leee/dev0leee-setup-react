/** 검색 입력 debounce. 레거시 `useDebounceFn(fn, 500)` */
export const SEARCH_DEBOUNCE_MS = 500

/**
 * 목록 빈 상태 문구. **마침표 유무가 화면마다 다르다** — 레거시 그대로 옮긴다
 * (`board.md` §5-14).
 */
export const BOARD_EMPTY_TEXT = {
  /** B1 — 마침표 있음 */
  NOTICE: '공지사항이 존재하지 않습니다.',
  /** B3 — 화면 이름은 `아파트먼트 공지사항`인데 문구는 `전체 공지사항`이다 */
  GLOBAL_NOTICE: '전체 공지사항이 존재하지 않습니다.',
} as const

/** 본문·제목이 비었을 때 표시. **띄어쓰기가 없다** */
export const EMPTY_CONTENT_TEXT = '정보없음'

/** B1 전용 스크롤 위치 저장 키. 다른 목록의 공용 키(`scrollRestoration`)와 분리돼 있다 */
export const NOTICE_SCROLL_STORAGE_KEY = 'notice_board_scroll'

/** B21 `오늘 하루 보지 않기` 쿠키. 투표 팝업과 충돌하지 않도록 전용 키를 쓴다 */
export const NOTICE_POPUP_HIDE_COOKIE = 'noticePopupHideToday'
