import { APT_SEARCH_TEXT } from '@/features/signup/constants/signup'
import type { AptSearchItemProps } from '@/features/signup/types/signup'

/**
 * 아파트 검색 결과 1행. 레거시 `SignUpAptInfoSearchItem.vue`.
 *
 * ⚠️ `선택` 버튼 글자색이 레거시에서 `text-primary-500`인데 **config에 없는 클래스라
 * 색이 적용되지 않았다.** 대상 토큰(`primary-pc-indigo-500`)이 존재하므로 오타로 보고
 * 고쳐 적용했다 — 글자가 상속색(검정)에서 **브랜드 파랑**으로 바뀐다
 * (`broken-styles.md` §0 A그룹).
 */
export const AptSearchItem = ({ aptInfo, onSelectApt }: AptSearchItemProps) => {
  return (
    <li className="flex items-center justify-between self-stretch px-2 py-[5px] pretendard-16Regular text-defaults-primary-text-primary">
      <span>{aptInfo.name}</span>
      <button
        type="button"
        className="flex h-5 w-12 items-center justify-center rounded-full border-none bg-defaults-tertiary-background-tertiary text-center pretendard-12SemiBold text-primary-pc-indigo-500"
        onClick={() => {
          onSelectApt(aptInfo)
        }}
      >
        {APT_SEARCH_TEXT.SELECT}
      </button>
    </li>
  )
}
