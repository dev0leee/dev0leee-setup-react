/** 라디오 항목 한 건 */
export interface RadioItem {
  key: string
  label: string
}

/** 목록형 라디오 항목. 개별 비활성이 가능하다 */
export interface RadioListItem extends RadioItem {
  disabled?: boolean
}

export type RadioRoundType = 'square' | 'round' | 'round-square' | 'full'

export interface InputRadioListProps {
  name: string
  list: RadioListItem[]
  value: string | undefined
  roundType?: RadioRoundType
  /** `grid`면 3열로 배치한다 */
  width?: 'full' | 'grid'
  /** 비선택 상태의 글자색을 덮는다 */
  textColor?: string
  disabled?: boolean
  /** 왼쪽에 체크박스 SVG를 붙이고 좌측 정렬로 바꾼다 (소방 자가점검표) */
  showCheckbox?: boolean
  checkboxOnImage?: string
  checkboxOffImage?: string
  /** 지정하면 기본 크기(`h-10 px-4 py-3`)를 **대체**한다 */
  className?: string
  onChange: (key: string) => void
  onBlur?: () => void
}

export interface InputRadioDualProps {
  /** 라디오 그룹 이름. `id`도 `${name}-${key}`로 만든다 */
  name: string
  list: RadioItem[]
  value: string | undefined
  onChange: (key: string) => void
  onBlur?: () => void
}
