import { useNavigate } from 'react-router-dom'

import type { MyPageMenuItem } from '@/features/mypage/types/mypage'

/**
 * 메뉴 그룹 하나. 레거시 `MyPageMenuGroupItem.vue` 이식.
 *
 * 알림 설정 화면의 그룹과 구조가 같지만 제목 색이 달라 컴포넌트를 합치지 않았다
 * (그쪽은 `text-defaults-secondary-text-secondary`).
 *
 * ⚠️ 레거시는 제목에 `text-brand-primary-50`을 쓰는데 **그 클래스가 config에 없어서
 * 아무 색도 적용되지 않는다** — 실제 렌더는 `body`의 상속색 `#111927`이다.
 * 그래서 같은 값인 `text-neutral-b-gray-900`으로 표현했다 (`broken-styles.md` §2).
 * **이름이 암시하는 브랜드 파랑을 넣으면 레거시 화면과 달라진다.**
 * 디자이너 의도 복원은 전환 후 별도 작업이다.
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
        <h2 className="pretendard-13SemiBold text-neutral-b-gray-900">{title}</h2>
      </div>
      <ul className="flex w-full flex-col items-start self-stretch">
        {menus.map((item) => {
          return (
            <li key={item.url} className="w-full">
              <button
                type="button"
                className="flex w-full items-center justify-between self-stretch px-2.5 py-2 text-left pretendard-15SemiBold text-base-b-black"
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
