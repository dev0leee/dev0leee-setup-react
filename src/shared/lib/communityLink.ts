import { getAptInfo } from '@/shared/stores/authStore'

/**
 * 구버전(버전1) 사이트로 넘길 쿼리스트링. 레거시 `lib/utils/getCommunityQueryString.js` 이식.
 *
 * A-PAY 결제 QR·이용내역, 커뮤니티(v1) 링크가 쓴다. 구 사이트가 이 두 값으로 세션을
 * 인식한다 — 값이 없어도 문자열은 만들어진다(`undefined`가 그대로 붙는다). 레거시 동일.
 */
export const getCommunityQueryString = (): string => {
  const { communityToken, aptId } = getAptInfo()

  return `?token=${String(communityToken)}&aptId=${String(aptId)}`
}
