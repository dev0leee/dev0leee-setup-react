import { env } from '@/config/env'
import { NETWORK_ERROR_MESSAGE } from '@/shared/constants/message'
import { showToast } from '@/shared/lib/toast'

/**
 * 외부 링크로 이동한다. 레거시 `lib/composables/useOpenExternalLink.js` 이식.
 *
 * 이름이 `use*`였지만 **훅이 아니다** — 그냥 함수다. 타깃에서는 이름도 맞췄다.
 *
 * ⚠️ **오프라인 가드에 `origin === baseUrl` 조건이 붙어 있다.** 즉 배포된 앱에서만
 * 막고 로컬 개발 서버에서는 오프라인이어도 그냥 연다. 레거시 그대로다.
 *
 * ⚠️ `window.open(url, '_self')` — 새 탭이 아니라 **현재 창을 대체**한다. 웹뷰에서
 * 뒤로가기로 돌아올 수 있게 하는 방식이다.
 */
export const openExternalLink = ({ url }: { url: string }): void => {
  if (!window.navigator.onLine && window.location.origin === env.VITE_BASE_URL) {
    showToast({ message: NETWORK_ERROR_MESSAGE })
    return
  }

  window.open(url, '_self')
}
