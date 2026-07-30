export interface InputCheckboxProps {
  /** `label`의 `htmlFor`와 짝이다. 화면에 여러 개 있으면 반드시 달라야 한다 */
  id: string
  checked: boolean
  onChange: (checked: boolean) => void
}

/**
 * 레거시 InputBase가 실제로 받던 type들.
 *
 * `password`가 있는 이유: 비밀번호 변경 모달이 **`InputPassword`가 아니라
 * `InputBase type="password"`를 쓴다** — 눈 아이콘이 없는 입력이다
 * (`mypage.md` P3). 두 컴포넌트의 테두리·여백이 달라 바꿔 쓰면 화면이 어긋난다.
 */
export type InputBaseType = 'text' | 'tel' | 'number' | 'email' | 'date' | 'time' | 'password'

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
   * 읽기 전용 검색창을 눌렀을 때. 레거시는 컴포넌트에 `@click`을 달아 루트 요소로
   * 흘려보냈다(Vue fallthrough) — 회원가입 아파트 검색이 이 방식으로 모달을 연다.
   */
  onClick?: () => void
  /**
   * 읽기 전용. 이때 버튼의 `type`이 `submit`이 아니라 `button`이 된다 —
   * 검색창을 눌러 다른 화면으로 보내는 용도로 쓰기 때문이다.
   */
  isReadonly?: boolean
  placeholder?: string
}
