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
