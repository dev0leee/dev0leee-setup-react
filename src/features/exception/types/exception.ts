/**
 * 에러 화면이 받는 라우터 state. 레거시는 `window.history.state`에서 읽었고
 * react-router에서는 `useLocation().state`가 같은 자리다.
 *
 * 두 값 모두 없을 수 있다 — 사용자가 `/error`를 직접 열면 상세 줄이 나오지 않는다.
 */
export interface ErrorLocationState {
  errorCode?: string
  message?: string
}
