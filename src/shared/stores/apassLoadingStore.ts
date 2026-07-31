import { create } from 'zustand'

import type { ApassLoadingState } from '@/shared/types/apassLoading'

/**
 * A-PASS 토글의 진행 상태. 레거시 `stores/apass.js` 이식.
 *
 * 이 플래그가 켜져 있으면 **네이티브 뒤로가기가 막힌다**(`useNativeBackButton`).
 * 토글 요청과 앱 응답 사이에 화면을 벗어나면 상태가 어긋나기 때문이다.
 *
 * ✅ 레거시는 7초 타임아웃 경로에서 이 플래그를 내리지 않아 **뒤로가기가 영구히
 * 막혔다**(D-156). 사용자 결정(AP-Q3)에 따라 **타임아웃에서도 함께 내린다.**
 *
 * **`shared`에 두는 이유**: 네이티브 뒤로가기(`app/hooks/useNativeBackButton`)가 읽는
 * 앱 전역 상태라서다. 도메인 슬라이스에 두면 A-PASS 화면 전체가 초기 번들에 끌려온다
 * (`deferred.md` D-294).
 */
export const useApassLoadingStore = create<ApassLoadingState>((set) => {
  return {
    isApassLoading: false,
    setIsApassLoading: (isApassLoading) => {
      set({ isApassLoading })
    },
  }
})
