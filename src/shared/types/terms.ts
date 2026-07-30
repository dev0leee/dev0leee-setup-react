/** 약관 한 건 */
export interface TermsItem {
  /** 체크 상태 맵의 키이자 `label`의 `htmlFor`. `/termsOfUse/{id}` 경로에도 쓰인다 */
  id: string
  /** 동의 체크박스에 붙는 문구. `~ 동의`로 끝난다 */
  label: string
  required: boolean
  /** 약관 자체의 이름. 목록 화면과 동의 토스트가 이것을 쓴다 (`label` 아님) */
  title: string
}

export interface TermsCheckboxListProps {
  items: TermsItem[]
  /** `item.id` → 체크 여부 */
  checkedMap: Record<string, boolean>
  listClassName?: string
  textClassName?: string
  onChange: (checkedMap: Record<string, boolean>) => void
  onMoveDetail: (item: TermsItem) => void
}
