import { useQuery } from '@tanstack/react-query'

import { getShoppingToken } from '@/features/main/api/main'
import { shoppingTokenQueryKey } from '@/features/main/constants/query'
import { useAuthStore } from '@/shared/stores/authStore'

/**
 * 쇼핑몰 SSO 토큰. 레거시 `useGetShoppingToken.js` 이식.
 *
 * **`enabled: false` + 수동 `refetch()`를 그대로 유지한다.** 여기서는 레거시와 달리
 * 없앨 수 없다 — 사용자가 쇼핑몰 메뉴를 누른 **그 순간** 토큰을 받아야 하고,
 * 마운트 시 미리 받아두면 쓰지도 않을 토큰을 매번 발급하게 된다.
 */
export const useShoppingToken = () => {
  const aptResidentUuid = useAuthStore((state) => {
    return state.aptInfo.aptResidentUuid
  })

  const { refetch: refetchShoppingToken, isFetching: isShoppingTokenFetching } = useQuery({
    queryKey: shoppingTokenQueryKey({ aptResidentUuid }),
    queryFn: getShoppingToken,
    enabled: false,
  })

  return { refetchShoppingToken, isShoppingTokenFetching }
}
