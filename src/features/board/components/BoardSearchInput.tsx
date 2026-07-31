import { useEffect, useRef, useState } from 'react'

import { SEARCH_DEBOUNCE_MS } from '@/features/board/constants/board'

/**
 * 게시판 검색 입력. 레거시 `BoardSearchInput.vue` 이식 (B1·B3·B5·B12 공용).
 *
 * **Enter가 필요 없다** — 입력 500ms 뒤 자동으로 검색한다.
 *
 * ⚠️ `type="search"`라 브라우저가 기본 X 버튼을 그린다. 웹뷰에서도 보이며
 * 레거시가 그 상태로 배포돼 있다.
 */
export const BoardSearchInput = ({
  onChangeKeyword,
}: {
  onChangeKeyword: (keyword: string) => void
}) => {
  const [keyword, setKeyword] = useState('')

  // 콜백은 호출부에서 매 렌더 새로 만들어진다. deps에 넣으면 타이머가 매번 리셋되므로
  // ref로 최신 참조만 들고 간다 — debounce의 목적이 그것이다.
  const onChangeKeywordRef = useRef(onChangeKeyword)
  onChangeKeywordRef.current = onChangeKeyword

  const isFirstRenderRef = useRef(true)

  useEffect(() => {
    // 마운트 직후에는 발화하지 않는다. 레거시 `useDebounceFn`은 `@input`에만 붙어 있다.
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false
      return
    }

    const timerId = setTimeout(() => {
      onChangeKeywordRef.current(keyword)
    }, SEARCH_DEBOUNCE_MS)

    return () => {
      clearTimeout(timerId)
    }
  }, [keyword])

  return (
    <div className="relative h-9 w-full">
      <input
        type="search"
        value={keyword}
        placeholder="검색"
        className="h-9 w-full rounded-[4px] border border-defaults-tertiary-border-tertiary bg-defaults-secondary-background-secondary py-2.5 pr-3 pl-[38px] pretendard-16Regular text-defaults-primary-text-primary outline-none placeholder:text-defaults-tertiary-text-tertiary"
        onChange={(event) => {
          setKeyword(event.target.value)
        }}
      />
      <img
        className="absolute top-1/2 left-3 h-4 w-4 translate-y-[-50%]"
        src="/assets/icons/SearchGray.svg"
        alt="검색 아이콘"
      />
    </div>
  )
}
