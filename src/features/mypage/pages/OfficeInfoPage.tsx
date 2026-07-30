import { env } from '@/config/env'
import { OfficeInfoBusinessHour } from '@/features/mypage/components/OfficeInfoBusinessHour'
import { OfficeInfoContactList } from '@/features/mypage/components/OfficeInfoContactList'
import { useAuthStore } from '@/shared/stores/authStore'

/**
 * 관리사무소 (P5). 레거시 `OfficeInfoView.vue` 이식.
 *
 * 단지 로고는 `aptInfo.aptLogoFileUrl`이 있으면 S3 URL을 붙여 쓰고, 없으면 기본 로고다.
 * **메인 화면 헤더와 같은 규칙이고 크기만 다르다**(24px vs 56px).
 *
 * ⚠️ 로고 크기·모양 클래스가 `img`에 직접 붙어 있다 —
 * `flex h-14 w-14 items-center justify-center`는 `img`에서 의미가 없지만
 * `h-14 w-14`·`rounded-[36px]`·`border`가 실제로 적용되므로 그대로 옮겼다.
 */
export const OfficeInfoPage = () => {
  const aptInfo = useAuthStore((state) => {
    return state.aptInfo
  })

  const logoClassName =
    'flex h-14 w-14 items-center justify-center rounded-[36px] border border-[#ebebeb] bg-base-b-white'

  return (
    <div className="h-full space-y-2 overflow-auto bg-defaults-secondary-background-secondary">
      <div className="flex w-full flex-col items-start gap-5 border-b border-b-neutral-b-gray-200 bg-base-b-white px-5 py-6">
        <div className="flex items-center gap-[10px]">
          <div>
            {aptInfo.aptLogoFileUrl ? (
              <img
                className={logoClassName}
                src={`${env.VITE_S3_BUCKET_URL_FILE}${aptInfo.aptLogoFileUrl}`}
                alt={`${aptInfo.aptName ?? ''} 로고`}
              />
            ) : (
              <img
                className={logoClassName}
                src="/assets/images/aptmantLogoShort.png"
                alt="아파트먼트 기본 로고"
              />
            )}
          </div>
          <div className="flex flex-col gap-2 pretendard-16Bold text-neutral-b-gray-900">
            {aptInfo.aptName}
          </div>
        </div>
      </div>
      <OfficeInfoContactList />
      <OfficeInfoBusinessHour />
    </div>
  )
}
