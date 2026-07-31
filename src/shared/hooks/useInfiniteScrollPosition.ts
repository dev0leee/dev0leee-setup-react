import { useCallback, useEffect, useRef } from 'react'

/** 복원 규칙. `moveFrom`에서 되돌아와 `moveTo`에 있을 때만 위치를 되살린다 */
export interface ScrollRestoreRule {
  /** 떠날 때 향한 경로에 이 문자열이 들어 있어야 한다 (예: `/detail`) */
  moveFrom: string
  /** 돌아온 현재 경로에 이 중 하나가 들어 있어야 한다 */
  moveTo: string | string[]
}

/**
 * ⚠️ **저장 키가 하나뿐이다.** 소통공간·민원공간·아파트먼트 공지가 전부 이 키를
 * 덮어쓴다. 목록 A → 상세 → 뒤로 → 목록 B로 가면 B가 A의 위치로 복원될 수 있다.
 * 레거시 그대로다 (`board.md` §3-2 · `deferred.md`).
 */
const STORAGE_KEY = 'scrollRestoration'

interface StoredScroll {
  position: number
  /** 이 목록을 떠날 때 향한 경로. 레거시의 `history.state.forward`에 대응한다 */
  forward: string
}

/**
 * 목록 → 상세 → 뒤로 시 스크롤 위치를 되살린다.
 * 레거시 `lib/composables/useInfiniteScrollPosition.js` 이식.
 *
 * ⚠️ **레거시는 `router.options.history.state.forward`를 읽어 "어디서 되돌아왔는지"를
 * 판단한다.** React Router의 history state에는 그 필드가 없다. 대신 **떠나는 순간
 * 향하던 경로를 함께 저장**해 같은 판정을 만든다 — 언마운트 정리 시점에는 이미
 * `history.pushState`가 끝나 `window.location.pathname`이 **새 경로**이기 때문이다.
 *
 * 그래서 판정 결과가 레거시와 같다: 상세로 나갔다가 돌아왔을 때만 복원하고,
 * 글쓰기 등 다른 경로로 나갔다 오면 복원하지 않는다.
 */
export const useInfiniteScrollPosition = <TElement extends HTMLElement>({
  rules,
}: {
  rules: ScrollRestoreRule | ScrollRestoreRule[]
}) => {
  const scrollContainerRef = useRef<TElement>(null)

  // 규칙은 호출부에서 객체 리터럴로 넘어와 매 렌더 참조가 바뀐다. effect가 매번
  // 도는 것을 막으려고 ref에 담는다 — 값 자체는 화면 수명 동안 바뀌지 않는다.
  const rulesRef = useRef(rules)
  rulesRef.current = rules

  const matchesRule = useCallback(
    ({ forward, currentPath }: StoredScroll & { currentPath: string }) => {
      const ruleList = Array.isArray(rulesRef.current) ? rulesRef.current : [rulesRef.current]

      return ruleList.some((rule) => {
        const toList = Array.isArray(rule.moveTo) ? rule.moveTo : [rule.moveTo]

        return (
          forward.includes(rule.moveFrom) &&
          toList.some((path) => {
            return currentPath.includes(path)
          })
        )
      })
    },
    [],
  )

  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    // ── 복원: 컨테이너가 붙는 순간 한 번 ────────────────────────────────────
    const saved = sessionStorage.getItem(STORAGE_KEY)

    if (saved !== null) {
      try {
        const scrollInfo = JSON.parse(saved) as StoredScroll

        if (matchesRule({ ...scrollInfo, currentPath: window.location.pathname })) {
          container.scrollTop = scrollInfo.position
        }
      } catch (error) {
        console.error('[useInfiniteScrollPosition] 저장된 스크롤 위치를 읽지 못했습니다.', error)
      }
    }

    // ── 저장: 떠날 때. 규칙 검사 없이 항상 저장한다(레거시 동일) ────────────
    return () => {
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          position: container.scrollTop,
          forward: window.location.pathname,
        } satisfies StoredScroll),
      )
    }
  }, [matchesRule])

  return { scrollContainerRef }
}
