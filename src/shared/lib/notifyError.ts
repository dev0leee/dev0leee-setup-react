import { toast } from 'sonner'

import { NETWORK_ERROR_MESSAGE } from '@/shared/constants/message'
import { toApiError } from '@/shared/lib/apiErrors'

// 여러 요청이 동시에 오프라인으로 실패해도 토스트는 하나만 뜨게 한다.
const NETWORK_TOAST_ID = 'network-error'

/**
 * 사용자에게 보여줄 에러 문구를 고른다.
 * 네트워크 단절(status 0)은 서버 메시지가 없으므로 전용 문구로, 그 외에는 ApiError.message로.
 * 폼 필드 에러처럼 토스트가 아닌 곳에서 문구만 필요할 때 쓴다.
 */
export const getDisplayErrorMessage = ({ error }: { error: unknown }): string => {
  const apiError = toApiError({ error })
  return apiError.isNetworkError ? NETWORK_ERROR_MESSAGE : apiError.message
}

/**
 * 뮤테이션 실패를 토스트로 알린다. 전역 MutationCache가 부른다 — 훅마다 부르지 않는다.
 * 네트워크 단절은 고정 id로 묶어 중복 토스트를 막는다.
 */
export const notifyError = ({ error }: { error: unknown }): void => {
  const apiError = toApiError({ error })
  if (apiError.isNetworkError) {
    toast.error(NETWORK_ERROR_MESSAGE, { id: NETWORK_TOAST_ID })
    return
  }
  toast.error(apiError.message)
}

/**
 * 네트워크 단절일 때만 전역 안내. 조회 에러처럼 화면(ErrorBoundary)이 따로 있어서
 * 도메인 에러 토스트는 원치 않고 오프라인만 알리고 싶을 때 쓴다.
 */
export const notifyNetworkError = ({ error }: { error: unknown }): void => {
  const apiError = toApiError({ error })
  if (apiError.isNetworkError) {
    toast.error(NETWORK_ERROR_MESSAGE, { id: NETWORK_TOAST_ID })
  }
}
