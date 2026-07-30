import { useQuery } from '@tanstack/react-query'

import { RESIDENT_APT_LIST_QUERY_KEY } from '@/features/main/constants/query'
import { fetchResidentAptList } from '@/shared/lib/aptContext'

/**
 * 입주민이 속한 단지 목록. 레거시 `useGetResidentAptList.js` 이식.
 *
 * ⚠️ **레거시의 `enabled: false` + 마운트 시 `refetch()`를 그대로 옮기지 않았다.**
 * 그 조합은 "훅이 항상 살아 있고 필요할 때만 부른다"는 구조인데, 타깃에서는 이 훅을
 * **드로어가 열릴 때만 마운트**하므로 기본 동작(마운트 시 1회 조회)과 결과가 같다.
 * 요청 횟수도 1회로 동일하다.
 */
export const useResidentAptList = () => {
  const {
    data: residentAptList,
    isLoading: isResidentAptListLoading,
    isError: isResidentAptListError,
  } = useQuery({
    queryKey: RESIDENT_APT_LIST_QUERY_KEY,
    queryFn: fetchResidentAptList,
  })

  return { residentAptList, isResidentAptListLoading, isResidentAptListError }
}
