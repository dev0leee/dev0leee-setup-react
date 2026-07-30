import { getAccessToken } from '@/shared/lib/tokenStore'
import { getAptInfo } from '@/shared/stores/authStore'

/**
 * 저장된 세션이 있는지. 레거시 `lib/utils/hasLocalStorageData.js` 이식.
 *
 * ⚠️ **토큰의 유효성은 검증하지 않는다.** 존재 여부만 본다.
 * 만료된 토큰이면 첫 요청이 `EXPIRED_TOKEN`으로 실패하고 인터셉터가 재발급한다.
 * 라우터 가드가 네트워크를 기다리지 않고 즉시 판단할 수 있는 이유다.
 *
 * 단지 정보(`aptResidentUuid`)까지 있어야 로그인 상태로 본다 —
 * 토큰만 있고 단지가 없으면 대부분의 쿼리 키를 만들 수 없다.
 */
export const hasStoredSession = (): boolean => {
  const hasAptInfo = Boolean(getAptInfo().aptResidentUuid)
  const hasAccessToken = Boolean(getAccessToken())

  return hasAptInfo && hasAccessToken
}

/**
 * 레거시 `authStore.isLoggedIn` — **액세스 토큰만** 본다
 * (`useAuthStorage.js:67` `!!accessToken`).
 *
 * `hasStoredSession`과 갈리는 지점이다: 토큰은 있고 단지 정보는 없는 상태에서
 * 라우터 가드는 막지만 에러 화면(`exception.md` E1)은 "로그인됨"으로 취급해
 * `/main`으로 보낸다. 레거시가 두 판정을 다르게 쓰는 것을 그대로 옮겼다.
 */
export const isLoggedIn = (): boolean => {
  return Boolean(getAccessToken())
}
