import { useMutation, useQuery } from '@tanstack/react-query'

import {
  getVisitorPassPassword,
  putLobbyPhonePassword,
  putVisitorPassPassword,
} from '@/features/visit/api/visit'
import { visitorPassPasswordQueryKey } from '@/features/visit/constants/query'
import {
  KIOSK_PASSWORD_ERROR_CODES,
  KIOSK_PASSWORD_ERROR_MESSAGE,
  PASSWORD_CHANGED_TOAST,
} from '@/features/visit/constants/visit'
import type { ApiError } from '@/shared/lib/apiErrors'
import { showErrorModal } from '@/shared/lib/errorModal'
import { showToast } from '@/shared/lib/toast'
import { useAuthStore } from '@/shared/stores/authStore'

/** 현재 키오스크 비밀번호 (V2 확인 모달). 모달을 열 때만 조회한다 */
export const useVisitorPassPassword = ({ enabled }: { enabled: boolean }) => {
  const aptUuid = useAuthStore((state) => {
    return state.aptInfo.aptUuid
  })
  const aptResidentUuid = useAuthStore((state) => {
    return state.aptInfo.aptResidentUuid
  })

  const { data: visitorPassPassword, isLoading: isVisitorPassPasswordLoading } = useQuery({
    queryKey: visitorPassPasswordQueryKey({ aptUuid, aptResidentUuid }),
    queryFn: () => {
      return getVisitorPassPassword({
        aptUuid: aptUuid ?? '',
        aptResidentUuid: aptResidentUuid ?? '',
      })
    },
    enabled: enabled && Boolean(aptUuid) && Boolean(aptResidentUuid),
  })

  return { visitorPassPassword, isVisitorPassPasswordLoading }
}

/**
 * 키오스크 비밀번호 변경 (V2).
 *
 * ⚠️ **세대주만 바꿀 수 있는데 화면은 막지 않는다.** 서버가 `NOT_HEAD_AUTHORITY`로
 * 거부하면 모달로 알린다.
 *
 * ⚠️ **`mutateAsync`를 쓴다.** 모달이 `await` 뒤에 자기를 닫기 때문이다 —
 * 실패해도 닫힌다(`VisitPasswordChangeModal` 주석).
 */
export const useChangeKioskPassword = () => {
  const aptUuid = useAuthStore((state) => {
    return state.aptInfo.aptUuid
  })
  const aptResidentUuid = useAuthStore((state) => {
    return state.aptInfo.aptResidentUuid
  })

  const { mutateAsync: changeKioskPassword, isPending: isChangeKioskPasswordPending } = useMutation(
    {
      mutationFn: ({ password }: { password: string }) => {
        return putVisitorPassPassword({
          aptUuid: aptUuid ?? '',
          aptResidentUuid: aptResidentUuid ?? '',
          password,
        })
      },
      onSuccess: () => {
        showToast({ message: PASSWORD_CHANGED_TOAST })
      },
      onError: (error: ApiError) => {
        if (error.code && KIOSK_PASSWORD_ERROR_CODES.includes(error.code)) {
          showErrorModal({ text: KIOSK_PASSWORD_ERROR_MESSAGE[error.code] })
          return
        }
        showErrorModal({ text: error.message })
      },
    },
  )

  return { changeKioskPassword, isChangeKioskPasswordPending }
}

/**
 * 로비폰 세대 비밀번호 변경 (V3).
 *
 * ⚠️ **전용 에러 분기가 없다.** 키오스크와 달리 세대원이 시도해도 서버 원문이 그대로
 * 뜬다 (`visit.md` V-Q5). 같은 모달을 쓰는데 처리가 다르다 — 비대칭을 유지한다.
 */
export const useChangeLobbyPhonePassword = () => {
  const aptResidentUuid = useAuthStore((state) => {
    return state.aptInfo.aptResidentUuid
  })

  const { mutateAsync: changeLobbyPhonePassword, isPending: isChangeLobbyPhonePasswordPending } =
    useMutation({
      mutationFn: ({ password }: { password: string }) => {
        return putLobbyPhonePassword({ aptResidentUuid: aptResidentUuid ?? '', password })
      },
      onSuccess: () => {
        showToast({ message: PASSWORD_CHANGED_TOAST })
      },
      onError: (error: ApiError) => {
        showErrorModal({ text: error.message })
      },
    })

  return { changeLobbyPhonePassword, isChangeLobbyPhonePasswordPending }
}
