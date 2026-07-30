import { useState } from 'react'

import { ACCOUNT_DELETION_TEXT } from '@/features/mypage/constants/mypage'
import { useDeleteAccount } from '@/features/mypage/queries/useDeleteAccount'
import { ButtonBase } from '@/shared/components/common/ButtonBase'
import { InputCheckbox } from '@/shared/components/common/InputCheckbox'
import { SpinnerCircle } from '@/shared/components/common/SpinnerCircle'

/**
 * 회원 탈퇴 (P8). 레거시 `MyPageAccountDeletionView.vue` 이식.
 *
 * ⚠️ **체크 영역이 `fixed bottom-20`이고 버튼이 `fixed bottom-0`이다.**
 * 문서 흐름에서 빠져 있어 본문 길이와 무관하게 화면 하단에 붙는다 —
 * 하단 탭이 없는 화면(`showBottomNav:false`)이라 겹치지 않는다.
 *
 * ⚠️ 중복 클릭 가드가 **핸들러 안에도** 있다 (`disabled`와 별개로).
 * 레거시 그대로 옮겼다 — disabled 갱신 전에 두 번 눌리는 경우를 막는다.
 */
export const AccountDeletionPage = () => {
  const [isAgreed, setIsAgreed] = useState(false)
  const { deleteAccountMutation, isDeleteAccountPending } = useDeleteAccount()

  const handleAccountDelete = () => {
    if (isDeleteAccountPending) return
    deleteAccountMutation()
  }

  return (
    <div className="h-full w-full">
      <div className="flex w-full flex-col items-start gap-4 p-5">
        <img className="h-7 w-7" src="/assets/icons/InfoCircle.svg" alt="알림 아이콘" />
        <p className="pretendard-18Bold text-base-b-black">{ACCOUNT_DELETION_TEXT.TITLE}</p>
      </div>

      <div className="fixed bottom-20 flex w-full gap-2.5 px-5 py-0">
        <InputCheckbox id="membershipDraw" checked={isAgreed} onChange={setIsAgreed} />
        <label htmlFor="membershipDraw" className="pretendard-15Regular text-neutral-b-gray-900">
          {ACCOUNT_DELETION_TEXT.AGREEMENT}
        </label>
      </div>

      <ButtonBase
        type="button"
        className="fixed bottom-0 left-0 flex justify-center"
        size="2xl"
        roundType="square"
        color="alerts-error"
        disabled={!isAgreed || isDeleteAccountPending}
        onClick={handleAccountDelete}
      >
        {isDeleteAccountPending ? <SpinnerCircle /> : <span>{ACCOUNT_DELETION_TEXT.SUBMIT}</span>}
      </ButtonBase>
    </div>
  )
}
