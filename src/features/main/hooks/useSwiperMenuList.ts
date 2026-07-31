import {
  FIXED_SWIPER_MENU_NAMES,
  MAIN_SWIPER_MENU_LIST,
} from '@/features/main/constants/swiperMenu'
import type { SwiperMenuItem } from '@/features/main/types/main'
import { useResidentDetailInfo } from '@/shared/hooks/useResidentDetailInfo'
import type { AptContentItem } from '@/shared/types/resident'

/**
 * 스와이퍼에 실제로 보일 메뉴를 고른다. 레거시 `useGetResidentDetailInfo.js`의
 * `getFilteredMenuList` 이식.
 *
 * **순서가 결과의 일부다** — 구독 메뉴가 목록 순서대로 먼저 오고, 고정 메뉴(관리사무소)가
 * 항상 맨 뒤에 붙는다.
 *
 * 순수 함수로 분리해둔 이유는 노출 규칙을 훅 없이 테스트하기 위해서다.
 */
export const filterSwiperMenuList = ({
  contentList,
}: {
  contentList: AptContentItem[] | undefined
}): SwiperMenuItem[] => {
  const conditionalMenus = MAIN_SWIPER_MENU_LIST.filter((menu) => {
    return (
      'contentName' in menu &&
      (contentList ?? []).some((content) => {
        // 서버 값에 공백이 섞여 온다 (`aptContent.ts` 주석)
        return content.name.trim() === menu.contentName
      })
    )
  })

  const fixedMenus = MAIN_SWIPER_MENU_LIST.filter((menu) => {
    return FIXED_SWIPER_MENU_NAMES.includes(menu.menuName)
  })

  return [...conditionalMenus, ...fixedMenus].map((menu) => {
    return {
      contentName: 'contentName' in menu ? menu.contentName : undefined,
      menuName: menu.menuName,
      iconName: menu.iconName,
      menuUrl: menu.menuUrl,
      isNew: 'isNew' in menu ? menu.isNew : undefined,
    }
  })
}

/**
 * 레거시가 `useGetResidentDetailInfo`에서 함께 내보내던 `usingSwiperMenu`에 해당한다.
 * 메인 전용이라 공용 훅이 아니라 여기에 둔다 (`useResidentDetailInfo.ts` 주석).
 */
export const useSwiperMenuList = () => {
  const { residentDetailInfo, isResidentDetailInfoLoading } = useResidentDetailInfo()

  return {
    swiperMenuList: filterSwiperMenuList({ contentList: residentDetailInfo?.contentList }),
    isResidentDetailInfoLoading,
  }
}
