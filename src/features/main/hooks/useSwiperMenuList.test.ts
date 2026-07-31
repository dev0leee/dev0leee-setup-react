import { describe, expect, it } from 'vitest'

import { filterSwiperMenuList } from '@/features/main/hooks/useSwiperMenuList'

/**
 * 스와이퍼 메뉴 노출 규칙. 문자열 하나만 어긋나도 메뉴가 통째로 사라지는데
 * 레거시에 이미 어긋난 것이 있어(`'투표'` vs `'전자투표'`) 그 상태까지 못박아 둔다.
 */

const toNames = (contentList: string[]) => {
  return filterSwiperMenuList({
    contentList: contentList.map((name) => {
      return { name }
    }),
  }).map((menu) => {
    return menu.menuName
  })
}

describe('filterSwiperMenuList', () => {
  it('구독이 없어도 관리사무소는 항상 나온다', () => {
    expect(toNames([])).toEqual(['관리사무소'])
  })

  it('고정 메뉴가 항상 맨 뒤다', () => {
    // 주차는 목록 첫 번째라 관리사무소보다 앞이어야 한다
    expect(toNames(['주차'])).toEqual(['주차관리', '관리사무소'])
  })

  it('구독 순서가 아니라 목록 순서를 따른다', () => {
    // 응답 순서를 뒤집어도 결과 순서는 `MAIN_SWIPER_MENU_LIST` 순서다
    expect(toNames(['소통', '주차'])).toEqual(['주차관리', '소통공간', '관리사무소'])
  })

  it('콘텐츠 이름의 공백을 무시한다', () => {
    expect(toNames([' 로비폰 '])).toContain('공동 현관')
  })

  it("`'투표'` 하나로 전자투표와 설문조사가 함께 나온다", () => {
    expect(toNames(['투표'])).toEqual(['전자투표', '설문조사', '관리사무소'])
  })

  it("⚠️ `'전자투표'`로는 아무 메뉴도 나오지 않는다", () => {
    // 카드 게이트(`APT_CONTENT_NAME.VOTE`)는 `'전자투표'`인데 스와이퍼는 `'투표'`다.
    // 레거시의 불일치를 그대로 옮겼음을 못박는다 (`main.md` M-Q3).
    expect(toNames(['전자투표'])).toEqual(['관리사무소'])
  })

  it('소방자가점검만 New 배지를 갖는다', () => {
    const menus = filterSwiperMenuList({
      contentList: [{ name: '소방 자가 점검' }, { name: '주차' }],
    })

    expect(
      menus
        .filter((menu) => {
          return menu.isNew
        })
        .map((menu) => {
          return menu.menuName
        }),
    ).toEqual(['소방자가점검'])
  })
})
