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
  /** B5·B12·B11·B18 — **마침표가 없다** (공지 쪽에는 있다) */
  POST: '게시글이 존재하지 않습니다',
} as const

/**
 * AppBar 제목. ⚠️ **`민원 공간`(공백)과 `민원공간`(붙임)이 섞여 있다** —
 * AppBar만 공백이 있고 폼 제목·내 활동은 붙어 있다. 표시 문구라 그대로 옮긴다
 * (`board.md` §4 #3·#4·#15).
 */
export const BOARD_APP_BAR_TITLE = {
  community: '소통공간',
  complaints: '민원 공간',
} as const

/** 내 활동 화면 제목. 여기는 **둘 다 붙임**이다 (§4 #17) */
export const MY_ACTIVITY_APP_BAR_TITLE = {
  community: '소통공간 내 활동',
  complaints: '민원공간 내 활동',
} as const

/** 내 활동 탭. `key`가 어떤 목록을 조회할지 정한다 */
export const MY_ACTIVITY_TABS = [
  { label: '작성한 글', value: 'posts' },
  { label: '댓글 쓴 글', value: 'comments' },
] as const

/** 본문·제목이 비었을 때 표시. **띄어쓰기가 없다** */
export const EMPTY_CONTENT_TEXT = '정보없음'

/** B1 전용 스크롤 위치 저장 키. 다른 목록의 공용 키(`scrollRestoration`)와 분리돼 있다 */
export const NOTICE_SCROLL_STORAGE_KEY = 'notice_board_scroll'

/** B21 `오늘 하루 보지 않기` 쿠키. 투표 팝업과 충돌하지 않도록 전용 키를 쓴다 */
export const NOTICE_POPUP_HIDE_COOKIE = 'noticePopupHideToday'
