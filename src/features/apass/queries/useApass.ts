import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { getIsApassActive, patchApassActive } from '@/features/apass/api/apass'
import type { ApiError } from '@/shared/lib/apiErrors'
import { showErrorModal } from '@/shared/lib/errorModal'
import { nativeGetPermissionInfo } from '@/shared/lib/native/common'
import { useAuthStore } from '@/shared/stores/authStore'

/** A-PASS 사용 여부 조회 (AP1 · 메인 카드) */
export const useIsApassActive = () => {
  const aptResidentUuid = useAuthStore((state) => {
    return state.aptInfo.aptResidentUuid
  })

  const { data: isApassActive } = useQuery({
    queryKey: ['isAPassActive', aptResidentUuid],
    queryFn: () => {
      return getIsApassActive({ aptResidentUuid: aptResidentUuid ?? '' })
    },
    enabled: Boolean(aptResidentUuid),
  })

  return { isApassActive }
}

/**
 * A-PASS 토글 (AP1).
 *
 * 🔴 **레거시의 `invalidateQueries`가 v4 위치인자라 v5에서 조용히 no-op이었다.**
 * 이 화면은 **UI 갱신 경로가 이것뿐**이라 무효화가 죽으면 토글해도 헤더 색·문구·
 * 토글 이미지가 그대로 남는다. 객체 시그니처로 고쳤다 (`apass.md` §4-2).
 *
 * ⚠️ **성공 후 권한 정보도 다시 요청한다.** 순서를 유지한다.
 */
export const usePatchApassActive = () => {
  const queryClient = useQueryClient()
  const aptResidentUuid = useAuthStore((state) => {
    return state.aptInfo.aptResidentUuid
  })

  const { mutate: patchApassActiveMutation, isPending: isPatchApassActivePending } = useMutation({
    mutationFn: () => {
      return patchApassActive({ aptResidentUuid: aptResidentUuid ?? '' })
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['isAPassActive', aptResidentUuid] })
      nativeGetPermissionInfo()
    },
    onError: (error: ApiError) => {
      showErrorModal({ text: error.message })
    },
  })

  return { patchApassActiveMutation, isPatchApassActivePending }
}
