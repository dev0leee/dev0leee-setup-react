import { useNavigate } from 'react-router-dom'

import { PROFILE_TEXT } from '@/features/mypage/constants/mypage'
import { ROUTE_PATH } from '@/shared/constants/routes'
import { useResidentDetailInfo } from '@/shared/hooks/useResidentDetailInfo'
import { useAuthStore } from '@/shared/stores/authStore'

/**
 * 마이페이지 상단 프로필 카드. 레거시 `MyPageProfile.vue` 이식.
 *
 * ⚠️ **이름과 단지·동호수의 출처가 다르다.** 이름은 `aptInfo`(localStorage),
 * 단지명·동·호는 `residentDetailInfo`(서버)에서 읽는다. 레거시가 그렇게 만들어져
 * 있어 그대로 옮겼다 — 서버 응답이 오기 전에는 이름만 먼저 보인다.
 *
 * ⚠️ 이미지 `alt`가 **`'프로필 이미지 '`** 로 끝에 공백이 있다. 오타지만 화면에
 * 영향이 없고 스크린리더 낭독도 같아서 그대로 뒀다 — 레거시 대조 시 혼란을 막는다.
 * 화살표 `alt`가 `'아이콘'`뿐인 것도 레거시 그대로다 (메뉴 목록은 `'화살표 아이콘'`).
 */
export const MyPageProfileCard = () => {
  const navigate = useNavigate()
  const residentName = useAuthStore((state) => {
    return state.aptInfo.residentName
  })
  const { residentDetailInfo } = useResidentDetailInfo()

  return (
    <div className="flex w-full items-center justify-between gap-4 p-5">
      {/* 레거시는 div에 클릭 핸들러를 달았다. 접근성을 위해 button으로 바꾸되
          클래스는 그대로 둔다 — 레이아웃이 달라지지 않는다. */}
      <button
        type="button"
        className="flex w-full items-center justify-between gap-5 rounded-xl bg-white px-6 py-5 shadow-md"
        onClick={() => {
          void navigate(ROUTE_PATH.MYPAGE_PROFILE)
        }}
      >
        <div className="flex items-center gap-2.5">
          <div className="border-neutral-10 bg-neutral-10 flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border">
            <img
              className="h-12 w-12 shrink-0"
              src="/assets/images/Profile.svg"
              alt="프로필 이미지 "
            />
          </div>
          <div className="flex flex-1 flex-col items-start gap-[7px]">
            <span className="pretendard-16Bold">{residentName || PROFILE_TEXT.EMPTY}</span>
            <div className="text-neutral-90 flex flex-col gap-1 pretendard-14SemiBold">
              <span>{residentDetailInfo?.aptName}</span>
              <div>
                <span>{residentDetailInfo?.dong || 0}</span>동{' '}
                <span>{residentDetailInfo?.ho || 0}</span>호
              </div>
            </div>
          </div>
        </div>
        <img className="h-6 w-6" src="/assets/icons/ArrowRight.svg" alt="아이콘" />
      </button>
    </div>
  )
}
