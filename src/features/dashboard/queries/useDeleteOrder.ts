import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { deleteOrder } from '@/features/dashboard/api/dashboard'
import { ORDER_TOAST_MESSAGE } from '@/features/dashboard/constants/order'

/** 주문 삭제. */
export const useDeleteOrder = () => {
  const queryClient = useQueryClient()

  const {
    mutate: deleteOrderMutation,
    isSuccess: isDeleteOrderSuccess,
    isPending: isDeleteOrderPending,
  } = useMutation({
    mutationFn: deleteOrder,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success(ORDER_TOAST_MESSAGE.deleted)
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  return { deleteOrderMutation, isDeleteOrderSuccess, isDeleteOrderPending }
}
