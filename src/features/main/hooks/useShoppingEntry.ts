import { useShoppingNavigation } from '@/features/main/hooks/useShoppingNavigation'
import { useResidentDetailInfo } from '@/shared/hooks/useResidentDetailInfo'

/**
 * 쇼핑몰 진입 버튼의 공통 동작. 광고 배너와 메뉴 스와이퍼가 **같은 판정**을 쓴다
 * (레거시도 두 컴포넌트에 같은 코드가 복사돼 있다).
 *
 * ⚠️ **동의 여부가 아니라 "한 번이라도 선택했는가"로 판단한다.** 두 플래그가 모두
 * `null`이 아니면 이미 물어본 것이므로 바로 쇼핑몰을 열고, 하나라도 `null`이면
 * 동의 바텀시트를 띄운다. `false`로 저장한 사용자에게 다시 묻지 않기 위한 조건이다.
 */
export const useShoppingEntry = ({ onOpenTerms }: { onOpenTerms: () => void }) => {
  const { residentDetailInfo } = useResidentDetailInfo()
  const { isShoppingLoading, openShopping } = useShoppingNavigation()

  const hasConsentFlags =
    residentDetailInfo != null &&
    residentDetailInfo.marketingDataConsentFlag != null &&
    residentDetailInfo.receiveAdvertsConsentFlag != null

  const enterShopping = async () => {
    if (isShoppingLoading) return

    if (hasConsentFlags) {
      await openShopping()
      return
    }

    onOpenTerms()
  }

  return { enterShopping }
}
