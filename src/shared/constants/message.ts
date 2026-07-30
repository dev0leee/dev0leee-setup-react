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

/** 에러 모달의 기본 본문. 레거시 `swalErrorModal`의 `text` 기본값 그대로. */
export const DEFAULT_ERROR_MODAL_TEXT = '에러가 발생했습니다. 잠시 후 다시 시도해주세요.'

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
