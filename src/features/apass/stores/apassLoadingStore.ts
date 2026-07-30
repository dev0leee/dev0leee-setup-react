import { create } from 'zustand'

import type { ApassLoadingState } from '@/features/apass/types/apass'

/**
 * A-PASS 토글의 진행 상태. 레거시 `stores/apass.js` 이식.
 *
 * 이 플래그가 켜져 있으면 **네이티브 뒤로가기가 막힌다**(`useNativeBackButton`).
 * 토글 요청과 앱 응답 사이에 화면을 벗어나면 상태가 어긋나기 때문이다.
 *
 * ⚠️ 레거시는 7초 타임아웃 경로에서 이 플래그를 내리지 않아 **뒤로가기가 영구히
 * 막힌다** (`deferred.md` D-156 · `apass.md` AP-Q3). 도메인 이관 시 확인할 항목이다.
 */
export const useApassLoadingStore = create<ApassLoadingState>((set) => {
  return {
    isApassLoading: false,
    setIsApassLoading: (isApassLoading) => {
      set({ isApassLoading })
    },
  }
})
