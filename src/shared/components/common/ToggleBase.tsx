import type { ToggleBaseProps } from '@/shared/types/toggle'

/**
 * 스위치. 레거시 `ToggleBase.vue`.
 *
 * ⚠️ **제어 컴포넌트로 만들었다.** 레거시는 prop을 `ref`에 복사하고 `watch`로
 * 되돌리는 구조였는데, 그건 Vue에서 부모 값과 내부 값이 갈라지는 것을 사후에
 * 맞추는 패턴이다. React에서 같은 구조를 만들면 `useEffect`로 상태를 되돌리는
 * 안티패턴이 된다 (`06-react.md`). 부모가 값을 소유하면 어긋날 여지가 없다.
 *
 * shadcn `switch`를 쓰지 않았다 — 레거시가 `peer` + `after:` 의사요소로
 * 손잡이를 그리는데, 그 크기·테두리·전환 시간이 shadcn과 다르다.
 */
export const ToggleBase = ({
  toggleTitle = '',
  checked,
  disabled = false,
  onChange,
}: ToggleBaseProps) => {
  return (
    <label>
      <span className="text-nowrap">{toggleTitle}</span>
      <input
        type="checkbox"
        className="peer sr-only"
        checked={checked}
        disabled={disabled}
        onChange={(event) => {
          onChange(event.target.checked)
        }}
      />
      <div className="peer relative h-6 w-11 rounded-full bg-neutral-b-gray-200 peer-checked:bg-[#0037BE] after:absolute after:start-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-neutral-b-gray-300 after:bg-base-b-white after:transition-all after:duration-300 after:ease-in-out after:content-[''] peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full" />
    </label>
  )
}
