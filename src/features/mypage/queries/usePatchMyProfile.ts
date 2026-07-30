import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'

import { patchMyProfile } from '@/features/mypage/api/mypage'
import { MYPAGE_TOAST_MESSAGE } from '@/features/mypage/constants/mypage'
import type { MypageProfileForm } from '@/features/mypage/schemas/profile'
import { showErrorModal } from '@/shared/lib/errorModal'
import { showToast } from '@/shared/lib/toast'
import { useAuthStore } from '@/shared/stores/authStore'

/**
 * 닉네임 수정. 레거시 `usePatchMypageProfile.js` 이식.
 *
 * ⚠️ **서버에는 닉네임만 보내고 localStorage에는 이름까지 쓴다.**
 * 이름은 읽기 전용 필드라 값이 바뀌지 않으므로 같은 값을 다시 쓰는 셈이다.
 * 레거시가 `variables.name`을 그대로 넘기고 있어 동작을 유지했다 —
 * 지우면 `setAptInfo`가 병합이라 결과는 같지만, 서버가 이름 수정을 열어줬을 때
 * 함께 갱신되는 경로가 사라진다.
 *
 * ⚠️ 성공하면 **뒤로 이동 후 토스트**다. 순서를 바꾸면 이전 화면에서 토스트가 뜬다.
 */
export const usePatchMyProfile = () => {
  const navigate = useNavigate()
  const setAptInfo = useAuthStore((state) => {
    return state.setAptInfo
  })
  const aptResidentUuid = useAuthStore((state) => {
    return state.aptInfo.aptResidentUuid
  })

  const { mutate: patchMyProfileMutation, isPending: isPatchMyProfilePending } = useMutation({
    mutationFn: ({ nickName }: MypageProfileForm) => {
      return patchMyProfile({ aptResidentUuid: aptResidentUuid ?? '', nickName })
    },
    onSuccess: (_data, variables) => {
      setAptInfo({ residentName: variables.name, residentNickName: variables.nickName })
      void navigate(-1)
      showToast({ message: MYPAGE_TOAST_MESSAGE.PROFILE_UPDATED })
    },
    onError: (error) => {
      // 레거시 switch에 case가 없다. 전부 서버 메시지를 그대로 보여준다.
      showErrorModal({ text: error.message })
    },
  })

  return { patchMyProfileMutation, isPatchMyProfilePending }
}
