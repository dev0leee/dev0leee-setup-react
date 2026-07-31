import { useNavigate } from 'react-router-dom'
import { Pagination } from 'swiper/modules'
import { Swiper, SwiperSlide } from 'swiper/react'

import 'swiper/css'
import 'swiper/css/pagination'

import { getMainEnv } from '@/config/env'
import { EXTERNAL_MENU_NAME, ITEMS_PER_SLIDE } from '@/features/main/constants/swiperMenu'
import { useShoppingEntry } from '@/features/main/hooks/useShoppingEntry'
import { useSwiperMenuList } from '@/features/main/hooks/useSwiperMenuList'
import type { SwiperMenuItem } from '@/features/main/types/main'
import { SpinnerCircle } from '@/shared/components/common/SpinnerCircle'
import { getCommunityQueryString } from '@/shared/lib/communityLink'
import { openExternalLink } from '@/shared/lib/externalLink'
import { getAccessToken } from '@/shared/lib/tokenStore'
import { getAptInfo } from '@/shared/stores/authStore'
import { chunk } from '@/shared/utils/chunk'

/**
 * 슬라이드 안 그리드. 레거시 `findSwiperGrid` 이식.
 * 5개 이상이면 4열 그리드, 1~4개면 가운데 정렬 flex다.
 * **0개일 때 레거시는 `undefined`를 반환해 클래스가 없다** — 그대로 옮겼다.
 */
const getSlideGridClass = ({ itemCount }: { itemCount: number }): string => {
  if (itemCount > 4) return 'grid grid-cols-4'
  if (itemCount >= 1) return 'flex justify-center items-center'
  return ''
}

/**
 * 메인 메뉴 스와이퍼. 레거시 `MainNavigationSwiper.vue` 이식.
 *
 * 구독 메뉴를 8개씩 잘라 슬라이드로 넘긴다. 페이지네이션 점 위치·색은
 * 레거시 `<style scoped>`의 `:deep()` 규칙을 `index.css`로 옮겼다
 * (`.main-navigation-swiper` 아래로 한정).
 *
 * ⚠️ **`커뮤니티V2`가 액세스 토큰을 URL 쿼리스트링으로 외부 사이트에 넘긴다.**
 * 등가 이관으로 유지하되 보안 항목으로 기록했다 (`deferred.md` D-39).
 */
export const MainNavigationSwiper = ({
  onOpenShoppingTerms,
}: {
  onOpenShoppingTerms: () => void
}) => {
  const navigate = useNavigate()
  const { swiperMenuList, isResidentDetailInfoLoading } = useSwiperMenuList()
  const { enterShopping } = useShoppingEntry({ onOpenTerms: onOpenShoppingTerms })

  const slides = chunk({ items: swiperMenuList, size: ITEMS_PER_SLIDE })

  const handleMenuClick = async (menu: SwiperMenuItem) => {
    if (menu.menuName === EXTERNAL_MENU_NAME.COMMUNITY_V2) {
      const { aptResidentUuid } = getAptInfo()

      openExternalLink({
        url: `${getMainEnv().VITE_COMMUNITY_URL}/login?residentUUID=${String(aptResidentUuid)}&residentToken=${String(getAccessToken())}`,
      })
      return
    }

    if (menu.menuName === EXTERNAL_MENU_NAME.COMMUNITY) {
      openExternalLink({
        url: `${getMainEnv().VITE_VERSION_ONE_URL}/community/list${getCommunityQueryString()}`,
      })
      return
    }

    if (menu.menuName === EXTERNAL_MENU_NAME.SHOPPING) {
      await enterShopping()
      return
    }

    void navigate(menu.menuUrl)
  }

  if (isResidentDetailInfoLoading) {
    return (
      <div className="flex h-[208px] w-full items-center justify-center rounded-xl bg-base-b-white">
        <SpinnerCircle color="blue" />
      </div>
    )
  }

  return (
    <Swiper
      modules={[Pagination]}
      pagination
      slidesPerView={1}
      spaceBetween={50}
      className="main-navigation-swiper w-full"
    >
      {slides.map((slideMenus) => {
        return (
          <SwiperSlide
            key={slideMenus
              .map((menu) => {
                return menu.menuName
              })
              .join('-')}
            className="w-full"
          >
            <ul
              className={`w-full rounded-xl bg-base-b-white p-3 ${getSlideGridClass({ itemCount: slideMenus.length })} ${slideMenus.length > 7 ? 'h-[186px] pb-5' : 'h-[186px]'}`}
            >
              {slideMenus.map((menu) => {
                return (
                  <li
                    key={menu.menuName}
                    className="flex flex-1 flex-col items-center justify-center gap-2"
                    onClick={() => {
                      void handleMenuClick(menu)
                    }}
                  >
                    <div className="relative">
                      {menu.isNew && (
                        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-alerts-error-background-error pretendard-10SemiBold text-base-b-white">
                          N
                        </span>
                      )}
                      <img
                        alt={`${menu.menuName} 아이콘`}
                        src={`/assets/icons/mainMenu/${menu.iconName}.svg`}
                        className="h-7 w-7"
                      />
                    </div>
                    <span className="w-full text-center pretendard-13Medium whitespace-nowrap text-defaults-primary-text-primary">
                      {menu.menuName}
                    </span>
                  </li>
                )
              })}
            </ul>
          </SwiperSlide>
        )
      })}
    </Swiper>
  )
}
