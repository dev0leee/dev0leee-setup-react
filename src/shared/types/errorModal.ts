/** SweetAlert2에서 실제로 쓰인 아이콘 2종 (`error` 기본, 전출 안내 1곳만 `info`) */
export type ErrorModalIcon = 'error' | 'info'

export interface ErrorModalOptions {
  /** 본문 텍스트. 기본값은 레거시 문구 그대로 */
  text?: string
  /**
   * 본문 HTML. `text`보다 우선한다 (SweetAlert2 동작).
   * 게시판 제한 안내 8곳이 `<br/>`을 넣기 위해 쓴다. DOMPurify로 살균해 렌더한다.
   */
  html?: string
  icon?: ErrorModalIcon
  confirmButtonText?: string
  /** 확인 버튼을 눌렀을 때만 실행된다. 배경 클릭·Esc로 닫으면 실행되지 않는다 */
  callback?: (() => void) | null
}

export interface ErrorModalState {
  current: ErrorModalOptions | null
  open: (options: ErrorModalOptions) => void
  confirm: () => void
  dismiss: () => void
}
