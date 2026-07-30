import { useEffect, useRef } from 'react'

/**
 * 네이티브 이벤트 구독을 React 생명주기에 맞춘다.
 *
 * `handler`를 ref에 담는 이유: 호출부가 인라인 함수를 넘겨도 매 렌더마다
 * 재구독하지 않게 하기 위해서다. `subscribe`는 도메인 파일이 내보낸
 * `subscribeToXxx` 함수를 그대로 넘긴다.
 */
export const useNativeSubscription = <T>({
  subscribe,
  handler,
}: {
  subscribe: (options: { handler: (payload: T) => void }) => () => void
  handler: (payload: T) => void
}): void => {
  const handlerRef = useRef(handler)

  useEffect(() => {
    handlerRef.current = handler
  }, [handler])

  useEffect(() => {
    return subscribe({
      handler: (payload) => {
        handlerRef.current(payload)
      },
    })
  }, [subscribe])
}
