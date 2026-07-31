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

/**
 * 상세 화면 AppBar 제목.
 * ⚠️ **민원은 `상세`가 없고 공백까지 들어간다** — 소통과 대칭이 아니다 (§4 #4).
 */
export const BOARD_DETAIL_APP_BAR_TITLE = {
  community: '소통공간 상세',
  complaints: '민원 공간',
} as const

/** 좋아요 버튼 라벨 (§4 #5) */
export const BOARD_LIKE_LABEL = {
  community: '좋아요',
  complaints: '동의해요',
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

/** 성공 토스트 문구. **마침표가 없다** */
export const BOARD_TOAST_MESSAGE = {
  create: '등록되었습니다',
  delete: '삭제되었습니다',
  reported: '신고되었습니다',
  edit: '수정되었습니다',
  blocked: '차단되었습니다',
  unblocked: '차단 해제되었습니다',
} as const

/** 이미지 첨부 실패 안내. `useCommentImageList`가 실패 종류로 고른다 */
export const BOARD_IMAGE_TOAST_MESSAGE = {
  countLimit: '이미지는 최대 5장까지만 첨부할 수 있습니다',
  sizeLimit: '파일 사이즈는 10M 이하만 업로드 가능 합니다',
  fileTypeLimit: '이미지만 첨부 가능합니다',
} as const

export type BoardImageErrorType = keyof typeof BOARD_IMAGE_TOAST_MESSAGE

/** 게시판 mutation이 특별히 다루는 서버 에러코드 */
export const BOARD_ERROR_CODE = {
  FILE_UPLOAD_FAIL: 'BOARD_FILE_UPLOAD_FAIL',
  BLACK_LIST: 'BOARD_BLACK_LIST',
} as const

export const BOARD_ERROR_MESSAGE = {
  FILE_UPLOAD_FAIL: '파일 업로드에 실패하였습니다.',
  /** ⚠️ HTML이다. 줄바꿈을 위해 `showErrorModal({ html })`로 넘긴다 */
  BLACK_LIST_HTML: '게시판 사용이 제한된 사용자입니다.<br/>관리사무소로 문의해 주세요.',
} as const

// ── 상세 화면 오버레이 ───────────────────────────────────────────────────────

/** 더보기 드로어 — 작성자 본인 */
export const DETAIL_MORE_AUTHOR = {
  EDIT: { key: 'edit', label: '수정', color: 'text-defaults-secondary-text-secondary' },
  DELETE: { key: 'delete', label: '삭제', color: 'text-alerts-error-text-error' },
} as const

/** 더보기 드로어 — 열람자 */
export const DETAIL_MORE_VIEWER = {
  BLOCK: {
    key: 'userBlock',
    label: '이 사용자의 글 보지 않기',
    color: 'text-defaults-secondary-text-secondary',
  },
  REPORT: {
    key: 'postReport',
    label: '게시글 신고하기',
    color: 'text-alerts-error-text-error',
  },
} as const

export const DETAIL_DELETE_MODAL_DATA = {
  title: '삭제하기',
  description: '삭제하시겠습니까?',
  firstButton: '취소',
  secondButton: '삭제',
}

export const detailBlockModalData = ({ authorName }: { authorName: string }) => {
  return {
    title: '이 사용자의 글 보지 않기',
    description: [`${authorName}님의 모든 게시글을`, '보지 않으시겠어요?'],
    firstButton: '취소',
    secondButton: '안보기',
  }
}

/** 민원 수정·삭제 차단 안내. `RECEIVED`가 아닌 상태에서만 뜬다 */
export const complaintsNonEditableModalData = ({ status }: { status?: string }) => {
  const isInProgress = status === 'IN_PROGRESS'

  return {
    title: isInProgress ? '처리중' : '처리완료',
    description: `${isInProgress ? '처리중인' : '처리완료된'} 민원은 수정 및 삭제할 수 없습니다`,
    firstButton: '확인',
  }
}

export const EDIT_BACK_MODAL_DATA = {
  title: '수정 그만두기',
  description: ['수정을 그만두시겠습니까?', '변경된 내용은 저장되지 않습니다'],
  firstButton: '취소',
  secondButton: '그만두기',
}

/** 댓글 입력창에 이미지를 붙여넣으려 할 때 */
export const PASTE_BLOCKED_MESSAGE = '텍스트 이외에는 붙여넣을 수 없습니다.'

// ── 글 등록·수정 폼 ─────────────────────────────────────────────────────────

/**
 * 작성 중 뒤로가기 확인. **이사예약(MH3)과 문구가 같아 `shared/constants/message.ts`로
 * 올렸다** — feature 간 직접 참조를 만들지 않으려는 조치다. 여기서는 재수출만 한다.
 */
export { WRITE_BACK_MODAL_DATA } from '@/shared/constants/message'

/** 민원공간 비밀글 안내. `확인`을 눌러야 체크된다 */
export const WRITE_PRIVATE_MODAL_DATA = {
  title: '비밀글 설정하기',
  description: [
    '민원공간에서 타인에게 노출되지 않으며,',
    '관리사무소와 작성자만 확인할 수 있습니다',
  ],
  firstButton: '취소',
  secondButton: '확인',
}

/**
 * 폼 수동 검증 문구. **이것이 사용자가 보는 유일한 검증 메시지다** —
 * 레거시 zod 스키마의 메시지는 어디에도 렌더되지 않는다 (`board.md` §5-11).
 */
export const BOARD_FORM_VALIDATION_MESSAGE = {
  category: '게시글의 주제를 선택해주세요.',
  title: '제목을 입력해주세요.',
  content: '내용을 입력해주세요.',
} as const

export const BOARD_FORM_PLACEHOLDER = {
  category: '게시글의 주제를 선택해주세요',
  title: '제목을 입력해주세요',
  content: '선택한 주제의 게시글 내용을 작성해주세요',
} as const

/**
 * 게시글 첨부 제약. ⚠️ **댓글과 값이 다르다** (`board.md` §3-4):
 * 크기 상한이 **10,000,000 B**(댓글은 10,485,760 B)이고 **gif를 받는다**(댓글은 안 받는다).
 * 그래서 약 10.0~10.49MB 파일은 **댓글에는 올라가고 게시글에는 안 올라간다.**
 */
export const POST_IMAGE_LIMIT = {
  MAX_COUNT: 5,
  MAX_SIZE: 10000000,
  ALLOWED_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'],
} as const

/** 신고 화면 (B20) */
export const REPORT_TEXT_MAX_LENGTH = 300

/** 미노출 사용자 관리 (B19) */
export const USER_BLOCK_TEXT = {
  EMPTY: '차단된 사용자가 없습니다.',
  BLOCKED: '게시글 안보는 중',
  UNBLOCKED: '게시글 안보기',
} as const

/** 댓글 첨부 제약. **게시글 폼과 값이 다르다** (`board.md` §3-4) */
export const COMMENT_IMAGE_LIMIT = {
  MAX_COUNT: 5,
  /** 10,485,760 B. 게시글 폼은 10,000,000 B다 */
  MAX_SIZE: 10 * 1024 * 1024,
  /** 게시글 폼과 달리 **gif가 없다** */
  ALLOWED_TYPES: ['image/jpeg', 'image/jpg', 'image/png'],
} as const

/** 본문·제목이 비었을 때 표시. **띄어쓰기가 없다** */
export const EMPTY_CONTENT_TEXT = '정보없음'

/** B1 전용 스크롤 위치 저장 키. 다른 목록의 공용 키(`scrollRestoration`)와 분리돼 있다 */
export const NOTICE_SCROLL_STORAGE_KEY = 'notice_board_scroll'

/** B21 `오늘 하루 보지 않기` 쿠키. 투표 팝업과 충돌하지 않도록 전용 키를 쓴다 */
export const NOTICE_POPUP_HIDE_COOKIE = 'noticePopupHideToday'
