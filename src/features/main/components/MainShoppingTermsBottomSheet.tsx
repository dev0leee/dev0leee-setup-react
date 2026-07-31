import { useState } from 'react'

import { MainShoppingTermsModalPage } from '@/features/main/components/MainShoppingTermsModalPage'
import { useShoppingNavigation } from '@/features/main/hooks/useShoppingNavigation'
import { useMarketingConsent } from '@/features/main/queries/useMarketingConsent'
import { ButtonBase } from '@/shared/components/common/ButtonBase'
import { DrawerBase } from '@/shared/components/common/DrawerBase'
import { SpinnerCircle } from '@/shared/components/common/SpinnerCircle'
import { TermsCheckboxList } from '@/shared/components/common/TermsCheckboxList'
import { MARKETING_TERMS_ITEMS, TERMS_ID } from '@/shared/constants/terms'
import { useTermsAgreement } from '@/shared/hooks/useTermsAgreement'

/**
 * 쇼핑 마케팅 동의 바텀시트. 레거시 `MainShoppingTermsBottomSheet.vue` 이식.
 *
 * 쇼핑몰 첫 진입(동의 이력 없음)에서만 뜬다.
 *
 * ⚠️ **거절해도 쇼핑몰은 열린다.** `괜찮아요`는 두 플래그를 `false`로 저장한 뒤 진입한다 —
 * 동의는 마케팅 수신용이지 입장 조건이 아니다.
 *
 * ⚠️ **체크박스가 처음부터 켜져 있다**(`initialValue: true`). 회원가입 약관 동의와
 * 반대다 (`main.md` §11).
 */
export const MainShoppingTermsBottomSheet = ({ onClose }: { onClose: () => void }) => {
  const { openShopping, declineTerms } = useShoppingNavigation()
  const { marketingConsentMutateAsync, isMarketingConsentPending } = useMarketingConsent()
  const { agreedState, changeAgreedState } = useTermsAgreement({
    items: MARKETING_TERMS_ITEMS,
    initialValue: true,
  })

  const [openTermsId, setOpenTermsId] = useState<string | null>(null)

  const decline = async () => {
    // 저장이 실패하면 에러 모달만 뜨고 시트는 열려 있다 — 레거시와 같다.
    try {
      await declineTerms()
    } catch {
      return
    }

    onClose()
  }

  const agreeTerms = async () => {
    try {
      await marketingConsentMutateAsync({
        marketingDataConsentFlag: agreedState[TERMS_ID.MARKETING_DATA_CONSENT] ?? false,
        receiveAdvertsConsentFlag: agreedState[TERMS_ID.RECEIVE_ADVERTS_CONSENT] ?? false,
      })
    } catch {
      return
    }

    await openShopping()
    onClose()
  }

  return (
    <>
      <DrawerBase open title="쇼핑 혜택 정보를 알려드릴게요" onClose={onClose}>
        <div className="max-h-[80vh] w-full overflow-y-auto px-5 pt-4 pb-2">
          <div className="mt-4 flex justify-center p-10">
            <img src="/assets/images/coupon.png" alt="쿠폰 이미지" />
          </div>
          <div className="mt-4">
            <TermsCheckboxList
              items={MARKETING_TERMS_ITEMS}
              checkedMap={agreedState}
              onChange={changeAgreedState}
              onMoveDetail={(item) => {
                setOpenTermsId(item.id)
              }}
            />
          </div>
          <div className="mt-10 flex flex-col items-center space-y-3">
            <p className="text-center pretendard-14Regular">
              두 가지 항목을 모두 동의해야 소식을 받을 수 있어요.
            </p>
            <ButtonBase
              type="button"
              color="brand"
              size="xl"
              disabled={isMarketingConsentPending}
              className="flex justify-center"
              onClick={() => {
                void agreeTerms()
              }}
            >
              {isMarketingConsentPending ? <SpinnerCircle /> : <span>동의하고 시작하기</span>}
            </ButtonBase>
            <button
              type="button"
              className="text-defaults-secondary-text-secondary"
              onClick={() => {
                void decline()
              }}
            >
              괜찮아요
            </button>
          </div>
        </div>
      </DrawerBase>

      {openTermsId !== null && (
        <MainShoppingTermsModalPage
          termsId={openTermsId}
          onClose={() => {
            setOpenTermsId(null)
          }}
        />
      )}
    </>
  )
}
