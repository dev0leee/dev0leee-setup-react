import { useNavigate } from 'react-router-dom'

import { APT_MALL_LIST } from '@/features/aptMall/constants/aptMall'
import { useAptMallList } from '@/features/aptMall/queries/useAptMall'
import { SpinnerDots } from '@/shared/components/common/SpinnerDots'
import { ROUTE_PATH } from '@/shared/constants/routes'

/**
 * 몰 목록 (AM1). 레거시 `AptMallListView.vue` 이식.
 *
 * 🔴 **UI에서 도달할 수 없는 화면이다.** 메인 메뉴는 `/aptMall/myOrder`로 직행하고
 * 딥링크·푸시 매핑에도 이 경로가 없다 (`apt-mall.md` AM-Q2). 라우트가 존재하므로
 * URL로는 열리고, 그래서 이관했다.
 *
 * ⚠️ **어느 몰을 눌러도 `/aptMall/myOrder`로 간다** — 몰 식별자를 넘기지 않는다.
 *
 * ⚠️ **아이콘 매핑에 `주말조식`만 있다.** 다른 몰이 오면 `src`가 `undefined`가 되어
 * 이미지가 깨지고 `alt`가 `undefined 아이콘`이 된다. 레거시 그대로다.
 *
 * ⚠️ **AppBar가 이미 있는데 본문에 `pt-12`가 또 있다** — 상단 여백이 두 번 들어간다.
 * ⚠️ **빈 목록에 문구가 없다** — 빈 `<ul>`만 남는다.
 */
export const AptMallListPage = () => {
  const navigate = useNavigate()
  const { aptMallList, isAptMallListLoading } = useAptMallList()

  return (
    <div className="flex h-full flex-col overflow-auto bg-defaults-secondary-background-secondary">
      <div className="h-full pt-12">
        {isAptMallListLoading ? (
          <SpinnerDots />
        ) : (
          <ul className="grid grid-cols-2 gap-4 px-5 py-6">
            {(aptMallList ?? []).map((mall) => {
              const iconInfo = APT_MALL_LIST.find((item) => {
                return item.aptMallName === mall.aptMallName
              })

              return (
                <li
                  key={mall.aptMallUuid}
                  className="rounded-lg border border-defaults-tertiary-border-tertiary"
                >
                  <button
                    type="button"
                    className="flex h-[168px] w-full flex-col items-center justify-center gap-2.5 p-4"
                    onClick={() => {
                      void navigate(ROUTE_PATH.APT_MALL_MY_ORDER)
                    }}
                  >
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-s-info-50">
                      {/* `alt`가 서버 이름이 아니라 상수 쪽 이름을 참조한다 — 못 찾으면 사라진다 */}
                      <img src={iconInfo?.icon} alt={`${iconInfo?.aptMallName} 아이콘`} />
                    </div>
                    <span className="text-center pretendard-16Medium">{mall.aptMallName}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
