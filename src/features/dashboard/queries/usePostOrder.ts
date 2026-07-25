import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { createOrder } from '@/features/dashboard/api/dashboard'
import { ORDER_TOAST_MESSAGE } from '@/features/dashboard/constants/order'

/**
 * 주문 생성. 성공 시 dashboard 하위 쿼리를 접두 매칭으로 전부 무효화하고
 * 토스트를 쏜다. 화면 전환 등 추가 동작은 호출부가 mutate 콜백으로 넘긴다.
 */
export const usePostOrder = () => {
  const queryClient = useQueryClient()

  const {
    mutate: postOrderMutation,
    isSuccess: isPostOrderSuccess,
    isPending: isPostOrderPending,
  } = useMutation({
    mutationFn: createOrder,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success(ORDER_TOAST_MESSAGE.created)
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  return { postOrderMutation, isPostOrderSuccess, isPostOrderPending }
}
