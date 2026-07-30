import { useCallback } from 'react'
import { useMatches, useNavigate } from 'react-router-dom'

import { DEFAULT_ROUTE_LAYOUT } from '@/shared/constants/layout'
import type { RouteLayoutConfig } from '@/shared/types/layout'

/**
 * 라우트 메타로 레이아웃을 정한다. 레거시 `lib/composables/useLayoutConfig.js` 이식.
 *
 * 레거시의 `route.meta`를 react-router의 **`handle`**로 옮겼다.
 * `useMatches()`가 루트부터 현재까지의 매치를 주므로 **가장 안쪽 것**을 쓴다 —
 * 중첩 라우트에서 자식이 부모 설정을 덮는 vue-router `meta` 동작과 같다.
 */
export const useLayoutConfig = () => {
  const matches = useMatches()
  const navigate = useNavigate()

  const handle = matches.at(-1)?.handle as Partial<RouteLayoutConfig> | undefined
  const layoutConfig: RouteLayoutConfig = { ...DEFAULT_ROUTE_LAYOUT, ...handle }

  const { backPath } = layoutConfig

  const onBack = useCallback(() => {
    if (!backPath) return
    void navigate(backPath)
  }, [backPath, navigate])

  return {
    layoutConfig,
    /** `backPath`가 없으면 undefined를 준다 → AppBar가 기본 히스토리 뒤로가기를 쓴다 */
    appBarOnBack: backPath ? onBack : undefined,
  }
}
