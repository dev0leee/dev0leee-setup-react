import type { AptInfoHeaderAptNameProps } from '@/features/main/types/main'

/**
 * 아파트명을 **어절 단위로** 끊어 렌더한다. 레거시 `AptInfoHeaderAptName.vue` 이식.
 *
 * 각 어절을 `inline-block` `<span>`으로 감싸고 마지막이 아니면 `&nbsp;`를 붙인다.
 * **어절 중간에서 줄바꿈되지 않게 하려는 처리**다 — `word-break` CSS로 바꾸면 줄바꿈
 * 위치가 달라진다.
 *
 * ⚠️ 공백을 `&nbsp;`로 넣는 이유: `inline-block` 사이의 일반 공백은 브라우저가
 * 줄바꿈 지점으로 쓴다. `&nbsp;`는 쓰지 않는다.
 */
export const AptInfoHeaderAptName = ({ aptName }: AptInfoHeaderAptNameProps) => {
  const aptNameWords = aptName ? aptName.split(' ') : []

  return (
    <h1>
      {aptNameWords.map((word, index) => {
        // 같은 어절이 반복될 수 있어 인덱스를 키에 함께 넣는다 (레거시 동일)
        return (
          <span key={`${word}-${index}`} className="inline-block">
            {word}
            {/* `\u00A0`(nbsp)다. 일반 공백을 쓰면 브라우저가 그 자리에서 줄을 바꿔
                어절 단위 유지가 무의미해진다 */}
            {index < aptNameWords.length - 1 ? '\u00A0' : ''}
          </span>
        )
      })}
    </h1>
  )
}
