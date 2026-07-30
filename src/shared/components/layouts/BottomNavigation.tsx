import { useLocation, useNavigate } from 'react-router-dom'

import { BOTTOM_NAV_ITEMS } from '@/shared/constants/bottomNavigation'

/**
 * 하단 탭. 레거시 `components/layouts/BottomNavigation.vue` 이식.
 *
 * 아이콘이 SVG 파일이고 **활성 상태마다 파일이 다르다**(`Home.svg` / `HomeActive.svg`).
 * lucide 아이콘으로 바꾸면 모양이 달라지므로 레거시 자산을 그대로 쓴다.
 *
 * 활성 판정은 `startsWith`다 — `/mypage/etc`에서도 마이페이지 탭이 켜져 있어야 한다.
 * `NavLink`의 기본 `end: false`도 같은 동작이지만, 레거시가 버튼 + `navigate`로
 * 만들어져 있어 마크업(`<button>`)을 유지했다.
 *
 * 높이 67px이 본문 하단 여백의 근거다.
 */
export const BottomNavigation = () => {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  return (
    <nav className="fixed bottom-0 left-0 z-[100] grid h-[67px] w-full auto-cols-fr grid-flow-col gap-3 border border-[#f6f6f6] bg-base-b-white px-[30px] pt-3 pb-4 shadow-[0px_-2px_6px_0px_rgba(0,0,0,0.04)]">
      {BOTTOM_NAV_ITEMS.map(({ menuName, path, iconName }) => {
        const isActive = pathname.startsWith(path)

        return (
          <button
            key={path}
            type="button"
            className="flex flex-col items-center justify-between gap-[5px] pretendard-12Bold"
            onClick={() => {
              void navigate(path)
            }}
          >
            <img
              src={`/assets/icons/bottomNav/${isActive ? `${iconName}Active` : iconName}.svg`}
              alt={`${menuName} 아이콘`}
            />
            <span
              className={
                isActive ? 'text-primary-pc-indigo-900' : 'text-defaults-secondary-text-secondary'
              }
            >
              {menuName}
            </span>
          </button>
        )
      })}
    </nav>
  )
}
