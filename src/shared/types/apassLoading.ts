/** A-PASS 토글 진행 플래그. 네이티브 뒤로가기가 이 값을 읽는다 */
export interface ApassLoadingState {
  isApassLoading: boolean
  setIsApassLoading: (isApassLoading: boolean) => void
}
