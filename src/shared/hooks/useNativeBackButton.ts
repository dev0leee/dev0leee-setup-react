import { useEffect, useRef } from 'react'

import { subscribeToBackButton } from '@/shared/lib/native/common'

/**
 * 네이티브 하드웨어 뒤로가기를 구독한다.
 *
 * `lib/native`가 창구고 이 훅은 React 생명주기에 맞춰 구독을 붙였다 뗀다.
 * handler를 ref에 담는 이유: 호출부가 인라인 함수를 넘겨도 매 렌더 재구독하지 않기 위해서다.
 */
export const useNativeBackButton = (handler: (canGoBack: boolean) => void): void => {
  const handlerRef = useRef(handler)

  useEffect(() => {
    handlerRef.current = handler
  }, [handler])

  useEffect(() => subscribeToBackButton((canGoBack) => handlerRef.current(canGoBack)), [])
}
