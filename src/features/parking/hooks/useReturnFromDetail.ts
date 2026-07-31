import { useCallback, useEffect, useRef } from 'react'
import { useNavigationType } from 'react-router-dom'

/** 목록마다 다른 키를 쓴다. 게시판의 스크롤 복원처럼 전역 키 하나를 공유하지 않는다 */
const storageKey = (listKey: string) => {
  return `parkingListForward:${listKey}`
}

/** 저장해 두는 값. "이 목록에서 마지막으로 상세로 나갔다"는 표시다 */
const LEFT_TO_DETAIL = 'detail'

/**
 * "상세 화면에 다녀와서 돌아온 것인지" 판정한다.
 * 레거시 `router.options.history.state?.forward`의 대체물이다 (PK-Q2 · **A안 확정**).
 *
 * 이 판정이 참이면 목록은 **캐시를 비우지 않고** `staleTime: Infinity`로 재조회도 막는다 —
 * 상세를 보고 돌아왔을 때 여러 페이지를 다시 받지 않게 하는 장치다.
 *
 * ### 판정 방법
 *
 * vue-router의 `history.state.forward`는 **"이 히스토리 항목에서 마지막으로 어디로
 * 나갔는가"**다. React Router에는 같은 필드가 없어, **상세로 나가는 순간 화면이 직접
 * 표시를 남긴다**(`markLeavingToDetail`). 언마운트 시 그 표시를 저장하고, 다시 마운트될 때
 * 읽는다.
 *
 * ⚠️ **언마운트 시점의 `window.location.pathname`을 읽지 않는다.** 실제 브라우저에서는
 * 그 값이 새 경로라 판정에 쓸 수 있지만, 테스트의 `MemoryRouter`에서는 라우터 경로가
 * 아니라 jsdom URL이 나와 **검증할 수 없는 코드**가 된다 (`board.md` B1에서 같은 문제를 겪었다).
 *
 * ⚠️ **`POP`일 때만 인정한다.** 저장값은 히스토리 항목이 아니라 목록별로 하나뿐이라,
 * 상세로 나갔다가 그쪽에서 앞으로 더 이동한 뒤 **새로 목록에 들어오는** 경우에 값이
 * 남아 있을 수 있다. 그 진입은 `PUSH`라서 걸러진다 — 레거시가 새 히스토리 항목에서
 * `forward`를 비워 두는 것과 같은 결과다.
 *
 * ⚠️ 대안이던 "`POP`이면 무조건 복귀로 본다"는 채택하지 않았다. **등록 화면에서
 * 뒤로 왔을 때도 캐시가 유지돼** 레거시와 달라진다.
 */
export const useReturnFromDetail = ({ listKey }: { listKey: string }) => {
  const navigationType = useNavigationType()

  // 첫 렌더 중에 읽는다 — 목록 훅이 이 값을 보고 캐시를 비울지 정하기 때문이다.
  // 읽기만 하므로 StrictMode의 이중 렌더에서도 결과가 같다(지우는 것은 effect가 한다).
  const storedForwardRef = useRef<string | null>(null)
  storedForwardRef.current ??= sessionStorage.getItem(storageKey(listKey)) ?? ''

  const isFromDetail = navigationType === 'POP' && storedForwardRef.current === LEFT_TO_DETAIL

  const isLeavingToDetailRef = useRef(false)

  /** 상세로 이동하기 직전에 화면이 부른다 */
  const markLeavingToDetail = useCallback(() => {
    isLeavingToDetailRef.current = true
  }, [])

  useEffect(() => {
    // 한 번 쓰고 버린다. 남겨두면 다음 진입이 잘못된 값을 본다
    sessionStorage.removeItem(storageKey(listKey))

    return () => {
      if (isLeavingToDetailRef.current) {
        sessionStorage.setItem(storageKey(listKey), LEFT_TO_DETAIL)
        return
      }
      sessionStorage.removeItem(storageKey(listKey))
    }
  }, [listKey])

  return { isFromDetail, markLeavingToDetail }
}
