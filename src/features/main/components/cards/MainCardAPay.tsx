import { getMainEnv } from '@/config/env'
import { useResidentDetailInfo } from '@/shared/hooks/useResidentDetailInfo'
import { getCommunityQueryString } from '@/shared/lib/communityLink'
import { openExternalLink } from '@/shared/lib/externalLink'

/**
 * A-PAY 결제금액 카드. 레거시 `MainCardAPay.vue` 이식.
 *
 * ⚠️ 제목이 `A-PAY <br /> 결제금액`으로 **줄바꿈이 마크업에 박혀 있다.**
 */
export const MainCardAPay = () => {
  const { hasAptAPayPaymentContent } = useResidentDetailInfo()

  if (!hasAptAPayPaymentContent) return null

  return (
    <button
      type="button"
      className="flex h-[54px] w-full cursor-pointer justify-between gap-2 rounded-lg bg-white px-4 py-3"
      onClick={() => {
        openExternalLink({
          url: `${getMainEnv().VITE_VERSION_ONE_URL}/apay/use-history${getCommunityQueryString()}`,
        })
      }}
    >
      <h2 className="flex items-center text-left pretendard-14Bold break-keep text-defaults-primary-text-primary">
        A-PAY <br />
        결제금액
      </h2>
      <div className="flex items-center">
        <p className="text-right pretendard-12Regular break-keep text-defaults-tertiary-text-tertiary">
          이용 내역
        </p>
      </div>
    </button>
  )
}
