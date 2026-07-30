import { MainCardAPay } from '@/features/main/components/cards/MainCardAPay'
import { MainCardQR } from '@/features/main/components/cards/MainCardQR'
import { useResidentDetailInfo } from '@/shared/hooks/useResidentDetailInfo'

/**
 * A-PAY 2카드 묶음. 레거시 `MainApayMenus.vue` 이식.
 *
 * 둘 중 **하나라도** 구독하면 영역이 나오고, 각 카드는 자기 조건으로 다시 판단한다.
 * 그래서 하나만 구독하면 카드 한 장이 전체 폭을 쓴다.
 *
 * ⚠️ 카드 그리드(`MainCardMenus`) **밖**에 있다 — 카드 개수 계산에 들어가지 않는다.
 */
export const MainApayMenus = () => {
  const { hasAptAPayQrContent, hasAptAPayPaymentContent } = useResidentDetailInfo()

  if (!hasAptAPayQrContent && !hasAptAPayPaymentContent) return null

  return (
    <div className="flex w-full gap-2">
      <MainCardQR />
      <MainCardAPay />
    </div>
  )
}
