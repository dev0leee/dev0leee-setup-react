import { STORAGE_KEY } from '@/shared/constants/storage'

/**
 * 토큰은 **localStorage**에 둔다.
 *
 * 템플릿은 원래 accessToken을 메모리에만 두고 refreshToken을 HttpOnly 쿠키에 맡겼다.
 * 그쪽이 더 안전하지만, 레거시가 두 토큰 모두 localStorage에 넣고 자동 로그인까지
 * 그 값에 의존하고 있어 **등가 이관을 위해 레거시 방식을 유지한다**
 * (`docs/migration/decisions/auth-strategy.md`). 쿠키 전환은 `deferred.md` D-17.
 */

/**
 * 레거시 `useAuthStorage.parseTokenValue` 재현.
 *
 * 과거 버전이 토큰을 `JSON.stringify`해서 저장한 흔적이 있어 값이 `"eyJ..."`처럼
 * 따옴표에 싸여 있을 수 있다. **읽을 때는 벗기고 쓸 때는 raw로 넣는다.**
 * 이 비대칭이 기존 사용자 데이터 호환의 핵심이라 그대로 옮긴다.
 */
const readToken = (key: string): string | null => {
  const raw = localStorage.getItem(key)
  if (!raw) return null

  if (raw.startsWith('"') && raw.endsWith('"')) {
    try {
      return JSON.parse(raw) as string
    } catch (error) {
      console.warn('[tokenStore] 토큰 파싱에 실패했습니다.', error)
      return raw
    }
  }

  return raw
}

const writeToken = (key: string, token: string | null): void => {
  if (token === null) {
    localStorage.removeItem(key)
    return
  }
  localStorage.setItem(key, token)
}

export const getAccessToken = (): string | null => {
  return readToken(STORAGE_KEY.ACCESS_TOKEN)
}

export const getRefreshToken = (): string | null => {
  return readToken(STORAGE_KEY.REFRESH_TOKEN)
}

export const setAccessToken = ({ token }: { token: string | null }): void => {
  writeToken(STORAGE_KEY.ACCESS_TOKEN, token)
}

export const setRefreshToken = ({ token }: { token: string | null }): void => {
  writeToken(STORAGE_KEY.REFRESH_TOKEN, token)
}

/** 로그인 응답의 두 토큰을 한 번에 저장한다 (레거시 `setAuth`). */
export const setTokens = ({
  accessToken,
  refreshToken,
}: {
  accessToken: string | null
  refreshToken: string | null
}): void => {
  setAccessToken({ token: accessToken })
  setRefreshToken({ token: refreshToken })
}

export const clearTokens = (): void => {
  setTokens({ accessToken: null, refreshToken: null })
}
