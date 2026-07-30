import { useNavigate } from 'react-router-dom'

import { MyPageMenuList } from '@/features/mypage/components/MyPageMenuList'
import { MyPageProfileCard } from '@/features/mypage/components/MyPageProfileCard'
import { MyPageVersion } from '@/features/mypage/components/MyPageVersion'
import { ROUTE_PATH } from '@/shared/constants/routes'
import { TERMS_ID } from '@/shared/constants/terms'

/**
 * 마이페이지 (P1). 레거시 `MyPageView.vue` 이식.
 *
 * ⚠️ **스크롤 영역 높이에 52px이 하드코딩돼 있다** (`h-[calc(100%-52px)]`).
 * 제목 영역의 실제 높이(`py-3` + `pretendard-20Bold`)와 맞춘 값이다 —
 * 글자 배율을 키우면 제목이 커지면서 어긋난다. 레거시 그대로 두었다
 * (`deferred.md`에 기록).
 *
 * ⚠️ 레거시 `onMounted`의 `reloadIfNewVersion()`은 **주석 처리**돼 있다.
 * 되살리지 않는다.
 */
export const MyPage = () => {
  const navigate = useNavigate()

  return (
    <div className="h-full bg-defaults-secondary-background-secondary">
      <h1 className="bg-base-b-white px-5 py-3 pretendard-20Bold">마이페이지</h1>
      <div className="h-[calc(100%-52px)] overflow-auto">
        <MyPageProfileCard />
        <MyPageMenuList />
        <div className="flex w-full items-center justify-between bg-defaults-secondary-background-secondary px-5 py-3">
          <MyPageVersion />
          <button
            className="cursor-pointer pretendard-12Regular text-defaults-secondary-text-secondary underline underline-offset-2"
            type="button"
            onClick={() => {
              void navigate(`${ROUTE_PATH.TERMS_OF_USE_DETAIL}/${TERMS_ID.PRIVACY_POLICY}`)
            }}
          >
            개인정보처리방침
          </button>
        </div>
      </div>
    </div>
  )
}
