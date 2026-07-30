import { useNavigate } from 'react-router-dom'

import { LOGOUT_MODAL_DATA } from '@/features/auth/constants/loginInfo'
import { useDeleteLogout } from '@/features/auth/queries/useDeleteLogout'
import { ModalButton } from '@/shared/components/common/ModalButton'

/**
 * 로그아웃 확인 (`auth.md` A7). 레거시 `MyPageView/MypageLogoutView.vue` 이식.
 *
 * ⚠️ **화면이 아니라 라우트로 만든 모달이다.** 마이페이지 메뉴에서 `/logout`으로
 * 이동하면 모달만 뜨고 뒤에는 이전 화면이 남아 있다. 취소하면 뒤로 간다.
 * 레거시 구조이고 경로가 앱·딥링크 계약이라 유지한다.
 *
 * 레거시는 `MyPageView/`에 있었지만 기능상 auth라 여기로 옮겼다 (`auth.md` A7).
 * 로그아웃 자체는 `useDeleteLogout`이 전부 처리한다 — 이 화면은 확인만 받는다.
 */
export const LogoutPage = () => {
  const navigate = useNavigate()
  const { deleteLogoutMutation, isDeleteLogoutPending } = useDeleteLogout()

  const goBack = () => {
    void navigate(-1)
  }

  return (
    <ModalButton
      open
      onClose={goBack}
      buttonType="dual"
      modalData={LOGOUT_MODAL_DATA}
      onFirstClick={goBack}
      onSecondClick={() => {
        // 중복 클릭 가드. 레거시 그대로 핸들러 안에 있다
        if (isDeleteLogoutPending) return
        deleteLogoutMutation()
      }}
    />
  )
}
