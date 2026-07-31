import type { ModalData } from '@/shared/types/overlay'

/**
 * 네트워크 단절 안내. apiErrors의 isNetworkError(status 0)와 짝이다.
 *
 * 문구는 레거시 라우터 가드의 오프라인 토스트와 **한 글자까지 같다**.
 * 마침표가 없는 것이 원본이다 (`router/index.js:154`) — `routes.md` §6은
 * 마침표를 붙여 인용했지만 코드가 기준이다.
 */
export const NETWORK_ERROR_MESSAGE = '네트워크 상태를 확인해주세요'

/** 자동 로그인 실패로 대기 요청을 거부할 때의 에러 메시지. 레거시 문구 그대로. */
export const AUTO_LOGIN_FAILED_MESSAGE = '자동 로그인 실패'

/**
 * 세대 전출 안내. `RESIDENT_NOT_FOUND` 응답을 받았을 때 뜬다.
 * 레거시에서 **유일하게 `icon: 'info'`를 쓰는 모달**이다 (`useGetResidentDetailInfo.js`).
 */
export const MOVED_OUT_MESSAGE = '세대에서 전출되었습니다.'

/** 에러 모달의 기본 본문. 레거시 `swalErrorModal`의 `text` 기본값 그대로. */
export const DEFAULT_ERROR_MODAL_TEXT = '에러가 발생했습니다. 잠시 후 다시 시도해주세요.'

/**
 * 작성 중 뒤로가기 확인. **게시판과 이사예약이 함께 쓴다.**
 *
 * 레거시는 `constants/domain/board.js`에 있는 것을 이사예약이 직접 가져다 썼다 —
 * feature 간 직접 참조라 `import/no-restricted-paths`가 막는다. 두 도메인이 문구까지
 * 같으니 여기로 올렸다 (`moving-house.md` MH3).
 */
export const WRITE_BACK_MODAL_DATA: ModalData = {
  title: '작성 그만두기',
  description: ['작성을 그만두시겠습니까?', '변경된 내용은 저장되지 않습니다'],
  firstButton: '취소',
  secondButton: '그만두기',
}

/** 본인인증 콜백에 쿼리스트링이 없을 때. 레거시 `ACCESS_DENIED_MODAL_DATA` 그대로 */
export const ACCESS_DENIED_MODAL_DATA = {
  description: '잘못된 접근입니다',
  firstButton: '확인',
} as const

/** 토스트 지속 시간. 레거시 `useToast`의 기본값. */
export const TOAST_DURATION_MS = 3_000

/**
 * 모든 토스트가 공유하는 id.
 * 레거시는 화면에 토스트가 **하나뿐**이라 연달아 부르면 앞의 것이 교체됐다.
 * 고정 id를 주면 sonner도 같은 동작이 된다.
 */
export const TOAST_ID = 'app-toast'

/**
 * 가입 에러코드별 문구. **회원가입(`signup.md` S4)과 버전1 전환(`auth.md` A6)이
 * 같은 표를 쓴다** — 코드가 `shared/constants/errorCode.ts`의 `SIGNUP_ERROR_CODE`에
 * 있으므로 문구도 함께 둔다. 두 도메인의 차이는 문구가 아니라 그 뒤 처리다.
 */
export const SIGNUP_ERROR_MESSAGE = {
  RESIDENT_ALREADY_EXISTS: '이미 등록된 입주민입니다.',
  HOUSEHOLD_NOT_FOUND: '존재하지 않는 세대입니다.',
  HOUSEHOLD_HEAD_ALREADY_EXISTS: '이미 등록된 세대주가 존재합니다.',
  KMC_ERROR: '인증 유효시간이 만료됐습니다. 다시 시도해주세요.',
} as const
