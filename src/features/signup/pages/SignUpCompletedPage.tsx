import { useNavigate } from 'react-router-dom'

import { ButtonBase } from '@/shared/components/common/ButtonBase'
import { ROUTE_PATH } from '@/shared/constants/routes'

/**
 * 회원가입 완료 (S5). 레거시 `SignUpView/SignUpCompletedView.vue` 이식.
 *
 * **`auth.md` A4(승인 대기)와 레이아웃이 같고 제목·아이콘만 다르다.**
 * 공용 컴포넌트로 묶지 않은 이유: 색 지정이 미묘하게 다르다 — A4는 제목·본문에 색
 * 클래스가 없어 상속색을 쓰고, 여기는 `text-defaults-primary-text-primary`(`#111927`)와
 * `text-defaults-secondary-text-secondary`를 명시한다. 묶으면 한쪽 화면이 달라진다.
 *
 * ⚠️ S4가 `state: { pageFrom: 'aptInfo' }`를 넘기지만 **이 화면은 읽지 않는다.**
 * 죽은 state라 넘기지도 않았다 (`deferred.md` D-27).
 */
export const SignUpCompletedPage = () => {
  const navigate = useNavigate()

  return (
    <div className="h-full w-full pt-12">
      <div className="flex h-full w-full flex-col justify-start px-6 pt-[43px] pretendard-16Regular text-defaults-secondary-text-secondary">
        <h1 className="flex flex-col items-start gap-2 pretendard-22Bold text-defaults-primary-text-primary">
          회원가입 완료
        </h1>
        <div className="mt-[11px] pretendard-16Regular text-defaults-secondary-text-secondary">
          <p>현재 회원 승인 검토중입니다.</p>
          <p>빠른 시일 내에 승인 여부를 안내해 드리겠습니다.</p>
        </div>
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <img
            className="h-[138px] w-[138px]"
            src="/assets/icons/JoinCheck.svg"
            alt="가입 승인 확인 이미지"
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
