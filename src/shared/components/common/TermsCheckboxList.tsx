import type { TermsCheckboxListProps } from '@/shared/types/terms'
import { cn } from '@/shared/utils/cn'

/**
 * 약관 동의 목록. 레거시 `TermsCheckboxList.vue`.
 *
 * 항목 라벨 앞에 `[필수]`/`[선택]`을 붙이고 오른쪽에 상세 보기 링크를 둔다.
 *
 * ⚠️ 레거시 체크박스 클래스는 **`border-defaults-tertiary-border-tertiary0`**로
 * 끝에 `0`이 붙은 오타였다. **대상 토큰이 config에 그대로 있으므로 오타만 고쳐 적용했다**
 * (2026-07-30 결정 — `broken-styles.md` §0). 다만 네이티브 체크박스는 UA가 직접 그려서
 * `border-*`가 보이지 않는다 — 눈에 보이는 변화는 없다.
 *
 * `보기` 버튼은 `label` 안에 있어 클릭이 체크박스로 전파된다.
 * 레거시가 `@click.prevent`로 막았고, 여기서는 `preventDefault()`로 같은 일을 한다.
 */
export const TermsCheckboxList = ({
  items,
  checkedMap,
  listClassName = 'space-y-4',
  textClassName = 'pretendard-15Regular',
  onChange,
  onMoveDetail,
}: TermsCheckboxListProps) => {
  return (
    <ul className={listClassName}>
      {items.map((item) => {
        return (
          <li key={item.id}>
            <label htmlFor={item.id} className="flex cursor-pointer items-center gap-3">
              <input
                id={item.id}
                checked={checkedMap[item.id] ?? false}
                type="checkbox"
                className="h-5 w-5 rounded border-defaults-tertiary-border-tertiary"
                onChange={(event) => {
                  onChange({ ...checkedMap, [item.id]: event.target.checked })
                }}
              />
              <div className="flex w-full justify-between">
                <span className={cn('text-defaults-primary-text-primary', textClassName)}>
                  [{item.required ? '필수' : '선택'}] {item.label}
                </span>
                <button
                  type="button"
                  className="ml-auto pretendard-13Regular text-nowrap text-defaults-secondary-text-secondary underline underline-offset-2"
                  onClick={(event) => {
                    // label 안이라 막지 않으면 체크 상태가 함께 토글된다.
                    event.preventDefault()
                    onMoveDetail(item)
                  }}
                >
                  보기
                </button>
              </div>
            </label>
          </li>
        )
      })}
    </ul>
  )
}
