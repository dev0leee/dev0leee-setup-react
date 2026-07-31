/** 탭 한 건. `label`이 화면에 보이고 나머지는 호출부가 쓰는 값이다 */
export interface TabItem {
  label: string
  value?: string
}

export interface TabBaseProps {
  tabList: TabItem[]
  selectedIndex: number
  onSelect: (selected: { index: number; tab: TabItem }) => void
}

/** 카테고리 한 건. `uuid`가 없는 것은 '전체' 항목뿐이다 */
export interface TabCategoryItem {
  uuid?: string
  category: string
}

export interface TabCategoryProps {
  categories: TabCategoryItem[]
  /** `hasTotalType`이면 '전체'가 0번을 차지한다 */
  selectedIndex: number
  hasTotalType?: boolean
  /** 루트 `<ul>`에 얹힌다. Vue의 클래스 fallthrough 대신이다 (`board.md` B1의 `pb-6`) */
  className?: string
  onSelect: (selected: { index: number; category: TabCategoryItem }) => void
}
