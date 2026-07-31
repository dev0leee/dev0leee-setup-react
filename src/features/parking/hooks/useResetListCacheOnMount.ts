import { useQueryClient } from '@tanstack/react-query'
import { useRef } from 'react'

/**
 * 목록 화면에 들어올 때 캐시를 비운다 — **항상 page 0부터 시작**시키는 장치다.
 * 레거시 주차 목록 훅 6개가 `setup` 본문에서 `queryClient.removeQueries()`를 부른다.
 *
 * ⚠️ **`useEffect`가 아니라 첫 렌더 중에 부른다.** effect로 옮기면 첫 렌더에서 이전
 * 캐시(여러 페이지)가 한 프레임 보였다가 사라진다 — 레거시에는 없는 깜빡임이다.
 * `setup` 본문은 쿼리가 만들어지기 **전**에 돌기 때문이다. `useRef` 가드로 한 번만 돈다
 * (`parking.md` §3-4 「반드시 지켜야 할 것」 #4).
 *
 * ⚠️ **접두사 매칭이라 파라미터가 다른 같은 목록의 캐시가 전부 지워진다.**
 * 그래서 즐겨찾기 목록에 들어가면 항상허용 캐시도 함께 날아간다 —
 * 한 컴포넌트가 두 훅을 다 호출하기 때문이다(PR2). 레거시 그대로다.
 */
export const useResetListCacheOnMount = ({ queryKey }: { queryKey: string }) => {
  const queryClient = useQueryClient()
  const hasResetRef = useRef(false)

  if (!hasResetRef.current) {
    hasResetRef.current = true
    queryClient.removeQueries({ queryKey: [queryKey] })
  }
}
