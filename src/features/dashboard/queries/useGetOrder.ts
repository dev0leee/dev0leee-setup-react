import { useQuery } from '@tanstack/react-query'

import { getOrder } from '@/features/dashboard/api/dashboard'

/**
 * 개별 주문 조회. 훅 하나가 queryKey·queryFn·반환까지 소유한다.
 * 반환은 이름 붙인 객체다 — data·isLoading을 그대로 내보내지 않는다 (02-naming).
 * 라우트 파라미터처럼 아직 없을 수 있는 값은 enabled로 요청을 막는다 (04-state).
 */
export const useGetOrder = ({ orderId }: { orderId: string | undefined }) => {
  const { data: order, isLoading: isOrderLoading } = useQuery({
    queryKey: ['dashboard', 'orders', orderId] as const,
    queryFn: () => {
      return getOrder({ orderId: orderId! })
    },
    enabled: Boolean(orderId),
  })

  return { order, isOrderLoading }
}
