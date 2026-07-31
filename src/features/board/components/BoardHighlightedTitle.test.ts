import { describe, expect, it } from 'vitest'

import { getHighlightedTitle } from '@/features/board/components/BoardHighlightedTitle'

/**
 * 목록 제목 하이라이트. 반환값 3종이 각각 다른 화면 동작을 뜻하고
 * 레거시 기벽이 두 개 섞여 있어(소문자화 · 숨김) 전부 못박아 둔다.
 */
describe('getHighlightedTitle', () => {
  it('검색어가 없으면 제목을 문자열 그대로 준다', () => {
    expect(getHighlightedTitle({ title: '단수 안내', searchKeyword: '' })).toBe('단수 안내')
  })

  it('검색어가 제목에 있으면 조각 배열로 쪼갠다', () => {
    expect(getHighlightedTitle({ title: '여름철 단수 안내', searchKeyword: '단수' })).toEqual([
      '여름철 ',
      '단수',
      ' 안내',
    ])
  })

  it('검색어가 제목에 없으면 undefined다 — 아이템이 통째로 사라진다', () => {
    // ⚠️ 서버가 본문까지 매칭해 돌려주면 목록에 빈 자리 없이 글이 빠진다 (§5-6)
    expect(getHighlightedTitle({ title: '단수 안내', searchKeyword: '엘리베이터' })).toBeUndefined()
  })

  it('⚠️ 영문 제목이 소문자로 바뀐다', () => {
    // 목록만 그렇고 상세는 원본이라 두 화면의 제목이 달라 보인다 (§5-4)
    expect(getHighlightedTitle({ title: 'Notice', searchKeyword: '' })).toBe('notice')
  })

  it('줄바꿈은 `<br/>` 문자열이 된다', () => {
    expect(getHighlightedTitle({ title: '위\n아래', searchKeyword: '' })).toBe('위<br/>아래')
  })

  it('제목이 없으면 빈 문자열이다', () => {
    expect(getHighlightedTitle({ title: undefined, searchKeyword: '' })).toBe('')
  })
})
