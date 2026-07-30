import { useQuery } from '@tanstack/react-query'

import { getOfficeBusinessHours, getOfficeContactList } from '@/features/mypage/api/office'
import {
  officeBusinessHoursQueryKey,
  officeContactListQueryKey,
} from '@/features/mypage/constants/query'
import { useAuthStore } from '@/shared/stores/authStore'

/**
 * 관리사무소 연락처·운영시간. 레거시 `useGetOfficeContactList.js`·`useGetOfficeBusinessHours.js`.
 *
 * ⚠️ **에러 처리가 없다.** 레거시도 없다 — 실패하면 `undefined`가 되고 화면이
 * 빈 상태 문구를 그린다. 조회 실패와 "등록된 내용 없음"이 구분되지 않는 것은
 * 레거시 동작이므로 그대로 둔다 (`deferred.md`).
 */

export const useOfficeContactList = () => {
  const aptUuid = useAuthStore((state) => {
    return state.aptInfo.aptUuid
  })

  const { data: officeContactList } = useQuery({
    queryKey: officeContactListQueryKey({ aptUuid }),
    queryFn: () => {
      return getOfficeContactList({ aptUuid: aptUuid ?? '' })
    },
    enabled: Boolean(aptUuid),
  })

  return { officeContactList }
}

export const useOfficeBusinessHours = () => {
  const aptUuid = useAuthStore((state) => {
    return state.aptInfo.aptUuid
  })

  const { data: officeBusinessHours } = useQuery({
    queryKey: officeBusinessHoursQueryKey({ aptUuid }),
    queryFn: () => {
      return getOfficeBusinessHours({ aptUuid: aptUuid ?? '' })
    },
    enabled: Boolean(aptUuid),
  })

  return { officeBusinessHours }
}
