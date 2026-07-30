import { useNavigate } from 'react-router-dom'

import type { MyPageMenuItem } from '@/features/mypage/types/mypage'

/**
 * 메뉴 그룹 하나. 레거시 `MyPageMenuGroupItem.vue` 이식.
 *
 * 그룹 제목 색이 `text-brand-primary-50`이고 알림 설정 화면의 그룹 제목은
 * `text-defaults-secondary-text-secondary`다 — 같은 구조지만 색이 다르므로
 * 컴포넌트를 합치지 않았다.
 */
export const MyPageMenuGroupItem = ({
  title,
  menus,
}: {
  title: string
  menus: MyPageMenuItem[]
}) => {
  const navigate = useNavigate()

  return (
    <li className="border-neutral-20 flex h-fit flex-col items-start gap-[3px] self-stretch border-b bg-base-b-white px-5 py-4">
      <div className="flex items-center justify-center gap-2.5 px-2.5 py-[7px]">
        <h2 className="text-brand-primary-50 pretendard-13SemiBold">{title}</h2>
      </div>
      <ul className="flex w-full flex-col items-start self-stretch">
        {menus.map((item) => {
          return (
            <li key={item.url} className="w-full">
              <button
                type="button"
                className="flex w-full items-center justify-between self-stretch px-2.5 py-2 pretendard-15SemiBold text-base-b-black"
                onClick={() => {
                  void navigate(item.url)
                }}
              >
                <span>{item.name}</span>
                <img src="/assets/icons/ArrowRight.svg" alt="화살표 아이콘" className="h-6 w-6" />
              </button>
            </li>
          )
        })}
      </ul>
    </li>
  )
}
