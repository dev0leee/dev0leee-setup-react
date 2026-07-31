import { useMutation } from '@tanstack/react-query'

import { putMarketingConsent } from '@/features/main/api/main'
import { showErrorModal } from '@/shared/lib/errorModal'
import { useAuthStore } from '@/shared/stores/authStore'

/**
 * 마케팅·광고성 수신 동의 저장. 레거시 `usePutMarketingConsent.js` 이식.
 *
 * ⚠️ **저장 후 `residentDetailInfo`를 무효화하지 않는다 — 레거시 그대로다.**
 * 그래서 동의를 마쳐도 캐시의 동의 플래그는 `null`로 남고, 쇼핑몰에서 돌아와 다시
 * 누르면 시트가 또 뜬다. 실제로는 저장 직후 쇼핑몰로 화면이 넘어가 잘 드러나지 않는다.
 * 고치면 시트 노출 시점이 달라지므로 이관에서는 손대지 않는다 (`deferred.md` D-221).
 */
export const useMarketingConsent = () => {
  const aptResidentUuid = useAuthStore((state) => {
    return state.aptInfo.aptResidentUuid
  })

  const { mutateAsync: marketingConsentMutateAsync, isPending: isMarketingConsentPending } =
    useMutation({
      mutationFn: ({
        marketingDataConsentFlag,
        receiveAdvertsConsentFlag,
      }: {
        marketingDataConsentFlag: boolean
        receiveAdvertsConsentFlag: boolean
      }) => {
        return putMarketingConsent({
          aptResidentUuid: aptResidentUuid ?? '',
          marketingDataConsentFlag,
          receiveAdvertsConsentFlag,
        })
      },
      onError: (error) => {
        showErrorModal({ text: error.message })
      },
    })

  return { marketingConsentMutateAsync, isMarketingConsentPending }
}
