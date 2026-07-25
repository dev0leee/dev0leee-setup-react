import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { updateOrder } from '@/features/dashboard/api/dashboard'
import { ORDER_TOAST_MESSAGE } from '@/features/dashboard/constants/order'

/** 주문 부분 수정. 목록·상세가 같은 접두를 쓰므로 한 번에 무효화된다. */
export const usePatchOrder = () => {
  const queryClient = useQueryClient()

  const {
    mutate: patchOrderMutation,
    isSuccess: isPatchOrderSuccess,
    isPending: isPatchOrderPending,
  } = useMutation({
    mutationFn: updateOrder,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success(ORDER_TOAST_MESSAGE.updated)
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  return { patchOrderMutation, isPatchOrderSuccess, isPatchOrderPending }
}
