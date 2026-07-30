import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'

import { getAptList } from '@/features/signup/api/signup'
import { aptListQueryKey } from '@/features/signup/constants/query'

/**
 * 아파트 검색. 레거시 `lib/queries/auth/useGetAptList.js` 이식.
 *
 * ⚠️ **`enabled` 가드를 두지 않았다.** 레거시가 빈 키워드로도 즉시 호출하고, 그 결과가
 * `검색 결과가 없습니다` 문구 노출을 좌우한다 — 가드를 넣으면 `aptList`가 `undefined`가 되어
 * **검색 전 화면이 달라진다** (`signup.md` S-Q6). 불필요한 요청 1회는 레거시 그대로다.
 *
 * ⚠️ 레거시는 `watch(keyword)`에서 `invalidateQueries(['aptList', keyword])`를 부른다.
 * **키에 `keyword`가 이미 들어 있어 무효화가 불필요하다** — 키가 바뀌면 새로 fetch된다.
 * 게다가 v4 위치 인자라 v5에서는 no-op이다. 옮기지 않았다 (`deferred.md` D-30).
 */
export const useAptList = () => {
  const [keyword, setKeyword] = useState('')

  const { data: aptList } = useQuery({
    queryKey: aptListQueryKey({ keyword }),
    queryFn: () => {
      return getAptList({ keyword })
    },
  })

  return { aptList, searchApt: setKeyword }
}
