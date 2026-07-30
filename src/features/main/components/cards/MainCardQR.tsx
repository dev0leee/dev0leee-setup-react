import { getMainEnv } from '@/config/env'
import { useResidentDetailInfo } from '@/shared/hooks/useResidentDetailInfo'
import { getCommunityQueryString } from '@/shared/lib/communityLink'
import { openExternalLink } from '@/shared/lib/externalLink'

/**
 * A-PAY 결제 QR 카드. 레거시 `MainCardQR.vue` 이식.
 *
 * 구버전 사이트로 나가는 **외부 링크**다. `VITE_VERSION_ONE_URL`은 메인 앱 전용 변수라
 * `getMainEnv()`로 읽는다.
 *
 * ⚠️ 배경이 `bg-defaults-primary-background-primary`다 — 옆의 A-PAY 카드는 `bg-white`로
 * 서로 다르게 적혀 있다. 값은 같지만 표기가 다른 것까지 그대로 옮겼다.
 */
export const MainCardQR = () => {
  const { hasAptAPayQrContent } = useResidentDetailInfo()

  if (!hasAptAPayQrContent) return null

  return (
    <button
      type="button"
      className="flex h-[54px] w-full cursor-pointer items-center justify-between gap-2 self-stretch rounded-lg bg-defaults-primary-background-primary px-4 py-3"
      onClick={() => {
        openExternalLink({
          url: `${getMainEnv().VITE_VERSION_ONE_URL}/apay/qrcode${getCommunityQueryString()}`,
        })
      }}
    >
      <h2 className="flex items-center text-left pretendard-14Bold break-keep">A-PAY 결제 QR</h2>
      <img src="/assets/icons/QR.svg" alt="QR 이미지" className="h-[24px] w-[24px]" />
    </button>
  )
}
