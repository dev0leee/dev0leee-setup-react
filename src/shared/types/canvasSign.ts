export interface CanvasSignProps {
  /** 제출 중이면 두 버튼이 비활성화되고 저장 버튼에 스피너가 돈다 */
  isPending: boolean
  onSave: (payload: { file: File }) => void
}
