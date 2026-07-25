import { useSyncExternalStore } from 'react'

const subscribe = (callback: () => void) => {
  window.addEventListener('online', callback)
  window.addEventListener('offline', callback)
  return () => {
    window.removeEventListener('online', callback)
    window.removeEventListener('offline', callback)
  }
}

const getSnapshot = () => {
  return navigator.onLine
}

/**
 * 온라인/오프라인 상태를 구독한다. 오프라인 배너·제출 버튼 비활성화에 쓴다.
 *
 * useEffect + useState 대신 useSyncExternalStore를 쓴다 — 외부 스토어(navigator)를
 * 구독하는 표준 방법이고, 첫 렌더에 tearing 없이 정확한 값을 준다.
 */
export const useOnlineStatus = (): boolean => {
  return useSyncExternalStore(subscribe, getSnapshot)
}
