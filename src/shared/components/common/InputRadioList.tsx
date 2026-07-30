import type { InputRadioListProps, RadioRoundType } from '@/shared/types/radio'
import { cn } from '@/shared/utils/cn'

/**
 * 목록형 라디오. 레거시 `InputRadioList.vue`(160 LOC).
 *
 * ⚠️ 레거시는 `name`이 있으면 vee-validate에 붙고 없으면 `v-model`로 도는
 * **이중 모드**였다. RHF에서는 폼이 값을 소유하므로 항상 제어 컴포넌트로 통일했다 —
 * 두 모드가 있으면 `currentValue`가 어디서 오는지 호출부마다 달라진다.
 * 렌더 결과는 같다.
 *
 * ⚠️ 선택 상태의 배경이 `bg-brand-default-background-brand-secondary`인데
 * **config에 없는 클래스라 배경이 칠해지지 않는다.** `brand.default`에는 `background-brand`만
 * 있고 `-secondary` 접미사가 없어 **대체할 토큰이 없다** → 클래스를 두지 않는다
 * (`broken-styles.md` §0 D그룹).
 *
 * 레거시 실측(`rgba(0,0,0,0)`)으로 확인했고, **선택 표시는 배경 없이도 보인다** —
 * 테두리 `#0037BE` + 글자 `#0037BE` + `14SemiBold`가 함께 걸려 있다.
 * SignUp의 세대주 라디오와 다른 점이 이것이다(그쪽은 배경이 유일한 표시였다).
 *
 * `showCheckbox`면 체크박스 SVG를 왼쪽에 붙이고 좌측 정렬로 바뀐다
 * (소방 자가점검표가 쓴다).
 */
const RADIUS: Record<RadioRoundType, string> = {
  square: 'rounded-none',
  round: 'rounded-md',
  'round-square': 'rounded-lg',
  full: 'rounded-full',
}

export const InputRadioList = ({
  name,
  list,
  value,
  roundType = 'full',
  width = 'full',
  textColor = '',
  disabled = false,
  showCheckbox = false,
  checkboxOnImage = '/assets/images/자가점검표/checkbox-base-on.svg',
  checkboxOffImage = '/assets/images/자가점검표/checkbox-base-off.svg',
  className,
  onChange,
  onBlur,
}: InputRadioListProps) => {
  return (
    <li role="group" className={cn(width === 'full' ? 'flex' : 'grid grid-cols-3', 'gap-3')}>
      {list.map((radio) => {
        const isSelected = value === radio.key
        const isItemDisabled = radio.disabled === true || disabled

        return (
          <label
            key={radio.key}
            htmlFor={`${name}-${radio.key}`}
            className={cn(
              'flex w-full items-center gap-2 overflow-hidden border',
              showCheckbox ? 'justify-start' : 'justify-center text-center',
              isItemDisabled ? 'cursor-not-allowed bg-[#e7e7e7] opacity-50' : 'cursor-pointer',
              isSelected
                ? 'border-brand-default-border-brand pretendard-14SemiBold text-brand-default-text-brand'
                : cn(
                    'border-defaults-tertiary-border-tertiary bg-defaults-secondary-background-mono pretendard-14Regular text-defaults-secondary-text-secondary',
                    textColor,
                  ),
              RADIUS[roundType],
              className ?? 'h-10 px-4 py-3',
            )}
          >
            {showCheckbox && (
              <img
                src={isSelected ? checkboxOnImage : checkboxOffImage}
                alt={isSelected ? '선택됨' : '선택안됨'}
                className="h-5 w-5"
              />
            )}
            {radio.label}
            <input
              id={`${name}-${radio.key}`}
              type="radio"
              className="hidden"
              name={name}
              value={radio.key}
              checked={isSelected}
              disabled={isItemDisabled}
              onChange={() => {
                onChange(radio.key)
              }}
              onBlur={onBlur}
            />
          </label>
        )
      })}
    </li>
  )
}
