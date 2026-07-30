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
