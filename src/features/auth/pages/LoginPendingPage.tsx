import { useNavigate } from 'react-router-dom'

import { ButtonBase } from '@/shared/components/common/ButtonBase'
import { ROUTE_PATH } from '@/shared/constants/routes'

/**
 * 가입 승인 대기. 레거시 `LoginView/LoginPendingCheckView.vue` 이식 (`auth.md` A4).
 *
 * 로그인이 `RESIDENT_NOT_APPROVED`로 실패했을 때 온다. 그 직전에 `usePatchLogin`이
 * 미승인 입주민 정보를 앱에 발신해 FCM 토큰을 등록시킨다 — 승인 결과를 문자 대신
 * 푸시로 보내기 위한 것이다.
 *
 * ⚠️ **AppBar가 없는데 `pt-12`(48px)가 있다.** 레거시 그대로다 — 라우트 meta는
 * `showAppBar:false`이므로 이 여백은 그냥 상단 공백이다.
 *
 * ⚠️ 이미지와 버튼이 `fixed`다. 이미지는 화면 정중앙, 버튼은 화면 맨 아래에 붙는다 —
 * 부모의 `pt-12`나 스크롤과 무관하게 뷰포트 기준으로 놓인다.
 */
export const LoginPendingPage = () => {
  const navigate = useNavigate()

  return (
    <div className="h-full w-full pt-12">
      <div className="flex h-full w-full flex-col justify-start px-6 pt-[43px] pretendard-16Regular">
        <h1 className="flex flex-col items-start gap-2 pretendard-22Bold">가입 승인 대기중</h1>
        <div className="mt-[11px] pretendard-16Regular text-defaults-secondary-text-secondary">
          <p>현재 회원 승인 검토중입니다.</p>
          <p>빠른 시일 내에 승인 여부를 안내해 드리겠습니다.</p>
        </div>
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <img
            className="h-[138px] w-[138px]"
            src="/assets/icons/JoinSuccess.svg"
            alt="가입 승인 상태 확인 중 이미지"
          />
        </div>
      </div>

      <ButtonBase
        type="button"
        className="fixed bottom-0 left-0"
        size="2xl"
        color="brand"
        roundType="square"
        onClick={() => {
          void navigate(ROUTE_PATH.HOME)
        }}
      >
        확인
      </ButtonBase>
    </div>
  )
}
