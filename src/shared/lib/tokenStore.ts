/**
 * Access Token은 모듈 스코프 메모리에만 둔다.
 *
 * Zustand에 넣지 않는 이유:
 *  1. 토큰 값이 바뀌어도 리렌더가 필요 없다.
 *  2. devtools / persist 미들웨어에 실수로 노출될 위험을 원천 차단한다.
 *
 * localStorage / sessionStorage 저장은 XSS 시 탈취되므로 금지.
 */
let accessToken: string | null = null

export const getAccessToken = (): string | null => {
  return accessToken
}

export const setAccessToken = ({ token }: { token: string | null }): void => {
  accessToken = token
}
