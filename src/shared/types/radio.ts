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

/**
 * 세그먼트 라디오 항목.
 *
 * ⚠️ **`key`가 불리언일 수 있다.** 주차 월패드 알림이 `예`/`아니오`를 `true`/`false`로
 * 쓰고 그 값이 그대로 서버에 간다 (`parking.md` §PK5). 레거시는 타입이 없어 문자열·
 * 불리언을 섞어 썼다 — 제네릭으로 호출부마다 좁힌다.
 */
export interface RadioDualItem<TKey extends string | boolean = string> {
  key: TKey
  label: string
}

export interface InputRadioDualProps<TKey extends string | boolean = string> {
  /** 라디오 그룹 이름. `id`도 `${name}-${key}`로 만든다 */
  name: string
  list: readonly RadioDualItem<TKey>[]
  value: TKey | undefined
  onChange: (key: TKey) => void
  onBlur?: () => void
}
