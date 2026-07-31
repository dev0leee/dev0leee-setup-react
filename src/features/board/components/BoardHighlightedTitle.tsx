import { formatHtmlText } from '@/shared/utils/formatHtmlText'

/**
 * 목록 제목의 검색어 하이라이트. 레거시 `NoticeBoardItem`·`GlobalNoticeBoardItem`·
 * `BoardPostListItem` **3곳에 복사돼 있던** `highlightedTitle` computed를 하나로 모은 것.
 *
 * 반환값 3종이 각각 다른 의미를 갖는다:
 *
 * | 반환        | 의미                     | 화면                         |
 * | ----------- | ------------------------ | ---------------------------- |
 * | `string`    | 검색어 없음              | 제목 그대로                  |
 * | `string[]`  | 검색어가 제목에 있음     | 일치 조각만 강조             |
 * | `undefined` | 검색어가 제목에 **없음** | **아이템을 렌더하지 않는다** |
 *
 * ⚠️ **제목을 소문자로 만든다.** 목록에 보이는 영문 제목은 항상 소문자다
 * (`Notice` → `notice`). 상세 화면은 원본을 쓰므로 **목록과 상세의 제목이 달라 보인다.**
 * 레거시 그대로다 (`board.md` §5-4).
 *
 * ⚠️ **`undefined`가 곧 "아이템 숨김"이다.** 서버가 본문까지 매칭해 돌려주면 제목에
 * 검색어가 없는 글이 섞이고, 그 글은 목록에서 **통째로 사라진다**(빈 자리도 남지 않는다).
 * `board.md` §5-6.
 */
// 컴포넌트와 같은 파일에 둔다 — 이 함수의 반환값 3종은 아래 컴포넌트의 렌더 규칙과
// 한 몸이고(특히 `undefined` = 아이템 숨김), 떼어놓으면 둘이 따로 바뀔 수 있다.
// 피처 폴더 규약(01-folder-structure)에 순수 함수 자리가 따로 없기도 하다.
// eslint-disable-next-line react-refresh/only-export-components
export const getHighlightedTitle = ({
  title,
  searchKeyword,
}: {
  title: string | undefined
  searchKeyword: string
}): string | string[] | undefined => {
  const formattedTitle = formatHtmlText({ text: title?.toLowerCase() })
  const keyword = searchKeyword.toLowerCase()

  if (!keyword) return formattedTitle

  if (formattedTitle.includes(keyword)) {
    // 캡처 그룹이 있어 일치 조각도 결과 배열에 남는다
    return formattedTitle.split(new RegExp(`(${keyword})`, 'gi'))
  }

  return undefined
}

/**
 * 하이라이트된 제목을 그린다. 바깥 `<p>`는 화면마다 클래스가 달라 호출부가 그린다.
 *
 * ⚠️ **대문자로 검색하면 강조가 안 된다.** 조각은 소문자 제목에서 나오는데 비교 대상은
 * 소문자화하지 않은 **원본 검색어**라(`piece === searchKeyword`) 절대 일치하지 않는다.
 * 목록 필터링은 서버가 하므로 결과는 나오고 **색만 안 입는다.** 레거시 동일.
 *
 * ⚠️ **검색어가 없을 때 레거시는 글자 하나마다 `<span>`을 만든다** — Vue의 `v-for`가
 * 문자열을 문자 배열로 순회하기 때문이다. **재현하지 않았다.** 렌더 결과가 픽셀 단위로
 * 같고(인라인 span은 줄바꿈·말줄임에 영향이 없다), 글자별 span은 스크린리더가 제목을
 * 한 글자씩 읽게 만들어 **오히려 해롭다.** 눈에 보이는 것이 같으므로 등가 이관을 만족한다
 * (`board.md` BD-Q3 결정 · 2026-07-31).
 */
export const BoardHighlightedTitle = ({
  highlightedTitle,
  searchKeyword,
}: {
  highlightedTitle: string | string[]
  searchKeyword: string
}) => {
  if (!Array.isArray(highlightedTitle)) return highlightedTitle

  return highlightedTitle.map((piece, index) => {
    return (
      <span
        // 조각은 중복될 수 있어 인덱스를 키로 쓴다 (레거시 `:key="index"` 동일)
        key={`${piece}-${String(index)}`}
        className={piece === searchKeyword ? 'text-brand-default-text-brand' : ''}
      >
        {piece}
      </span>
    )
  })
}
