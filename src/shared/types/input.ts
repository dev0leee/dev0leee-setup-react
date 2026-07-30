export interface InputCheckboxProps {
  /** `label`의 `htmlFor`와 짝이다. 화면에 여러 개 있으면 반드시 달라야 한다 */
  id: string
  checked: boolean
  onChange: (checked: boolean) => void
}

/** 레거시 InputBase가 실제로 받던 type들 */
export type InputBaseType = 'text' | 'tel' | 'number' | 'email' | 'date' | 'time'

export interface InputBaseProps {
  /** ⚠️ `'carNum'`이면 공백을 제거한다. id로 도메인을 판별하는 레거시 규칙이다 */
  id: string
  name?: string
  type?: InputBaseType
  /** `type="number"`일 때는 숫자, 나머지는 문자열 */
  value: string | number | undefined
  placeholder?: string
  maxLength?: number
  isRequired?: boolean
  isDisabled?: boolean
  className?: string
  onChange: (value: string | number | undefined) => void
  onBlur?: () => void
}

export interface InputPasswordProps {
  id: string
  value: string
  placeholder?: string
  maxLength?: number
  isRequired?: boolean
  isDisabled?: boolean
  className?: string
  onChange: (value: string) => void
  onBlur?: () => void
}

export interface InputSearchProps {
  id: string
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  /**
   * 읽기 전용. 이때 버튼의 `type`이 `submit`이 아니라 `button`이 된다 —
   * 검색창을 눌러 다른 화면으로 보내는 용도로 쓰기 때문이다.
   */
  isReadonly?: boolean
  placeholder?: string
}
