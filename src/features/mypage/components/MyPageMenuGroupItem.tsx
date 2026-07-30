import { useNavigate } from 'react-router-dom'

import type { MyPageMenuItem } from '@/features/mypage/types/mypage'

/**
 * 메뉴 그룹 하나. 레거시 `MyPageMenuGroupItem.vue` 이식.
 *
 * 그룹 제목 색이 브랜드 파랑이고 알림 설정 화면의 그룹 제목은
 * `text-defaults-secondary-text-secondary`(회색)다 — 같은 구조지만 색이 다르므로
 * 컴포넌트를 합치지 않았다.
 *
 * ⚠️ 레거시는 `text-brand-primary-50`을 쓰는데 **그 클래스가 config에 없어서 색이
 * 적용되지 않았다**(상속색 = 검정). `broken-styles.md` §5 결정에 따라
 * `text-brand-default-text-brand`(#0037BE)로 매핑했다 — **레거시 화면과 눈에 보이게 다르다.**
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
    <li className="flex h-fit flex-col items-start gap-[3px] self-stretch border-b border-neutral-b-gray-200 bg-base-b-white px-5 py-4">
      <div className="flex items-center justify-center gap-2.5 px-2.5 py-[7px]">
        <h2 className="pretendard-13SemiBold text-brand-default-text-brand">{title}</h2>
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
