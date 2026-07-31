import { SHOPPING_ERROR_MESSAGE, SHOPPING_MALL_URL } from '@/features/main/constants/shopping'
import { useMarketingConsent } from '@/features/main/queries/useMarketingConsent'
import { useShoppingToken } from '@/features/main/queries/useShoppingToken'
import { isNativeApp } from '@/shared/lib/native/bridge'
import { nativeOpenNewWebView } from '@/shared/lib/native/common'
import { showToast } from '@/shared/lib/toast'

/**
 * 쇼핑몰 열기. 레거시 `lib/composables/useShoppingNavigation.js` 이식.
 *
 * 누를 때 SSO 토큰을 발급받아 외부 쇼핑몰 URL에 실어 보낸다.
 * 앱이면 새 웹뷰로, 웹이면 새 탭으로 연다.
 *
 * ⚠️ **토큰 4개가 쿼리스트링으로 나간다.** 히스토리·리퍼러·서버 로그에 남는 구조지만
 * 등가 이관으로 유지한다 (`deferred.md` D-39).
 */
export const useShoppingNavigation = () => {
  const { refetchShoppingToken, isShoppingTokenFetching } = useShoppingToken()
  const { marketingConsentMutateAsync } = useMarketingConsent()

  const openShopping = async () => {
    if (isShoppingTokenFetching) return

    const { data: shoppingToken } = await refetchShoppingToken()

    if (!shoppingToken) {
      showToast({ message: SHOPPING_ERROR_MESSAGE })
      return
    }

    const { accessToken, expiresIn, refreshToken, refreshTokenExpiresIn } = shoppingToken

    // ⚠️ `URLSearchParams`로 만들지 않는다. 인코딩 규칙이 달라 쇼핑몰이 받는 토큰
    // 문자열이 바뀔 수 있다(`+`·`/` 등). 레거시가 보내던 바이트 그대로 보낸다.
    const url = `${SHOPPING_MALL_URL}/?accessToken=${accessToken}&expiresIn=${String(expiresIn)}&refreshToken=${refreshToken}&refreshTokenExpiresIn=${String(refreshTokenExpiresIn)}`

    if (isNativeApp()) {
      // `hasBackButton`을 넘기지 않는다 — 레거시 호출이 그렇다 (`native/common.ts` 주석).
      nativeOpenNewWebView({ url, type: 'SHOPPING', title: '쇼핑몰' })
      return
    }

    window.open(url, '_blank')
  }

  /**
   * `괜찮아요`. **거절해도 쇼핑몰은 열린다** — 두 플래그를 `false`로 저장하고 진입한다.
   * 동의는 마케팅 수신용이지 입장 조건이 아니다.
   */
  const declineTerms = async () => {
    await marketingConsentMutateAsync({
      marketingDataConsentFlag: false,
      receiveAdvertsConsentFlag: false,
    })

    await openShopping()
  }

  return { isShoppingLoading: isShoppingTokenFetching, openShopping, declineTerms }
}
