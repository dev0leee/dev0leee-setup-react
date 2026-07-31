import { useQuery } from '@tanstack/react-query'

import { getNoticeTopThree } from '@/features/main/api/main'
import { noticeTopThreeQueryKey } from '@/features/main/constants/query'
import { useAuthStore } from '@/shared/stores/authStore'

/**
 * 최근 공지 3건. 레거시 `useGetNoticeTopThree.js` 이식.
 *
 * ⚠️ 레거시는 `select` 안에서 `recentlyNotice.value = firstData`로 **첫 건을 ref에 담는다.**
 * 그 값을 읽는 곳이 어디에도 없어 옮기지 않았다 (`select`에서 부수효과를 내는 것 자체가
 * 재계산 시점을 예측할 수 없게 만든다).
 */
export const useNoticeTopThree = () => {
  const aptUuid = useAuthStore((state) => {
    return state.aptInfo.aptUuid
  })

  const {
    data: noticeTopThree,
    isLoading: isNoticeTopThreeLoading,
    isError: isNoticeTopThreeError,
  } = useQuery({
    queryKey: noticeTopThreeQueryKey({ aptUuid }),
    queryFn: () => {
      return getNoticeTopThree({ aptUuid: aptUuid ?? '' })
    },
  })

  return { noticeTopThree, isNoticeTopThreeLoading, isNoticeTopThreeError }
}
