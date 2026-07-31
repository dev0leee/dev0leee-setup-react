import { useEffect, useRef, useState } from 'react'

/**
 * 센티널이 화면에 들어왔는지 알려준다. vueuse `useIntersectionObserver` 대체물.
 *
 * 무한 스크롤 목록 전부가 같은 형태로 쓴다 — 목록 끝에 빈 `<div>`를 두고,
 * 그것이 보이면 다음 페이지를 부른다.
 *
 * ```tsx
 * const { targetRef, isIntersecting } = useIntersectionObserver()
 * useEffect(() => {
 *   if (isIntersecting && hasNextPage) void fetchNextPage()
 * }, [isIntersecting, hasNextPage, fetchNextPage])
 * ...
 * <div ref={targetRef} className="w-full pt-4" />
 * ```
 *
 * ⚠️ **`isIntersecting`을 상태로 노출한다**(콜백이 아니다). 레거시가 `targetIsVisible`
 * ref에 담고 `watchEffect`로 반응하는 구조라 그대로 옮기려면 상태여야 한다.
 * 콜백으로 만들면 "보이는 동안 계속"이 아니라 "보이기 시작한 순간"만 잡혀
 * 페이지 로드 후 센티널이 계속 보일 때 다음 장을 부르지 않는다.
 */
export const useIntersectionObserver = <TElement extends HTMLElement>() => {
  const targetRef = useRef<TElement>(null)
  const [isIntersecting, setIsIntersecting] = useState(false)

  useEffect(() => {
    const target = targetRef.current
    if (!target) return

    const observer = new IntersectionObserver((entries) => {
      const [entry] = entries
      setIsIntersecting(entry?.isIntersecting ?? false)
    })

    observer.observe(target)

    return () => {
      observer.disconnect()
    }
  }, [])

  return { targetRef, isIntersecting }
}
