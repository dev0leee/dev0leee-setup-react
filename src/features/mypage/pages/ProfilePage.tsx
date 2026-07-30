import { useNavigate } from 'react-router-dom'

import { PROFILE_TEXT } from '@/features/mypage/constants/mypage'
import { AppBar } from '@/shared/components/layouts/AppBar'
import { ROUTE_PATH } from '@/shared/constants/routes'
import { useAuthStore } from '@/shared/stores/authStore'

/**
 * 내 프로필 (P2). 레거시 `MyProfileView.vue` 이식.
 *
 * ⚠️ **AppBar를 화면 안에서 직접 렌더한다.** 라우트 meta는 `showAppBar:false`다 —
 * 우측에 `수정` 버튼을 넣으려면 AppBar의 children이 필요하고, 라우트 meta로는
 * 그것을 표현할 수 없다. `pt-16`(64px)이 그 AppBar를 피하는 여백이다
 * (레이아웃이 주는 `pt-12`가 아니다).
 *
 * ⚠️ AppBar 제목이 **`내 정보`**다. 라우트 name은 `내 프로필`인데 화면 제목은 다르다.
 *
 * ⚠️ 표시값 세 개가 전부 `aptInfo`(localStorage)에서 온다. 레거시는 이 배열을
 * `computed`가 아닌 **일반 배열**로 만들어 마운트 시점 값에 고정했고, React에서는
 * 렌더 중 계산이라 자동으로 최신값이 된다 — 프로필 수정 후 돌아오면 즉시 반영된다는
 * 뜻이다. 레거시도 수정 성공 시 `navigateBack`하면서 화면을 다시 만들므로
 * **결과는 같다** (`deferred.md` D-45).
 *
 * ⚠️ **닉네임 미설정 시 회색으로 흐려지지 않는다.** 레거시가 `text-neutral-40`으로
 * 그러려고 했지만 **그 클래스가 config에 없어서** 설정된 닉네임과 똑같은 색으로 렌더된다.
 * 세 값 모두 상속색 `#111927`이다 — 그래서 값별 색 분기 없이 한 클래스로 그린다.
 * 회색 placeholder 복원은 전환 후 별도 작업이다 (`broken-styles.md` §2).
 */
export const ProfilePage = () => {
  const navigate = useNavigate()
  const aptInfo = useAuthStore((state) => {
    return state.aptInfo
  })

  const userInfos = [
    {
      title: PROFILE_TEXT.NICKNAME_LABEL,
      data: aptInfo.residentNickName || PROFILE_TEXT.NICKNAME_PLACEHOLDER,
    },
    { title: PROFILE_TEXT.NAME_LABEL, data: aptInfo.residentName || PROFILE_TEXT.EMPTY },
    { title: PROFILE_TEXT.APT_NAME_LABEL, data: aptInfo.aptName || PROFILE_TEXT.EMPTY },
  ]

  return (
    <div className="h-full w-full overflow-auto">
      <AppBar title="내 정보">
        <button
          type="button"
          onClick={() => {
            void navigate(ROUTE_PATH.MYPAGE_PROFILE_EDIT)
          }}
        >
          수정
        </button>
      </AppBar>
      <ul className="h-full w-full space-y-8 px-5 pt-16">
        <li className="flex items-center justify-center">
          <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border border-neutral-b-gray-200">
            <img className="h-20 w-20" src="/assets/images/Profile.svg" alt="프로필 이미지" />
          </div>
        </li>
        {/* 레거시는 `ul` 안에 `div`로 감싸고 그 안에 `li`를 뒀다. 마크업을 유지한다 */}
        <div className="space-y-5 pb-5">
          {userInfos.map((userInfo) => {
            return (
              <li key={userInfo.title} className="flex w-full items-start justify-between gap-2.5">
                <span className="w-[140px] pretendard-15SemiBold">{userInfo.title}</span>
                <span className="pretendard-15Regular text-neutral-b-gray-900">
                  {userInfo.data}
                </span>
              </li>
            )
          })}
        </div>
      </ul>
    </div>
  )
}
