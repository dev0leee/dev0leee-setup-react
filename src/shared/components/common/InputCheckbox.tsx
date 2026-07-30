import type { InputCheckboxProps } from '@/shared/types/input'

/**
 * 체크박스. 레거시 `InputCheckbox.vue`.
 *
 * 네이티브 체크박스를 숨기고 **배경 이미지 SVG 두 장**으로 상태를 그린다
 * (`CheckBox.svg` / `FillCheckBox.svg`). shadcn `checkbox`는 아이콘을 SVG 컴포넌트로
 * 그려 모양이 다르므로 쓰지 않았다.
 *
 * 레거시는 내부 `ref`로 상태를 들고 있었지만 제어 컴포넌트로 만들었다 —
 * 부모가 값을 알아야 하는데 emit으로만 알리면 두 곳에 상태가 생긴다.
 */
export const InputCheckbox = ({ id, checked, onChange }: InputCheckboxProps) => {
  return (
    <div>
      <input
        id={id}
        type="checkbox"
        className="hidden"
        checked={checked}
        onChange={(event) => {
          onChange(event.target.checked)
        }}
      />
      <label
        htmlFor={id}
        className={`inline-block h-5 w-5 bg-cover ${
          checked
            ? 'bg-[url(/assets/icons/FillCheckBox.svg)]'
            : 'bg-[url(/assets/icons/CheckBox.svg)]'
        }`}
      />
    </div>
  )
}
