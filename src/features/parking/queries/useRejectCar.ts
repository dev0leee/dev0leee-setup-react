import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'

import { postRejectCar } from '@/features/parking/api/reject'
import { REJECT_ERROR_CODES, REJECT_TOAST_MESSAGE } from '@/features/parking/constants/parking'
import { inOutCarDetailQueryKey } from '@/features/parking/constants/query'
import { showCarMutationError } from '@/features/parking/queries/carMutationError'
import type { ApiError } from '@/shared/lib/apiErrors'
import { showToast } from '@/shared/lib/toast'
import { useAuthStore } from '@/shared/stores/authStore'

/**
 * 미확인 차량 거부 (PK10). 레거시 `usePostRejectCar.js` 이식.
 *
 * ⚠️ **`parkingUuid`는 서버로 가지 않는다.** 성공 후 상세 캐시를 무효화하는 데만 쓴다 —
 * 거부하면 `rejectFlag`가 서서 상세의 거부 영역이 사라져야 한다.
 *
 * ⚠️ 레거시 `invalidateQueries([...])`는 v4 위치인자라 v5에서 no-op이다. 객체로 옮겼다.
 */
export const useRejectCar = ({ parkingUuid }: { parkingUuid: string | undefined }) => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const aptResidentUuid = useAuthStore((state) => {
    return state.aptInfo.aptResidentUuid
  })

  const { mutate: rejectCarMutation, isPending: isRejectCarPending } = useMutation({
    mutationFn: ({ carNum, reason }: { carNum: string; reason: string }) => {
      return postRejectCar({ aptResidentUuid: aptResidentUuid ?? '', carNum, reason })
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: inOutCarDetailQueryKey({ aptResidentUuid, parkingUuid }),
      })
      void navigate(-1)
      showToast({ message: REJECT_TOAST_MESSAGE })
    },
    onError: (error: ApiError) => {
      showCarMutationError({ error, handledCodes: REJECT_ERROR_CODES })
    },
  })

  return { rejectCarMutation, isRejectCarPending }
}
