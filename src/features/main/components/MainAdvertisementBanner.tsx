import { getMainEnv } from '@/config/env'
import { BANNER_ADVERTISING_IMAGE_PATH, BANNER_APT_UUID } from '@/features/main/constants/shopping'
import { useShoppingEntry } from '@/features/main/hooks/useShoppingEntry'
import { useAuthStore } from '@/shared/stores/authStore'

/**
 * 광고 배너. 레거시 `MainAdvertisementBanner.vue` 이식.
 *
 * **단지 UUID로 3분기**한다 — 에테르노 청담 전용 이미지, 샘물정보통신 광고(클릭 시 쇼핑몰),
 * 그 외 임시 이미지. `Ad` 배지는 **에테르노가 아닐 때만** 붙는다.
 *
 * ⚠️ 나머지 단지가 보는 것이 `/assets/mocks/BannerTemp.png`다 — `mocks` 폴더의
 * 임시 이미지가 프로덕션에 나가고 있다 (`main.md` M-Q4 · `deferred.md` D-40).
 */
export const MainAdvertisementBanner = ({
  onOpenShoppingTerms,
}: {
  onOpenShoppingTerms: () => void
}) => {
  const aptUuid = useAuthStore((state) => {
    return state.aptInfo.aptUuid
  })
  const { enterShopping } = useShoppingEntry({ onOpenTerms: onOpenShoppingTerms })

  const isEterno = aptUuid === BANNER_APT_UUID.ETERNO

  return (
    <div className="relative flex h-24 w-full overflow-hidden rounded-md bg-defaults-tertiary-background-tertiary">
      {!isEterno && (
        <span className="absolute top-0 left-0 flex h-5 w-6 items-center justify-center gap-[10px] rounded-br-md bg-defaults-tertiary-icon-tertiary p-1 text-right pretendard-10SemiBold text-defaults-secondary-text-secondary-inverse">
          Ad
        </span>
      )}

      {isEterno && (
        <img
          src="/assets/images/etc_banner.png"
          alt="청담 에테르노 배너 이미지"
          className="h-full w-full"
        />
      )}

      {aptUuid === BANNER_APT_UUID.SAMMUL && (
        <button
          type="button"
          className="h-full w-full"
          onClick={() => {
            void enterShopping()
          }}
        >
          <img
            src={`${getMainEnv().VITE_S3_BUCKET_URL_STATICS}${BANNER_ADVERTISING_IMAGE_PATH}`}
            alt="배너 광고 이미지"
            className="h-full w-full"
          />
        </button>
      )}

      {!isEterno && aptUuid !== BANNER_APT_UUID.SAMMUL && (
        // 클릭 핸들러가 없는 button이다 — 레거시가 그렇게 뒀다.
        <button type="button" className="h-full w-full">
          <img
            alt="배너 임시 이미지"
            className="h-full w-full"
            src="/assets/mocks/BannerTemp.png"
          />
        </button>
      )}
    </div>
  )
}
