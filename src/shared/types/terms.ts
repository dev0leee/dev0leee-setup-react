/** 약관 한 건 */
export interface TermsItem {
  /** 체크 상태 맵의 키이자 `label`의 `htmlFor` */
  id: string
  label: string
  required: boolean
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
