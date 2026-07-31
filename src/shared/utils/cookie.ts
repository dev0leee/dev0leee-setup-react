/**
 * 쿠키 읽기·쓰기. 레거시가 **공지 팝업과 투표 팝업 두 파일에 같은 구현을 복사해** 갖고
 * 있던 것을 하나로 합쳤다.
 *
 * `localStorage`가 아니라 쿠키인 이유는 **자정에 저절로 사라져야** 하기 때문이다 —
 * 만료 시각을 코드가 관리할 필요가 없다.
 *
 * ⚠️ **웹뷰에서 쿠키가 유지되는지 미확인이다.** 유지되지 않으면 `오늘 하루 보지 않기`가
 * 매번 초기화된다 (`board.md` BD-Q7 · 실기기 확인 대상).
 */

/** 오늘 자정(23:59:59.999)에 만료되는 쿠키를 심는다 */
export const setCookieUntilMidnight = ({ name, value }: { name: string; value: string }): void => {
  const now = new Date()
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)

  document.cookie = `${name}=${value};expires=${endOfDay.toUTCString()};path=/`
}

export const getCookie = ({ name }: { name: string }): string | null => {
  const matched = document.cookie.match(`(^|;) ?${name}=([^;]*)(;|$)`)

  return matched?.[2] ?? null
}
